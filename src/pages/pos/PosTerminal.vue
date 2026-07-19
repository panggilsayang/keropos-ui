<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BaseBadge,
  BaseInput,
  BaseModal,
  BaseSelect,
  BaseAvatar,
  BasePagination,
} from '@/components/ui'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Printer,
  Settings,
  Ticket,
  Pause,
  Clock,
} from '@lucide/vue'
import type { SelectOption } from '@/components/ui/BaseSelect.vue'
import { terminal, onSyncEvent } from '@/lib/terminal'
import type { Transaction, LineItem, PaymentMethod as ApiPaymentMethod, ModifierOption, PendingOrder, OpenTab } from '@/lib/terminal'
import ModifierPickerModal from '@/components/pos/ModifierPickerModal.vue'
import type { ModifierGroupWithOptions } from '@/components/pos/ModifierPickerModal.vue'
import IncomingOrdersModal from '@/components/pos/IncomingOrdersModal.vue'
import { listPairedPrinters, connectPrinter, disconnectPrinter, printReceipt, printTestReceipt, type PairedDevice } from '@/lib/printer'
import { receiptLines } from '@/lib/receipt'

const PRINTER_STORAGE_KEY = 'purdia_printer_address'

const router = useRouter()

// Display shape the template renders — sourced from the real
// products/categories/inventory fetched from the embedded terminal core
// (see refetch() below), not the hardcoded demo array this page used to
// carry. `id` is a UUID string (matches pos-core's Uuid), not a number.
interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  // Set only for the synthetic fallback built from a QR order's own
  // embedded name/price, when the ordered product no longer exists in the
  // catalog (deleted since the order was placed) — surfaced as a warning
  // in the cart rather than silently treated like a normal line item.
  stale?: boolean
}

interface CartItem {
  product: Product
  qty: number
  selectedModifiers: ModifierOption[]
  discount: number
  discountType: 'nominal' | 'percent'
}

const productsRaw = ref<Awaited<ReturnType<typeof terminal.listProducts>>>([])
const categoriesRaw = ref<Awaited<ReturnType<typeof terminal.listCategories>>>([])
const inventoryRaw = ref<Awaited<ReturnType<typeof terminal.listInventory>>>([])

const catNameById = computed(() => new Map(categoriesRaw.value.map((c) => [c.id, c.name])))
const stockByProductId = computed(() => new Map(inventoryRaw.value.map((i) => [i.product_id, i.qty])))

const products = computed<Product[]>(() =>
  productsRaw.value
    .filter((p) => p.is_available && !p.is_archived)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: (p.category_id && catNameById.value.get(p.category_id)) || 'Uncategorized',
      stock: stockByProductId.value.get(p.id) ?? 0,
    })),
)

const categories = computed(() => [
  'All',
  ...categoriesRaw.value
    .filter((c) => !c.is_archived)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => c.name),
])

// group_id -> { group, options }. Fetched once up front — the demo catalog
// is tiny, and modifier groups/options change far less often than
// products/inventory. Per-product links are fetched lazily on tap instead
// (see openAddToCart) rather than upfront for every product.
const modifierGroupsById = ref<Map<string, ModifierGroupWithOptions>>(new Map())

async function refetch() {
  const [p, c, inv, groups] = await Promise.all([
    terminal.listProducts(),
    terminal.listCategories(),
    terminal.listInventory(),
    terminal.listModifierGroups(),
  ])
  productsRaw.value = p
  categoriesRaw.value = c
  inventoryRaw.value = inv

  const options = await Promise.all(groups.map((g) => terminal.listModifierOptions(g.id)))
  modifierGroupsById.value = new Map(
    groups.map((group, i) => [group.id, { group, options: options[i] ?? [] }]),
  )
}

// Orders placed via a table's QR menu (handled entirely by pos-api/pos-web
// — this just pulls/acks/finalizes against the terminal's own OrderService).
// Polled on a timer since there's no push channel for this today (the
// forwarded sync events are gossip/inventory only, see onSyncEvent below).
const pendingOrders = ref<PendingOrder[]>([])
const showIncomingOrders = ref(false)
const activeOrderId = ref<string | null>(null)
let ordersPollHandle: ReturnType<typeof setInterval> | null = null

async function pollPendingOrders() {
  try {
    pendingOrders.value = await terminal.listPendingOrders()
  } catch {
    // Best-effort background poll — a misconfigured/unreachable server_url
    // (see PosTerminalSettings.vue) just means an empty list, not a crash.
  }
}

// Open tabs ("pay at the end", see crates/pos-terminal/src/service/tab.rs) —
// polled alongside pendingOrders since both show up in the same unified
// "things waiting to be handled" list (IncomingOrdersModal).
const openTabs = ref<OpenTab[]>([])
const activeTabId = ref<string | null>(null)
const activeTabSourceOrderId = ref<string | null>(null)
const tabNameInput = ref('')
const openingTab = ref(false)
const tabError = ref('')

async function pollOpenTabs() {
  try {
    openTabs.value = await terminal.listOpenTabs()
  } catch {
    // best-effort, same as pollPendingOrders
  }
}

// A QR order stays "acknowledged" (not paid) server-side for as long as its
// tab is open — so it would otherwise keep showing up as its own row too,
// letting the cashier accidentally park the same order as a second, separate
// tab. Once an order has a matching open tab (by source_order_id), it's
// already represented there — hide the original order row.
const visiblePendingOrders = computed(() => {
  const parkedOrderIds = new Set(
    openTabs.value.map((t) => t.source_order_id).filter((id): id is string => id !== null),
  )
  return pendingOrders.value.filter((o) => !parkedOrderIds.has(o.id))
})

let unlistenSync: (() => void) | null = null
onMounted(async () => {
  await refetch()
  loadPairedPrinters()
  loadTables()
  pollPendingOrders()
  pollOpenTabs()
  ordersPollHandle = setInterval(() => {
    pollPendingOrders()
    pollOpenTabs()
  }, 5000)
  // Any peer sync event triggers a full refetch rather than replaying the
  // delta client-side — simpler, and avoids re-implementing
  // SyncService::apply_gossip's logic in TypeScript. Only gossip
  // (inventory) events are forwarded today, not durable catalog changes.
  unlistenSync = await onSyncEvent(() => {
    refetch()
  })
})
onUnmounted(() => {
  unlistenSync?.()
  if (ordersPollHandle) clearInterval(ordersPollHandle)
})

// Tapping a pending order in IncomingOrdersModal: ack it (best-effort, just
// marks it as being handled — doesn't block loading the cart on failure),
// then replace the current cart with the order's items so the cashier can
// adjust/add modifiers/pick payment exactly like a walk-in sale.
async function selectPendingOrder(order: PendingOrder) {
  showIncomingOrders.value = false
  try {
    await terminal.ackPendingOrder(order.id)
  } catch {
    // best-effort, see above
  }
  const byId = new Map(products.value.map((p) => [p.id, p]))
  cart.value = order.items.map((item) => {
    const product = byId.get(item.product_id) ?? {
      id: item.product_id,
      name: item.name,
      price: item.price,
      category: 'Uncategorized',
      stock: 0,
      stale: true,
    }
    return { product, qty: item.qty, selectedModifiers: [], discount: 0, discountType: 'percent' as const }
  })
  activeOrderId.value = order.id
  // The order came from a real table's QR code — reflect that on the
  // dine-in table select too, instead of leaving it on "Takeaway".
  selectedTableId.value = order.table_id
  pendingOrders.value = pendingOrders.value.filter((o) => o.id !== order.id)
}

// Tapping an open tab in the unified modal: load its items back into the
// cart (no ack needed — that's QR-specific and already happened when the
// order was first parked, see saveTab below) and remember which tab this
// is so paying calls settleTab instead of a fresh checkout.
function selectOpenTab(tab: OpenTab) {
  showIncomingOrders.value = false
  const byId = new Map(products.value.map((p) => [p.id, p]))
  cart.value = tab.items.map((item) => {
    const product = byId.get(item.product_id) ?? {
      id: item.product_id,
      name: item.name,
      price: item.price,
      category: 'Uncategorized',
      stock: 0,
      stale: true,
    }
    return { product, qty: item.qty, selectedModifiers: [], discount: 0, discountType: 'percent' as const }
  })
  activeTabId.value = tab.id
  activeTabSourceOrderId.value = tab.source_order_id
  selectedTableId.value = tab.table_id ?? TAKEAWAY
  tabNameInput.value = tab.customer_label ?? ''
  openTabs.value = openTabs.value.filter((t) => t.id !== tab.id)
}

async function cancelOpenTab(tabId: string) {
  try {
    await terminal.cancelTab(tabId)
  } catch (e) {
    tabError.value = e instanceof Error ? e.message : String(e)
    return
  }
  openTabs.value = openTabs.value.filter((t) => t.id !== tabId)
  if (activeTabId.value === tabId) {
    activeTabId.value = null
    activeTabSourceOrderId.value = null
    cart.value = []
  }
}

const activeCategory = ref('All')
const searchQuery = ref('')
const cart = ref<CartItem[]>([])

// Favorites
const favorites = ref<Set<string>>(new Set())

function toggleFavorite(productId: string) {
  if (favorites.value.has(productId)) {
    favorites.value.delete(productId)
  } else {
    favorites.value.add(productId)
  }
}

function isFavorite(productId: string) {
  return favorites.value.has(productId)
}

const favoriteProducts = computed(() => products.value.filter((p) => favorites.value.has(p.id)))

// Pagination
const currentPage = ref(1)
const perPage = 8

const filteredProducts = computed(() => {
  let list = products.value
  if (activeCategory.value !== 'All') {
    list = list.filter((p) => p.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  return list
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / perPage))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredProducts.value.slice(start, start + perPage)
})

// Reset page when filter changes
function setCategory(cat: string) {
  activeCategory.value = cat
  currentPage.value = 1
}

// Dine-in / takeaway — same concept as pos-web's "Table (dine-in)" picker
// (apps/pos-web/src/pages/pos/PosPage.tsx): the real tables list (also used
// by QR ordering), with the sentinel `TAKEAWAY` value meaning no table.
// Cosmetic only — like pos-web, the choice is never sent in the
// `Transaction` payload (pos_core::Transaction has no table field), just
// printed on the receipt.
const TAKEAWAY = 'takeaway'
const tables = ref<Awaited<ReturnType<typeof terminal.listTables>>>([])
const selectedTableId = ref(TAKEAWAY)

const tableSelectOptions = computed<SelectOption[]>(() => [
  { label: 'Takeaway (no table)', value: TAKEAWAY },
  ...tables.value.map((t) => ({ label: t.label, value: t.id })),
])

const selectedTableLabel = computed(
  () => tables.value.find((t) => t.id === selectedTableId.value)?.label ?? null,
)

async function loadTables() {
  try {
    tables.value = await terminal.listTables()
  } catch {
    // Best-effort, same as pollPendingOrders — an unreachable server_url
    // just means the picker only offers "Takeaway", not a crash.
  }
}

// Voucher / Promo Code
interface Voucher {
  code: string
  description: string
  discountType: 'percent' | 'nominal'
  discountValue: number
  minPurchase: number
  maxDiscount?: number // max potongan untuk type percent
}

const availableVouchers: Voucher[] = [
  { code: 'HEMAT10', description: 'Diskon 10%', discountType: 'percent', discountValue: 10, minPurchase: 50000, maxDiscount: 20000 },
  { code: 'MAKAN20K', description: 'Potongan Rp 20.000', discountType: 'nominal', discountValue: 20000, minPurchase: 80000 },
  { code: 'NEWUSER', description: 'Diskon 15% New User', discountType: 'percent', discountValue: 15, minPurchase: 30000, maxDiscount: 25000 },
  { code: 'JUMAT50', description: 'Potongan Rp 50.000', discountType: 'nominal', discountValue: 50000, minPurchase: 150000 },
  { code: 'KOPI5K', description: 'Potongan Rp 5.000', discountType: 'nominal', discountValue: 5000, minPurchase: 20000 },
]

const voucherCode = ref('')
const appliedVoucher = ref<Voucher | null>(null)
const voucherError = ref('')
const globalDiscount = ref(0)
const globalDiscountType = ref<'nominal' | 'percent'>('percent')
const customerType = ref<string | number>('walkin')
const customerName = ref('')
const memberSearch = ref<string | number>('')

function applyVoucher() {
  voucherError.value = ''

  if (!voucherCode.value.trim()) {
    voucherError.value = 'Masukkan kode voucher'
    return
  }

  const code = voucherCode.value.trim().toUpperCase()
  const voucher = availableVouchers.find((v) => v.code === code)

  if (!voucher) {
    voucherError.value = 'Kode voucher tidak ditemukan'
    return
  }

  if (subtotal.value < voucher.minPurchase) {
    voucherError.value = `Minimum belanja ${formatRp(voucher.minPurchase)}`
    return
  }

  appliedVoucher.value = voucher
  voucherCode.value = ''
}

function removeVoucher() {
  appliedVoucher.value = null
  voucherError.value = ''
}

const voucherDiscountAmount = computed(() => {
  if (!appliedVoucher.value) return 0
  const afterGlobalDiscount = subtotal.value - globalDiscountAmount.value
  if (appliedVoucher.value.discountType === 'percent') {
    const raw = (afterGlobalDiscount * appliedVoucher.value.discountValue) / 100
    return appliedVoucher.value.maxDiscount ? Math.min(raw, appliedVoucher.value.maxDiscount) : raw
  }
  return Math.min(appliedVoucher.value.discountValue, afterGlobalDiscount)
})

// Payment
const showPayment = ref(false)
const paymentMethod = ref<string | number>('cash')
const cashReceived = ref<number>(0)
const cardNumber = ref('')
const cardIssuer = ref<string | number>('')
const ewalletIssuer = ref<string | number>('')
const ewalletPhone = ref('')
const checkingOut = ref(false)
const checkoutError = ref('')

// Receipt printer (classic Bluetooth SPP — see src/lib/printer.ts). Printing
// is best-effort: the sale is already persisted by the time we print, so a
// print failure is surfaced but never blocks or undoes the checkout.
const pairedPrinters = ref<PairedDevice[]>([])
const selectedPrinterAddress = ref(localStorage.getItem(PRINTER_STORAGE_KEY) ?? '')
const showPrinterPicker = ref(false)
const printerBusy = ref(false)
const printStatus = ref('')
// The most recently completed sale — kept around (independent of the cart,
// which clears on checkout) so the cashier can print an extra copy for the
// buyer on request, at any point after the fact, not just immediately.
const lastTransaction = ref<Transaction | null>(null)
const lastTransactionTableLabel = ref<string | null>(null)
const printingCopy = ref(false)

async function loadPairedPrinters() {
  try {
    pairedPrinters.value = await listPairedPrinters()
  } catch (e) {
    printStatus.value = e instanceof Error ? e.message : String(e)
  }
}

function selectPrinter(address: string) {
  selectedPrinterAddress.value = address
  localStorage.setItem(PRINTER_STORAGE_KEY, address)
}

async function testPrint() {
  if (!selectedPrinterAddress.value) return
  printerBusy.value = true
  printStatus.value = ''
  try {
    await connectPrinter(selectedPrinterAddress.value)
    await printTestReceipt(selectedPrinterAddress.value)
    await disconnectPrinter(selectedPrinterAddress.value)
  } catch (e) {
    printStatus.value = e instanceof Error ? e.message : String(e)
  } finally {
    printerBusy.value = false
  }
}

async function printLastReceipt(tx: Transaction, label?: string, tableLabel?: string | null) {
  if (!selectedPrinterAddress.value) return
  try {
    await connectPrinter(selectedPrinterAddress.value)
    await printReceipt(selectedPrinterAddress.value, receiptLines(tx, label, tableLabel))
    await disconnectPrinter(selectedPrinterAddress.value)
  } catch (e) {
    printStatus.value = 'Print failed: ' + (e instanceof Error ? e.message : String(e))
  }
}

// On-demand extra copy for the buyer — some customers ask for their own
// receipt in addition to the store/checker copy that already printed
// automatically at checkout. Reprints the same transaction, labeled so it's
// clear which copy is which. This can be tapped repeatedly (no hard cap), so
// it's confirmed each time rather than firing immediately — a native
// `confirm()` isn't reliable inside an Android WebView, hence a BaseModal.
const showReprintConfirm = ref(false)

async function printCustomerCopy() {
  if (!lastTransaction.value || !selectedPrinterAddress.value || printingCopy.value) return
  showReprintConfirm.value = false
  printingCopy.value = true
  try {
    await printLastReceipt(lastTransaction.value, 'CUSTOMER COPY', lastTransactionTableLabel.value)
  } finally {
    printingCopy.value = false
  }
}

const paymentOptions: SelectOption[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Debit Card', value: 'debit' },
  { label: 'Credit Card', value: 'credit' },
  { label: 'E-Wallet (QRIS)', value: 'ewallet' },
  { label: 'Bank Transfer', value: 'transfer' },
]

const cardIssuerOptions: SelectOption[] = [
  { label: 'BCA', value: 'bca' },
  { label: 'BRI', value: 'bri' },
  { label: 'BNI', value: 'bni' },
  { label: 'Mandiri', value: 'mandiri' },
  { label: 'CIMB Niaga', value: 'cimb' },
  { label: 'Visa', value: 'visa' },
  { label: 'Mastercard', value: 'mastercard' },
  { label: 'JCB', value: 'jcb' },
]

const ewalletIssuerOptions: SelectOption[] = [
  { label: 'GoPay', value: 'gopay' },
  { label: 'OVO', value: 'ovo' },
  { label: 'DANA', value: 'dana' },
  { label: 'ShopeePay', value: 'shopeepay' },
  { label: 'LinkAja', value: 'linkaja' },
  { label: 'QRIS', value: 'qris' },
]

function addToCart(product: Product, selectedModifiers: ModifierOption[] = []) {
  const modifierKey = (mods: ModifierOption[]) =>
    mods
      .map((m) => m.id)
      .sort()
      .join(',')
  const existing = cart.value.find(
    (c) => c.product.id === product.id && modifierKey(c.selectedModifiers) === modifierKey(selectedModifiers),
  )
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ product, qty: 1, selectedModifiers, discount: 0, discountType: 'percent' })
  }
}

// Modifier picker state — tapping a product with linked modifier groups
// opens the picker instead of adding directly; products with none (e.g.
// Croissant, Nasi Goreng in the demo catalog) skip straight to addToCart.
const showModifierPicker = ref(false)
const modifierPickerProduct = ref<Product | null>(null)
const modifierPickerGroups = ref<ModifierGroupWithOptions[]>([])

async function openAddToCart(product: Product) {
  const links = await terminal.getProductModifierGroups(product.id)
  if (links.length === 0) {
    addToCart(product)
    return
  }
  modifierPickerGroups.value = links
    .slice()
    .sort(([, a], [, b]) => a - b)
    .map(([groupId]) => modifierGroupsById.value.get(groupId))
    .filter((g): g is ModifierGroupWithOptions => g !== undefined)
  modifierPickerProduct.value = product
  showModifierPicker.value = true
}

function onModifierConfirm(selected: ModifierOption[]) {
  if (modifierPickerProduct.value) {
    addToCart(modifierPickerProduct.value, selected)
  }
}


function updateQty(idx: number, delta: number) {
  const item = cart.value[idx]
  if (!item) return
  item.qty += delta
  if (item.qty <= 0) cart.value.splice(idx, 1)
}

function removeItem(idx: number) {
  cart.value.splice(idx, 1)
}

function modifierDelta(item: CartItem) {
  return item.selectedModifiers.reduce((sum, o) => sum + o.price_delta, 0)
}

function getItemTotal(item: CartItem) {
  const base = (item.product.price + modifierDelta(item)) * item.qty
  if (item.discount <= 0) return base
  if (item.discountType === 'percent') return base - (base * item.discount) / 100
  return base - item.discount
}

const subtotal = computed(() => cart.value.reduce((sum, item) => sum + getItemTotal(item), 0))

const globalDiscountAmount = computed(() => {
  if (globalDiscount.value <= 0) return 0
  if (globalDiscountType.value === 'percent') return (subtotal.value * globalDiscount.value) / 100
  return globalDiscount.value
})

const grandTotal = computed(() => Math.max(0, subtotal.value - globalDiscountAmount.value - voucherDiscountAmount.value))
const change = computed(() => Math.max(0, cashReceived.value - grandTotal.value))

function openPayment() {
  if (cart.value.length === 0) return
  cashReceived.value = grandTotal.value
  showPayment.value = true
}

// Open a new tab, or persist a new round/edit onto the tab currently loaded
// into the cart — see TabService::open_or_update. Stock is deducted here
// (per product added, not deferred to settle), so this can fail (e.g. an
// item's inventory row is gone) — surfaced via tabError, cart left as-is
// so the cashier can retry rather than losing what they typed.
async function saveTab() {
  if (cart.value.length === 0 || openingTab.value) return
  openingTab.value = true
  tabError.value = ''
  try {
    await terminal.openOrUpdateTab({
      tabId: activeTabId.value,
      tableId: selectedTableId.value === TAKEAWAY ? null : selectedTableId.value,
      tableLabel: selectedTableLabel.value,
      customerLabel: tabNameInput.value.trim() || null,
      items: buildLineItems(),
      sourceOrderId: activeTabId.value ? activeTabSourceOrderId.value : activeOrderId.value,
    })
    cart.value = []
    selectedTableId.value = TAKEAWAY
    tabNameInput.value = ''
    activeOrderId.value = null
    activeTabId.value = null
    activeTabSourceOrderId.value = null
    await pollOpenTabs()
  } catch (e) {
    tabError.value = e instanceof Error ? e.message : String(e)
  } finally {
    openingTab.value = false
  }
}

// `pos_core::PaymentMethod` doesn't have a 1:1 match with this UI's payment
// options — debit/credit both collapse to `card`, e-wallet maps to
// `qris_dynamic` (QRIS is the dominant Indonesian e-wallet rail), bank
// transfer maps to `bank_manual`. A known simplification, not a precise
// mapping — flagged rather than silently assumed correct.
function toApiPaymentMethod(method: string | number): ApiPaymentMethod {
  switch (method) {
    case 'debit':
    case 'credit':
      return 'card'
    case 'ewallet':
      return 'qris_dynamic'
    case 'transfer':
      return 'bank_manual'
    default:
      return 'cash'
  }
}

function buildLineItems(): LineItem[] {
  return cart.value.map((item) => {
    const modifierSuffix = item.selectedModifiers.length
      ? ` (${item.selectedModifiers.map((m) => m.name).join(', ')})`
      : ''
    return {
      product_id: item.product.id,
      name: item.product.name + modifierSuffix,
      price: item.product.price + modifierDelta(item),
      qty: item.qty,
    }
  })
}

async function completeTransaction() {
  if (checkingOut.value) return
  checkingOut.value = true
  checkoutError.value = ''
  try {
    // If this cart is an open tab, its source order (if any) is carried on
    // the tab itself — otherwise it's whatever unhandled QR order was
    // loaded directly (the existing walk-in-pay-now path, unchanged).
    const sourceOrderId = activeTabId.value ? activeTabSourceOrderId.value : activeOrderId.value
    const tx: Transaction = {
      id: crypto.randomUUID(),
      items: buildLineItems(),
      total: grandTotal.value,
      payment_method: toApiPaymentMethod(paymentMethod.value),
      payment_status: 'paid',
      order_id: sourceOrderId,
      paid_ms: Date.now(),
      synced: false,
    }
    if (activeTabId.value) {
      // Stock was already deducted incrementally as the tab's items were
      // added (TabService) — settleTab must not deduct it again, and it
      // finalizes the source QR order (if any) server-side itself.
      await terminal.settleTab(activeTabId.value, tx, sourceOrderId)
    } else {
      await terminal.checkout(tx)
    }
    // Refetch immediately so the cashier's own screen reflects the new
    // stock right away — don't wait on the sync-event round trip, that's
    // for picking up *other* terminals' sales.
    await refetch()
    lastTransaction.value = tx
    lastTransactionTableLabel.value = selectedTableLabel.value
    await printLastReceipt(tx, 'STORE COPY', selectedTableLabel.value)
    // Best-effort: the local sale is already committed by this point, so a
    // failure here is surfaced but never undoes/blocks the checkout — same
    // philosophy as receipt printing above. Only needed for the plain
    // walk-in-pay-now path; settleTab already finalized the order itself.
    if (!activeTabId.value && activeOrderId.value) {
      try {
        await terminal.finalizePendingOrder(activeOrderId.value, tx.id)
      } catch (e) {
        checkoutError.value = 'Order finalize failed: ' + (e instanceof Error ? e.message : String(e))
      }
    }
    cart.value = []
    selectedTableId.value = TAKEAWAY
    tabNameInput.value = ''
    activeOrderId.value = null
    activeTabId.value = null
    activeTabSourceOrderId.value = null
    globalDiscount.value = 0
    appliedVoucher.value = null
    voucherCode.value = ''
    voucherError.value = ''
    customerType.value = 'walkin'
    customerName.value = ''
    memberSearch.value = ''
    cardNumber.value = ''
    cardIssuer.value = ''
    ewalletIssuer.value = ''
    ewalletPhone.value = ''
    showPayment.value = false
  } catch (e) {
    checkoutError.value = e instanceof Error ? e.message : String(e)
  } finally {
    checkingOut.value = false
  }
}


function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

// Numpad
const cashInput = ref<HTMLInputElement | null>(null)
const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'backspace'] as const

// Active numpad field — determines which input the numpad binds to
type NumpadField = 'cash' | 'card' | 'phone'
const activeNumpadField = ref<NumpadField>('cash')

// Auto-set active field based on payment method
watch(() => paymentMethod.value, (method) => {
  if (method === 'cash') activeNumpadField.value = 'cash'
  else if (method === 'debit' || method === 'credit') activeNumpadField.value = 'card'
  else if (method === 'ewallet') activeNumpadField.value = 'phone'
}, { immediate: true })

const quickAmounts = computed(() => {
  const total = grandTotal.value
  const amounts = new Set<number>()
  const roundUp = (n: number, step: number) => Math.ceil(n / step) * step
  amounts.add(total)
  amounts.add(roundUp(total, 10000))
  amounts.add(roundUp(total, 50000))
  amounts.add(roundUp(total, 100000))
  return [...amounts].filter((a) => a >= total).sort((a, b) => a - b).slice(0, 4)
})

function handleNumpad(key: string) {
  if (activeNumpadField.value === 'cash') {
    const current = String(cashReceived.value || '')
    if (key === 'backspace') {
      const next = current.slice(0, -1)
      cashReceived.value = Number(next) || 0
    } else {
      cashReceived.value = Number(current + key) || 0
    }
  } else if (activeNumpadField.value === 'card') {
    if (key === 'backspace') {
      cardNumber.value = cardNumber.value.slice(0, -1)
    } else {
      // Auto-format card number with spaces every 4 digits
      const raw = cardNumber.value.replace(/\s/g, '')
      if (raw.length < 16) {
        const newRaw = raw + key
        cardNumber.value = newRaw.replace(/(\d{4})(?=\d)/g, '$1 ')
      }
    }
  } else if (activeNumpadField.value === 'phone') {
    if (key === 'backspace') {
      ewalletPhone.value = ewalletPhone.value.slice(0, -1)
    } else {
      if (ewalletPhone.value.length < 15) {
        ewalletPhone.value += key
      }
    }
  }
}

function getNumpadKeyClass(key: string) {
  if (key === 'backspace') {
    return 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
  }
  return 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'
}

const numpadLabel = computed(() => {
  if (activeNumpadField.value === 'cash') return 'Cash Amount'
  if (activeNumpadField.value === 'card') return 'Card Number'
  return 'Phone Number'
})
</script>

<template>
  <div class="flex h-full min-h-0 gap-2">
    <!-- Left: Products -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Search + Categories -->
      <div class="shrink-0 space-y-2 mb-2">
        <div
          class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 dark:bg-gray-800 dark:border-gray-700"
        >
          <Search class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search product..."
            class="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400 dark:text-gray-200 dark:placeholder:text-gray-500"
            @input="currentPage = 1"
          />
        </div>
        <div class="flex gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            class="px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer"
            :class="
              activeCategory === cat
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            "
            @click="setCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Favorites Row -->
      <div v-if="favoriteProducts.length > 0" class="shrink-0 mb-3">
        <div class="flex items-center gap-2 mb-2">
          <Star class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Favorites</span>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="product in favoriteProducts"
            :key="'fav-' + product.id"
            class="shrink-0 w-28 bg-amber-50 border border-amber-200 rounded-lg p-2 text-left hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer dark:bg-amber-900/10 dark:border-amber-800 dark:hover:border-amber-500"
            @click="openAddToCart(product)"
          >
            <p class="text-[0.6875rem] font-medium text-gray-800 truncate dark:text-gray-200">
              {{ product.name }}
            </p>
            <p class="text-[0.625rem] font-bold text-primary-600 mt-0.5 dark:text-primary-400">
              {{ formatRp(product.price) }}
            </p>
          </button>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <div
            v-for="product in paginatedProducts"
            :key="product.id"
            class="relative bg-white border border-gray-200 rounded-lg p-2 text-left hover:border-primary-300 hover:shadow-sm transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-500"
          >
            <!-- Favorite toggle -->
            <button
              class="absolute top-1 right-1 p-0.5 cursor-pointer z-10"
              @click.stop="toggleFavorite(product.id)"
              :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
            >
              <Star
                class="w-3.5 h-3.5 transition-colors"
                :class="
                  isFavorite(product.id)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-gray-300 hover:text-amber-400 dark:text-gray-600 dark:hover:text-amber-400'
                "
              />
            </button>
            <!-- Clickable area -->
            <button class="w-full text-left cursor-pointer" @click="openAddToCart(product)">
              <div
                class="w-full h-9 bg-gray-100 rounded-md flex items-center justify-center text-lg mb-1 dark:bg-gray-700"
              >
                {{
                  product.category === 'Beverages' || product.category === 'Drinks'
                    ? '☕'
                    : product.category === 'Food'
                      ? '🍽️'
                      : '🍟'
                }}
              </div>
              <p class="text-sm font-medium text-gray-800 truncate dark:text-gray-200">
                {{ product.name }}
              </p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-sm font-bold text-primary-600 dark:text-primary-400">{{
                  formatRp(product.price)
                }}</span>
                <span class="text-[0.625rem] text-gray-400 dark:text-gray-500"
                  >stk: {{ product.stock }}</span
                >
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="shrink-0 pt-3">
        <BasePagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredProducts.length"
          :per-page="perPage"
          variant="minimal"
          size="sm"
        />
      </div>
    </div>

    <!-- Right: Cart -->
    <div
      class="w-72 shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col min-h-0 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
    >
      <!-- Cart Header -->
      <div class="px-4 py-3 border-b border-gray-100 shrink-0 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Current Order</h3>
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              :class="selectedPrinterAddress ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'"
              :aria-label="'Printer'"
              @click="showPrinterPicker = true"
            >
              <Printer class="w-4 h-4" />
            </button>
            <button
              class="relative flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 cursor-pointer transition-colors dark:text-gray-400 dark:hover:text-primary-400"
              aria-label="Incoming orders"
              @click="showIncomingOrders = true"
            >
              <Clock class="w-3.5 h-3.5" />
              <span>Held Orders</span>
              <span
                v-if="visiblePendingOrders.length + openTabs.length > 0"
                class="absolute -top-1.5 -right-2.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[0.5625rem] leading-3.5 text-center"
              >
                {{ visiblePendingOrders.length + openTabs.length }}
              </span>
            </button>
            <button
              class="cursor-pointer text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
              aria-label="Terminal settings"
              @click="router.push({ name: 'pos-terminal-settings' })"
            >
              <Settings class="w-4 h-4" />
            </button>
            <span class="text-xs text-gray-400 dark:text-gray-500">Cashier: Angga</span>
          </div>
        </div>
        <!-- Dine-in table / takeaway -->
        <BaseSelect
          v-model="selectedTableId"
          :options="tableSelectOptions"
          :searchable="false"
          :clearable="false"
          size="sm"
          placeholder="Table (dine-in)"
        />
        <input
          v-model="tabNameInput"
          type="text"
          placeholder="Tab name (optional)"
          class="mt-2 w-full text-sm px-2 py-1 border border-gray-300 rounded-md outline-none focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto px-4 py-2">
        <div
          v-if="cart.length === 0"
          class="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600"
        >
          <Tag class="w-12 h-12 mb-2" />
          <p class="text-sm">Cart is empty</p>
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="(item, idx) in cart"
            :key="item.product.id"
            class="py-2 border-b border-gray-50 dark:border-gray-700"
          >
            <div class="flex items-start gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate dark:text-gray-200">
                  {{ item.product.name }}
                </p>
                <p v-if="item.product.stale" class="text-[0.625rem] text-red-500 dark:text-red-400">
                  ⚠ Deleted from catalog — using order's saved name/price
                </p>
                <p
                  v-if="item.selectedModifiers.length"
                  class="text-[0.6875rem] text-gray-400 dark:text-gray-500 truncate"
                >
                  {{ item.selectedModifiers.map((m) => m.name).join(', ') }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatRp(item.product.price + modifierDelta(item)) }} x {{ item.qty }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  @click="updateQty(idx, -1)"
                >
                  <Minus class="w-3 h-3" />
                </button>
                <span class="w-6 text-center text-sm font-medium dark:text-gray-200">{{
                  item.qty
                }}</span>
                <button
                  class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  @click="updateQty(idx, 1)"
                >
                  <Plus class="w-3 h-3" />
                </button>
              </div>
              <div class="text-right shrink-0 w-20">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {{ formatRp(getItemTotal(item)) }}
                </p>
                <button
                  class="text-gray-300 hover:text-red-500 cursor-pointer dark:text-gray-600 dark:hover:text-red-400"
                  @click="removeItem(idx)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Footer -->
      <div class="shrink-0 border-t border-gray-100 px-4 py-3 space-y-2 dark:border-gray-700">
        <div v-if="false" class="space-y-2">
        <div class="flex items-center gap-2">
          <Tag class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            v-model.number="globalDiscount"
            type="number"
            min="0"
            class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary-500 w-20 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            placeholder="Discount"
          />
          <select
            v-model="globalDiscountType"
            class="text-xs border border-gray-200 rounded px-2 py-1 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="percent">%</option>
            <option value="nominal">Rp</option>
          </select>
        </div>
        <!-- Voucher Code -->
        <div v-if="!appliedVoucher" class="flex items-center gap-2">
          <Ticket class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            v-model="voucherCode"
            type="text"
            class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary-500 uppercase placeholder:normal-case dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            placeholder="Kode voucher"
            @keyup.enter="applyVoucher"
          />
          <button
            class="text-xs font-medium px-2.5 py-1 rounded bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer"
            @click="applyVoucher"
          >
            Apply
          </button>
        </div>
        <p v-if="voucherError" class="text-[0.625rem] text-red-500 dark:text-red-400 pl-6">{{ voucherError }}</p>
        <!-- Applied voucher -->
        <div v-if="appliedVoucher" class="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 rounded-md dark:bg-emerald-900/20">
          <Ticket class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">{{ appliedVoucher?.code }}</p>
            <p class="text-[0.625rem] text-emerald-600 dark:text-emerald-400">{{ appliedVoucher?.description }}</p>
          </div>
          <button
            class="text-gray-400 hover:text-red-500 cursor-pointer dark:text-gray-500 dark:hover:text-red-400"
            @click="removeVoucher"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        </div>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{{ formatRp(subtotal) }}</span>
          </div>
          <div
            v-if="globalDiscountAmount > 0"
            class="flex justify-between text-amber-600 dark:text-amber-400"
          >
            <span>Discount</span>
            <span>-{{ formatRp(globalDiscountAmount) }}</span>
          </div>
          <div
            v-if="voucherDiscountAmount > 0"
            class="flex justify-between text-emerald-600 dark:text-emerald-400"
          >
            <span>Voucher ({{ appliedVoucher?.code }})</span>
            <span>-{{ formatRp(voucherDiscountAmount) }}</span>
          </div>
          <div
            class="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-100 dark:text-gray-100 dark:border-gray-700"
          >
            <span>Total</span>
            <span>{{ formatRp(grandTotal) }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <BaseButton
            variant="outline"
            class="flex-1"
            :disabled="cart.length === 0 || openingTab"
            @click="saveTab"
          >
            <Pause class="w-4 h-4" /> {{ openingTab ? 'Saving...' : activeTabId ? 'Update' : 'Hold' }}
          </BaseButton>
          <BaseButton class="flex-[2]" :disabled="cart.length === 0" @click="openPayment">
            <CreditCard class="w-4 h-4" /> Pay {{ formatRp(grandTotal) }}
          </BaseButton>
        </div>
        <p v-if="tabError" class="text-xs text-red-600 dark:text-red-400">{{ tabError }}</p>
        <button
          v-if="lastTransaction"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:text-gray-400"
          :disabled="!selectedPrinterAddress || printingCopy"
          @click="showReprintConfirm = true"
        >
          <Printer class="w-3.5 h-3.5" />
          {{ printingCopy ? 'Printing...' : 'Print Copy for Customer' }}
        </button>
      </div>
    </div>

    <!-- Payment Modal -->
    <BaseModal v-model="showPayment" title="Payment" size="lg">
      <div class="flex gap-6">
        <!-- Left: Payment Form -->
        <div class="flex-1 space-y-4 min-w-0">
          <div class="text-center py-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ formatRp(grandTotal) }}
            </p>
          </div>
          <BaseSelect
            v-model="paymentMethod"
            label="Payment Method"
            :options="paymentOptions"
            :searchable="false"
          />
          <div v-if="paymentMethod === 'cash'">
            <label class="text-sm font-medium text-gray-700 block mb-1 dark:text-gray-300"
              >Cash Received</label
            >
            <input
              ref="cashInput"
              v-model.number="cashReceived"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-primary-900/30"
              @focus="activeNumpadField = 'cash'"
            />
            <div
              v-if="change > 0"
              class="mt-2 p-2 bg-emerald-50 rounded-md text-center dark:bg-emerald-900/20"
            >
              <p class="text-xs text-emerald-600 dark:text-emerald-400">Change</p>
              <p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {{ formatRp(change) }}
              </p>
            </div>
          </div>
          <div v-if="paymentMethod === 'debit' || paymentMethod === 'credit'" class="space-y-3">
            <BaseSelect
              v-model="cardIssuer"
              label="Card Issuer"
              :options="cardIssuerOptions"
              placeholder="Select bank / issuer..."
            />
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1 dark:text-gray-300"
                >Card Number</label
              >
              <input
                v-model="cardNumber"
                type="text"
                placeholder="**** **** **** ****"
                maxlength="19"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-primary-900/30"
                @focus="activeNumpadField = 'card'"
              />
            </div>
          </div>
          <div v-if="paymentMethod === 'ewallet'" class="space-y-3">
            <BaseSelect
              v-model="ewalletIssuer"
              label="E-Wallet"
              :options="ewalletIssuerOptions"
              placeholder="Select e-wallet..."
            />
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1 dark:text-gray-300"
                >Phone Number</label
              >
              <input
                v-model="ewalletPhone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-primary-900/30"
                @focus="activeNumpadField = 'phone'"
              />
            </div>
          </div>
        </div>

        <!-- Right: Numpad (always visible) -->
        <div
          class="w-56 shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2 dark:bg-gray-900/50"
        >
          <p class="text-xs font-medium text-gray-500 text-center mb-1 dark:text-gray-400">{{ numpadLabel }}</p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="key in numpadKeys"
              :key="key"
              class="h-11 rounded-lg font-semibold text-lg transition-all cursor-pointer select-none active:scale-95"
              :class="getNumpadKeyClass(key)"
              @click="handleNumpad(key)"
            >
              {{ key === 'backspace' ? '⌫' : key }}
            </button>
          </div>
          <!-- Quick amounts for cash only -->
          <div v-if="paymentMethod === 'cash'" class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              class="flex-1 min-w-[calc(50%-0.25rem)] px-2 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors cursor-pointer text-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-primary-900/30 dark:hover:border-primary-500 dark:hover:text-primary-300"
              @click="cashReceived = amount"
            >
              {{ formatRp(amount) }}
            </button>
          </div>
        </div>
        <p v-if="checkoutError" class="text-sm text-red-600 dark:text-red-400">
          {{ checkoutError }}
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" size="sm" :disabled="checkingOut" @click="showPayment = false"
          >Cancel</BaseButton
        >
        <BaseButton variant="success" size="sm" :disabled="checkingOut" @click="completeTransaction">
          {{ checkingOut ? 'Processing...' : 'Complete' }}
        </BaseButton>
      </template>
    </BaseModal>

    <ModifierPickerModal
      v-model="showModifierPicker"
      :product-name="modifierPickerProduct?.name ?? ''"
      :product-price="modifierPickerProduct?.price"
      :product-category="modifierPickerProduct?.category"
      :groups="modifierPickerGroups"
      @confirm="onModifierConfirm"
    />

    <IncomingOrdersModal
      v-model="showIncomingOrders"
      :orders="visiblePendingOrders"
      :tabs="openTabs"
      @select="selectPendingOrder"
      @select-tab="selectOpenTab"
      @cancel-tab="cancelOpenTab"
    />

    <!-- Printer Picker -->
    <BaseModal v-model="showPrinterPicker" title="Receipt Printer" size="sm">
      <div class="space-y-3">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Pair the printer via Android Bluetooth settings first, then pick it here.
        </p>
        <div v-if="pairedPrinters.length === 0" class="text-sm text-gray-400 text-center py-4">
          No paired Bluetooth devices found.
        </div>
        <div v-else class="space-y-1.5">
          <button
            v-for="device in pairedPrinters"
            :key="device.address"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors"
            :class="
              selectedPrinterAddress === device.address
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            "
            @click="selectPrinter(device.address)"
          >
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ device.name }}</span>
            <span class="text-[0.625rem] text-gray-400">{{ device.address }}</span>
          </button>
        </div>
        <p v-if="printStatus" class="text-xs text-red-600 dark:text-red-400">{{ printStatus }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="loadPairedPrinters">Refresh</BaseButton>
        <BaseButton
          size="sm"
          :disabled="!selectedPrinterAddress || printerBusy"
          @click="testPrint"
        >
          {{ printerBusy ? 'Printing...' : 'Test Print' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Reprint Confirm -->
    <BaseModal v-model="showReprintConfirm" title="Print Copy for Customer" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">Print another copy of the last receipt for the customer?</p>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="showReprintConfirm = false">Cancel</BaseButton>
        <BaseButton size="sm" @click="printCustomerCopy">Print</BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

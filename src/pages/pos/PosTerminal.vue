<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  Percent,
  Tag,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Printer,
} from '@lucide/vue'
import type { SelectOption } from '@/components/ui/BaseSelect.vue'
import { terminal, onSyncEvent } from '@/lib/terminal'
import type { Transaction, LineItem, PaymentMethod as ApiPaymentMethod, ModifierOption } from '@/lib/terminal'
import ModifierPickerModal from '@/components/pos/ModifierPickerModal.vue'
import type { ModifierGroupWithOptions } from '@/components/pos/ModifierPickerModal.vue'
import CashNumpad from '@/components/pos/CashNumpad.vue'
import { listPairedPrinters, connectPrinter, disconnectPrinter, printReceipt, printTestReceipt, type PairedDevice } from '@/lib/printer'
import { receiptLines } from '@/lib/receipt'

const PRINTER_STORAGE_KEY = 'purdia_printer_address'

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
}

interface CartItem {
  product: Product
  qty: number
  discount: number
  discountType: 'nominal' | 'percent'
  selectedModifiers: ModifierOption[]
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

let unlistenSync: (() => void) | null = null
onMounted(async () => {
  await refetch()
  loadPairedPrinters()
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
})

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

// Customer
const customerType = ref<string | number>('walkin')
const customerName = ref('')
const memberSearch = ref<string | number>('')

const customerTypeOptions: SelectOption[] = [
  { label: 'Walk-in', value: 'walkin' },
  { label: 'Member', value: 'member' },
]

// Discount global
const globalDiscount = ref(0)
const globalDiscountType = ref<'nominal' | 'percent'>('percent')

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

async function printLastReceipt(tx: Transaction, label?: string) {
  if (!selectedPrinterAddress.value) return
  try {
    await connectPrinter(selectedPrinterAddress.value)
    await printReceipt(selectedPrinterAddress.value, receiptLines(tx, label))
    await disconnectPrinter(selectedPrinterAddress.value)
  } catch (e) {
    printStatus.value = 'Print failed: ' + (e instanceof Error ? e.message : String(e))
  }
}

// On-demand extra copy for the buyer — some customers ask for their own
// receipt in addition to the store/checker copy that already printed
// automatically at checkout. Reprints the same transaction, labeled so it's
// clear which copy is which.
async function printCustomerCopy() {
  if (!lastTransaction.value || !selectedPrinterAddress.value || printingCopy.value) return
  printingCopy.value = true
  try {
    await printLastReceipt(lastTransaction.value, 'CUSTOMER COPY')
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

const memberOptions: SelectOption[] = [
  { label: 'Budi Santoso - M001', value: 'M001' },
  { label: 'Siti Rahayu - M002', value: 'M002' },
  { label: 'Ahmad Fauzi - M003', value: 'M003' },
  { label: 'Lisa Permata - M004', value: 'M004' },
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
    cart.value.push({ product, qty: 1, discount: 0, discountType: 'percent', selectedModifiers })
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

const grandTotal = computed(() => Math.max(0, subtotal.value - globalDiscountAmount.value))
const change = computed(() => Math.max(0, cashReceived.value - grandTotal.value))

function openPayment() {
  if (cart.value.length === 0) return
  cashReceived.value = grandTotal.value
  showPayment.value = true
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

// `pos_core::LineItem`/`Transaction` have no discount field at all, so
// per-line and global discounts (both UI-only concepts here) are folded
// into the unit price sent to the backend — this loses the discount audit
// trail (known gap; would need a pos-core schema change to fix properly).
// The global discount is distributed proportionally across lines so the
// sum still matches `grandTotal`.
function buildLineItems(): LineItem[] {
  const scale = subtotal.value > 0 ? grandTotal.value / subtotal.value : 1
  return cart.value.map((item) => {
    const lineTotal = Math.round(getItemTotal(item) * scale)
    const unitPrice = item.qty > 0 ? Math.round(lineTotal / item.qty) : item.product.price
    const modifierSuffix = item.selectedModifiers.length
      ? ` (${item.selectedModifiers.map((m) => m.name).join(', ')})`
      : ''
    return {
      product_id: item.product.id,
      name: item.product.name + modifierSuffix,
      price: unitPrice,
      qty: item.qty,
    }
  })
}

async function completeTransaction() {
  if (checkingOut.value) return
  checkingOut.value = true
  checkoutError.value = ''
  try {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      items: buildLineItems(),
      total: grandTotal.value,
      payment_method: toApiPaymentMethod(paymentMethod.value),
      payment_status: 'paid',
      order_id: null,
      paid_ms: Date.now(),
      synced: false,
    }
    await terminal.checkout(tx)
    // Refetch immediately so the cashier's own screen reflects the new
    // stock right away — don't wait on the sync-event round trip, that's
    // for picking up *other* terminals' sales.
    await refetch()
    lastTransaction.value = tx
    await printLastReceipt(tx, 'STORE COPY')
    cart.value = []
    globalDiscount.value = 0
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
      class="w-72 shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col min-h-0 dark:bg-gray-800 dark:border-gray-700"
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
            <span class="text-xs text-gray-400 dark:text-gray-500">Cashier: Angga</span>
          </div>
        </div>
        <!-- Customer Type -->
        <BaseSelect
          v-model="customerType"
          :options="customerTypeOptions"
          :searchable="false"
          :clearable="false"
          size="sm"
          placeholder="Customer type"
        />
        <div v-if="customerType === 'member'" class="mt-2">
          <BaseSelect
            v-model="memberSearch"
            :options="memberOptions"
            placeholder="Search member..."
            size="sm"
          />
        </div>
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
            <!-- Inline discount -->
            <div class="flex items-center gap-1.5 mt-1.5">
              <Percent class="w-3 h-3 text-gray-400 shrink-0 dark:text-gray-500" />
              <input
                v-model.number="item.discount"
                type="number"
                min="0"
                placeholder="Disc"
                class="w-16 text-[0.6875rem] px-1.5 py-0.5 border border-gray-200 rounded outline-none focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
              <button
                class="text-[0.625rem] px-1.5 py-0.5 rounded font-medium cursor-pointer transition-colors"
                :class="
                  item.discountType === 'percent'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                "
                @click="item.discountType = 'percent'"
              >
                %
              </button>
              <button
                class="text-[0.625rem] px-1.5 py-0.5 rounded font-medium cursor-pointer transition-colors"
                :class="
                  item.discountType === 'nominal'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                "
                @click="item.discountType = 'nominal'"
              >
                Rp
              </button>
              <span
                v-if="item.discount > 0"
                class="text-[0.625rem] text-amber-600 dark:text-amber-400 ml-auto"
              >
                -{{
                  item.discountType === 'percent' ? `${item.discount}%` : formatRp(item.discount)
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Footer -->
      <div class="shrink-0 border-t border-gray-100 px-4 py-3 space-y-2 dark:border-gray-700">
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
            class="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-100 dark:text-gray-100 dark:border-gray-700"
          >
            <span>Total</span>
            <span>{{ formatRp(grandTotal) }}</span>
          </div>
        </div>
        <BaseButton block :disabled="cart.length === 0" @click="openPayment">
          <CreditCard class="w-4 h-4" /> Pay {{ formatRp(grandTotal) }}
        </BaseButton>
        <button
          v-if="lastTransaction"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:text-gray-400"
          :disabled="!selectedPrinterAddress || printingCopy"
          @click="printCustomerCopy"
        >
          <Printer class="w-3.5 h-3.5" />
          {{ printingCopy ? 'Printing...' : 'Print Copy for Customer' }}
        </button>
      </div>
    </div>

    <!-- Payment Modal -->
    <BaseModal v-model="showPayment" title="Payment" size="sm">
      <div class="space-y-4">
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
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {{ formatRp(cashReceived) }}
          </p>
          <CashNumpad v-model="cashReceived" />
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
            />
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
      :groups="modifierPickerGroups"
      @confirm="onModifierConfirm"
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
  </div>
</template>

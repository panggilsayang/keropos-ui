<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BaseButton,
  BaseBadge,
  BaseInput,
  BaseModal,
  BaseSelect,
  BaseAvatar,
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
} from '@lucide/vue'
import type { SelectOption } from '@/components/ui/BaseSelect.vue'

interface Product {
  id: number
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
}

const products: Product[] = [
  { id: 1, name: 'Kopi Susu Gula Aren', price: 25000, category: 'Beverages', stock: 50 },
  { id: 2, name: 'Americano', price: 22000, category: 'Beverages', stock: 40 },
  { id: 3, name: 'Cappuccino', price: 28000, category: 'Beverages', stock: 35 },
  { id: 4, name: 'Es Teh Manis', price: 10000, category: 'Beverages', stock: 100 },
  { id: 5, name: 'Nasi Goreng Spesial', price: 30000, category: 'Food', stock: 25 },
  { id: 6, name: 'Mie Ayam Bakso', price: 20000, category: 'Food', stock: 30 },
  { id: 7, name: 'Roti Bakar Coklat', price: 18000, category: 'Food', stock: 20 },
  { id: 8, name: 'French Fries', price: 15000, category: 'Snacks', stock: 40 },
  { id: 9, name: 'Dimsum Ayam', price: 25000, category: 'Snacks', stock: 30 },
  { id: 10, name: 'Mineral Water', price: 5000, category: 'Beverages', stock: 200 },
  { id: 11, name: 'Juice Alpukat', price: 20000, category: 'Beverages', stock: 25 },
  { id: 12, name: 'Chicken Wings', price: 28000, category: 'Snacks', stock: 18 },
]

const categories = ['All', 'Beverages', 'Food', 'Snacks']
const activeCategory = ref('All')
const searchQuery = ref('')
const cart = ref<CartItem[]>([])

// Customer
const customerType = ref<'walkin' | 'member'>('walkin')
const customerName = ref('')
const memberSearch = ref<string | number>('')

// Discount global
const globalDiscount = ref(0)
const globalDiscountType = ref<'nominal' | 'percent'>('percent')

// Payment
const showPayment = ref(false)
const paymentMethod = ref<string | number>('cash')
const cashReceived = ref<number>(0)

// Item discount modal
const showItemDiscount = ref(false)
const editingItemIdx = ref(-1)
const itemDiscountValue = ref(0)
const itemDiscountType = ref<'nominal' | 'percent'>('percent')

const paymentOptions: SelectOption[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Debit Card', value: 'debit' },
  { label: 'Credit Card', value: 'credit' },
  { label: 'E-Wallet (QRIS)', value: 'ewallet' },
  { label: 'Bank Transfer', value: 'transfer' },
]

const memberOptions: SelectOption[] = [
  { label: 'Budi Santoso - M001', value: 'M001' },
  { label: 'Siti Rahayu - M002', value: 'M002' },
  { label: 'Ahmad Fauzi - M003', value: 'M003' },
  { label: 'Lisa Permata - M004', value: 'M004' },
]

const filteredProducts = computed(() => {
  let list = products
  if (activeCategory.value !== 'All') {
    list = list.filter((p) => p.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  return list
})

function addToCart(product: Product) {
  const existing = cart.value.find((c) => c.product.id === product.id)
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ product, qty: 1, discount: 0, discountType: 'nominal' })
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

function openItemDiscount(idx: number) {
  editingItemIdx.value = idx
  const item = cart.value[idx]
  if (item) {
    itemDiscountValue.value = item.discount
    itemDiscountType.value = item.discountType
  }
  showItemDiscount.value = true
}

function saveItemDiscount() {
  const item = cart.value[editingItemIdx.value]
  if (item) {
    item.discount = itemDiscountValue.value
    item.discountType = itemDiscountType.value
  }
  showItemDiscount.value = false
}

function getItemTotal(item: CartItem) {
  const base = item.product.price * item.qty
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

function completeTransaction() {
  cart.value = []
  globalDiscount.value = 0
  customerType.value = 'walkin'
  customerName.value = ''
  memberSearch.value = ''
  showPayment.value = false
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
</script>

<template>
  <div class="flex h-full min-h-0 gap-4">
    <!-- Left: Products -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Search + Categories -->
      <div class="shrink-0 space-y-3 mb-4">
        <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search class="w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search product..."
            class="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div class="flex gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer"
            :class="
              activeCategory === cat
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            class="bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
            @click="addToCart(product)"
          >
            <div
              class="w-full h-16 bg-gray-100 rounded-md flex items-center justify-center text-2xl mb-2"
            >
              {{
                product.category === 'Beverages' ? '☕' : product.category === 'Food' ? '🍽️' : '🍟'
              }}
            </div>
            <p class="text-sm font-medium text-gray-800 truncate">{{ product.name }}</p>
            <div class="flex items-center justify-between mt-1">
              <span class="text-sm font-bold text-primary-600">{{ formatRp(product.price) }}</span>
              <span class="text-[0.625rem] text-gray-400">stk: {{ product.stock }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Cart -->
    <div class="w-96 shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col min-h-0">
      <!-- Cart Header -->
      <div class="px-4 py-3 border-b border-gray-100 shrink-0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-900">Current Order</h3>
          <span class="text-xs text-gray-400">Cashier: Angga</span>
        </div>
        <!-- Customer -->
        <div class="flex gap-2">
          <button
            class="flex-1 py-1.5 text-xs font-medium rounded-md text-center cursor-pointer transition-colors"
            :class="
              customerType === 'walkin' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            "
            @click="customerType = 'walkin'"
          >
            Walk-in
          </button>
          <button
            class="flex-1 py-1.5 text-xs font-medium rounded-md text-center cursor-pointer transition-colors"
            :class="
              customerType === 'member' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            "
            @click="customerType = 'member'"
          >
            Member
          </button>
        </div>
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
          class="flex flex-col items-center justify-center h-full text-gray-300"
        >
          <ShoppingBag class="w-12 h-12 mb-2" />
          <p class="text-sm">Cart is empty</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(item, idx) in cart"
            :key="item.product.id"
            class="flex items-start gap-2 py-2 border-b border-gray-50"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ item.product.name }}</p>
              <p class="text-xs text-gray-500">
                {{ formatRp(item.product.price) }} x {{ item.qty }}
              </p>
              <button
                v-if="item.discount > 0"
                class="text-[0.625rem] text-amber-600 cursor-pointer"
                @click="openItemDiscount(idx)"
              >
                disc:
                {{
                  item.discountType === 'percent' ? `${item.discount}%` : formatRp(item.discount)
                }}
              </button>
              <button
                v-else
                class="text-[0.625rem] text-gray-400 hover:text-primary-500 cursor-pointer"
                @click="openItemDiscount(idx)"
              >
                + discount
              </button>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
                @click="updateQty(idx, -1)"
              >
                <Minus class="w-3 h-3" />
              </button>
              <span class="w-6 text-center text-sm font-medium">{{ item.qty }}</span>
              <button
                class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
                @click="updateQty(idx, 1)"
              >
                <Plus class="w-3 h-3" />
              </button>
            </div>
            <div class="text-right shrink-0 w-20">
              <p class="text-sm font-semibold text-gray-900">{{ formatRp(getItemTotal(item)) }}</p>
              <button
                class="text-gray-300 hover:text-red-500 cursor-pointer"
                @click="removeItem(idx)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Footer -->
      <div class="shrink-0 border-t border-gray-100 px-4 py-3 space-y-2">
        <!-- Global Discount -->
        <div class="flex items-center gap-2">
          <Tag class="w-4 h-4 text-gray-400" />
          <input
            v-model.number="globalDiscount"
            type="number"
            min="0"
            class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary-500 w-20"
            placeholder="Discount"
          />
          <select
            v-model="globalDiscountType"
            class="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
          >
            <option value="percent">%</option>
            <option value="nominal">Rp</option>
          </select>
        </div>

        <!-- Totals -->
        <div class="space-y-1 text-sm">
          <div class="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{{ formatRp(subtotal) }}</span>
          </div>
          <div v-if="globalDiscountAmount > 0" class="flex justify-between text-amber-600">
            <span>Discount</span>
            <span>-{{ formatRp(globalDiscountAmount) }}</span>
          </div>
          <div
            class="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-100"
          >
            <span>Total</span>
            <span>{{ formatRp(grandTotal) }}</span>
          </div>
        </div>

        <BaseButton block :disabled="cart.length === 0" @click="openPayment">
          <CreditCard class="w-4 h-4" /> Pay {{ formatRp(grandTotal) }}
        </BaseButton>
      </div>
    </div>

    <!-- Payment Modal -->
    <BaseModal v-model="showPayment" title="Payment" size="sm">
      <div class="space-y-4">
        <div class="text-center py-2">
          <p class="text-xs text-gray-500">Total Amount</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatRp(grandTotal) }}</p>
        </div>
        <BaseSelect
          v-model="paymentMethod"
          label="Payment Method"
          :options="paymentOptions"
          :searchable="false"
        />
        <div v-if="paymentMethod === 'cash'">
          <label class="text-sm font-medium text-gray-700 block mb-1">Cash Received</label>
          <input
            v-model.number="cashReceived"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
          <div v-if="change > 0" class="mt-2 p-2 bg-emerald-50 rounded-md text-center">
            <p class="text-xs text-emerald-600">Change</p>
            <p class="text-lg font-bold text-emerald-700">{{ formatRp(change) }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="showPayment = false">Cancel</BaseButton>
        <BaseButton variant="success" size="sm" @click="completeTransaction">Complete</BaseButton>
      </template>
    </BaseModal>

    <!-- Item Discount Modal -->
    <BaseModal v-model="showItemDiscount" title="Item Discount" size="sm">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input
            v-model.number="itemDiscountValue"
            type="number"
            min="0"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500"
            placeholder="Amount"
          />
          <select
            v-model="itemDiscountType"
            class="text-sm border border-gray-300 rounded-md px-3 py-2 outline-none"
          >
            <option value="percent">Percent (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="showItemDiscount = false">Cancel</BaseButton>
        <BaseButton size="sm" @click="saveItemDiscount">Apply</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

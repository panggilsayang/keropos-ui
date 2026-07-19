<script setup lang="ts">
import { computed } from 'vue'
import { Clock, MapPin, Play, X } from '@lucide/vue'
import { BaseBadge, BaseButton, BaseModal } from '@/components/ui'
import type { PendingOrder, OpenTab, PendingOrderItem, LineItem } from '@/lib/terminal'

const props = defineProps<{
  modelValue: boolean
  orders: PendingOrder[]
  tabs: OpenTab[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [order: PendingOrder]
  'select-tab': [tab: OpenTab]
  'cancel-tab': [tabId: string]
}>()

// QR orders and open tabs are the same lifecycle stage — open, unsettled —
// just different origins (customer scanned a QR vs. staff opened a tab
// manually), so they share one list instead of two separate screens/badges.
type Row =
  | {
      kind: 'order'
      key: string
      label: string
      tableLabel: string | null
      subtotal: number
      items: PendingOrderItem[]
      createdMs: number
      order: PendingOrder
    }
  | {
      kind: 'tab'
      key: string
      label: string
      tableLabel: string | null
      subtotal: number
      items: LineItem[]
      createdMs: number
      tab: OpenTab
    }

const rows = computed<Row[]>(() => {
  const orderRows: Row[] = props.orders.map((order) => ({
    kind: 'order',
    key: `order-${order.id}`,
    label: order.customer_name || 'Table order',
    tableLabel: null,
    subtotal: order.subtotal,
    items: order.items,
    createdMs: order.created_ms,
    order,
  }))
  const tabRows: Row[] = props.tabs.map((tab) => ({
    kind: 'tab',
    key: `tab-${tab.id}`,
    label: tab.customer_label || tab.table_label || `Tab #${tab.tab_number}`,
    tableLabel: tab.table_label,
    subtotal: tab.subtotal,
    items: tab.items,
    createdMs: tab.opened_ms,
    tab,
  }))
  return [...orderRows, ...tabRows].sort((a, b) => a.createdMs - b.createdMs)
})

function selectRow(row: Row) {
  if (row.kind === 'order') emit('select', row.order)
  else emit('select-tab', row.tab)
}

function getTimeSince(ms: number) {
  const diff = Math.floor((Date.now() - ms) / 60000)
  if (diff < 1) return 'Baru saja'
  if (diff < 60) return `${diff} menit lalu`
  return `${Math.floor(diff / 60)} jam lalu`
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Held Orders"
    size="lg"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div v-if="rows.length === 0" class="py-8 text-center">
      <Clock class="w-12 h-12 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada order yang di-hold</p>
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="row in rows"
        :key="row.key"
        class="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors dark:border-gray-700 dark:hover:border-gray-600"
      >
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ row.label }}</p>
              <BaseBadge :variant="row.kind === 'order' ? 'success' : 'info'" size="sm">
                {{ row.kind === 'order' ? 'QR' : 'Tab' }}
              </BaseBadge>
              <BaseBadge v-if="row.tableLabel" variant="warning" size="sm">
                <MapPin class="w-3 h-3" /> {{ row.tableLabel }}
              </BaseBadge>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ getTimeSince(row.createdMs) }}</p>
          </div>
          <p class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ formatRp(row.subtotal) }}</p>
        </div>
        <!-- Items preview -->
        <div class="flex flex-wrap gap-1 mb-3">
          <span
            v-for="(item, i) in row.items.slice(0, 4)"
            :key="i"
            class="text-[0.625rem] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          >
            {{ item.qty }}x {{ item.name }}
          </span>
          <span
            v-if="row.items.length > 4"
            class="text-[0.625rem] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            +{{ row.items.length - 4 }} lainnya
          </span>
        </div>
        <!-- Actions -->
        <div class="flex gap-2">
          <BaseButton variant="primary" size="sm" class="flex-1" @click="selectRow(row)">
            <Play class="w-3.5 h-3.5" /> Lanjutkan
          </BaseButton>
          <BaseButton
            v-if="row.kind === 'tab'"
            variant="danger"
            size="sm"
            @click.stop="emit('cancel-tab', row.tab.id)"
          >
            <X class="w-3.5 h-3.5" /> Cancel
          </BaseButton>
        </div>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="emit('update:modelValue', false)">Close</BaseButton>
    </template>
  </BaseModal>
</template>

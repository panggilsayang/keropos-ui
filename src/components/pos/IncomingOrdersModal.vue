<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { BaseButton, BaseModal } from '@/components/ui'
import type { PendingOrder, OpenTab } from '@/lib/terminal'

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
  | { kind: 'order'; key: string; label: string; subtotal: number; itemCount: number; sortMs: number; order: PendingOrder }
  | { kind: 'tab'; key: string; label: string; subtotal: number; itemCount: number; sortMs: number; tab: OpenTab }

const rows = computed<Row[]>(() => {
  const orderRows: Row[] = props.orders.map((order) => ({
    kind: 'order',
    key: `order-${order.id}`,
    label: order.customer_name || 'Table order',
    subtotal: order.subtotal,
    itemCount: order.items.length,
    sortMs: order.created_ms,
    order,
  }))
  const tabRows: Row[] = props.tabs.map((tab) => ({
    kind: 'tab',
    key: `tab-${tab.id}`,
    label: tab.table_label || tab.customer_label || `Tab #${tab.tab_number}`,
    subtotal: tab.subtotal,
    itemCount: tab.items.length,
    sortMs: tab.opened_ms,
    tab,
  }))
  return [...orderRows, ...tabRows].sort((a, b) => a.sortMs - b.sortMs)
})

function selectRow(row: Row) {
  if (row.kind === 'order') emit('select', row.order)
  else emit('select-tab', row.tab)
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Incoming Orders"
    size="sm"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div v-if="rows.length === 0" class="text-sm text-gray-400 text-center py-6">
      Nothing pending.
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="row in rows"
        :key="row.key"
        class="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer dark:border-gray-700 dark:hover:border-primary-500"
        @click="selectRow(row)"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
            <span
              class="text-[0.5625rem] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              :class="
                row.kind === 'order'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              "
            >
              {{ row.kind === 'order' ? 'QR' : 'Tab' }}
            </span>
            {{ row.label }}
          </span>
          <span class="flex items-center gap-2">
            <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">{{
              formatRp(row.subtotal)
            }}</span>
            <button
              v-if="row.kind === 'tab'"
              class="text-gray-300 hover:text-red-500 cursor-pointer dark:text-gray-600 dark:hover:text-red-400"
              aria-label="Cancel tab"
              @click.stop="emit('cancel-tab', row.tab.id)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{ row.itemCount }} item{{ row.itemCount === 1 ? '' : 's' }}
        </p>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="emit('update:modelValue', false)">Close</BaseButton>
    </template>
  </BaseModal>
</template>

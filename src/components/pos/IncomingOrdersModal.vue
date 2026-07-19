<script setup lang="ts">
import { BaseButton, BaseModal } from '@/components/ui'
import type { PendingOrder } from '@/lib/terminal'

defineProps<{
  modelValue: boolean
  orders: PendingOrder[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [order: PendingOrder]
}>()

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
    <div v-if="orders.length === 0" class="text-sm text-gray-400 text-center py-6">
      No pending orders.
    </div>
    <div v-else class="space-y-2">
      <button
        v-for="order in orders"
        :key="order.id"
        class="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer dark:border-gray-700 dark:hover:border-primary-500"
        @click="emit('select', order)"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
            {{ order.customer_name || `Table order` }}
          </span>
          <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">{{
            formatRp(order.subtotal)
          }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{ order.items.length }} item{{ order.items.length === 1 ? '' : 's' }}
        </p>
      </button>
    </div>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="emit('update:modelValue', false)">Close</BaseButton>
    </template>
  </BaseModal>
</template>

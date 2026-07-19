<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus } from '@lucide/vue'
import { BaseBadge, BaseButton, BaseModal } from '@/components/ui'
import type { ModifierGroup, ModifierOption } from '@/lib/terminal'

export interface ModifierGroupWithOptions {
  group: ModifierGroup
  options: ModifierOption[]
}

const props = defineProps<{
  modelValue: boolean
  productName: string
  productPrice?: number
  productCategory?: string
  groups: ModifierGroupWithOptions[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [selected: ModifierOption[]]
}>()

// group_id -> selected option id(s). Single-select groups store one id in
// the array; multi-select groups can hold several.
const selections = ref<Record<string, string[]>>({})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selections.value = Object.fromEntries(props.groups.map((g) => [g.group.id, []]))
    }
  },
)

function isSelected(groupId: string, optionId: string) {
  return (selections.value[groupId] ?? []).includes(optionId)
}

function toggleOption(g: ModifierGroupWithOptions, optionId: string) {
  const current = selections.value[g.group.id] ?? []
  if (g.group.multi_select) {
    selections.value[g.group.id] = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId]
  } else {
    selections.value[g.group.id] = [optionId]
  }
}

const selectedOptions = computed(() =>
  props.groups.flatMap((g) =>
    g.options.filter((o) => (selections.value[g.group.id] ?? []).includes(o.id)),
  ),
)

const extraTotal = computed(() => selectedOptions.value.reduce((sum, o) => sum + o.price_delta, 0))

const canConfirm = computed(() =>
  props.groups.every((g) => {
    const count = (selections.value[g.group.id] ?? []).length
    return count >= (g.group.required ? Math.max(1, g.group.min_select) : g.group.min_select)
  }),
)

function confirm() {
  if (!canConfirm.value) return
  emit('confirm', selectedOptions.value)
  emit('update:modelValue', false)
}

function categoryIcon(category?: string) {
  if (category === 'Beverages') return '☕'
  if (category === 'Food') return '🍽️'
  return '🍟'
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="productName" size="md" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="space-y-4">
      <!-- Product info -->
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-900/50">
        <div class="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-2xl dark:bg-gray-700">
          {{ categoryIcon(productCategory) }}
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-gray-100">{{ productName }}</p>
          <p v-if="productPrice !== undefined" class="text-sm text-primary-600 dark:text-primary-400">
            {{ formatRp(productPrice) }}
            <span v-if="extraTotal > 0" class="text-gray-500 dark:text-gray-400">
              + {{ formatRp(extraTotal) }}
            </span>
          </p>
        </div>
        <div v-if="productPrice !== undefined" class="ml-auto text-right">
          <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
            {{ formatRp(productPrice + extraTotal) }}
          </p>
        </div>
      </div>

      <!-- Modifier groups -->
      <div v-for="g in groups" :key="g.group.id" class="space-y-2">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ g.group.name }}</p>
          <BaseBadge v-if="g.group.required" variant="danger" size="sm">Wajib</BaseBadge>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in g.options"
            :key="opt.id"
            type="button"
            class="px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer"
            :class="
              isSelected(g.group.id, opt.id)
                ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800'
            "
            @click="toggleOption(g, opt.id)"
          >
            {{ opt.name }}
            <span v-if="opt.price_delta > 0" class="text-xs opacity-70 ml-1">
              +{{ formatRp(opt.price_delta) }}
            </span>
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="emit('update:modelValue', false)">Batal</BaseButton>
      <BaseButton variant="primary" size="sm" :disabled="!canConfirm" @click="confirm">
        <Plus class="w-4 h-4" /> Tambah ke Keranjang
      </BaseButton>
    </template>
  </BaseModal>
</template>

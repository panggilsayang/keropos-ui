<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BaseButton, BaseModal } from '@/components/ui'
import type { ModifierGroup, ModifierOption } from '@/lib/terminal'

export interface ModifierGroupWithOptions {
  group: ModifierGroup
  options: ModifierOption[]
}

const props = defineProps<{
  modelValue: boolean
  productName: string
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

const canConfirm = computed(() =>
  props.groups.every((g) => {
    const count = (selections.value[g.group.id] ?? []).length
    return count >= (g.group.required ? Math.max(1, g.group.min_select) : g.group.min_select)
  }),
)

function confirm() {
  if (!canConfirm.value) return
  const selected = props.groups.flatMap((g) =>
    g.options.filter((o) => (selections.value[g.group.id] ?? []).includes(o.id)),
  )
  emit('confirm', selected)
  emit('update:modelValue', false)
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="productName" size="sm" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="space-y-5">
      <div v-for="g in groups" :key="g.group.id">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ g.group.name }}</span>
          <span v-if="g.group.required" class="text-[0.625rem] text-red-500 uppercase tracking-wide"
            >Required</span
          >
        </div>
        <div class="space-y-1.5">
          <label
            v-for="opt in g.options"
            :key="opt.id"
            class="flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors"
            :class="
              isSelected(g.group.id, opt.id)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            "
          >
            <span class="flex items-center gap-2">
              <input
                :type="g.group.multi_select ? 'checkbox' : 'radio'"
                :name="g.group.id"
                :checked="isSelected(g.group.id, opt.id)"
                class="accent-primary-500"
                @change="toggleOption(g, opt.id)"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ opt.name }}</span>
            </span>
            <span v-if="opt.price_delta > 0" class="text-xs text-gray-500 dark:text-gray-400"
              >+{{ formatRp(opt.price_delta) }}</span
            >
          </label>
        </div>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="ghost" size="sm" @click="emit('update:modelValue', false)">Cancel</BaseButton>
      <BaseButton size="sm" :disabled="!canConfirm" @click="confirm">Add to Cart</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat'

interface Props {
  variant?: CardVariant
  padding?: boolean
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: true,
  hoverable: false,
})

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 shadow-sm',
  bordered: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg',
  flat: 'bg-gray-50',
}

const classes = computed(() => [
  'rounded-xl overflow-hidden transition-all duration-200',
  variantClasses[props.variant],
  props.hoverable ? 'hover:shadow-md hover:-translate-y-0.5' : '',
])
</script>

<template>
  <div :class="classes">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-100">
      <slot name="header" />
    </div>
    <div :class="padding ? 'p-6' : ''">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pill?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
  pill: true,
})

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-50 text-primary-600',
  secondary: 'bg-gray-100 text-gray-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-cyan-50 text-cyan-600',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.6875rem]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

const classes = computed(() => [
  'inline-flex items-center gap-1 font-medium',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.pill ? 'rounded-full' : 'rounded',
])
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-current" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Component } from 'vue'
import { ChevronDown } from '@lucide/vue'

export type DropdownVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'outline'
export type DropdownSize = 'sm' | 'md' | 'lg'
export type DropdownAlign = 'left' | 'right'

export interface DropdownItem {
  label: string
  value?: string
  icon?: Component
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

interface Props {
  items: DropdownItem[]
  variant?: DropdownVariant
  size?: DropdownSize
  align?: DropdownAlign
  disabled?: boolean
  icon?: Component
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  align: 'left',
  disabled: false,
})

const emit = defineEmits<{
  select: [item: DropdownItem]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

function toggle() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

function select(item: DropdownItem) {
  if (!item.disabled && !item.divider) {
    emit('select', item)
    isOpen.value = false
  }
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const variantClasses: Record<DropdownVariant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-200',
  secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-200',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-200',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200',
  outline:
    'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200',
}

const sizeClasses: Record<DropdownSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <button
      class="inline-flex items-center justify-center gap-2 font-medium rounded-md cursor-pointer transition-all duration-150 select-none focus:outline-none focus:ring-2"
      :class="[
        variantClasses[variant],
        sizeClasses[size],
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      :disabled="disabled"
      @click="toggle"
    >
      <component v-if="icon" :is="icon" class="w-4 h-4 shrink-0" />
      <slot name="trigger">
        <span><slot /></span>
      </slot>
      <ChevronDown
        class="w-4 h-4 shrink-0 transition-transform duration-150"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1 min-w-[10rem] bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden"
        :class="align === 'right' ? 'right-0' : 'left-0'"
      >
        <template v-for="(item, index) in items" :key="index">
          <div v-if="item.divider" class="h-px bg-gray-100 my-1" />
          <button
            v-else
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-100"
            :class="[
              item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
            ]"
            :disabled="item.disabled"
            @click="select(item)"
          >
            <component v-if="item.icon" :is="item.icon" class="w-4 h-4 shrink-0" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

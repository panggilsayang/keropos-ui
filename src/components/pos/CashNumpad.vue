<script setup lang="ts">
// Dumb numeric keypad for cash entry on a touchscreen kiosk — no decimal
// point (Rupiah has no cents anywhere in this app's domain), a "000" quick
// key for fast large-amount entry (e.g. 1 + 000 -> 1000), mirrors
// apps/pos-web/src/ui/components/numpad.tsx's shape (pure grid, caller owns
// the accumulated value).
const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫']

function press(key: string) {
  if (key === '⌫') {
    const next = String(props.modelValue).slice(0, -1)
    emit('update:modelValue', next === '' ? 0 : Number(next))
    return
  }
  const next = props.modelValue === 0 ? key : String(props.modelValue) + key
  emit('update:modelValue', Number(next))
}

function clear() {
  emit('update:modelValue', 0)
}
</script>

<template>
  <div class="space-y-2">
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="key in keys"
        :key="key"
        type="button"
        class="py-3 rounded-lg text-lg font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 cursor-pointer transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        @click="press(key)"
      >
        {{ key }}
      </button>
    </div>
    <button
      type="button"
      class="w-full py-2 text-xs text-gray-400 hover:text-red-500 cursor-pointer dark:text-gray-500"
      @click="clear"
    >
      Clear
    </button>
  </div>
</template>

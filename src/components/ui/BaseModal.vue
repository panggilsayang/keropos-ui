<script setup lang="ts">
import { computed } from 'vue'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface Props {
  modelValue: boolean
  size?: ModalSize
  title?: string
  closable?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  persistent: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
}

const modalClasses = computed(() => [
  'bg-white rounded-xl shadow-xl max-h-[85vh] flex flex-col w-full',
  sizeClasses[props.size],
])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
        @click.self="persistent ? undefined : close()"
      >
        <div :class="modalClasses">
          <div
            v-if="title || closable"
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          >
            <h3 v-if="title" class="text-lg font-semibold">{{ title }}</h3>
            <button
              v-if="closable"
              class="text-2xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1 leading-none cursor-pointer"
              @click="close"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div class="p-6 overflow-y-auto">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95) translateY(-10px);
}
</style>

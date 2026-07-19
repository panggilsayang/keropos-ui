<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isTauri } from '@tauri-apps/api/core'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()

const isGuestRoute = computed(() => route.meta.guest === true)

// The Android build is a single-purpose cashier terminal locked to the POS
// Terminal page (see router/index.ts) — no sidebar/topbar navigation to
// other pages is needed there, so it skips DashboardLayout the same way a
// guest (login/register) route does. Unlike guest pages (which define
// their own `min-h-screen` root), PosTerminal.vue expects an ancestor with
// a real height (it normally gets this from DashboardLayout's `h-screen`
// flex container) — so this branch supplies that height itself.
const isAndroidTerminal = computed(() => isTauri())
</script>

<template>
  <DashboardLayout v-if="!isGuestRoute && !isAndroidTerminal">
    <RouterView />
  </DashboardLayout>
  <div
    v-else-if="isAndroidTerminal"
    class="h-screen w-screen overflow-hidden p-3 dark:bg-gray-900"
    :style="{
      paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
      paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
      paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
    }"
  >
    <RouterView />
  </div>
  <RouterView v-else />
  <ToastContainer />
</template>

<style scoped></style>

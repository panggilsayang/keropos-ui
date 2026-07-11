<script setup lang="ts">
import { ref } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <SidebarNav :collapsed="sidebarCollapsed" />
    <div
      class="flex-1 flex flex-col h-screen overflow-hidden transition-[margin-left] duration-200"
      :class="sidebarCollapsed ? 'ml-[4.5rem]' : 'ml-64'"
    >
      <TopBar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 p-6 overflow-auto dark:bg-gray-900">
        <slot />
        <footer class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div
            class="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500"
          >
            <span>&copy; {{ new Date().getFullYear() }} Purdia. All rights reserved.</span>
            <span>v0.1.0</span>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

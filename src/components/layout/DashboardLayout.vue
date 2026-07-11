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
  <div class="flex min-h-screen">
    <SidebarNav :collapsed="sidebarCollapsed" />
    <div
      class="flex-1 flex flex-col transition-[margin-left] duration-200"
      :class="sidebarCollapsed ? 'ml-[4.5rem]' : 'ml-64'"
    >
      <TopBar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

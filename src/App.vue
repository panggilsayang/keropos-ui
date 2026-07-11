<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const route = useRoute()

const isGuestRoute = computed(() => route.meta.guest === true)
</script>

<template>
  <DashboardLayout v-if="!isGuestRoute">
    <RouterView />
  </DashboardLayout>
  <RouterView v-else />
</template>

<style scoped></style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Bell, Search, User, KeyRound, LogOut } from '@lucide/vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'

defineEmits<{
  'toggle-sidebar': []
}>()

const router = useRouter()
const showUserMenu = ref(false)
const menuRef = ref<HTMLElement>()

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

function navigate(path: string) {
  showUserMenu.value = false
  router.push(path)
}

function logout() {
  showUserMenu.value = false
  // In a real app, clear auth state here
  router.push('/')
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <header
    class="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 h-14 sticky top-0 z-40"
  >
    <div class="flex items-center gap-4">
      <button
        class="p-1 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle sidebar"
      >
        <Menu :size="20" />
      </button>
      <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
        <Search :size="16" class="text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          class="border-none outline-none bg-transparent text-sm w-56 placeholder:text-gray-400"
        />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button
        class="relative p-1 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell :size="20" />
        <span
          class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[0.6rem] font-semibold w-4 h-4 rounded-full flex items-center justify-center"
        >
          3
        </span>
      </button>

      <!-- User dropdown -->
      <div ref="menuRef" class="relative">
        <button
          class="flex items-center gap-2 cursor-pointer rounded-md p-1 hover:bg-gray-50 transition-colors"
          @click.stop="toggleUserMenu"
        >
          <BaseAvatar name="Angga Dev" size="sm" />
          <span class="text-sm font-medium text-gray-700 hidden sm:inline">Angga Dev</span>
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
            v-if="showUserMenu"
            class="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          >
            <!-- User info -->
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-semibold text-gray-900">Angga Dev</p>
              <p class="text-xs text-gray-500">angga@purdia.com</p>
            </div>

            <!-- Menu items -->
            <div class="py-1">
              <button
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="navigate('/profile')"
              >
                <User class="w-4 h-4 text-gray-400" />
                My Profile
              </button>
              <button
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="navigate('/change-password')"
              >
                <KeyRound class="w-4 h-4 text-gray-400" />
                Change Password
              </button>
            </div>

            <!-- Logout -->
            <div class="border-t border-gray-100 py-1">
              <button
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                @click="logout"
              >
                <LogOut class="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

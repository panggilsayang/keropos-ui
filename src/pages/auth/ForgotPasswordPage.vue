<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleSubmit() {
  error.value = ''
  success.value = ''
  if (!email.value) {
    error.value = 'Email wajib diisi.'
    return
  }
  loading.value = true
  try {
    const result = await auth.forgotPassword(email.value)
    success.value = result.message
  } catch (e: any) {
    error.value = e.message || 'Gagal mengirim link reset.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Lupa Password</h1>
          <p class="text-gray-500 mt-2">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {{ error }}
          </div>

          <div
            v-if="success"
            class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
          >
            {{ success }}
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="nama@email.com"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Mengirim...' : 'Kirim Link Reset' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Ingat password Anda?
          <RouterLink :to="{ name: 'login' }" class="text-blue-600 hover:text-blue-700 font-medium">
            Kembali ke login
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

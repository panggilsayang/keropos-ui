<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (!name.value || !email.value || !password.value || !passwordConfirmation.value) {
    error.value = 'Semua field wajib diisi.'
    return
  }
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Konfirmasi password tidak cocok.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password minimal 8 karakter.'
    return
  }
  loading.value = true
  try {
    await auth.register(name.value, email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (e: any) {
    error.value = e.message || 'Registrasi gagal.'
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
          <h1 class="text-2xl font-bold text-gray-900">Daftar Akun Baru</h1>
          <p class="text-gray-500 mt-2">Buat akun untuk mulai menggunakan Purdia</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {{ error }}
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1"
              >Nama Lengkap</label
            >
            <input
              id="name"
              v-model="name"
              type="text"
              autocomplete="name"
              placeholder="Nama lengkap"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
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

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1"
              >Password</label
            >
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label for="password-confirmation" class="block text-sm font-medium text-gray-700 mb-1"
              >Konfirmasi Password</label
            >
            <input
              id="password-confirmation"
              v-model="passwordConfirmation"
              type="password"
              autocomplete="new-password"
              placeholder="Ulangi password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Memproses...' : 'Daftar' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?
          <RouterLink :to="{ name: 'login' }" class="text-blue-600 hover:text-blue-700 font-medium">
            Masuk
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

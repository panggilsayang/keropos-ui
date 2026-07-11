import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function init() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  async function login(email: string, _password: string) {
    // Mock login — accept any email/password
    const mockUser: User = {
      id: 1,
      name: 'Admin User',
      email,
      avatar: undefined,
    }
    const mockToken = 'mock-jwt-token-' + Date.now()

    user.value = mockUser
    token.value = mockToken
    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('auth_user', JSON.stringify(mockUser))
  }

  async function register(name: string, email: string, _password: string) {
    // Mock register
    const mockUser: User = {
      id: 1,
      name,
      email,
      avatar: undefined,
    }
    const mockToken = 'mock-jwt-token-' + Date.now()

    user.value = mockUser
    token.value = mockToken
    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('auth_user', JSON.stringify(mockUser))
  }

  async function forgotPassword(_email: string) {
    // Mock — just resolve successfully
    return { message: 'Link reset password telah dikirim ke email Anda.' }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  return { user, token, isAuthenticated, init, login, register, forgotPassword, logout }
})

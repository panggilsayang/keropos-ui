import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(getInitialTheme())

  function getStorageKey(): string {
    const auth = useAuthStore()
    const email = auth.user?.email
    return email ? `theme:${email}` : 'theme'
  }

  function getInitialTheme(): Theme {
    // Try to load for current user
    const auth = useAuthStore()
    const email = auth.user?.email
    if (email) {
      const saved = localStorage.getItem(`theme:${email}`) as Theme | null
      if (saved === 'light' || saved === 'dark') return saved
    }

    // Fallback to generic key (for pre-login state)
    const generic = localStorage.getItem('theme') as Theme | null
    if (generic === 'light' || generic === 'dark') return generic

    // Respect system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  }

  function applyTheme(t: Theme) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  /** Call after login to load the user's saved preference */
  function loadForUser() {
    const auth = useAuthStore()
    const email = auth.user?.email
    if (!email) return

    const saved = localStorage.getItem(`theme:${email}`) as Theme | null
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    }
    // If no saved preference for this user, keep current theme
  }

  // Apply on change & persist per user
  watch(
    theme,
    (val) => {
      const key = getStorageKey()
      localStorage.setItem(key, val)
      applyTheme(val)
    },
    { immediate: true },
  )

  return { theme, toggle, loadForUser }
})

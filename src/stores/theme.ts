import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export type Theme = 'light' | 'dark'
export type PrimaryColor =
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'teal'
  | 'violet'
  | 'slate'

export interface ColorOption {
  name: PrimaryColor
  label: string
  swatch: string // hex preview color (500-level)
}

export const colorOptions: ColorOption[] = [
  { name: 'indigo', label: 'Indigo', swatch: '#6366f1' },
  { name: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { name: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { name: 'rose', label: 'Rose', swatch: '#f43f5e' },
  { name: 'amber', label: 'Amber', swatch: '#f59e0b' },
  { name: 'teal', label: 'Teal', swatch: '#14b8a6' },
  { name: 'violet', label: 'Violet', swatch: '#8b5cf6' },
  { name: 'slate', label: 'Slate', swatch: '#64748b' },
]

const validColors = colorOptions.map((c) => c.name)

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(getInitialTheme())
  const primaryColor = ref<PrimaryColor>(getInitialColor())

  function getStorageKey(suffix: string): string {
    const auth = useAuthStore()
    const email = auth.user?.email
    return email ? `${suffix}:${email}` : suffix
  }

  function getInitialTheme(): Theme {
    const auth = useAuthStore()
    const email = auth.user?.email
    if (email) {
      const saved = localStorage.getItem(`theme:${email}`) as Theme | null
      if (saved === 'light' || saved === 'dark') return saved
    }

    const generic = localStorage.getItem('theme') as Theme | null
    if (generic === 'light' || generic === 'dark') return generic

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  }

  function getInitialColor(): PrimaryColor {
    const auth = useAuthStore()
    const email = auth.user?.email
    if (email) {
      const saved = localStorage.getItem(`primary_color:${email}`)
      if (saved && validColors.includes(saved as PrimaryColor)) return saved as PrimaryColor
    }

    const generic = localStorage.getItem('primary_color')
    if (generic && validColors.includes(generic as PrimaryColor)) return generic as PrimaryColor

    return 'indigo'
  }

  function applyTheme(t: Theme) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function applyColor(color: PrimaryColor) {
    // Remove all theme-* classes
    const classes = document.documentElement.classList
    classes.forEach((cls) => {
      if (cls.startsWith('theme-')) classes.remove(cls)
    })
    // indigo is the default (no class needed)
    if (color !== 'indigo') {
      classes.add(`theme-${color}`)
    }
  }

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setColor(color: PrimaryColor) {
    primaryColor.value = color
  }

  /** Call after login to load the user's saved preference */
  function loadForUser() {
    const auth = useAuthStore()
    const email = auth.user?.email
    if (!email) return

    const savedTheme = localStorage.getItem(`theme:${email}`) as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme.value = savedTheme
    }

    const savedColor = localStorage.getItem(`primary_color:${email}`)
    if (savedColor && validColors.includes(savedColor as PrimaryColor)) {
      primaryColor.value = savedColor as PrimaryColor
    }
  }

  // Watch & apply theme
  watch(
    theme,
    (val) => {
      const key = getStorageKey('theme')
      localStorage.setItem(key, val)
      applyTheme(val)
    },
    { immediate: true },
  )

  // Watch & apply primary color
  watch(
    primaryColor,
    (val) => {
      const key = getStorageKey('primary_color')
      localStorage.setItem(key, val)
      applyColor(val)
    },
    { immediate: true },
  )

  return { theme, primaryColor, colorOptions, toggle, setColor, loadForUser }
})

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth & theme on app start
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useToastStore } from './stores/toast'
import { registerToastHandler } from './lib/http'

const auth = useAuthStore()
await auth.init()

const themeStore = useThemeStore()
themeStore.loadForUser()

// Connect HTTP error interceptor to toast notifications
const toastStore = useToastStore()
registerToastHandler((message) => toastStore.error(message))

app.mount('#app')

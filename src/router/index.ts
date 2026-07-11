import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import examplesRoutes from './routes/examples'
import accountRoutes from './routes/account'
import usersRoutes from './routes/users'
import clientsRoutes from './routes/clients'
import projectsRoutes from './routes/projects'
import posRoutes from './routes/pos'
import accountingRoutes from './routes/accounting'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...dashboardRoutes,
    ...examplesRoutes,
    ...accountRoutes,
    ...usersRoutes,
    ...clientsRoutes,
    ...projectsRoutes,
    ...posRoutes,
    ...accountingRoutes,
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Initialize auth state from localStorage on first navigation
  if (!auth.isAuthenticated) {
    auth.init()
  }

  const isGuestRoute = to.meta.guest === true

  // If not authenticated and trying to access a protected route, redirect to login
  if (!auth.isAuthenticated && !isGuestRoute) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // If authenticated and trying to access guest-only routes (login/register), redirect to dashboard
  if (auth.isAuthenticated && isGuestRoute) {
    return { name: 'dashboard' }
  }
})

export default router

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
import invoicesRoutes from './routes/invoices'

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
    ...invoicesRoutes,
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Wait for auth to be ready (async decrypt from secure storage)
  if (!auth.ready) {
    await auth.init()
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

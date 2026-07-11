import { createRouter, createWebHistory } from 'vue-router'

import dashboardRoutes from './routes/dashboard'
import examplesRoutes from './routes/examples'
import accountRoutes from './routes/account'
import usersRoutes from './routes/users'
import clientsRoutes from './routes/clients'
import projectsRoutes from './routes/projects'
import posRoutes from './routes/pos'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...dashboardRoutes,
    ...examplesRoutes,
    ...accountRoutes,
    ...usersRoutes,
    ...clientsRoutes,
    ...projectsRoutes,
    ...posRoutes,
  ],
})

export default router

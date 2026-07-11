import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/pages/ChangePasswordPage.vue'),
  },
]

export default routes

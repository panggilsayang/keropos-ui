import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/order/:tableId',
    name: 'public-order',
    component: () => import('@/pages/public/PublicOrder.vue'),
    meta: { guest: true, public: true },
  },
]

export default routes

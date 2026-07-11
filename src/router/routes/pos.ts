import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/pos',
    name: 'pos-dashboard',
    component: () => import('@/pages/pos/PosDashboard.vue'),
  },
  {
    path: '/pos/terminal',
    name: 'pos-terminal',
    component: () => import('@/pages/pos/PosTerminal.vue'),
  },
  {
    path: '/pos/stock',
    name: 'pos-stock',
    component: () => import('@/pages/pos/PosStock.vue'),
  },
  {
    path: '/pos/customers',
    name: 'pos-customers',
    component: () => import('@/pages/pos/PosCustomers.vue'),
  },
  {
    path: '/pos/cash-drawer',
    name: 'pos-cash-drawer',
    component: () => import('@/pages/pos/PosCashDrawer.vue'),
  },
  {
    path: '/pos/discounts',
    name: 'pos-discounts',
    component: () => import('@/pages/pos/PosDiscounts.vue'),
  },
  {
    path: '/pos/reports',
    name: 'pos-reports',
    component: () => import('@/pages/pos/PosReport.vue'),
  },
]

export default routes

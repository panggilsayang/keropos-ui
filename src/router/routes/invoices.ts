import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('@/pages/invoices/InvoiceList.vue'),
  },
  {
    path: '/invoices/unpaid',
    name: 'invoices-unpaid',
    component: () => import('@/pages/invoices/InvoiceUnpaid.vue'),
  },
  {
    path: '/invoices/overdue',
    name: 'invoices-overdue',
    component: () => import('@/pages/invoices/InvoiceOverdue.vue'),
  },
  {
    path: '/invoices/create',
    name: 'invoice-create',
    component: () => import('@/pages/invoices/InvoiceCreate.vue'),
  },
  {
    path: '/invoices/:id',
    name: 'invoice-detail',
    component: () => import('@/pages/invoices/InvoiceDetail.vue'),
  },
  {
    path: '/invoices/:id/edit',
    name: 'invoice-edit',
    component: () => import('@/pages/invoices/InvoiceEdit.vue'),
  },
]

export default routes

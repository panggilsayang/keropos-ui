import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/clients',
    name: 'clients',
    component: () => import('@/pages/clients/ClientList.vue'),
  },
  {
    path: '/clients/create',
    name: 'client-create',
    component: () => import('@/pages/clients/ClientCreate.vue'),
  },
  {
    path: '/clients/:id',
    name: 'client-detail',
    component: () => import('@/pages/clients/ClientDetail.vue'),
  },
  {
    path: '/clients/:id/edit',
    name: 'client-edit',
    component: () => import('@/pages/clients/ClientEdit.vue'),
  },
]

export default routes

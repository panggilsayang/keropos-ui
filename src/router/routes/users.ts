import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'users',
    component: () => import('@/pages/users/UserList.vue'),
  },
  {
    path: '/users/roles',
    name: 'roles',
    component: () => import('@/pages/users/RoleList.vue'),
  },
  {
    path: '/users/roles/create',
    name: 'role-create',
    component: () => import('@/pages/users/RoleCreate.vue'),
  },
  {
    path: '/users/roles/:id',
    name: 'role-detail',
    component: () => import('@/pages/users/RoleDetail.vue'),
  },
  {
    path: '/users/roles/:id/edit',
    name: 'role-edit',
    component: () => import('@/pages/users/RoleEdit.vue'),
  },
  {
    path: '/users/permissions',
    name: 'permissions',
    component: () => import('@/pages/users/PermissionList.vue'),
  },
]

export default routes

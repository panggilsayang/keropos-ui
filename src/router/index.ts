import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/examples',
      name: 'examples',
      component: () => import('@/pages/examples/ExamplesIndex.vue'),
    },
    {
      path: '/examples/button',
      name: 'example-button',
      component: () => import('@/pages/examples/ButtonExample.vue'),
    },
    {
      path: '/examples/card',
      name: 'example-card',
      component: () => import('@/pages/examples/CardExample.vue'),
    },
    {
      path: '/examples/badge',
      name: 'example-badge',
      component: () => import('@/pages/examples/BadgeExample.vue'),
    },
    {
      path: '/examples/input',
      name: 'example-input',
      component: () => import('@/pages/examples/InputExample.vue'),
    },
    {
      path: '/examples/select',
      name: 'example-select',
      component: () => import('@/pages/examples/SelectExample.vue'),
    },
    {
      path: '/examples/toggle',
      name: 'example-toggle',
      component: () => import('@/pages/examples/ToggleExample.vue'),
    },
    {
      path: '/examples/avatar',
      name: 'example-avatar',
      component: () => import('@/pages/examples/AvatarExample.vue'),
    },
    {
      path: '/examples/table',
      name: 'example-table',
      component: () => import('@/pages/examples/TableExample.vue'),
    },
    {
      path: '/examples/modal',
      name: 'example-modal',
      component: () => import('@/pages/examples/ModalExample.vue'),
    },
    {
      path: '/examples/alert',
      name: 'example-alert',
      component: () => import('@/pages/examples/AlertExample.vue'),
    },
    {
      path: '/examples/progress',
      name: 'example-progress',
      component: () => import('@/pages/examples/ProgressExample.vue'),
    },
    {
      path: '/examples/stat-card',
      name: 'example-stat-card',
      component: () => import('@/pages/examples/StatCardExample.vue'),
    },
    {
      path: '/examples/charts',
      name: 'example-charts',
      component: () => import('@/pages/examples/ChartsExample.vue'),
    },
    {
      path: '/examples/skeleton',
      name: 'example-skeleton',
      component: () => import('@/pages/examples/SkeletonExample.vue'),
    },
    {
      path: '/examples/tabs',
      name: 'example-tabs',
      component: () => import('@/pages/examples/TabsExample.vue'),
    },
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
    {
      path: '/users',
      name: 'users',
      component: () => import('@/pages/users/UserList.vue'),
    },
    {
      path: '/clients',
      name: 'clients',
      component: () => import('@/pages/clients/ClientList.vue'),
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/pages/projects/ProjectKanban.vue'),
    },
    {
      path: '/projects/tasks/:id',
      name: 'task-detail',
      component: () => import('@/pages/projects/TaskDetail.vue'),
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
  ],
})

export default router

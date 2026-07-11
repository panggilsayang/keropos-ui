import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
]

export default routes

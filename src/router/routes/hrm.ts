import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Dashboard
  {
    path: '/hrm',
    name: 'hrm-dashboard',
    component: () => import('@/pages/hrm/HrmDashboard.vue'),
  },
  // Employees
  {
    path: '/hrm/employees',
    name: 'hrm-employees',
    component: () => import('@/pages/hrm/employees/EmployeeList.vue'),
  },
  {
    path: '/hrm/employees/create',
    name: 'hrm-employee-create',
    component: () => import('@/pages/hrm/employees/EmployeeCreate.vue'),
  },
  {
    path: '/hrm/employees/:id',
    name: 'hrm-employee-detail',
    component: () => import('@/pages/hrm/employees/EmployeeDetail.vue'),
  },
  {
    path: '/hrm/employees/:id/edit',
    name: 'hrm-employee-edit',
    component: () => import('@/pages/hrm/employees/EmployeeEdit.vue'),
  },
  // Departments
  {
    path: '/hrm/departments',
    name: 'hrm-departments',
    component: () => import('@/pages/hrm/departments/DepartmentList.vue'),
  },
  {
    path: '/hrm/departments/create',
    name: 'hrm-department-create',
    component: () => import('@/pages/hrm/departments/DepartmentCreate.vue'),
  },
  {
    path: '/hrm/departments/:id/edit',
    name: 'hrm-department-edit',
    component: () => import('@/pages/hrm/departments/DepartmentEdit.vue'),
  },
  // Positions
  {
    path: '/hrm/positions',
    name: 'hrm-positions',
    component: () => import('@/pages/hrm/positions/PositionList.vue'),
  },
  {
    path: '/hrm/positions/create',
    name: 'hrm-position-create',
    component: () => import('@/pages/hrm/positions/PositionCreate.vue'),
  },
  {
    path: '/hrm/positions/:id/edit',
    name: 'hrm-position-edit',
    component: () => import('@/pages/hrm/positions/PositionEdit.vue'),
  },
  // Attendance
  {
    path: '/hrm/attendance',
    name: 'hrm-attendance',
    component: () => import('@/pages/hrm/attendance/AttendanceList.vue'),
  },
  {
    path: '/hrm/attendance/create',
    name: 'hrm-attendance-create',
    component: () => import('@/pages/hrm/attendance/AttendanceCreate.vue'),
  },
  {
    path: '/hrm/attendance/:id/edit',
    name: 'hrm-attendance-edit',
    component: () => import('@/pages/hrm/attendance/AttendanceEdit.vue'),
  },
  // Leave
  {
    path: '/hrm/leave',
    name: 'hrm-leave',
    component: () => import('@/pages/hrm/leave/LeaveList.vue'),
  },
  {
    path: '/hrm/leave/create',
    name: 'hrm-leave-create',
    component: () => import('@/pages/hrm/leave/LeaveCreate.vue'),
  },
  {
    path: '/hrm/leave/:id/edit',
    name: 'hrm-leave-edit',
    component: () => import('@/pages/hrm/leave/LeaveEdit.vue'),
  },
  // Payroll
  {
    path: '/hrm/payroll',
    name: 'hrm-payroll',
    component: () => import('@/pages/hrm/payroll/PayrollList.vue'),
  },
  {
    path: '/hrm/payroll/create',
    name: 'hrm-payroll-create',
    component: () => import('@/pages/hrm/payroll/PayrollCreate.vue'),
  },
  {
    path: '/hrm/payroll/:id',
    name: 'hrm-payroll-detail',
    component: () => import('@/pages/hrm/payroll/PayrollDetail.vue'),
  },
  {
    path: '/hrm/payroll/:id/edit',
    name: 'hrm-payroll-edit',
    component: () => import('@/pages/hrm/payroll/PayrollEdit.vue'),
  },
  // Recruitment
  {
    path: '/hrm/recruitment',
    name: 'hrm-recruitment',
    component: () => import('@/pages/hrm/recruitment/RecruitmentList.vue'),
  },
  {
    path: '/hrm/recruitment/create',
    name: 'hrm-recruitment-create',
    component: () => import('@/pages/hrm/recruitment/RecruitmentCreate.vue'),
  },
  {
    path: '/hrm/recruitment/:id',
    name: 'hrm-recruitment-detail',
    component: () => import('@/pages/hrm/recruitment/RecruitmentDetail.vue'),
  },
  {
    path: '/hrm/recruitment/:id/edit',
    name: 'hrm-recruitment-edit',
    component: () => import('@/pages/hrm/recruitment/RecruitmentEdit.vue'),
  },
  // Performance
  {
    path: '/hrm/performance',
    name: 'hrm-performance',
    component: () => import('@/pages/hrm/performance/PerformanceList.vue'),
  },
  {
    path: '/hrm/performance/create',
    name: 'hrm-performance-create',
    component: () => import('@/pages/hrm/performance/PerformanceCreate.vue'),
  },
  {
    path: '/hrm/performance/:id/edit',
    name: 'hrm-performance-edit',
    component: () => import('@/pages/hrm/performance/PerformanceEdit.vue'),
  },
  // Training
  {
    path: '/hrm/training',
    name: 'hrm-training',
    component: () => import('@/pages/hrm/training/TrainingList.vue'),
  },
  {
    path: '/hrm/training/create',
    name: 'hrm-training-create',
    component: () => import('@/pages/hrm/training/TrainingCreate.vue'),
  },
  {
    path: '/hrm/training/:id/edit',
    name: 'hrm-training-edit',
    component: () => import('@/pages/hrm/training/TrainingEdit.vue'),
  },
  // Assets
  {
    path: '/hrm/assets',
    name: 'hrm-assets',
    component: () => import('@/pages/hrm/assets/AssetList.vue'),
  },
  {
    path: '/hrm/assets/create',
    name: 'hrm-asset-create',
    component: () => import('@/pages/hrm/assets/AssetCreate.vue'),
  },
  {
    path: '/hrm/assets/:id/edit',
    name: 'hrm-asset-edit',
    component: () => import('@/pages/hrm/assets/AssetEdit.vue'),
  },
  // Documents
  {
    path: '/hrm/documents',
    name: 'hrm-documents',
    component: () => import('@/pages/hrm/documents/DocumentList.vue'),
  },
  {
    path: '/hrm/documents/create',
    name: 'hrm-document-create',
    component: () => import('@/pages/hrm/documents/DocumentCreate.vue'),
  },
  {
    path: '/hrm/documents/:id/edit',
    name: 'hrm-document-edit',
    component: () => import('@/pages/hrm/documents/DocumentEdit.vue'),
  },
  // Expenses
  {
    path: '/hrm/expenses',
    name: 'hrm-expenses',
    component: () => import('@/pages/hrm/expenses/ExpenseList.vue'),
  },
  {
    path: '/hrm/expenses/create',
    name: 'hrm-expense-create',
    component: () => import('@/pages/hrm/expenses/ExpenseCreate.vue'),
  },
  {
    path: '/hrm/expenses/:id/edit',
    name: 'hrm-expense-edit',
    component: () => import('@/pages/hrm/expenses/ExpenseEdit.vue'),
  },
  // Announcements
  {
    path: '/hrm/announcements',
    name: 'hrm-announcements',
    component: () => import('@/pages/hrm/announcements/AnnouncementList.vue'),
  },
  {
    path: '/hrm/announcements/create',
    name: 'hrm-announcement-create',
    component: () => import('@/pages/hrm/announcements/AnnouncementCreate.vue'),
  },
  {
    path: '/hrm/announcements/:id/edit',
    name: 'hrm-announcement-edit',
    component: () => import('@/pages/hrm/announcements/AnnouncementEdit.vue'),
  },
  // Calendar
  {
    path: '/hrm/calendar',
    name: 'hrm-calendar',
    component: () => import('@/pages/hrm/HrmCalendar.vue'),
  },
  // Reports
  {
    path: '/hrm/reports',
    name: 'hrm-reports',
    component: () => import('@/pages/hrm/HrmReports.vue'),
  },
]

export default routes

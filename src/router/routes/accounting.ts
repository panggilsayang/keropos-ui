import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/accounting',
    name: 'accounting-dashboard',
    component: () => import('@/pages/accounting/AccountingDashboard.vue'),
  },
  {
    path: '/accounting/coa',
    name: 'chart-of-accounts',
    component: () => import('@/pages/accounting/ChartOfAccounts.vue'),
  },
  {
    path: '/accounting/journals',
    name: 'journal-entries',
    component: () => import('@/pages/accounting/JournalEntries.vue'),
  },
  {
    path: '/accounting/ledger',
    name: 'general-ledger',
    component: () => import('@/pages/accounting/GeneralLedger.vue'),
  },
  {
    path: '/accounting/statements',
    name: 'financial-statements',
    component: () => import('@/pages/accounting/FinancialStatements.vue'),
  },
  {
    path: '/accounting/tax',
    name: 'tax-management',
    component: () => import('@/pages/accounting/TaxManagement.vue'),
  },
]

export default routes

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Component,
  BarChart3,
  FileText,
  Settings,
  Users,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  RectangleHorizontal,
  CreditCard,
  Tag,
  TextCursorInput,
  ListFilter,
  ToggleLeft,
  CircleUser,
  Table,
  Layers,
  AlertCircle,
  Activity,
  Gauge,
  Bone,
  Shield,
  Key,
  Contact,
  Kanban,
  Calendar,
  Store,
  Monitor,
  Package,
  UsersRound,
  Wallet,
  ReceiptText,
  BadgePercent,
  BookOpen,
  Landmark,
  ScrollText,
  BookText,
  FileSpreadsheet,
  Calculator,
  Receipt,
  FilePlus,
  Clock,
  AlertOctagon,
} from '@lucide/vue'
import type { Component as VueComponent } from 'vue'

interface MenuItem {
  icon: VueComponent
  label: string
  to?: string
  children?: { icon: VueComponent; label: string; to: string }[]
}

interface Props {
  collapsed: boolean
}

defineProps<Props>()

const route = useRoute()

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  {
    icon: Component,
    label: 'Components',
    children: [
      { icon: RectangleHorizontal, label: 'Button', to: '/examples/button' },
      { icon: CreditCard, label: 'Card', to: '/examples/card' },
      { icon: Tag, label: 'Badge', to: '/examples/badge' },
      { icon: TextCursorInput, label: 'Input', to: '/examples/input' },
      { icon: ListFilter, label: 'Select', to: '/examples/select' },
      { icon: ToggleLeft, label: 'Toggle', to: '/examples/toggle' },
      { icon: CircleUser, label: 'Avatar', to: '/examples/avatar' },
      { icon: Table, label: 'Table', to: '/examples/table' },
      { icon: Layers, label: 'Modal', to: '/examples/modal' },
      { icon: AlertCircle, label: 'Alert', to: '/examples/alert' },
      { icon: Activity, label: 'Progress', to: '/examples/progress' },
      { icon: Gauge, label: 'Stat Card', to: '/examples/stat-card' },
      { icon: BarChart3, label: 'Charts', to: '/examples/charts' },
      { icon: Bone, label: 'Skeleton', to: '/examples/skeleton' },
      { icon: Layers, label: 'Tabs', to: '/examples/tabs' },
      { icon: Calendar, label: 'Date Picker', to: '/examples/datepicker' },
      { icon: LayoutDashboard, label: 'Grid', to: '/examples/grid' },
      { icon: ChevronRight, label: 'Pagination', to: '/examples/pagination' },
    ],
  },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: Contact, label: 'Clients', to: '/clients' },
  {
    icon: Receipt,
    label: 'Invoices',
    children: [
      { icon: Receipt, label: 'All Invoices', to: '/invoices' },
      { icon: Clock, label: 'Unpaid', to: '/invoices/unpaid' },
      { icon: AlertOctagon, label: 'Overdue', to: '/invoices/overdue' },
      { icon: FilePlus, label: 'Create Invoice', to: '/invoices/create' },
    ],
  },
  { icon: Kanban, label: 'Projects', to: '/projects' },
  {
    icon: Users,
    label: 'User Management',
    children: [
      { icon: Users, label: 'Users', to: '/users' },
      { icon: Shield, label: 'Roles', to: '/users/roles' },
      { icon: Key, label: 'Permissions', to: '/users/permissions' },
    ],
  },
  { icon: ShoppingCart, label: 'Orders', to: '/orders' },
  {
    icon: Store,
    label: 'Point of Sales',
    children: [
      { icon: LayoutDashboard, label: 'POS Dashboard', to: '/pos' },
      { icon: Monitor, label: 'POS Terminal', to: '/pos/terminal' },
      { icon: Package, label: 'Stock', to: '/pos/stock' },
      { icon: UsersRound, label: 'Customers', to: '/pos/customers' },
      { icon: Wallet, label: 'Cash Drawer', to: '/pos/cash-drawer' },
      { icon: BadgePercent, label: 'Discounts', to: '/pos/discounts' },
      { icon: ReceiptText, label: 'Reports', to: '/pos/reports' },
    ],
  },
  { icon: FileText, label: 'Reports', to: '/reports' },
  {
    icon: BookOpen,
    label: 'Accounting',
    children: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/accounting' },
      { icon: Landmark, label: 'Chart of Accounts', to: '/accounting/coa' },
      { icon: ScrollText, label: 'Journal Entries', to: '/accounting/journals' },
      { icon: BookText, label: 'General Ledger', to: '/accounting/ledger' },
      { icon: FileSpreadsheet, label: 'Financial Statements', to: '/accounting/statements' },
      { icon: Calculator, label: 'Tax', to: '/accounting/tax' },
    ],
  },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

const openMenus = ref<Set<string>>(new Set())

// Auto-open parent menus based on current route
function getInitialOpenMenus(): Set<string> {
  const set = new Set<string>()
  for (const item of menuItems) {
    if (item.children && item.children.some((child) => route.path === child.to)) {
      set.add(item.label)
    }
  }
  return set
}
openMenus.value = getInitialOpenMenus()

function toggleMenu(label: string) {
  if (openMenus.value.has(label)) {
    openMenus.value.delete(label)
  } else {
    openMenus.value.add(label)
  }
}

function isActive(to: string) {
  return route.path === to
}

function isParentActive(item: MenuItem) {
  if (item.children) {
    return item.children.some((child) => route.path === child.to)
  }
  return false
}
</script>

<template>
  <aside
    class="fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-[width] duration-200 z-50 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
    :class="collapsed ? 'w-[4.5rem]' : 'w-64'"
  >
    <div
      class="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-gray-100 dark:border-gray-700"
    >
      <div
        class="w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
      >
        P
      </div>
      <span
        v-if="!collapsed"
        class="font-bold text-lg text-gray-900 whitespace-nowrap dark:text-gray-100"
        >Purdia</span
      >
    </div>

    <nav class="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
      <template v-for="item in menuItems" :key="item.label">
        <!-- Regular link (no children) -->
        <router-link
          v-if="!item.children"
          :to="item.to!"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 text-sm font-medium transition-all duration-150 whitespace-nowrap no-underline hover:no-underline dark:text-gray-400"
          :class="
            isActive(item.to!)
              ? 'bg-primary-50 text-primary-600 hover:bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400'
              : 'hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-200'
          "
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>

        <!-- Dropdown parent (has children) -->
        <div v-else>
          <button
            class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer"
            :class="
              isParentActive(item)
                ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            "
            @click="toggleMenu(item.label)"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span v-if="!collapsed" class="flex-1 text-left">{{ item.label }}</span>
            <ChevronDown
              v-if="!collapsed"
              class="w-4 h-4 shrink-0 transition-transform duration-200"
              :class="openMenus.has(item.label) ? 'rotate-180' : ''"
            />
          </button>

          <!-- Submenu -->
          <div
            v-if="!collapsed"
            class="overflow-hidden transition-all duration-200"
            :class="openMenus.has(item.label) ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="ml-4 pl-3 border-l border-gray-200 mt-1 space-y-0.5 dark:border-gray-700">
              <router-link
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap no-underline hover:no-underline"
                :class="
                  isActive(child.to)
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                "
              >
                <component :is="child.icon" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ child.label }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </nav>
  </aside>
</template>

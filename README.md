# Purdia

Modern, full-featured admin dashboard built with Vue 3, TypeScript, and Tailwind CSS 4. Designed for business applications that need a polished UI out of the box — from point-of-sale systems to accounting modules.

## ✨ Highlights

- **20+ UI Components** — Buttons, Cards, Tables, Modals, Selects, Date Pickers, Pagination, and more. All built from scratch, no external UI library.
- **Dark Mode** — Full light/dark theme support across every component. Per-user preference saved to localStorage.
- **Authentication** — Login, Register, Forgot Password pages with route guards. Mock auth ready for backend integration.
- **Point of Sale** — Complete POS terminal with product grid, favorites, inline discounts, multi-payment method support (Cash, Card, E-Wallet), and pagination.
- **Invoice Management** — CRUD invoices with line items, tax calculation, status tracking, and filtered views (unpaid, overdue).
- **Accounting** — Chart of Accounts, Journal Entries, General Ledger, Financial Statements, Tax Management.
- **User Management** — Users, Roles, Permissions with full CRUD modals.
- **Client Management** — Client list, detail, create, edit with type badges and avatars.
- **Project Management** — Kanban board with drag-and-drop, task detail views.

## 🧱 Component Library

All components live in `src/components/ui/` with full TypeScript props, variants, and sizes.

| Component   | Variants                                                      |
| ----------- | ------------------------------------------------------------- |
| Button      | primary, secondary, success, warning, danger, ghost, outline  |
| Card        | default, bordered, elevated, flat + flush mode                |
| Table       | default, striped, bordered + searchable, sortable, expandable |
| Badge       | primary, secondary, success, warning, danger, info            |
| Input       | default, filled, underlined                                   |
| Select      | single, multiple, remote/ajax, searchable, clearable          |
| Modal       | sm, md, lg, xl, full                                          |
| Alert       | info, success, warning, danger                                |
| Pagination  | default, simple, minimal, jumper                              |
| Tabs        | default, pills, underline, bordered                           |
| Date Picker | date, time, datetime, range                                   |
| Toggle      | sm, md, lg                                                    |
| Progress    | primary, success, warning, danger + striped, animated         |
| Skeleton    | text, circle, rect, button, avatar, badge, input              |
| Avatar      | xs, sm, md, lg, xl + circle, rounded, square                  |
| Dropdown    | 7 color variants + teleported positioning                     |
| Charts      | Line, Bar, Doughnut (Chart.js)                                |

## 🛠 Tech Stack

- **Vue 3.5** — Composition API, `<script setup>`
- **TypeScript 6** — Full type safety
- **Tailwind CSS 4** — Utility-first with custom theme tokens
- **Pinia** — State management (auth, theme)
- **Vue Router 5** — File-based route modules with navigation guards
- **Chart.js + vue-chartjs** — Data visualization
- **Lucide Icons** — 1000+ clean icons
- **Vite 8** — Lightning-fast dev server and build

## 📁 Project Structure

```
src/
├── assets/          # Global CSS (Tailwind config, dark mode)
├── components/
│   ├── ui/          # Reusable UI component library
│   ├── charts/      # Chart wrappers (Line, Bar, Doughnut)
│   └── layout/      # DashboardLayout, SidebarNav, TopBar
├── pages/
│   ├── auth/        # Login, Register, Forgot Password
│   ├── accounting/  # Chart of Accounts, Journals, Ledger, Statements, Tax
│   ├── clients/     # Client CRUD
│   ├── invoices/    # Invoice CRUD + Unpaid/Overdue views
│   ├── pos/         # POS Terminal, Dashboard, Stock, Customers, Discounts, Reports
│   ├── projects/    # Kanban, Task Detail
│   ├── users/       # Users, Roles, Permissions
│   └── examples/    # Component showcase pages
├── router/          # Route modules per feature
└── stores/          # Pinia stores (auth, theme)
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check and build for production
npm run build

# Preview production build
npm run preview
```

## 🔐 Authentication

Mock auth is enabled — any email/password combination works. After login, all dashboard routes are protected. Theme preference is saved per-user (by email) and persists across sessions.

**Default flow:**

1. Visit any page → redirected to `/login`
2. Enter any email + password → lands on dashboard
3. Dark/light mode toggle in top nav → saved per user
4. Logout → returns to login, theme preference retained for next login

## 🌗 Dark Mode

Toggle via the moon/sun icon in the top navigation bar. The theme:

- Respects system preference on first visit
- Persists per-user to localStorage
- Applies globally via CSS class strategy (no per-component overhead)

## 📄 License

MIT License — free to use, modify, and distribute.

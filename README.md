<h1 align="center">Purdia</h1>

<p align="center">
Modern Vue 3 Admin Dashboard built with TypeScript & Tailwind CSS 4.
</p>

<p align="center">
<img src="https://img.shields.io/github/license/anggagewor/purdia">
<img src="https://img.shields.io/github/stars/anggagewor/purdia">
<img src="https://img.shields.io/github/issues/anggagewor/purdia">
<img src="https://img.shields.io/badge/Vue-3.5-42b883">
<img src="https://img.shields.io/badge/Tailwind-v4-38bdf8">
</p>

# Purdia

Modern, full-featured admin dashboard built with Vue 3, TypeScript, and Tailwind CSS 4. Designed for business applications that need a polished UI out of the box — from point-of-sale systems to accounting modules.

## ✨ Highlights

- **25+ UI Components** — Buttons, Cards, Tables, Modals, Selects, Date Pickers, Pagination, Breadcrumb, File Upload, WYSIWYG Editor, Toast Notifications, and more. All built from scratch (editor uses Tiptap), no external UI library.
- **Dark Mode** — Full light/dark theme support across every component. Per-user preference saved to localStorage.
- **Theming** — 8 primary color options (Indigo, Blue, Emerald, Rose, Amber, Teal, Violet, Slate) switchable from the top bar. Per-user preference persisted.
- **Categorized Sidebar** — Components organized into categories (Form, Display, Navigation, Layout) with nested collapsible submenus.
- **Secure Storage** — Sensitive data (auth tokens, user info) encrypted with AES-GCM via Web Crypto API before storing to localStorage.
- **HTTP Helper** — Pre-configured Axios instance with token injection, silent token refresh, error normalization, multi-backend support, and convenience methods (get, post, upload, download).
- **Toast Notifications** — Global toast system with auto-dismiss, progress bar, variants (success/error/warning/info). API errors automatically surface as toasts.
- **Composables** — Reusable `useApi` (loading/error/data state), `usePagination` (search, sort, filters, auto-refetch), `useToast` (programmatic notifications).
- **Authentication** — Login, Register, Forgot Password pages with async route guards. Silent token refresh on 401 before falling back to logout. Mock auth ready for backend integration.
- **Point of Sale** — Complete POS terminal with product grid, favorites, inline discounts, multi-payment method support (Cash, Card, E-Wallet), and pagination.
- **Invoice Management** — CRUD invoices with line items, tax calculation, status tracking, and filtered views (unpaid, overdue).
- **Accounting** — Chart of Accounts, Journal Entries, General Ledger, Financial Statements, Tax Management.
- **User Management** — Users, Roles, Permissions with full CRUD modals.
- **Client Management** — Client list, detail, create, edit with type badges and avatars.
- **Project Management** — Kanban board with drag-and-drop, task detail views.
- **Collapsible Sidebar** — Icon-only mode with flyout popover submenus on hover/click. Nested category navigation for component library.

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
| Breadcrumb  | chevron, slash, dot separators + sm, md, lg sizes + icons     |
| File Upload | dropzone, input, compact + progress, cancel, retry, validate  |
| Editor      | minimal, default, full (Tiptap WYSIWYG) + sm, md, lg sizes    |
| Toast       | success, error, warning, info + auto-dismiss, progress bar    |

### Component Categories

Components in the sidebar are organized into categories:

| Category   | Components                                                               |
| ---------- | ------------------------------------------------------------------------ |
| Form       | Input, Select, Toggle, Date Picker, File Upload, Editor                  |
| Display    | Card, Badge, Avatar, Table, Alert, Progress, Stat Card, Skeleton, Charts |
| Navigation | Button, Tabs, Pagination, Breadcrumb                                     |
| Layout     | Modal, Grid                                                              |

## 🛠 Tech Stack

- **Vue 3.5** — Composition API, `<script setup>`
- **TypeScript 6** — Full type safety
- **Tailwind CSS 4** — Utility-first with custom theme tokens via CSS variables
- **Pinia** — State management (auth, theme, toast)
- **Vue Router 5** — File-based route modules with async navigation guards
- **Axios** — HTTP client with interceptors, multi-service config
- **Chart.js + vue-chartjs** — Data visualization
- **Tiptap** — Headless WYSIWYG editor (ProseMirror-based)
- **Lucide Icons** — 1000+ clean icons
- **Vite 8** — Lightning-fast dev server and build

## 📁 Project Structure

```
src/
├── assets/          # Global CSS (Tailwind config, dark mode, color themes)
├── components/
│   ├── ui/          # Reusable UI component library
│   ├── charts/      # Chart wrappers (Line, Bar, Doughnut)
│   └── layout/      # DashboardLayout, SidebarNav, TopBar
├── composables/
│   ├── useApi.ts    # Generic loading/error/data composable
│   ├── usePagination.ts  # Paginated list with search, sort, filters
│   └── useToast.ts  # Programmatic toast notifications
├── lib/
│   ├── config.ts    # Multi-backend API configuration
│   ├── crypto.ts    # Secure storage (AES-GCM encrypt/decrypt)
│   └── http.ts      # Axios instance factory with interceptors + silent refresh
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
└── stores/          # Pinia stores (auth, theme, toast)
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

Mock auth is enabled — any email/password combination works. After login, all dashboard routes are protected. Auth tokens are encrypted before being stored in localStorage using AES-GCM (Web Crypto API).

**Default flow:**

1. Visit any page → redirected to `/login`
2. Enter any email + password → lands on dashboard
3. Refresh page → session persists (async decrypt on init)
4. Logout → encrypted tokens cleared, returns to login

**Token refresh:**

When a request returns 401, the interceptor automatically attempts a silent refresh using the stored `refresh_token` before falling back to logout. Concurrent requests are queued and retried once the new token is available. Expected refresh endpoint: `POST /api/auth/refresh`.

## 🌐 HTTP Helper

Located in `src/lib/http.ts`. Pre-configured for backend integration:

- **Auto token injection** — Bearer token from encrypted storage on every request
- **Silent token refresh** — On 401, automatically attempts refresh before logging out. Queues concurrent requests during refresh.
- **Multi-backend support** — Configure multiple services in `src/lib/config.ts`
- **Error normalization** — Consistent `ApiError` object (message, errors, status)
- **Auto toast on errors** — Network errors, 403, 419, 429, 500+ show toast automatically. 422 validation errors are left for form-level handling.
- **Common status handling** — 403, 419 (CSRF), 422 (validation), 429 (rate limit), 500+
- **Convenience methods** — `get`, `post`, `put`, `patch`, `del`, `upload`, `download`

```ts
import { get, post, upload } from '@/lib/http'
import { useHttp } from '@/lib/http'

// Default (main) service
const { data } = await get<Product[]>('/products')

// Different backend service
const paymentApi = useHttp('payment')
await paymentApi.post('/charge', { amount: 50000 })
```

Adding a new backend service:

```ts
// src/lib/config.ts
const configs = {
  main: { baseURL: '/api', timeout: 30_000 },
  payment: { baseURL: 'https://payment.example.com/v1', timeout: 60_000 },
}
```

## 🧩 Composables

Located in `src/composables/`. Extract common async patterns so pages stay clean.

### `useApi`

Generic composable for any API call — manages loading, error, and data refs.

```ts
import { useApi } from '@/composables'
import { get, post } from '@/lib/http'

// Fetch data
const { data: client, loading, error, execute } = useApi((id) => get<Client>(`/clients/${id}`))
await execute(clientId)

// Mutation with callback
const { execute: save, loading: saving } = useApi((payload) => post<Client>('/clients', payload), {
  onSuccess: (data) => toast.success('Saved!'),
})
```

### `usePagination`

Paginated list with reactive search, sort, filters, and auto-refetch on page change.

```ts
import { usePagination } from '@/composables'

const {
  data: clients,
  loading,
  currentPage,
  perPage,
  search,
  totalPages,
  totalItems,
  sortBy,
  sortDir,
  filters,
  refresh,
} = usePagination<Client>('/clients')

// Works directly with BasePagination:
// <BasePagination v-model:current-page="currentPage" :total-pages="totalPages" />
```

### `useToast`

Programmatic toast notifications from any component or composable.

```ts
import { useToast } from '@/composables'

const toast = useToast()
toast.success('Data berhasil disimpan!')
toast.error('Gagal memuat data.')
toast.warning('Stok hampir habis.')
toast.info('Update tersedia.')
```

## 🎨 Theming

### Dark / Light Mode

Toggle via the moon/sun icon in the top navigation bar. The theme:

- Respects system preference on first visit
- Persists per-user to localStorage
- Applies globally via CSS class strategy

### Primary Color

Click the palette icon in the top bar to switch between 8 color schemes:

| Color   | Preview |
| ------- | ------- |
| Indigo  | Default |
| Blue    | Cool    |
| Emerald | Fresh   |
| Rose    | Warm    |
| Amber   | Golden  |
| Teal    | Calm    |
| Violet  | Bold    |
| Slate   | Neutral |

Colors are implemented via CSS custom properties in `src/assets/main.css`. Tailwind's `primary-*` utilities automatically follow the selected theme. Preference is persisted per-user.

## 🔒 Secure Storage

Sensitive data (tokens, user info) is never stored as plain text in localStorage. The `src/lib/crypto.ts` module provides:

- **AES-GCM encryption** via Web Crypto API
- **PBKDF2 key derivation** (100k iterations + random salt per write)
- **Tamper detection** — corrupted data is auto-cleared
- **Simple API** — `secureSet(key, value)`, `secureGet(key)`, `secureRemove(key)`

## 📄 License

MIT License — free to use, modify, and distribute.

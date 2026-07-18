// Tauri IPC bridge to the in-process `pos-terminal` core embedded by
// apps/purdia/src-tauri (see crates/pos-terminal/src/boot.rs). Types here
// are hand-mirrored from `pos_core`'s Rust structs (crates/pos-core/src) —
// same precedent as apps/pos_flutter/rust's BridgeProduct/BridgeTransaction
// mirrors, just JSON instead of a codegen'd FFI boundary.
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface Product {
  id: string
  name: string
  price: number
  category_id: string | null
  description: string | null
  sort_order: number
  is_available: boolean
  is_archived: boolean
  synced_ms: number | null
  image_url: string | null
  sku: string | null
  cost_price: number | null
  tax_rate: number | null
  parent_id: string | null
}

export interface Category {
  id: string
  name: string
  sort_order: number
  is_archived: boolean
  synced_ms: number | null
}

export interface Inventory {
  product_id: string
  qty: number
  updated_ms: number
}

export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  multi_select: boolean
  min_select: number
  max_select: number | null
  synced_ms: number | null
}

export interface ModifierOption {
  id: string
  group_id: string
  name: string
  price_delta: number
  product_id: string | null
  sort_order: number
  is_available: boolean
  synced_ms: number | null
}

export type PaymentMethod = 'cash' | 'card' | 'qris_static' | 'qris_dynamic' | 'bank_va' | 'bank_manual'
export type PaymentStatus = 'paid' | 'pending'

export interface LineItem {
  product_id: string
  name: string
  price: number
  qty: number
}

export interface Transaction {
  id: string
  items: LineItem[]
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_id: string | null
  paid_ms: number
  synced: boolean
}

export const terminal = {
  listProducts: () => invoke<Product[]>('list_products'),
  listCategories: () => invoke<Category[]>('list_categories'),
  listInventory: () => invoke<Inventory[]>('list_inventory'),
  listModifierGroups: () => invoke<ModifierGroup[]>('list_modifier_groups'),
  listModifierOptions: (groupId: string) =>
    invoke<ModifierOption[]>('list_modifier_options', { groupId }),
  // Rust returns `Vec<(Uuid, i32)>` — serde tuples serialize as JSON arrays.
  getProductModifierGroups: (productId: string) =>
    invoke<[string, number][]>('get_product_modifier_groups', { productId }),
  checkout: (tx: Transaction) => invoke<Transaction>('checkout', { tx }),
}

// Mirrors `pos_sync::SyncEvent`'s externally-tagged, snake_case serde shape.
// Only the gossip half is forwarded by src-tauri today (see lib.rs) — a
// peer's inventory delta, not durable catalog changes (new/renamed
// products). Any event here is treated as "something changed, refetch",
// not replayed as a delta client-side.
export type SyncEventPayload =
  | { inventory_adjusted: { product_id: string; delta: number; updated_ms: number } }
  | { product_updated: Product }
  | { product_removed: { product_id: string } }

export function onSyncEvent(handler: (event: SyncEventPayload) => void): Promise<UnlistenFn> {
  return listen<SyncEventPayload>('pos://sync-event', (e) => handler(e.payload))
}

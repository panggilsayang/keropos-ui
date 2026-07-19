//! Tauri Android shell for `apps/purdia`'s POS terminal page, embedding
//! `pos-terminal`'s Rust core in-process (same pattern as
//! `apps/pos_flutter/rust`'s `flutter_rust_bridge` bridge, extended to also
//! wire `pos-sync`/iroh — which the Flutter bridge deliberately omits).

use std::sync::Arc;

use futures::StreamExt;
use pos_terminal::api::AppState;
use pos_terminal::boot::{boot, BootPaths, ServerSettings};
use tauri::{Emitter, Manager};

/// The `BootPaths` used at startup, kept around so the settings commands can
/// re-read/rewrite `terminal.toml` without re-deriving the app data dir.
struct ConfigPaths(BootPaths);

#[tauri::command]
async fn list_products(state: tauri::State<'_, AppState>) -> Result<Vec<pos_core::Product>, String> {
    state.inventory.list_products().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_categories(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<pos_core::Category>, String> {
    state.catalog.list_categories().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_inventory(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<pos_core::Inventory>, String> {
    state.inventory.list_inventory().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_modifier_groups(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<pos_core::ModifierGroup>, String> {
    state.catalog.list_modifier_groups().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_modifier_options(
    state: tauri::State<'_, AppState>,
    group_id: uuid::Uuid,
) -> Result<Vec<pos_core::ModifierOption>, String> {
    state
        .catalog
        .list_modifier_options(group_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_product_modifier_groups(
    state: tauri::State<'_, AppState>,
    product_id: uuid::Uuid,
) -> Result<Vec<(uuid::Uuid, i32)>, String> {
    state
        .catalog
        .get_product_modifier_groups(product_id)
        .await
        .map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
struct ServerSettingsView {
    server_url: String,
    store_id: String,
}

#[tauri::command]
async fn get_server_settings(
    paths: tauri::State<'_, ConfigPaths>,
) -> Result<ServerSettingsView, String> {
    let s = pos_terminal::boot::read_server_settings(&paths.0).map_err(|e| e.to_string())?;
    Ok(ServerSettingsView {
        server_url: s.server_url,
        store_id: s.store_id.to_string(),
    })
}

/// Persists to `terminal.toml` immediately, but only takes effect on the
/// *next* app launch — `OrderService` (and everything else in `AppState`)
/// is already constructed with the old values baked in for this process's
/// lifetime. The frontend tells the cashier to restart the app.
#[tauri::command]
async fn save_server_settings(
    paths: tauri::State<'_, ConfigPaths>,
    server_url: String,
    store_id: String,
) -> Result<(), String> {
    let store_id = uuid::Uuid::parse_str(&store_id).map_err(|e| format!("invalid store id: {e}"))?;
    pos_terminal::boot::write_server_settings(&paths.0, &ServerSettings { server_url, store_id })
        .map_err(|e| e.to_string())
}

#[derive(serde::Serialize, serde::Deserialize)]
struct PendingOrderItem {
    product_id: uuid::Uuid,
    name: String,
    price: i64,
    qty: i64,
}

#[derive(serde::Serialize)]
struct PendingOrder {
    id: uuid::Uuid,
    table_id: uuid::Uuid,
    customer_name: Option<String>,
    items: Vec<PendingOrderItem>,
    subtotal: i64,
    status: String,
    created_ms: i64,
}

/// Mirrors `pos-api`'s order row shape closely enough to deserialize it —
/// `items` is stored (and returned) as a JSON *string*, not a nested value,
/// so it needs a second `serde_json::from_str` pass after the outer parse.
#[derive(serde::Deserialize)]
struct RawOrderRow {
    id: uuid::Uuid,
    table_id: uuid::Uuid,
    customer_name: Option<String>,
    items: String,
    subtotal: i64,
    status: String,
    created_ms: i64,
}

#[tauri::command]
async fn list_pending_orders(state: tauri::State<'_, AppState>) -> Result<Vec<PendingOrder>, String> {
    let raw = state.order.pull_pending().await.map_err(|e| e.to_string())?;
    raw.into_iter()
        .map(|v| {
            let row: RawOrderRow = serde_json::from_value(v).map_err(|e| e.to_string())?;
            let items: Vec<PendingOrderItem> =
                serde_json::from_str(&row.items).map_err(|e| e.to_string())?;
            Ok(PendingOrder {
                id: row.id,
                table_id: row.table_id,
                customer_name: row.customer_name,
                items,
                subtotal: row.subtotal,
                status: row.status,
                created_ms: row.created_ms,
            })
        })
        .collect()
}

#[tauri::command]
async fn list_tables(state: tauri::State<'_, AppState>) -> Result<Vec<pos_core::Table>, String> {
    state.order.list_tables().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn ack_pending_order(
    state: tauri::State<'_, AppState>,
    order_id: uuid::Uuid,
) -> Result<(), String> {
    state.order.ack_order(order_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn finalize_pending_order(
    state: tauri::State<'_, AppState>,
    order_id: uuid::Uuid,
    transaction_id: uuid::Uuid,
) -> Result<(), String> {
    state
        .order
        .finalize_order(order_id, transaction_id)
        .await
        .map_err(|e| e.to_string())
}

/// Mirrors the validation `crates/pos-terminal/src/api/transactions.rs`
/// applies before calling `TransactionService::checkout` — duplicated here
/// because this command is now a second driving adapter for the same use
/// case. Worth moving into `TransactionService::checkout` itself in a
/// follow-up so both adapters share one copy; not done here.
#[tauri::command]
async fn checkout(
    state: tauri::State<'_, AppState>,
    tx: pos_core::Transaction,
) -> Result<pos_core::Transaction, String> {
    if tx.items.is_empty() || tx.items.iter().any(|i| i.qty <= 0 || i.price <= 0) || tx.total <= 0 {
        return Err(
            "items must not be empty, all items must have qty > 0 and price > 0, and total must be > 0"
                .to_string(),
        );
    }
    state
        .transactions
        .checkout(tx.clone())
        .await
        .map_err(|e| e.to_string())?;
    Ok(tx)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_spp_printer::init())
        .setup(|app| {
            let base_dir = std::env::var_os("PURDIA_DATA_DIR")
                .map(std::path::PathBuf::from)
                .unwrap_or_else(|| {
                    app.path()
                        .app_data_dir()
                        .expect("resolve app data dir")
                });
            std::fs::create_dir_all(&base_dir).expect("create app data dir");
            tracing::info!(dir = %base_dir.display(), "purdia terminal data dir");

            let paths = BootPaths::under(&base_dir);

            // First run: `TerminalConfig::dev_defaults()` (used when no
            // `terminal.toml` exists) sets `db_url = "sqlite:terminal.db"` —
            // a relative path that resolves against the process cwd, which
            // isn't a writable/meaningful location on Android. Write a
            // minimal `terminal.toml` pointing at an absolute path inside
            // this app's own data dir before booting, so sqlx can actually
            // open the file. Only done once; a real provisioning flow can
            // overwrite this file later (see `POST /provision` handling).
            if !paths.config.exists() {
                let db_path = base_dir.join("terminal.db");
                let toml = format!(
                    "listen = \"127.0.0.1:4000\"\ndb_url = \"sqlite:{}?mode=rwc\"\nserver_url = \"http://127.0.0.1:3000\"\nstore_id = \"00000000-0000-0000-0000-000000000000\"\nterminal_id = \"{}\"\nseed_demo = true\n",
                    db_path.display(),
                    uuid::Uuid::new_v4(),
                );
                std::fs::write(&paths.config, toml).expect("write initial terminal.toml");
            }

            let booted = tauri::async_runtime::block_on(boot(&paths)).expect("boot terminal core");

            app.manage(booted.state.clone());
            app.manage(ConfigPaths(paths));

            // No HTTP server spawned here: this is a single tablet's embedded
            // terminal, not a daemon other devices dial into. If a LAN-facing
            // provisioning flow (`POST /provision` from an owner's phone) is
            // needed later, wire `pos_terminal::api::router` + axum back in
            // then — not needed for the single-terminal case this app serves.

            // Forward realtime iroh sync events to the frontend so it can
            // refetch on peer changes. This is a *separate* subscription from
            // `SyncService`'s own internal apply loop (verified: `IrohSync`'s
            // subscribe wraps a `tokio::sync::broadcast` sender, so each
            // `.subscribe()` call gets its own receiver — this doesn't steal
            // events from the apply loop). Only the gossip half
            // (`SyncEvent`) is forwarded; the durable reconcile stream
            // (`ReconcileEvent` — new/renamed products from a peer) isn't
            // exposed outside `SyncService` today, so the UI won't
            // auto-refresh on catalog changes made by a peer, only on
            // inventory deltas from a peer sale. Follow-up, not v1 scope.
            if let Some(backend) = booted.sync_backend.clone() {
                let app_handle = app.handle().clone();
                let backend: Arc<dyn pos_sync::SyncBackend> = backend;
                tauri::async_runtime::spawn(async move {
                    let mut stream = backend.subscribe();
                    while let Some(event) = stream.next().await {
                        let _ = app_handle.emit("pos://sync-event", &event);
                    }
                    tracing::warn!("sync-event forwarding stream ended");
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_products,
            list_categories,
            list_inventory,
            list_modifier_groups,
            list_modifier_options,
            get_product_modifier_groups,
            checkout,
            get_server_settings,
            save_server_settings,
            list_pending_orders,
            list_tables,
            ack_pending_order,
            finalize_pending_order,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

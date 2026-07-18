//! Tauri plugin wrapping classic Bluetooth SPP (RFCOMM) printing for ESC/POS
//! thermal receipt printers. Android only — ports the logic of
//! `apps/pos-web/android/.../SppPrinterPlugin.java` (a Capacitor plugin) to
//! Tauri's plugin shape; the Kotlin side lives in
//! `android/src/main/kotlin/.../SppPrinterPlugin.kt`.
//!
//! Desktop compiles (`cargo check` on host) succeed — `setup()` only calls
//! `register_android_plugin` under `#[cfg(target_os = "android")]` — but the
//! commands panic if ever invoked there (`SppPrinterHandle` is never
//! `.manage()`d). That's fine: `apps/purdia`'s frontend only reaches these
//! from the Android-gated `/pos/terminal` page.

use serde::Serialize;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, State, Wry,
};

#[cfg(target_os = "android")]
use tauri::plugin::PluginHandle;

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct PairedDevice {
    pub address: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct ListPairedResponse {
    pub devices: Vec<PairedDevice>,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
struct AddressArg<'a> {
    address: &'a str,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
struct WriteArgs<'a> {
    address: &'a str,
    data: &'a [u8],
}

struct SppPrinterHandle(#[cfg(target_os = "android")] PluginHandle<Wry>);

#[tauri::command]
async fn list_paired(state: State<'_, SppPrinterHandle>) -> Result<ListPairedResponse, String> {
    #[cfg(target_os = "android")]
    {
        state.0.run_mobile_plugin("listPaired", ()).map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = state;
        Err("SPP printing is only available on Android".to_string())
    }
}

#[tauri::command]
async fn connect(state: State<'_, SppPrinterHandle>, address: String) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        state
            .0
            .run_mobile_plugin::<serde_json::Value>("connect", AddressArg { address: &address })
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (state, address);
        Err("SPP printing is only available on Android".to_string())
    }
}

#[tauri::command]
async fn write(state: State<'_, SppPrinterHandle>, address: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        state
            .0
            .run_mobile_plugin::<serde_json::Value>("write", WriteArgs { address: &address, data: &data })
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (state, address, data);
        Err("SPP printing is only available on Android".to_string())
    }
}

#[tauri::command]
async fn disconnect(state: State<'_, SppPrinterHandle>, address: String) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        state
            .0
            .run_mobile_plugin::<serde_json::Value>("disconnect", AddressArg { address: &address })
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (state, address);
        Err("SPP printing is only available on Android".to_string())
    }
}

pub fn init() -> TauriPlugin<Wry> {
    Builder::<Wry>::new("spp-printer")
        .invoke_handler(tauri::generate_handler![list_paired, connect, write, disconnect])
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            {
                let handle = _api.register_android_plugin("com.kaya.purdia.sppprinter", "SppPrinterPlugin")?;
                _app.manage(SppPrinterHandle(handle));
            }
            #[cfg(not(target_os = "android"))]
            {
                _app.manage(SppPrinterHandle());
            }
            Ok(())
        })
        .build()
}

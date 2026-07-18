const COMMANDS: &[&str] = &["list_paired", "connect", "write", "disconnect"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}

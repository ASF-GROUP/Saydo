pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("Failed to start ASF Docket. Please check your system configuration and try again.");
}

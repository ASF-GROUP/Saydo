use std::sync::Mutex;
use tauri::Manager;

/// Holds the sidecar child process so we can kill it on exit.
struct ServerProcess(Mutex<Option<std::process::Child>>);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // In dev mode, the `beforeDevCommand` (pnpm dev:full) already starts
            // the API server via concurrently. Only spawn the server in release builds.
            #[cfg(not(debug_assertions))]
            {
                spawn_api_server(app)?;
            }

            #[cfg(debug_assertions)]
            {
                // In dev mode, just manage an empty state so on_exit doesn't panic.
                let _ = app;
                app.manage(ServerProcess(Mutex::new(None)));
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Failed to build ASF Saydo.")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit = event {
                // Kill the sidecar server process
                if let Some(state) = app.try_state::<ServerProcess>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                            println!("API server process killed");
                        }
                    }
                }
            }
        });
}

/// Spawn the API server as a Node.js child process (release builds only).
#[cfg(not(debug_assertions))]
fn spawn_api_server(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Determine the database path: <AppData>/ASF Saydo/saydo.db
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to resolve app data directory");
    let db_dir = app_data_dir.join("ASF Saydo");
    std::fs::create_dir_all(&db_dir).ok();
    let db_path = db_dir.join("saydo.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    // Resolve the project root (where package.json and node_modules live).
    let resource_dir = app
        .path()
        .resource_dir()
        .unwrap_or_else(|_| std::env::current_dir().unwrap());

    let project_root = if resource_dir.join("package.json").exists() {
        resource_dir.clone()
    } else if resource_dir
        .parent()
        .map_or(false, |p| p.join("package.json").exists())
    {
        resource_dir.parent().unwrap().to_path_buf()
    } else {
        std::env::current_dir().unwrap()
    };

    // Spawn `node --import tsx src/server.ts`
    let child = std::process::Command::new("node")
        .args(["--import", "tsx", "src/server.ts"])
        .current_dir(&project_root)
        .env("DB_PATH", &db_path_str)
        .env("API_PORT", "4822")
        .spawn();

    match child {
        Ok(child) => {
            println!(
                "API server started (DB: {}, CWD: {})",
                db_path_str,
                project_root.display()
            );
            app.manage(ServerProcess(Mutex::new(Some(child))));
        }
        Err(e) => {
            eprintln!(
                "Failed to start API server: {} (CWD: {})",
                e,
                project_root.display()
            );
            app.manage(ServerProcess(Mutex::new(None)));
        }
    }

    Ok(())
}

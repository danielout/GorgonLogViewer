use notify::{Event, EventKind, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

struct WatchState {
    watchers: HashMap<String, notify::RecommendedWatcher>,
    offsets: HashMap<String, u64>,
}

#[tauri::command]
fn get_default_log_path() -> Option<String> {
    let local_low = dirs::data_local_dir()?;
    // data_local_dir returns AppData/Local on Windows; we need LocalLow
    let local_low = local_low.parent()?.join("LocalLow");
    let player_log = local_low
        .join("Elder Game")
        .join("Project Gorgon")
        .join("Player.log");
    if player_log.exists() {
        Some(player_log.to_string_lossy().to_string())
    } else {
        None
    }
}

#[tauri::command]
fn read_log_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
fn start_tailing(path: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<Mutex<WatchState>>();
    let mut state = state.lock().map_err(|e| e.to_string())?;

    // Already watching this file
    if state.watchers.contains_key(&path) {
        return Ok(());
    }

    // Record current file size as offset so we only emit new content
    let file_len = fs::metadata(&path)
        .map(|m| m.len())
        .unwrap_or(0);
    state.offsets.insert(path.clone(), file_len);

    let watch_path = path.clone();
    let event_path = path.clone();
    let app_handle = app.clone();

    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            if matches!(event.kind, EventKind::Modify(_)) {
                let app = app_handle.clone();
                let path = event_path.clone();
                // Read new bytes from the file
                let state = app.state::<Mutex<WatchState>>();
                let mut state = match state.lock() {
                    Ok(s) => s,
                    Err(_) => return,
                };
                let offset = state.offsets.get(&path).copied().unwrap_or(0);
                if let Ok(mut file) = fs::File::open(&path) {
                    let new_len = file.metadata().map(|m| m.len()).unwrap_or(0);
                    if new_len > offset {
                        if file.seek(SeekFrom::Start(offset)).is_ok() {
                            let mut buf = vec![0u8; (new_len - offset) as usize];
                            if file.read_exact(&mut buf).is_ok() {
                                let new_content = String::from_utf8_lossy(&buf).to_string();
                                let _ = app.emit("tail-update", serde_json::json!({
                                    "path": path,
                                    "content": new_content,
                                }));
                            }
                        }
                        state.offsets.insert(path, new_len);
                    }
                }
            }
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Watch the parent directory (some editors write to a temp file then rename)
    let parent = std::path::Path::new(&watch_path)
        .parent()
        .ok_or("No parent directory")?;
    watcher
        .watch(parent, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch: {}", e))?;

    state.watchers.insert(path, watcher);
    Ok(())
}

#[tauri::command]
fn stop_tailing(path: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<Mutex<WatchState>>();
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.watchers.remove(&path);
    state.offsets.remove(&path);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .manage(Mutex::new(WatchState {
            watchers: HashMap::new(),
            offsets: HashMap::new(),
        }))
        .invoke_handler(tauri::generate_handler![
            get_default_log_path,
            read_log_file,
            start_tailing,
            stop_tailing
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

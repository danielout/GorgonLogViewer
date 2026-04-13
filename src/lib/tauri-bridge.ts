import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Get the default Player.log path if it exists */
export async function getDefaultLogPath(): Promise<string | null> {
  return invoke<string | null>("get_default_log_path");
}

/** Read a log file's full content via the Rust backend */
export async function readLogFile(path: string): Promise<string> {
  return invoke<string>("read_log_file", { path });
}

/** Start watching a file for new content */
export async function startTailing(path: string): Promise<void> {
  return invoke("start_tailing", { path });
}

/** Stop watching a file */
export async function stopTailing(path: string): Promise<void> {
  return invoke("stop_tailing", { path });
}

export interface TailUpdate {
  path: string;
  content: string;
}

/** Listen for tail updates from the backend */
export async function onTailUpdate(
  callback: (update: TailUpdate) => void
): Promise<UnlistenFn> {
  return listen<TailUpdate>("tail-update", (event) => {
    callback(event.payload);
  });
}

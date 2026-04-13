import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Get the default Player.log path if it exists */
export async function getDefaultLogPath(): Promise<string | null> {
  return invoke<string | null>("get_default_log_path");
}

/** Get the Project Gorgon AppData directory path */
export async function getPgAppdataPath(): Promise<string | null> {
  return invoke<string | null>("get_pg_appdata_path");
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

/** List files and directories at a given path */
export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", { path });
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

export interface SampleFile {
  name: string;
  path: string;
  category: string;
}

/** List bundled sample files */
export async function listSampleFiles(): Promise<SampleFile[]> {
  return invoke<SampleFile[]>("list_sample_files");
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

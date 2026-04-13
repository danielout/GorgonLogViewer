import { invoke } from "@tauri-apps/api/core";

/** Read a log file's full content via the Rust backend */
export async function readLogFile(path: string): Promise<string> {
  return invoke<string>("read_log_file", { path });
}

# App Architecture Overview

## Stack

- **Desktop runtime:** Tauri v2 (Rust backend)
- **Frontend:** Vue 3 (Composition API + `<script setup>`) + TypeScript
- **Styling:** Tailwind CSS v4 with custom theme tokens
- **Build:** Vite 6
- **Routing:** Vue Router 4

## Project Structure

```
src/
  main.ts              — App entry: creates Vue app, registers router
  App.vue              — Root layout: sidebar + router-view
  styles.css           — Tailwind import + theme tokens (log type colors, UI colors)
  components/
    Sidebar.vue        — File list, open/close/select files
    FilterBar.vue      — Search (text/regex), type filter, timestamp range
    LogViewer.vue      — Virtual-scrolled log line renderer with syntax highlighting
  views/
    LogView.vue        — Main view: combines FilterBar + LogViewer, manages filter state
  lib/
    types.ts           — Shared TypeScript types (LogLine, OpenFile, FilterState, LogLineType)
    log-parser.ts      — Parses Player.log and Chat.log into structured LogLine arrays
    tauri-bridge.ts    — Wrappers around Tauri invoke() calls

src-tauri/
  src/lib.rs           — Tauri commands (read_log_file)
```

## Data Flow

1. User clicks "Open File" in Sidebar → triggers native file dialog via `@tauri-apps/plugin-dialog`
2. Selected file path is sent to Rust backend via `read_log_file` command
3. Raw content is parsed by `log-parser.ts` into `LogLine[]` (with timestamps, types, content)
4. `LogView` holds the filter state; `FilterBar` emits filter changes
5. Filtered lines are passed to `LogViewer` which renders them with virtual scrolling (only visible lines are in the DOM)
6. Each line is color-coded by its `LogLineType` using Tailwind theme tokens
7. Search matches are highlighted inline with `<mark>` tags

## Log Parsing

Two formats are supported, auto-detected by filename:

- **Player.log** — timestamps as `[HH:MM:SS]`, events classified by prefix (item, skill, system)
- **Chat logs** — timestamps as `YY-MM-DD HH:MM:SS`, classified by channel tag (`[Global]`, `[Help]`, etc.)

See [player-log-events.md](../log-parsing/player-log-events.md) for detailed event documentation.

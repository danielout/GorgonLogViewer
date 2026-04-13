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
  main.ts              — App entry: creates Vue app, registers router (/ and /paired routes)
  App.vue              — Root layout: sidebar + router-view, file open/close, tailing lifecycle
  styles.css           — Tailwind import + theme tokens (log type colors, UI colors)
  components/
    Sidebar.vue        — File list, open/close/select, view mode links, theme picker
    FilterBar.vue      — Search (text/regex), type filter, timestamp range, entity ID, tail toggle
    LogViewer.vue      — Virtual-scrolled log line renderer with syntax highlighting and hover tooltips
    LineTooltip.vue    — Tooltip displaying event reference info on hover
    JsonViewer.vue     — Top-level JSON file viewer
    JsonNode.vue       — Recursive collapsible tree node for JSON data
    ThemePicker.vue    — Theme selection dropdown with localStorage persistence
  views/
    LogView.vue        — Single-file view: FilterBar + LogViewer, manages filter state
    PairedView.vue     — Side-by-side view: two LogViewers with timestamp-synced scrolling
  lib/
    types.ts           — Shared TypeScript types (LogLine, OpenFile, FilterState, FileKind, LogLineType)
    log-parser.ts      — Parses Player.log and Chat.log into structured LogLine arrays (full + incremental)
    tauri-bridge.ts    — Wrappers around Tauri invoke() calls (read, tail start/stop, default path)
    event-reference.ts — Dev quick reference data: event names, summaries, field lists
    themes.ts          — Built-in theme definitions, apply/save/load helpers

src-tauri/
  src/lib.rs           — Tauri commands: read_log_file, start_tailing, stop_tailing, get_default_log_path
```

## Data Flow

1. On launch, checks for default Player.log via `get_default_log_path` and auto-opens with tailing
2. User can also open files via Sidebar → native file dialog (log, txt, json)
3. File content is read via Rust `read_log_file` command
4. Log/txt files are parsed by `log-parser.ts` into `LogLine[]`; JSON files go to `JsonViewer`
5. `LogView` holds filter state; `FilterBar` emits changes (search, type, time, entity ID)
6. Filtered lines are passed to `LogViewer` which renders via virtual scrolling
7. Each line is color-coded by `LogLineType` using theme tokens
8. Hovering a line shows a `LineTooltip` with event reference info
9. When tailing is active, Rust `notify` watcher emits new content via Tauri events; frontend appends parsed lines and auto-scrolls

## Live Tailing

The Rust backend uses the `notify` crate to watch files. On modify events, it reads bytes from the last known offset, emits new content via `tail-update` events, and the frontend parses/appends the new lines. The watcher monitors the parent directory to handle editors that write to temp files then rename.

## Paired Browsing

`PairedView` renders two `LogViewer` instances side by side. When sync scroll is enabled, scrolling one panel emits the timestamp of the center visible line; the other panel finds the closest matching timestamp and scrolls to it. Feedback loops are prevented via a `suppressEmit` flag.

## Themes

Three built-in themes (Catppuccin Mocha, Gorgon Dark, Light). Theme colors are applied as CSS custom properties on `:root`, which the Tailwind `@theme` tokens reference. Selection is persisted in `localStorage`.

## Log Parsing

Two formats are supported, auto-detected by filename:

- **Player.log** — timestamps as `[HH:MM:SS]`, events classified by prefix (item, skill, system)
- **Chat logs** — timestamps as `YY-MM-DD HH:MM:SS`, classified by channel tag (`[Global]`, `[Help]`, etc.)

See [player-log-events.md](../log-parsing/player-log-events.md) for detailed event documentation.

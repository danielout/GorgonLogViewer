# App Usage Guide

## Getting Started

On launch, Gorgon Log Viewer automatically opens `Player.log` from the Project Gorgon AppData directory and starts live tailing. The sidebar shows a file browser rooted at the PG data folder.

## Opening Files

- **File browser** (sidebar): Expand the Project Gorgon folder tree to browse Player.log, ChatLogs, Reports (inventory/character JSONs), etc. Click any file to open it.
- **Open File button** (sidebar): Opens a native file dialog for log, txt, and json files.
- **Add Folder** (sidebar file browser): Add custom directories that persist between sessions.

Supported file types:
- `.log` / `.txt` — Parsed as log files with timestamp detection, type classification, and syntax highlighting
- `.json` — Opens in a tree viewer with collapsible nodes, or a schema view that auto-analyzes the JSON structure

## Viewing Logs

### Columns

Each log line shows three columns:
- **Line number** — Original line number in the file
- **Timestamp** — Fixed-width column; empty for non-timestamped lines
- **Content** — The log line with syntax highlighting (numbers, strings, booleans, keywords)

### Status Bar

The top-right shows: `Ln 42 16:05:23 · 1500 / 5000 lines`
- Current line number and nearest timestamp
- Filtered line count / total line count
- Click it to open the **Go to Line** input

### Tooltips

Hover over any log line to see a tooltip with:
- Event name and description
- Field names and data types
- Click the tooltip to open the **Reference pane** scrolled to that event

## Filtering

### Search

The search box supports plain text and regex (toggle with the `.*` button). Matches are highlighted inline.

### Entity ID

Enter an entity ID to show only lines containing that ID — useful for tracking a specific NPC, player, or item instance across events.

### Time Range

Enter `From` and `To` timestamps (HH:MM:SS format) to limit the view to a time window.

### Event Filters (Row 2)

The second row shows category pills grouped by event type:
- **All** — Toggle everything on/off
- **Category pills** (Chat Channels, Combat, Items, etc.) — Click to toggle the entire category. Shows `3/5` when partially filtered.
- **Dropdown arrow** (▾) — Expand to toggle individual event types within the category (e.g., disable `ProcessSetAttributes` but keep `ProcessPlayerMount`)

### Sort Order

Click **↓ Oldest** / **↑ Newest** to reverse the display order.

### UTC / Local

Click **UTC** / **Local** to switch timestamp display between UTC and local time.

## Filter Configs

Click **Config** to open the filter configuration panel:
- **Built-in configs**: All Events, Chat Only, Items & Inventory, Skills & Crafting, NPC Interaction, Combat & Effects
- **Custom configs**: Create new configs with custom highlight rules (pattern + color)
- **Live preview**: Changes apply immediately
- **Export/Import**: Copy configs as JSON for sharing

## View Presets

Click **Presets** to save/load complete filter states:
- Saves: search text, enabled types, time range, entity ID, active filter config
- Export/import as JSON for sharing

## Live Tailing

Click **Tail** to start watching the file for changes. New lines appear at the bottom with auto-scroll. Works with all filters active.

## Paired View

Click **Paired View** in the sidebar to open two log files side-by-side:
- Select files from the dropdowns
- Enable **Sync scroll** to lock both panels together by timestamp
- Timestamps are normalized to UTC internally, so player.log and chat.log sync correctly regardless of timezone

## Reference Pane

Click **Reference** in the sidebar to open the searchable documentation pane:
- Browse by category (Items, Skills, NPC, Combat, etc.)
- Expand entries to see format strings, field tables, firing conditions, and notes
- Search across all entries by name, description, tags, or field names
- Generated from the docs at build time — always matches the parser

## JSON Viewer

When viewing a JSON file, toggle between:
- **Tree** — Collapsible tree with color-coded values (strings green, numbers orange, booleans purple)
- **Schema** — Auto-analyzed field table showing types, presence frequency, and sample values

## Themes

Click the theme picker in the sidebar to switch between:
- **Pleas** (dark, default)
- **Gorgon Dark** (deep blue)
- **Light**

Theme selection persists between sessions.

## Keyboard Shortcuts

- **Enter** in Go to Line input — Jump to line
- **Escape** in Go to Line input — Dismiss

# Gorgon Log Viewer

A desktop application for viewing and analyzing Project Gorgon log files — Player.log, Chat Logs, Inventory JSONs, and Character JSONs.

Built to help 3rd party app developers quickly search through logs and find the events relevant to them. Log files are often thousands of lines long with loads of information, and so a tool to alleviate some repetitive Notepad++ regex queries and the like was needed.

Filters and reference material in the app are built from the docs, so adding support for more events or more details is as simple as editing some markdown.

## Content Note and Thanks

- **Some portions copyright 2026 Elder Game, LLC**
- Huge thanks to Citan and co for providing information for us 3rd party devs.

## Features

- **Filtering** — By event type, timestamp range, entity ID, text/regex search
- **Event-level granularity** — Toggle individual Process events on/off, not just broad categories
- **Live tailing** — Watch logs in real-time with filters applied
- **Paired browsing** — Side-by-side player.log + chat.log with timestamp-synced scrolling
- **Dev quick reference** — Hover any line for event info; click to open the full reference
- **In-app reference pane** — Searchable documentation for all 110+ event types, generated from docs
- **Syntax highlighting** — Numbers, strings, booleans, and keywords colored for readability
- **JSON viewer** — Collapsible tree view + auto-generated schema analysis for CDN data
- **Themes** — Three built-in themes with full customization support
- **Filter configs & presets** — Save, share, and import filter setups as JSON
- **File browser** — Auto-discovers Project Gorgon AppData folder; supports custom directories

## Usage

See the [App Usage Guide](docs/app-usage.md) for details on filtering, paired view, reference pane, JSON viewer, themes, and more.

## Contributing

### Adding Event Documentation

The app's reference pane, tooltips, and filter categories are all generated from the markdown docs in `docs/log-parsing/`. Adding support for a new event type is as simple as documenting it in the right markdown file — no code changes needed for most cases.

See [Contributing Events](docs/contributing-events.md) for the full guide.

### Development Setup

```bash
npm install                  # install dependencies
npm run dev                  # start vite dev server
npm run tauri dev            # start full tauri app in dev mode
npm test                     # run tests
npm run build                # full build (generate + typecheck + vite)
```

### CI/CD

- **CI**: Runs on every push/PR to main — typecheck, tests, frontend build, cargo check
- **Release**: Push a `v*` tag to trigger a GitHub Actions build that creates a GitHub Release with Windows installers

## Commit Conventions

All commit messages should be prefixed with a tag that categorizes the change. This drives automatic release note generation via `npm run release-notes`.

| Prefix | Purpose | In release notes? |
|---|---|---|
| `feat:` | New features | Yes |
| `impv:` | Improvements to existing features | Yes |
| `fix:` | Bug fixes | Yes |
| `test:` | Testing-related changes | No |
| `docs:` | Documentation changes | No |
| `samples:` | Sample file changes | No |
| `chore:` | Housekeeping (CI, gitignore, deps, etc.) | No |

An optional scope in parentheses can follow the prefix to add context:

```
feat(parser): add support for ProcessRecipeComplete events
impv(viewer): improve virtual scroll performance for large files
fix(filter): regex search no longer crashes on invalid patterns
chore(deps): update Tauri to v2.1
```

### Cutting a Release

```bash
npm run release -- 0.2.0           # bump version, build, tag
npm run release -- 0.2.0 --dry-run # preview without changes
```

Or push a `v*` tag to let GitHub Actions build and publish the release automatically.

# Gorgon Log Viewer

# Overview 

A basic application for viewing Project Gorgon log files including:
- Player.log
- Chat Logs
- Inventory JSONs
- Character JSONs

The goal is to help 3rd party app developers have a way to quickly search through logs and find the events relevant to them, and filter out the ones that aren't. Log files are often thousands of lines long with loads of information, and so a tool to alleviate some repetitive Notepad++ regex queries and the like was needed.

Filters and reference material in the app is build from the docs, so adding support for more events or more details is as simple as editing some markdown.

## Content note and thanks!

- ** Some portions copyright 2026 Elder Game, LLC **
- Huge thanks to Citan and co for providing information for us 3rd party devs. 

## Features

- Timestamp Filtering: Pare down the log to specific timestamps.
- Content Filtering: Filter out unwanted line types.
- Live tailing with filters: watch logs live with your selected filters
- Quality search: full featured search supporting basic text, regex, and filtered.
- Paired browsing: Select a player.log and a chat.log and GLV will show them side by side, matching timestamps where possible.
- Dev quick reference: Find out about a message type just by hovering the line.
- Basic syntax highlighting for known message type
- Basic theme support: Configure custom colors for the ui and syntax highlighting
- CDN scheme references: how data is formatted in the CDN jsons for quick referencing.
- Anything you want to add!

## Settings

- Default Logs
  - Defaults to opening the Player.log found in `AppData/LocalLow/Elder Game/Project Gorgon/` and starting live tailing mode. This can be changed in settings.

## UsageSee the full [App Usage Guide](docs/app-usage.md) for details on filtering, paired view, reference pane, JSON viewer, themes, and more.## Contributing### Adding Event DocumentationThe app's reference pane, tooltips, and filter categories are all generated from the markdown docs in `docs/log-parsing/`. Adding support for a new event type is as simple as documenting it in the right markdown file — no code changes needed for most cases.See [Contributing Events](docs/contributing-events.md) for the full guide.### Development Setup```bashnpm install                  # install dependenciesnpm run dev                  # start vite dev servernpm run tauri dev            # start full tauri app in dev modenpm test                     # run testsnpm run build                # full build (generate + typecheck + vite)```### CI/CD- **CI**: Runs on every push/PR to main — typecheck, tests, frontend build, cargo check- **Release**: Push a `v*` tag to trigger a GitHub Actions build that creates a GitHub Release with Windows installers
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
docs(architecture): add data flow diagram
```

### Generating Release Notes

```bash
npm run release-notes                    # since last tag to HEAD
npm run release-notes -- v0.1.0          # since v0.1.0 to HEAD
npm run release-notes -- v0.1.0 v0.2.0   # between two tags
```

### Cutting a Release

```bash
npm run release -- 0.2.0           # bump version, build, tag
npm run release -- 0.2.0 --dry-run # preview without changes
```

The release script:
1. Validates a clean working tree (on main branch)
2. Bumps version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`
3. Generates release notes from commits since the last tag
4. Commits the version bump
5. Runs `npm run tauri build` to produce the distributable
6. Creates an annotated git tag `vX.Y.Z` with the release notes
7. Reports artifact locations in `src-tauri/target/release/bundle/`

After the script finishes, push the commit and tag:
```bash
git push origin main
git push origin vX.Y.Z
```

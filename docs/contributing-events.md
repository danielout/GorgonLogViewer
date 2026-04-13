# Adding Events to the Documentation

This guide explains how to document new Player.log event types so they automatically appear in the app's reference pane, tooltips, and filter categories.

## How It Works

The docs in `docs/log-parsing/` are the single source of truth. A build-time script parses them and generates TypeScript code that the app imports. When you document a new event in markdown, it shows up in the app automatically on the next build.

```
docs/log-parsing/*.md → scripts/generate-reference.ts → src/lib/generated/reference-entries.ts
                                                           ├── Reference pane entries
                                                           ├── Hover tooltips
                                                           └── Filter category pills
```

## Step-by-Step

### 1. Choose the right file

Events are organized by category. Pick the file that matches:

| File | Category |
|---|---|
| `items.md` | Inventory lifecycle (add, update, delete, storage) |
| `skills.md` | Skills, abilities, recipes, training, cooldowns |
| `npc-interaction.md` | NPC talk, gift, favor, barter |
| `player-status.md` | Attributes, mount, weather, death, pets |
| `effects.md` | Buffs and debuffs |
| `quests.md` | Quest lifecycle |
| `storage.md` | Storage vault operations |
| `vendors.md` | NPC vendor and barter |
| `world-ui.md` | Map, UI, guild, player shops, misc |
| `p2p-interaction.md` | Player-to-player trade and group |
| `engine.md` | Rendering, position updates, internal methods |
| `non-process-events.md` | Non-Process timestamped events |
| `startup-system.md` | Non-timestamped startup/init lines |

If your event doesn't fit any existing file, create a new one. The generator scans all `.md` files in the directory automatically.

### 2. Write the event entry

Use this template — the generator parses the `###` header, code block, field table, and bold sections:

```markdown
### ProcessEventName — Short summary of what this does

\`\`\`
[HH:MM:SS] LocalPlayer: ProcessEventName(param1, param2, param3)
\`\`\`

| Field | Type | Meaning |
|---|---|---|
| `param1` | u32 | Description of the first parameter |
| `param2` | string | Description of the second parameter |
| `param3` | bool | Description of the third parameter |

**When it fires:**
- Condition 1
- Condition 2

**Key behavior:** Any important notes about how this event works.
```

#### What the generator extracts

| Section | Required? | What it becomes |
|---|---|---|
| `### Name — Summary` | Yes | Event name + tooltip summary |
| Code block | No | Format string in reference pane |
| Field table | No | Field list in reference pane + tooltip |
| `**When it fires:**` list | No | Firing conditions in reference pane |
| `**Key behavior:**`, `**Important:**`, etc. | No | Notes in reference pane |

### 3. Add the parser pattern (if needed)

If the event uses a new `LogLineType` or isn't caught by existing parser patterns, update `src/lib/log-parser.ts`:

- Add a regex to `PLAYER_EVENT_PATTERNS` or `NON_PROCESS_PATTERNS`
- If it's a new category, add the `LogLineType` to `src/lib/types.ts`

### 4. Add the category mapping (if needed)

If the event needs a specific reference category (different from the file's default), add it to `EVENT_CATEGORY` in `scripts/generate-reference.ts`.

### 5. Build and verify

```bash
npm run generate-reference   # regenerate the reference data
npm run build                # full build (also runs generate)
npm test                     # run tests
```

Check the console output to see how many events were parsed from each file.

## Creating a New Doc File

If you need a new category:

1. Create `docs/log-parsing/your-category.md` with a `# Title` header
2. Add `"Title": "Category Name"` to `TITLE_CATEGORY_MAP` in `scripts/generate-reference.ts`
3. Add `"Category Name": ["logLineType"]` to `CATEGORY_TO_LINE_TYPES` in the same file
4. Add `"Category Name"` to `CATEGORY_TAGS` for search tags
5. The generator will pick it up automatically on the next build

## Tips

- Look at existing entries for formatting examples
- Use backticks around field names in the table: `` `fieldName` ``
- The `Type` column in the field table feeds into the tooltip data type display
- Include sample log lines in code blocks for reference (only the first code block becomes the "format")
- Non-`Process*` events (like `OnAttackHitMe`, `UseAbility`) work too — just use `###` with the event name

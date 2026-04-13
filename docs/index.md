# Doc Index

## app-architecture/

- [overview.md](app-architecture/overview.md) — Stack, project structure, data flow, and key design decisions

## log-parsing/

Event reference docs, split by category. These are the source of truth — the app's reference pane and tooltips are generated from these files at build time via `npm run generate-reference`.

- [items.md](log-parsing/items.md) — Items & inventory events (AddItem, UpdateItemCode, DeleteItem, etc.)
- [skills.md](log-parsing/skills.md) — Skills, abilities, and recipe events
- [npc-interaction.md](log-parsing/npc-interaction.md) — NPC interaction events (talk, gift, favor, etc.)
- [player-status.md](log-parsing/player-status.md) — Player attributes, weather, mount, combat, equipment
- [effects.md](log-parsing/effects.md) — Effects and buffs (add, remove, name updates)
- [quests.md](log-parsing/quests.md) — Quest lifecycle events
- [storage.md](log-parsing/storage.md) — Storage vault events
- [vendors.md](log-parsing/vendors.md) — NPC vendor events
- [world-ui.md](log-parsing/world-ui.md) — Map, UI, guild, error, titles, and misc events
- [p2p-interaction.md](log-parsing/p2p-interaction.md) — Player-to-player trade and group events
- [engine.md](log-parsing/engine.md) — Engine/rendering events, entity state, and stack-trace-only entries
- [patterns.md](log-parsing/patterns.md) — Practical multi-event patterns and architecture notes
- [log-todo.md](log-parsing/log-todo.md) — Tracking remaining log format documentation work

## cdn-reference/

- [cdn-todo.md](cdn-reference/cdn-todo.md) — Tracking CDN JSON schema documentation work

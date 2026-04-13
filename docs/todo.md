# GLV Todo

## Actionable Tasks

### Core Features (from README)
- live tailing: watch logs live with selected filters applied, auto-scroll to new lines
- paired browsing: open a player.log and chat.log side by side, matching timestamps where possible
- dev quick reference: hover a log line to see info about that message type
- theme support: configurable custom colors for UI and syntax highlighting
- CDN scheme references: quick-reference view for how data is formatted in CDN jsons
- default log path: on launch, auto-open Player.log from `AppData/LocalLow/Elder Game/Project Gorgon/` and start live tailing

### Viewer & Filtering
- filters: control what filters are available for toggling based on log type. we'll have to figure out a way to detect the type, but that shouldn't be too hard.
- open file: should support log, txt, and json
- jsons: need to support collapsing down sections
- player.log:
  - need to do a pass to figure out a good set of filters.
  - entities: need to be able to enter an entity id and find all lines with that id reference
- filter config: need a good way to be able to define filters and highlights for log lines that is easy to share/contribute/change.
  - can we support live edit for this? that would be cool to be able to see what your config changes are doing in real time
- view presets: create, edit, save, delete, share preset views for different types

### Packaging & Distribution
- should bundle the samples with the app when we build for illustrative purposes.
  - probably want to scrub these samples and make sure nothing has any incredibly personal information - particularly in tells in the chat logs. unlikely, but should double check.

### Done
- ~~setup automatic release note generation with commit tagging conventions~~


## Need Investigation

# GLV Todo

## Actionable Tasks

- filters: control what filters are available for toggling based on log type. we'll have to figure out a way to detect the type, but that shouldn't be too hard.
- open file: should support log, txt, and json
- jsons: need to support collapsing down sections
- player.log:
  - need to do a pass to figure out a good set of filters.
  - entities: need to be able to enter an entity id and find all lines with that id reference
- filter config: need a good way to be able to define filters and highlights for log lines that is easy to share/contribute/change.
  - can we support live edit for this? that would be cool to be able to see what your config changes are doing in real time
- view presets: create, edit, save, delete, share preset views for different types
- setup automatic release note generation:
  - feat: features
  - impv: improvements
  - fix: bugfixes
  - test: testing-related changes (not included in release notes)
  - docs: documentation changes (not included in release notes)
  - samples: sample changes (not included in release notes)
  - chore: release management, github actions, gitignore changes, etc - housekeeping stuff (not included in release notes)
- should bundle the samples with the app when we build for illustrative purposes.
  - probably want to scrub these samples and make sure nothing has any incredibly personal information - particularly in tells in the chat logs. unlikely, but should double check.


## Need Investigation
#!/usr/bin/env bash
#
# generate-release-notes.sh
#
# Generates release notes from git commit messages between two refs.
# Commits must use the project's tag prefixes (feat:, impv:, fix:, etc.).
# Only feat/impv/fix are included in release notes; test/docs/samples/chore are excluded.
#
# Usage:
#   ./scripts/generate-release-notes.sh                  # since last tag to HEAD
#   ./scripts/generate-release-notes.sh v0.1.0           # since v0.1.0 to HEAD
#   ./scripts/generate-release-notes.sh v0.1.0 v0.2.0   # between two tags

set -euo pipefail

FROM="${1:-}"
TO="${2:-HEAD}"

# If no FROM ref given, find the most recent tag
if [[ -z "$FROM" ]]; then
  FROM=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  if [[ -z "$FROM" ]]; then
    # No tags exist yet — use the root commit
    FROM=$(git rev-list --max-parents=0 HEAD)
  fi
fi

# Collect commits (subject line only) between the two refs
COMMITS=$(git log "$FROM".."$TO" --pretty=format:"%s" --no-merges)

if [[ -z "$COMMITS" ]]; then
  echo "No commits found between $FROM and $TO."
  exit 0
fi

# Categorize
FEATURES=""
IMPROVEMENTS=""
FIXES=""
UNCATEGORIZED=""

while IFS= read -r line; do
  # Match prefix (case-insensitive), with optional scope in parens
  if [[ "$line" =~ ^[Ff]eat(\(.*\))?:\ *(.*) ]]; then
    FEATURES+="- ${BASH_REMATCH[2]}"$'\n'
  elif [[ "$line" =~ ^[Ii]mpv(\(.*\))?:\ *(.*) ]]; then
    IMPROVEMENTS+="- ${BASH_REMATCH[2]}"$'\n'
  elif [[ "$line" =~ ^[Ff]ix(\(.*\))?:\ *(.*) ]]; then
    FIXES+="- ${BASH_REMATCH[2]}"$'\n'
  elif [[ "$line" =~ ^([Tt]est|[Dd]ocs|[Ss]amples|[Cc]hore)(\(.*\))?:\ * ]]; then
    # Excluded from release notes
    :
  else
    UNCATEGORIZED+="- $line"$'\n'
  fi
done <<< "$COMMITS"

# Output
echo "# Release Notes"
echo ""

if [[ -n "$FEATURES" ]]; then
  echo "## Features"
  echo ""
  echo -n "$FEATURES"
  echo ""
fi

if [[ -n "$IMPROVEMENTS" ]]; then
  echo "## Improvements"
  echo ""
  echo -n "$IMPROVEMENTS"
  echo ""
fi

if [[ -n "$FIXES" ]]; then
  echo "## Bug Fixes"
  echo ""
  echo -n "$FIXES"
  echo ""
fi

if [[ -n "$UNCATEGORIZED" ]]; then
  echo "## Other"
  echo ""
  echo -n "$UNCATEGORIZED"
  echo ""
fi

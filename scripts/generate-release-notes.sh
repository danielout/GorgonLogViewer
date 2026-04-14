#!/usr/bin/env bash
#
# generate-release-notes.sh
#
# Generates release notes matching the glogger format:
# - Download table with platform-specific links
# - Categorized commits with short hashes
# - Commit count since last tag
#
# Usage:
#   ./scripts/generate-release-notes.sh 0.2.0              # for version 0.2.0
#   ./scripts/generate-release-notes.sh 0.2.0 v0.1.0       # since v0.1.0

set -euo pipefail

VERSION="${1:-}"
FROM="${2:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./scripts/generate-release-notes.sh <version> [from-tag]" >&2
  exit 1
fi

REPO="danielout/GorgonLogViewer"
TAG="v$VERSION"

# If no FROM ref given, find the most recent tag
if [[ -z "$FROM" ]]; then
  FROM=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  if [[ -z "$FROM" ]]; then
    FROM=$(git rev-list --max-parents=0 HEAD)
  fi
fi

# Download table
cat << EOF
## Downloads

| Platform | Installer |
|----------|-----------|
| **Windows** (recommended) | [GorgonLogViewer-${VERSION}-setup.exe](https://github.com/${REPO}/releases/download/${TAG}/GorgonLogViewer_${VERSION}_x64-setup.exe) |
| **Windows** (MSI) | [GorgonLogViewer-${VERSION}.msi](https://github.com/${REPO}/releases/download/${TAG}/GorgonLogViewer_${VERSION}_x64_en-US.msi) |

---

EOF

# Collect commits with hash
COMMIT_COUNT=0
FEATURES=""
IMPROVEMENTS=""
FIXES=""

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  COMMIT_COUNT=$((COMMIT_COUNT + 1))

  HASH=$(echo "$line" | cut -d' ' -f1)
  MSG=$(echo "$line" | cut -d' ' -f2-)

  if [[ "$MSG" =~ ^[Ff]eat(\(.*\))?:\ *(.*) ]]; then
    FEATURES+="- ${BASH_REMATCH[2]} (\`${HASH}\`)"$'\n'
  elif [[ "$MSG" =~ ^[Ii]mpv(\(.*\))?:\ *(.*) ]]; then
    IMPROVEMENTS+="- ${BASH_REMATCH[2]} (\`${HASH}\`)"$'\n'
  elif [[ "$MSG" =~ ^[Ff]ix(\(.*\))?:\ *(.*) ]]; then
    FIXES+="- ${BASH_REMATCH[2]} (\`${HASH}\`)"$'\n'
  fi
done <<< "$(git log "$FROM".."HEAD" --pretty=format:"%h %s" --no-merges)"

echo "## What's Changed since ${FROM}"
echo ""

if [[ -n "$FEATURES" ]]; then
  echo "### Features"
  echo -n "$FEATURES"
  echo ""
fi

if [[ -n "$IMPROVEMENTS" ]]; then
  echo "### Improvements"
  echo -n "$IMPROVEMENTS"
  echo ""
fi

if [[ -n "$FIXES" ]]; then
  echo "### Fixes"
  echo -n "$FIXES"
  echo ""
fi

echo "---"
echo "*${COMMIT_COUNT} commits since ${FROM}*"

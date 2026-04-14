#!/usr/bin/env bash
#
# release.sh — Trigger a release via GitHub Actions
#
# Usage:
#   ./scripts/release.sh 0.2.0           # trigger release workflow
#   ./scripts/release.sh 0.2.0 --local   # local build (no GitHub Actions)
#   ./scripts/release.sh 0.2.0 --dry-run # preview release notes only
#
# The recommended way to release is via GitHub Actions (default).
# The --local flag does a local build instead.

set -euo pipefail

VERSION="${1:-}"
MODE="${2:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./scripts/release.sh <version> [--dry-run|--local]"
  echo ""
  echo "  Default: triggers GitHub Actions release workflow"
  echo "  --local: builds locally instead of via CI"
  echo "  --dry-run: preview release notes only"
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be semver (e.g., 0.2.0)"
  exit 1
fi

# Preview release notes
echo "=== Release Notes Preview for v$VERSION ==="
echo ""
bash scripts/generate-release-notes.sh "$VERSION"
echo ""

if [[ "$MODE" == "--dry-run" ]]; then
  exit 0
fi

if [[ "$MODE" == "--local" ]]; then
  # Local build flow
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: Working tree not clean."
    git status --short
    exit 1
  fi

  echo "Bumping version to $VERSION..."
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
  sed -i "0,/^version = \"[^\"]*\"/s/^version = \"[^\"]*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

  git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
  git commit -m "chore(release): bump version to $VERSION"

  echo "Building..."
  npm run tauri build

  echo "Tagging v$VERSION..."
  NOTES=$(bash scripts/generate-release-notes.sh "$VERSION")
  git tag -a "v$VERSION" -m "$NOTES"

  echo ""
  echo "Done. Push with:"
  echo "  git push origin main && git push origin v$VERSION"
else
  # GitHub Actions flow (default)
  echo "Triggering GitHub Actions release for v$VERSION..."
  gh workflow run release.yml -f version="$VERSION"
  echo ""
  echo "Release workflow started. Track at:"
  echo "  https://github.com/danielout/GorgonLogViewer/actions"
fi

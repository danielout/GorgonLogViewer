#!/usr/bin/env bash
#
# release.sh — Cut a release build of Gorgon Log Viewer
#
# Usage:
#   ./scripts/release.sh 0.2.0           # bump to 0.2.0, build, tag
#   ./scripts/release.sh 0.2.0 --dry-run # show what would happen without doing it
#
# Steps:
#   1. Validates clean working tree
#   2. Bumps version in package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml
#   3. Generates release notes since last tag
#   4. Commits the version bump
#   5. Builds the Tauri app (npm run tauri build)
#   6. Creates a git tag
#   7. Reports artifact locations

set -euo pipefail

VERSION="${1:-}"
DRY_RUN=false

if [[ "$VERSION" == "" ]]; then
  echo "Usage: ./scripts/release.sh <version> [--dry-run]"
  echo "  e.g. ./scripts/release.sh 0.2.0"
  exit 1
fi

if [[ "${2:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[DRY RUN] Would release v$VERSION"
fi

# Validate version format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 0.2.0)"
  exit 1
fi

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Working tree is not clean. Commit or stash changes first."
  git status --short
  exit 1
fi

# Ensure we're on main
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
  echo "Warning: Not on main branch (currently on '$BRANCH')"
  read -p "Continue anyway? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if tag already exists
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "Error: Tag v$VERSION already exists"
  exit 1
fi

echo "=== Releasing v$VERSION ==="
echo ""

# --- Step 1: Generate release notes ---
echo "Generating release notes..."
RELEASE_NOTES=$(bash scripts/generate-release-notes.sh)
echo "$RELEASE_NOTES"
echo ""

if $DRY_RUN; then
  echo "[DRY RUN] Would bump version to $VERSION in:"
  echo "  - package.json"
  echo "  - src-tauri/tauri.conf.json"
  echo "  - src-tauri/Cargo.toml"
  echo "[DRY RUN] Would commit, build, and tag v$VERSION"
  exit 0
fi

# --- Step 2: Bump versions ---
echo "Bumping version to $VERSION..."

# package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json

# tauri.conf.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json

# Cargo.toml (only the package version, not dependency versions)
sed -i "0,/^version = \"[^\"]*\"/s/^version = \"[^\"]*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

echo "  package.json: $(grep '"version"' package.json | head -1 | xargs)"
echo "  tauri.conf.json: $(grep '"version"' src-tauri/tauri.conf.json | head -1 | xargs)"
echo "  Cargo.toml: $(grep '^version' src-tauri/Cargo.toml | head -1)"
echo ""

# --- Step 3: Commit version bump ---
echo "Committing version bump..."
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore(release): bump version to $VERSION"

# --- Step 4: Build ---
echo ""
echo "Building Tauri app..."
npm run tauri build

# --- Step 5: Tag ---
echo ""
echo "Creating tag v$VERSION..."
git tag -a "v$VERSION" -m "$(cat <<EOF
Release v$VERSION

$RELEASE_NOTES
EOF
)"

# --- Step 6: Report ---
echo ""
echo "=== Release v$VERSION complete ==="
echo ""
echo "Release notes:"
echo "$RELEASE_NOTES"
echo ""

# Find build artifacts
BUNDLE_DIR="src-tauri/target/release/bundle"
if [[ -d "$BUNDLE_DIR" ]]; then
  echo "Build artifacts:"
  find "$BUNDLE_DIR" -maxdepth 2 -type f \( -name "*.msi" -o -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" \) 2>/dev/null | while read -r f; do
    SIZE=$(du -h "$f" | cut -f1)
    echo "  $f ($SIZE)"
  done
fi

echo ""
echo "Next steps:"
echo "  git push origin main"
echo "  git push origin v$VERSION"

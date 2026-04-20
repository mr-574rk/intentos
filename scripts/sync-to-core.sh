#!/usr/bin/env bash
# sync-to-core.sh
# Syncs intentos/ai-engine → intentos-core/ai-engine, commits, and pushes
# both repos so Render automatically redeploys intentos-core.
# Usage: ./scripts/sync-to-core.sh [optional commit message]

set -e

INTENTOS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CORE_DIR="$(cd "$INTENTOS_DIR/../intentos-core" && pwd)"

AI_SRC="$INTENTOS_DIR/ai-engine/src"
AI_DEST="$CORE_DIR/ai-engine/src"

MSG="${1:-"sync: ai-engine updates from intentos"}"

echo "🔄  Syncing $AI_SRC → $AI_DEST"
rsync -av --checksum "$AI_SRC/" "$AI_DEST/"

echo ""
echo "📦  Committing intentos-core..."
cd "$CORE_DIR"
git add ai-engine/src/
if git diff --cached --quiet; then
  echo "   No changes in intentos-core — nothing to commit."
else
  git commit -m "$MSG"
  echo "   ✅  intentos-core committed."
fi

echo "🚀  Pushing intentos-core → origin (triggers Render redeploy)..."
git push origin main
echo "   ✅  intentos-core pushed. Render will redeploy automatically."

echo ""
echo "📦  Committing intentos (ai-engine source)..."
cd "$INTENTOS_DIR"
git add ai-engine/src/ scripts/
if git diff --cached --quiet; then
  echo "   No changes in intentos — nothing to commit."
else
  git commit -m "$MSG"
  git push origin main
  echo "   ✅  intentos committed and pushed."
fi

echo ""
echo "✅  Sync complete."

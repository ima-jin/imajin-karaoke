#!/bin/bash
# Build and restart karaoke
# Usage: ./scripts/build.sh [--prod|--dev]
#
# Defaults to auto-detect from cwd (~/prod → prod, else dev).

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Parse environment flag
ENV="auto"
for arg in "$@"; do
  case "$arg" in
    --prod) ENV="prod" ;;
    --dev)  ENV="dev" ;;
  esac
done

# Auto-detect from cwd if not specified
if [ "$ENV" = "auto" ]; then
  case "$REPO_ROOT" in
    */prod/*) ENV="prod" ;;
    *)        ENV="dev" ;;
  esac
fi

if [ "$ENV" = "prod" ]; then
  PM2_NAME="prod-karaoke"
  LABEL="PROD"
  MONOREPO_ROOT="$HOME/prod/imajin-ai"
else
  PM2_NAME="dev-karaoke"
  LABEL="DEV"
  MONOREPO_ROOT="$HOME/dev/imajin-ai"
fi

echo "=== [$LABEL] Karaoke build started: $(date) ==="

# Pull latest
echo "Pulling latest..."
git pull --ff-only || { echo "❌ git pull failed"; exit 1; }

# Install deps from monorepo root (karaoke is a pnpm workspace member via
# imajin-ai/pnpm-workspace.yaml and depends on @imajin/db@workspace:*)
# --ignore-scripts avoids husky/prepare failures in CI/deploy contexts
echo "Installing dependencies (from monorepo root)..."
cd "$MONOREPO_ROOT"
pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts
cd "$REPO_ROOT"

# Build
echo "Building..."
rm -rf .next
NODE_ENV=production npx next build || { echo "❌ Build failed"; exit 1; }

# Restart
echo "Restarting $PM2_NAME..."
pm2 restart "$PM2_NAME" || echo "⚠️  pm2 restart failed — is $PM2_NAME registered?"

echo "=== [$LABEL] Karaoke build complete: $(date) ==="

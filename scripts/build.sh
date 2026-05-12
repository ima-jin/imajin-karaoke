#!/bin/bash
# Build and restart karaoke
# Usage: ./scripts/build.sh [--prod|--dev]
#
# Defaults to auto-detect from cwd (~/prod → prod, else dev).

set -e
export NODE_ENV=production

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
else
  PM2_NAME="dev-karaoke"
  LABEL="DEV"
fi

echo "=== [$LABEL] Karaoke build started: $(date) ==="

# Pull latest
echo "Pulling latest..."
git pull --ff-only || { echo "❌ git pull failed"; exit 1; }

# Install deps
echo "Installing dependencies..."
pnpm install --frozen-lockfile || pnpm install

# Build
echo "Building..."
rm -rf .next
npx next build || { echo "❌ Build failed"; exit 1; }

# Restart
echo "Restarting $PM2_NAME..."
pm2 restart "$PM2_NAME" || echo "⚠️  pm2 restart failed — is $PM2_NAME registered?"

echo "=== [$LABEL] Karaoke build complete: $(date) ==="

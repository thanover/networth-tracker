#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# Railway project setup for networth-tracker
#
# Creates a Railway project with MongoDB, server, and client
# services, configures environment variables, and generates
# a public domain for the client.
#
# Prerequisites:
#   npm i -g @railway/cli   (or: brew install railway)
# ──────────────────────────────────────────────────────────

echo "=== Railway Preview Deployments Setup ==="
echo ""

# ── Pre-flight checks ────────────────────────────────────

if ! command -v railway &> /dev/null; then
  echo "Error: Railway CLI not found."
  echo "Install with:  npm i -g @railway/cli"
  echo "         or:   brew install railway"
  exit 1
fi

if ! railway whoami --json &> /dev/null 2>&1; then
  echo "Not logged in to Railway. Opening login..."
  railway login
fi

# ── Create project ───────────────────────────────────────

echo "Step 1/7: Creating Railway project..."
railway init

# ── Add services ─────────────────────────────────────────

echo ""
echo "Step 2/7: Adding MongoDB service..."
railway add mongodb

echo ""
echo "Step 3/7: Adding server service..."
railway add --service server

echo ""
echo "Step 4/7: Adding client service..."
railway add --service client

# ── Configure environment variables ──────────────────────

echo ""
echo "Step 5/7: Configuring server variables..."
JWT_SECRET=$(openssl rand -hex 32)
railway variables set \
  "JWT_SECRET=${JWT_SECRET}" \
  "NODE_ENV=production" \
  --service server

echo ""
echo "Step 6/7: Configuring client variables..."
railway variables set \
  "SERVER_HOST=server.railway.internal" \
  "SERVER_PORT=5000" \
  --service client

# ── Generate public domain ───────────────────────────────

echo ""
echo "Step 7/7: Generating public domain for client..."
railway domain --service client

# ── Done ─────────────────────────────────────────────────

echo ""
echo "=========================================="
echo " CLI setup complete!"
echo "=========================================="
echo ""
echo "Remaining steps in the Railway dashboard (railway open):"
echo ""
echo "  1. Connect services to this GitHub repo:"
echo "     - Click 'server' service > Settings > Source > Connect Repo"
echo "       Set Root Directory to:  /server"
echo "     - Click 'client' service > Settings > Source > Connect Repo"
echo "       Set Root Directory to:  /client"
echo ""
echo "  2. Add the MongoDB connection reference on server:"
echo '     - Server service > Variables > New Variable'
echo '     - Name:  MONGODB_URI'
echo '     - Value: ${{MongoDB.MONGO_URL}}'
echo "     (This dynamically resolves to MongoDB's internal URL)"
echo ""
echo "  3. Enable PR Environments:"
echo "     - Project Settings > Environments > Enable 'PR Environments'"
echo ""
echo "Once complete, every PR automatically gets a live preview URL."
echo "The environment is torn down when the PR is merged or closed."

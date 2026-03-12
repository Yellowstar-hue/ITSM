#!/bin/bash
# SimpleNow ITSM - Quick Setup Script

set -e

echo "╔═══════════════════════════════════════╗"
echo "║      SimpleNow ITSM - Setup           ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check prerequisites
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ $1 is required but not installed."
    exit 1
  fi
  echo "✅ $1 found"
}

echo "Checking prerequisites..."
check_command node
check_command npm
check_command docker

NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ is required (found: $(node -v))"
  exit 1
fi

echo ""
echo "1. Starting infrastructure (PostgreSQL + Redis)..."
docker compose -f docker/docker-compose.dev.yml up -d
echo "   Waiting for services to be ready..."
sleep 5

echo ""
echo "2. Installing dependencies..."
npm install

echo ""
echo "3. Setting up environment files..."
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "   Created apps/api/.env - please add your API keys"
fi
if [ ! -f apps/frontend/.env.local ]; then
  cp apps/frontend/.env.example apps/frontend/.env.local
  echo "   Created apps/frontend/.env.local"
fi

echo ""
echo "4. Running database migrations..."
cd apps/api && npm run migration:run 2>/dev/null || true && cd ../..

echo ""
echo "5. Seeding database with demo data..."
cd apps/api && npm run seed && cd ../..

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║     🎉 SimpleNow Setup Complete!          ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Start the application:"
echo "  npm run dev"
echo ""
echo "Access:"
echo "  Frontend:     http://localhost:3000"
echo "  API:          http://localhost:3001"
echo "  API Docs:     http://localhost:3001/api/docs"
echo "  DB Admin:     http://localhost:8080"
echo ""
echo "Demo credentials:"
echo "  Admin:  admin@simplenow.io / admin123"
echo "  Agent:  sarah.agent@simplenow.io / admin123"
echo ""

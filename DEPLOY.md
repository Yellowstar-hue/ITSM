# SimpleNow — Deployment Guide

## Stack
| Service | Platform | Free Tier |
|---------|----------|-----------|
| Frontend | Vercel | ✅ |
| API (NestJS) | Railway | ✅ 500h/mo |
| PostgreSQL | Neon | ✅ 0.5 GB |
| Redis | Upstash | ✅ 10k cmd/day |

---

## Step 1 — PostgreSQL on Neon

1. Go to [neon.tech](https://neon.tech) → Create project → name it `simplenow`
2. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
3. In the Neon SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

---

## Step 2 — Redis on Upstash

1. Go to [upstash.com](https://upstash.com) → Create Database → Region: closest to you
2. Copy the **Redis URL** (looks like `rediss://default:xxx@xxx.upstash.io:6379`)

---

## Step 3 — API on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select this repo, set **Root Directory** to `apps/api`
3. Railway will auto-detect Node.js and use `railway.json`
4. Add these **Environment Variables** in Railway dashboard:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=<your Neon connection string>
REDIS_URL=<your Upstash Redis URL>
JWT_SECRET=<generate a random 64-char string>
JWT_REFRESH_SECRET=<generate a different random 64-char string>
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
ANTHROPIC_API_KEY=<your key>
OPENAI_API_KEY=<optional>
FRONTEND_URL=https://<your-vercel-app>.vercel.app
```

5. After first deploy, run the seed in Railway's shell:
   ```bash
   node dist/database/seeds/index.js
   ```
   Or via Railway CLI: `railway run node dist/database/seeds/index.js`

6. Note your Railway public URL: `https://simplenow-api-xxx.railway.app`

---

## Step 4 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `apps/frontend`
3. Framework will be auto-detected as **Next.js**
4. Add these **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://<your-railway-url>.railway.app
NEXT_PUBLIC_WS_URL=https://<your-railway-url>.railway.app
```

5. Deploy — Vercel builds and hosts automatically.

---

## Step 5 — Connect CORS

Back in Railway, update `FRONTEND_URL` to your actual Vercel URL:
```
FRONTEND_URL=https://simplenow.vercel.app
```
Redeploy the API service (Railway does this automatically on env var change).

---

## Generating Secrets

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Demo Login

| Email | Password | Role |
|-------|----------|------|
| admin@simplenow.io | admin123 | Admin |
| sarah.agent@simplenow.io | admin123 | Agent |
| viewer@simplenow.io | admin123 | Viewer |

---

## Local Dev (no cloud needed)

```bash
# Start postgres + redis locally
docker compose -f docker/docker-compose.dev.yml up -d

# Copy env
cp apps/api/.env.example apps/api/.env

# Install & seed
npm install
npm run db:seed

# Run
npm run dev
# API  → http://localhost:3001
# App  → http://localhost:3000
```

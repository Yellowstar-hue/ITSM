# ── Stage 1: Build NestJS API ─────────────────────────────────────────────────
FROM node:20-alpine AS api-builder
WORKDIR /api

COPY apps/api/package.json ./
RUN npm install

COPY apps/api/ ./
RUN npx nest build

# ── Stage 2: Build Next.js frontend ───────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build --workspace=apps/frontend

# ── Stage 3: Combined runtime ──────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# API artifacts
COPY --from=api-builder /api/dist         ./api/dist
COPY --from=api-builder /api/node_modules ./api/node_modules
COPY --from=api-builder /api/package.json ./api/package.json

# Frontend artifacts
COPY --from=frontend-builder /app/node_modules           ./node_modules
COPY --from=frontend-builder /app/package.json           ./package.json
COPY --from=frontend-builder /app/packages               ./packages
COPY --from=frontend-builder /app/apps/frontend/.next    ./apps/frontend/.next
COPY --from=frontend-builder /app/apps/frontend/public   ./apps/frontend/public
COPY --from=frontend-builder /app/apps/frontend/package.json ./apps/frontend/package.json

COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
CMD ["./start.sh"]

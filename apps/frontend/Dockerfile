FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install all workspace deps
RUN npm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

ENV NEXT_TELEMETRY_DISABLED=1

# Build the frontend (output: standalone bundles all required node_modules)
RUN npm run build --workspace=apps/frontend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output includes its own node_modules — no separate copy needed
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]

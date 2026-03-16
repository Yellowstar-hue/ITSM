FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install all workspace deps — next.js gets hoisted to /app/node_modules
RUN npm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

ENV NEXT_TELEMETRY_DISABLED=1

# Build the frontend
RUN npm run build --workspace=apps/frontend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Recreate apps/frontend structure for: next start --dir apps/frontend
RUN mkdir -p apps/frontend
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json

# Copy hoisted node_modules (contains the next binary)
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/next start --dir apps/frontend -p ${PORT:-3000}"]

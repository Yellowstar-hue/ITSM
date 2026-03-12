FROM node:20-alpine

WORKDIR /app

# Copy ALL workspace package manifests so npm can resolve the full workspace graph
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/frontend/package.json ./apps/frontend/

# Install ALL deps (including devDeps needed for nest build)
# npm workspaces requires all workspace package.json files to be present
RUN npm ci --include=dev

# Copy only API and shared source — frontend is NOT needed for this service
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build only the API
RUN npm run build --workspace=apps/api

ENV NODE_ENV=production

WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/main"]

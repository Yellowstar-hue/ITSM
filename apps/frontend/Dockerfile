FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install all deps (next is in dependencies, not devDeps)
RUN npm install

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build frontend
RUN npm run build --workspace=apps/frontend

EXPOSE 3000

WORKDIR /app/apps/frontend

# next binary is at /app/node_modules/.bin/next (hoisted by npm workspaces)
CMD ["/app/node_modules/.bin/next", "start", "-p", "3000"]

FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install all deps (next is in dependencies, not devDeps — hoisted to /app/node_modules/.bin/next)
RUN npm install

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=apps/frontend

EXPOSE 3000

ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

WORKDIR /app/apps/frontend

CMD ["/app/node_modules/.bin/next", "start", "-p", "3000"]

FROM node:20-alpine

WORKDIR /app

# Only install API dependencies — no workspace complexity
COPY apps/api/package.json ./package.json

RUN npm install

# Copy API source
COPY apps/api/ ./

# Build (transpileOnly skips type checking, so this never fails on TS errors)
RUN npx nest build

ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/main"]

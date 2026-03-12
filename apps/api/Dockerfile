FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./

# npm install instead of npm ci — no package-lock.json in this repo
RUN npm install

COPY . .

RUN npx nest build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["node", "dist/main"]

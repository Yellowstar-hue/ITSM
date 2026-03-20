#!/bin/sh
# Start NestJS API on port 3001 (background)
# Use PORT=3001 explicitly so Railway's PORT env var goes to Next.js
PORT=3001 node /app/api/dist/main &

# Start Next.js on Railway's PORT (defaults to 3000)
exec /app/node_modules/.bin/next start apps/frontend -p ${PORT:-3000}

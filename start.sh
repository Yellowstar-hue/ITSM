#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — launches NestJS (port 3001) then Next.js (Railway PORT)
# Waits for NestJS to be fully ready before starting Next.js so that the
# first login attempt never hits a "connection refused" proxy 500.
# ─────────────────────────────────────────────────────────────────────────────

# 1. Start NestJS on internal port 3001
PORT=3001 node /app/api/dist/main &
API_PID=$!

echo "[start.sh] NestJS starting (PID $API_PID) on port 3001 ..."

# 2. Wait up to 90 s for the health endpoint to respond
WAIT=0
MAX=90
while [ $WAIT -lt $MAX ]; do
  # Use Node (always present) to make a quick HTTP check
  if node -e "
    const h = require('http');
    h.get('http://localhost:3001/api/health', r => {
      process.exit(r.statusCode >= 200 && r.statusCode < 500 ? 0 : 1);
    }).on('error', () => process.exit(1));
  " 2>/dev/null; then
    echo "[start.sh] NestJS ready after ${WAIT}s."
    break
  fi

  # Also bail early if the background process already died
  if ! kill -0 $API_PID 2>/dev/null; then
    echo "[start.sh] WARNING: NestJS process exited unexpectedly."
    break
  fi

  sleep 2
  WAIT=$((WAIT + 2))
  echo "[start.sh] Waiting for NestJS... ${WAIT}/${MAX}s"
done

if [ $WAIT -ge $MAX ]; then
  echo "[start.sh] WARNING: NestJS not ready after ${MAX}s — starting Next.js anyway."
fi

# 3. Start Next.js on Railway's PORT (injected by Railway as $PORT)
echo "[start.sh] Starting Next.js on port ${PORT:-3000} ..."
exec /app/node_modules/.bin/next start apps/frontend -p ${PORT:-3000}

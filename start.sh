#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Launch NestJS (port 3001) then wait for it before Next.js starts.
# Using wget (always in node:alpine via busybox) with -T for read timeout.
# ─────────────────────────────────────────────────────────────────────────────

# 1. Start NestJS on internal port 3001
PORT=3001 node /app/api/dist/main &
API_PID=$!
echo "[start.sh] NestJS PID=$API_PID listening on :3001"

# 2. Poll until NestJS health endpoint responds (max 120 s, 2 s between polls)
WAIT=0
MAX=120
READY=0
while [ $WAIT -lt $MAX ]; do
  # wget -T: read/connect timeout in seconds; -q: quiet; -O-: stdout (discard)
  if wget -q -T 3 -O /dev/null http://localhost:3001/api/health/ping 2>/dev/null; then
    echo "[start.sh] NestJS ready in ${WAIT}s"
    READY=1
    break
  fi
  # Abort wait if NestJS process died
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "[start.sh] NestJS process exited (PID $API_PID gone)"
    break
  fi
  sleep 2
  WAIT=$((WAIT + 2))
  echo "[start.sh] Waiting for NestJS ... ${WAIT}/${MAX}s"
done

if [ "$READY" -eq 0 ]; then
  echo "[start.sh] WARNING: NestJS not ready after ${MAX}s — Next.js will start anyway"
fi

# 3. Start Next.js on Railway's injected PORT (falls back to 3000)
echo "[start.sh] Starting Next.js on port ${PORT:-3000}"
exec /app/node_modules/.bin/next start apps/frontend -p ${PORT:-3000}

#!/usr/bin/env bash
set -euo pipefail

PORT=8000

if lsof -i tcp:${PORT} >/dev/null 2>&1; then
  echo "Killing process on port ${PORT}..."
  lsof -ti tcp:${PORT} | xargs kill -9 || true
fi

rm -rf node_modules/.vite

pnpm --version
node --version
pnpm exec vite --version

pnpm dev --host --port ${PORT} --strictPort --open=false &
DEV_PID=$!

cleanup() {
  if ps -p ${DEV_PID} >/dev/null 2>&1; then
    kill ${DEV_PID}
  fi
}
trap cleanup EXIT

sleep 5

curl -f http://localhost:${PORT}/ >/dev/null
curl -f http://localhost:${PORT}/@vite/client >/dev/null

echo "Dev server running on port ${PORT}. Perform a hard refresh in the browser and watch the terminal for /__client-log output."

wait ${DEV_PID}

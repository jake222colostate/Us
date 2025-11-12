#!/usr/bin/env bash
set -euo pipefail
LOG="/workspace/us-app/moderation-worker.log"
echo "== $(date -Is) moderation loop start ==" >> "$LOG"
while true; do
  /workspace/us-app/scripts/moderation-worker-once.sh >> "$LOG" 2>&1 || true
  sleep 5
done

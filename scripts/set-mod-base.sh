#!/usr/bin/env bash
set -euo pipefail
cd /workspace/us-app/apps/mobile

read -rp "Paste your current RunPod port-8000 URL (e.g., https://xxxx-8000.proxy.runpod.net): " MOD_BASE
if [[ -z "$MOD_BASE" || ! "$MOD_BASE" =~ ^https?://.+ ]]; then
  echo "Invalid URL. Example: https://abcd-8000.proxy.runpod.net" >&2
  exit 1
fi

# Preserve existing Supabase vars if present
SUPA_URL="$(grep -E '^EXPO_PUBLIC_SUPABASE_URL=' .env 2>/dev/null | cut -d= -f2- || true)"
SUPA_ANON="$(grep -E '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' .env 2>/dev/null | cut -d= -f2- || true)"

cat > .env <<EOF2
EXPO_PUBLIC_MOD_API_BASE=${MOD_BASE}
${SUPA_URL:+EXPO_PUBLIC_SUPABASE_URL=$SUPA_URL}
${SUPA_ANON:+EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPA_ANON}
EOF2

echo "----- .env -----"
sed -n '1,200p' .env | sed -E 's/(EXPO_PUBLIC_SUPABASE_ANON_KEY=).+/\1[REDACTED]/'

# Restart Expo with tunnel so the phone can reach it
pkill -f "expo|metro" 2>/dev/null || true
EXPO_USE_STATIC=0 npx expo start --host tunnel --port 8084 --clear

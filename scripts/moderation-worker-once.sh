#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/workspace/us-app/apps/mobile/.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(EXPO_PUBLIC_SUPABASE_URL|EXPO_PUBLIC_SUPABASE_ANON_KEY|EXPO_PUBLIC_MOD_API_BASE)=' "$ENV_FILE" | xargs -d '\n' -I{} echo {})
fi

SB_URL="${EXPO_PUBLIC_SUPABASE_URL:-}"
SB_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}"
MOD_BASE="${EXPO_PUBLIC_MOD_API_BASE:-}"

if [[ -z "$SB_URL" || -z "$SB_KEY" || -z "$MOD_BASE" ]]; then
  echo "Missing env: SB_URL/SB_KEY/MOD_BASE. Ensure apps/mobile/.env has EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_MOD_API_BASE" >&2
  exit 2
fi

authHeaders=(-H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY" -H "Content-Type: application/json")

echo "→ Dequeue one"
DQ_JSON="$(curl -sS "${authHeaders[@]}" -X POST "$SB_URL/rest/v1/rpc/mq_dequeue_one" -d '{}')"
echo "$DQ_JSON" | jq .

PHOTO_ID="$(echo "$DQ_JSON" | jq -r '.photo_id // empty')"
URL="$(echo "$DQ_JSON" | jq -r '.url // empty')"
STORAGE_PATH="$(echo "$DQ_JSON" | jq -r '.storage_path // empty')"

if [[ -z "$PHOTO_ID" ]]; then
  echo "No pending items."
  exit 0
fi

if [[ -z "$URL" ]]; then
  echo "⚠️  No URL on queue item photo_id=$PHOTO_ID (storage_path=$STORAGE_PATH). Marking rejected."
  FINAL_JSON="$(jq -n --arg pid "$PHOTO_ID" \
    '{ _photo_id: ($pid|tostring), _approved: false, _provider_status: 400, _provider_body: {}, _last_error: "missing URL for moderation" }')"
  curl -sS "${authHeaders[@]}" -X POST "$SB_URL/rest/v1/rpc/mq_finalize" -d "$FINAL_JSON" | jq .
  exit 0
fi

echo "→ Call moderation (follow redirects): $URL"
RESP="$(curl -sS -L -w $'\n%{http_code}' --get "$MOD_BASE/moderate" \
  --data-urlencode "url=$URL" --data-urlencode "min=60")"
HTTP_CODE="$(tail -n1 <<<"$RESP")"
BODY="$(sed '$d' <<<"$RESP")"

echo "HTTP_CODE=$HTTP_CODE"
if jq -e . >/dev/null 2>&1 <<<"$BODY"; then
  echo "$BODY" | jq .
else
  echo "BODY(raw)=$(printf '%s' "$BODY" | head -c 200)..."
fi

APPROVED=false
if [[ "$HTTP_CODE" == "200" ]]; then
  PASS="$(jq -r '.pass // empty' <<<"$BODY" 2>/dev/null || true)"
  if [[ "$PASS" == "true" ]]; then APPROVED=true; fi
fi

echo "→ Finalize: approved=$APPROVED (status=$HTTP_CODE)"
FINAL_JSON="$(jq -n \
  --arg pid "$PHOTO_ID" \
  --argjson approved "$APPROVED" \
  --argjson pstatus "${HTTP_CODE:-0}" \
  --argjson body "$(jq -Rn --arg b "$BODY" '$b | try fromjson catch {raw: .}')" \
  '{ _photo_id: ($pid|tostring), _approved: $approved, _provider_status: $pstatus, _provider_body: $body, _last_error: null }')"

curl -sS "${authHeaders[@]}" -X POST "$SB_URL/rest/v1/rpc/mq_finalize" -d "$FINAL_JSON" | jq .

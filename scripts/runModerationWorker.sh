#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date -Iseconds)" "$*"
}

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "Missing env var: $name" >&2
    exit 1
  fi
}

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

require_env SUPABASE_URL
require_env SUPABASE_SERVICE_ROLE_KEY

# ---------- Load moderation settings (mod_url, mod_token) ----------
load_mod_settings() {
  if [ -n "${MOD_URL:-}" ] && [ -n "${MOD_TOKEN:-}" ]; then
    return 0
  fi

  log "Loading mod_url from app_settings…"
  local url_resp
  url_resp="$(curl -sS \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    "${SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.mod_url")"

  MOD_URL="$(echo "$url_resp" | jq -r '.[0].value // empty')"

  log "Loading mod_token from app_settings…"
  local token_resp
  token_resp="$(curl -sS \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    "${SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.mod_token")"

  MOD_TOKEN="$(echo "$token_resp" | jq -r '.[0].value // empty')"

  if [ -z "$MOD_URL" ] || [ -z "$MOD_TOKEN" ]; then
    echo "Failed to load mod_url/mod_token from app_settings (or they are empty)." >&2
    exit 1
  fi
}

# ---------- Claim one queued job via RPC mq_claim_for_worker ----------
claim_job() {
  local resp
  resp="$(curl -sS \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -X POST \
    --data '{}' \
    "${SUPABASE_URL}/rest/v1/rpc/mq_claim_for_worker")"

  local count
  count="$(echo "$resp" | jq 'length')"
  if [ "$count" -eq 0 ]; then
    echo ""
    return 0
  fi

  echo "$resp" | jq '.[0]'
}

# ---------- Complete job via RPC mq_complete_from_worker ----------
complete_job() {
  local queue_id="$1"
  local photo_id="$2"
  local http_status="$3"
  local pass_bool="$4"
  local body_raw="$5"

  local payload
  payload="$(jq -n \
    --arg qid "$queue_id" \
    --arg pid "$photo_id" \
    --arg status "$http_status" \
    --argjson pass "$pass_bool" \
    --arg body_raw "$body_raw" \
    '{
      _queue_id: $qid,
      _photo_id: $pid,
      _provider_status: ($status | tonumber),
      _pass: $pass,
      _raw_body: { raw: $body_raw }
    }')"

  curl -sS \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -X POST \
    --data "$payload" \
    "${SUPABASE_URL}/rest/v1/rpc/mq_complete_from_worker" \
    >/dev/null
}

# ---------- Call Lambda via GET with ?url=&min=&token= ----------
call_lambda() {
  local url="$1"
  local tmp_body
  tmp_body="$(mktemp)"

  # URL-encode the image URL
  local encoded_url
  encoded_url="$(jq -rn --arg u "$url" '$u|@uri')"

  local full_url="${MOD_URL}?url=${encoded_url}&min=60&token=${MOD_TOKEN}"

  local http_status
  http_status="$(curl -sS \
    -o "$tmp_body" \
    -w '%{http_code}' \
    "$full_url" || echo "0")"

  local body_raw
  body_raw="$(cat "$tmp_body")"
  rm -f "$tmp_body"

  local pass_bool="false"
  if echo "$body_raw" | jq -e . >/dev/null 2>&1; then
    local pass_val
    pass_val="$(echo "$body_raw" | jq -r 'if has("pass") then .pass else "false" end' 2>/dev/null || echo "false")"
    if [ "$pass_val" = "true" ]; then
      pass_bool="true"
    fi
  fi

  echo "$http_status" "$pass_bool" "$body_raw"
}

# ---------- Main worker loop ----------
load_mod_settings
log "Moderation worker starting (using MOD_URL=${MOD_URL})"

while true; do
  job_json="$(claim_job)"

  if [ -z "$job_json" ]; then
    log "No queued jobs. Sleeping 5s…"
    sleep 5
    continue
  fi

  queue_id="$(echo "$job_json" | jq -r '.queue_id')"
  photo_id="$(echo "$job_json" | jq -r '.photo_id')"
  photo_url="$(echo "$job_json" | jq -r '.url')"

  if [ -z "$queue_id" ] || [ -z "$photo_id" ]; then
    log "Claimed job but missing queue_id/photo_id, skipping: $job_json"
    sleep 2
    continue
  fi

  log "Processing job=$queue_id photo=$photo_id url=$photo_url"

  read -r http_status pass_bool body_raw <<<"$(call_lambda "$photo_url")"
  log "Lambda result http_status=${http_status} pass=${pass_bool}"

  complete_job "$queue_id" "$photo_id" "$http_status" "$pass_bool" "$body_raw"

  log "Completed job=$queue_id"

  sleep 2
done

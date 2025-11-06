#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="apps/mobile/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

if [[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" || -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  echo "Supabase environment variables are not set" >&2
  exit 1
fi

BASE_URL="${EXPO_PUBLIC_SUPABASE_URL%/}/rest/v1"

check_endpoint() {
  local endpoint="$1"
  local http_response status body

  http_response=$(curl \
    -sS \
    -w "\n%{http_code}" \
    -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Accept: application/json" \
    "$BASE_URL/$endpoint") || {
      echo "Failed to reach Supabase for $endpoint" >&2
      exit 1
    }

  status="${http_response##*$'\n'}"
  body="${http_response%$'\n'*}"

  if [[ -z "$body" && "$http_response" == "$status" ]]; then
    body=""
  fi

  if [[ "$status" -ge 400 ]]; then
    echo "Error from Supabase for $endpoint (HTTP $status): $body" >&2
    exit 1
  fi

  if grep -q '"code":"PGRST' <<<"$body"; then
    echo "Error from Supabase for $endpoint: $body" >&2
    exit 1
  fi
}

check_endpoint 'profiles?select=id&limit=1'
check_endpoint 'photos?select=id&limit=1'
check_endpoint 'matches?select=id&limit=1'

echo "OK"

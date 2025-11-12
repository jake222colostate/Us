#!/usr/bin/env bash
set -euo pipefail

SRC="${1:-}"
THRESHOLD="${2:-60}"

if [[ -z "$SRC" ]]; then
  echo "Usage: $0 <file-or-url> [min_confidence]" >&2
  exit 2
fi

TMP=""
INPUT=""

# If URL, download to tmp
if [[ "$SRC" =~ ^https?:// ]]; then
  TMP="$(mktemp -t rekog.XXXXXX).jpg"
  curl -fsSL "$SRC" -o "$TMP"
  INPUT="$TMP"
else
  if [[ ! -f "$SRC" ]]; then
    echo "Error: file not found: $SRC" >&2
    exit 2
  fi
  INPUT="$SRC"
fi

# Size guard (~5MB)
MAX=$((5 * 1024 * 1024))
SIZE=$(stat -c%s "$INPUT" 2>/dev/null || stat -f%z "$INPUT")
if (( SIZE > MAX )); then
  echo "FAIL size>5MB ($SIZE bytes): $SRC" >&2
  [[ -n "$TMP" ]] && rm -f "$TMP"
  exit 3
fi

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"

JSON="$(aws rekognition detect-moderation-labels \
  --region "$REGION" \
  --image-bytes "fileb://$INPUT" \
  --min-confidence "$THRESHOLD" \
  --output json)"

echo "$JSON" | jq '.ModerationLabels'
COUNT="$(echo "$JSON" | jq '.ModerationLabels | length')"

# Non-zero exit if any label tripped
if (( COUNT > 0 )); then
  echo "FAIL moderation: $COUNT label(s) exceeded threshold >= $THRESHOLD" >&2
  [[ -n "$TMP" ]] && rm -f "$TMP"
  exit 4
fi

echo "PASS moderation (no labels >= $THRESHOLD)"
[[ -n "$TMP" ]] && rm -f "$TMP"

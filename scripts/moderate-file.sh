#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-}"
THRESHOLD="${2:-60}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage: $0 /path/to/image.jpg [min_confidence]" >&2
  exit 2
fi

# Quick size guard (~5 MB API body limit; leave headroom)
MAX=$((5 * 1024 * 1024))
SIZE=$(stat -c%s "$FILE" 2>/dev/null || stat -f%z "$FILE")
if (( SIZE > MAX )); then
  echo "Error: file too large ($SIZE bytes). Shrink below 5MB and retry." >&2
  exit 3
fi

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"

aws rekognition detect-moderation-labels \
  --region "$REGION" \
  --image-bytes "fileb://$FILE" \
  --min-confidence "$THRESHOLD"

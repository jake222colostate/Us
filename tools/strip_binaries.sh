#!/usr/bin/env bash
set -euo pipefail

echo "[info] This will REWRITE GIT HISTORY to remove binary files."
echo "[info] Ensure collaborators are aware before proceeding."

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "[warn] git-filter-repo not found. Install via:"
  echo "  brew install git-filter-repo    # macOS"
  echo "  pip install git-filter-repo     # Linux"
  exit 1
fi

git filter-repo \
  --invert-paths \
  --path ios/Pods \
  --path ios/build \
  --path android/.gradle \
  --path android/app/build \
  --path-glob '*.png' \
  --path-glob '*.jpg' \
  --path-glob '*.jpeg' \
  --path-glob '*.webp' \
  --path-glob '*.gif' \
  --path-glob '*.heic' \
  --path-glob '*.mp3' \
  --path-glob '*.wav' \
  --path-glob '*.mp4' \
  --path-glob '*.mov' \
  --path-glob '*.zip' \
  --path-glob '*.ipa' \
  --path-glob '*.apk'

echo "[ok] History cleaned. Force-push to update remote:"
echo "git push -u origin main --force"

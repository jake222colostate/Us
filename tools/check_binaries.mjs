#!/usr/bin/env node
import { execSync } from 'node:child_process';

const BANNED_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'heic',
  'mp3',
  'wav',
  'mp4',
  'mov',
  'zip',
  'ipa',
  'apk',
];

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function filterBanned(files) {
  return files.filter((file) => {
    const lower = file.toLowerCase();
    return BANNED_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
  });
}

const trackedFiles = runGit('git ls-files');
const trackedBanned = filterBanned(trackedFiles);

const stagedFiles = runGit('git diff --cached --name-only');
const stagedBanned = filterBanned(stagedFiles);

if (!trackedBanned.length && !stagedBanned.length) {
  console.log('[ok] No banned binary files detected.');
  process.exit(0);
}

if (trackedBanned.length) {
  console.error('\n[error] The following tracked files match banned binary extensions:');
  for (const file of trackedBanned) {
    console.error(`  - ${file}`);
  }
}

if (stagedBanned.length) {
  console.error('\n[error] The following staged files match banned binary extensions:');
  for (const file of stagedBanned) {
    console.error(`  - ${file}`);
  }
}

console.error('\nUse `pnpm repo:unstage-binaries` to drop staged binaries or `pnpm repo:strip-binaries` to rewrite history.');
process.exit(1);

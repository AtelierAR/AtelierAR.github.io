#!/usr/bin/env bash
# Long captures: re-run the recorder until every frame exists (it resumes), then encode.
# usage: scripts/record-loop.sh [--4k] [--workers N]
cd "$(dirname "$0")/.." || exit 1
for i in $(seq 1 20); do
  node scripts/record.mjs "$@" --frames-only && break
  echo "[record-loop] attempt $i failed, resuming in 5 s"; sleep 5
done
node scripts/record.mjs "$@" --keep

#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "DIRECT_URL is required" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/neural_ops_${STAMP}.sql.gz"

pg_dump --no-owner --no-privileges "$DIRECT_URL" | gzip > "$FILE"

echo "Backup complete: $FILE"

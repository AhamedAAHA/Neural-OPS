#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "DIRECT_URL is required" >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

gunzip -c "$BACKUP_FILE" | psql "$DIRECT_URL"

echo "Restore complete from: $BACKUP_FILE"

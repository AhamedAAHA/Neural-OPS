# Neural OPS Operations Guide

## Health and Monitoring Endpoints

- `GET /api/liveness`:
  - Process heartbeat only
  - Use for container liveness probes

- `GET /api/readiness`:
  - Validates required environment configuration
  - Validates database connectivity (`SELECT 1`)
  - Returns `503` when not ready

- `GET /api/health`:
  - Combined operational health summary
  - Includes optional integration warnings

## Database Backup Strategy

### Backup frequency

- Daily full logical backup
- Additional backup before schema changes

### Backup command

```bash
export DIRECT_URL='postgresql://...'
./scripts/backup-supabase.sh
```

Outputs compressed SQL dumps in `./backups` by default.

### Restore command

```bash
export DIRECT_URL='postgresql://...'
./scripts/restore-supabase.sh ./backups/neural_ops_<timestamp>.sql.gz
```

### Retention recommendation

- Keep last 14 daily backups
- Keep 8 weekly backups
- Keep 6 monthly backups

## Error Recovery Strategy

### 1. Detect

- Track `/api/health` and `/api/readiness` in your uptime monitor.
- Alert on:
  - readiness failures
  - sustained 5xx spikes
  - DB connection errors

### 2. Contain

- Shift traffic to last known healthy revision (platform rollback).
- Disable optional external integrations by unsetting keys if vendor incidents occur.

### 3. Recover

- Re-run migrations (`npm run db:push`) only when schema drift is confirmed.
- Restore from latest backup when data corruption is detected.
- Reprocess failed workflows from audit logs when possible.

### 4. Verify

- Re-check:
  - `/api/liveness`
  - `/api/readiness`
  - `/api/health`
- Validate critical paths: incident creation, evidence capture, approvals, report generation.

### 5. Prevent recurrence

- Add regression tests for failed flow.
- Add targeted alerts for exact failure signal.
- Document incident timeline in audit logs/runbook.

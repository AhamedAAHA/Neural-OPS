# Neural OPS

Enterprise risk and incident operations platform built with Next.js, Prisma, and Supabase.

## Production Setup

### 1. Configure environment

Copy `.env.example` to your runtime environment and set all required values.

Required for production:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Environment validation is enforced in production when `ENV_VALIDATION_STRICT=true`.

### 2. Generate and sync Prisma

```bash
npx prisma generate
npx prisma db push
```

### 3. Run quality gates

```bash
npm run lint
npm run typecheck
npm run build
```

## Docker

Build:

```bash
docker build -t neural-ops:latest .
```

Run:

```bash
docker run --rm -p 3000:3000 --env-file .env neural-ops:latest
```

Compose (app + postgres):

```bash
docker compose up -d --build
```

## Health Endpoints

- `GET /api/health`
- `GET /api/readiness`
- `GET /api/liveness`

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs:

- lint
- type check
- build

on every push/PR.

## Backup and Recovery

Backup script:

```bash
./scripts/backup-supabase.sh
```

Restore script:

```bash
./scripts/restore-supabase.sh ./backups/<backup-file>.sql.gz
```

## Deployment Docs

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Operations Guide](docs/OPERATIONS.md)
- [Backend Guide](docs/BACKEND.md)

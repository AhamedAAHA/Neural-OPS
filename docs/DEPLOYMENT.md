# Neural OPS Production Deployment

This guide covers production deployment for Vercel, Render, and Supabase-backed infrastructure.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Supabase project with PostgreSQL
- Runtime environment variables configured from `.env.example`

## 2. Required Environment Variables

At minimum, production requires:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Validation behavior:

- `ENV_VALIDATION_STRICT=true` (default) enforces required envs in production startup.

## 3. Build and Verify Locally

```bash
npm ci
npm run db:generate
npm run lint
npm run typecheck
npm run build
```

## 4. Docker Deployment

Build and run locally:

```bash
docker build -t neural-ops:latest .
docker run --rm -p 3000:3000 --env-file .env neural-ops:latest
```

Compose stack (app + postgres):

```bash
docker compose up -d --build
```

Health checks:

- `GET /api/liveness`
- `GET /api/readiness`
- `GET /api/health`

## 5. Vercel Deployment

1. Import repository in Vercel.
2. Set framework to Next.js.
3. Add production environment variables from `.env.example`.
4. Set build command: `npm run build`
5. Set install command: `npm ci`
6. Deploy.

Recommended Vercel settings:

- Enable automatic deploys from `main`.
- Set preview env vars separately.

## 6. Render Deployment

1. Create a new Web Service from this repository.
2. Runtime: Node 20.
3. Build command: `npm ci && npm run build`
4. Start command: `npm run start`
5. Add environment variables from `.env.example`.
6. Deploy.

If using Render Postgres instead of Supabase, set `DATABASE_URL` and `DIRECT_URL` accordingly.

## 7. Supabase Setup

1. Create project and copy connection strings.
2. Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in deployment platform.
3. Push schema:

```bash
npm run db:push
```

4. Optional seed for non-production:

```bash
npm run db:seed
```

## 8. Post-Deployment Verification

Run smoke checks:

```bash
curl -sS https://<app-domain>/api/liveness
curl -sS https://<app-domain>/api/readiness
curl -sS https://<app-domain>/api/health
```

The expected result is HTTP 200 for all endpoints when dependencies are healthy.

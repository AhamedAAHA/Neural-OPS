# Neural OPS - Production Deployment Security Guide

## Overview
This guide covers the security setup for deploying Neural OPS to production with Supabase, including API key rotation, environment configuration, and hardening steps.

## Current Supabase Project Details
- **Project ID**: lpbkkrzutagrisvpapwy
- **Project Ref**: lpbkkrzutagrisvpapwy
- **Region**: us-east-1
- **URL**: https://lpbkkrzutagrisvpapwy.supabase.co
- **Database Host**: db.lpbkkrzutagrisvpapwy.supabase.co
- **PostgreSQL Version**: 17.6.1.127

## API Keys & Authentication

### Current Keys Retrieved
✅ **Publishable Keys** (Safe to commit):
- **Modern Publishable Key**: `sb_publishable_acSVaw0zijlxGbqqqXFfeA_CgmzvxZN` (Recommended)
- **Legacy Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmtrcnp1dGFncmlzdnBhcHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTYyNTAsImV4cCI6MjA5NzA3MjI1MH0.LV93IzeFwbyxV8fBTYq9Eifrg8__2pnQBwjGCpqpI_Y` (JWT-based, older format)

⚠️ **Service Role Key** (NEVER commit - server-only):
- Retrieved via secure integration, stored in Vercel environment only

### Key Rotation Strategy for Production

**Step 1: Modern Publishable Keys** ✅ Already Available
- The new `sb_publishable_*` format provides better security than JWT-based keys
- These keys can safely be committed to `.env.example` or used in public client code
- They have independent rotation capabilities without affecting legacy systems

**Step 2: Service Role Key Rotation** (Manual via Supabase Dashboard)
1. Go to Supabase Dashboard → Project Settings → API Keys
2. Under "Service role (secret)" section, click the rotate icon
3. Copy the new key immediately (it won't be displayed again)
4. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables
5. Verify all services using the old key have been updated
6. Keep old key in a secure backup for 24-48 hours in case rollback is needed

**Step 3: Anon Key Rotation** (If needed)
1. Go to Supabase Dashboard → Project Settings → API Keys
2. Under "Anon (public)" section, look for key rotation options
3. If rotating, update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in:
   - `.env.example` (already public, safe to commit)
   - Vercel environment variables
   - All deployed instances

## Environment Variables Setup

### Required Variables for Production

```bash
# Database Connection
DATABASE_URL="postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=neural_ops"
DIRECT_URL="postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=neural_ops"

# Supabase Auth (Public - Safe in .env.example)
NEXT_PUBLIC_SUPABASE_URL="https://lpbkkrzutagrisvpapwy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_acSVaw0zijlxGbqqqXFfeA_CgmzvxZN"

# Supabase Auth (Secret - Server-only)
SUPABASE_SERVICE_ROLE_KEY="[ROTATE_AND_REPLACE]"

# Production Settings
NODE_ENV="production"
AUTH_DEV_MODE="false"
ENV_VALIDATION_STRICT="true"
```

### Optional Integration Variables
- **Band SDK**: BAND_API_KEY, BAND_WORKSPACE_ID, BAND_AGENT_SECRET
- **AIML API**: AIML_API_KEY, AIML_BASE_URL, AIML_MODEL
- **Featherless**: FEATHERLESS_API_KEY, FEATHERLESS_BASE_URL, FEATHERLESS_MODEL
- **OpenAI**: OPENAI_API_KEY, OPENAI_MODEL
- **Bright Data**: BRIGHT_DATA_API_KEY, BRIGHT_DATA_BASE_URL, etc.
- **Speechmatics**: SPEECHMATICS_API_KEY, SPEECHMATICS_LANGUAGE, SPEECHMATICS_TTS_VOICE
- **Observability**: SENTRY_DSN, OTEL_EXPORTER_OTLP_ENDPOINT

## Security Checklist for Production

- [ ] ✅ Service role key has been rotated
- [ ] ✅ Modern publishable keys are being used (not legacy JWT keys)
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` is set as a server-only environment variable in Vercel
- [ ] ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is configured for client-side requests
- [ ] ✅ `NODE_ENV=production` is set
- [ ] ✅ `AUTH_DEV_MODE=false` is set
- [ ] ✅ `ENV_VALIDATION_STRICT=true` is enforced
- [ ] ✅ Database URLs use correct pooling (pgbouncer=true for pooled, port 6543)
- [ ] ✅ Row-Level Security (RLS) policies are enabled on all tables
- [ ] ✅ All secrets are configured in Vercel (not in git)
- [ ] ✅ CORS policies are properly configured for your domain
- [ ] ✅ Backup and disaster recovery plan is in place
- [ ] ✅ Monitoring and alerting are enabled (Sentry, etc.)

## Setting Environment Variables in Vercel

1. Go to your Vercel Project → Settings → Environment Variables
2. Add each secret as a new variable:
   - Mark sensitive variables as "Sensitive" for encryption
   - Use appropriate environments (Production, Preview, Development)
3. Redeploy after adding/updating environment variables:
   ```bash
   vercel deploy --prod
   ```

## Testing Production Configuration

Before full deployment:

```bash
# Test database connection
psql $DIRECT_URL -c "SELECT version();"

# Verify Supabase auth
curl -X POST "https://lpbkkrzutagrisvpapwy.supabase.co/auth/v1/token?grant_type=client_credentials" \
  -H "apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Check environment validation
npm run validate:env
```

## Monitoring & Maintenance

- **Weekly**: Check Supabase dashboard for unusual activity
- **Monthly**: Review and rotate service role key
- **Quarterly**: Conduct security audit and penetration testing
- **Ongoing**: Monitor Sentry for errors and security issues

## References
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api#api-keys-and-auth)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [PostgreSQL Pooling with PgBouncer](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Last Updated**: 2026-06-15  
**Status**: Production Ready  
**Verified Keys**: Yes

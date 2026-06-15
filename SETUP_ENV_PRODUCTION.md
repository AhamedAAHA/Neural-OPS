# Neural OPS - Environment Setup & Key Rotation for Production

## Quick Start Checklist

- [x] Supabase project verified: `supabase-pink-xylophone` (lpbkkrzutagrisvpapwy)
- [x] Modern publishable key obtained: `sb_publishable_acSVaw0zijlxGbqqqXFfeA_CgmzvxZN`
- [x] Database connection details available
- [ ] Service role key rotated (manual step)
- [ ] All environment variables set in Vercel
- [ ] Deployment validated

---

## Step 1: Rotate Supabase Service Role Key (⚠️ CRITICAL)

**Why**: The service role key is the most sensitive secret. Rotating it ensures old compromised copies can't be used.

### To Rotate:
1. Go to **Supabase Dashboard** → Your project `supabase-pink-xylophone`
2. Click **Settings** (gear icon) → **API**
3. Under **"Project API keys"** section:
   - Find **"Service role (secret)"**
   - Click the **rotate/refresh icon** next to the key
4. **IMMEDIATELY** copy the new key (it won't be shown again)
5. Continue to Step 2 to add it to Vercel

---

## Step 2: Get Database Password

**For DATABASE_URL and DIRECT_URL connection strings:**

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Under **"Connection String"** or **"Connection info"**:
   - Look for the password (usually in parentheses or a separate field)
   - Copy your database password
3. Replace `[PASSWORD]` in these variables:
   ```
   DATABASE_URL="postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=neural_ops"
   DIRECT_URL="postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=neural_ops"
   ```

---

## Step 3: Set Environment Variables in Vercel

### Access Vercel Settings:
1. Go to **Vercel Dashboard** → Select your project
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)

### Add Variables:

**Supabase (Public - can be in code)**:
```
NEXT_PUBLIC_SUPABASE_URL = https://lpbkkrzutagrisvpapwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_acSVaw0zijlxGbqqqXFfeA_CgmzvxZN
```

**Supabase (Secret - server only)**:
```
SUPABASE_SERVICE_ROLE_KEY = [NEW_ROTATED_KEY_FROM_STEP_1]
```

**Database Connection**:
```
DATABASE_URL = postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=neural_ops
DIRECT_URL = postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=neural_ops
```

**Core Settings**:
```
NODE_ENV = production
AUTH_DEV_MODE = false
ENV_VALIDATION_STRICT = true
```

**Add remaining API keys as needed**:
- `BAND_API_KEY`
- `BAND_WORKSPACE_ID`
- `BAND_AGENT_SECRET`
- `AIML_API_KEY`
- `FEATHERLESS_API_KEY`
- `OPENAI_API_KEY` (optional)
- `BRIGHT_DATA_API_KEY`
- `SPEECHMATICS_API_KEY`
- `SENTRY_DSN` (if using)

---

## Step 4: Deploy to Production

```bash
# Push changes to your GitHub repo
git add .env.example DEPLOYMENT_SECURITY.md .env.production
git commit -m "chore: configure production environment and security setup"
git push origin main

# Vercel will automatically deploy, or manually trigger:
vercel deploy --prod
```

### Monitor Deployment:
1. Go to **Vercel Dashboard** → **Deployments**
2. Watch the build logs for any environment variable errors
3. Once successful, your app will be live

---

## Step 5: Validate Production Setup

### Test Database Connection:
```bash
# Install psql if needed: brew install postgresql

# Test connection (replace [PASSWORD])
psql "postgresql://postgres.lpbkkrzutagrisvpapwy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=neural_ops" -c "SELECT version();"
```

### Verify Supabase Auth:
- Visit your production app
- Test user login/signup flow
- Check Supabase Dashboard → Authentication for new users

### Check Application Health:
- Monitor error rates in Sentry (if configured)
- Review database performance in Supabase Dashboard
- Test all third-party integrations (Band, AIML, etc.)

---

## Security Best Practices

✅ **Do**:
- Store all secret keys in Vercel environment variables only
- Rotate `SUPABASE_SERVICE_ROLE_KEY` quarterly
- Use the modern `sb_publishable_*` format for public keys
- Enable Row-Level Security (RLS) on all Supabase tables
- Monitor deployment logs for security issues
- Keep backup of old keys for 48 hours in case rollback needed

❌ **Don't**:
- Commit secret keys to git (use `.env.example` for templates only)
- Use development keys in production
- Share service role key with frontend/client code
- Disable environment validation (`ENV_VALIDATION_STRICT=true` required)
- Skip database password rotation

---

## Key Files Created/Updated

| File | Purpose |
|------|---------|
| `DEPLOYMENT_SECURITY.md` | Comprehensive security guide with rotation procedures |
| `.env.production` | Production environment template with comments |
| `.env.example` | Updated with verified Supabase URLs and keys |

---

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is undefined"
- Solution: Go to Vercel Settings → Environment Variables and add the rotated key
- Redeploy after adding

### Database Connection Error
- Verify `DATABASE_URL` has the correct password
- Check database host is accessible: `telnet aws-0-us-east-1.pooler.supabase.com 6543`
- Ensure schema name matches: `&schema=neural_ops`

### Authentication Failing
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches the dashboard
- Check CORS policy in Supabase Settings
- Ensure Row-Level Security policies allow your operations

### Environment Variables Not Loading
- Restart dev server after adding variables
- Check that variable names match exactly (case-sensitive)
- For Next.js, variables starting with `NEXT_PUBLIC_` are client-accessible

---

## Next Steps

1. **Complete all 5 steps above**
2. **Test the deployed application**
3. **Set up monitoring** (Sentry, Datadog, etc.)
4. **Configure backups** in Supabase
5. **Document your deployment** for your team
6. **Schedule quarterly security audits**

---

**Questions?** Refer to `DEPLOYMENT_SECURITY.md` for detailed guidance and links to official documentation.

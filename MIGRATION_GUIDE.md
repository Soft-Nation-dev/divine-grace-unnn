# Migration from Express.js to Cloudflare Workers

## Quick Start

### Step 1: Setup Cloudflare Workers CLI
```bash
npm install -g wrangler
wrangler login
```

### Step 2: Create KV Namespaces
```bash
wrangler kv:namespace create "LSTS_KV"
wrangler kv:namespace create "PRAYERS_KV"
wrangler kv:namespace create "SUMMIT_KV"

# Save the IDs and update wrangler.toml
```

### Step 3: Set Environment Variables
```bash
# Interactive prompts for secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put ADMIN_EMAILS
wrangler secret put R2_PUBLIC_URL
```

### Step 4: Deploy
```bash
# Test locally
wrangler dev

# Deploy to Cloudflare
wrangler deploy
```

### Step 5: Update Frontend
```javascript
// src/config/api.js
const API_BASE_URL = "https://api.divinegraceunn.com.ng"; // Your Cloudflare URL
```

## What Changed

| Component | Old (Express) | New (Cloudflare) |
|-----------|--------------|-----------------|
| Framework | Express.js | Hono.js |
| Database | Supabase (all) | Supabase (auth) + KV (data) |
| File Storage | Cloudflare R2 | Cloudflare R2 (same) |
| Deployment | Render/Railway | Cloudflare Workers |
| Cost | ~$0-10/mo | ~$0-2/mo |
| Timeout | 30+ minutes | 30 seconds |

## Benefits

✅ **Cheaper Storage**: KV is 20x cheaper than Supabase storage
✅ **Faster Deploys**: Cloudflare Workers deploy instantly
✅ **Global Edge**: Requests are served from nearest datacenter
✅ **No Server Management**: Fully serverless & managed
✅ **Integrated with R2**: Everything in one place
✅ **Better DDoS Protection**: Built-in security from Cloudflare

## API Compatibility

All endpoints remain the same! Frontend doesn't need updates except for the base URL:

```javascript
// This still works
fetch(`${API_BASE_URL}/api/lsts`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(data)
})
```

## File Structure

```
divine-grace-unnn/
├── src/
│   ├── index.js                 # Main Cloudflare Worker entry
│   ├── routes/
│   │   ├── auth.js              # Authentication
│   │   ├── lsts.js              # LSTS registrations
│   │   ├── prayers.js           # Prayer requests
│   │   ├── summit.js            # Summit registrations
│   │   ├── messages.js          # Media uploads
│   │   └── admin.js             # Admin operations
│   ├── middleware/
│   │   └── auth.js              # JWT validation
│   └── storage/
│       ├── kv.js                # Cloudflare KV operations
│       └── supabase.js          # Supabase operations
├── wrangler.toml                # Cloudflare config
├── package-cf-workers.json      # Dependencies
└── CLOUDFLARE_SETUP.md          # Full setup guide
```

## Data Migration

### From Supabase to KV

```bash
# Step 1: Export data from Supabase
# Via Supabase Dashboard or API

# Step 2: Create import script
cat > migrate.js << 'EOF'
import LSTS_KV from './src/storage/kv.js';

const lsts_registrations = [...]; // From Supabase export

for (const reg of lsts_registrations) {
  await LSTS_KV.saveLstsRegistration(reg);
}
EOF

# Step 3: Run migration
wrangler dev # Then execute migrate script
```

## Troubleshooting

### Namespace Not Found
```bash
wrangler kv:namespace list
# If empty, recreate:
wrangler kv:namespace create "LSTS_KV"
```

### Auth Errors
- Verify JWT_SECRET matches Supabase
- Check token hasn't expired
- Confirm SUPABASE_URL is correct

### Data Not Persisting
- Confirm KV binding in wrangler.toml
- Check Cloudflare account permissions
- Verify KV namespace is in correct account

### Slow Performance
- Workers have 30-second timeout
- Optimize KV queries (use indexes)
- Cache frequently accessed data

## Next: Setup Custom Domain

Once deployed:

1. Add domain to Cloudflare Dashboard
2. Create CNAME: `api` → `divine-grace-api.workers.dev`
3. Update `.env.production`:
   ```
   VITE_API_URL=https://api.divinegraceunn.com.ng
   ```

## Testing Endpoints

```bash
# Health check
curl https://api.divinegraceunn.com.ng/health

# Signup
curl -X POST https://api.divinegraceunn.com.ng/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pwd123"}'

# Get profile (requires token)
curl -H "Authorization: Bearer TOKEN" \
  https://api.divinegraceunn.com.ng/api/auth/profile
```

## Comparison: Storage Costs

### Supabase ($0 - $25/mo)
- Free: 500MB database
- Pay-as-you-go: $0.125/GB/month

### Cloudflare ($0 - $2/mo)
- KV Free: 10GB
- KV Paid: $0.50/GB/month
- R2 Free: 10GB
- R2 Paid: $0.015/GB/month

**With 50GB data:**
- Supabase: ~$6.25/month
- Cloudflare: $0.50/month (99% cheaper!)

## Support Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework Docs](https://hono.dev/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

**Migration Complete!** You now have a fully serverless, highly scalable, and extremely cost-effective backend. 🚀

# Cloudflare Workers Backend Migration Guide

## Architecture Overview

**Old Setup (Express.js):**

- Supabase: Everything (auth, metadata, registrations)
- Storage: Cloudflare R2 (media files)

**New Setup (Cloudflare Workers):**

- **Supabase**: Auth + metadata only
  - `users` table: id, email, title, full_name, phone_number, etc.
  - `admin_assignments` table: for admin tracking
- **Cloudflare KV**: LSTS registrations, prayers, summit forms
  - `LSTS_KV`: All LSTS form submissions
  - `PRAYERS_KV`: All prayer requests
  - `SUMMIT_KV`: Summit registrations
- **Cloudflare R2**: Media files (audio messages, images)
  - `divine-grace-storage` bucket

## Storage Breakdown

| Data Type             | Where Stored  | Why                                    |
| --------------------- | ------------- | -------------------------------------- |
| User accounts & auth  | Supabase      | Need robust auth system                |
| User profile metadata | Supabase      | Minimal data (name, email, title)      |
| LSTS Registrations    | Cloudflare KV | Large volume, cheaper storage          |
| Prayer Requests       | Cloudflare KV | Cheaper than Supabase                  |
| Summit Registrations  | Cloudflare KV | Cheaper than Supabase                  |
| Audio Messages        | Cloudflare R2 | Cheaper than both, optimized for media |

## Cost Comparison

### Supabase (Per Month)

- Free tier: 500MB database, 1GB file storage
- Pay-as-you-go: $0.125/GB month

### Cloudflare (Per Month)

- **KV**: First 10GB FREE, then $0.50/GB
- **R2**: First 10GB storage FREE, $0.015/GB after
- **Workers**: 100,000 requests/day FREE tier

**Monthly Cost with 50GB data:**

- Old setup: ~$6-8 (Supabase)
- New setup: $0-2 (Cloudflare free tier)

## Step 1: Setup Cloudflare Workers Project

### 1.1 Install Wrangler CLI

```bash
npm install -g @cloudflare/wrangler
# or use npx wrangler
```

### 1.2 Create KV Namespaces

```bash
# Create KV namespaces
wrangler kv:namespace create "LSTS_KV"
wrangler kv:namespace create "LSTS_KV" --preview

wrangler kv:namespace create "PRAYERS_KV"
wrangler kv:namespace create "PRAYERS_KV" --preview

wrangler kv:namespace create "SUMMIT_KV"
wrangler kv:namespace create "SUMMIT_KV" --preview
```

You'll get IDs like:

```
[ LSTS_KV ]
id = "abc123def456"
preview_id = "abc123def457"
```

### 1.3 Update wrangler.toml

Replace the placeholder IDs:

```toml
kv_namespaces = [
  { binding = "LSTS_KV", id = "abc123def456", preview_id = "abc123def457" },
  { binding = "PRAYERS_KV", id = "xyz789uvw012", preview_id = "xyz789uvw013" },
  { binding = "SUMMIT_KV", id = "pqr345stu678", preview_id = "pqr345stu679" }
]
```

## Step 2: Configure Environment Variables

### 2.1 Get Your Cloudflare Account ID

```bash
wrangler whoami
```

Copy your Account ID and update `wrangler.toml`:

```toml
account_id = "your-account-id-here"
```

### 2.2 Set Environment Variables in Wrangler

Create `.wrangler.toml` or set via CLI:

```bash
# Install dependencies first
npm install -g @cloudflare/wrangler

# Set secrets (interactive prompt)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put ADMIN_EMAILS
wrangler secret put R2_PUBLIC_URL
```

Or create a `.env.local` file in project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
ADMIN_EMAILS=user@example.com,admin@example.com
R2_PUBLIC_URL=https://divine-grace-storage.your-domain.r2.cloudflarestorage.com
```

### 2.3 Link R2 Bucket

If using R2 for media:

```bash
wrangler r2 bucket create divine-grace-storage
```

Update `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "divine-grace-storage"
```

## Step 3: Deploy Backend

### 3.1 Test Locally

```bash
# Install dependencies
npm install -g wrangler
# From project directory with wrangler.toml

# Start dev server
wrangler dev

# Should output:
# ⛅ wrangler (version X.X.X)
# Your worker is being served at http://localhost:8787
```

### 3.2 Deploy to Cloudflare

```bash
# Publish to Cloudflare
wrangler deploy

# Get your worker URL
# https://divine-grace-api.workers.dev or custom domain
```

## Step 4: Setup Custom Domain (Optional)

### 4.1 Add Domain to Cloudflare

1. Go to Cloudflare Dashboard
2. Add your domain: `divinegraceunn.com.ng`
3. Update nameservers at your registrar

### 4.2 Create API Subdomain

1. In Cloudflare Dashboard > DNS
2. Add CNAME record:
   - Name: `api`
   - Content: `divine-grace-api.workers.dev`
3. Proxy status: Proxied (orange cloud)

Your API will be at: `https://api.divinegraceunn.com.ng`

## Step 5: Migrate Data from Supabase KV

### 5.1 Export from Supabase

```javascript
// If you had data in Supabase, export it
const { data } = await supabase.from("lsts_forms").select("*");

// Save as JSON
const json = JSON.stringify(data);
// Download and save locally
```

### 5.2 Import to Cloudflare KV

```javascript
// Using Worker script to import
for (const registration of data) {
  await LSTS_KV.put(`lsts:${registration.id}`, JSON.stringify(registration));
}
```

## Step 6: Update Frontend

Update `src/config/api.js`:

```javascript
const getApiUrl = () => {
  if (import.meta.env.MODE === "production") {
    // Use your Cloudflare Workers URL
    return "https://api.divinegraceunn.com.ng";
    // Or: return "https://divine-grace-api.workers.dev";
  }
  return "http://localhost:8787"; // Local development
};
```

Update `.env.production`:

```
VITE_API_URL=https://api.divinegraceunn.com.ng
```

## Database Schema Changes

### What Stays in Supabase

```sql
-- Users table (metadata only)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  -- Metadata
  full_name TEXT,
  title TEXT,
  phone_number TEXT,
  residential_address TEXT,
  gender TEXT,
  is_student BOOLEAN,
  department_in_school TEXT,
  level TEXT,
  is_baptized BOOLEAN
);

-- Admin assignments (optional)
CREATE TABLE admin_assignments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  assigned_at TIMESTAMP
);
```

### What Moves to Cloudflare KV

**LSTS Registrations** (KV key: `lsts:{id}`)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Mr",
  "surname": "Doe",
  "other_names": "John",
  "phone_number": "0801234567",
  "email": "user@example.com",
  "residential_address": "123 Main St",
  "gender": "Male",
  "is_baptized": true,
  "department_in_church": ["Choir", "Media"],
  "position_in_church": "Leader",
  "is_student": true,
  "department_in_school": "Computer Science",
  "level": "300",
  "vision_goals": "Become a tech leader",
  "submitted_at": "2026-02-04T10:00:00Z",
  "created_at": "2026-02-04T10:00:00Z"
}
```

**Weekly Indexing** (KV key: `index:lsts:2026-02-w1`)

```json
["lsts-id-1", "lsts-id-2", "lsts-id-3"]
```

**User Indexing** (KV key: `lsts:user:{user-id}`)

```json
["lsts-id-1", "lsts-id-2"]
```

## Testing API Endpoints

### Local Testing

```bash
# Start dev server
wrangler dev

# Test health
curl http://localhost:8787/health

# Test signup
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","fullName":"Test User"}'

# Test LSTS registration
curl -X POST http://localhost:8787/api/lsts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...registration data...}'
```

## Troubleshooting

### KV Namespace Not Found

```bash
# Verify namespaces exist
wrangler kv:namespace list

# Recreate if missing
wrangler kv:namespace create "LSTS_KV"
```

### Deployment Failed

```bash
# Check for errors
wrangler deploy --verbose

# Validate wrangler.toml
wrangler publish --dry-run
```

### CORS Errors

- Update `src/index.js` CORS origins to match your domain
- Restart dev server: `wrangler dev`

### Auth Token Invalid

- Verify `SUPABASE_JWT_SECRET` matches your Supabase settings
- Check token expiration (JWT tokens expire after time)

## Performance Tips

### 1. Query Optimization

- Use KV indexes to avoid listing all keys
- Implement pagination for large datasets
- Cache frequently accessed data

### 2. Timeout Management

- Workers have 30-second timeout
- Keep heavy operations fast
- Use background processing for complex tasks

### 3. Cost Optimization

- Use KV for frequently updated data
- Use R2 only for files
- Monitor request patterns

## Monitoring & Logging

```javascript
// In your routes
console.log('Request received:', c.req.method, c.req.path);

// View logs
wrangler tail

// Or via Cloudflare Dashboard
// Workers > Your Worker > Logs
```

## Rolling Back

If you need to go back to Express.js:

1. Redeploy Express backend to Render/Railway
2. Update `src/config/api.js` to point to old URL
3. Frontend will work as before

All KV data is still accessible if needed.

## Next Steps

1. ✅ Install Wrangler
2. ✅ Create KV namespaces
3. ✅ Set environment variables
4. ✅ Deploy: `wrangler deploy`
5. ✅ Update frontend API config
6. ✅ Test endpoints
7. ✅ Setup custom domain
8. ✅ Monitor Cloudflare dashboard

---

**Support**: Check Cloudflare docs: https://developers.cloudflare.com/workers/

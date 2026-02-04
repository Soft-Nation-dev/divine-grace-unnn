# Backend Setup Guide: Supabase + Cloudflare R2

This guide walks you through setting up your backend infrastructure using **Supabase** (for metadata and authentication) and **Cloudflare R2** (for heavy file storage).

---

## Phase 1: Supabase Setup (10-15 minutes)

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - **Project Name**: `divine-grace-unnn` (or your preference)
   - **Database Password**: Create a strong password (save it)
   - **Region**: Choose closest to your users (Africa region recommended)
4. Click "Create new project" and wait for it to initialize (~2 minutes)

### Step 2: Get Your Supabase Credentials

After creation, go to **Project Settings** → **API**:

- Copy `Project URL` (e.g., `https://xxxxx.supabase.co`)
- Copy `anon key` (public key)
- Copy `service_role key` (private key - keep secret!)

Save these in a `.env` file (we'll create this later).

### Step 3: Create Database Tables

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy and paste the entire SQL schema from `backend/database/schema.sql`
4. Click "Run"

The schema will create tables for:

- `users` (managed by Supabase Auth)
- `prayer_requests`
- `lsts_forms`
- `summit_forms`
- `admin_assignments`
- `audio_messages`

### Step 4: Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable "Email" (already default)
3. Go to **Email Templates** and customize if needed
4. Go to **URL Configuration**:
   - Add your frontend URL: `http://localhost:5173` (dev) and `https://yourdomain.com` (production)

---

## Phase 2: Cloudflare R2 Setup (10-15 minutes)

### Step 1: Create a Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up and verify email

### Step 2: Enable R2 (Object Storage)

1. Log into Cloudflare Dashboard
2. Go to **R2** in the left sidebar (under Storage)
3. Click "Create bucket"
4. **Bucket name**: `divine-grace-storage` (must be globally unique)
5. **Region**: Choose based on your location
6. Click "Create bucket"

### Step 3: Create API Token for R2

1. Click on your profile icon → **Account Settings**
2. Go to **API Tokens** → **Create Token**
3. Use template "Edit Cloudflare R2" or create custom:
   - **Account Resources**: Include your account
   - **Zone Resources**: All zones
   - **Permissions**:
     - R2: Read & Write
4. Click "Continue to summary" → "Create Token"
5. **Copy the token immediately** (you can't see it again)

### Step 4: Get Your R2 Credentials

1. Go to **R2** → Your bucket → **Settings**
2. Scroll to "S3 API tokens"
3. Click "Create S3 API Token"
4. Click "Create" on the prompt
5. You'll get:
   - `Access Key ID`
   - `Secret Access Key`
6. Also note your:
   - **Bucket name**: `divine-grace-storage`
   - **Account ID**: Found in R2 settings
   - **Public URL**: Will look like `https://[bucket-name].your-domain.r2.cloudflarestorage.com` (after you set up a custom domain, or use the default public R2 URL)

---

## Phase 3: Backend Server Setup (20-30 minutes)

### Step 1: Create Backend Folder Structure

```bash
cd c:\Users\HP\Desktop
mkdir divine-grace-backend
cd divine-grace-backend
```

### Step 2: Initialize Node.js Project

```bash
npm init -y
npm install express cors dotenv @supabase/supabase-js aws-sdk body-parser uuid
npm install --save-dev nodemon
```

### Step 3: Create Project Structure

Create these files in `divine-grace-backend/`:

```
backend/
├── .env (create manually with credentials)
├── .env.example
├── server.js (main entry point)
├── config/
│   ├── supabase.js
│   └── cloudflare.js
├── routes/
│   ├── auth.js
│   ├── prayers.js
│   ├── lsts.js
│   ├── summit.js
│   ├── admin.js
│   └── messages.js
├── middleware/
│   └── auth.js
├── controllers/
│   ├── prayerController.js
│   ├── lstsController.js
│   ├── summitController.js
│   ├── adminController.js
│   └── messageController.js
├── database/
│   └── schema.sql
└── package.json
```

### Step 4: Set Up Environment Variables

Create `.env` file in `divine-grace-backend/` with:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY=your_access_key_id
CLOUDFLARE_R2_SECRET_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET=divine-grace-storage
CLOUDFLARE_R2_PUBLIC_URL=https://divine-grace-storage.your-domain.r2.cloudflarestorage.com

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Phase 4: Running the Backend

### Development Mode

```bash
cd divine-grace-backend
npm run dev
```

Server will start at `http://localhost:3001`

### Production Mode

Deploy to:

- **Heroku** (easy, free tier deprecated)
- **Render** (recommended, free tier available)
- **Railway** (good for Node.js)
- **Vercel** (for serverless functions)
- **AWS/Azure** (for enterprise)

---

## API Endpoints Reference

Your backend will expose these endpoints (same as before, just different origin):

### Auth Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

### Prayer Requests

- `GET /api/prayers` - Get all prayers (admin only)
- `POST /api/prayers` - Submit prayer request
- `GET /api/prayers/:id` - Get specific prayer

### LSTS Forms

- `GET /api/lsts` - Get all LSTS registrations (admin only)
- `POST /api/lsts` - Submit LSTS registration
- `GET /api/lsts/weekly` - Get weekly LSTS submissions

### Summit Forms

- `GET /api/summit` - Get all summit registrations (admin only)
- `POST /api/summit` - Submit summit registration

### Audio Messages

- `POST /api/messages/upload` - Upload audio file
- `GET /api/messages` - Get all messages (admin only)
- `DELETE /api/messages/:id` - Delete message

### Admin

- `GET /api/admin/check` - Check if user is admin
- `POST /api/admin/assign` - Assign admin role

---

## Frontend Configuration Update

Update your frontend API calls to point to your backend:

### In `registerforlsts.jsx` and other files, change:

```javascript
// OLD:
const API_BASE =
  "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net";

// NEW:
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";
```

Add to your `.env.local` in frontend:

```
VITE_API_URL=http://localhost:3001
```

And update fetch calls:

```javascript
// Use the same endpoints, just different origin
fetch(`${API_BASE}/api/lsts`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Important Notes

1. **Never commit `.env` files** - They contain secrets
2. **Keep service_role key private** - Only use on backend
3. **Use anon key on frontend** - For client-side auth
4. **Enable Row Level Security (RLS)** in Supabase to restrict data access
5. **Backup your database regularly** - Supabase provides this automatically
6. **Monitor R2 costs** - First 10GB/month free, then $0.015/GB

---

## Testing Your Setup

### Test Supabase Connection

```bash
# In backend folder, create test.js:
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  const { data, error } = await supabase.from("prayer_requests").select("*").limit(1);
  console.log(error ? "❌ Error:" + error.message : "✅ Supabase connected!");
}
test();
```

### Test Cloudflare R2 Connection

```bash
# In backend folder, create test-r2.js:
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  s3ForcePathStyle: true,
  signatureVersion: "v4"
});

s3.headBucket({ Bucket: process.env.CLOUDFLARE_R2_BUCKET }, (err) => {
  console.log(err ? "❌ R2 Error: " + err.message : "✅ Cloudflare R2 connected!");
});
```

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Set up Cloudflare R2 bucket
3. ✅ Create backend from provided files
4. ✅ Configure environment variables
5. ✅ Test connections
6. ✅ Update frontend API URLs
7. ✅ Deploy backend to hosting service
8. ✅ Migrate existing data (if any)

---

Need help? Each backend file has detailed comments explaining the code.

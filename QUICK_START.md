# Quick Start Guide: Running Backend + Frontend

## Prerequisites

- Node.js 14+ installed
- npm or yarn
- Git
- A code editor (VS Code recommended)

---

## Phase 1: Set Up Supabase (15 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Fill in:
   - **Project Name**: `divine-grace-unnn`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose Africa region if available
4. Wait for initialization (~2 minutes)

### Step 2: Copy Your Credentials

After creation, go to **Settings → API**:

- Copy your **Project URL**
- Copy your **anon key**
- Copy your **service_role key**

### Step 3: Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Copy all SQL from `database-schema.sql` file (in project root)
4. Paste it into the SQL editor
5. Click "Run"

You should see ✅ Success messages for each table creation.

---

## Phase 2: Set Up Cloudflare R2 (10 minutes)

### Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up and verify email
3. Log into dashboard

### Step 2: Create R2 Bucket

1. In left sidebar, click **R2** (under Storage)
2. Click "Create bucket"
3. **Bucket name**: `divine-grace-storage` (must be unique)
4. **Region**: Choose based on your location
5. Click "Create bucket"

### Step 3: Get R2 Credentials

1. Click on your bucket
2. Go to **Settings**
3. Scroll to "S3 API tokens"
4. Click "Create S3 API Token"
5. Save the **Access Key ID** and **Secret Access Key**
6. Also note your **Account ID** from settings

---

## Phase 3: Set Up Backend (20 minutes)

### Step 1: Navigate to Project Root

```bash
cd c:\Users\HP\Desktop\divine-grace-unnn
```

### Step 2: Create .env File

Create a file named `.env` in the project root with your credentials:

```env
# Supabase
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=divine-grace-storage
CLOUDFLARE_R2_PUBLIC_URL=https://divine-grace-storage.your-account-id.r2.cloudflarestorage.com

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 3: Install Backend Dependencies

```bash
npm install express cors dotenv @supabase/supabase-js aws-sdk body-parser uuid multer
npm install --save-dev nodemon
```

### Step 4: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:

```
╔════════════════════════════════════════════╗
║  🙏 Divine Grace UNN Backend API           ║
║  Status: ✅ Running                         ║
║  Port: 3001                                ║
║  Environment: development                  ║
║  URL: http://localhost:3001                ║
╚════════════════════════════════════════════╝
```

---

## Phase 4: Update Frontend (10 minutes)

### Step 1: Create Frontend Environment File

Create `.env.local` in project root:

```env
VITE_API_URL=http://localhost:3001
```

For production:

```env
VITE_API_URL=https://your-backend-domain.com
```

### Step 2: Create API Configuration Module

1. Create folder: `src/config/`
2. Create file: `src/config/api.js`
3. Copy contents from `src-config-api.js` file

### Step 3: Update Your Components

**Example: In `registerforlsts.jsx`**

Replace:

```javascript
// OLD CODE
const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();
  if (!token) throw new Error("No auth token");
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  return fetch(url, { ...options, headers });
};
```

With:

```javascript
// NEW CODE
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

// Now use endpoints like this:
const response = await fetchWithAuth(API_ENDPOINTS.POST_LSTS, {
  method: "POST",
  body: JSON.stringify(formData),
});
```

### Step 4: Update All API Calls

Replace hardcoded URLs:

```javascript
// OLD
fetch(
  "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/LstsForm/USERLSTSFORM",
  {
    headers: { Authorization: `Bearer ${token}` },
  },
);

// NEW
fetch(API_BASE_URL + "/api/lsts", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Phase 5: Run Everything (5 minutes)

### Terminal 1: Start Backend

```bash
cd c:\Users\HP\Desktop\divine-grace-unnn
npm run dev
```

### Terminal 2: Start Frontend

```bash
cd c:\Users\HP\Desktop\divine-grace-unnn
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Testing the Setup

### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

Should return: `{"status": "✅ Server is running", ...}`

### Test 2: Sign Up

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","fullName":"Test User"}'
```

### Test 3: Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

---

## API Endpoints Summary

| Method       | Endpoint               | Purpose                    |
| ------------ | ---------------------- | -------------------------- |
| **Auth**     |                        |                            |
| POST         | `/api/auth/signup`     | Create account             |
| POST         | `/api/auth/login`      | Login                      |
| POST         | `/api/auth/logout`     | Logout                     |
| GET          | `/api/auth/profile`    | Get profile                |
| **Prayer**   |                        |                            |
| POST         | `/api/prayers`         | Submit prayer              |
| GET          | `/api/prayers`         | Get all (admin)            |
| **LSTS**     |                        |                            |
| POST         | `/api/lsts`            | Submit LSTS form           |
| GET          | `/api/lsts`            | Get all (admin)            |
| GET          | `/api/lsts/weekly`     | Weekly submissions (admin) |
| **Summit**   |                        |                            |
| POST         | `/api/summit`          | Submit summit form         |
| GET          | `/api/summit`          | Get all (admin)            |
| **Messages** |                        |                            |
| POST         | `/api/messages/upload` | Upload audio (admin)       |
| GET          | `/api/messages`        | Get all (admin)            |
| **Admin**    |                        |                            |
| GET          | `/api/admin/check`     | Check admin status         |
| POST         | `/api/admin/assign`    | Assign admin (admin)       |

---

## Troubleshooting

### Backend won't start

- Check if port 3001 is already in use
- Verify `.env` file has all required variables
- Check Node.js version: `node --version`

### API calls failing

- Verify backend is running: `curl http://localhost:3001/health`
- Check token is being sent in Authorization header
- Check browser console for error messages

### File uploads not working

- Check Cloudflare R2 credentials
- Verify bucket name is correct
- Check file size (max 500MB)

### Database errors

- Verify Supabase tables were created
- Check RLS policies are not too restrictive
- Ensure service_role key is used for admin operations

---

## Next Steps

1. ✅ Supabase project created
2. ✅ Cloudflare R2 bucket created
3. ✅ Backend running on localhost:3001
4. ✅ Frontend running on localhost:5173
5. ⏭️ Create first admin user (see below)
6. ⏭️ Test all features
7. ⏭️ Deploy to production

---

## Create First Admin User

Once backend is running:

```bash
curl -X POST http://localhost:3001/api/admin/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"your-email@example.com"}'
```

Or add directly to Supabase:

1. Go to Supabase dashboard
2. **SQL Editor** → New Query
3. Paste:

```sql
INSERT INTO admin_assignments (user_id, role)
VALUES ('your-user-id', 'admin');
```

---

## Production Deployment

### Deploy Backend to Render (Recommended)

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repository
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables from `.env`
7. Deploy!

### Update Frontend for Production

Change in `.env.local`:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Then deploy frontend to Vercel/Netlify.

---

For detailed information, see `BACKEND_SETUP.md` in project root.

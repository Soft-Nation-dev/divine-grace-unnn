# 🎯 Setup Checklist & Implementation Roadmap

## Phase 0: Preparation (No coding)

### Supabase Setup

- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Create account
- [ ] Create new project named `divine-grace-unnn`
- [ ] Wait for initialization (~2 minutes)
- [ ] Go to Settings → API
- [ ] Copy **Project URL** → Save to notes
- [ ] Copy **anon key** → Save to notes
- [ ] Copy **service_role key** → Save to notes (KEEP SECRET!)
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Copy entire content of `database-schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify no errors appear

### Cloudflare Setup

- [ ] Go to [cloudflare.com](https://cloudflare.com)
- [ ] Create account / Login
- [ ] Go to R2 in left sidebar
- [ ] Click "Create bucket"
- [ ] Name: `divine-grace-storage`
- [ ] Choose region based on location
- [ ] Click "Create bucket"
- [ ] Go to bucket settings
- [ ] Create S3 API Token
- [ ] Copy **Access Key ID** → Save to notes
- [ ] Copy **Secret Access Key** → Save to notes
- [ ] Note your **Account ID** from URL or settings
- [ ] Note **Bucket name**: `divine-grace-storage`

---

## Phase 1: Backend Setup (30 minutes)

### File Organization

- [ ] Open VS Code in project root
- [ ] All backend files go in project root directory (same level as package.json)
- [ ] Files to place:
  - [ ] `backend-server.js`
  - [ ] `backend-config-supabase.js`
  - [ ] `backend-config-cloudflare.js`
  - [ ] `backend-middleware-auth.js`
  - [ ] `backend-routes-auth.js`
  - [ ] `backend-routes-prayers.js`
  - [ ] `backend-routes-lsts.js`
  - [ ] `backend-routes-summit.js`
  - [ ] `backend-routes-messages.js`
  - [ ] `backend-routes-admin.js`

### Environment Configuration

- [ ] Create `.env` file in project root
- [ ] Fill in credentials from Supabase:
  - [ ] `SUPABASE_URL=https://xxxxx.supabase.co`
  - [ ] `SUPABASE_ANON_KEY=xxxxx`
  - [ ] `SUPABASE_SERVICE_KEY=xxxxx`
- [ ] Fill in credentials from Cloudflare:
  - [ ] `CLOUDFLARE_ACCOUNT_ID=xxxxx`
  - [ ] `CLOUDFLARE_R2_ACCESS_KEY=xxxxx`
  - [ ] `CLOUDFLARE_R2_SECRET_KEY=xxxxx`
  - [ ] `CLOUDFLARE_R2_BUCKET=divine-grace-storage`
  - [ ] `CLOUDFLARE_R2_PUBLIC_URL=https://divine-grace-storage.xxxxx.r2.cloudflarestorage.com`
- [ ] Fill in server config:
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=development`
  - [ ] `FRONTEND_URL=http://localhost:5173`
- [ ] Save .env file
- [ ] Add to .gitignore: `.env`

### Dependencies Installation

- [ ] Open terminal in project root
- [ ] Run: `npm install express cors dotenv @supabase/supabase-js aws-sdk body-parser uuid multer nodemon`
- [ ] Wait for installation to complete
- [ ] Verify: `npm list` shows all dependencies

### Start Backend Server

- [ ] In terminal, run: `npm run dev`
- [ ] Watch for startup message:
  ```
  ╔════════════════════════════════════════════╗
  ║  🙏 Divine Grace UNN Backend API           ║
  ║  Status: ✅ Running                         ║
  ║  Port: 3001                                ║
  ```
- [ ] If error, check:
  - [ ] Is port 3001 already in use?
  - [ ] Are all env vars filled?
  - [ ] Are credentials correct?
- [ ] Test health: Open `http://localhost:3001/health` in browser
- [ ] Should see JSON response
- [ ] ✅ Backend is running!

---

## Phase 2: Frontend Setup (20 minutes)

### Create API Configuration Module

- [ ] Create folder: `src/config/`
- [ ] Create file: `src/config/api.js`
- [ ] Copy entire content from `src-config-api.js`
- [ ] Paste into `src/config/api.js`
- [ ] Save file
- [ ] Verify it exists: `src/config/api.js`

### Environment Configuration (Frontend)

- [ ] Create `.env.local` in project root
- [ ] Add: `VITE_API_URL=http://localhost:3001`
- [ ] Save file
- [ ] Verify file exists: `.env.local`
- [ ] Add `.env.local` to .gitignore

### Test API Configuration

- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Paste:
  ```javascript
  import { API_BASE_URL, API_ENDPOINTS } from "./src/config/api.js";
  console.log(API_BASE_URL);
  console.log(API_ENDPOINTS);
  ```
- [ ] Should see API configuration logged
- [ ] ✅ API config is working!

---

## Phase 3: Component Updates (30-60 minutes)

### Identify Components to Update

- [ ] `src/pages/registerforlsts.jsx`
- [ ] `src/pages/Dashboard.jsx`
- [ ] `src/pages/admin.jsx`
- [ ] `src/pages/contact.jsx`
- [ ] `src/pages/submitaprayerrequest.jsx`
- [ ] `src/pages/leadershipsurmit.jsx`
- [ ] Any other component making API calls

### For Each Component:

#### Step 1: Add Imports

```javascript
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";
```

#### Step 2: Replace API URLs

Find all instances of old API URLs:

- Old: `https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/...`
- Replace with: `API_ENDPOINTS.XXX`

#### Step 3: Update Fetch Calls

Old:

```javascript
fetch(url, { headers: { Authorization: `Bearer ${token}` } });
```

New:

```javascript
fetchWithAuth(endpoint, { method: "POST", body: ... })
```

#### Step 4: Update Response Handling

Old: `const { fullName } = data`
New: `const { full_name } = data.user`

See `FRONTEND_MIGRATION_GUIDE.md` for specific examples!

### Components Progress

- [ ] registerforlsts.jsx - Updated
- [ ] Dashboard.jsx - Updated
- [ ] admin.jsx - Updated
- [ ] contact.jsx - Updated
- [ ] submitaprayerrequest.jsx - Updated
- [ ] leadershipsurmit.jsx - Updated

---

## Phase 4: Testing (30 minutes)

### Backend Tests

- [ ] Health check endpoint: `curl http://localhost:3001/health`
  - [ ] Returns: `{"status": "✅ Server is running", ...}`

- [ ] Signup:

  ```bash
  curl -X POST http://localhost:3001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!","fullName":"Test User"}'
  ```

  - [ ] Returns user ID and success message

- [ ] Login:

  ```bash
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!"}'
  ```

  - [ ] Returns JWT token
  - [ ] Save token for next test

- [ ] Get Profile (replace TOKEN):
  ```bash
  curl http://localhost:3001/api/auth/profile \
    -H "Authorization: Bearer TOKEN"
  ```

  - [ ] Returns user profile data

### Frontend Tests

- [ ] Start frontend: `npm run dev`
- [ ] Open `http://localhost:5173` in browser
- [ ] Check browser console (F12):
  - [ ] No CORS errors
  - [ ] No "Cannot find module" errors
  - [ ] API_BASE_URL is correct
- [ ] Try signup flow:
  - [ ] Fill signup form
  - [ ] Submit
  - [ ] Should succeed without 400 errors
- [ ] Try login:
  - [ ] Use account just created
  - [ ] Should redirect to dashboard
- [ ] Check sessionStorage (DevTools → Application):
  - [ ] `authToken` exists
  - [ ] Token is a long string

### Full E2E Tests

- [ ] User signup
- [ ] User login
- [ ] View profile
- [ ] Submit LSTS form
- [ ] View LSTS confirmation
- [ ] Submit prayer request
- [ ] Admin login and check admin status
- [ ] Admin view all LSTS submissions
- [ ] Admin upload audio message

---

## Phase 5: Deployment (30 minutes)

### Deploy Backend

#### Option 1: Render (Recommended)

- [ ] Go to [render.com](https://render.com)
- [ ] Sign up / Login with GitHub
- [ ] Connect your GitHub repository
- [ ] Create "New Web Service"
- [ ] Select your repository
- [ ] Name: `divine-grace-backend`
- [ ] Runtime: `Node.js`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Add Environment Variables:
  - [ ] Copy all from `.env` file
  - [ ] Paste each one
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Get your public URL (e.g., `https://divine-grace-backend.onrender.com`)
- [ ] Test: Visit `/health` endpoint
- [ ] ✅ Backend deployed!

#### Option 2: Railway

- [ ] Similar to Render
- [ ] Go to [railway.app](https://railway.app)
- [ ] Connect GitHub
- [ ] Deploy with environment variables

### Deploy Frontend

#### Option 1: Vercel (Recommended)

- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Login with GitHub
- [ ] Click "New Project"
- [ ] Select your repository
- [ ] Name: `divine-grace-unnn`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment Variables:
  - [ ] Add `VITE_API_URL=https://your-backend-url.onrender.com`
- [ ] Click "Deploy"
- [ ] Wait for deployment (2-3 minutes)
- [ ] Get your public URL (e.g., `https://divine-grace-unnn.vercel.app`)
- [ ] ✅ Frontend deployed!

#### Option 2: Netlify

- [ ] Similar to Vercel
- [ ] Go to [netlify.com](https://netlify.com)
- [ ] Connect GitHub repository
- [ ] Deploy

### Post-Deployment Verification

- [ ] Visit frontend URL in browser
- [ ] Signup works
- [ ] Login works
- [ ] Can submit forms
- [ ] Can upload files
- [ ] Check browser console for errors
- [ ] Check backend logs (in Render dashboard)

---

## Phase 6: Production Hardening (Optional)

- [ ] Set up custom domain
  - [ ] Point DNS to Vercel/Netlify
  - [ ] Point API subdomain to Render
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up monitoring
  - [ ] Sentry for error tracking
  - [ ] LogRocket for session replay
- [ ] Set up backups
  - [ ] Supabase automatic daily backups
  - [ ] Download backups weekly
- [ ] Set up analytics
  - [ ] Google Analytics on frontend
  - [ ] Datadog/New Relic for backend
- [ ] Security audit
  - [ ] Check .env is not in git
  - [ ] Review CORS settings
  - [ ] Test RLS policies in Supabase

---

## Phase 7: Ongoing Maintenance

### Daily

- [ ] Monitor error logs
- [ ] Check Supabase dashboard
- [ ] Check Cloudflare storage usage

### Weekly

- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Download database backups
- [ ] Test file uploads

### Monthly

- [ ] Update dependencies: `npm update`
- [ ] Review security updates
- [ ] Check storage costs
- [ ] Optimize database queries

---

## 🚨 Troubleshooting Quick Reference

### Problem: Backend won't start

**Check**:

1. Is port 3001 in use? (Change PORT in .env)
2. All .env variables filled?
3. Node.js version ≥ 14?
4. npm install completed?

### Problem: Cannot connect to database

**Check**:

1. Supabase project created?
2. SUPABASE_URL in .env?
3. SUPABASE_SERVICE_KEY correct?
4. Tables created via SQL?

### Problem: File uploads failing

**Check**:

1. Cloudflare R2 bucket created?
2. API tokens correct?
3. File size < 500MB?
4. Audio format allowed?

### Problem: Frontend API calls failing

**Check**:

1. Backend running?
2. VITE_API_URL correct?
3. fetchWithAuth being used?
4. Token in sessionStorage?

### Problem: Admin functions not working

**Check**:

1. User assigned admin role?
2. SQL: `INSERT INTO admin_assignments (user_id, role) VALUES ('user-id', 'admin');`
3. Refresh page after assignment
4. Check Supabase dashboard

---

## 📋 Final Verification

Run through this checklist to ensure everything is working:

### Backend

- [ ] Server starts without errors
- [ ] Health check returns 200 status
- [ ] Signup works and creates user
- [ ] Login returns JWT token
- [ ] Get Profile with token works
- [ ] Submit prayer request works
- [ ] Submit LSTS form works
- [ ] Admin endpoints blocked for non-admins
- [ ] Admin endpoints work for admins

### Frontend

- [ ] Compiles without errors
- [ ] Can view landing page
- [ ] Can navigate to signup
- [ ] Can sign up new account
- [ ] Can log in
- [ ] Can view dashboard
- [ ] Can submit LSTS form
- [ ] Can submit prayer request
- [ ] All API calls show no errors in console
- [ ] All data persists after page refresh

### Database

- [ ] All 6 tables created
- [ ] Data appears in Supabase dashboard
- [ ] Can run SQL queries
- [ ] RLS policies applied

### File Storage

- [ ] R2 bucket exists
- [ ] Can upload files
- [ ] Files accessible via public URL
- [ ] File URLs work in download links

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Backend runs at `http://localhost:3001`
2. ✅ Frontend runs at `http://localhost:5173`
3. ✅ You can signup → login → view dashboard
4. ✅ You can submit LSTS form
5. ✅ Data appears in Supabase dashboard
6. ✅ Admin can see all submissions
7. ✅ Audio files upload successfully
8. ✅ No errors in browser console
9. ✅ No errors in backend terminal
10. ✅ Both deployed to production URLs

---

## 🎉 Congratulations!

If you've completed this checklist, you have:

✅ A fully functional backend with:

- Authentication system
- Database for all data
- File storage for media
- Admin dashboard
- Security & encryption

✅ A migrated frontend with:

- API integration
- Error handling
- Session management
- Form submissions

✅ A production-ready infrastructure with:

- Automatic scaling
- Global CDN
- Backups & recovery
- Security best practices

You're ready to go live! 🚀

---

**Next Step**: Start with Phase 0 and work through each phase in order.

**Questions?** Check the relevant documentation:

- QUICK_START.md for fast setup
- COMPLETE_SETUP_GUIDE.md for detailed help
- FRONTEND_MIGRATION_GUIDE.md for component updates
- ARCHITECTURE.md to understand the system

Good luck! 🙏

# Deployment Guide for Divine Grace UNN

## Current Setup
- **Domain**: divinegraceunn.com.ng
- **Frontend**: GitHub Pages
- **Backend**: Needs to be deployed separately (see options below)

## 1. Commit and Push Changes to GitHub

Run these commands in PowerShell:

```powershell
# Check current status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Update backend integration with Supabase and Cloudflare R2"

# Push to GitHub
git push origin main
```

## 2. Deploy Frontend to GitHub Pages

Your frontend will automatically deploy when you push to GitHub if GitHub Pages is enabled.

**Verify GitHub Pages Settings:**
1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under "Source", select **GitHub Actions** or **main branch**
4. Your site will be available at: `https://divinegraceunn.com.ng`

## 3. Deploy Backend (Choose One Option)

### Option A: Render.com (Recommended - Free Tier Available)

1. Go to https://render.com and sign up
2. Click **New** > **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: divine-grace-backend
   - **Root Directory**: (leave empty)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node backend-server.js`
   - **Plan**: Free

5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY`
   - `CLOUDFLARE_R2_SECRET_KEY`
   - `CLOUDFLARE_R2_BUCKET`
   - `CLOUDFLARE_R2_PUBLIC_URL`
   - `JWT_SECRET` (generate a random string)
   - `PORT` (set to 3001)

6. Click **Create Web Service**
7. Your backend URL will be: `https://divine-grace-backend.onrender.com`

8. **Update your frontend .env.production**:
   ```
   VITE_API_URL=https://divine-grace-backend.onrender.com
   ```

### Option B: Railway.app (Alternative)

1. Go to https://railway.app
2. Click **New Project** > **Deploy from GitHub**
3. Select your repository
4. Add the same environment variables as above
5. Your backend will get a URL like: `https://your-app.railway.app`

### Option C: Vercel (For Backend)

1. Go to https://vercel.com
2. Import your GitHub repository
3. Set Root Directory to backend folder
4. Add environment variables
5. Deploy

## 4. Update Domain for Backend (Optional)

If you want a subdomain for your backend:

1. Go to your domain registrar (e.g., Namecheap, GoDaddy)
2. Add a CNAME record:
   - **Host**: `api`
   - **Value**: Your backend hosting URL (e.g., `divine-grace-backend.onrender.com`)

3. Update `.env.production`:
   ```
   VITE_API_URL=https://api.divinegraceunn.com.ng
   ```

## 5. Rebuild and Redeploy Frontend

After backend is deployed:

```powershell
# Build for production
npm run build

# Commit the changes
git add .
git commit -m "Update production API URL"
git push origin main
```

## 6. Verify Deployment

1. Visit https://divinegraceunn.com.ng
2. Test login/signup
3. Test LSTS registration
4. Check admin panel
5. Monitor browser console for errors

## Important Notes

- **Backend .env file**: Never commit the `.env` file to GitHub (it's in .gitignore)
- **Environment Variables**: Set them directly in your hosting platform
- **CORS**: Your backend already has CORS enabled for your domain
- **Database**: Supabase is already cloud-hosted, no extra setup needed
- **File Storage**: Cloudflare R2 is already cloud-hosted

## Troubleshooting

**If frontend can't connect to backend:**
1. Check browser console for CORS errors
2. Verify `VITE_API_URL` in `.env.production`
3. Ensure backend is running (visit backend URL directly)
4. Check backend logs in hosting platform

**If backend won't start:**
1. Verify all environment variables are set
2. Check backend logs for errors
3. Ensure Node.js version is compatible (14+)
4. Verify package.json has all dependencies

## Cost Summary

- **Frontend (GitHub Pages)**: FREE
- **Backend (Render Free Tier)**: FREE (with limitations)
- **Supabase Free Tier**: FREE (500MB database, 1GB file storage)
- **Cloudflare R2**: First 10GB storage FREE
- **Domain**: Your existing cost

Total Monthly Cost: **$0** (on free tiers)

## Recommended Production Setup

For better reliability as you grow:
- **Backend**: Render Starter Plan ($7/month) or Railway Hobby Plan ($5/month)
- **Database**: Supabase Pro ($25/month) when you exceed free tier
- **Monitoring**: Use Render/Railway built-in logs

---

**Need Help?** Check the hosting platform documentation or backend logs for specific errors.

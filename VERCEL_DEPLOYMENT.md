# 🚀 Vercel Deployment Guide - Phasee

## ✅ CRITICAL: Environment Variables Setup

Your app is configured and ready for Vercel deployment. **You MUST set these environment variables in Vercel for the app to work:**

### 🔒 SECURITY UPDATE: API Keys Now Secure!

**IMPORTANT:** We've moved OpenAI calls to a serverless function to keep your API key SECRET and never exposed to the browser. Vercel was right to warn you!

### Required Environment Variables:

Go to your Vercel project → Settings → Environment Variables → Add the following:

#### 1. OpenAI API Key (REQUIRED - Server-side only, SECURE)
```
OPENAI_API_KEY=sk-your-actual-openai-key-here
```
**⚠️ NO `VITE_` PREFIX!** This keeps it server-side only (secure)
**Get it from:** https://platform.openai.com/api-keys

#### 2. Supabase URL (Optional - Client-side, SAFE to expose)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
```
**✅ HAS `VITE_` PREFIX** - Safe to expose (protected by RLS)
**Get it from:** Your Supabase project → Settings → API

#### 3. Supabase Anon Key (Optional - Client-side, SAFE to expose)
```
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
**✅ HAS `VITE_` PREFIX** - Safe to expose (designed for client-side use)
**Get it from:** Your Supabase project → Settings → API

---

## 🔐 Why This Is Secure Now:

| Before (Insecure) | After (Secure) |
|-------------------|----------------|
| ❌ OpenAI API key exposed in browser | ✅ OpenAI API key stays on server |
| ❌ Anyone could steal your key | ✅ Key never leaves Vercel backend |
| ❌ Could rack up charges on your account | ✅ Protected from abuse |
| ✅ Supabase keys (safe to expose) | ✅ Supabase keys (still safe) |

**How it works:**
1. Frontend calls `/api/generate-ideas` (your serverless function)
2. Serverless function uses `OPENAI_API_KEY` (server-side, never exposed)
3. Results returned to frontend
4. API key never touches the browser!

---

## 📦 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready with environment variables"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

3. **Set Environment Variables:**
   - In project settings → Environment Variables
   - Add all three variables above
   - Set for: Production, Preview, Development

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables via CLI
vercel env add VITE_OPENAI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## 🔧 What's Been Fixed

### 1. ✅ Background Loading Issue FIXED
- **Problem:** Black screen on startup
- **Solution:** 
  - Added `<link rel="preload">` for background image
  - Added inline CSS gradient fallback
  - Now shows beautiful gradient immediately, then image loads smoothly
  - No more black screen!

### 2. ✅ Environment Variables FIXED
- **Problem:** API keys not accessible in production
- **Solution:**
  - Cleaned up environment variable access
  - Now uses `import.meta.env.VITE_*` correctly
  - Works with Vercel's build system
  - Fallbacks for development

### 3. ✅ Production Build Optimized
- Added `vercel.json` configuration
- Proper caching headers
- SPA routing configured
- Build optimization

---

## 🎯 Verify Deployment

After deploying, check:

1. **Visit your Vercel URL** (e.g., `your-app.vercel.app`)
2. **Check console logs** (F12 → Console):
   - Should see: `✅ Supabase configured`
   - Should NOT see: `⚠️ OpenAI API key NOT configured`
3. **Test idea generation:**
   - Sign up / Sign in
   - Click dice icon to generate ideas
   - Should get real AI ideas (not fallback comedy ones)

---

## 🔍 Troubleshooting

### "AI Got KO'd" Error in Production

**Cause:** OpenAI API key not set in Vercel

**Fix:**
1. Go to Vercel project → Settings → Environment Variables
2. Add: `VITE_OPENAI_API_KEY` = `sk-your-key`
3. Redeploy: Go to Deployments → Click "..." → Redeploy

### Background Still Black

**Cause:** Browser cache

**Fix:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear cache
3. Check Network tab to verify background image loads

### Environment Variables Not Working

**Cause:** Missing `VITE_` prefix

**Fix:**
- All environment variables MUST start with `VITE_`
- Example: `VITE_OPENAI_API_KEY` (correct)
- Example: `OPENAI_API_KEY` (won't work)

---

## 📊 Current Configuration

### Files Updated:
- ✅ `index.html` - Background preload + inline CSS
- ✅ `openai-service.js` - Clean env var access
- ✅ `supabase.js` - Clean env var access
- ✅ `vercel.json` - Vercel configuration
- ✅ `app.js` - Hilarious fallback ideas

### Build Info:
- **Framework:** Vite 5
- **Output:** `dist/` folder
- **Entry:** `index.html`
- **Assets:** Optimized and cached

---

## 🎉 You're Ready!

Everything is configured for 24/7 live deployment on Vercel. Just:

1. ✅ Push to GitHub
2. ✅ Connect to Vercel
3. ✅ Set environment variables
4. ✅ Deploy
5. ✅ Live! 🚀

---

## 📱 After Deployment

### For iOS App Store:
After Vercel is live, you can:
1. Keep using the Vercel URL in your Capacitor app
2. Or configure a custom domain
3. Build iOS app: `npm run cap:ios`
4. Test with live backend
5. Submit to App Store

### Custom Domain (Optional):
1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `phasee.app`)
3. Update DNS records
4. SSL automatically configured

---

## 🔒 Security Notes

- ✅ API keys stored in Vercel (not in code)
- ✅ Environment variables encrypted
- ✅ Git ignores `.env.local`
- ✅ Supabase RLS policies active
- ✅ HTTPS enforced by Vercel

---

**Last Updated:** November 9, 2025  
**Status:** 🟢 Production Ready for Vercel


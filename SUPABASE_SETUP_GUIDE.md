# 🚀 Supabase Setup Guide - Phasee

## Step 1: Set Up Database Tables

### 1.1 Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `ootaqjhxpkcflomxjmxs`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### 1.2 Run the Schema SQL
1. Open the file `SUPABASE_SCHEMA.sql` in this project
2. Copy the ENTIRE contents
3. Paste into the Supabase SQL Editor
4. Click **RUN** (or press Ctrl+Enter)

**Expected Result:** You should see:
- ✅ Tables created: `profiles`, `ideas`, `generation_analytics`, `app_analytics`, `feedback`
- ✅ Functions created: `get_daily_generation_stats`, `get_page_time_stats`
- ✅ RLS policies enabled

### 1.3 Verify Tables Were Created
1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - `profiles`
   - `ideas`
   - `generation_analytics`
   - `app_analytics`
   - `feedback`

---

## Step 2: Configure Authentication Settings

### 2.1 Enable Email Authentication
1. Go to **Authentication** → **Providers** in Supabase
2. Make sure **Email** is enabled
3. Scroll down to **Email Auth** settings:
   - ✅ Enable email confirmations: **ON**
   - ✅ Enable email change confirmations: **ON**
   - ✅ Secure email change: **ON**

### 2.2 Configure Email Templates (Optional but Recommended)
1. Go to **Authentication** → **Email Templates**
2. Customize these templates with your branding:
   - **Confirm signup** - Sent when user signs up
   - **Magic Link** - For passwordless login (if you want this)
   - **Change Email Address** - When user changes email
   - **Reset Password** - For password resets

**Default templates work fine for now!**

### 2.3 Set Site URL (Important!)
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:4000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:4000`
   - `http://localhost:4000/index.html`
   - Later add your production URL (e.g., `https://yourapp.com`)

---

## Step 3: Verify Environment Variables

### 3.1 Check Your .env File
Make sure you have a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://ootaqjhxpkcflomxjmxs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdGFxamh4pkcflomxjmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjM0OTgsImV4cCI6MjA3ODE5OTQ5OH0.zc-Z1yzXXNtn7KJn1NJ6Buz4bokr_hOSnPmeOSRiWws
```

**Note:** These are already in your `supabase.js` file, so you're good!

---

## Step 4: Test Database Connection

### 4.1 Test in Browser Console
1. Start your dev server: `npm run dev`
2. Open browser to `http://localhost:4000`
3. Open Developer Console (F12)
4. Type: `supabase.auth.getSession()`
5. Press Enter

**Expected Result:** Should return a session object (even if null/empty)

---

## Step 5: What Happens Next

Once the database is set up, I'll update the frontend code to:

### ✅ Authentication Flow
- Real sign-up with email confirmation
- Real sign-in with password validation
- Password reset functionality
- Session management

### ✅ Data Persistence
- User profiles saved to database
- Pinned ideas saved to database
- Scheduled ideas saved to database
- Analytics tracked in real-time

### ✅ Security
- Row Level Security (RLS) ensures users only see their own data
- Passwords hashed by Supabase
- Secure session tokens

---

## 🎯 Ready to Proceed?

**After you complete Steps 1-3 above:**
1. Confirm the tables are created in Supabase
2. Let me know, and I'll implement the frontend authentication code
3. We'll test the full sign-up → onboarding → app flow

---

## 🆘 Troubleshooting

### "Permission denied" errors
- Check that RLS policies were created (they're in the SQL file)
- Verify you're signed in to Supabase

### Tables not showing up
- Make sure you ran the ENTIRE `SUPABASE_SCHEMA.sql` file
- Check for errors in the SQL Editor output

### Can't sign up users
- Verify email authentication is enabled
- Check Site URL is set correctly
- Look at Authentication → Users to see if accounts are being created

---

**Let me know when you've completed the Supabase setup, and I'll wire up the frontend!** 🚀


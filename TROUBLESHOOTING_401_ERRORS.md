# 🔴 TROUBLESHOOTING 401 ERRORS

## What's Happening

You're seeing 401 Unauthorized errors because:
1. **Database tables might not be set up**
2. **RLS policies are blocking unauthenticated requests**
3. **Analytics trying to track before user logs in**

---

## ✅ QUICK FIX CHECKLIST

### Step 1: Verify Database Setup ⚠️

**Did you run the SQL schema?**

1. Go to: https://supabase.com/dashboard/project/ootaqjhxpkcflomxjmxs/sql/new
2. Open file: `SUPABASE_FRESH_START.sql`
3. Copy **ALL 188 lines**
4. Paste into SQL Editor
5. Click **RUN**
6. Wait for "Success" ✅

### Step 2: Verify Tables Exist

Go to: https://supabase.com/dashboard/project/ootaqjhxpkcflomxjmxs/editor

**You should see these tables:**
- ✅ profiles
- ✅ ideas
- ✅ generation_analytics
- ✅ app_analytics
- ✅ feedback

**If you DON'T see them:** The SQL didn't run! Go back to Step 1.

### Step 3: Check RLS Policies

Go to: https://supabase.com/dashboard/project/ootaqjhxpkcflomxjmxs/auth/policies

**Each table should have policies:**
- profiles: 3 policies
- ideas: 4 policies
- generation_analytics: 2 policies
- app_analytics: 2 policies
- feedback: 2 policies

**If policies are missing:** Run the SQL again.

---

## 🔧 Code Fix Applied

I've updated `app.js` to:
- ✅ Only track analytics when user is logged in
- ✅ Prevent RLS errors on sign-in page
- ✅ Check for user before tracking

---

## 🧪 TEST AGAIN

### After Database Setup:

1. **Rebuild:** `npm run build`
2. **Refresh page** (Ctrl+Shift+R)
3. **Open Console** (F12)
4. **Should see:**
   - ✅ "No active session" (normal, not logged in)
   - ✅ NO 401 errors
   - ✅ NO RLS policy errors

### Then Try Sign Up:

1. Click "Create New Account"
2. Fill out form
3. Submit
4. Should work without errors!

---

## 🚨 If Still Getting Errors

### Error: "new row violates row-level security policy"
**Cause:** Tables exist but RLS policies are wrong  
**Fix:** Re-run `SUPABASE_FRESH_START.sql`

### Error: "relation does not exist"
**Cause:** Tables weren't created  
**Fix:** Run `SUPABASE_FRESH_START.sql` for the first time

### Error: 401 Unauthorized
**Cause:** API key is wrong  
**Fix:** Double-check the anon key matches Supabase dashboard

---

## 📝 Current Status

### ✅ Fixed:
- Analytics only runs when logged in
- No more RLS errors on sign-in page
- Auth toggle button works

### ⚠️ Need to Verify:
- Database tables are created
- RLS policies are active
- API key is correct

---

**Next: Please confirm you ran the SQL schema in Supabase!** 🔍

If you haven't, that's the issue! The database needs to be set up first.


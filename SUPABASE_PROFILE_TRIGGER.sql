-- ============================================
-- SUPABASE PROFILE TRIGGER
-- ============================================
-- 
-- PURPOSE: Automatically create a profile row when a new user signs up.
-- This is the RELIABLE server-side mechanism for profile creation.
-- Client-side profile creation is a backup only.
--
-- SECURITY:
-- - Uses SECURITY DEFINER to run with elevated privileges
-- - Only triggers on INSERT to auth.users
-- - Sets default values for onboarding_complete (false)
--
-- RUN THIS IN: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Create the profiles table if it doesn't exist
-- (Skip if you already have a profiles table - just ensure columns match)

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    display_name TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    subscription_status TEXT DEFAULT 'none',
    trial_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (Row Level Security) on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Users can only read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for client-side backup creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4. Create the function that handles new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name, onboarding_complete, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''),
        FALSE,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger that fires on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- ============================================
-- SUPABASE DASHBOARD SETTINGS
-- ============================================
-- 
-- Make sure these are configured in your Supabase project:
--
-- 1. Site URL (Authentication > URL Configuration):
--    Set to your production URL: https://your-app.vercel.app
--
-- 2. Redirect URLs (Authentication > URL Configuration):
--    Add these to "Redirect URLs":
--    - https://your-app.vercel.app/
--    - https://your-app.vercel.app/*
--    - http://localhost:5173/ (for local dev)
--    - http://localhost:5173/*
--
-- 3. Email Templates (Authentication > Email Templates):
--    For password reset, ensure the template uses {{ .ConfirmationURL }}
--    which will include type=recovery in the URL hash.
--
-- ============================================
-- VERIFICATION
-- ============================================
-- 
-- After running this SQL, verify:
--
-- 1. Check the trigger exists:
--    SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- 2. Check the function exists:
--    SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
--
-- 3. Test by creating a new user and checking profiles table:
--    SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
--
-- ============================================

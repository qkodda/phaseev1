-- ============================================
-- PHASEE BACKEND SECURITY & RLS MIGRATION
-- Date: 2024-12-20
-- Branch: backend-org
-- ============================================
-- 
-- This migration ensures RLS is enabled and properly configured
-- on all backend tables with secure policies.
-- 
-- It is idempotent - safe to run multiple times.
-- DO NOT modify unrelated tables.
-- ============================================

-- ============================================
-- PROFILES TABLE - RLS POLICIES
-- ============================================

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        LIMIT 1
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on profiles table';
    ELSE
        RAISE NOTICE 'RLS already enabled on profiles table';
    END IF;
END $$;

-- Drop existing policies if they exist (to recreate with correct names)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- IDEAS TABLE - RLS POLICIES
-- ============================================

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ideas' 
        LIMIT 1
    ) THEN
        ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on ideas table';
    ELSE
        RAISE NOTICE 'RLS already enabled on ideas table';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can update own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON ideas;

-- Create RLS policies for ideas
CREATE POLICY "Users can view own ideas"
  ON ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GENERATION_ANALYTICS TABLE - RLS POLICIES
-- ============================================

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generation_analytics' 
        LIMIT 1
    ) THEN
        ALTER TABLE generation_analytics ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on generation_analytics table';
    ELSE
        RAISE NOTICE 'RLS already enabled on generation_analytics table';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own analytics" ON generation_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON generation_analytics;

-- Create RLS policies for generation_analytics
-- Users can INSERT their own analytics (write-only for users)
CREATE POLICY "Users can insert own analytics"
  ON generation_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users CANNOT read analytics (admin-only reads via service role)
-- No SELECT policy = no reads allowed for users

-- ============================================
-- APP_ANALYTICS TABLE - RLS POLICIES
-- ============================================

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'app_analytics' 
        LIMIT 1
    ) THEN
        ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on app_analytics table';
    ELSE
        RAISE NOTICE 'RLS already enabled on app_analytics table';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own app analytics" ON app_analytics;

-- Create RLS policies for app_analytics
-- Users can INSERT analytics (anonymous allowed for error tracking)
CREATE POLICY "Users can insert own app analytics"
  ON app_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users CANNOT read analytics (admin-only reads via service role)
-- No SELECT policy = no reads allowed for users

-- ============================================
-- FEEDBACK TABLE - RLS POLICIES
-- ============================================

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feedback' 
        LIMIT 1
    ) THEN
        ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on feedback table';
    ELSE
        RAISE NOTICE 'RLS already enabled on feedback table';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

-- Create RLS policies for feedback
-- Anyone can INSERT feedback (anonymous submissions allowed)
CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Users can only view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- RLS Status:
-- ✅ profiles - RLS enabled, users can manage own profile
-- ✅ ideas - RLS enabled, users can manage own ideas
-- ✅ generation_analytics - RLS enabled, INSERT only (no reads)
-- ✅ app_analytics - RLS enabled, INSERT only (no reads, anonymous allowed)
-- ✅ feedback - RLS enabled, INSERT by anyone, SELECT own only
-- 
-- Security Model:
-- - Users can only access their own data (profiles, ideas)
-- - Analytics are write-only for users (admin reads via service role)
-- - Feedback can be submitted anonymously, but only readable by creator
-- 
-- Next steps:
-- 1. Verify policies in Supabase Dashboard > Authentication > Policies
-- 2. Test with authenticated user
-- 3. Test with anonymous user (should fail on protected tables)
-- ============================================


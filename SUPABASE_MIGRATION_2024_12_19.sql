-- ============================================
-- PHAZEE BACKEND FIXES - IDEMPOTENT MIGRATION
-- Date: 2024-12-19
-- Branch: backend-org
-- ============================================
-- 
-- This migration adds missing columns to profiles table.
-- It is idempotent - safe to run multiple times.
-- 
-- DO NOT modify unrelated tables.
-- ============================================

-- Add onboarding_complete column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'onboarding_complete'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Added onboarding_complete column to profiles table';
    ELSE
        RAISE NOTICE 'Column onboarding_complete already exists in profiles table';
    END IF;
END $$;

-- Add trial_started_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'trial_started_at'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN trial_started_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Added trial_started_at column to profiles table';
    ELSE
        RAISE NOTICE 'Column trial_started_at already exists in profiles table';
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- Columns added:
-- ✅ profiles.onboarding_complete (BOOLEAN, DEFAULT FALSE)
-- ✅ profiles.trial_started_at (TIMESTAMPTZ, nullable)
-- 
-- Next steps:
-- 1. Update supabase.js to use 'profiles' table (not 'user_profiles')
-- 2. Update supabase.js to use 'ideas' table (not 'user_ideas')
-- 3. Ensure all functions use sealed helpers
-- ============================================


-- ============================================
-- DATABASE DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to check your ideas table
-- ============================================

-- 1. Check if ideas table exists and has correct schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ideas'
ORDER BY ordinal_position;

-- 2. Count total ideas by status
SELECT 
    status,
    COUNT(*) as count
FROM ideas
GROUP BY status;

-- 3. Count pinned vs scheduled ideas
SELECT 
    is_pinned,
    is_scheduled,
    COUNT(*) as count
FROM ideas
GROUP BY is_pinned, is_scheduled;

-- 4. Show all pinned ideas (these are the ones loading on login)
SELECT 
    id,
    title,
    is_pinned,
    is_scheduled,
    scheduled_date,
    created_at
FROM ideas
WHERE is_pinned = true
ORDER BY created_at DESC;

-- 5. Show all scheduled ideas
SELECT 
    id,
    title,
    is_pinned,
    is_scheduled,
    scheduled_date,
    created_at
FROM ideas
WHERE is_scheduled = true
ORDER BY scheduled_date;

-- ============================================
-- CLEANUP SCRIPTS (use with caution!)
-- ============================================

-- Option 1: Unpin all ideas (sets is_pinned to false)
-- UPDATE ideas SET is_pinned = false WHERE is_pinned = true;

-- Option 2: Delete all pinned ideas permanently
-- DELETE FROM ideas WHERE is_pinned = true;

-- Option 3: Delete ALL ideas (DANGEROUS!)
-- DELETE FROM ideas;


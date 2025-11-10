-- ============================================
-- CRITICAL SCHEMA FIX
-- Run this in Supabase SQL Editor to fix missing columns
-- ============================================

-- Add missing columns to ideas table
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS setup TEXT,
ADD COLUMN IF NOT EXISTS story TEXT,
ADD COLUMN IF NOT EXISTS hook TEXT,
ADD COLUMN IF NOT EXISTS generation_method TEXT,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_is_pinned ON ideas(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_ideas_is_scheduled ON ideas(is_scheduled) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_ideas_scheduled_date_sorted ON ideas(scheduled_date) WHERE is_scheduled = true;

-- Migrate existing data from status to is_pinned/is_scheduled (if needed)
-- Uncomment if you have existing data with status field:
-- UPDATE ideas SET is_pinned = true WHERE status = 'pinned';
-- UPDATE ideas SET is_scheduled = true WHERE status = 'scheduled';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ideas'
ORDER BY ordinal_position;


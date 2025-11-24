-- ============================================
-- PHAZEE SCHEMA MIGRATION - November 9, 2024
-- Adds missing fields to ideas table
-- ============================================

-- Add missing content fields
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS setup TEXT,
ADD COLUMN IF NOT EXISTS story TEXT,
ADD COLUMN IF NOT EXISTS hook TEXT,
ADD COLUMN IF NOT EXISTS generation_method TEXT;

-- Add state management fields
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;

-- Update existing records to set default status
UPDATE ideas 
SET status = 'active'
WHERE status IS NULL;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_ideas_is_pinned ON ideas(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_ideas_is_scheduled ON ideas(is_scheduled) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_ideas_scheduled_date_sorted ON ideas(scheduled_date) WHERE is_scheduled = true;

-- Verify schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ideas'
ORDER BY ordinal_position;

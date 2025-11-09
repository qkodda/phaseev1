-- ============================================
-- SUPABASE MIGRATION - 2024-11-09
-- Align existing projects with latest schema changes
-- Run this in your Supabase SQL editor if your project
-- was created before November 9, 2024.
-- ============================================

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS setup TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS hook TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS generation_method TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idea';

-- Backfill status column based on pin/schedule flags
UPDATE ideas
SET status = CASE
    WHEN COALESCE(is_scheduled, FALSE) THEN 'scheduled'
    WHEN COALESCE(is_pinned, FALSE) THEN 'pinned'
    ELSE COALESCE(status, 'idea')
END;

-- Ensure helpful indexes exist
CREATE INDEX IF NOT EXISTS idx_ideas_is_pinned ON ideas(is_pinned);
CREATE INDEX IF NOT EXISTS idx_ideas_is_scheduled ON ideas(is_scheduled);
CREATE INDEX IF NOT EXISTS idx_ideas_scheduled_date ON ideas(scheduled_date);

-- Touch updated_at so triggers continue to work
UPDATE ideas SET updated_at = NOW() WHERE updated_at IS NOT NULL;

SELECT '✅ Migration complete - ideas table updated' AS status;

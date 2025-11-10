-- Clear all pinned ideas from the database
-- Run this in your Supabase SQL Editor to reset pinned ideas

UPDATE ideas
SET is_pinned = false
WHERE is_pinned = true;

-- Optional: Delete all ideas entirely (use with caution)
-- DELETE FROM ideas WHERE user_id = 'YOUR_USER_ID';


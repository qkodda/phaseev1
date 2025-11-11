-- CLEAR ALL IDEAS FROM DATABASE
-- Run this in your Supabase SQL Editor to completely reset your ideas
-- WARNING: This will delete ALL ideas (pinned and scheduled) for ALL users
-- Use with caution!

-- To clear ALL ideas for ALL users (DANGEROUS - only use in development):
-- DELETE FROM ideas;

-- To clear only YOUR ideas, replace 'YOUR_USER_ID_HERE' with your actual user ID:
-- You can find your user ID in the Supabase dashboard under Authentication > Users
DELETE FROM ideas WHERE user_id = 'YOUR_USER_ID_HERE';

-- To clear only pinned ideas for your user:
-- DELETE FROM ideas WHERE user_id = 'YOUR_USER_ID_HERE' AND is_pinned = true;

-- To clear only scheduled ideas for your user:
-- DELETE FROM ideas WHERE user_id = 'YOUR_USER_ID_HERE' AND is_scheduled = true;

-- After running this, refresh your browser and the ideas should be gone.
-- If they reappear, check:
-- 1. Your browser cache (try hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
-- 2. Make sure you're not logged into multiple tabs
-- 3. Check for any realtime subscriptions in the browser console


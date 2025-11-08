-- ============================================
-- PHASEE DATABASE SCHEMA - COMPLETE
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (User Preferences for AI)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name TEXT,
  bio TEXT,
  
  -- Content Preferences (for AI personalization)
  content_type TEXT, -- e.g., "Lifestyle", "Tech Review", "Comedy"
  target_audience TEXT, -- e.g., "Gen Z", "Young Professionals"
  niche TEXT, -- e.g., "Fitness", "Gaming", "Fashion"
  tone TEXT, -- e.g., "Casual", "Professional", "Humorous"
  
  -- Culture Values & Personality
  culture_values TEXT[], -- Array of selected values
  personality_traits TEXT[], -- For AI to understand creator style
  
  -- Platform Preferences
  platforms TEXT[], -- e.g., ["tiktok", "instagram", "youtube"]
  
  -- Subscription & Contact
  email TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
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
-- IDEAS TABLE (Pinned & Scheduled Only)
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Idea Content
  title TEXT NOT NULL,
  summary TEXT,
  action TEXT,
  setup TEXT,
  story TEXT,
  hook TEXT,
  why TEXT,
  platforms TEXT[],
  
  -- Status
  is_pinned BOOLEAN DEFAULT FALSE,
  is_scheduled BOOLEAN DEFAULT FALSE,
  scheduled_date DATE,
  
  -- Generation Context (for analytics)
  direction TEXT, -- What direction user gave
  is_campaign BOOLEAN DEFAULT FALSE,
  generation_method TEXT, -- 'random' or 'custom'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Policies for ideas
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
-- GENERATION ANALYTICS TABLE
-- Track idea generation, pinning, scheduling
-- ============================================
CREATE TABLE IF NOT EXISTS generation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Event Tracking
  event_type TEXT NOT NULL, -- 'generated', 'pinned', 'scheduled', 'swiped_left', 'deleted'
  ideas_count INTEGER DEFAULT 1,
  
  -- Context
  direction TEXT, -- What direction they gave
  is_campaign BOOLEAN,
  platforms TEXT[], -- Which platforms selected
  generation_method TEXT, -- 'random' or 'custom'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generation_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for generation_analytics
CREATE POLICY "Users can view own analytics"
  ON generation_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON generation_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_gen_analytics_user_date 
  ON generation_analytics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gen_analytics_event_type 
  ON generation_analytics(event_type, created_at);

-- ============================================
-- APP ANALYTICS TABLE
-- Track page views, session duration, errors
-- ============================================
CREATE TABLE IF NOT EXISTS app_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Page Tracking
  page_name TEXT NOT NULL, -- 'home', 'calendar', 'profile', 'settings', 'paywall'
  session_duration INTEGER, -- seconds spent on page
  
  -- Error Tracking
  error_type TEXT, -- 'api_error', 'ui_error', 'auth_error', etc.
  error_message TEXT,
  error_context JSONB, -- Additional error details
  
  -- Device Info
  device_type TEXT, -- 'ios', 'android', 'web'
  app_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for app_analytics
CREATE POLICY "Users can insert own app analytics"
  ON app_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Indexes for business analytics
CREATE INDEX IF NOT EXISTS idx_app_analytics_page 
  ON app_analytics(page_name, created_at);
CREATE INDEX IF NOT EXISTS idx_app_analytics_errors 
  ON app_analytics(error_type, created_at) 
  WHERE error_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_analytics_user 
  ON app_analytics(user_id, created_at);

-- ============================================
-- FEEDBACK TABLE
-- User feedback submissions
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Feedback Content
  message TEXT NOT NULL,
  
  -- User Info (in case they're not logged in)
  user_email TEXT,
  user_name TEXT,
  
  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'resolved'
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true); -- Anyone can submit feedback

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Index for admin review
CREATE INDEX IF NOT EXISTS idx_feedback_status 
  ON feedback(status, created_at);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_is_pinned ON ideas(is_pinned);
CREATE INDEX IF NOT EXISTS idx_ideas_is_scheduled ON ideas(is_scheduled);
CREATE INDEX IF NOT EXISTS idx_ideas_scheduled_date ON ideas(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ideas
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTOMATIC PROFILE CREATION
-- ============================================
-- Automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================

-- Function to get daily generation stats for a user
CREATE OR REPLACE FUNCTION get_daily_generation_stats(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  generated INTEGER,
  pinned INTEGER,
  scheduled INTEGER,
  swiped_left INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE event_type = 'generated') as generated,
    COUNT(*) FILTER (WHERE event_type = 'pinned') as pinned,
    COUNT(*) FILTER (WHERE event_type = 'scheduled') as scheduled,
    COUNT(*) FILTER (WHERE event_type = 'swiped_left') as swiped_left
  FROM generation_analytics
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get page time analytics
CREATE OR REPLACE FUNCTION get_page_time_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  page_name TEXT,
  total_sessions BIGINT,
  avg_duration NUMERIC,
  total_errors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.page_name,
    COUNT(*) as total_sessions,
    ROUND(AVG(a.session_duration), 2) as avg_duration,
    COUNT(*) FILTER (WHERE a.error_type IS NOT NULL) as total_errors
  FROM app_analytics a
  WHERE a.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY a.page_name
  ORDER BY total_sessions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL SETUP COMPLETE
-- ============================================
-- Your database is now ready!
-- 
-- Features included:
-- ✅ User profiles with subscription management
-- ✅ Ideas (pinned & scheduled only)
-- ✅ Generation analytics (track user behavior)
-- ✅ App analytics (page views, errors, sessions)
-- ✅ Feedback system
-- ✅ Automatic profile creation on signup
-- ✅ Helper functions for analytics queries
-- 
-- Next steps:
-- 1. Enable Email Auth in Supabase Dashboard > Authentication > Providers
-- 2. Configure Email Templates for confirmation & password reset
-- 3. Set up Stripe webhook for subscription management (if using Stripe)
-- 4. Get your Supabase URL and anon key from Settings > API
-- 5. Add them to your .env.local file
-- 6. Start using the Supabase client in your app

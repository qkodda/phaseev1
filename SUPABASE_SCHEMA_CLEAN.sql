-- ============================================
-- PHAZEE DATABASE SCHEMA (CLEAN VERSION)
-- Creates everything fresh, safe for first-time run
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    brand_name TEXT,
    role TEXT,
    founded_year INTEGER,
    industry TEXT,
    platforms TEXT[],
    culture_values TEXT[],
    bio TEXT,
    personality_traits TEXT[],
    production_level TEXT,
    subscription_status TEXT DEFAULT 'trial',
    stripe_customer_id TEXT,
    trial_started_at TIMESTAMPTZ,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    why TEXT,
    platforms TEXT[],
    direction TEXT,
    is_campaign BOOLEAN DEFAULT FALSE,
    method TEXT,
    status TEXT DEFAULT 'pinned',
    scheduled_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Analytics Table
CREATE TABLE IF NOT EXISTS generation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    ideas_count INTEGER DEFAULT 1,
    direction TEXT,
    is_campaign BOOLEAN,
    platforms TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Analytics Table
CREATE TABLE IF NOT EXISTS app_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    page_name TEXT,
    session_duration INTEGER,
    error_type TEXT,
    error_message TEXT,
    error_context TEXT,
    device_info TEXT,
    app_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_scheduled_date ON ideas(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_generation_analytics_user_id ON generation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_analytics_created_at ON generation_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_app_analytics_user_id ON app_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_event_type ON app_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: DROP EXISTING POLICIES (if any)
-- ============================================

DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    
    -- Ideas
    DROP POLICY IF EXISTS "Users can view own ideas" ON ideas;
    DROP POLICY IF EXISTS "Users can insert own ideas" ON ideas;
    DROP POLICY IF EXISTS "Users can update own ideas" ON ideas;
    DROP POLICY IF EXISTS "Users can delete own ideas" ON ideas;
    
    -- Generation Analytics
    DROP POLICY IF EXISTS "Users can view own generation analytics" ON generation_analytics;
    DROP POLICY IF EXISTS "Users can insert own generation analytics" ON generation_analytics;
    
    -- App Analytics
    DROP POLICY IF EXISTS "Users can view own app analytics" ON app_analytics;
    DROP POLICY IF EXISTS "Users can insert own app analytics" ON app_analytics;
    
    -- Feedback
    DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
    DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
END $$;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Ideas Policies
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

-- Generation Analytics Policies
CREATE POLICY "Users can view own generation analytics"
    ON generation_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation analytics"
    ON generation_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- App Analytics Policies
CREATE POLICY "Users can view own app analytics"
    ON app_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own app analytics"
    ON app_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Feedback Policies
CREATE POLICY "Users can view own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- STEP 6: CREATE FUNCTIONS
-- ============================================

-- Function: Get daily generation stats
CREATE OR REPLACE FUNCTION get_daily_generation_stats(user_uuid UUID)
RETURNS TABLE (
    date DATE,
    total_generated INTEGER,
    total_pinned INTEGER,
    total_scheduled INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ga.created_at) as date,
        COUNT(*) FILTER (WHERE ga.event_type = 'generated') as total_generated,
        COUNT(*) FILTER (WHERE ga.event_type = 'pinned') as total_pinned,
        COUNT(*) FILTER (WHERE ga.event_type = 'scheduled') as total_scheduled
    FROM generation_analytics ga
    WHERE ga.user_id = user_uuid
        AND ga.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(ga.created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get page time stats
CREATE OR REPLACE FUNCTION get_page_time_stats(user_uuid UUID)
RETURNS TABLE (
    page_name TEXT,
    total_time INTEGER,
    visit_count BIGINT,
    avg_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.page_name,
        SUM(aa.session_duration) as total_time,
        COUNT(*) as visit_count,
        AVG(aa.session_duration) as avg_time
    FROM app_analytics aa
    WHERE aa.user_id = user_uuid
        AND aa.event_type = 'page_view'
        AND aa.session_duration IS NOT NULL
    GROUP BY aa.page_name
    ORDER BY total_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: CREATE TRIGGERS
-- ============================================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PHAZEE DATABASE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables Created:';
    RAISE NOTICE '   • profiles';
    RAISE NOTICE '   • ideas';
    RAISE NOTICE '   • generation_analytics';
    RAISE NOTICE '   • app_analytics';
    RAISE NOTICE '   • feedback';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security:';
    RAISE NOTICE '   • Row Level Security enabled';
    RAISE NOTICE '   • User-specific policies active';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Functions:';
    RAISE NOTICE '   • get_daily_generation_stats()';
    RAISE NOTICE '   • get_page_time_stats()';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for authentication!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;


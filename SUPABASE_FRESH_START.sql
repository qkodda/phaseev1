-- ============================================
-- PHAZEE - FRESH START
-- Run this to completely reset and start clean
-- ============================================

-- STEP 1: Drop everything (if exists)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS app_analytics CASCADE;
DROP TABLE IF EXISTS generation_analytics CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS get_daily_generation_stats(UUID);
DROP FUNCTION IF EXISTS get_page_time_stats(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- STEP 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 3: Create tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    brand_name TEXT,
    role TEXT,
    founded_year TEXT,
    industry TEXT,
    target_audience TEXT,
    content_goals TEXT,
    post_frequency TEXT,
    production_level TEXT,
    platforms TEXT[],
    culture_values TEXT[],
    bio TEXT,
    personality_traits TEXT[],
    subscription_status TEXT DEFAULT 'trial',
    stripe_customer_id TEXT,
    trial_started_at TIMESTAMPTZ,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    action TEXT,
    setup TEXT,
    story TEXT,
    hook TEXT,
    why TEXT,
    platforms TEXT[],
    direction TEXT,
    is_campaign BOOLEAN DEFAULT FALSE,
    generation_method TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_scheduled BOOLEAN DEFAULT FALSE,
    scheduled_date DATE,
    status TEXT DEFAULT 'idea',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    ideas_count INTEGER DEFAULT 1,
    direction TEXT,
    is_campaign BOOLEAN,
    platforms TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_analytics (
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

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Create indexes
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_is_pinned ON ideas(is_pinned);
CREATE INDEX idx_ideas_is_scheduled ON ideas(is_scheduled);
CREATE INDEX idx_ideas_scheduled_date ON ideas(scheduled_date);
CREATE INDEX idx_generation_analytics_user_id ON generation_analytics(user_id);
CREATE INDEX idx_generation_analytics_created_at ON generation_analytics(created_at);
CREATE INDEX idx_app_analytics_user_id ON app_analytics(user_id);
CREATE INDEX idx_app_analytics_event_type ON app_analytics(event_type);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);

-- STEP 5: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own ideas" ON ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ideas" ON ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON ideas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own generation analytics" ON generation_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generation analytics" ON generation_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own app analytics" ON app_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own app analytics" ON app_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- STEP 7: Create functions
CREATE FUNCTION get_daily_generation_stats(user_uuid UUID)
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
    WHERE ga.user_id = user_uuid AND ga.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(ga.created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION get_page_time_stats(user_uuid UUID)
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
    WHERE aa.user_id = user_uuid AND aa.event_type = 'page_view' AND aa.session_duration IS NOT NULL
    GROUP BY aa.page_name
    ORDER BY total_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done!
SELECT '✅ Database setup complete!' as status;


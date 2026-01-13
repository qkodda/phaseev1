-- ============================================
-- PHAZEE GENERATION GOVERNANCE SYSTEM
-- Rate Limiting & Tiering (V1 - No Boosts)
-- ============================================
-- 
-- This migration implements:
-- ✅ Generation usage tracking
-- ✅ Multi-tier model routing (A/B/C)
-- ✅ Rolling hour + daily limits
-- ✅ Server-enforced cooldowns
-- ✅ Abuse detection & temp-bans
-- ✅ Admin-configurable settings
-- ✅ Complete RLS policies
-- ✅ RPC functions for all operations
-- ============================================

-- ============================================
-- 1. ADMIN SETTINGS TABLE
-- Single row with all configurable thresholds
-- ============================================

CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton pattern
    
    -- Rate Limits
    hourly_batch_limit INTEGER DEFAULT 12,
    daily_batch_limit INTEGER DEFAULT 100,
    soft_warning_threshold INTEGER DEFAULT 6,
    
    -- Tier Thresholds (batches per rolling hour)
    tier_a_max INTEGER DEFAULT 5,      -- Batches 1-5 = Tier A
    tier_b_max INTEGER DEFAULT 10,     -- Batches 6-10 = Tier B
    -- Batches 11+ = Tier C
    
    -- Cooldown Durations (seconds)
    cooldown_tier_a_min INTEGER DEFAULT 3,
    cooldown_tier_a_max INTEGER DEFAULT 5,
    cooldown_tier_b_min INTEGER DEFAULT 10,
    cooldown_tier_b_max INTEGER DEFAULT 15,
    cooldown_tier_c_min INTEGER DEFAULT 20,
    cooldown_tier_c_max INTEGER DEFAULT 60,
    
    -- Abuse Detection
    abuse_request_threshold INTEGER DEFAULT 1,     -- Max requests per window
    abuse_window_seconds INTEGER DEFAULT 5,        -- Window size
    abuse_sustained_seconds INTEGER DEFAULT 30,    -- Sustained abuse duration
    abuse_ban_minutes_min INTEGER DEFAULT 5,
    abuse_ban_minutes_max INTEGER DEFAULT 10,
    
    -- Model Configuration
    model_tier_a TEXT DEFAULT 'gpt-4o',
    model_tier_b TEXT DEFAULT 'gpt-4o-mini',
    model_tier_c TEXT DEFAULT 'gpt-3.5-turbo',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS for admin_settings - only service role can modify
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (needed for client display)
CREATE POLICY "Authenticated users can read settings"
    ON admin_settings FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- 2. USER GENERATION USAGE TABLE
-- Tracks every generation with full metadata
-- ============================================

CREATE TABLE IF NOT EXISTS user_generation_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Generation Details
    batch_weight DECIMAL(4,2) DEFAULT 1.0, -- 1.0 for full batch, 0.25 for single regen
    model_tier_used CHAR(1) NOT NULL CHECK (model_tier_used IN ('A', 'B', 'C')),
    ideas_generated INTEGER DEFAULT 7,
    
    -- Request Metadata
    ip_address INET,
    session_id TEXT,
    user_agent TEXT,
    
    -- Context
    direction TEXT, -- User's custom direction if any
    is_campaign BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_created 
    ON user_generation_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_rolling_hour 
    ON user_generation_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_daily 
    ON user_generation_usage(user_id, created_at);

-- RLS
ALTER TABLE user_generation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
    ON user_generation_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
    ON user_generation_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. GENERATION ABUSE FLAGS TABLE
-- Tracks rate limit violations and temp-bans
-- ============================================

CREATE TABLE IF NOT EXISTS generation_abuse_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identification (at least one required)
    ip_address INET,
    session_id TEXT,
    
    -- Abuse Details
    reason TEXT NOT NULL,
    violation_count INTEGER DEFAULT 1,
    
    -- Ban Status
    banned_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    request_pattern JSONB, -- Details about the abuse pattern
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abuse_user_active 
    ON generation_abuse_flags(user_id, is_active) 
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_abuse_ip_active 
    ON generation_abuse_flags(ip_address, is_active) 
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_abuse_banned_until 
    ON generation_abuse_flags(banned_until) 
    WHERE is_active = TRUE;

-- RLS
ALTER TABLE generation_abuse_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own abuse flags"
    ON generation_abuse_flags FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 4. REQUEST RATE TRACKING TABLE
-- For abuse pattern detection (rolling window)
-- ============================================

CREATE TABLE IF NOT EXISTS request_rate_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    session_id TEXT,
    
    -- Request Info
    endpoint TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast rate checking
CREATE INDEX IF NOT EXISTS idx_rate_tracking_recent 
    ON request_rate_tracking(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_tracking_ip 
    ON request_rate_tracking(ip_address, created_at DESC);

-- RLS
ALTER TABLE request_rate_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert rate tracking"
    ON request_rate_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- 5. RPC FUNCTIONS
-- ============================================

-- --------------------------------------------
-- 5.1 GET ROLLING HOUR STATS
-- Returns usage stats for the current rolling hour
-- --------------------------------------------

CREATE OR REPLACE FUNCTION get_rolling_hour_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_count DECIMAL;
    v_settings RECORD;
    v_current_tier CHAR(1);
BEGIN
    -- Get settings
    SELECT * INTO v_settings FROM admin_settings WHERE id = 1;
    
    -- Get batch count for rolling hour
    SELECT COALESCE(SUM(batch_weight), 0)
    INTO v_batch_count
    FROM user_generation_usage
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Determine current tier
    IF v_batch_count < v_settings.tier_a_max THEN
        v_current_tier := 'A';
    ELSIF v_batch_count < v_settings.tier_b_max THEN
        v_current_tier := 'B';
    ELSE
        v_current_tier := 'C';
    END IF;
    
    RETURN json_build_object(
        'batch_count', v_batch_count,
        'batch_limit', v_settings.hourly_batch_limit,
        'soft_warning_threshold', v_settings.soft_warning_threshold,
        'current_tier', v_current_tier,
        'tier_a_max', v_settings.tier_a_max,
        'tier_b_max', v_settings.tier_b_max,
        'is_at_limit', v_batch_count >= v_settings.hourly_batch_limit,
        'is_soft_warning', v_batch_count >= v_settings.soft_warning_threshold
    );
END;
$$;

-- --------------------------------------------
-- 5.2 GET DAILY STATS
-- Returns usage stats for the current day (UTC)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION get_daily_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_count DECIMAL;
    v_settings RECORD;
    v_today_start TIMESTAMPTZ;
    v_next_reset TIMESTAMPTZ;
BEGIN
    -- Get settings
    SELECT * INTO v_settings FROM admin_settings WHERE id = 1;
    
    -- Calculate today's start (UTC midnight)
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    v_next_reset := v_today_start + INTERVAL '1 day';
    
    -- Get batch count for today
    SELECT COALESCE(SUM(batch_weight), 0)
    INTO v_batch_count
    FROM user_generation_usage
    WHERE user_id = p_user_id
    AND created_at >= v_today_start;
    
    RETURN json_build_object(
        'batch_count', v_batch_count,
        'batch_limit', v_settings.daily_batch_limit,
        'ideas_generated_today', v_batch_count * 7,
        'is_at_limit', v_batch_count >= v_settings.daily_batch_limit,
        'next_reset_timestamp', v_next_reset
    );
END;
$$;

-- --------------------------------------------
-- 5.3 CHECK GENERATION LIMITS
-- Comprehensive limit check before generation
-- --------------------------------------------

CREATE OR REPLACE FUNCTION check_generation_limits(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
    v_hourly_stats JSON;
    v_daily_stats JSON;
    v_abuse_flag RECORD;
    v_last_generation TIMESTAMPTZ;
    v_cooldown_seconds INTEGER;
    v_current_tier CHAR(1);
    v_hourly_count DECIMAL;
    v_can_generate BOOLEAN := TRUE;
    v_status TEXT := 'ok';
    v_message TEXT := NULL;
    v_next_available TIMESTAMPTZ := NOW();
BEGIN
    -- Get settings
    SELECT * INTO v_settings FROM admin_settings WHERE id = 1;
    
    -- Check for active abuse ban
    SELECT * INTO v_abuse_flag
    FROM generation_abuse_flags
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND is_active = TRUE
    AND banned_until > NOW()
    ORDER BY banned_until DESC
    LIMIT 1;
    
    IF FOUND THEN
        RETURN json_build_object(
            'can_generate', FALSE,
            'status', 'banned',
            'message', 'Temporarily banned due to unusual activity',
            'banned_until', v_abuse_flag.banned_until,
            'cooldown_seconds', EXTRACT(EPOCH FROM (v_abuse_flag.banned_until - NOW()))::INTEGER
        );
    END IF;
    
    -- Get hourly stats
    v_hourly_stats := get_rolling_hour_stats(p_user_id);
    v_hourly_count := (v_hourly_stats->>'batch_count')::DECIMAL;
    
    -- Check hourly limit
    IF v_hourly_count >= v_settings.hourly_batch_limit THEN
        -- Find when the oldest request in the hour window expires
        SELECT created_at + INTERVAL '1 hour'
        INTO v_next_available
        FROM user_generation_usage
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at ASC
        LIMIT 1;
        
        RETURN json_build_object(
            'can_generate', FALSE,
            'status', 'hourly_limit',
            'message', 'Hourly limit reached. Take a breather!',
            'hourly_stats', v_hourly_stats,
            'next_available', v_next_available,
            'cooldown_seconds', GREATEST(0, EXTRACT(EPOCH FROM (v_next_available - NOW()))::INTEGER)
        );
    END IF;
    
    -- Get daily stats
    v_daily_stats := get_daily_stats(p_user_id);
    
    -- Check daily limit
    IF (v_daily_stats->>'is_at_limit')::BOOLEAN THEN
        RETURN json_build_object(
            'can_generate', FALSE,
            'status', 'daily_limit',
            'message', 'You''ve generated a lot today! Come back tomorrow for fresh ideas.',
            'daily_stats', v_daily_stats,
            'next_available', v_daily_stats->>'next_reset_timestamp',
            'cooldown_seconds', EXTRACT(EPOCH FROM ((v_daily_stats->>'next_reset_timestamp')::TIMESTAMPTZ - NOW()))::INTEGER
        );
    END IF;
    
    -- Get current tier
    v_current_tier := v_hourly_stats->>'current_tier';
    
    -- Get last generation time for cooldown calculation
    SELECT created_at INTO v_last_generation
    FROM user_generation_usage
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Calculate cooldown based on tier
    IF v_current_tier = 'A' THEN
        v_cooldown_seconds := v_settings.cooldown_tier_a_min + 
            FLOOR(RANDOM() * (v_settings.cooldown_tier_a_max - v_settings.cooldown_tier_a_min + 1))::INTEGER;
    ELSIF v_current_tier = 'B' THEN
        v_cooldown_seconds := v_settings.cooldown_tier_b_min + 
            FLOOR(RANDOM() * (v_settings.cooldown_tier_b_max - v_settings.cooldown_tier_b_min + 1))::INTEGER;
    ELSE
        v_cooldown_seconds := v_settings.cooldown_tier_c_min + 
            FLOOR(RANDOM() * (v_settings.cooldown_tier_c_max - v_settings.cooldown_tier_c_min + 1))::INTEGER;
    END IF;
    
    -- Check if cooldown is active
    IF v_last_generation IS NOT NULL THEN
        v_next_available := v_last_generation + (v_cooldown_seconds || ' seconds')::INTERVAL;
        IF v_next_available > NOW() THEN
            RETURN json_build_object(
                'can_generate', FALSE,
                'status', 'cooldown',
                'message', 'Woah woah, slow your roll!',
                'cooldown_seconds', EXTRACT(EPOCH FROM (v_next_available - NOW()))::INTEGER,
                'next_available', v_next_available,
                'tier', v_current_tier
            );
        END IF;
    END IF;
    
    -- Determine status message
    IF (v_hourly_stats->>'is_soft_warning')::BOOLEAN THEN
        v_status := 'warning';
        v_message := 'Love the momentum! Phazee will slow slightly to preserve quality.';
    END IF;
    
    -- Return success with all stats
    RETURN json_build_object(
        'can_generate', TRUE,
        'status', v_status,
        'message', v_message,
        'tier', v_current_tier,
        'model', CASE v_current_tier
            WHEN 'A' THEN v_settings.model_tier_a
            WHEN 'B' THEN v_settings.model_tier_b
            ELSE v_settings.model_tier_c
        END,
        'hourly_stats', v_hourly_stats,
        'daily_stats', v_daily_stats,
        'cooldown_after_generation', v_cooldown_seconds
    );
END;
$$;

-- --------------------------------------------
-- 5.4 LOG GENERATION
-- Records a generation event
-- --------------------------------------------

CREATE OR REPLACE FUNCTION log_generation(
    p_user_id UUID,
    p_batch_weight DECIMAL DEFAULT 1.0,
    p_tier CHAR(1) DEFAULT 'A',
    p_ideas_count INTEGER DEFAULT 7,
    p_ip_address INET DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_direction TEXT DEFAULT NULL,
    p_is_campaign BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    -- Insert usage record
    INSERT INTO user_generation_usage (
        user_id, batch_weight, model_tier_used, ideas_generated,
        ip_address, session_id, user_agent,
        direction, is_campaign
    ) VALUES (
        p_user_id, p_batch_weight, p_tier, p_ideas_count,
        p_ip_address, p_session_id, p_user_agent,
        p_direction, p_is_campaign
    )
    RETURNING id INTO v_usage_id;
    
    -- Log rate tracking for abuse detection
    INSERT INTO request_rate_tracking (user_id, ip_address, session_id, endpoint)
    VALUES (p_user_id, p_ip_address, p_session_id, '/api/generate');
    
    -- Get updated stats
    RETURN json_build_object(
        'success', TRUE,
        'usage_id', v_usage_id,
        'hourly_stats', get_rolling_hour_stats(p_user_id),
        'daily_stats', get_daily_stats(p_user_id)
    );
END;
$$;

-- --------------------------------------------
-- 5.5 CHECK ABUSE PATTERN
-- Detects rate limit abuse patterns
-- --------------------------------------------

CREATE OR REPLACE FUNCTION check_abuse_pattern(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
    v_request_count INTEGER;
    v_sustained_abuse BOOLEAN := FALSE;
    v_should_ban BOOLEAN := FALSE;
    v_ban_minutes INTEGER;
BEGIN
    -- Get settings
    SELECT * INTO v_settings FROM admin_settings WHERE id = 1;
    
    -- Count requests in the abuse window
    SELECT COUNT(*)
    INTO v_request_count
    FROM request_rate_tracking
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND created_at > NOW() - (v_settings.abuse_window_seconds || ' seconds')::INTERVAL;
    
    -- Check if exceeding threshold
    IF v_request_count > v_settings.abuse_request_threshold THEN
        -- Check for sustained abuse (multiple violations over time)
        SELECT COUNT(*) > (v_settings.abuse_sustained_seconds / v_settings.abuse_window_seconds)
        INTO v_sustained_abuse
        FROM request_rate_tracking
        WHERE (user_id = p_user_id OR ip_address = p_ip_address)
        AND created_at > NOW() - (v_settings.abuse_sustained_seconds || ' seconds')::INTERVAL;
        
        IF v_sustained_abuse THEN
            v_should_ban := TRUE;
            v_ban_minutes := v_settings.abuse_ban_minutes_min + 
                FLOOR(RANDOM() * (v_settings.abuse_ban_minutes_max - v_settings.abuse_ban_minutes_min + 1))::INTEGER;
        END IF;
    END IF;
    
    RETURN json_build_object(
        'is_abusive', v_should_ban,
        'request_count', v_request_count,
        'threshold', v_settings.abuse_request_threshold,
        'ban_minutes', v_ban_minutes,
        'sustained_abuse', v_sustained_abuse
    );
END;
$$;

-- --------------------------------------------
-- 5.6 FLAG ABUSE
-- Creates an abuse flag and temp-ban
-- --------------------------------------------

CREATE OR REPLACE FUNCTION flag_abuse(
    p_user_id UUID,
    p_ip_address INET,
    p_reason TEXT,
    p_ban_minutes INTEGER,
    p_request_pattern JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_flag_id UUID;
    v_banned_until TIMESTAMPTZ;
BEGIN
    v_banned_until := NOW() + (p_ban_minutes || ' minutes')::INTERVAL;
    
    INSERT INTO generation_abuse_flags (
        user_id, ip_address, reason, banned_until, request_pattern
    ) VALUES (
        p_user_id, p_ip_address, p_reason, v_banned_until, p_request_pattern
    )
    RETURNING id INTO v_flag_id;
    
    RETURN json_build_object(
        'success', TRUE,
        'flag_id', v_flag_id,
        'banned_until', v_banned_until
    );
END;
$$;

-- --------------------------------------------
-- 5.7 GET ADMIN SETTINGS
-- Returns all admin settings
-- --------------------------------------------

CREATE OR REPLACE FUNCTION get_admin_settings()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
BEGIN
    SELECT * INTO v_settings FROM admin_settings WHERE id = 1;
    
    RETURN row_to_json(v_settings);
END;
$$;

-- --------------------------------------------
-- 5.8 UPDATE ADMIN SETTINGS
-- Updates admin settings (service role only)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION update_admin_settings(p_settings JSONB)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE admin_settings
    SET 
        hourly_batch_limit = COALESCE((p_settings->>'hourly_batch_limit')::INTEGER, hourly_batch_limit),
        daily_batch_limit = COALESCE((p_settings->>'daily_batch_limit')::INTEGER, daily_batch_limit),
        soft_warning_threshold = COALESCE((p_settings->>'soft_warning_threshold')::INTEGER, soft_warning_threshold),
        tier_a_max = COALESCE((p_settings->>'tier_a_max')::INTEGER, tier_a_max),
        tier_b_max = COALESCE((p_settings->>'tier_b_max')::INTEGER, tier_b_max),
        cooldown_tier_a_min = COALESCE((p_settings->>'cooldown_tier_a_min')::INTEGER, cooldown_tier_a_min),
        cooldown_tier_a_max = COALESCE((p_settings->>'cooldown_tier_a_max')::INTEGER, cooldown_tier_a_max),
        cooldown_tier_b_min = COALESCE((p_settings->>'cooldown_tier_b_min')::INTEGER, cooldown_tier_b_min),
        cooldown_tier_b_max = COALESCE((p_settings->>'cooldown_tier_b_max')::INTEGER, cooldown_tier_b_max),
        cooldown_tier_c_min = COALESCE((p_settings->>'cooldown_tier_c_min')::INTEGER, cooldown_tier_c_min),
        cooldown_tier_c_max = COALESCE((p_settings->>'cooldown_tier_c_max')::INTEGER, cooldown_tier_c_max),
        abuse_request_threshold = COALESCE((p_settings->>'abuse_request_threshold')::INTEGER, abuse_request_threshold),
        abuse_window_seconds = COALESCE((p_settings->>'abuse_window_seconds')::INTEGER, abuse_window_seconds),
        abuse_sustained_seconds = COALESCE((p_settings->>'abuse_sustained_seconds')::INTEGER, abuse_sustained_seconds),
        abuse_ban_minutes_min = COALESCE((p_settings->>'abuse_ban_minutes_min')::INTEGER, abuse_ban_minutes_min),
        abuse_ban_minutes_max = COALESCE((p_settings->>'abuse_ban_minutes_max')::INTEGER, abuse_ban_minutes_max),
        model_tier_a = COALESCE(p_settings->>'model_tier_a', model_tier_a),
        model_tier_b = COALESCE(p_settings->>'model_tier_b', model_tier_b),
        model_tier_c = COALESCE(p_settings->>'model_tier_c', model_tier_c),
        updated_at = NOW()
    WHERE id = 1;
    
    RETURN json_build_object('success', TRUE, 'settings', get_admin_settings());
END;
$$;

-- ============================================
-- 6. CLEANUP FUNCTIONS
-- ============================================

-- Clean up old rate tracking records (run via cron)
CREATE OR REPLACE FUNCTION cleanup_rate_tracking()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM request_rate_tracking
    WHERE created_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    RETURN v_deleted;
END;
$$;

-- Expire old abuse flags (run via cron)
CREATE OR REPLACE FUNCTION expire_abuse_flags()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired INTEGER;
BEGIN
    UPDATE generation_abuse_flags
    SET is_active = FALSE, resolved_at = NOW()
    WHERE is_active = TRUE AND banned_until < NOW();
    
    GET DIAGNOSTICS v_expired = ROW_COUNT;
    
    RETURN v_expired;
END;
$$;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Update timestamp trigger for admin_settings
CREATE TRIGGER update_admin_settings_timestamp
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE (V1 - No Boosts)
-- ============================================
-- 
-- Tables Created:
-- ✅ admin_settings (singleton config)
-- ✅ user_generation_usage (usage tracking)
-- ✅ generation_abuse_flags (temp-bans)
-- ✅ request_rate_tracking (abuse detection)
-- 
-- RPC Functions:
-- ✅ get_rolling_hour_stats(user_id)
-- ✅ get_daily_stats(user_id)
-- ✅ check_generation_limits(user_id, ip, session)
-- ✅ log_generation(...)
-- ✅ check_abuse_pattern(user_id, ip)
-- ✅ flag_abuse(user_id, ip, reason, ban_minutes, pattern)
-- ✅ get_admin_settings()
-- ✅ update_admin_settings(settings)
-- ✅ cleanup_rate_tracking()
-- ✅ expire_abuse_flags()
-- 
-- REMOVED (V2 Feature):
-- ❌ user_boosts table
-- ❌ boost_transactions table
-- ❌ redeem_boost function
-- ❌ add_boost function
-- ❌ get_boost_balance function
-- ============================================


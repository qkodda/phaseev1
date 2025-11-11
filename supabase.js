/**
 * Supabase Client Configuration
 * 
 * Setup Instructions:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace the placeholder values below
 * 4. Run the SQL schema from SUPABASE_SCHEMA.sql in your Supabase SQL editor
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase credentials from environment variables
// For production: Set these in your deployment environment (Vercel, Netlify, etc.)
// For local dev: Add to .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ootaqjhxpkcflomxjmxs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdGFxamh4cGtjZmxvbXhqbXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjM0OTgsImV4cCI6MjA3ODE5OTQ5OH0.zc-Z1yzXXNtn7KJn1NJ6Buz4bokr_hOSnPmeOSRiWws'

// Log configuration status on load (development only)
if (import.meta.env.DEV) {
  console.log('✅ Supabase configured:', {
    url: supabaseUrl.substring(0, 30) + '...',
    keyPresent: !!supabaseAnonKey,
    usingEnvVars: !!import.meta.env.VITE_SUPABASE_URL
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up a new user
 */
export async function signUp(email, password, options = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    })
    
    return { data, error }
  } catch (error) {
    console.error('Supabase signUp error:', error)
    return { data: null, error }
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    return { data, error }
  } catch (error) {
    console.error('Supabase signIn error:', error)
    return { data: null, error }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Supabase signOut error:', error)
    return { error }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Reset password
 */
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
  return data
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update user profile
 */
export async function updateProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ============================================
// IDEAS FUNCTIONS
// ============================================

/**
 * Normalise idea payload before sending to Supabase
 */
function normalizeIdeaPayload(rawIdea = {}, { includeStatusFallback = true } = {}) {
  const normalizeString = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const normalizeBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (lowered === 'true') return true;
      if (lowered === 'false') return false;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return fallback;
  };

  const normalizePlatforms = (platforms) => {
    if (!platforms) return null;
    if (Array.isArray(platforms)) {
      const cleaned = platforms
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean);
      return cleaned.length > 0 ? cleaned : null;
    }
    if (typeof platforms === 'string') {
      const cleaned = platforms
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      return cleaned.length > 0 ? cleaned : null;
    }
    return null;
  };

  const normalizeDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.valueOf())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.valueOf())) {
        return parsed.toISOString().slice(0, 10);
      }
    }
    return null;
  };

  const isPinned =
    rawIdea.is_pinned ??
    rawIdea.isPinned ??
    normalizeBoolean(rawIdea.status === 'pinned');
  const isScheduled =
    rawIdea.is_scheduled ??
    rawIdea.isScheduled ??
    normalizeBoolean(rawIdea.status === 'scheduled');

  const scheduledDate =
    rawIdea.scheduled_date ?? rawIdea.scheduledDate ?? null;

  const normalized = {
    title: normalizeString(rawIdea.title),
    summary: normalizeString(rawIdea.summary),
    action: normalizeString(rawIdea.action),
    setup: normalizeString(rawIdea.setup),
    story: normalizeString(rawIdea.story),
    hook: normalizeString(rawIdea.hook),
    why: normalizeString(rawIdea.why),
    platforms: normalizePlatforms(
      rawIdea.platforms ?? rawIdea.platform_list ?? rawIdea.platform
    ),
    direction: normalizeString(rawIdea.direction),
    is_campaign: normalizeBoolean(
      rawIdea.is_campaign ?? rawIdea.isCampaign,
      false
    ),
    generation_method:
      normalizeString(
        rawIdea.generation_method ??
          rawIdea.generationMethod ??
          rawIdea.method
      ) ?? null,
    is_pinned: normalizeBoolean(isPinned, false),
    is_scheduled: normalizeBoolean(isScheduled, false),
    scheduled_date: normalizeDate(scheduledDate),
    status:
      normalizeString(rawIdea.status) ??
      (includeStatusFallback
        ? normalizeBoolean(isScheduled, false)
          ? 'scheduled'
          : normalizeBoolean(isPinned, false)
          ? 'pinned'
          : 'idea'
        : null)
  };

  // Remove undefined values while keeping null (explicit clears)
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return normalized;
}

/**
 * Get all ideas for a user
 */
export async function getIdeas(userId, filters = {}) {
  let query = supabase
    .from('ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (filters.isPinned !== undefined) {
    query = query.eq('is_pinned', filters.isPinned)
  }
  
  if (filters.isScheduled !== undefined) {
    query = query.eq('is_scheduled', filters.isScheduled)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Create a new idea
 */
export async function createIdea(userId, ideaData = {}) {
  const normalized = normalizeIdeaPayload(ideaData);
  
  console.log('🔧 Normalized payload:', {
    user_id: userId,
    title: normalized.title,
    is_pinned: normalized.is_pinned,
    is_scheduled: normalized.is_scheduled,
    platforms: normalized.platforms,
    has_action: !!normalized.action,
    has_setup: !!normalized.setup,
    has_story: !!normalized.story,
    has_hook: !!normalized.hook
  });
  
  const payload = {
    user_id: userId,
    ...normalized,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('📤 Sending to Supabase...');
  const { data, error } = await supabase
    .from('ideas')
    .insert(payload)
    .select()
    .single()
  
  if (error) {
    console.error('❌ Supabase insert error:', error);
    throw error;
  }
  
  console.log('✅ Supabase insert successful:', data?.id);
  return data
}

/**
 * Update an idea
 */
export async function updateIdea(ideaId, ideaData = {}) {
  const payload = {
    ...normalizeIdeaPayload(ideaData),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('ideas')
    .update(payload)
    .eq('id', ideaId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Delete an idea
 */
export async function deleteIdea(ideaId) {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId)
  
  if (error) throw error
}

/**
 * Pin an idea
 */
export async function pinIdea(ideaId) {
  return updateIdea(ideaId, { is_pinned: true })
}

/**
 * Unpin an idea
 */
export async function unpinIdea(ideaId) {
  return updateIdea(ideaId, { is_pinned: false })
}

/**
 * Schedule an idea
 */
export async function scheduleIdea(ideaId, date) {
  return updateIdea(ideaId, { 
    is_scheduled: true,
    scheduled_date: date,
    is_pinned: false // Move from pinned to scheduled
  })
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Track generation event
 */
export async function trackGenerationEvent(userId, eventData) {
  const { data, error } = await supabase
    .from('generation_analytics')
    .insert({
      user_id: userId,
      ...eventData,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Track app analytics (page views, errors)
 */
export async function trackAppEvent(eventData) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('app_analytics')
    .insert({
      user_id: user?.id || null,
      ...eventData,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get user generation stats
 */
export async function getGenerationStats(userId, days = 30) {
  const { data, error } = await supabase
    .rpc('get_daily_generation_stats', {
      p_user_id: userId,
      p_days: days
    })
  
  if (error) throw error
  return data
}

/**
 * Get page time stats (admin only)
 */
export async function getPageTimeStats(days = 30) {
  const { data, error } = await supabase
    .rpc('get_page_time_stats', {
      p_days: days
    })
  
  if (error) throw error
  return data
}

// ============================================
// FEEDBACK FUNCTIONS
// ============================================

/**
 * Submit user feedback
 */
export async function submitFeedback(message, userEmail = null, userName = null) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: user?.id || null,
      message,
      user_email: userEmail || user?.email,
      user_name: userName,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get user's feedback submissions
 */
export async function getUserFeedback(userId) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// ============================================
// ACCOUNT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Update user email
 */
export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  })
  
  if (error) throw error
  return data
}

/**
 * Update user password
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
  return data
}

/**
 * Delete user account
 */
export async function deleteAccount() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('No user logged in')
  
  // Delete profile (cascade will delete ideas, analytics, etc.)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)
  
  if (profileError) throw profileError
  
  // Sign out
  await signOut()
}

/**
 * Request email confirmation resend
 */
export async function resendEmailConfirmation(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  })
  
  if (error) throw error
  return data
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to profile changes
 */
export function subscribeToProfile(userId, callback) {
  return supabase
    .channel(`profile:${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}

/**
 * Subscribe to ideas changes
 */
export function subscribeToIdeas(userId, callback) {
  return supabase
    .channel(`ideas:${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'ideas',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(subscription) {
  await supabase.removeChannel(subscription)
}


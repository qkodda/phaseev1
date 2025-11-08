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

// Supabase credentials
const supabaseUrl = 'https://ootaqjhxpkcflomxjmxs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdGFxamh4cGtjZmxvbXhqbXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjM0OTgsImV4cCI6MjA3ODE5OTQ5OH0.zc-Z1yzXXNtn7KJn1NJ6Buz4bokr_hOSnPmeOSRiWws'

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
export async function createIdea(userId, ideaData) {
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: userId,
      ...ideaData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update an idea
 */
export async function updateIdea(ideaId, ideaData) {
  const { data, error } = await supabase
    .from('ideas')
    .update({
      ...ideaData,
      updated_at: new Date().toISOString()
    })
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


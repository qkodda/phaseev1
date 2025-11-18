/**
 * Supabase Client Configuration
 * 
 * This file uses environment variables for security.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in:
 * - Vercel: Project Settings > Environment Variables
 * - Local: .env.local file
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase credentials from environment variables ONLY
// These should be set in Vercel dashboard, NOT hardcoded here
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please set environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  throw new Error('Supabase configuration missing');
}

// Log configuration status on load (development only)
if (import.meta.env.DEV) {
  console.log('✅ Supabase configured:', {
    url: supabaseUrl?.substring(0, 30) + '...',
    keyPresent: !!supabaseAnonKey,
    usingEnvVars: true
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up a new user
 */
export async function signUp(email, password, userMetadata = {}) {
  try {
    // Use production URL if set in environment, otherwise use current origin
    // This ensures verification emails always point to production, even when testing locally
    const siteUrl = import.meta.env.VITE_SITE_URL
    const redirectTo = siteUrl ? `${siteUrl.replace(/\/$/, '')}/` : `${window.location.origin}/`
    
    console.log('🔗 Sign up redirect URL:', redirectTo)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata.data || userMetadata,
        emailRedirectTo: redirectTo
      }
    })

    if (error) throw error
    console.log('✅ User signed up successfully:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Sign up error:', error)
    return { data: null, error }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    console.log('✅ User signed in successfully:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Sign in error:', error)
    return { data: null, error }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    console.log('✅ User signed out successfully')
    return { error: null }
  } catch (error) {
    console.error('❌ Sign out error:', error)
    return { error }
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error) {
    console.error('❌ Get session error:', error)
    return { session: null, error }
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('❌ Get user error:', error)
    return { user: null, error }
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event)
    callback(event, session)
  })
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    console.log('✅ Password reset email sent')
    return { data, error: null }
  } catch (error) {
    console.error('❌ Reset password error:', error)
    return { data: null, error }
  }
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('❌ Get profile error:', error)
    return { data: null, error }
  }
}

/**
 * Upsert user profile (create or update)
 */
export async function upsertUserProfile(profile) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) throw error
    console.log('✅ Profile saved:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Save profile error:', error)
    return { data: null, error }
  }
}

// ============================================
// IDEAS FUNCTIONS
// ============================================

/**
 * Get all ideas for a user (scheduled and pinned)
 */
export async function getUserIdeas(userId) {
  try {
    const { data, error } = await supabase
      .from('user_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('❌ Get ideas error:', error)
    return { data: null, error }
  }
}

/**
 * Save a new idea
 */
export async function saveIdea(idea) {
  try {
    const { data, error } = await supabase
      .from('user_ideas')
      .insert([idea])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Idea saved:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Save idea error:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing idea
 */
export async function updateIdea(ideaId, updates) {
  try {
    const { data, error } = await supabase
      .from('user_ideas')
      .update(updates)
      .eq('id', ideaId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Idea updated:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Update idea error:', error)
    return { data: null, error }
  }
}

/**
 * Delete an idea
 */
export async function deleteIdea(ideaId) {
  try {
    const { error } = await supabase
      .from('user_ideas')
      .delete()
      .eq('id', ideaId)

    if (error) throw error
    console.log('✅ Idea deleted')
    return { error: null }
  } catch (error) {
    console.error('❌ Delete idea error:', error)
    return { error }
  }
}

/**
 * Get ideas by type (pinned or scheduled)
 */
export async function getIdeasByType(userId, type) {
  try {
    const { data, error } = await supabase
      .from('user_ideas')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('❌ Get ideas by type error:', error)
    return { data: null, error }
  }
}

/**
 * Get scheduled ideas for a specific date
 */
export async function getScheduledIdeasForDate(userId, date) {
  try {
    const { data, error } = await supabase
      .from('user_ideas')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'scheduled')
      .eq('scheduled_date', date)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('❌ Get scheduled ideas for date error:', error)
    return { data: null, error }
  }
}

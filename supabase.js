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
const getEnvVar = (key) => {
  try {
    return import.meta.env && import.meta.env[key]
  } catch (e) {
    return undefined
  }
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase credentials. App will run in limited mode (or Dev Bypass if enabled).');
  console.warn('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable backend features.');
  // Do not throw error here, allow app to load for dev bypass
}

// Create client only if credentials exist, otherwise create a dummy object to prevent crashes
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          })
        }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
        upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) })
      })
    };

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
 * Internal helper: Get the correct ideas table name
 * Uses 'ideas' table (current table name)
 */
let _ideasTableName = null
async function _getIdeasTableName() {
  // Always use 'ideas' table (this is the correct table name)
  // Reset cache to ensure we're using the correct table
  _ideasTableName = 'ideas'
  return _ideasTableName
}

/**
 * Get all ideas for a user (scheduled and pinned)
 */
export async function getUserIdeas(userId) {
  try {
    const tableName = await _getIdeasTableName()
    const { data, error } = await supabase
      .from(tableName)
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
    const tableName = await _getIdeasTableName()
    const { data, error } = await supabase
      .from(tableName)
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
    const tableName = await _getIdeasTableName()
    const { data, error } = await supabase
      .from(tableName)
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
    const tableName = await _getIdeasTableName()
    const { error } = await supabase
      .from(tableName)
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
    const tableName = await _getIdeasTableName()
    const { data, error } = await supabase
      .from(tableName)
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
    const tableName = await _getIdeasTableName()
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('is_scheduled', true) // Use is_scheduled boolean instead of type field
      .eq('scheduled_date', date)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('❌ Get scheduled ideas for date error:', error)
    return { data: null, error }
  }
}

// ============================================
// SEALED IDEA PERSISTENCE FUNCTIONS
// ============================================

/**
 * Save an idea to the drawing board (pinned)
 * Sealed function: isolates pinned idea persistence logic
 * @param {Object} idea - Idea object to save
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, idea?: Object, error?: Error}>}
 */
export async function saveIdeaToDrawingBoard(idea, userId) {
  try {
    const ideaToSave = {
      ...idea,
      user_id: userId,
      // Removed 'type' field - database uses is_pinned/is_scheduled booleans instead
      is_pinned: true,
      is_scheduled: false
    }

    const result = await saveIdea(ideaToSave)
    
    if (result.error || !result.data) {
      return { success: false, error: result.error || new Error('Failed to save idea') }
    }

    return { success: true, idea: result.data }
  } catch (error) {
    console.error('❌ saveIdeaToDrawingBoard error:', error)
    return { success: false, error }
  }
}

/**
 * Schedule an idea (save or update as scheduled)
 * Sealed function: isolates scheduled idea persistence logic
 * @param {Object} idea - Idea object (may have id for updates)
 * @param {string} scheduledDate - ISO date string (YYYY-MM-DD)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, idea?: Object, error?: Error}>}
 */
export async function scheduleIdea(idea, scheduledDate, userId) {
  try {
    const ideaToSave = {
      ...idea,
      user_id: userId,
      // Removed 'type' field - database uses is_pinned/is_scheduled booleans instead
      is_pinned: false,
      is_scheduled: true,
      scheduled_date: scheduledDate
    }

    let result
    if (idea.id) {
      // Update existing idea
      result = await updateIdea(idea.id, ideaToSave)
    } else {
      // Create new idea
      result = await saveIdea(ideaToSave)
    }

    if (result.error || !result.data) {
      return { success: false, error: result.error || new Error('Failed to schedule idea') }
    }

    return { success: true, idea: result.data }
  } catch (error) {
    console.error('❌ scheduleIdea error:', error)
    return { success: false, error }
  }
}

/**
 * Load user ideas (pinned and/or scheduled)
 * Sealed function: unified loader with consistent table handling
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {string} options.type - 'pinned' | 'scheduled' | 'all' (default: 'all')
 * @param {string} options.scheduledDate - Optional date filter for scheduled ideas
 * @param {number} options.limit - Optional limit
 * @param {string} options.orderBy - Field to order by (default: 'created_at')
 * @param {string} options.order - 'asc' | 'desc' (default: 'desc')
 * @returns {Promise<{success: boolean, ideas?: Array, pinnedCount?: number, scheduledCount?: number, error?: Error}>}
 */
export async function loadUserIdeas(userId, options = {}) {
  try {
    const {
      type = 'all',
      scheduledDate,
      limit,
      orderBy = 'created_at',
      order = 'desc'
    } = options

    // Get all ideas for user (single query)
    const result = await getUserIdeas(userId)
    
    if (result.error || !result.data) {
      return { success: false, error: result.error || new Error('Failed to load ideas') }
    }

    let allIdeas = result.data || []

    // Apply date filter if specified
    if (scheduledDate) {
      allIdeas = allIdeas.filter(idea => idea.scheduled_date === scheduledDate)
    }

    // Split into pinned and scheduled in JavaScript
    const pinned = allIdeas.filter(idea => idea.is_pinned === true)
    const scheduled = allIdeas.filter(idea => idea.is_scheduled === true)

    // Filter by type if specified
    let filteredIdeas = allIdeas
    if (type === 'pinned') {
      filteredIdeas = pinned
    } else if (type === 'scheduled') {
      filteredIdeas = scheduled
    }
    // else type === 'all' or undefined, use allIdeas

    // Apply limit if specified
    if (limit && limit > 0) {
      filteredIdeas = filteredIdeas.slice(0, limit)
    }

    // Apply ordering
    filteredIdeas.sort((a, b) => {
      const aVal = a[orderBy] || ''
      const bVal = b[orderBy] || ''
      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    return {
      success: true,
      ideas: filteredIdeas,
      pinnedCount: pinned.length,
      scheduledCount: scheduled.length
    }
  } catch (error) {
    console.error('❌ loadUserIdeas error:', error)
    return { success: false, error }
  }
}

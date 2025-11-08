/**
 * Supabase Client Configuration
 * 
 * Setup Instructions:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace the placeholder values below
 * 4. Run the SQL schema from SUPABASE_SCHEMA.sql in your Supabase SQL editor
 */

import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your Supabase project credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up a new user
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
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
// BOOKMARKS FUNCTIONS
// ============================================

/**
 * Get all bookmarks for a user
 */
export async function getBookmarks(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      ideas (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Add a bookmark
 */
export async function addBookmark(userId, ideaId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      idea_id: ideaId,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(userId, ideaId) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('idea_id', ideaId)
  
  if (error) throw error
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


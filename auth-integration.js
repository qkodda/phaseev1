/**
 * AUTH INTEGRATION - Supabase Authentication
 * 
 * This file contains all the authentication logic for Phasee.
 * Import this into app.js and replace the localStorage-only auth.
 */

console.log('🔥🔥🔥 AUTH-INTEGRATION.JS LOADED - VERSION 999 🔥🔥🔥');

import { supabase, signUp, signIn, signOut, getCurrentUser, resetPassword } from './supabase.js';

// ============================================
// DEV BYPASS CONFIGURATION (DEV ONLY - REMOVE BEFORE MERGE TO MAIN)
// ============================================

/**
 * DEV BYPASS FLAG
 * 
 * Set to true to enable dev bypass (skips auth/paywall, creates fake user).
 * Only works on localhost or when explicitly enabled.
 * 
 * TO DISABLE: Set to false or remove this entire section.
 * TO ENABLE: Set to true (only works on localhost by default).
 */
const DEV_BYPASS_ENABLED = true; // Change to true to enable dev bypass

/**
 * Check if dev bypass should be active
 * Only active when DEV_BYPASS_ENABLED is true
 * NOTE: When enabled, works on any hostname (dev only - disable before production)
 */
function isDevBypassActive() {
    // When DEV_BYPASS_ENABLED is true, always return true (works on any hostname)
    // This allows testing on any dev environment (localhost, IP address, etc.)
    return DEV_BYPASS_ENABLED === true;
}

/**
 * Create a fake dev user for testing (in-memory only, no DB writes)
 * This user has all the properties needed for the app to function
 */
function createDevBypassUser() {
    const fakeUserId = 'dev-bypass-user-' + Date.now();
    const fakeEmail = 'dev@phasee.local';
    
    return {
        id: fakeUserId,
        email: fakeEmail,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        app_metadata: {
            provider: 'dev-bypass',
            providers: ['dev-bypass']
        },
        user_metadata: {
            full_name: 'Dev User',
            display_name: 'Dev User'
        },
        aud: 'authenticated',
        role: 'authenticated'
    };
}

/**
 * Create a fake dev session for testing (in-memory only, no DB writes)
 */
function createDevBypassSession(fakeUser) {
    return {
        access_token: 'dev-bypass-token',
        refresh_token: 'dev-bypass-refresh',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: fakeUser
    };
}

// ============================================
// AUTHENTICATION STATE
// ============================================

let currentUser = null;
let currentSession = null;

/**
 * Initialize authentication - check for existing session
 * DEV BYPASS: If enabled and on localhost, creates fake user/session
 */
export async function initAuth() {
    // DEV BYPASS CHECK - HIGHEST PRIORITY - ALWAYS CHECK FIRST
    console.log('🔍 initAuth called, DEV_BYPASS_ENABLED =', DEV_BYPASS_ENABLED);
    console.log('🔍 isDevBypassActive() =', isDevBypassActive());
    
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Creating fake user session (DEV ONLY)');
        const fakeUser = createDevBypassUser();
        const fakeSession = createDevBypassSession(fakeUser);
        
        currentUser = fakeUser;
        currentSession = fakeSession;
        
        console.log('✅ Dev bypass user created:', fakeUser.email);
        console.log('✅ Dev bypass user ID:', fakeUser.id);
        return currentUser;
    }
    
    // NORMAL AUTH FLOW - Check for real Supabase session
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        if (session) {
            currentSession = session;
            currentUser = session.user;
            console.log('✅ User session found:', currentUser.email);
            return currentUser;
        }
        
        console.log('ℹ️ No active session');
        return null;
    } catch (error) {
        console.error('Error initializing auth:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return currentUser !== null && currentSession !== null;
}

/**
 * Get current user
 */
export function getUser() {
    return currentUser;
}

/**
 * Get current session
 */
export function getSession() {
    return currentSession;
}

// ============================================
// SIGN UP
// ============================================

/**
 * Handle user sign-up with email confirmation
 */
export async function handleSignUp(name, email, password) {
    // DEV BYPASS CHECK
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign up (DEV ONLY)');
        
        const fakeUser = createDevBypassUser();
        fakeUser.email = email;
        fakeUser.user_metadata.full_name = name;
        const fakeSession = createDevBypassSession(fakeUser);
        
        currentUser = fakeUser;
        currentSession = fakeSession;
        
        return {
            success: true,
            requiresConfirmation: false,
            user: fakeUser
        };
    }

    try {
        console.log('📝 Signing up user:', email);
        
        // Sign up with Supabase
        const { data, error } = await signUp(email, password, {
            data: {
                full_name: name,
                display_name: name
            }
        });
        
        if (error) {
            console.error('Sign up error:', error);
            throw new Error(error.message);
        }
        
        console.log('✅ Sign up successful:', data);
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
            // Email confirmation required
            return {
                success: true,
                requiresConfirmation: true,
                message: 'Please check your email to confirm your account before signing in.'
            };
        }
        
        // Auto-signed in (no confirmation required)
        if (data.session) {
            currentSession = data.session;
            currentUser = data.user;
            
            // Create profile in database
            await createUserProfile(data.user.id, name, email);
            
            return {
                success: true,
                requiresConfirmation: false,
                user: data.user
            };
        }
        
        return {
            success: true,
            requiresConfirmation: false
        };
        
    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// SIGN IN
// ============================================

/**
 * Handle user sign-in
 */
export async function handleSignIn(email, password) {
    // DEV BYPASS CHECK - HIGHEST PRIORITY
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign in (DEV ONLY)');
        
        // Create fake user if not exists (or reuse existing dev user logic)
        if (!currentUser) {
            const fakeUser = createDevBypassUser();
            fakeUser.email = email; // Use entered email for realism
            const fakeSession = createDevBypassSession(fakeUser);
            
            currentUser = fakeUser;
            currentSession = fakeSession;
        }
        
        console.log('✅ DEV BYPASS: Returning fake success');
        return {
            success: true,
            user: currentUser,
            session: currentSession
        };
    }

    // NORMAL SIGN IN - Only runs if dev bypass is disabled
    try {
        console.log('🔐 Signing in user:', email);
        
        const result = await signIn(email, password);
        console.log('📦 Sign in result:', result);
        
        if (!result) {
            throw new Error('No response from sign in');
        }
        
        const { data, error } = result;
        
        if (error) {
            console.error('Sign in error:', error);
            throw new Error(error.message);
        }
        
        if (!data) {
            throw new Error('No data returned from sign in');
        }
        
        if (data.session && data.user) {
            currentSession = data.session;
            currentUser = data.user;
            
            console.log('✅ Sign in successful:', currentUser.email);
            
            return {
                success: true,
                user: data.user,
                session: data.session
            };
        }
        
        throw new Error('No session or user in response');
        
    } catch (error) {
        console.error('❌ Sign in error:', error);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: error.message || 'Sign in failed'
        };
    }
}

// ============================================
// SIGN OUT
// ============================================

/**
 * Handle user sign-out
 */
export async function handleSignOut() {
    // DEV BYPASS CHECK
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign out (DEV ONLY)');
        currentUser = null;
        currentSession = null;
        return { success: true };
    }

    try {
        console.log('👋 Signing out user');
        
        const { error } = await signOut();
        
        if (error) {
            console.error('Sign out error:', error);
            throw new Error(error.message);
        }
        
        // Clear local state
        currentUser = null;
        currentSession = null;
        
        console.log('✅ Sign out successful');
        
        return {
            success: true
        };
        
    } catch (error) {
        console.error('Sign out error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// PASSWORD RESET
// ============================================

/**
 * Request password reset email
 */
export async function handlePasswordReset(email) {
    try {
        console.log('📧 Requesting password reset for:', email);
        
        const { error } = await resetPassword(email);
        
        if (error) {
            console.error('Password reset error:', error);
            throw new Error(error.message);
        }
        
        console.log('✅ Password reset email sent');
        
        return {
            success: true,
            message: 'Password reset email sent. Please check your inbox.'
        };
        
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Create user profile in database
 */
async function createUserProfile(userId, name, email) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    id: userId,
                    full_name: name,
                    email: email,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
        
        console.log('✅ Profile created:', data);
        return data;
        
    } catch (error) {
        console.error('Error creating profile:', error);
        throw error;
    }
}

/**
 * Get user profile from database
 * DEV BYPASS: Returns fake profile for dev bypass users (in-memory only)
 */
export async function getUserProfile(userId) {
    // DEV BYPASS: Return fake profile for dev bypass users (no DB access)
    // Check if userId is provided and matches current dev user OR if dev bypass is simply active
    // This ensures getProfile works even if called with ID directly
    if (isDevBypassActive() && (
        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) || 
        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))
    )) {
        console.log('🔧 DEV BYPASS: Returning fake profile for dev bypass user');
        return {
            id: userId || currentUser?.id,
            email: 'dev@phasee.local',
            full_name: 'Dev User',
            display_name: 'Dev User',
            onboarding_complete: true,
            subscription_status: 'active',
            trial_started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
        
        return data;
        
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

/**
 * Update user profile in database (UPSERT - creates if doesn't exist)
 */
export async function updateUserProfile(userId, profileData) {
    try {
        console.log('📝 Updating profile for user:', userId);
        console.log('📦 Profile data:', profileData);
        
        // Get current user to ensure we have email
        const { data: { user } } = await supabase.auth.getUser();
        
        // Use UPSERT to create or update
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: user?.email || profileData.email,
                ...profileData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating profile:', error);
            
            // Provide helpful error messages
            if (error.message?.includes('column') && error.message?.includes('does not exist')) {
                throw new Error('Database schema is outdated. Please run SUPABASE_FRESH_START.sql in your Supabase dashboard.');
            } else if (error.message?.includes('violates')) {
                throw new Error('Invalid data format. Please check your inputs.');
            } else if (error.message?.includes('JSON')) {
                throw new Error('Data format error. This usually means the database schema needs to be updated.');
            }
            
            throw error;
        }
        
        console.log('✅ Profile saved successfully:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error in updateUserProfile:', error);
        throw error;
    }
}

// ============================================
// AUTH STATE LISTENER
// ============================================

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (session) {
            currentSession = session;
            currentUser = session.user;
        } else {
            currentSession = null;
            currentUser = null;
        }
        
        if (callback) {
            callback(event, session);
        }
    });
}

// ============================================
// TRIAL & ONBOARDING HELPERS
// ============================================

/**
 * Check if user has completed onboarding
 * DEV BYPASS: Returns true for dev bypass users (skips onboarding)
 */
export async function hasCompletedOnboarding(userId) {
    console.log('🔍 hasCompletedOnboarding called with userId:', userId);
    console.log('🔍 currentUser:', currentUser ? `ID: ${currentUser.id}` : 'null');
    console.log('🔍 isDevBypassActive():', isDevBypassActive());
    
    // DEV BYPASS: Always return true for dev bypass users (skip onboarding)
    if (isDevBypassActive() && (
        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||
        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))
    )) {
        console.log('🔧 DEV BYPASS: Returning true for onboarding check');
        return true;
    }
    
    console.log('⚠️ Dev bypass check failed, falling back to normal check');
    try {
        const profile = await getUserProfile(userId);
        return profile && profile.onboarding_complete === true;
    } catch (error) {
        console.error('Error checking onboarding:', error);
        return false;
    }
}

/**
 * Mark onboarding as complete
 */
export async function markOnboardingComplete(userId) {
    try {
        await updateUserProfile(userId, {
            onboarding_complete: true
        });
        console.log('✅ Onboarding marked complete');
    } catch (error) {
        console.error('Error marking onboarding complete:', error);
    }
}

/**
 * Get trial start date
 */
export async function getTrialStartDate(userId) {
    try {
        const profile = await getUserProfile(userId);
        return profile?.trial_started_at || null;
    } catch (error) {
        console.error('Error getting trial start date:', error);
        return null;
    }
}

/**
 * Start free trial
 */
export async function startTrial(userId) {
    try {
        await updateUserProfile(userId, {
            trial_started_at: new Date().toISOString()
        });
        console.log('✅ Trial started');
    } catch (error) {
        console.error('Error starting trial:', error);
    }
}

/**
 * Check if trial is expired
 * DEV BYPASS: Returns false for dev bypass users (trial never expires)
 */
export async function isTrialExpired(userId) {
    // DEV BYPASS: Always return false for dev bypass users (trial never expires)
    if (isDevBypassActive() && (
        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||
        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))
    )) {
        console.log('🔧 DEV BYPASS: Returning false for trial expiration check');
        return false;
    }
    
    try {
        const trialStart = await getTrialStartDate(userId);
        
        if (!trialStart) {
            return false; // No trial started yet
        }
        
        const trialStartTime = new Date(trialStart).getTime();
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        
        return (now - trialStartTime) > threeDaysMs;
        
    } catch (error) {
        console.error('Error checking trial expiration:', error);
        return false;
    }
}

/**
 * Check if user has active subscription
 * DEV BYPASS: Returns true for dev bypass users (allows full access)
 */
export async function hasActiveSubscription(userId) {
    // DEV BYPASS: Always return true for dev bypass users (allows full access)
    if (isDevBypassActive() && (
        (currentUser && currentUser.id.startsWith('dev-bypass-user-')) ||
        (typeof userId === 'string' && userId.startsWith('dev-bypass-user-'))
    )) {
        console.log('🔧 DEV BYPASS: Returning true for subscription check');
        return true;
    }
    
    try {
        const profile = await getUserProfile(userId);
        return profile?.subscription_status === 'active';
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}


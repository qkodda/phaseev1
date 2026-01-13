/**
 * AUTH INTEGRATION - Supabase Authentication
 * 
 * PHAZEE HEALTH CHECK: This file contains all authentication logic for Phazee.
 * Integrates Supabase auth with dev bypass for local development.
 * 
 * DEV BYPASS BEHAVIOR:
 * - Development: Auto-login as "Dev User", any email/password works
 * - Production: Dev bypass disabled, real Supabase auth required
 * 
 * SECURITY:
 * - Never logs passwords, tokens, or sensitive data
 * - Uses safe auth logger for event tracking
 * - Generic error messages to prevent account enumeration
 * 
 * This is the ONLY place where auth handlers (signIn, signUp, signOut) are defined.
 */

import { supabase, signUp, signIn, signOut, getCurrentUser, resetPassword } from './supabase.js';
import { isDevBypassEnabled } from './auth-config.js';
import { 
    logAuthEvent, 
    AUTH_EVENTS, 
    ERROR_CATEGORIES,
    categorizeAuthError,
    getFriendlyErrorMessage,
    trackAuthError,
    clearErrorTracking,
    checkResetCooldown,
    recordResetRequest
} from './auth-logger.js';

// ============================================
// DEV BYPASS CONFIGURATION (DEV ONLY - REMOVE BEFORE MERGE TO MAIN)
// ============================================

/**
 * Check if dev bypass should be active
 * Only active when DEV_BYPASS_ENABLED is true
 * NOTE: When enabled, works on any hostname (dev only - disable before production)
 */
function isDevBypassActive() {
    return isDevBypassEnabled();
}

/**
 * Create a fake dev user for testing (in-memory only, no DB writes)
 * This user has all the properties needed for the app to function
 */
const DEV_BYPASS_USER_ID = 'dev-bypass-user';

function createDevBypassUser(overrides = {}) {
    const fakeEmail = 'dev@phazee.local';
    
    return {
        id: DEV_BYPASS_USER_ID,
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
        role: 'authenticated',
        ...overrides
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

function activateDevBypassSession(overrides = {}) {
    const fakeUser = createDevBypassUser(overrides);
    const fakeSession = createDevBypassSession(fakeUser);
    
    currentUser = fakeUser;
    currentSession = fakeSession;
    
    return { fakeUser, fakeSession };
}

const isDevBypassUserId = (value) => typeof value === 'string' && value.startsWith('dev-bypass-user');

// ============================================
// AUTHENTICATION STATE
// ============================================

let currentUser = null;
let currentSession = null;

/**
 * Initialize authentication - check for existing session
 * DEV BYPASS: If enabled and on localhost, creates fake user/session
 * 
 * SESSION BOOTSTRAP: Single source of truth for session state on app start
 */
export async function initAuth() {
    logAuthEvent(AUTH_EVENTS.SESSION_BOOTSTRAP);
    
    if (isDevBypassActive()) {
        if (!currentUser) {
            console.warn('🔧 DEV BYPASS ACTIVE - Initializing mock session');
            activateDevBypassSession();
        }
        logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { userId: currentUser?.id });
        return currentUser;
    }
    
    // NORMAL AUTH FLOW - Check for real Supabase session
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, { 
                errorCategory: categorizeAuthError(error) 
            });
            return null;
        }
        
        if (session) {
            currentSession = session;
            currentUser = session.user;
            logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { userId: currentUser.id });
            return currentUser;
        }
        
        logAuthEvent(AUTH_EVENTS.SESSION_BOOTSTRAP, { route: 'no_session' });
        return null;
    } catch (error) {
        logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, { 
            errorCategory: categorizeAuthError(error) 
        });
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    if (isDevBypassActive()) {
        return true;
    }
    return currentUser !== null && currentSession !== null;
}

/**
 * Get current user
 */
export function getUser() {
    if (isDevBypassActive() && !currentUser) {
        activateDevBypassSession();
    }
    return currentUser;
}

/**
 * Get current session
 */
export function getSession() {
    if (isDevBypassActive() && !currentSession) {
        activateDevBypassSession();
    }
    return currentSession;
}

// ============================================
// SIGN UP
// ============================================

/**
 * Handle user sign-up with email confirmation
 * 
 * SECURITY:
 * - Never reveals if email already exists
 * - Profile creation is also handled by DB trigger (reliable backup)
 */
export async function handleSignUp(name, email, password) {
    logAuthEvent(AUTH_EVENTS.SIGNUP_ATTEMPT);
    
    // DEV BYPASS CHECK
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign up (DEV ONLY)');
        const { fakeUser } = activateDevBypassSession({
            email,
            user_metadata: {
                full_name: name,
                display_name: name
            }
        });
        
        logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, { userId: fakeUser.id });
        
        return {
            success: true,
            requiresConfirmation: false,
            user: fakeUser
        };
    }

    try {
        // Sign up with Supabase
        const { data, error } = await signUp(email, password, {
            data: {
                full_name: name,
                display_name: name
            }
        });
        
        if (error) {
            const errorCategory = categorizeAuthError(error);
            logAuthEvent(AUTH_EVENTS.SIGNUP_FAILED, { errorCategory });
            
            // Generic message for security - don't reveal if email exists
            let friendlyMessage = getFriendlyErrorMessage(error);
            
            // Special handling for "already registered" - make it generic
            if (error.message?.toLowerCase().includes('already') || 
                error.message?.toLowerCase().includes('exists')) {
                friendlyMessage = 'Could not create account. Please try a different email or sign in.';
            }
            
            return {
                success: false,
                error: friendlyMessage,
                errorCategory
            };
        }
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
            // Email confirmation required - still a success
            logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, { userId: data.user.id });
            
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
            
            logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, { userId: data.user.id });
            
            // Create profile in database (backup - DB trigger is primary)
            try {
                await createUserProfile(data.user.id, name, email);
            } catch (profileError) {
                // Log but don't fail - DB trigger should handle this
                console.warn('Client-side profile creation failed (DB trigger should handle):', profileError);
            }
            
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
        const errorCategory = categorizeAuthError(error);
        logAuthEvent(AUTH_EVENTS.SIGNUP_FAILED, { errorCategory });
        
        return {
            success: false,
            error: getFriendlyErrorMessage(error),
            errorCategory
        };
    }
}

// ============================================
// SIGN IN
// ============================================

/**
 * Handle user sign-in
 * 
 * SECURITY:
 * - Never reveals if email exists (generic error messages)
 * - Tracks repeated failures for abuse detection
 * - Clears error tracking on success
 */
export async function handleSignIn(email, password) {
    logAuthEvent(AUTH_EVENTS.LOGIN_ATTEMPT);
    
    // DEV BYPASS CHECK - HIGHEST PRIORITY
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign in (DEV ONLY)');
        activateDevBypassSession({ email });
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { userId: currentUser.id });
        clearErrorTracking();
        return {
            success: true,
            user: currentUser,
            session: currentSession
        };
    }

    // NORMAL SIGN IN - Only runs if dev bypass is disabled
    try {
        const result = await signIn(email, password);
        
        if (!result) {
            throw new Error('No response from sign in');
        }
        
        const { data, error } = result;
        
        if (error) {
            const errorCategory = categorizeAuthError(error);
            logAuthEvent(AUTH_EVENTS.LOGIN_FAILED, { errorCategory });
            
            // Track error for repeated failure detection
            const tracking = trackAuthError(errorCategory);
            
            // Return friendly message with optional suggestion
            return {
                success: false,
                error: getFriendlyErrorMessage(error),
                errorCategory,
                suggestion: tracking.suggestion,
                isRepeated: tracking.isRepeated
            };
        }
        
        if (!data) {
            throw new Error('No data returned from sign in');
        }
        
        if (data.session && data.user) {
            currentSession = data.session;
            currentUser = data.user;
            
            logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { userId: currentUser.id });
            clearErrorTracking();
            
            return {
                success: true,
                user: data.user,
                session: data.session
            };
        }
        
        throw new Error('No session or user in response');
        
    } catch (error) {
        const errorCategory = categorizeAuthError(error);
        logAuthEvent(AUTH_EVENTS.LOGIN_FAILED, { errorCategory });
        
        const tracking = trackAuthError(errorCategory);
        
        return {
            success: false,
            error: getFriendlyErrorMessage(error),
            errorCategory,
            suggestion: tracking.suggestion,
            isRepeated: tracking.isRepeated
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
    const userId = currentUser?.id;
    
    // DEV BYPASS CHECK
    if (isDevBypassActive()) {
        console.warn('🔧 DEV BYPASS ACTIVE - Simulating sign out (DEV ONLY)');
        currentUser = null;
        currentSession = null;
        logAuthEvent(AUTH_EVENTS.LOGOUT, { userId });
        return { success: true };
    }

    try {
        const { error } = await signOut();
        
        if (error) {
            console.error('Sign out error:', error);
            throw new Error(error.message);
        }
        
        // Clear local state
        currentUser = null;
        currentSession = null;
        
        logAuthEvent(AUTH_EVENTS.LOGOUT, { userId });
        
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
 * 
 * SECURITY:
 * - ALWAYS shows same success message regardless of whether email exists
 * - Implements rate limiting cooldown
 * - Never reveals account existence
 */
export async function handlePasswordReset(email) {
    logAuthEvent(AUTH_EVENTS.PASSWORD_RESET_REQUEST);
    
    // Check cooldown
    const cooldown = checkResetCooldown();
    if (cooldown.onCooldown) {
        return {
            success: false,
            onCooldown: true,
            remainingSeconds: cooldown.remainingSeconds,
            error: `Please wait ${cooldown.remainingSeconds} seconds before requesting another reset.`
        };
    }
    
    try {
        const { error } = await resetPassword(email);
        
        // Record the request for cooldown tracking
        recordResetRequest();
        
        // Check for rate limiting specifically
        if (error) {
            const errorCategory = categorizeAuthError(error);
            
            if (errorCategory === ERROR_CATEGORIES.RATE_LIMITED) {
                return {
                    success: false,
                    error: 'Too many reset requests. Please wait a few minutes and try again.',
                    errorCategory
                };
            }
            
            // For any other error, still show generic success message
            // This prevents account enumeration
        }
        
        // ALWAYS return the same message for security
        // Don't reveal whether the email exists or not
        return {
            success: true,
            message: 'If an account exists for that email, we sent a reset link. Please check your inbox.'
        };
        
    } catch (error) {
        const errorCategory = categorizeAuthError(error);
        
        // Rate limiting should show an error
        if (errorCategory === ERROR_CATEGORIES.RATE_LIMITED) {
            return {
                success: false,
                error: 'Too many reset requests. Please wait a few minutes and try again.',
                errorCategory
            };
        }
        
        // For all other errors, still show generic success
        // This is intentional for security
        return {
            success: true,
            message: 'If an account exists for that email, we sent a reset link. Please check your inbox.'
        };
    }
}

/**
 * Update user password (after clicking reset link)
 * Called from the password recovery screen
 * 
 * @param {string} newPassword - The new password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function handleUpdatePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            const errorCategory = categorizeAuthError(error);
            
            return {
                success: false,
                error: getFriendlyErrorMessage(error),
                errorCategory
            };
        }
        
        logAuthEvent(AUTH_EVENTS.PASSWORD_RESET_COMPLETE, { userId: data?.user?.id });
        
        return {
            success: true,
            message: 'Password updated successfully!'
        };
        
    } catch (error) {
        const errorCategory = categorizeAuthError(error);
        
        return {
            success: false,
            error: getFriendlyErrorMessage(error),
            errorCategory
        };
    }
}

/**
 * Check if current URL indicates password recovery mode
 * Supabase adds type=recovery to the URL hash when user clicks reset link
 * 
 * @returns {boolean}
 */
export function isPasswordRecoveryMode() {
    try {
        const hash = window.location.hash;
        return hash.includes('type=recovery') || hash.includes('type=password_recovery');
    } catch (e) {
        return false;
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
        isDevBypassUserId(currentUser?.id) || 
        isDevBypassUserId(userId)
    )) {
        console.log('🔧 DEV BYPASS: Returning fake profile for dev bypass user');
        return {
            id: userId || currentUser?.id,
            email: 'dev@phazee.local',
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

// Track active subscriptions for cleanup
let authStateSubscription = null;

/**
 * Listen for auth state changes
 * 
 * EVENTS HANDLED:
 * - SIGNED_IN: User signed in
 * - SIGNED_OUT: User signed out  
 * - TOKEN_REFRESHED: Session token refreshed
 * - PASSWORD_RECOVERY: User clicked password reset link
 * - USER_UPDATED: User data updated
 * 
 * CLEANUP: Returns unsubscribe function, also tracks globally for cleanup
 */
export function onAuthStateChange(callback) {
    // Clean up any existing subscription first
    if (authStateSubscription) {
        authStateSubscription.unsubscribe();
        authStateSubscription = null;
    }
    
    if (isDevBypassActive()) {
        activateDevBypassSession();
        if (callback) {
            callback('DEV_BYPASS', { user: currentUser, session: currentSession });
        }
        return { 
            data: { subscription: { unsubscribe: () => {} } }
        };
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Map Supabase events to our auth events
        const eventMap = {
            'SIGNED_IN': AUTH_EVENTS.SIGNED_IN,
            'SIGNED_OUT': AUTH_EVENTS.SIGNED_OUT,
            'TOKEN_REFRESHED': AUTH_EVENTS.TOKEN_REFRESHED,
            'PASSWORD_RECOVERY': AUTH_EVENTS.PASSWORD_RECOVERY,
            'USER_UPDATED': 'user_updated'
        };
        
        const authEvent = eventMap[event] || event;
        logAuthEvent(authEvent, { userId: session?.user?.id });
        
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
    
    // Track for cleanup
    authStateSubscription = subscription;
    
    return { 
        data: { subscription },
        unsubscribe: () => {
            subscription.unsubscribe();
            authStateSubscription = null;
        }
    };
}

/**
 * Clean up all auth subscriptions
 * Call this on app unmount or before re-initializing
 */
export function cleanupAuthListeners() {
    if (authStateSubscription) {
        authStateSubscription.unsubscribe();
        authStateSubscription = null;
    }
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
        isDevBypassUserId(currentUser?.id) ||
        isDevBypassUserId(userId)
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
        isDevBypassUserId(currentUser?.id) ||
        isDevBypassUserId(userId)
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
        isDevBypassUserId(currentUser?.id) ||
        isDevBypassUserId(userId)
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


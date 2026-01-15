/**
 * AUTH INTEGRATION - Supabase Authentication
 * 
 * PRODUCTION-READY: Real Supabase authentication only.
 * 
 * SECURITY:
 * - Never logs passwords, tokens, or sensitive data
 * - Uses safe auth logger for event tracking
 * - Generic error messages to prevent account enumeration
 * 
 * This is the ONLY place where auth handlers (signIn, signUp, signOut) are defined.
 */

import { supabase, signUp, signIn, signOut, getCurrentUser, resetPassword } from './supabase.js';
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
// AUTHENTICATION STATE
// ============================================

let currentUser = null;
let currentSession = null;

/**
 * Initialize authentication - check for existing session
 */
export async function initAuth() {
    logAuthEvent(AUTH_EVENTS.SESSION_BOOTSTRAP);
    
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
 * Handle user sign-up
 * 
 * FLOW:
 * - Creates auth user in Supabase
 * - Creates profile in database (onboarding_complete: false)
 * - User proceeds to onboarding (email verification is for recovery, not access)
 * 
 * SECURITY:
 * - Never reveals if email already exists (generic error messages)
 */
export async function handleSignUp(name, email, password) {
    logAuthEvent(AUTH_EVENTS.SIGNUP_ATTEMPT);

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
            
            // Create profile in database with onboarding_complete: false
            try {
                await createUserProfile(data.user.id, name, email);
                console.log('✅ Profile created on signup');
            } catch (profileError) {
                // Profile creation failed - this is critical, log it
                console.error('❌ Profile creation failed:', profileError);
                // Don't block signup, but this needs attention
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
            
            // CRITICAL: Ensure profile exists on sign-in (create if missing)
            // This handles cases where profile was deleted or never created
            try {
                const existingProfile = await getUserProfile(data.user.id);
                if (!existingProfile) {
                    console.log('⚠️ No profile found on sign-in, creating one...');
                    await createUserProfile(
                        data.user.id, 
                        data.user.user_metadata?.full_name || '', 
                        data.user.email
                    );
                    console.log('✅ Profile created on sign-in');
                }
            } catch (profileError) {
                console.error('⚠️ Profile check/creation on sign-in failed:', profileError);
                // Don't block sign-in, but log the issue
            }
            
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
 * Create user profile in database (UPSERT)
 * Called on signup - creates profile with onboarding_complete: false
 * Uses upsert so it's safe to call multiple times
 */
async function createUserProfile(userId, name, email) {
    try {
        console.log('📝 Creating/updating profile for:', userId);
        
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: name || '',
                email: email,
                onboarding_complete: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating profile:', error);
            throw error;
        }

        console.log('✅ Profile created/updated:', data);
        return data;

    } catch (error) {
        console.error('❌ Error creating profile:', error);
        throw error;
    }
}

/**
 * Get user profile from database
 * Uses maybeSingle() to gracefully handle 0 rows (returns null instead of error)
 */
export async function getUserProfile(userId) {
    // Guard against undefined/null userId
    if (!userId) {
        console.warn('⚠️ getUserProfile called with undefined/null userId');
        return null;
    }
    
    console.log('👤 Fetching profile from database for:', userId);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully
        
        if (error) {
            // Only log actual errors, not "no rows" which is handled by maybeSingle
            console.error('Error fetching profile:', error);
            return null;
        }
        
        console.log('✅ Profile fetched:', data ? 'Found' : 'Not found');
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
        
        // Check if profile exists first (use maybeSingle to handle 0 rows)
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, onboarding_complete')
            .eq('id', userId)
            .maybeSingle();
        
        // Build upsert data
        const upsertData = {
            id: userId,
            email: user?.email || profileData.email,
            ...profileData,
            updated_at: new Date().toISOString()
        };
        
        // If creating new profile, ensure onboarding_complete defaults to false
        if (!existingProfile && !profileData.hasOwnProperty('onboarding_complete')) {
            upsertData.onboarding_complete = false;
            console.log('📝 New profile - setting onboarding_complete: false');
        }
        
        // Use UPSERT to create or update
        const { data, error } = await supabase
            .from('profiles')
            .upsert(upsertData, {
                onConflict: 'id'
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating profile:', error);
            
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

let authStateSubscription = null;

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
    // Clean up any existing subscription first
    if (authStateSubscription) {
        authStateSubscription.unsubscribe();
        authStateSubscription = null;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
 */
export async function hasCompletedOnboarding(userId) {
    console.log('🔍 hasCompletedOnboarding called with userId:', userId);
    
    try {
        const profile = await getUserProfile(userId);
        console.log('📋 Profile for onboarding check:', {
            hasProfile: !!profile,
            onboarding_complete: profile?.onboarding_complete,
            type: typeof profile?.onboarding_complete
        });
        
        // STRICT CHECK: Must be explicitly true
        const isComplete = profile !== null && profile.onboarding_complete === true;
        console.log('🎯 hasCompletedOnboarding result:', isComplete);
        return isComplete;
    } catch (error) {
        console.error('Error checking onboarding:', error);
        // FAIL SAFE: If we can't check, assume NOT complete
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
 * Get onboarding step by inferring from existing data (no new column needed)
 * 0 = page 1 (no brand_name)
 * 1 = page 2 (has brand_name, but onboarding_complete is false)
 * 2 = paywall (onboarding_complete is true, but no trial_started_at)
 */
export async function getOnboardingStep(userId) {
    try {
        const profile = await getUserProfile(userId);
        
        if (!profile) {
            console.log('📋 No profile, step: 0');
            return 0;
        }
        
        // If onboarding is complete, user is at paywall (step 2)
        if (profile.onboarding_complete === true) {
            console.log('📋 Onboarding complete, step: 2 (paywall)');
            return 2;
        }
        
        // If brand_name exists, user completed page 1, now on page 2
        if (profile.brand_name && profile.brand_name.trim() !== '') {
            console.log('📋 Has brand_name, step: 1 (page 2)');
            return 1;
        }
        
        // Otherwise, user is on page 1
        console.log('📋 No brand_name, step: 0 (page 1)');
        return 0;
    } catch (error) {
        console.error('Error getting onboarding step:', error);
        return 0;
    }
}

/**
 * Get trial start date
 */
export async function getTrialStartDate(userId) {
    try {
        const profile = await getUserProfile(userId);
        console.log('📋 Profile trial_started_at:', profile?.trial_started_at);
        return profile?.trial_started_at || null;
    } catch (error) {
        console.error('Error getting trial start date:', error);
        return null;
    }
}

/**
 * Check if user has started their trial (passed through paywall)
 */
export async function hasStartedTrial(userId) {
    try {
        console.log('🔍 Checking if trial started for user:', userId);
        const trialStart = await getTrialStartDate(userId);
        const result = trialStart !== null;
        console.log('🔍 Trial started check:', { trialStart, result });
        return result;
    } catch (error) {
        console.error('Error checking if trial started:', error);
        return false;
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
 * Check if trial is expired (3 day trial)
 */
export async function isTrialExpired(userId) {
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
 */
export async function hasActiveSubscription(userId) {
    try {
        const profile = await getUserProfile(userId);
        return profile?.subscription_status === 'active';
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

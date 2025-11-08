/**
 * AUTH INTEGRATION - Supabase Authentication
 * 
 * This file contains all the authentication logic for Phasee.
 * Import this into app.js and replace the localStorage-only auth.
 */

import { supabase, signUp, signIn, signOut, getCurrentUser, resetPassword } from './supabase.js';

// ============================================
// AUTHENTICATION STATE
// ============================================

let currentUser = null;
let currentSession = null;

/**
 * Initialize authentication - check for existing session
 */
export async function initAuth() {
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
    try {
        console.log('🔐 Signing in user:', email);
        
        const { data, error } = await signIn(email, password);
        
        if (error) {
            console.error('Sign in error:', error);
            throw new Error(error.message);
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
        
        throw new Error('No session returned');
        
    } catch (error) {
        console.error('Sign in error:', error);
        return {
            success: false,
            error: error.message
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
 */
export async function getUserProfile(userId) {
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
 * Update user profile in database
 */
export async function updateUserProfile(userId, profileData) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
        
        console.log('✅ Profile updated:', data);
        return data;
        
    } catch (error) {
        console.error('Error updating profile:', error);
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
 */
export async function hasCompletedOnboarding(userId) {
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


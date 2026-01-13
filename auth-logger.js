/**
 * AUTH LOGGER - Safe authentication event logging utility
 * 
 * SECURITY RULES:
 * - NEVER log passwords, tokens, session secrets, or reset links
 * - NEVER log full email addresses (use hash or omit entirely)
 * - Log only: eventType, timestamp, userId (if available), error category, route context
 * - Repeated error detection to help users and flag abuse
 */

// Error tracking for repeated failures
const errorTracker = {
    errors: [],
    maxErrors: 10,
    windowMs: 2 * 60 * 1000, // 2 minutes
    thresholdCount: 3
};

// Auth event categories (safe to log)
export const AUTH_EVENTS = {
    // Session events
    SESSION_BOOTSTRAP: 'session_bootstrap',
    SESSION_RESTORED: 'session_restored',
    SESSION_EXPIRED: 'session_expired',
    
    // Auth state events
    SIGNED_IN: 'signed_in',
    SIGNED_OUT: 'signed_out',
    TOKEN_REFRESHED: 'token_refreshed',
    PASSWORD_RECOVERY: 'password_recovery',
    
    // User actions
    LOGIN_ATTEMPT: 'login_attempt',
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    SIGNUP_ATTEMPT: 'signup_attempt',
    SIGNUP_SUCCESS: 'signup_success',
    SIGNUP_FAILED: 'signup_failed',
    LOGOUT: 'logout',
    PASSWORD_RESET_REQUEST: 'password_reset_request',
    PASSWORD_RESET_COMPLETE: 'password_reset_complete',
    
    // Routing events
    ONBOARDING_GATE: 'onboarding_gate',
    ROUTE_CHANGE: 'route_change'
};

// Error categories (safe to log - no raw messages)
export const ERROR_CATEGORIES = {
    INVALID_CREDENTIALS: 'invalid_credentials',
    RATE_LIMITED: 'rate_limited',
    EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
    USER_NOT_FOUND: 'user_not_found',
    NETWORK_ERROR: 'network_error',
    SESSION_ERROR: 'session_error',
    PROFILE_ERROR: 'profile_error',
    UNKNOWN: 'unknown'
};

/**
 * Categorize Supabase auth errors into safe categories
 * @param {Error|Object} error - The error from Supabase
 * @returns {string} Safe error category
 */
export function categorizeAuthError(error) {
    if (!error) return ERROR_CATEGORIES.UNKNOWN;
    
    const message = (error.message || error.error_description || '').toLowerCase();
    const code = error.code || error.status || '';
    
    // Rate limiting
    if (message.includes('rate') || message.includes('too many') || code === 429) {
        return ERROR_CATEGORIES.RATE_LIMITED;
    }
    
    // Invalid credentials (generic - don't reveal specifics)
    if (message.includes('invalid') || message.includes('credentials') || 
        message.includes('password') || message.includes('incorrect')) {
        return ERROR_CATEGORIES.INVALID_CREDENTIALS;
    }
    
    // Email not confirmed
    if (message.includes('confirm') || message.includes('verified') || message.includes('verification')) {
        return ERROR_CATEGORIES.EMAIL_NOT_CONFIRMED;
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        return ERROR_CATEGORIES.NETWORK_ERROR;
    }
    
    // Session errors
    if (message.includes('session') || message.includes('token') || message.includes('refresh')) {
        return ERROR_CATEGORIES.SESSION_ERROR;
    }
    
    return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Map auth errors to user-friendly messages
 * IMPORTANT: Never reveal if an account exists
 * @param {Error|Object} error - The error from Supabase
 * @returns {string} User-friendly error message
 */
export function getFriendlyErrorMessage(error) {
    const category = categorizeAuthError(error);
    
    switch (category) {
        case ERROR_CATEGORIES.RATE_LIMITED:
            return 'Too many attempts. Please wait a moment and try again.';
        case ERROR_CATEGORIES.INVALID_CREDENTIALS:
            // Generic message - never reveal if email exists
            return 'Invalid email or password. Please check your credentials.';
        case ERROR_CATEGORIES.EMAIL_NOT_CONFIRMED:
            return 'Please check your email to confirm your account.';
        case ERROR_CATEGORIES.NETWORK_ERROR:
            return 'Connection error. Please check your internet and try again.';
        case ERROR_CATEGORIES.SESSION_ERROR:
            return 'Your session has expired. Please sign in again.';
        case ERROR_CATEGORIES.PROFILE_ERROR:
            return 'Could not load your profile. Please try again.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

/**
 * Check if we're in production mode
 */
function isProduction() {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env.PROD === true || import.meta.env.MODE === 'production';
        }
    } catch (e) {}
    return false;
}

/**
 * Log an auth event safely
 * @param {string} eventType - One of AUTH_EVENTS
 * @param {Object} details - Additional details (will be sanitized)
 */
export function logAuthEvent(eventType, details = {}) {
    const timestamp = new Date().toISOString();
    
    // Build safe log entry
    const logEntry = {
        eventType,
        timestamp,
        // Only include userId if provided (never include email)
        ...(details.userId && { userId: details.userId }),
        // Only include error category, not raw message
        ...(details.errorCategory && { errorCategory: details.errorCategory }),
        // Include route context if provided
        ...(details.route && { route: details.route })
    };
    
    // In development, log to console
    if (!isProduction()) {
        const emoji = getEventEmoji(eventType);
        console.log(`${emoji} [Auth] ${eventType}`, logEntry);
    }
    
    // In production, you could send to analytics endpoint here
    // Example: sendToAnalytics(logEntry);
}

/**
 * Get emoji for event type (dev logging only)
 */
function getEventEmoji(eventType) {
    const emojiMap = {
        [AUTH_EVENTS.SESSION_BOOTSTRAP]: '🚀',
        [AUTH_EVENTS.SESSION_RESTORED]: '♻️',
        [AUTH_EVENTS.SESSION_EXPIRED]: '⏰',
        [AUTH_EVENTS.SIGNED_IN]: '✅',
        [AUTH_EVENTS.SIGNED_OUT]: '👋',
        [AUTH_EVENTS.TOKEN_REFRESHED]: '🔄',
        [AUTH_EVENTS.PASSWORD_RECOVERY]: '🔑',
        [AUTH_EVENTS.LOGIN_ATTEMPT]: '🔐',
        [AUTH_EVENTS.LOGIN_SUCCESS]: '✅',
        [AUTH_EVENTS.LOGIN_FAILED]: '❌',
        [AUTH_EVENTS.SIGNUP_ATTEMPT]: '📝',
        [AUTH_EVENTS.SIGNUP_SUCCESS]: '🎉',
        [AUTH_EVENTS.SIGNUP_FAILED]: '❌',
        [AUTH_EVENTS.LOGOUT]: '👋',
        [AUTH_EVENTS.PASSWORD_RESET_REQUEST]: '📧',
        [AUTH_EVENTS.PASSWORD_RESET_COMPLETE]: '✅',
        [AUTH_EVENTS.ONBOARDING_GATE]: '🚧',
        [AUTH_EVENTS.ROUTE_CHANGE]: '🧭'
    };
    return emojiMap[eventType] || '📋';
}

/**
 * Track an auth error and detect repeated failures
 * @param {string} errorCategory - The error category
 * @param {string} userId - Optional user ID
 * @returns {Object} { isRepeated: boolean, count: number, suggestion?: string }
 */
export function trackAuthError(errorCategory, userId = null) {
    const now = Date.now();
    
    // Clean old errors outside the window
    errorTracker.errors = errorTracker.errors.filter(
        e => (now - e.timestamp) < errorTracker.windowMs
    );
    
    // Add new error
    errorTracker.errors.push({
        category: errorCategory,
        userId,
        timestamp: now
    });
    
    // Trim if too many
    if (errorTracker.errors.length > errorTracker.maxErrors) {
        errorTracker.errors = errorTracker.errors.slice(-errorTracker.maxErrors);
    }
    
    // Count same category errors
    const sameCategory = errorTracker.errors.filter(e => e.category === errorCategory);
    const isRepeated = sameCategory.length >= errorTracker.thresholdCount;
    
    // Log repeated error event
    if (isRepeated) {
        logAuthEvent('repeated_auth_error', {
            errorCategory,
            userId
        });
    }
    
    // Generate suggestion based on error type
    let suggestion = null;
    if (isRepeated) {
        switch (errorCategory) {
            case ERROR_CATEGORIES.INVALID_CREDENTIALS:
                suggestion = 'Having trouble? Try resetting your password.';
                break;
            case ERROR_CATEGORIES.RATE_LIMITED:
                suggestion = 'Please wait a few minutes before trying again.';
                break;
            case ERROR_CATEGORIES.NETWORK_ERROR:
                suggestion = 'Check your internet connection and try again.';
                break;
            default:
                suggestion = 'If this continues, please contact support.';
        }
    }
    
    return {
        isRepeated,
        count: sameCategory.length,
        suggestion
    };
}

/**
 * Clear error tracking (e.g., after successful login)
 */
export function clearErrorTracking() {
    errorTracker.errors = [];
}

/**
 * Password reset cooldown tracking
 */
const resetCooldown = {
    lastRequest: null,
    cooldownMs: 60 * 1000 // 1 minute between requests
};

/**
 * Check if password reset is on cooldown
 * @returns {Object} { onCooldown: boolean, remainingSeconds: number }
 */
export function checkResetCooldown() {
    if (!resetCooldown.lastRequest) {
        return { onCooldown: false, remainingSeconds: 0 };
    }
    
    const elapsed = Date.now() - resetCooldown.lastRequest;
    const remaining = resetCooldown.cooldownMs - elapsed;
    
    if (remaining <= 0) {
        return { onCooldown: false, remainingSeconds: 0 };
    }
    
    return {
        onCooldown: true,
        remainingSeconds: Math.ceil(remaining / 1000)
    };
}

/**
 * Record a password reset request
 */
export function recordResetRequest() {
    resetCooldown.lastRequest = Date.now();
}

/**
 * Clear reset cooldown
 */
export function clearResetCooldown() {
    resetCooldown.lastRequest = null;
}

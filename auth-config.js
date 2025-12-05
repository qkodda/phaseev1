// PHAZEE HEALTH CHECK: Central auth config and dev bypass helpers.
// This file determines if dev bypass is enabled (defaults to TRUE in development, FALSE in production).
// No other file should implement separate bypass logic - this is the single source of truth.

const readEnvValue = (key) => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
            return import.meta.env[key];
        }
    } catch (err) {
        // ignore
    }
    
    if (typeof process !== 'undefined' && process.env && key in process.env) {
        return process.env[key];
    }
    
    return undefined;
};

const normalizeFlag = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
};

const isProductionEnv = () => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            if (import.meta.env.PROD === true) return true;
            if (normalizeFlag(import.meta.env.MODE) === 'production') return true;
        }
    } catch (err) {
        // ignore
    }
    
    if (typeof process !== 'undefined' && process.env) {
        if (normalizeFlag(process.env.NODE_ENV) === 'production') return true;
    }
    
    return false;
};

export function isDevBypassEnabled() {
    if (isProductionEnv()) return false;
    
    const possibleKeys = [
        'VITE_DEV_BYPASS_AUTH',
        'NEXT_PUBLIC_DEV_BYPASS_AUTH',
        'DEV_BYPASS_AUTH'
    ];
    
    for (const key of possibleKeys) {
        const value = normalizeFlag(readEnvValue(key));
        console.log(`🔍 Checking ${key}:`, value);
        if (value === 'true' || value === '1' || value === 'yes') {
            console.log('✅ DEV BYPASS ENABLED via', key);
            return true;
        }
        // Check if explicitly disabled
        if (value === 'false' || value === '0' || value === 'no') {
            console.log('❌ DEV BYPASS EXPLICITLY DISABLED via', key);
            return false;
        }
    }
    
    // Default to FALSE - require real authentication
    console.log('🔒 DEV BYPASS DISABLED - real auth required');
    return false;
}


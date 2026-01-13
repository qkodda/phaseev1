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

// Cache the result to avoid repeated logging and checks
let _devBypassCached = null;

export function isDevBypassEnabled() {
    // Return cached result if available
    if (_devBypassCached !== null) {
        return _devBypassCached;
    }
    
    if (isProductionEnv()) {
        console.log('🔒 Production mode - dev bypass disabled');
        _devBypassCached = false;
        return false;
    }
    
    const possibleKeys = [
        'VITE_DEV_BYPASS_AUTH',
        'NEXT_PUBLIC_DEV_BYPASS_AUTH',
        'DEV_BYPASS_AUTH'
    ];
    
    for (const key of possibleKeys) {
        const value = normalizeFlag(readEnvValue(key));
        if (value === 'true' || value === '1' || value === 'yes') {
            console.log('✅ DEV BYPASS ENABLED via', key);
            _devBypassCached = true;
            return true;
        }
        if (value === 'false' || value === '0' || value === 'no') {
            console.log('❌ DEV BYPASS DISABLED via', key);
            _devBypassCached = false;
            return false;
        }
    }
    
    // Default: enabled in dev mode for localhost or local network IPs
    const isLocalDev = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname.startsWith('10.') ||
         window.location.hostname.startsWith('172.'));
    
    if (isLocalDev) {
        console.log('✅ DEV BYPASS ENABLED (local network default)');
        _devBypassCached = true;
        return true;
    }
    
    console.log('🔒 DEV BYPASS DISABLED - real auth required');
    _devBypassCached = false;
    return false;
}


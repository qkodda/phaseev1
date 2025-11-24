// NOTE: PHASEE AUTH AUDIT - centralizes dev bypass configuration logic

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
    
    // Default to TRUE in development mode if no env var is set
    console.log('✅ DEV BYPASS ENABLED by default (development mode, no env var set)');
    return true;
}


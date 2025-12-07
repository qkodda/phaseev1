/**
 * Generation Governance Client Service
 * 
 * Handles all generation rate limiting, tiering, cooldowns, and boost management
 * on the client side. Integrates with the backend governance APIs.
 */

import { supabase } from './supabase.js';
import { getUser, getSession } from './auth-integration.js';

// ============================================
// STATE MANAGEMENT
// ============================================

let governanceState = {
  // Current stats
  hourlyCount: 0,
  hourlyLimit: 12,
  dailyCount: 0,
  dailyLimit: 100,
  ideasToday: 0,
  
  // Tier info
  currentTier: 'A',
  tierAMax: 5,
  tierBMax: 10,
  
  // Cooldown
  cooldownSeconds: 0,
  cooldownEndTime: null,
  cooldownInterval: null,
  
  // Boost
  boostBalance: 0,
  activeBoostBatches: 0,
  batchesPerBoost: 3,
  
  // Status
  status: 'ok', // 'ok', 'warning', 'cooldown', 'locked', 'banned'
  warningMessage: null,
  
  // Last update
  lastUpdated: null
};

// Callbacks for UI updates
let onStateChange = null;
let onCooldownTick = null;
let onCooldownEnd = null;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the governance system
 * Call this after user authentication
 */
export async function initGovernance(callbacks = {}) {
  onStateChange = callbacks.onStateChange || null;
  onCooldownTick = callbacks.onCooldownTick || null;
  onCooldownEnd = callbacks.onCooldownEnd || null;
  
  // Fetch initial state
  await refreshGovernanceState();
  
  return governanceState;
}

/**
 * Refresh governance state from the server
 */
export async function refreshGovernanceState() {
  const user = getUser();
  if (!user) {
    console.log('⚠️ No user, governance in offline mode');
    return governanceState;
  }
  
  try {
    const session = getSession();
    const token = session?.access_token;
    
    // Make a pre-check call to get current state without generating
    const response = await fetch('/api/generate-ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userProfile: {},
        checkOnly: true, // Special flag for state check
        userId: user.id
      })
    });
    
    // Even on 429, we get governance data
    const data = await response.json();
    
    if (data.governance) {
      updateStateFromResponse(data.governance);
    } else if (data.hourly_stats) {
      // From a blocked response
      updateStateFromBlockedResponse(data);
    }
    
  } catch (error) {
    console.error('Failed to refresh governance state:', error);
  }
  
  return governanceState;
}

// ============================================
// GENERATION REQUESTS
// ============================================

/**
 * Generate new ideas with full governance checks
 * @param {Object} userProfile - User profile for idea generation
 * @param {string} customDirection - Optional custom direction
 * @param {boolean} isCampaign - Campaign mode flag
 * @param {string[]} preferredPlatforms - Preferred platforms
 * @param {boolean} useBoost - Whether to use a boost token
 * @returns {Promise<Object>} Generation result with ideas and governance info
 */
export async function generateWithGovernance(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], useBoost = false) {
  const user = getUser();
  const session = getSession();
  const token = session?.access_token;
  
  // Check local cooldown first
  if (isOnCooldown()) {
    return {
      success: false,
      error: 'cooldown',
      message: 'Woah woah, slow your roll!',
      cooldown_seconds: getRemainingCooldown(),
      governance: governanceState
    };
  }
  
  try {
    const response = await fetch('/api/generate-ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userProfile,
        customDirection,
        isCampaign,
        preferredPlatforms,
        count: 7,
        userId: user?.id,
        sessionId: getSessionId(),
        useBoost
      })
    });
    
    const data = await response.json();
    
    // Handle blocked responses
    if (!response.ok) {
      handleBlockedResponse(data);
      return {
        success: false,
        error: data.status || 'error',
        message: data.message || 'Generation failed',
        cooldown_seconds: data.cooldown_seconds || 0,
        governance: governanceState
      };
    }
    
    // Success - update state and start cooldown
    if (data.governance) {
      updateStateFromResponse(data.governance);
      startCooldown(data.governance.cooldown_seconds || 0);
    }
    
    return {
      success: true,
      ideas: data.ideas || [],
      governance: governanceState
    };
    
  } catch (error) {
    console.error('Generation request failed:', error);
    return {
      success: false,
      error: 'network',
      message: 'Connection error. Please try again.',
      governance: governanceState
    };
  }
}

/**
 * Regenerate a single idea (counts as 0.25 batch)
 */
export async function regenerateSingleIdea(userProfile, originalIdea, customDirection = '', preferredPlatforms = [], useBoost = false) {
  const user = getUser();
  const session = getSession();
  const token = session?.access_token;
  
  if (isOnCooldown()) {
    return {
      success: false,
      error: 'cooldown',
      message: 'Woah woah, slow your roll!',
      cooldown_seconds: getRemainingCooldown()
    };
  }
  
  try {
    const response = await fetch('/api/regenerate-one', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userProfile,
        originalIdea,
        customDirection,
        preferredPlatforms,
        userId: user?.id,
        sessionId: getSessionId(),
        useBoost
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      handleBlockedResponse(data);
      return {
        success: false,
        error: data.status || 'error',
        message: data.message
      };
    }
    
    if (data.governance) {
      // Update counts (0.25 added)
      governanceState.hourlyCount = data.governance.hourly_count;
      governanceState.dailyCount = data.governance.daily_count;
      notifyStateChange();
    }
    
    return {
      success: true,
      idea: data.idea,
      governance: governanceState
    };
    
  } catch (error) {
    console.error('Regenerate request failed:', error);
    return {
      success: false,
      error: 'network',
      message: 'Connection error'
    };
  }
}

// ============================================
// BOOST MANAGEMENT
// ============================================

/**
 * Get current boost balance
 */
export async function getBoostBalance() {
  const user = getUser();
  if (!user) return { balance: 0, active: 0 };
  
  try {
    const response = await fetch(`/api/boosts?userId=${user.id}`);
    const data = await response.json();
    
    governanceState.boostBalance = data.balance || 0;
    governanceState.activeBoostBatches = data.active_boost_batches || 0;
    governanceState.batchesPerBoost = data.batches_per_boost || 3;
    
    notifyStateChange();
    
    return data;
  } catch (error) {
    console.error('Failed to get boost balance:', error);
    return { balance: 0, active: 0 };
  }
}

/**
 * Redeem a boost token
 */
export async function redeemBoost() {
  const user = getUser();
  const session = getSession();
  const token = session?.access_token;
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  if (governanceState.boostBalance < 1) {
    return { success: false, error: 'No boosts available' };
  }
  
  try {
    const response = await fetch('/api/boosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        action: 'redeem',
        userId: user.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      governanceState.boostBalance = data.new_balance;
      governanceState.activeBoostBatches = data.active_boost_batches;
      governanceState.currentTier = 'A'; // Boost forces Tier A
      notifyStateChange();
    }
    
    return data;
    
  } catch (error) {
    console.error('Boost redemption failed:', error);
    return { success: false, error: 'Failed to redeem boost' };
  }
}

// ============================================
// COOLDOWN MANAGEMENT
// ============================================

/**
 * Check if currently on cooldown
 */
export function isOnCooldown() {
  if (!governanceState.cooldownEndTime) return false;
  return Date.now() < governanceState.cooldownEndTime;
}

/**
 * Get remaining cooldown in seconds
 */
export function getRemainingCooldown() {
  if (!governanceState.cooldownEndTime) return 0;
  const remaining = Math.max(0, governanceState.cooldownEndTime - Date.now());
  return Math.ceil(remaining / 1000);
}

/**
 * Start cooldown timer
 */
function startCooldown(seconds) {
  if (seconds <= 0) return;
  
  // Clear existing timer
  if (governanceState.cooldownInterval) {
    clearInterval(governanceState.cooldownInterval);
  }
  
  governanceState.cooldownSeconds = seconds;
  governanceState.cooldownEndTime = Date.now() + (seconds * 1000);
  governanceState.status = 'cooldown';
  
  // Start countdown
  governanceState.cooldownInterval = setInterval(() => {
    const remaining = getRemainingCooldown();
    
    if (onCooldownTick) {
      onCooldownTick(remaining);
    }
    
    if (remaining <= 0) {
      clearInterval(governanceState.cooldownInterval);
      governanceState.cooldownInterval = null;
      governanceState.cooldownEndTime = null;
      governanceState.status = 'ok';
      
      if (onCooldownEnd) {
        onCooldownEnd();
      }
      
      notifyStateChange();
    }
  }, 1000);
  
  notifyStateChange();
}

/**
 * Force set cooldown (e.g., from server response)
 */
export function setCooldown(seconds) {
  startCooldown(seconds);
}

// ============================================
// STATE HELPERS
// ============================================

function updateStateFromResponse(governance) {
  governanceState = {
    ...governanceState,
    hourlyCount: governance.hourly_count || 0,
    hourlyLimit: governance.hourly_limit || 12,
    dailyCount: governance.daily_count || 0,
    dailyLimit: governance.daily_limit || 100,
    ideasToday: governance.ideas_today || 0,
    currentTier: governance.tier || 'A',
    boostBalance: governance.remaining_boosts || 0,
    activeBoostBatches: governance.active_boost_batches || 0,
    status: governance.status || 'ok',
    warningMessage: governance.warning_message || null,
    lastUpdated: Date.now()
  };
  
  notifyStateChange();
}

function updateStateFromBlockedResponse(data) {
  if (data.hourly_stats) {
    governanceState.hourlyCount = data.hourly_stats.batch_count || 0;
    governanceState.hourlyLimit = data.hourly_stats.batch_limit || 12;
  }
  
  if (data.daily_stats) {
    governanceState.dailyCount = data.daily_stats.batch_count || 0;
    governanceState.dailyLimit = data.daily_stats.batch_limit || 100;
  }
  
  governanceState.status = data.status || 'locked';
  
  if (data.cooldown_seconds > 0) {
    startCooldown(data.cooldown_seconds);
  }
  
  notifyStateChange();
}

function handleBlockedResponse(data) {
  governanceState.status = data.status || 'locked';
  governanceState.warningMessage = data.message;
  
  if (data.cooldown_seconds > 0) {
    startCooldown(data.cooldown_seconds);
  }
  
  notifyStateChange();
}

function notifyStateChange() {
  if (onStateChange) {
    onStateChange({ ...governanceState });
  }
}

// ============================================
// GETTERS
// ============================================

/**
 * Get current governance state
 */
export function getGovernanceState() {
  return { ...governanceState };
}

/**
 * Get tier display info
 */
export function getTierInfo() {
  const tierNames = {
    'A': { name: 'Premium', color: '#00CED1', description: 'Highest quality ideas' },
    'B': { name: 'Standard', color: '#FFD700', description: 'Standard quality mode' },
    'C': { name: 'Rapid', color: '#FF6B6B', description: 'Fast, quick ideas' }
  };
  
  return tierNames[governanceState.currentTier] || tierNames['A'];
}

/**
 * Get hourly progress (0-1)
 */
export function getHourlyProgress() {
  return governanceState.hourlyCount / governanceState.hourlyLimit;
}

/**
 * Get daily progress (0-1)
 */
export function getDailyProgress() {
  return governanceState.dailyCount / governanceState.dailyLimit;
}

/**
 * Check if at soft warning threshold
 */
export function isAtSoftWarning() {
  return governanceState.status === 'warning' || 
         governanceState.hourlyCount >= (governanceState.hourlyLimit / 2);
}

/**
 * Get ideas remaining today
 */
export function getIdeasRemainingToday() {
  const batchesRemaining = governanceState.dailyLimit - governanceState.dailyCount;
  return Math.max(0, Math.floor(batchesRemaining * 7));
}

// ============================================
// UTILITIES
// ============================================

function getSessionId() {
  let sessionId = sessionStorage.getItem('phazee_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('phazee_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Format seconds into human-readable time
 */
export function formatCooldownTime(seconds) {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ============================================
// EXPORTS
// ============================================

export default {
  initGovernance,
  refreshGovernanceState,
  generateWithGovernance,
  regenerateSingleIdea,
  getBoostBalance,
  redeemBoost,
  isOnCooldown,
  getRemainingCooldown,
  setCooldown,
  getGovernanceState,
  getTierInfo,
  getHourlyProgress,
  getDailyProgress,
  isAtSoftWarning,
  getIdeasRemainingToday,
  formatCooldownTime
};


/**
 * OpenAI Service for Content Idea Generation
 * 
 * SECURITY: API calls are made through Vercel serverless function
 * to keep your OpenAI API key SECRET and never exposed to the browser.
 * 
 * GOVERNANCE: Integrates with generation-governance.js for rate limiting,
 * tiering, cooldowns, and abuse prevention.
 * 
 * Setup Instructions:
 * 1. Get your OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to Vercel as OPENAI_API_KEY (NO VITE_ prefix - server-side only)
 * 3. The api/generate-ideas.js function handles the secure API calls
 */

import { getUser, getSession } from './auth-integration.js';
import * as governance from './generation-governance.js';

// Export governance functions for convenience
export { 
  initGovernance, 
  getGovernanceState, 
  isOnCooldown, 
  getRemainingCooldown,
  getTierInfo,
  getHourlyProgress,
  getDailyProgress,
  isAtSoftWarning,
  getIdeasRemainingToday,
  formatCooldownTime,
  redeemBoost,
  getBoostBalance
} from './generation-governance.js';

/**
 * Generate content ideas with full governance integration
 * @param {Object} userProfile - User's profile data
 * @param {string} customDirection - Optional custom direction from user
 * @param {boolean} isCampaign - Whether to generate campaign ideas
 * @param {string[]} preferredPlatforms - Preferred platforms
 * @param {boolean} useBoost - Whether to use a boost token
 * @returns {Promise<Object>} Result with ideas and governance info
 */
export async function generateContentIdeas(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], useBoost = false) {
  try {
    // Use governance-aware generation
    const result = await governance.generateWithGovernance(
      userProfile, 
      customDirection, 
      isCampaign, 
      preferredPlatforms,
      useBoost
    );
    
    if (!result.success) {
      // Handle governance blocks (cooldown, limits, etc.)
      const error = new Error(result.message || 'Generation blocked');
      error.governance = result.governance;
      error.status = result.error;
      error.cooldownSeconds = result.cooldown_seconds;
      throw error;
    }
    
    // Format the ideas
    return {
      ideas: formatIdeas(result.ideas || []),
      governance: result.governance
    };
    
  } catch (error) {
    // If it's a governance error, re-throw with info
    if (error.governance) {
      throw error;
    }
    
    console.error('API Error:', error);
    throw new Error(`Failed to generate ideas: ${error.message}`);
  }
}

/**
 * Legacy function for backward compatibility
 * Calls generateContentIdeas and returns just the ideas array
 */
export async function generateContentIdeasLegacy(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], count = 7) {
  const result = await generateContentIdeas(userProfile, customDirection, isCampaign, preferredPlatforms);
  return result.ideas;
}

/**
 * Regenerate a single idea (counts as 0.25 toward limits)
 */
export async function regenerateSingleIdea(userProfile, originalIdea, customDirection = '', preferredPlatforms = [], useBoost = false) {
  try {
    const result = await governance.regenerateSingleIdea(
      userProfile,
      originalIdea,
      customDirection,
      preferredPlatforms,
      useBoost
    );
    
    if (!result.success) {
      const error = new Error(result.message || 'Regeneration blocked');
      error.status = result.error;
      error.cooldownSeconds = result.cooldown_seconds;
      throw error;
    }
    
    // Format the single idea
    const formattedIdea = {
      id: generateIdeaId(),
      title: result.idea?.title || 'Untitled Idea',
      summary: result.idea?.summary || '',
      action: result.idea?.action || '',
      setup: result.idea?.setup || '',
      story: result.idea?.story || '',
      hook: result.idea?.hook || '',
      why: result.idea?.why || '',
      platforms: Array.isArray(result.idea?.platforms) ? result.idea.platforms : ['tiktok'],
      createdAt: new Date().toISOString()
    };
    
    return {
      idea: formattedIdea,
      governance: result.governance
    };
    
  } catch (error) {
    console.error('Regenerate Error:', error);
    throw error;
  }
}

/**
 * Format and validate generated ideas
 */
function formatIdeas(ideas) {
  return ideas.map(idea => ({
    id: generateIdeaId(),
    title: idea.title || 'Untitled Idea',
    summary: idea.summary || '',
    action: idea.action || '',
    setup: idea.setup || '',
    story: idea.story || '',
    hook: idea.hook || '',
    why: idea.why || '',
    platforms: Array.isArray(idea.platforms) && idea.platforms.length > 0 ? [idea.platforms[0]] : ['tiktok'],
    createdAt: new Date().toISOString()
  }))
}

/**
 * Generate unique idea ID
 */
function generateIdeaId() {
  return `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate ideas with retry logic (legacy support)
 */
export async function generateIdeasWithRetry(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], maxRetries = 3) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateContentIdeas(userProfile, customDirection, isCampaign, preferredPlatforms)
      return result.ideas
    } catch (error) {
      lastError = error
      
      // Don't retry governance blocks
      if (error.governance || error.status === 'cooldown' || error.status === 'hourly_limit' || error.status === 'daily_limit') {
        throw error
      }
      
      console.warn(`Attempt ${attempt} failed:`, error.message)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  
  throw lastError
}

/**
 * Estimate token usage for a request (approximate)
 */
export function estimateTokens(userProfile, customDirection = '') {
  const baseTokens = 2000
  const directionTokens = customDirection ? Math.ceil(customDirection.length / 4) : 0
  const responseTokens = 3000
  return baseTokens + directionTokens + responseTokens
}

/**
 * Check if API is configured
 */
export async function isConfigured() {
  try {
    const response = await fetch('/api/generate-ideas', {
      method: 'OPTIONS'
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get fallback ideas when API is not available
 */
export function getFallbackIdeas() {
  return [
    {
      id: generateIdeaId(),
      title: "Morning Coffee Ritual",
      summary: "Share your authentic morning coffee routine with a twist.",
      action: "Show the entire process from grinding beans to first sip, with a surprising element.",
      setup: "Natural window light, kitchen counter, overhead and close-up shots.",
      story: "Start with the sound of grinding, build anticipation, reveal your unique preparation method.",
      hook: "This is my favorite part of the morning...",
      why: "Morning routines are relatable and coffee content performs consistently well.",
      platforms: ["tiktok"],
      createdAt: new Date().toISOString()
    },
    {
      id: generateIdeaId(),
      title: "Behind the Scenes Chaos",
      summary: "Show the messy reality behind your polished content.",
      action: "Split screen: perfect shot vs. the chaos happening off-camera.",
      setup: "Two camera angles, one for 'perfect' shot, one showing the reality.",
      story: "Build up the 'perfect' moment, then reveal all the attempts and mess behind it.",
      hook: "Everyone thinks I have it together, but here's what you don't see...",
      why: "Authenticity and vulnerability create strong audience connection.",
      platforms: ["youtube"],
      createdAt: new Date().toISOString()
    },
    {
      id: generateIdeaId(),
      title: "60-Second Transformation",
      summary: "Time-lapse of a complete transformation or creation process.",
      action: "Condense hours of work into a satisfying 60-second journey.",
      setup: "Tripod-mounted camera, consistent lighting, time-lapse mode.",
      story: "Start with the 'before', show key moments of the process, dramatic reveal.",
      hook: "Watch what happens when I spend 3 hours on this...",
      why: "Transformation content is highly engaging and shareable.",
      platforms: ["youtube"],
      createdAt: new Date().toISOString()
    },
    {
      id: generateIdeaId(),
      title: "Audience Q&A Deep Dive",
      summary: "Answer your most asked question with unexpected depth.",
      action: "Take a common question and give a comprehensive, story-driven answer.",
      setup: "Direct to camera, good lighting, quiet space for clear audio.",
      story: "Start with the question, share personal experience, give actionable advice.",
      hook: "You keep asking me this, so here's the real answer...",
      why: "Directly addressing audience questions builds community and trust.",
      platforms: ["youtube"],
      createdAt: new Date().toISOString()
    },
    {
      id: generateIdeaId(),
      title: "Day in the Life Highlight",
      summary: "Show the most interesting parts of your day in a dynamic montage.",
      action: "Capture 10-15 moments throughout your day, edit into a fast-paced story.",
      setup: "Handheld or gimbal, natural lighting, various locations.",
      story: "Morning to night journey, showing the variety and energy of your life.",
      hook: "Come spend a day with me...",
      why: "DITL content is consistently popular and helps audience feel connected.",
      platforms: ["youtube"],
      createdAt: new Date().toISOString()
    },
    {
      id: generateIdeaId(),
      title: "Myth Busting Moment",
      summary: "Debunk a common misconception in your niche.",
      action: "Present the myth, show why it's wrong, provide the truth with evidence.",
      setup: "Clean background, good lighting, props or graphics to illustrate points.",
      story: "Hook with the myth, build tension, reveal the truth, explain the impact.",
      hook: "Everyone believes this, but it's completely wrong...",
      why: "Educational content that challenges assumptions drives engagement and shares.",
      platforms: ["youtube"],
      createdAt: new Date().toISOString()
    },
    {
      id: generateIdeaId(),
      title: "Unexpected Collaboration",
      summary: "Partner with someone unexpected for a unique perspective.",
      action: "Create content with someone from a different niche or background.",
      setup: "Two-person setup, ensure both are well-lit and framed.",
      story: "Introduce the collaboration, explore the unexpected connection, create something together.",
      hook: "You'd never expect us to work together, but watch this...",
      why: "Collaborations expand reach and create fresh, interesting content.",
      platforms: ["youtube"],
      createdAt: new Date().toISOString()
    }
  ]
}

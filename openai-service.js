/**
 * OpenAI Service for Content Idea Generation
 * 
 * SECURITY: API calls are made through Vercel serverless function
 * to keep your OpenAI API key SECRET and never exposed to the browser.
 * 
 * Setup Instructions:
 * 1. Get your OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to Vercel as OPENAI_API_KEY (NO VITE_ prefix - server-side only)
 * 3. The api/generate-ideas.js function handles the secure API calls
 */

// Call our secure serverless function instead of OpenAI directly
async function callOpenAI(userProfile, customDirection, isCampaign, preferredPlatforms, count) {
  console.log('🔒 Calling secure serverless function for AI generation...')
  
  const response = await fetch('/api/generate-ideas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userProfile,
      customDirection,
      isCampaign,
      preferredPlatforms,
      count
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    console.error('❌ API error:', errorData)
    throw new Error(errorData.error || 'API request failed')
  }
  
  return response.json()
}

/**
 * Generate content ideas based on user profile
 * @param {Object} userProfile - User's profile data
 * @param {string} userProfile.contentType - Type of content creator
 * @param {string} userProfile.targetAudience - Target audience description
 * @param {Array<string>} userProfile.platforms - Selected platforms
 * @param {Array<string>} userProfile.cultureValues - Selected culture values
 * @param {string} customDirection - Optional custom direction from user
 * @param {boolean} isCampaign - Whether to generate campaign ideas
 * @returns {Promise<Array>} Array of 7 generated ideas
 */
export async function generateContentIdeas(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], count = 7) {
  try {
    // Call our secure serverless function
    const response = await callOpenAI(userProfile, customDirection, isCampaign, preferredPlatforms, count)
    
    // Response is already parsed and formatted by the serverless function
    return formatIdeas(response.ideas || [])
    
  } catch (error) {
    console.error('API Error:', error)
    throw new Error(`Failed to generate ideas: ${error.message}`)
  }
}

// buildPrompt moved to serverless function (api/generate-ideas.js)

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
 * Generate ideas with retry logic
 */
export async function generateIdeasWithRetry(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], maxRetries = 3) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateContentIdeas(userProfile, customDirection, isCampaign, preferredPlatforms)
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempt} failed:`, error.message)
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
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
  // Rough estimate based on typical prompt size
  const baseTokens = 2000 // Base prompt
  const directionTokens = customDirection ? Math.ceil(customDirection.length / 4) : 0
  const responseTokens = 3000 // Expected response
  return baseTokens + directionTokens + responseTokens
}

/**
 * Check if API is configured
 * In production, this checks if the serverless function is available
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


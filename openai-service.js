/**
 * OpenAI Service for Content Idea Generation
 * 
 * Setup Instructions:
 * 1. Get your OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to your .env.local file as VITE_OPENAI_API_KEY
 * 3. Import and use generateContentIdeas() function
 */

// OpenAI API key - from environment variable (set in .env.local)
// TODO: For production, move to Supabase Edge Functions for security
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

// Call OpenAI API directly (no SDK needed for browser)
async function callOpenAI(messages, temperature = 0.9) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === '') {
    throw new Error('OpenAI API key is not configured')
  }
  
  console.log('🔑 Using OpenAI API key:', OPENAI_API_KEY.substring(0, 20) + '...')
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: temperature,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    console.error('❌ OpenAI API error:', errorData)
    throw new Error(errorData.error?.message || 'OpenAI API request failed')
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
export async function generateContentIdeas(userProfile, customDirection = '', isCampaign = false) {
  try {
    const prompt = buildPrompt(userProfile, customDirection, isCampaign)
    
    const response = await callOpenAI([
      {
        role: 'system',
        content: `You are an elite content strategist and creative director with encyclopedic knowledge of:
- Current social media trends across ALL platforms (TikTok, Instagram, YouTube, Twitter, etc.)
- Viral mechanics, algorithm behaviors, and platform-specific best practices
- Pop culture, memes, challenges, and trending audio/formats
- Audience psychology, behavioral triggers, and emotional resonance
- Content innovation and pushing creative boundaries

**Core Philosophy:**
- ORIGINALITY ABOVE ALL - Never suggest generic or overused concepts
- PLATFORM MASTERY - Understand what works NOW on each platform
- TREND AWARENESS - Know what's trending and how to twist it uniquely
- BOLD CREATIVITY - Push boundaries while staying authentic
- GREEN MINDSET - Subtly promote sustainability and consciousness when relevant
- INFINITE VARIETY - With billions of possible ideas, repetition is unacceptable

**Your Mission:**
Generate ideas that make creators say "Why didn't I think of that?" 
Ideas that stop scrolls, spark conversations, and feel fresh.
Ideas that could only work in 2025, not 2020.
Ideas that respect the creator's voice while pushing them to innovate.`
      },
      {
        role: 'user',
        content: prompt
      }
    ], 1.1)

    const content = response.choices[0].message.content
    const parsed = JSON.parse(content)
    
    // Validate and format the response
    return formatIdeas(parsed.ideas || [])
    
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error(`Failed to generate ideas: ${error.message}`)
  }
}

/**
 * Build the prompt for OpenAI
 */
function buildPrompt(userProfile, customDirection, isCampaign) {
  const timestamp = Date.now()
  const platformList = userProfile.platforms?.join(', ') || 'TikTok, Instagram, YouTube'
  
  const basePrompt = `You are an elite content strategist with deep knowledge of social media trends, viral mechanics, and platform-specific algorithms. Generate 7 COMPLETELY UNIQUE, never-before-seen content ideas for ${userProfile.brandName || 'a'} ${userProfile.contentType || 'creator'}.

**CRITICAL UNIQUENESS RULES:**
- PENALTY: -100 points for any idea that resembles common content formats
- PENALTY: -100 points for generic concepts (morning routines, day-in-the-life, etc.)
- PENALTY: -100 points for repeating similar themes across the 7 ideas
- REWARD: +50 points for original twists on known media/trends
- REWARD: +50 points for platform-specific innovations
- REWARD: +50 points for ideas that haven't been done before

**Creator Profile:**
- Brand: ${userProfile.brandName || 'Personal Brand'}
- Role: ${userProfile.contentType || 'Creator'}
- Industry: ${userProfile.industry || 'General'}
- Target Audience: ${userProfile.targetAudience || 'Gen Z and Millennials'}
- Platforms: ${platformList}
- Culture Values: ${userProfile.cultureValues?.join(', ') || 'Authentic, Creative, Bold'}
- Content Goals: ${userProfile.contentGoals || 'Engage and inspire'}
- Production Level: ${userProfile.productionLevel || 'Intermediate'}
${customDirection ? `\n**Custom Direction:** ${customDirection}\n` : ''}

**Platform Intelligence Required:**
- Research CURRENT trends on ${platformList} (as of ${new Date().toLocaleDateString()})
- Understand platform-specific algorithms and what's performing NOW
- Know viral challenges, sounds, and formats trending THIS WEEK
- Identify gaps in content that audiences are craving
- Leverage platform features (Reels, Shorts, Stories, etc.)

**Innovation Requirements:**
1. **ORIGINALITY IS MANDATORY** - Each idea must be something audiences haven't seen
2. **Platform-Specific** - Optimize for the exact mechanics of each platform
3. **Trend-Aware** - Reference or twist current trends, challenges, or viral moments
4. **Edgy & Bold** - Push boundaries while staying authentic to brand values
5. **Unexpected Angles** - Approach familiar topics from completely new perspectives
6. **Cultural Relevance** - Tap into current events, memes, or cultural moments
7. **Emotional Impact** - Create genuine connection, not just views

**Tone & Style:**
- Match the brand's culture values: ${userProfile.cultureValues?.join(', ') || 'Authentic, Creative'}
- Can be: Fun, Edgy, Provocative, Thoughtful, Absurd, Experimental, or Dull (if requested)
- Always: Original, Unexpected, Scroll-Stopping

**Content Variety Required:**
- Mix formats: Storytelling, Tutorial, Challenge, Behind-Scenes, Experimental, Comedic, Educational
- Mix lengths: Quick hits (15s), Mid-form (60s), Long-form (3min+)
- Mix energy: High-energy, Calm, Chaotic, Intimate, Epic
- NO TWO IDEAS should feel similar in execution or concept

${isCampaign ? `\n**Campaign Mode:** Create 7 connected ideas that build a narrative arc while each standing alone as unique content.\n` : ''}

**For EACH of the 7 ideas, provide:**
- **title**: Provocative, memorable, under 10 words (NOT generic)
- **summary**: The core concept in 1-2 sentences - make it sound exciting
- **action**: Detailed description of what happens (be specific and visual)
- **setup**: Technical execution (camera angles, lighting, props, location, editing style)
- **story**: The narrative structure (beginning hook, middle tension, end payoff)
- **hook**: The exact opening 3 seconds that stops the scroll (be VERY specific)
- **why**: Deep psychological reason this resonates with the target audience
- **platforms**: Array of 1-3 platforms this is optimized for (from: ${platformList})

**Output Format (STRICT JSON):**
{
  "ideas": [
    {
      "title": "string",
      "summary": "string",
      "action": "string",
      "setup": "string",
      "story": "string",
      "hook": "string",
      "why": "string",
      "platforms": ["platform1", "platform2"]
    }
  ]
}

**FINAL MANDATE:** 
Every idea must pass this test: "Has anyone done this exact thing before?" 
If the answer is YES, regenerate that idea.
If the answer is MAYBE, add a twist that makes it undeniably unique.
Only output ideas where the answer is NO.

Generate Session ID: ${timestamp}
Begin generation now.`

  return basePrompt
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
    platforms: Array.isArray(idea.platforms) ? idea.platforms : ['tiktok', 'instagram'],
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
export async function generateIdeasWithRetry(userProfile, customDirection = '', isCampaign = false, maxRetries = 3) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateContentIdeas(userProfile, customDirection, isCampaign)
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
 * Estimate token usage for a request
 */
export function estimateTokens(userProfile, customDirection = '') {
  const promptLength = buildPrompt(userProfile, customDirection, false).length
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(promptLength / 4) + 3000 // Add expected response tokens
}

/**
 * Check if API key is configured
 */
export function isConfigured() {
  const apiKey = process.env.VITE_OPENAI_API_KEY
  return apiKey && apiKey !== 'YOUR_OPENAI_API_KEY' && apiKey.startsWith('sk-')
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
      platforms: ["instagram", "tiktok"],
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
      platforms: ["instagram", "tiktok", "youtube"],
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
      platforms: ["tiktok", "instagram", "youtube"],
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
      platforms: ["youtube", "instagram", "tiktok"],
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
      platforms: ["instagram", "tiktok", "youtube"],
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
      platforms: ["tiktok", "instagram", "youtube"],
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
      platforms: ["instagram", "tiktok", "youtube"],
      createdAt: new Date().toISOString()
    }
  ]
}


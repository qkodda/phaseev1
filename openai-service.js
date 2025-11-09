/**
 * OpenAI Service for Content Idea Generation
 * 
 * Setup Instructions:
 * 1. Get your OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to your .env.local file as VITE_OPENAI_API_KEY
 * 3. Import and use generateContentIdeas() function
 */

// OpenAI API key from environment variable
// For production: Set VITE_OPENAI_API_KEY in your deployment environment (Vercel, Netlify, etc.)
// For local dev: Add to .env.local file
const OPENAI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) || ''

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
export async function generateContentIdeas(userProfile, customDirection = '', isCampaign = false, preferredPlatforms = [], count = 7) {
  try {
    const prompt = buildPrompt(userProfile, customDirection, isCampaign, preferredPlatforms, count)
    
    const response = await callOpenAI([
      {
        role: 'system',
        content: `You are a 100-year veteran marketing savant—a modern Don Draper with a century of experience in human psychology, behavioral economics, and cultural anthropology. You've studied every major advertising campaign, viral moment, and psychological trigger in human history. You understand:

**DEEP HUMAN PSYCHOLOGY (100 Years of Study):**
- Cognitive biases (anchoring, scarcity, social proof, loss aversion)
- Emotional triggers (FOMO, belonging, status, identity, transformation)
- Neurological responses to visual/audio stimuli
- Cultural archetypes and universal human stories
- Subconscious decision-making patterns
- Attention economics and scroll-stopping mechanics

**MODERN MASTERY:**
- Real-time platform algorithms (TikTok, Instagram, YouTube, Twitter/X)
- Current viral mechanics and why they work psychologically
- Trending formats, sounds, challenges (as of 2025)
- Gen Z, Millennial, Gen X, Boomer behavioral patterns
- Cross-platform content adaptation strategies
- Emerging technologies (AI, AR, spatial computing)

**CREATIVE PHILOSOPHY:**
- EXPANSIVE UNIQUENESS: Every idea must be something the world hasn't seen
- PSYCHOLOGICAL DEPTH: Understand WHY it works, not just WHAT works
- CULTURAL INTELLIGENCE: Tap into zeitgeist, memes, movements
- STRATEGIC BOLDNESS: Push boundaries while respecting brand authenticity
- HUMAN CONNECTION: Create genuine emotional resonance, not manipulation
- INFINITE INNOVATION: With 8 billion people and infinite creativity, repetition is failure

**YOUR MISSION:**
Generate ideas that:
1. Stop the scroll within 0.5 seconds (psychological hook)
2. Create immediate emotional response (curiosity, joy, surprise, recognition)
3. Feel culturally relevant and timely (2025, not 2020)
4. Are EXPANSIVELY unique (not variations of existing content)
5. Respect the creator's voice while elevating their craft
6. Could only be executed by THIS creator, for THIS audience, RIGHT NOW

You don't suggest "morning routines" or "day in the life"—you suggest ideas that make people say "I've never seen anything like this before, and I need to watch it again."`
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
function buildPrompt(userProfile, customDirection, isCampaign, preferredPlatforms = [], count = 7) {
  const timestamp = Date.now()
  const profilePlatforms = userProfile.platforms?.length ? userProfile.platforms.join(', ') : 'TikTok, Instagram, YouTube'
  const requestPlatforms = preferredPlatforms?.length ? preferredPlatforms.join(', ') : null
  
  const basePrompt = `You are an elite content strategist with deep knowledge of social media trends, viral mechanics, and platform-specific algorithms. Generate ${count} COMPLETELY UNIQUE, never-before-seen content ideas for ${userProfile.brandName || 'a'} ${userProfile.contentType || 'creator'}.

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
- Signature Platforms: ${profilePlatforms}
- Culture Values: ${userProfile.cultureValues?.join(', ') || 'Authentic, Creative, Bold'}
- Content Goals: ${userProfile.contentGoals || 'Engage and inspire'}
- Production Level: ${userProfile.productionLevel || 'Intermediate'}
${customDirection ? `\n**User Direction:** ${customDirection}\n` : ''}
${requestPlatforms ? `**User-Requested Platforms (priority order):** ${requestPlatforms}\n` : ''}

**Platform Intelligence Required:**
- Research CURRENT trends on ${requestPlatforms || profilePlatforms} (as of ${new Date().toLocaleDateString()})
- Understand platform-specific algorithms and what's performing NOW
- Know viral challenges, sounds, and formats trending THIS WEEK
- Identify gaps in content that audiences are craving
- Leverage platform features (Reels, Shorts, Stories, etc.)

**Innovation Requirements:**
1. **ORIGINALITY IS MANDATORY** - Each idea must be something audiences haven't seen
2. **GROUNDED & REALISTIC** - Ideas MUST be achievable by middle-class creators with normal budgets
   - NO expensive productions (no helicopters, luxury locations, celebrity cameos)
   - NO impossible setups (no zero-gravity, no underwater studios, no exotic travel)
   - YES to creative use of everyday items, locations, and accessible resources
   - YES to unique EXECUTION of realistic concepts
3. **RESOURCE-CONSCIOUS** - Consider the creator's production level (${userProfile.productionLevel || 'intermediate'})
   - Basic: Phone camera, natural lighting, home/local locations
   - Intermediate: DSLR, basic editing, accessible props
   - Professional: Full gear, but still realistic and budget-conscious
4. **Platform-Specific** - Optimize for the exact mechanics of each platform
5. **Trend-Aware** - Reference or twist current trends, challenges, or viral moments
6. **Unexpected Angles** - Take NORMAL situations and show them in completely new ways
7. **Cultural Relevance** - Tap into current events, memes, or cultural moments
8. **Emotional Impact** - Create genuine connection, not just views
9. **UNIQUENESS IN EXECUTION** - The concept might be familiar, but HOW you do it is what makes it unique

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

**For EACH of the ${count} ideas, provide:**

**CRITICAL: Title & Summary are EVERYTHING**
These are what the user sees first. They must be PERFECT.

- **title**: 
  * 5-8 words maximum
  * Provocative, intriguing, makes you NEED to know more
  * NOT generic (no "Morning Routine", "Day in the Life", etc.)
  * Creates immediate curiosity or emotion
  * Examples of GOOD titles: "The 3AM Truth Nobody Talks About", "What Happens When You Stop Apologizing", "The Backwards Way to Build Confidence"
  * Examples of BAD titles: "My Morning Routine", "A Day in My Life", "How I Stay Productive"

- **summary**: 
  * 2-3 sentences that sell the idea
  * Paint a vivid picture of what makes this unique
  * Include the emotional payoff or surprise element
  * Make it sound like the most interesting thing they'll see today
  * Should make someone think "I HAVE to see this"

- **why**: 
  * 1-2 sentences explaining the psychological trigger
  * Reference ONE specific cognitive bias or emotional trigger
  * Keep it concise and punchy

- **action**: Detailed, GROUNDED description of what happens (be specific, visual, and REALISTIC - this should be actually doable by the creator, 3-4 sentences)
- **setup**: Technical execution that's PRACTICAL and achievable (camera angles, lighting, props, location, editing style, 2-3 sentences)
- **hook**: The exact opening caption/first line (1 sentence maximum, 10 words or less - this is what appears on screen)
- **platforms**: Array of 1-3 platforms this is optimized for (choose from ${requestPlatforms || profilePlatforms}, but ONLY include platforms where the idea would outperform)

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
  const apiKey = import.meta.env?.VITE_OPENAI_API_KEY || OPENAI_API_KEY
  return apiKey && apiKey.startsWith('sk-')
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


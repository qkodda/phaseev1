/**
 * OpenAI Service for Content Idea Generation
 * 
 * Setup Instructions:
 * 1. Get your OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to your .env.local file as VITE_OPENAI_API_KEY
 * 3. Import and use generateContentIdeas() function
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
})

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
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert content strategist and creative director specializing in experiential storytelling for social media. You understand platform-specific best practices, audience psychology, and viral content mechanics. Your ideas are actionable, specific, and designed to create authentic connections.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })

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
  const basePrompt = `Generate 7 unique, highly engaging content ideas for a ${userProfile.contentType} creator.

**Profile:**
- Target Audience: ${userProfile.targetAudience}
- Platforms: ${userProfile.platforms?.join(', ') || 'All platforms'}
- Culture Values: ${userProfile.cultureValues?.join(', ') || 'Authenticity, Creativity'}
${customDirection ? `- Custom Direction: ${customDirection}` : ''}
${isCampaign ? '- Format: Campaign series (7 connected ideas that tell a story)' : ''}

**Requirements:**
1. Each idea must be platform-optimized and actionable
2. Ideas should align with the culture values
3. Focus on experiential storytelling that creates emotional connection
4. Include specific hooks that stop the scroll
5. Provide clear technical direction for filming/setup
${isCampaign ? '6. Ideas should connect to form a cohesive campaign narrative' : ''}

**For each idea, provide:**
- **title**: Catchy, under 10 words (e.g., "Morning Coffee Ritual Reveal")
- **summary**: 1-2 sentences explaining the concept
- **action**: What happens in the content (the story/action)
- **setup**: Technical details (camera angle, lighting, location)
- **story**: The narrative arc (beginning, middle, end)
- **hook**: The opening line/visual that stops the scroll
- **why**: Why this resonates with the target audience
- **platforms**: Array of best platforms for this idea

**Output Format:**
Return a JSON object with this exact structure:
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

Generate ideas that feel fresh, authentic, and immediately actionable.`

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


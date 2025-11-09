// Vercel Serverless Function - Generate Content Ideas
// This keeps your OpenAI API key SECRET and secure

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { userProfile, customDirection, isCampaign, preferredPlatforms, count } = body;

    // Get API key from environment (server-side only - NOT exposed to browser)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt
    const prompt = buildPrompt(userProfile, customDirection, isCampaign, preferredPlatforms, count || 7);

    // Call OpenAI API (server-side)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // gpt-4o-mini keeps costs low + responds faster while maintaining strong quality
        model: 'gpt-4o-mini',
        messages: [
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
        ],
        temperature: 0.85,
        max_tokens: 1800,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'OpenAI API request failed' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to build the prompt
function buildPrompt(userProfile, customDirection, isCampaign, preferredPlatforms, count) {
  const platforms = preferredPlatforms?.length > 0 ? preferredPlatforms : (userProfile.platforms || ['tiktok', 'instagram']);
  
  let prompt = `Generate ${count} unique content ideas for a ${userProfile.contentType || 'content creator'}.

**Creator Profile:**
- Target Audience: ${userProfile.targetAudience || 'General audience'}
- Platforms: ${platforms.join(', ')}
- Culture Values: ${(userProfile.cultureValues || []).join(', ')}
- Content Style: ${userProfile.tone || 'Engaging and authentic'}`;

  if (customDirection) {
    prompt += `\n\n**CUSTOM DIRECTION (High Priority):**
${customDirection}

Make sure the ideas align with this specific direction while still being psychologically engaging and platform-optimized.`;
  }

  if (isCampaign) {
    prompt += `\n\n**CAMPAIGN MODE:** Generate ideas that work together as a cohesive campaign with a common theme, narrative arc, or strategic objective.`;
  }

  prompt += `\n\n**OUTPUT FORMAT (JSON):**
Return a JSON object with an "ideas" array containing ${count} objects. Each object must have:
{
  "ideas": [
    {
      "title": "Compelling 5-8 word title",
      "summary": "One punchy sentence explaining the core concept",
      "action": "What specifically happens in this content (the actual content/story)",
      "setup": "Technical filming/production details and setup requirements",
      "story": "The narrative arc or emotional journey",
      "hook": "The exact opening line or first 3 seconds that stops the scroll",
      "why": "Deep psychological explanation of why this works",
      "platforms": ["primary", "secondary"] // from: tiktok, instagram, youtube, twitter, linkedin
    }
  ]
}

**CRITICAL REQUIREMENTS:**
1. Each idea must be EXPANSIVELY unique - not variations of common content
2. Ideas should feel like 2025, not recycled 2020 concepts
3. Focus on psychological triggers that stop the scroll
4. Respect the creator's authentic voice and values
5. Be specific enough to execute immediately
6. Consider current cultural moments and trends`;

  return prompt;
}


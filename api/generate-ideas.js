// Vercel Serverless Function - Generate Content Ideas
// Complete Generation Governance System
// Rate limiting, tiering, cooldowns, abuse prevention

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Initialize Supabase client with service role for RPC calls
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  // Use service key if available, otherwise anon key
  const key = supabaseServiceKey || supabaseAnonKey;
  
  if (!supabaseUrl || !key) {
    return null;
  }
  
  return createClient(supabaseUrl, key);
}

// Get client IP address
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '0.0.0.0';
}

// Get user from authorization header
async function getUserFromRequest(request, supabase) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getSupabaseClient();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  try {
    const body = await request.json();
    const { 
      userProfile, 
      customDirection, 
      isCampaign, 
      preferredPlatforms, 
      count,
      sessionId,
      useBoost 
    } = body;

    // Get OpenAI API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user from request
    const user = await getUserFromRequest(request, supabase);
    const userId = user?.id || body.userId; // Allow userId in body for dev bypass
    
    // If no Supabase or no user, fall back to basic rate limiting
    let limitsCheck = null;
    let tier = 'A';
    let model = 'gpt-4o-mini';
    let boostApplied = false;
    let governanceEnabled = false;
    
    if (supabase && userId) {
      governanceEnabled = true;
      
      // Check generation limits via RPC
      const { data: limits, error: limitsError } = await supabase.rpc('check_generation_limits', {
        p_user_id: userId,
        p_ip_address: clientIP,
        p_session_id: sessionId || null
      });
      
      if (limitsError) {
        console.error('Limits check error:', limitsError);
        // Continue without governance if RPC fails
        governanceEnabled = false;
      } else {
        limitsCheck = limits;
        
        // Check if user can generate
        if (!limits.can_generate) {
          // Return appropriate error based on status
          const statusMessages = {
            'banned': { 
              code: 403, 
              userMessage: 'Temporarily blocked due to unusual activity. Please try again later.' 
            },
            'hourly_limit': { 
              code: 429, 
              userMessage: 'Woah woah, slow your roll! You\'ve hit your hourly limit.' 
            },
            'daily_limit': { 
              code: 429, 
              userMessage: 'You\'ve generated a lot today! Come back tomorrow for fresh ideas.' 
            },
            'cooldown': { 
              code: 429, 
              userMessage: 'Woah woah, slow your roll!' 
            }
          };
          
          const statusInfo = statusMessages[limits.status] || { code: 429, userMessage: limits.message };
          
          return new Response(JSON.stringify({
            error: 'generation_blocked',
            status: limits.status,
            message: statusInfo.userMessage,
            cooldown_seconds: limits.cooldown_seconds || 0,
            next_available: limits.next_available,
            hourly_stats: limits.hourly_stats,
            daily_stats: limits.daily_stats
          }), {
            status: statusInfo.code,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Check abuse pattern
        const { data: abuseCheck } = await supabase.rpc('check_abuse_pattern', {
          p_user_id: userId,
          p_ip_address: clientIP
        });
        
        if (abuseCheck?.is_abusive) {
          // Flag the abuse
          await supabase.rpc('flag_abuse', {
            p_user_id: userId,
            p_ip_address: clientIP,
            p_reason: 'Sustained rapid requests detected',
            p_ban_minutes: abuseCheck.ban_minutes,
            p_request_pattern: { request_count: abuseCheck.request_count }
          });
          
          return new Response(JSON.stringify({
            error: 'abuse_detected',
            status: 'banned',
            message: 'Unusual activity detected. Please try again in a few minutes.',
            cooldown_seconds: abuseCheck.ban_minutes * 60
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Get tier and model from limits check
        tier = limits.tier || 'A';
        model = limits.model || 'gpt-4o-mini';
        
        // Handle boost if requested
        if (useBoost && tier !== 'A') {
          const { data: boostResult } = await supabase.rpc('redeem_boost', {
            p_user_id: userId
          });
          
          if (boostResult?.success) {
            boostApplied = true;
            tier = 'A';
            model = 'gpt-4o'; // Tier A model
          }
        }
      }
    }

    // Build the prompt
    const prompt = buildPrompt(userProfile, customDirection, isCampaign, preferredPlatforms, count || 7);

    // Get system prompt based on tier
    const systemPrompt = getSystemPrompt(tier);

    // Call OpenAI API with the appropriate model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: tier === 'A' ? 0.9 : tier === 'B' ? 0.85 : 0.75,
        max_tokens: tier === 'A' ? 2500 : tier === 'B' ? 2000 : 1500,
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

    // Log the generation if governance is enabled
    if (governanceEnabled && supabase && userId) {
      await supabase.rpc('log_generation', {
        p_user_id: userId,
        p_batch_weight: 1.0,
        p_tier: tier,
        p_ideas_count: (parsed.ideas || []).length,
        p_ip_address: clientIP,
        p_session_id: sessionId || null,
        p_user_agent: userAgent,
        p_boost_applied: boostApplied,
        p_direction: customDirection || null,
        p_is_campaign: isCampaign || false
      });
      
      // Get updated stats after logging
      const { data: updatedHourly } = await supabase.rpc('get_rolling_hour_stats', { p_user_id: userId });
      const { data: updatedDaily } = await supabase.rpc('get_daily_stats', { p_user_id: userId });
      const { data: boostBalance } = await supabase.rpc('get_boost_balance', { p_user_id: userId });
      
      // Build comprehensive response
      return new Response(JSON.stringify({
        ...parsed,
        governance: {
          status: limitsCheck?.status === 'warning' ? 'warning' : 'ok',
          tier: tier,
          model_used: model,
          applied_boost: boostApplied,
          remaining_boosts: boostBalance?.balance || 0,
          active_boost_batches: boostBalance?.active_boost_batches || 0,
          hourly_count: updatedHourly?.batch_count || 0,
          hourly_limit: updatedHourly?.batch_limit || 12,
          daily_count: updatedDaily?.batch_count || 0,
          daily_limit: updatedDaily?.batch_limit || 100,
          ideas_today: Math.round((updatedDaily?.batch_count || 0) * 7),
          cooldown_seconds: limitsCheck?.cooldown_after_generation || 0,
          next_reset_timestamp: updatedDaily?.next_reset_timestamp,
          soft_warning: updatedHourly?.is_soft_warning || false,
          warning_message: limitsCheck?.message
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic response without governance
    return new Response(JSON.stringify({
      ...parsed,
      governance: {
        status: 'ok',
        tier: 'A',
        model_used: model,
        applied_boost: false,
        remaining_boosts: 0,
        hourly_count: 0,
        hourly_limit: 12,
        daily_count: 0,
        daily_limit: 100,
        cooldown_seconds: 0
      }
    }), {
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

// Get system prompt based on tier
function getSystemPrompt(tier) {
  const basePrompt = `You are a 100-year veteran marketing savant—a modern Don Draper with a century of experience in human psychology, behavioral economics, and cultural anthropology. You've studied every major advertising campaign, viral moment, and psychological trigger in human history.`;
  
  const tierPrompts = {
    'A': `${basePrompt}

**TIER A - PREMIUM QUALITY MODE**

You understand:
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

Generate ideas that:
1. Stop the scroll within 0.5 seconds (psychological hook)
2. Create immediate emotional response (curiosity, joy, surprise, recognition)
3. Feel culturally relevant and timely (2025, not 2020)
4. Are EXPANSIVELY unique (not variations of existing content)
5. Respect the creator's voice while elevating their craft
6. Could only be executed by THIS creator, for THIS audience, RIGHT NOW`,

    'B': `${basePrompt}

**TIER B - STANDARD QUALITY MODE**

Focus on delivering solid, actionable content ideas with:
- Clear psychological hooks
- Platform-optimized formats
- Practical execution details
- Cultural relevance
- Strong engagement potential

Generate ideas that are creative, well-structured, and immediately executable.`,

    'C': `${basePrompt}

**TIER C - RAPID MODE**

Deliver quick, actionable content ideas. Focus on:
- Clear concepts
- Easy execution
- Trending formats
- Fast turnaround

Keep ideas concise but creative.`
  };
  
  return tierPrompts[tier] || tierPrompts['B'];
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

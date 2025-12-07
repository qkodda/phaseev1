// Vercel Serverless Function - Regenerate Single Idea
// Counts as 0.25 batch weight toward limits

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
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
      originalIdea, // The idea being regenerated
      preferredPlatforms,
      sessionId,
      useBoost
    } = body;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await getUserFromRequest(request, supabase);
    const userId = user?.id || body.userId;
    
    let tier = 'A';
    let model = 'gpt-4o-mini';
    let boostApplied = false;
    let governanceEnabled = false;
    
    if (supabase && userId) {
      governanceEnabled = true;
      
      // Check limits (same as full generation)
      const { data: limits, error: limitsError } = await supabase.rpc('check_generation_limits', {
        p_user_id: userId,
        p_ip_address: clientIP,
        p_session_id: sessionId || null
      });
      
      if (!limitsError && limits) {
        if (!limits.can_generate) {
          const statusMessages = {
            'banned': { code: 403, userMessage: 'Temporarily blocked due to unusual activity.' },
            'hourly_limit': { code: 429, userMessage: 'Woah woah, slow your roll! Hourly limit reached.' },
            'daily_limit': { code: 429, userMessage: 'Come back tomorrow for fresh ideas!' },
            'cooldown': { code: 429, userMessage: 'Woah woah, slow your roll!' }
          };
          
          const statusInfo = statusMessages[limits.status] || { code: 429, userMessage: limits.message };
          
          return new Response(JSON.stringify({
            error: 'generation_blocked',
            status: limits.status,
            message: statusInfo.userMessage,
            cooldown_seconds: limits.cooldown_seconds || 0
          }), {
            status: statusInfo.code,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        tier = limits.tier || 'A';
        model = limits.model || 'gpt-4o-mini';
        
        // Handle boost
        if (useBoost && tier !== 'A') {
          const { data: boostResult } = await supabase.rpc('redeem_boost', { p_user_id: userId });
          if (boostResult?.success) {
            boostApplied = true;
            tier = 'A';
            model = 'gpt-4o';
          }
        }
      }
    }

    // Build regeneration prompt
    const prompt = buildRegenerationPrompt(userProfile, originalIdea, customDirection, preferredPlatforms);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: getSystemPrompt(tier) },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9, // Higher for more variation
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'OpenAI API request failed' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Log with 0.25 batch weight
    if (governanceEnabled && supabase && userId) {
      await supabase.rpc('log_generation', {
        p_user_id: userId,
        p_batch_weight: 0.25, // Single idea = 0.25 of a batch
        p_tier: tier,
        p_ideas_count: 1,
        p_ip_address: clientIP,
        p_session_id: sessionId || null,
        p_user_agent: userAgent,
        p_boost_applied: boostApplied,
        p_direction: customDirection || null,
        p_is_campaign: false
      });
      
      const { data: updatedHourly } = await supabase.rpc('get_rolling_hour_stats', { p_user_id: userId });
      const { data: updatedDaily } = await supabase.rpc('get_daily_stats', { p_user_id: userId });
      
      return new Response(JSON.stringify({
        idea: parsed.idea || parsed,
        governance: {
          status: 'ok',
          tier: tier,
          batch_weight: 0.25,
          applied_boost: boostApplied,
          hourly_count: updatedHourly?.batch_count || 0,
          daily_count: updatedDaily?.batch_count || 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      idea: parsed.idea || parsed,
      governance: {
        status: 'ok',
        tier: 'A',
        batch_weight: 0.25
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regenerate-one function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function getSystemPrompt(tier) {
  return `You are a creative content strategist. Generate a single, unique content idea that is different from the original but maintains the same quality and relevance.

${tier === 'A' ? 'Focus on maximum creativity, psychological depth, and viral potential.' : 
  tier === 'B' ? 'Focus on solid, actionable ideas with good engagement potential.' :
  'Focus on quick, practical ideas that are easy to execute.'}`;
}

function buildRegenerationPrompt(userProfile, originalIdea, customDirection, preferredPlatforms) {
  const platforms = preferredPlatforms?.length > 0 ? preferredPlatforms : (userProfile?.platforms || ['tiktok']);
  
  let prompt = `Generate ONE completely different content idea for a ${userProfile?.contentType || 'content creator'}.

**Context:**
- Target Audience: ${userProfile?.targetAudience || 'General audience'}
- Platforms: ${platforms.join(', ')}

**ORIGINAL IDEA TO REPLACE (generate something DIFFERENT):**
Title: ${originalIdea?.title || 'Unknown'}
Summary: ${originalIdea?.summary || 'Unknown'}`;

  if (customDirection) {
    prompt += `\n\n**Custom Direction:** ${customDirection}`;
  }

  prompt += `

**OUTPUT FORMAT (JSON):**
{
  "idea": {
    "title": "Compelling 5-8 word title",
    "summary": "One punchy sentence",
    "action": "What specifically happens",
    "setup": "Technical details",
    "story": "Narrative arc",
    "hook": "Opening line/moment",
    "why": "Why this works",
    "platforms": ["${platforms[0]}"]
  }
}

Generate something COMPLETELY DIFFERENT from the original - different angle, different format, different hook.`;

  return prompt;
}


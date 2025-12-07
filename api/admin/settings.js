// Vercel Serverless Function - Admin Settings Management
// Get and update generation governance settings

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  // Must use service role key for admin operations
  return createClient(supabaseUrl, supabaseServiceKey);
}

function verifyAdminAccess(request) {
  const adminKey = request.headers.get('x-admin-key');
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  
  if (!adminSecret) {
    console.error('ADMIN_SECRET_KEY not configured');
    return false;
  }
  
  return adminKey === adminSecret;
}

export default async function handler(request) {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: 'Database not configured (service role key required)' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify admin access for all operations
  if (!verifyAdminAccess(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // GET - Get current settings
    if (request.method === 'GET') {
      const { data: settings, error } = await supabase.rpc('get_admin_settings');
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(JSON.stringify({
        success: true,
        settings: settings
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT/PATCH - Update settings
    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await request.json();
      
      // Validate settings object
      const validKeys = [
        'hourly_batch_limit',
        'daily_batch_limit',
        'soft_warning_threshold',
        'tier_a_max',
        'tier_b_max',
        'cooldown_tier_a_min',
        'cooldown_tier_a_max',
        'cooldown_tier_b_min',
        'cooldown_tier_b_max',
        'cooldown_tier_c_min',
        'cooldown_tier_c_max',
        'boost_tier_a_batches',
        'abuse_request_threshold',
        'abuse_window_seconds',
        'abuse_sustained_seconds',
        'abuse_ban_minutes_min',
        'abuse_ban_minutes_max',
        'model_tier_a',
        'model_tier_b',
        'model_tier_c'
      ];
      
      // Filter to only valid keys
      const filteredSettings = {};
      for (const key of validKeys) {
        if (body[key] !== undefined) {
          filteredSettings[key] = body[key];
        }
      }
      
      if (Object.keys(filteredSettings).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid settings provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const { data: result, error } = await supabase.rpc('update_admin_settings', {
        p_settings: filteredSettings
      });
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Settings updated successfully',
        settings: result.settings
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin settings function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


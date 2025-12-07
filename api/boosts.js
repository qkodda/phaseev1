// Vercel Serverless Function - Boost Management
// Get balance, redeem boosts, add boosts (admin)

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

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
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const user = await getUserFromRequest(request, supabase);
    
    // GET - Get boost balance
    if (request.method === 'GET') {
      const userId = user?.id || new URL(request.url).searchParams.get('userId');
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const { data: balance, error } = await supabase.rpc('get_boost_balance', {
        p_user_id: userId
      });
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(JSON.stringify(balance), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST - Redeem or add boosts
    if (request.method === 'POST') {
      const body = await request.json();
      const { action, userId: bodyUserId, amount, reason, adminKey } = body;
      
      const userId = user?.id || bodyUserId;
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // REDEEM action
      if (action === 'redeem') {
        const { data: result, error } = await supabase.rpc('redeem_boost', {
          p_user_id: userId
        });
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (!result.success) {
          return new Response(
            JSON.stringify({ error: result.error, balance: result.balance }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Boost activated! ${result.batches_granted} Tier A batches unlocked.`,
          new_balance: result.new_balance,
          active_boost_batches: result.active_boost_batches
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // ADD action (admin only)
      if (action === 'add') {
        // Verify admin access
        const adminSecret = process.env.ADMIN_SECRET_KEY;
        if (!adminKey || adminKey !== adminSecret) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (!amount || amount < 1) {
          return new Response(
            JSON.stringify({ error: 'Valid amount required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: result, error } = await supabase.rpc('add_boost', {
          p_user_id: userId,
          p_amount: amount,
          p_reason: reason || 'admin_add',
          p_admin_id: user?.id || null
        });
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Added ${amount} boost(s)`,
          new_balance: result.new_balance
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "redeem" or "add"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in boosts function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


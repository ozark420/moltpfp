/**
 * MoodMolt API Proxy - Cloudflare Worker
 * Handles Replicate image generation + Moltbook API
 */

const ALLOWED_ORIGINS = [
  'https://ozark420.github.io',
  'https://moodmolt.xyz',
  'https://www.moodmolt.xyz',
  'http://localhost:3000'
];

export default {
  async fetch(request, env) {
    const REPLICATE_TOKEN = env.REPLICATE_TOKEN;
    const MOLTBOOK_KEY = env.MOLTBOOK_KEY;

    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      // Moltbook: Get agent by username
      if (path.startsWith('/moltbook/agent/') && request.method === 'GET') {
        const username = path.replace('/moltbook/agent/', '');
        
        // Try Moltbook API
        const res = await fetch(`https://moltbook.com/api/v1/users/${username}`, {
          headers: MOLTBOOK_KEY ? { 'Authorization': `Bearer ${MOLTBOOK_KEY}` } : {}
        });
        
        if (!res.ok) {
          // Try alternate endpoint
          const res2 = await fetch(`https://moltbook.com/u/${username}.json`);
          if (res2.ok) {
            const data = await res2.json();
            return jsonResponse(data, 200, corsHeaders);
          }
          return jsonResponse({ error: 'Agent not found', username }, 404, corsHeaders);
        }
        
        const data = await res.json();
        return jsonResponse(data, 200, corsHeaders);
      }
      
      // Moltbook: Verify agent exists (simple check)
      if (path.startsWith('/moltbook/verify/') && request.method === 'GET') {
        const username = path.replace('/moltbook/verify/', '');
        
        // Check if profile page exists
        const res = await fetch(`https://moltbook.com/u/${username}`, { method: 'HEAD' });
        
        return jsonResponse({ 
          exists: res.ok,
          username,
          profileUrl: `https://moltbook.com/u/${username}`
        }, 200, corsHeaders);
      }

      // Generate image
      if (path === '/generate' && request.method === 'POST') {
        if (!REPLICATE_TOKEN) {
          return jsonResponse({ error: 'API not configured' }, 500, corsHeaders);
        }
        
        const body = await request.json();
        if (!body.prompt) {
          return jsonResponse({ error: 'Invalid prompt' }, 400, corsHeaders);
        }
        
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${REPLICATE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
            input: {
              prompt: body.prompt,
              negative_prompt: body.negative_prompt || 'blurry, low quality',
              width: 1024,
              height: 1024,
              num_outputs: 1,
              guidance_scale: 7.5,
              num_inference_steps: 35
            }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          return jsonResponse({ error: data.detail || 'Failed' }, response.status, corsHeaders);
        }
        return jsonResponse({ id: data.id, status: data.status }, 200, corsHeaders);
      }

      // Check generation status
      if (path.startsWith('/status/') && request.method === 'GET') {
        if (!REPLICATE_TOKEN) {
          return jsonResponse({ error: 'API not configured' }, 500, corsHeaders);
        }
        
        const predictionId = path.replace('/status/', '');
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
        });
        const data = await response.json();
        return jsonResponse({ status: data.status, output: data.output, error: data.error }, 200, corsHeaders);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ status: 'ok', service: 'moodmolt-api' }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    } catch (error) {
      return jsonResponse({ error: error.message }, 500, corsHeaders);
    }
  }
};

function handleCORS(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

function jsonResponse(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

/**
 * MoodMolt API Proxy - Cloudflare Worker
 * Proxies requests to Replicate API without exposing the key
 * 
 * SETUP: Add your Replicate API token as a secret named REPLICATE_TOKEN
 * In Cloudflare dashboard: Workers > your worker > Settings > Variables > Add Secret
 */

const ALLOWED_ORIGINS = [
  'https://ozark420.github.io',
  'https://moodmolt.xyz',
  'https://www.moodmolt.xyz',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

export default {
  async fetch(request, env) {
    const REPLICATE_TOKEN = env.REPLICATE_TOKEN;
    
    if (!REPLICATE_TOKEN) {
      return jsonResponse({ error: 'API not configured' }, 500, {});
    }

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
      if (path === '/generate' && request.method === 'POST') {
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
              negative_prompt: body.negative_prompt || 'blurry, low quality, distorted',
              width: 1024,
              height: 1024,
              num_outputs: 1,
              guidance_scale: 8,
              num_inference_steps: 30
            }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          return jsonResponse({ error: data.detail || 'Failed' }, response.status, corsHeaders);
        }
        return jsonResponse({ id: data.id, status: data.status }, 200, corsHeaders);
      }

      if (path.startsWith('/status/') && request.method === 'GET') {
        const predictionId = path.replace('/status/', '');
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
        });
        const data = await response.json();
        return jsonResponse({ status: data.status, output: data.output, error: data.error }, 200, corsHeaders);
      }

      if (path === '/health') {
        return jsonResponse({ status: 'ok' }, 200, corsHeaders);
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

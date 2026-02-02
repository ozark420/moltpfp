/**
 * MoodMolt API Proxy - Cloudflare Worker
 * Supports: xAI Grok Aurora + Replicate SDXL fallback
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
    const XAI_API_KEY = env.XAI_API_KEY;
    const USE_GROK = env.USE_GROK === 'true' && XAI_API_KEY;

    if (request.method === 'OPTIONS') return handleCORS(request);

    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      // Verify Moltbook user
      if (path.startsWith('/moltbook/verify/') && request.method === 'GET') {
        const username = path.replace('/moltbook/verify/', '');
        const res = await fetch(`https://moltbook.com/u/${username}`, { method: 'HEAD' });
        return jsonResponse({ exists: res.ok, username }, 200, corsHeaders);
      }

      // Generate image
      if (path === '/generate' && request.method === 'POST') {
        const body = await request.json();
        if (!body.prompt) return jsonResponse({ error: 'Invalid prompt' }, 400, corsHeaders);

        // Use Grok
        if (USE_GROK) {
          try {
            const grokResponse = await fetch('https://api.x.ai/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'grok-2-image',
                prompt: body.prompt,
                n: 1
              })
            });

            const responseText = await grokResponse.text();
            
            if (!grokResponse.ok) {
              return jsonResponse({ error: 'Grok API error: ' + responseText }, grokResponse.status, corsHeaders);
            }

            let grokData;
            try {
              grokData = JSON.parse(responseText);
            } catch (e) {
              return jsonResponse({ error: 'Failed to parse Grok response' }, 500, corsHeaders);
            }

            const imageUrl = grokData.data?.[0]?.url;
            
            if (!imageUrl) {
              return jsonResponse({ error: 'No image URL in response: ' + responseText }, 500, corsHeaders);
            }

            return jsonResponse({
              id: 'grok_done',
              status: 'succeeded',
              output: [imageUrl]
            }, 200, corsHeaders);

          } catch (grokError) {
            return jsonResponse({ error: 'Grok exception: ' + grokError.message }, 500, corsHeaders);
          }
        }

        // Fallback to Replicate
        if (!REPLICATE_TOKEN) return jsonResponse({ error: 'No API configured' }, 500, corsHeaders);
        
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
              negative_prompt: body.negative_prompt || '',
              width: 1024,
              height: 1024,
              num_outputs: 1,
              guidance_scale: 7.5,
              num_inference_steps: 35
            }
          })
        });
        const data = await response.json();
        if (!response.ok) return jsonResponse({ error: data.detail || 'Replicate failed' }, response.status, corsHeaders);
        return jsonResponse({ id: data.id, status: data.status }, 200, corsHeaders);
      }

      // Check status (Replicate only)
      if (path.startsWith('/status/') && request.method === 'GET') {
        const predictionId = path.replace('/status/', '');
        if (predictionId === 'grok_done') {
          return jsonResponse({ status: 'succeeded', output: [] }, 200, corsHeaders);
        }
        if (!REPLICATE_TOKEN) return jsonResponse({ error: 'API not configured' }, 500, corsHeaders);
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
        });
        const data = await response.json();
        return jsonResponse({ status: data.status, output: data.output, error: data.error }, 200, corsHeaders);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ 
          status: 'ok', 
          provider: USE_GROK ? 'grok' : 'replicate',
          hasGrokKey: !!XAI_API_KEY,
          hasReplicateKey: !!REPLICATE_TOKEN
        }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    } catch (error) {
      return jsonResponse({ error: 'Server error: ' + error.message }, 500, corsHeaders);
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

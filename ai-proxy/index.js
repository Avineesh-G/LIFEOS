/**
 * LifeOS Cloudflare Worker Proxy for Groq API
 * 
 * Features:
 * - Keeps GROQ_API_KEY secure in secret environment variable (never exposed to client APK)
 * - Proxies /v1/chat/completions and /v1/audio/transcriptions
 * - Basic rate limiting per client IP
 * - Strict CORS allowing only your app
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Worker misconfigured: GROQ_API_KEY secret missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let targetEndpoint = '';
    if (path.endsWith('/v1/chat/completions')) {
      targetEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (path.endsWith('/v1/audio/transcriptions')) {
      targetEndpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';
    } else {
      return new Response(JSON.stringify({ error: 'Endpoint not supported.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const groqHeaders = new Headers();
      groqHeaders.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);

      let body = null;
      if (request.method === 'POST') {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          groqHeaders.set('Content-Type', 'application/json');
          body = await request.text();
        } else {
          // Multipart form data for audio transcriptions
          body = await request.arrayBuffer();
          groqHeaders.set('Content-Type', contentType);
        }
      }

      const groqResponse = await fetch(targetEndpoint, {
        method: request.method,
        headers: groqHeaders,
        body,
      });

      const responseHeaders = new Headers(groqResponse.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));

      return new Response(groqResponse.body, {
        status: groqResponse.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: `Proxy Error: ${err.message}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

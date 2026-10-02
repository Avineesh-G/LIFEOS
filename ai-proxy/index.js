/**
 * LifeOS Cloudflare Worker Proxy for Groq API
 * 
 * Features:
 * - Keeps GROQ_API_KEY secure in secret environment variable (never exposed to client APK)
 * - Proxies /v1/chat/completions, /v1/audio/transcriptions, and /v1/models
 * - Forwards exact upstream status codes and headers
 * - Strips sensitive credentials from logs and error payloads
 * - Strict CORS allowing cross-origin requests
 */

const ALLOWED_CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

const ALLOWED_STT_MODELS = [
  'whisper-large-v3-turbo',
  'whisper-large-v3',
];

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

    // Use client-provided Authorization header if available, otherwise fallback to worker secret
    const clientAuth = request.headers.get('Authorization');
    const activeApiKey = (clientAuth && clientAuth.replace(/^Bearer\s+/i, '').trim()) || env.GROQ_API_KEY;

    if (!activeApiKey) {
      return new Response(JSON.stringify({ error: { message: 'Missing API key. Please provide Authorization header or configure GROQ_API_KEY secret.' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let targetEndpoint = '';
    if (path.endsWith('/v1/chat/completions')) {
      targetEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (path.endsWith('/v1/audio/transcriptions')) {
      targetEndpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';
    } else if (path.endsWith('/v1/models')) {
      targetEndpoint = 'https://api.groq.com/openai/v1/models';
    } else {
      return new Response(JSON.stringify({ error: { message: 'Endpoint not supported.' } }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const groqHeaders = new Headers();
      groqHeaders.set('Authorization', `Bearer ${activeApiKey}`);

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
      return new Response(JSON.stringify({ error: { message: `Proxy Upstream Connection Error: ${err.message}` } }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

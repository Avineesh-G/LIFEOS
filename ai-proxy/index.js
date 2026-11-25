/**
 * LifeOS Authenticated Cloudflare Worker Proxy for Groq API (Phase 3 Hardened)
 *
 * Security & Controls:
 * - Verifies Firebase Authentication ID tokens (RS256 JWK signature + aud/iss/exp checks)
 * - Accepts request-scoped user BYOK key via X-Provider-Key header (never logged or persisted)
 * - Falls back to env.GROQ_API_KEY secret ONLY after Firebase user verification passes
 * - Enforces payload size limits (128 KB JSON), model allowlist, and per-UID rate limits
 * - Origin-restricted CORS (no unauthenticated wildcard access)
 */

const FIREBASE_PROJECT_ID = 'lifeos-f4de3';
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const ALLOWED_CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
];

const ALLOWED_STT_MODELS = [
  'whisper-large-v3-turbo',
  'whisper-large-v3',
];

const DEFAULT_ALLOWED_ORIGINS = [
  'https://lifeos-gujjeti-avineeshs-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost',
  'capacitor://localhost',
];

const MAX_JSON_BYTES = 128 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

let cachedJwks = null;
let cachedJwksExpiresAt = 0;
const rateBuckets = new Map();

function base64UrlToUint8Array(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

async function fetchFirebaseJwks() {
  const now = Date.now();
  if (cachedJwks && now < cachedJwksExpiresAt) {
    return cachedJwks;
  }
  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) throw new Error('Unable to fetch Firebase public keys');
  const data = await res.json();
  cachedJwks = data.keys || [];
  cachedJwksExpiresAt = now + 5 * 60 * 1000;
  return cachedJwks;
}

async function verifyFirebaseIdToken(token, projectId) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(parts[1])));

  const nowSec = Math.floor(Date.now() / 1000);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid JWT header');
  if (payload.aud !== projectId) throw new Error('Invalid token audience');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Invalid token issuer');
  if (!payload.sub || typeof payload.sub !== 'string') throw new Error('Missing subject UID');
  if (!payload.exp || payload.exp <= nowSec) throw new Error('Token expired');

  const jwks = await fetchFirebaseJwks();
  const jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToUint8Array(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signingInput);
  if (!valid) throw new Error('Invalid token signature');

  return payload.sub;
}

function checkRateLimit(uid) {
  const now = Date.now();
  const entry = rateBuckets.get(uid);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(uid, { windowStart: now, count: 1 });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000));
    return { allowed: false, retryAfterSec };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function resolveCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;

  const allowedOrigin = configured.includes(origin) ? origin : configured[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider-Key',
    'Vary': 'Origin',
  };
}

function redactText(text) {
  return String(text || '')
    .replace(/gsk_[a-zA-Z0-9_-]+/g, 'gsk_***[REDACTED]***')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***[REDACTED]***');
}

export default {
  async fetch(request, env) {
    const corsHeaders = resolveCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Require valid Firebase Authentication ID token
    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!idToken) {
      return new Response(JSON.stringify({ error: { message: 'Authentication required.' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let uid;
    try {
      uid = await verifyFirebaseIdToken(idToken, env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID);
    } catch {
      return new Response(JSON.stringify({ error: { message: 'Invalid or expired authentication session.' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Per-UID rate limiting
    const rl = checkRateLimit(uid);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded.' } }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rl.retryAfterSec),
        },
      });
    }

    // 3. Request-scoped BYOK key (X-Provider-Key) or server secret
    const byokKey = (request.headers.get('X-Provider-Key') || '').trim();
    const activeApiKey = byokKey || env.GROQ_API_KEY;
    if (!activeApiKey) {
      return new Response(JSON.stringify({ error: { message: 'Provider API key is missing.' } }), {
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
          const textBody = await request.text();
          if (textBody.length > MAX_JSON_BYTES) {
            return new Response(JSON.stringify({ error: { message: 'Request payload too large.' } }), {
              status: 413,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          let parsed;
          try {
            parsed = JSON.parse(textBody);
          } catch {
            return new Response(JSON.stringify({ error: { message: 'Malformed JSON payload.' } }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (!parsed.model || !ALLOWED_CHAT_MODELS.includes(parsed.model)) {
            return new Response(JSON.stringify({ error: { message: 'Requested model is not allowlisted.' } }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (!Array.isArray(parsed.messages) || parsed.messages.length === 0 || parsed.messages.length > 40) {
            return new Response(JSON.stringify({ error: { message: 'Invalid messages array.' } }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          groqHeaders.set('Content-Type', 'application/json');
          body = textBody;
        } else {
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
      return new Response(
        JSON.stringify({ error: { message: `Proxy Upstream Error: ${redactText(err?.message || 'Error')}` } }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

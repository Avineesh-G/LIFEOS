# LifeOS AI Proxy Worker

A lightweight Cloudflare Worker that proxies requests to the Groq API (`/v1/chat/completions` and `/v1/audio/transcriptions`), keeping your Groq API key safe as a secret without baking it into the mobile APK bundle.

## Deployment Steps

1. Install Wrangler CLI (if not installed):
   ```bash
   npm install -g wrangler
   ```

2. Login to your Cloudflare Account:
   ```bash
   wrangler login
   ```

3. Set your Groq API key secret:
   ```bash
   wrangler secret put GROQ_API_KEY
   # Enter your Groq API Key (gsk_...) when prompted
   ```

4. Deploy the Worker:
   ```bash
   npx wrangler deploy
   ```

5. Copy your deployed worker URL (e.g., `https://lifeos-ai-proxy.<your-subdomain>.workers.dev`).

6. Open LifeOS app, go to **Settings > AI Settings**, paste your Worker URL into the **Proxy URL** field, and tap Save.

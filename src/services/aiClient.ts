import { GROQ_CONFIG } from '../config/ai';
import { getGroqApiKey, getAiProxyUrl } from '../utils/aiSecurity';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `You are "Ask LifeOS", a friendly, ultra-concise personal AI assistant built into the user's LifeOS mobile app.

GUIDELINES:
1. Speak in a warm, direct, concise mobile-first tone. Use short paragraphs and clear bullet points where helpful.
2. For personal data questions (spending, tasks, gym, nutrition, study, notes), rely STRICTLY on the provided LifeOS Data Context.
3. If the provided context does not contain the answer, state clearly: "I don't have that information in your logged LifeOS data."
4. NEVER invent or hallucinate fake numbers, dates, or records.
5. If the user asks general questions or advice, answer helpful & concisely.
6. When proposed actions (adding a task, logging a meal/workout/shopping item) are requested and AI changes are enabled, you may append a structured JSON action block formatted exactly as:
\`\`\`json_action
{
  "type": "ADD_TASK" | "LOG_MEAL" | "LOG_WORKOUT" | "ADD_SHOPPING_ITEM",
  "payload": { ... }
}
\`\`\`
7. Always keep security and user control paramount.`;

/**
 * Streams chat completions from Groq (Mode A) or Proxy URL (Mode B).
 */
export async function streamChatCompletion(
  messages: { role: string; content: string }[],
  contextSummary: string,
  onChunk: (chunkText: string) => void,
  onComplete: (fullText: string) => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    onError(new Error('AI needs internet connection. Please connect to the internet and try again.'));
    return;
  }

  const proxyUrl = getAiProxyUrl();
  const apiKey = getGroqApiKey();

  if (!proxyUrl && !apiKey) {
    onError(new Error('Groq API Key is missing. Please enter your API key in Settings > AI.'));
    return;
  }

  const targetUrl = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/chat/completions` : GROQ_CONFIG.CHAT_COMPLETIONS_ENDPOINT;

  const systemMessageContent = `${SYSTEM_PROMPT}\n\n[USER LIFEOS DATA CONTEXT]\n${contextSummary}`;

  const fullMessages = [
    { role: 'system', content: systemMessageContent },
    ...messages,
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!proxyUrl && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: GROQ_CONFIG.MODELS.CHAT_PRIMARY,
        messages: fullMessages,
        temperature: 0.5,
        max_tokens: 1024,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Groq API Rate Limit reached. Please wait a moment and try again.');
      }
      if (response.status === 401) {
        throw new Error('Invalid Groq API Key. Please verify your key in Settings > AI.');
      }
      const errText = await response.text();
      throw new Error(`AI request failed (${response.status}): ${errText.substring(0, 100)}`);
    }

    if (!response.body) {
      throw new Error('Response body is unavailable for streaming.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            onComplete(accumulatedText);
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulatedText += delta;
              onChunk(accumulatedText);
            }
          } catch {}
        }
      }
    }

    onComplete(accumulatedText);
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Transcribes recorded audio blob using Groq Whisper model (Mode A or Mode B).
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('AI needs internet connection for voice transcription.');
  }

  const proxyUrl = getAiProxyUrl();
  const apiKey = getGroqApiKey();

  if (!proxyUrl && !apiKey) {
    throw new Error('Groq API Key is missing. Please enter your API key in Settings > AI.');
  }

  const targetUrl = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/audio/transcriptions` : GROQ_CONFIG.TRANSCRIPTION_ENDPOINT;

  const formData = new FormData();
  formData.append('file', audioBlob, 'voice_recording.webm');
  formData.append('model', GROQ_CONFIG.MODELS.AUDIO_TRANSCRIBE);
  formData.append('response_format', 'json');

  const headers: Record<string, string> = {};
  if (!proxyUrl && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded during voice transcription.');
    }
    throw new Error(`Voice transcription failed (${response.status}).`);
  }

  const json = await response.json();
  return json.text || '';
}

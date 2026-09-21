/**
 * LifeOS — AI Receipt OCR (Dual Engine: Gemini Vision + Groq Vision Fallback)
 *
 * Scans receipt photos and extracts total amount, merchant title, category, and date.
 * Automatically handles API key routing and fallback between Gemini and Groq Vision.
 */

export interface ReceiptOcrResult {
  amount?: number;       // in rupees (float), e.g. 245.50
  title?: string;        // merchant / description
  category?: string;     // 'Food' | 'Transport' | 'Shopping' | etc.
  date?: string;         // ISO date YYYY-MM-DD if found on receipt
  rawText?: string;      // raw OCR text for debugging
}

/**
 * Converts a Blob to base64 string (data URL stripped)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:image/jpeg;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const PROMPT = `You are a receipt OCR assistant. Analyze this receipt image and extract:
1. Total amount paid (just the final total, in Indian Rupees ₹)
2. Merchant name or brief description (e.g. "McDonald's", "Auto Rickshaw", "Big Bazaar")
3. Category — choose ONE from: Food, Transport, Shopping, Stay, Tickets & fun, Other
4. Date of purchase (if visible, in YYYY-MM-DD format)

Respond ONLY with a valid JSON object in this exact format, no extra text:
{
  "amount": 245.50,
  "title": "McDonald's",
  "category": "Food",
  "date": "2024-09-21"
}

If a field is not visible or unclear, omit it from the JSON.`;

/**
 * Executes Receipt OCR using Groq's LLaMA 3.2 Vision Model
 */
async function analyzeWithGroqVision(
  imageBlob: Blob,
  groqKey: string
): Promise<ReceiptOcrResult> {
  const base64Data = await blobToBase64(imageBlob);
  const mimeType = imageBlob.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const GROQ_MODELS = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview'];
  let lastErr: Error | null = null;

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 256,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text: string = data?.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
            title: typeof parsed.title === 'string' ? parsed.title : undefined,
            category: typeof parsed.category === 'string' ? parsed.category : undefined,
            date: typeof parsed.date === 'string' ? parsed.date : undefined,
            rawText: text,
          };
        }
        return { rawText: text };
      }

      const errText = await response.text().catch(() => '');
      lastErr = new Error(`Groq Vision (${model}) ${response.status}: ${errText.slice(0, 100)}`);
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Groq Vision model failed');
}

/**
 * Main Receipt OCR engine with Dual Gemini + Groq Vision support & fallback
 */
export async function analyzeReceiptWithGemini(
  imageBlob: Blob,
  apiKey?: string,
  fallbackGroqKey?: string
): Promise<ReceiptOcrResult> {
  const trimmedGeminiKey = apiKey?.trim() || '';
  const trimmedGroqKey = fallbackGroqKey?.trim() || '';

  // 20MB limit check
  const MAX_SIZE_BYTES = 20 * 1024 * 1024;
  if (imageBlob.size > MAX_SIZE_BYTES) {
    throw new Error('Image exceeds 20MB limit. Please upload a smaller receipt photo.');
  }

  // If key provided is a Groq key (starts with gsk_), route to Groq Vision
  if (trimmedGeminiKey.startsWith('gsk_')) {
    return analyzeWithGroqVision(imageBlob, trimmedGeminiKey);
  }

  let lastError: Error | null = null;

  // Attempt Gemini Vision models if primary key provided
  if (trimmedGeminiKey) {
    const base64Data = await blobToBase64(imageBlob);
    const mimeType = imageBlob.type || 'image/jpeg';

    const requestBody = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    };

    const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];

    for (const model of MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedGeminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
              title: typeof parsed.title === 'string' ? parsed.title : undefined,
              category: typeof parsed.category === 'string' ? parsed.category : undefined,
              date: typeof parsed.date === 'string' ? parsed.date : undefined,
              rawText: text,
            };
          }
          return { rawText: text };
        }

        const errText = await response.text().catch(() => '');
        lastError = new Error(`Gemini (${model}) ${response.status}: ${errText.slice(0, 100)}`);
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  // Automatic Fallback: Try Groq Vision if a Groq key exists in Settings
  if (trimmedGroqKey && trimmedGroqKey.startsWith('gsk_')) {
    try {
      return await analyzeWithGroqVision(imageBlob, trimmedGroqKey);
    } catch (groqErr: any) {
      if (!lastError) lastError = groqErr;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('API Key missing or invalid. Please check your Gemini or Groq API key in Settings.');
}

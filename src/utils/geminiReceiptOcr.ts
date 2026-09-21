/**
 * LifeOS — Gemini Vision Receipt OCR
 *
 * Sends a receipt image (as base64) to Gemini 2.0 Flash via the REST API
 * and parses out amount, title, category, and date from the receipt.
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

export async function analyzeReceiptWithGemini(
  imageBlob: Blob,
  apiKey: string
): Promise<ReceiptOcrResult> {
  if (!apiKey?.trim()) {
    throw new Error('Gemini API key not configured. Please add it in Settings → Gemini AI.');
  }

  const base64Data = await blobToBase64(imageBlob);
  const mimeType = imageBlob.type || 'image/jpeg';

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Try to parse the JSON response
  try {
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
  } catch {
    // Fallback: return raw text for debugging
    return { rawText: text };
  }

  return { rawText: text };
}

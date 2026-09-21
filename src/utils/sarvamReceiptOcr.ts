/**
 * LifeOS — Sarvam.ai Indian Document & Receipt OCR
 *
 * Uses Sarvam.ai APIs (api.sarvam.ai) tailored for Indian retail receipts,
 * UPI payment screenshots, and multi-lingual Indian bills.
 */

export interface ReceiptOcrResult {
  amount?: number;       // in rupees (float), e.g. 245.50
  title?: string;        // merchant / description
  category?: string;     // 'Food' | 'Transport' | 'Shopping' | etc.
  date?: string;         // ISO date YYYY-MM-DD if found on receipt
  rawText?: string;      // raw OCR text for debugging
}

/**
 * Parses structured fields (amount, title, category, date) from extracted receipt text
 */
function parseReceiptFromText(text: string): ReceiptOcrResult {
  if (!text) return {};

  let amount: number | undefined;
  let title: string | undefined;
  let category: string | undefined;
  let date: string | undefined;

  // 1. Try parsing JSON if Sarvam returned structured JSON format
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.amount === 'number') amount = parsed.amount;
      if (typeof parsed.title === 'string') title = parsed.title;
      if (typeof parsed.category === 'string') category = parsed.category;
      if (typeof parsed.date === 'string') date = parsed.date;
      if (amount || title || category) {
        return { amount, title, category, date, rawText: text };
      }
    } catch {}
  }

  // 2. Extract total amount using Indian currency & receipt patterns (e.g., ₹ 245.50, Total: 500, Rs. 150)
  const amountPatterns = [
    /(?:TOTAL|GRAND\s+TOTAL|NET\s+AMOUNT|AMOUNT\tag|PAID|PAYMENT|₹|RS\.?)\s*[:\.-]?\s*(?:RS\.?|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:₹|RS\.?)\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val > 0 && val < 500000) {
        amount = val;
        break;
      }
    }
  }

  // 3. Extract Merchant Title (First non-empty line of text)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length > 0) {
    // Exclude header words
    const firstLine = lines[0];
    if (!/INVOICE|RECEIPT|BILL|TAX|TAX INVOICE/i.test(firstLine)) {
      title = firstLine.slice(0, 40);
    } else if (lines.length > 1) {
      title = lines[1].slice(0, 40);
    }
  }

  // 4. Extract Category heuristic matching
  const lowerText = text.toLowerCase();
  if (/mcdonald|kfc|domino|pizza|burger|restaurant|swiggy|zomato|cafe|coffee|dosa|biryani|hotel|food|canteen/i.test(lowerText)) {
    category = 'Food';
  } else if (/uber|ola|rapido|rickshaw|auto|taxi|metro|fuel|petrol|diesel|irctc|bus|train/i.test(lowerText)) {
    category = 'Transport';
  } else if (/amazon|flipkart|myntra|zudio|dmart|bazaar|supermarket|retail|store|mall|clothing|pantaloons/i.test(lowerText)) {
    category = 'Shopping';
  } else if (/movie|pvr|inox|ticket|zoo|park|resort|game|bowling/i.test(lowerText)) {
    category = 'Tickets & fun';
  }

  // 5. Extract Date (YYYY-MM-DD or DD/MM/YYYY)
  const dateMatch = text.match(/\b(202[0-9][-\/\.][0-1][0-9][-\/\.][0-3][0-9]|[0-3][0-9][-\/\.][0-1][0-9][-\/\.]202[0-9])\b/);
  if (dateMatch && dateMatch[1]) {
    date = dateMatch[1].replace(/[\/\.]/g, '-');
  }

  return { amount, title, category, date, rawText: text };
}

/**
 * Main Sarvam.ai OCR Execution
 */
export async function analyzeReceiptWithSarvam(
  imageBlob: Blob,
  apiKey: string
): Promise<ReceiptOcrResult> {
  const trimmedKey = apiKey?.trim() || '';
  if (!trimmedKey) {
    throw new Error('Sarvam AI API key not configured. Please add it in Settings → Sarvam AI OCR.');
  }

  // 20MB size guard
  const MAX_SIZE_BYTES = 20 * 1024 * 1024;
  if (imageBlob.size > MAX_SIZE_BYTES) {
    throw new Error('Image exceeds 20MB limit. Please upload a smaller receipt photo.');
  }

  const formData = new FormData();
  const file = new File([imageBlob], 'receipt.jpg', { type: imageBlob.type || 'image/jpeg' });
  formData.append('file', file);

  let lastError: Error | null = null;

  // Try Endpoint 1: Sarvam Document Digitization API (/doc-ai/v1/job/digitise)
  try {
    const response = await fetch('https://api.sarvam.ai/doc-ai/v1/job/digitise', {
      method: 'POST',
      headers: {
        'api-subscription-key': trimmedKey,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const extractedText = typeof data === 'string' ? data : (data?.text || data?.result || data?.extracted_text || JSON.stringify(data));
      return parseReceiptFromText(extractedText);
    }

    const errText = await response.text().catch(() => '');
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error(`Sarvam AI Subscription Key Error (${response.status}): ${errText.slice(0, 100)}`);
    }

    lastError = new Error(`Sarvam AI digitise error ${response.status}: ${errText.slice(0, 100)}`);
  } catch (err: any) {
    if (err.message?.includes('Sarvam AI Subscription Key Error')) {
      throw err;
    }
    lastError = err;
  }

  // Try Endpoint 2: Sarvam OCR Direct Endpoint (/v1/ocr)
  try {
    const response = await fetch('https://api.sarvam.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'api-subscription-key': trimmedKey,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const extractedText = data?.text || data?.extracted_text || JSON.stringify(data);
      return parseReceiptFromText(extractedText);
    }

    const errText = await response.text().catch(() => '');
    lastError = new Error(`Sarvam OCR error ${response.status}: ${errText.slice(0, 100)}`);
  } catch (err: any) {
    lastError = err;
  }

  throw lastError || new Error('Sarvam.ai OCR failed. Please check your api-subscription-key in Settings.');
}

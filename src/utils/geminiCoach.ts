// ── Load Groq API key from Vercel / .env or user settings in Settings page ──
export const GEMINI_API_KEY: string = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || '';
// ──────────────────────────────────────────────────────────────────────────

async function callGroq(prompt: string, apiKey: string, maxTokens = 500, expectJson: boolean = false, isPdf: boolean = false): Promise<string> {
  let activeKey = apiKey && apiKey.trim().startsWith('gsk_') ? apiKey.trim() : GEMINI_API_KEY;
  if (!activeKey || !activeKey.trim()) throw new Error('NO_API_KEY');
  
  if (isPdf) {
    throw new Error('Groq API does not support direct PDF uploads. Please use the "Paste Text" option below.');
  }

  const messages: { role: string; content: string }[] = [];
  if (expectJson) {
    messages.push({
      role: 'system',
      content: 'You are an expert AI assistant. You must always respond with a valid, well-formed JSON object only.'
    });
  }
  messages.push({ role: 'user', content: prompt });

  const tryCall = async (model: string, keyToUse: string) => {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: maxTokens,
        temperature: expectJson ? 0.1 : 0.7,
        ...(expectJson ? { response_format: { type: 'json_object' } } : {})
      })
    });
  };

  // Model waterfall — active supported models on Groq
  const MODELS = [
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-120b',
    'groq/compound-mini',
  ];

  let response: Response = null!;
  let lastError = '';

  for (let i = 0; i < MODELS.length; i++) {
    try {
      response = await tryCall(MODELS[i], activeKey);
      if (response.ok) break; // success — stop waterfall

      if (response.status === 401 && activeKey !== GEMINI_API_KEY) {
        // Custom key rejected — retry same model with default key
        activeKey = GEMINI_API_KEY;
        response = await tryCall(MODELS[i], activeKey);
        if (response.ok) break;
      }

      if (response.status === 429 || response.status === 503 || response.status === 404) {
        // Rate limited or model unavailable — wait briefly then try next model
        lastError = `Model ${MODELS[i]} unavailable or rate limited (${response.status})`;
        console.warn(`[AI] ${lastError}, trying next model...`);
        if (i < MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
      }

      // Other error — stop waterfall
      break;
    } catch (netErr: any) {
      throw new Error(`Network error communicating with AI: ${netErr.message}`);
    }
  }

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;
  
  if (!text) throw new Error(`Empty response from Groq`);

  // Strip any reasoning / think tags from modern LLMs (e.g. Qwen 3.6 / reasoning models)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  return text;
}

export async function parseMenuPdf(base64Data: string, apiKey: string = GEMINI_API_KEY): Promise<string> {
  // Groq doesn't support PDFs directly, we throw an error to guide them to Paste Text
  return callGroq('', apiKey, 100, false, true);
}

export async function parseMenuText(text: string, apiKey: string = GEMINI_API_KEY): Promise<string> {
  const prompt = `You are a nutrition assistant. Extract the mess menu from this raw text and return it ONLY as a valid JSON object.
It must contain a single key "days" which is an array of daily menus. Estimate reasonable calories for each item based on standard Indian/continental mess food.

STRICT JSON FORMAT EXAMPLE:
{
  "days": [
    {
      "date": "2024-10-01",
      "meals": [
        {
          "slot": "breakfast",
          "items": [
            { "name": "Poha", "estCalories": 250 }
          ]
        }
      ]
    }
  ]
}

Menu Text:
${text}`;

  const rawResponse = await callGroq(prompt, apiKey, 8000, true);
  
  // Extract the "days" array from the JSON object
  try {
    const parsed = JSON.parse(rawResponse);
    if (parsed.days && Array.isArray(parsed.days)) {
      return JSON.stringify(parsed.days);
    }
  } catch (e) {
    console.error("Groq JSON parsing error:", e);
  }
  
  return rawResponse;
}

export async function getCoachTip(prompt: string, apiKey: string = GEMINI_API_KEY): Promise<string> {
  try {
    return await callGroq(prompt, apiKey, 200, false);
  } catch (err: unknown) {
    console.error('Gemini coach error:', err);
    throw err; // re-throw real error
  }
}

// ── Workout types with target muscles ─────────────────────────────────────
export const WORKOUT_MUSCLES: Record<string, string> = {
  PUSH:      'chest, front shoulders, triceps',
  PULL:      'back (lats, rhomboids, traps), rear delts, biceps',
  CORE:      'abs, obliques, lower back, hip flexors',
  SHOULDERS: 'lateral deltoids, rear deltoids, front deltoids, traps',
  ARMS:      'biceps, triceps, forearms',
  CARDIO:    'full body cardiovascular system',
  HIIT:      'full body with high intensity intervals',
  CHEST:     'upper chest, mid chest, lower chest',
  BACK:      'lats, rhomboids, traps, lower back',
};

/** 1. Pre-workout focus tip (2-3 sentences: what to prioritize + form cue) */
export async function getPreWorkoutTip(
  workoutType: string,
  exercises: string[],
  apiKey: string = GEMINI_API_KEY
): Promise<string> {
  const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()] || workoutType;
  const exList = exercises.length > 0 ? `Today's exercises: ${exercises.join(', ')}.` : '';
  const prompt = `You are a personal gym coach. Today's workout is ${workoutType} targeting ${muscles}.
${exList}
Give me 2-3 sentences: what to prioritize today, one key form cue, and an intensity tip.
No bullet points, no markdown, plain text only. Be direct and motivating.`;
  return callGroq(prompt, apiKey, 180);
}

/** 2. Progressive overload: compare this week vs last week for same workout type */
export async function getProgressionAdvice(opts: {
  workoutType: string;
  lastSessionExercises: { name: string; topWeight: number; topReps: number }[];
}, apiKey: string = GEMINI_API_KEY): Promise<string> {
  if (opts.lastSessionExercises.length === 0) return '';
  const lines = opts.lastSessionExercises
    .map(e => `${e.name}: ${e.topReps} reps @ ${e.topWeight}kg`)
    .join(', ');
  const prompt = `You are a gym coach analyzing progressive overload.
Last ${opts.workoutType} session: ${lines}.
Tell me in 2 sentences: which exercises to push harder today (add weight or reps) and which to keep the same. Be specific with numbers.`;
  return callGroq(prompt, apiKey, 150);
}

/** 3. Recovery check: based on recent workout types done */
export async function getRecoveryCheck(recentTypes: string[], apiKey: string = GEMINI_API_KEY): Promise<string> {
  const prompt = `You are a gym recovery coach. The user's last 5 workouts were: ${recentTypes.join(' → ')}.
In 2 sentences, assess recovery risk and suggest what to focus on today (intensity up/down, rest priority, muscle groups to avoid overloading).`;
  return callGroq(prompt, apiKey, 150);
}

/** 4. Post-workout summary: after logging a session */
export async function getPostWorkoutSummary(opts: {
  workoutType: string;
  completedSets: number;
  totalSets: number;
  exercises: { name: string; topWeight: number; completedReps: number }[];
}, apiKey: string = GEMINI_API_KEY): Promise<string> {
  const pct = Math.round((opts.completedSets / Math.max(opts.totalSets, 1)) * 100);
  const lines = opts.exercises.map(e => `${e.name}: ${e.completedReps} reps @ ${e.topWeight}kg`).join(', ');
  const prompt = `You are a gym coach. The user just finished a ${opts.workoutType} session: ${lines}. Completion: ${pct}%.
Give a 2-sentence post-workout summary: what they did well and one thing to improve next time.`;
  return callGroq(prompt, apiKey, 150);
}

/** Quick connectivity test */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await callGroq('Reply with the single word OK.', apiKey, 10);
    return res.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}

/** 5. Split tweak advice: detect plateaus and suggest split changes */
export async function getSplitTweakAdvice(
  workoutType: string, 
  recentLogs: { date: string; exercises: { name: string; topWeight: number }[] }[],
  apiKey: string = GEMINI_API_KEY
): Promise<string> {
  if (recentLogs.length < 3) return ''; // Need more data for plateau detection
  
  const historyStr = recentLogs.map(log => 
    `${log.date}: ${log.exercises.map(e => `${e.name} (${e.topWeight}kg)`).join(', ')}`
  ).join(' | ');

  const prompt = `You are a gym programming expert. Analyze this user's recent ${workoutType} sessions over the last few weeks: ${historyStr}.
If you notice they are stuck at the same weight (a plateau), suggest one specific tweak (e.g., lower the rep range, swap an exercise, or add a deload).
If they are progressing well, just say "Progress looks solid, keep at it." 
Keep it under 3 sentences. Plain text only.`;
  return callGroq(prompt, apiKey, 150);
}


export interface AiExercise {
  name: string;
  sets: number;
  reps: string;       // e.g. "10-12" or "30 sec"
  iconKey: string;    // one of: flame, dumbbell, zap, sparkles, activity, target
  howTo: string;      // 1-2 sentence clear instruction
  rest: string;       // e.g. "90s"
  weight: number;     // Starting weight in kg, 0 for bodyweight
}

export interface AiWorkoutPlan {
  type: string;
  muscles: string;
  tip: string;        // 1 sentence motivation/tip
  exercises: AiExercise[];
}

/** Build Gemini prompt for workout plan */
export function buildWorkoutPrompt(workoutType: string, profile?: any): string {
  const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()] || workoutType;
  let context = '';
  if (profile) {
    const currentWeight = profile.weightHistory?.[profile.weightHistory.length - 1]?.weight || 75;
    const goal = profile.goalWeight < currentWeight ? 'Weight Loss (focus on calorie burn, intensity)' : 'Muscle Build (focus on hypertrophy, progressive overload)';
    context = `\nUser Profile: Age ${profile.age}, Current Weight: ${currentWeight}kg, Goal: ${goal}.`;
  }

  return `You are an elite gym coach. Create a ${workoutType} workout plan targeting: ${muscles}.${context}
Include exactly ONE mandatory Warm-up exercise at the very start, and exactly ONE Cool-down stretch at the very end.
Recommend a starting weight (in kg) for each exercise based on the user's profile. Use 0 for bodyweight/stretching.

Return ONLY a valid JSON object in this exact format:
{
  "data": {
    "tip": "one motivational sentence",
    "exercises": [
      {
        "name": "Exercise Name", 
        "sets": 3, 
        "reps": "10-12", 
        "rest": "90s", 
        "weight": 20,
        "iconKey": "dumbbell", 
        "howTo": "Clear 1-sentence instruction."
      }
    ]
  }
}
Include 5-7 exercises (including warm-up and cool-down). For iconKey, choose from: flame, dumbbell, zap, sparkles, activity, target.`;
}

/** Get AI-generated workout plan — uses higher token limit */
export async function getAiWorkoutPlan(workoutType: string, profile: any, apiKey: string = GEMINI_API_KEY): Promise<AiWorkoutPlan> {
  const prompt = buildWorkoutPrompt(workoutType, profile);
  let raw: string;
  try {
    raw = await callGroq(prompt, apiKey, 1500, false);
  } catch (err: unknown) {
    console.error('Groq workout error:', err);
    throw err; // surface the real error message
  }

  let parsed: { data: { tip?: string; exercises?: AiExercise[] } };
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse workout plan from Groq response');
    parsed = JSON.parse(match[0]);
  }

  const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()] || workoutType;
  const pData = parsed.data || parsed;
  return {
    type: workoutType,
    muscles,
    tip: pData.tip ?? '',
    exercises: pData.exercises ?? [],
  };
}

export async function getDietAdvice(dayMenu: any, profile: any, apiKey: string): Promise<any> {
  const prompt = `You are an expert AI Dietician. My goal weight is ${profile.goalWeight} kg, my current weight is ${profile.weightHistory?.[profile.weightHistory.length - 1]?.weight || 'unknown'} kg. I am trying to lose weight. My calorie target is ${profile.currentCalorieTarget} kcal. 
Here is today's menu: ${JSON.stringify(dayMenu)}

Based strictly on this menu, analyze what I should eat to achieve my weight loss goals.
Output a valid JSON object in this exact format:
{
  "recommended": [
    {"item": "Exact Item Name from menu", "reason": "Why it's good"}
  ],
  "avoid": [
    {"item": "Exact Item Name from menu", "reason": "Why to avoid"}
  ],
  "strategy": "A one sentence overarching tip for today."
}`;

  try {
    const raw = await callGroq(prompt, apiKey, 800, true);
    
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse diet advice from Groq response');
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error('Groq diet advice error:', err);
    throw err;
  }
}

export async function getHistoryAnalysis(logs: any[], profile: any, apiKey: string = GEMINI_API_KEY): Promise<any> {
  if (!logs || logs.length === 0) return null;
  
  // Format logs for the AI to understand concisely
  const historyData = logs.map(l => {
    return `Date: ${l.date}, Total: ${Math.round(l.dailyTotal)} kcal. Meals: ${l.mealsEaten.map((m: any) => `${m.slot}: ${m.items.map((i: any) => `${i.name} (x${i.portion})`).join(', ')}`).join(' | ')}`;
  }).join('\n');

  const prompt = `You are an expert AI Dietician. The user's calorie target is ${profile?.currentCalorieTarget || 2000} kcal.
Here is their recent eating history:
${historyData}

Analyze this history and provide a concise JSON summary.
Output exactly this JSON format:
{
  "summary": "A 2-sentence summary of their eating trends over this period.",
  "tips": [
    "Specific actionable tip 1 based on their data",
    "Specific actionable tip 2 based on their data"
  ]
}`;

  try {
    const raw = await callGroq(prompt, apiKey, 350, true);
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse history analysis from Groq response');
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error('Groq history analysis error:', err);
    throw err;
  }
}

export async function getGymHistoryAnalysis(logs: any[], apiKey: string = GEMINI_API_KEY): Promise<any> {
  if (!logs || logs.length === 0) return null;

  const historyData = logs.map(l => {
    const totalSets = (l.exercises || []).reduce((s: number, e: any) => s + (e.sets?.filter((st: any) => st.completed)?.length || 0), 0);
    const exSummary = (l.exercises || []).map((e: any) => `${e.name} (${(e.sets || []).length} sets)`).join(', ');
    const durationMin = l.startTime && l.endTime ? Math.round((l.endTime - l.startTime) / 60000) : null;
    return `Date: ${l.date} (${l.day || ''}), Type: ${l.type}, Completed Sets: ${totalSets}${durationMin ? `, Duration: ${durationMin}m` : ''}, Exercises: ${exSummary}`;
  }).join('\n');

  const prompt = `You are an elite personal fitness coach and exercise scientist.
Analyze this user's completed gym workout history for this month:
${historyData}

Provide a concise, motivating, data-driven analysis in this exact JSON format:
{
  "summary": "A 2-sentence summary of their workout consistency, training frequency, and muscle group distribution over this month.",
  "tips": [
    "Specific actionable tip 1 for progressive overload or recovery",
    "Specific actionable tip 2 for volume or split balance"
  ]
}`;

  try {
    const raw = await callGroq(prompt, apiKey, 400, true);
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse gym history analysis from Groq response');
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error('Groq gym history analysis error:', err);
    throw err;
  }
}

export async function getSpendingHistoryAnalysis(expenses: any[], apiKey: string = GEMINI_API_KEY): Promise<any> {
  if (!expenses || expenses.length === 0) return null;

  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0);
  });
  const catSummary = Object.entries(byCategory).map(([c, a]) => `${c}: ₹${a}`).join(', ');
  const recentItems = expenses.slice(0, 30).map(e => `${e.date}: ₹${e.amount} on ${e.category}${e.note ? ` (${e.note})` : ''}`).join('\n');

  const prompt = `You are a financial advisor focusing on smart budgeting and reducing wasteful expenditure.
Analyze this user's spending data:
Total Spent: ₹${totalSpent}
Category Breakdown: ${catSummary}
Recent Transactions:
${recentItems}

    Provide a concise, data-driven analysis highlighting where the user is overspending and actionable advice on where to spend less in this exact JSON format:
{
  "summary": "A 2-sentence summary of their primary spending habits and largest financial drains.",
  "tips": [
    "Specific actionable tip 1 on where and how to cut down unnecessary spending",
    "Specific actionable tip 2 on smarter alternatives or budgeting"
  ]
}`;

  try {
    const raw = await callGroq(prompt, apiKey, 800, true);
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse spending analysis from Groq response');
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error('Groq spending history analysis error:', err);
    throw err;
  }
}

export async function askFoodDoubt(foodQuery: string, profile: any, apiKey: string = GEMINI_API_KEY): Promise<string> {
  const target = profile?.currentCalorieTarget || 2000;
  const prompt = `You are an expert nutrition coach. The user asks if they can eat this off-menu food: "${foodQuery}".
Their daily calorie target is ${target} kcal.
Provide a direct verdict (Yes / In moderation / Avoid) and a quick rationale.
CRITICAL MANDATORY CONSTRAINT: Your entire output MUST BE strictly under 100 characters total. Plain text only. No markdown formatting.`;

  try {
    const reply = await callGroq(prompt, apiKey, 50, false);
    const cleaned = reply.replace(/\n/g, ' ').trim();
    // Enforce 100 chars limit
    if (cleaned.length > 100) {
      return cleaned.slice(0, 97) + '...';
    }
    return cleaned;
  } catch (err) {
    console.error('Groq food doubt error:', err);
    throw err;
  }
}


// ── Paste your Groq API key here or in Vercel Env Vars ─────────────────
// Get a free key at: https://console.groq.com/keys
export const GEMINI_API_KEY: string = import.meta.env.VITE_GROQ_API_KEY || '';
// ──────────────────────────────────────────────────────────────────────────

async function callGroq(prompt: string, apiKey: string, maxTokens = 500, expectJson: boolean = false, isPdf: boolean = false): Promise<string> {
  if (!apiKey || !apiKey.trim() || !apiKey.trim().startsWith('gsk_')) {
    apiKey = GEMINI_API_KEY;
  }
  if (!apiKey || !apiKey.trim()) throw new Error('NO_API_KEY');
  
  if (isPdf) {
    throw new Error('Groq API does not support direct PDF uploads. Please use the "Paste Text" option below.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: maxTokens,
      temperature: expectJson ? 0.1 : 0.7,
      ...(expectJson ? { response_format: { type: 'json_object' } } : {})
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) throw new Error(`Empty response from Groq`);
  return text.trim();
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

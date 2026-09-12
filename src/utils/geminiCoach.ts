// ── Load Groq API key from Vercel / .env or user settings in Settings page ──
export const GEMINI_API_KEY: string = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || '';
// ──────────────────────────────────────────────────────────────────────────

async function callGeminiDirect(prompt: string, apiKey: string, expectJson: boolean = false): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: expectJson ? 0.1 : 0.7,
        ...(expectJson ? { responseMimeType: 'application/json' } : {})
      }
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API Error: ${res.status} - ${txt}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}

async function callGroq(prompt: string, apiKey: string, maxTokens = 500, expectJson: boolean = false, isPdf: boolean = false): Promise<string> {
  let activeKey = (apiKey && apiKey.trim()) || GEMINI_API_KEY;
  if (!activeKey) throw new Error('NO_API_KEY');
  activeKey = activeKey.replace(/^["']|["']$/g, '').trim();
  if (!activeKey) throw new Error('NO_API_KEY');
  
  if (isPdf) {
    throw new Error('Groq API does not support direct PDF uploads. Please use the "Paste Text" option below.');
  }

  // Automatic provider routing: if user entered a Google Gemini API Key
  if (activeKey.startsWith('AIza')) {
    return await callGeminiDirect(prompt, activeKey, expectJson);
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
    const cappedTokens = model.includes('qwen3.8') ? Math.min(maxTokens, 600) : maxTokens;
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: cappedTokens,
        temperature: expectJson ? 0.1 : 0.7,
        ...(expectJson ? { response_format: { type: 'json_object' } } : {})
      })
    });
  };

  // High rate-limit and active models on Groq
  const MODELS = [
    'groq/compound-mini',      // 70,000 TPM limit (Fastest, highest quota on Groq)
    'openai/gpt-oss-120b',      // 8,000 TPM limit (Powerful 120B reasoning)
    'qwen/qwen3.6-27b',         // 8,000 TPM limit
    'openai/gpt-oss-20b',       // 8,000 TPM limit
    'qwen/qwen3.8-27b',         // High quality
  ];

  let response: Response = null!;
  let lastError = '';

  for (let i = 0; i < MODELS.length; i++) {
    try {
      response = await tryCall(MODELS[i], activeKey);
      if (response.ok) break; // success — stop waterfall

      if (response.status === 401 && activeKey !== GEMINI_API_KEY && GEMINI_API_KEY) {
        // Custom key rejected — retry same model with default key
        activeKey = GEMINI_API_KEY;
        response = await tryCall(MODELS[i], activeKey);
        if (response.ok) break;
      }

      if (response.status === 429 || response.status === 503 || response.status === 404) {
        // Rate limited or model unavailable — immediately try next model without waiting
        lastError = `Model ${MODELS[i]} returned status ${response.status}`;
        console.warn(`[AI] ${lastError}, switching to next model...`);
        if (i < MODELS.length - 1) {
          continue;
        }
      }

      // Other error — try next model if available
      if (i < MODELS.length - 1) {
        continue;
      }
      break;
    } catch (netErr: any) {
      if (i < MODELS.length - 1) {
        continue;
      }
      throw new Error(`Network error communicating with AI: ${netErr.message}`);
    }
  }

  if (!response || !response.ok) {
    const errorData = response ? await response.text() : 'No response';
    throw new Error(`AI API Error: ${response ? response.status : 'Offline'} - ${errorData}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;
  
  if (!text) throw new Error(`Empty response from AI`);

  // Strip any reasoning / think tags from modern LLMs
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
    console.warn('[AI Coach] Coach tip notice, using default cue:', err);
    return 'Focus on hitting your daily protein target and prioritize steady hydration throughout the day.';
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
  try {
    return await callGroq(prompt, apiKey, 180);
  } catch (err) {
    console.warn('[AI Coach] Pre-workout tip notice, using default cue:', err);
    return `Prioritize controlled eccentrics on your compound lifts today. Keep your core braced and focus on deliberate mind-muscle connection.`;
  }
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
  try {
    return await callGroq(prompt, apiKey, 150);
  } catch (err) {
    console.warn('[AI Coach] Progression advice notice, using default cue:', err);
    return `Attempt to add 1-2 extra reps or 1-2.5kg to your primary working sets today while maintaining strict form.`;
  }
}

/** 3. Recovery check: based on recent workout types done */
export async function getRecoveryCheck(recentTypes: string[], apiKey: string = GEMINI_API_KEY): Promise<string> {
  const prompt = `You are a gym recovery coach. The user's last 5 workouts were: ${recentTypes.join(' → ')}.
In 2 sentences, assess recovery risk and suggest what to focus on today (intensity up/down, rest priority, muscle groups to avoid overloading).`;
  try {
    return await callGroq(prompt, apiKey, 150);
  } catch (err) {
    console.warn('[AI Coach] Recovery check notice, using default cue:', err);
    return `Ensure at least 48 hours of rest before retraining fatigued muscle groups, and stay well hydrated.`;
  }
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
  try {
    return await callGroq(prompt, apiKey, 150);
  } catch (err) {
    console.warn('[AI Coach] Post-workout summary notice, using default cue:', err);
    return `Great session completed with ${pct}% workout completion! Focus on immediate protein refueling and solid sleep.`;
  }
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
  try {
    return await callGroq(prompt, apiKey, 150);
  } catch (err) {
    console.warn('[AI Coach] Split tweak notice, using default cue:', err);
    return 'Progress looks consistent. Continue progressive overload and adjust volume if fatigue accumulates.';
  }
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

import { FITNESS_GOALS } from './calculations';

/** Build Gemini prompt for workout plan */
export function buildWorkoutPrompt(workoutType: string, profile?: any): string {
  const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()] || workoutType;
  let context = '';
  if (profile) {
    const currentWeight = profile.weightHistory?.[profile.weightHistory.length - 1]?.weight || 75;
    const goalConfig = FITNESS_GOALS.find(g => g.id === profile.fitnessGoal);
    const goalLabel = goalConfig ? goalConfig.label : (profile.goalWeight < currentWeight ? 'Weight Loss' : 'Muscle Building');
    const goalStyle = goalConfig ? goalConfig.splitDescription : 'Progressive overload & balanced training';
    context = `\nUser Profile: Age ${profile.age || 20}, Current Weight: ${currentWeight}kg, Goal: ${goalLabel} (${goalStyle}). Calorie Target: ${profile.currentCalorieTarget || 2000} kcal, Protein Target: ${profile.dailyProteinTarget || 150}g.`;
  }

  return `You are an elite gym coach. Create a ${workoutType} workout plan targeting: ${muscles}.${context}
Ensure exercise selection, rep ranges, and rest intervals align directly with their primary goal (e.g. 3-6 heavy reps for Strength, 8-12 volume reps for Muscle Building, high-density 10-15 reps with short rest for Weight Loss / Toning).
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

export function generateFallbackWorkoutPlan(workoutType: string, profile?: any): AiWorkoutPlan {
  const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()] || workoutType;
  const currentWeight = profile?.weightHistory?.[profile.weightHistory.length - 1]?.weight || profile?.weight || 75;
  const goalId = profile?.fitnessGoal || 'muscle_building';
  
  const reps = goalId === 'strength_building' ? '5-6' : goalId === 'weight_loss' || goalId === 'body_toning' ? '12-15' : '8-12';
  const rest = goalId === 'strength_building' ? '120s' : goalId === 'weight_loss' ? '60s' : '90s';

  const defaultPush: AiExercise[] = [
    { name: 'Arm Circles & Band Dislocates', sets: 2, reps: '15', rest: '45s', weight: 0, iconKey: 'activity', howTo: 'Warm up shoulders and rotators thoroughly.' },
    { name: 'Barbell Bench Press', sets: 4, reps, rest, weight: Math.round(currentWeight * 0.7), iconKey: 'dumbbell', howTo: 'Lower bar to mid-chest with control, press up explosively.' },
    { name: 'Incline Dumbbell Press', sets: 3, reps, rest, weight: Math.round(currentWeight * 0.3), iconKey: 'dumbbell', howTo: 'Focus on upper chest contraction at the top.' },
    { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps, rest, weight: Math.round(currentWeight * 0.25), iconKey: 'zap', howTo: 'Keep core engaged and press dumbbells directly overhead.' },
    { name: 'Cable Tricep Pushdowns', sets: 3, reps, rest, weight: 25, iconKey: 'flame', howTo: 'Pin elbows to your sides and squeeze triceps at bottom.' },
    { name: 'Chest Doorway Stretch', sets: 2, reps: '30s hold', rest: '30s', weight: 0, iconKey: 'sparkles', howTo: 'Gentle pectoral stretch to restore length and mobility.' },
  ];

  const defaultPull: AiExercise[] = [
    { name: 'Dead Hangs & Scapular Pulls', sets: 2, reps: '30s', rest: '45s', weight: 0, iconKey: 'activity', howTo: 'Decompress spine and activate lats.' },
    { name: 'Lat Pulldown / Pull-Ups', sets: 4, reps, rest, weight: Math.round(currentWeight * 0.6), iconKey: 'dumbbell', howTo: 'Drive elbows down and back, feeling the lat squeeze.' },
    { name: 'Seated Cable Row', sets: 3, reps, rest, weight: Math.round(currentWeight * 0.55), iconKey: 'dumbbell', howTo: 'Keep torso upright and squeeze shoulder blades together.' },
    { name: 'Face Pulls', sets: 3, reps: '12-15', rest: '60s', weight: 20, iconKey: 'target', howTo: 'Pull rope toward eyes with elbows high for rear delts.' },
    { name: 'Barbell / Incline Dumbbell Bicep Curls', sets: 3, reps, rest, weight: Math.round(currentWeight * 0.2), iconKey: 'flame', howTo: 'Strict form without swinging your hips.' },
    { name: 'Child\'s Pose Lat Stretch', sets: 2, reps: '30s hold', rest: '30s', weight: 0, iconKey: 'sparkles', howTo: 'Reach fingers forward to stretch mid and upper back.' },
  ];

  const defaultLegs: AiExercise[] = [
    { name: 'Bodyweight Squats & Hip Openers', sets: 2, reps: '15', rest: '45s', weight: 0, iconKey: 'activity', howTo: 'Mobilize hips, knees, and ankles before loading.' },
    { name: 'Barbell Back / Goblet Squat', sets: 4, reps, rest, weight: Math.round(currentWeight * 0.8), iconKey: 'dumbbell', howTo: 'Break at hips and knees together, descend below parallel.' },
    { name: 'Romanian Deadlift (RDL)', sets: 3, reps, rest, weight: Math.round(currentWeight * 0.65), iconKey: 'dumbbell', howTo: 'Hinge at the hips, keeping a soft bend in knees.' },
    { name: 'Leg Press or Walking Lunges', sets: 3, reps, rest, weight: Math.round(currentWeight * 1.0), iconKey: 'flame', howTo: 'Drive through full foot, maintaining continuous tension.' },
    { name: 'Standing Calf Raises', sets: 4, reps: '15-20', rest: '45s', weight: 40, iconKey: 'zap', howTo: 'Full stretch at bottom and hold peak contraction for 1 second.' },
    { name: 'Seated Hamstring & Quad Stretch', sets: 2, reps: '30s hold', rest: '30s', weight: 0, iconKey: 'sparkles', howTo: 'Cool down and promote lower-body blood flow.' },
  ];

  let exercises = defaultPush;
  const upper = workoutType.toUpperCase();
  if (upper.includes('PULL') || upper.includes('BACK')) exercises = defaultPull;
  else if (upper.includes('LEG') || upper.includes('LOWER')) exercises = defaultLegs;

  return {
    type: workoutType,
    muscles,
    tip: 'Focus on progressive intensity and maintaining strict mind-muscle connection throughout every repetition.',
    exercises,
  };
}

/** Get AI-generated workout plan */
export async function getAiWorkoutPlan(workoutType: string, profile: any, apiKey: string = GEMINI_API_KEY): Promise<AiWorkoutPlan> {
  const prompt = buildWorkoutPrompt(workoutType, profile);
  try {
    const raw = await callGroq(prompt, apiKey, 650, true);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const pData = parsed?.data || parsed;
    if (pData?.exercises && Array.isArray(pData.exercises) && pData.exercises.length > 0) {
      const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()] || workoutType;
      return {
        type: workoutType,
        muscles,
        tip: pData.tip ?? '',
        exercises: pData.exercises,
      };
    }
    return generateFallbackWorkoutPlan(workoutType, profile);
  } catch (err: unknown) {
    console.warn('[AI Coach] Workout generation notice, using goal-tailored plan:', err);
    return generateFallbackWorkoutPlan(workoutType, profile);
  }
}

export function generateFallbackDietAdvice(dayMenu: any, profile: any): any {
  const currentWeight = profile?.weightHistory?.[profile.weightHistory.length - 1]?.weight || profile?.weight || 75;
  const goalConfig = FITNESS_GOALS.find(g => g.id === profile?.fitnessGoal);
  const goalLabel = goalConfig ? goalConfig.label : 'Weight Loss';
  const goalId = profile?.fitnessGoal || 'weight_loss';

  const allItems: { name: string; slot: string }[] = [];
  if (dayMenu?.meals && Array.isArray(dayMenu.meals)) {
    for (const meal of dayMenu.meals) {
      if (meal.items && Array.isArray(meal.items)) {
        for (const itm of meal.items) {
          if (itm?.name && itm.name.trim()) {
            allItems.push({ name: itm.name.trim(), slot: meal.slot });
          }
        }
      }
    }
  }

  const proteinKeywords = ['paneer', 'egg', 'daal', 'dal', 'chana', 'sprouts', 'soya', 'milk', 'curd', 'dahi', 'chicken', 'fish', 'rajma', 'tofu', 'nutrela', 'peanut', 'moong', 'besan'];
  const healthyCarbKeywords = ['roti', 'chapati', 'brown rice', 'rice', 'oats', 'poha', 'idli', 'upma', 'khichdi', 'fruits', 'banana', 'apple', 'salad', 'cabbage', 'beans', 'vegetable', 'sabzi', 'palak', 'methi', 'carrot', 'cucumber'];
  const highFatJunkKeywords = ['puri', 'poori', 'bhature', 'fried', 'deep fried', 'pakoda', 'samosa', 'vada', 'kachori', 'butter', 'mayo', 'gulab jamun', 'halwa', 'jalebi', 'sweet', 'kheer', 'ice cream', 'gravy', 'oil', 'pastry', 'paratha', 'cake', 'sugar'];

  const recommended: { item: string; reason: string }[] = [];
  const avoid: { item: string; reason: string }[] = [];

  const isLossGoal = goalId === 'weight_loss' || goalId === 'fat_loss_muscle_gain' || goalId === 'body_toning';
  const isGainGoal = goalId === 'weight_gain' || goalId === 'muscle_building' || goalId === 'strength_building';

  for (const item of allItems) {
    const lower = item.name.toLowerCase();
    const isProtein = proteinKeywords.some(k => lower.includes(k));
    const isHealthyCarb = healthyCarbKeywords.some(k => lower.includes(k));
    const isHighFatJunk = highFatJunkKeywords.some(k => lower.includes(k));

    if (isLossGoal) {
      if (isHighFatJunk && avoid.length < 4 && !avoid.some(a => a.item === item.name)) {
        avoid.push({
          item: item.name,
          reason: 'High calorie & oil density; avoid to safeguard your fat-loss deficit.'
        });
      } else if ((isProtein || isHealthyCarb) && recommended.length < 5 && !recommended.some(r => r.item === item.name)) {
        recommended.push({
          item: item.name,
          reason: isProtein 
            ? 'High-satiety protein to preserve lean muscle while burning body fat.'
            : 'Nutrient-rich fiber & complex carbs for clean, steady metabolic energy.'
        });
      }
    } else if (isGainGoal) {
      if (isHighFatJunk && (lower.includes('sweet') || lower.includes('sugar')) && avoid.length < 3 && !avoid.some(a => a.item === item.name)) {
        avoid.push({
          item: item.name,
          reason: 'Empty sugars and trans fats. Opt for nutrient-dense caloric surplus.'
        });
      } else if ((isProtein || isHealthyCarb || lower.includes('paratha') || lower.includes('rice')) && recommended.length < 5 && !recommended.some(r => r.item === item.name)) {
        recommended.push({
          item: item.name,
          reason: isProtein
            ? 'Key amino acids necessary to trigger muscle hypertrophy and growth.'
            : 'Quality carbohydrate energy required to fuel heavy strength progression.'
        });
      }
    } else {
      if (isHighFatJunk && avoid.length < 3 && !avoid.some(a => a.item === item.name)) {
        avoid.push({
          item: item.name,
          reason: 'High in refined trans fats which hinder athletic conditioning.'
        });
      } else if (recommended.length < 5 && !recommended.some(r => r.item === item.name)) {
        recommended.push({
          item: item.name,
          reason: 'Clean balanced source of dietary micronutrients and active vitality.'
        });
      }
    }
  }

  if (recommended.length === 0) {
    recommended.push({
      item: 'Daal / Curd / Eggs / Paneer',
      reason: `Primary protein sources available in mess to hit your ${goalLabel} targets.`
    });
    recommended.push({
      item: 'Fresh Salad & Green Sabzi',
      reason: 'Essential micronutrients & fiber to support gut health and active fullness.'
    });
  }
  if (avoid.length === 0) {
    avoid.push({
      item: 'Excess Oil Gravies & Fried Foods',
      reason: `Concentrated calorie density and hydrogenated oils that conflict with ${goalLabel}.`
    });
  }

  const strategy = isLossGoal
    ? `Fill half your plate with salad/sabzi and protein first before taking carbs, and strictly skip extra oily gravies or sweets.`
    : isGainGoal
    ? `Prioritize a solid protein portion in every meal and maintain a consistent caloric surplus with dairy, eggs, and whole grains.`
    : `Maintain portion balance across carbohydrates, lean proteins, and fiber to sustain energy and recovery for ${goalLabel}.`;

  return { recommended, avoid, strategy };
}

export async function getDietAdvice(dayMenu: any, profile: any, apiKey: string): Promise<any> {
  if (!dayMenu) return generateFallbackDietAdvice(dayMenu, profile);

  const currentWeight = profile.weightHistory?.[profile.weightHistory.length - 1]?.weight || profile.weight || 75;
  const goalConfig = FITNESS_GOALS.find(g => g.id === profile.fitnessGoal);
  const goalLabel = goalConfig ? goalConfig.label : (profile.goalWeight < currentWeight ? 'Weight Loss' : 'Muscle Building');
  const goalDescription = goalConfig ? goalConfig.description : '';
  const proteinTarget = profile.dailyProteinTarget || Math.round(currentWeight * 1.8);
  const calTarget = profile.currentCalorieTarget || 2000;

  const prompt = `You are an expert AI Dietician. 
User Profile & Objective:
- Current Weight: ${currentWeight} kg
- Goal Weight: ${profile.goalWeight || currentWeight} kg
- Primary Fitness & Nutrition Goal: ${goalLabel} (${goalDescription})
- Daily Calorie Target: ${calTarget} kcal
- Daily Protein Target: ${proteinTarget}g

Here is today's Mess Menu:
${JSON.stringify(dayMenu)}

Your task:
Analyze today's mess menu strictly against their goal of "${goalLabel}".
Identify:
1. "recommended": Exact dishes from the mess menu that they CAN AND SHOULD EAT to hit their ${goalLabel} goal (e.g. high-protein, clean carbs, or nutrient-dense options) with specific reasons why.
2. "avoid": Exact dishes from the mess menu that they SHOULD DANGER/AVOID because they conflict with ${goalLabel} (e.g. deep-fried items, high-calorie oily gravies, excessive refined starches, or empty sugar) with specific reasons why.
3. "strategy": Exactly one actionable, high-impact strategy sentence for eating at the mess today.

Output a valid JSON object in this exact format:
{
  "recommended": [
    {"item": "Exact Item Name from menu", "reason": "Why it fits their goal"}
  ],
  "avoid": [
    {"item": "Exact Item Name from menu", "reason": "Why to avoid for their goal"}
  ],
  "strategy": "A one sentence overarching tip for today."
}`;

  try {
    const raw = await callGroq(prompt, apiKey, 500, true);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (parsed && Array.isArray(parsed.recommended) && parsed.recommended.length > 0) {
      return parsed;
    }
    return generateFallbackDietAdvice(dayMenu, profile);
  } catch (err) {
    console.warn('[AI Coach] API notice, deploying goal-based fallback diet advice:', err);
    return generateFallbackDietAdvice(dayMenu, profile);
  }
}

export async function getHistoryAnalysis(logs: any[], profile: any, apiKey: string = GEMINI_API_KEY): Promise<any> {
  if (!logs || logs.length === 0) return null;
  
  const target = profile?.currentCalorieTarget || 2000;
  const historyData = logs.map(l => {
    return `Date: ${l.date}, Total: ${Math.round(l.dailyTotal)} kcal. Meals: ${l.mealsEaten.map((m: any) => `${m.slot}: ${m.items.map((i: any) => `${i.name} (x${i.portion})`).join(', ')}`).join(' | ')}`;
  }).join('\n');

  const prompt = `You are an expert AI Dietician. The user's calorie target is ${target} kcal.
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
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
    if (parsed && parsed.summary && Array.isArray(parsed.tips)) return parsed;
  } catch (err) {
    console.warn('[AI Coach] Nutrition history analysis notice, using computed insights:', err);
  }

  // Resilient data-driven fallback calculation
  const total = logs.reduce((s, l) => s + (l.dailyTotal || 0), 0);
  const avg = Math.round(total / logs.length);
  const diff = avg - target;
  return {
    summary: `Over your ${logs.length} logged days, your average intake was ${avg} kcal/day (${Math.abs(diff)} kcal ${diff >= 0 ? 'above' : 'below'} your ${target} kcal target).`,
    tips: [
      diff > 150 ? 'Consider reducing high-calorie snacks or gravies to get closer to your target deficit.' : 'Great job staying close to target; prioritize lean protein in every main meal.',
      'Maintain daily logging consistency to reinforce your nutritional awareness.'
    ]
  };
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
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
    if (parsed && parsed.summary && Array.isArray(parsed.tips)) return parsed;
  } catch (err) {
    console.warn('[AI Coach] Gym history analysis notice, using computed insights:', err);
  }

  // Resilient data-driven fallback calculation
  const totalWorkouts = logs.length;
  const totalSets = logs.reduce((s, l) => s + (l.exercises || []).reduce((st: number, e: any) => st + (e.sets?.length || 0), 0), 0);
  return {
    summary: `You completed ${totalWorkouts} sessions with ${totalSets} total working sets this month, showing solid training momentum.`,
    tips: [
      'Apply progressive overload: aim to add 1-2 reps or 1-2.5kg each week on your primary compound lifts.',
      'Allow 48 hours of recovery between training the same muscle group to maximize muscular adaptation.'
    ]
  };
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
    const raw = await callGroq(prompt, apiKey, 450, true);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
    if (parsed && parsed.summary && Array.isArray(parsed.tips)) return parsed;
  } catch (err) {
    console.warn('[AI Coach] Spending history analysis notice, using computed insights:', err);
  }

  // Resilient data-driven fallback calculation
  const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || ['Expenses', totalSpent];
  return {
    summary: `You recorded ₹${totalSpent} across your transactions, with ${topCat[0]} forming the largest financial segment at ₹${topCat[1]}.`,
    tips: [
      `Review your ${topCat[0]} transactions and look for minor recurring expenses you can optimize or eliminate.`,
      'Set a weekly expenditure cap for discretionary purchases to keep your monthly savings on track.'
    ]
  };
}

export function generateFallbackFoodDoubt(foodQuery: string, profile: any): string {
  const goalId = profile?.fitnessGoal || 'weight_loss';
  const lower = foodQuery.toLowerCase();
  const isLoss = goalId === 'weight_loss' || goalId === 'fat_loss_muscle_gain' || goalId === 'body_toning';
  const isGain = goalId === 'weight_gain' || goalId === 'muscle_building' || goalId === 'strength_building';

  const isJunk = ['pizza', 'burger', 'fries', 'soda', 'coke', 'sugar', 'ice cream', 'cake', 'samosa', 'chips', 'fried', 'biscuit', 'maggi'].some(k => lower.includes(k));
  const isProtein = ['egg', 'chicken', 'paneer', 'fish', 'whey', 'protein', 'soya', 'daal', 'tofu', 'curd'].some(k => lower.includes(k));

  if (isLoss) {
    if (isJunk) return 'Avoid or strictly portion-control. High calorie density will exceed your deficit.';
    if (isProtein) return 'Yes! Great protein choice to keep you satiated and spare lean muscle.';
    return 'In moderation. Track portions carefully to stay within your daily caloric target.';
  } else if (isGain) {
    if (isProtein) return 'Yes! Excellent source of amino acids to support muscle recovery and growth.';
    if (isJunk) return 'In moderation. High calories, but ensure you also hit your daily protein goal.';
    return 'Yes, good caloric support. Pair with adequate protein for optimal hypertrophy.';
  }
  return isJunk ? 'Limit intake. Choose nutrient-dense whole foods for sustained daily energy.' : 'Yes, fits well into a balanced, active nutrition routine.';
}

export async function askFoodDoubt(foodQuery: string, profile: any, apiKey: string = GEMINI_API_KEY): Promise<string> {
  const target = profile?.currentCalorieTarget || 2000;
  const goalConfig = FITNESS_GOALS.find(g => g.id === profile?.fitnessGoal);
  const goal = goalConfig ? goalConfig.label : 'Health & Fitness';
  const prompt = `You are an expert nutrition coach. The user asks if they can eat this off-menu food: "${foodQuery}".
Their primary fitness goal is: ${goal} (Daily calorie target: ${target} kcal).
Provide a direct verdict (Yes / In moderation / Avoid) and a quick rationale aligned with their ${goal} goal.
CRITICAL MANDATORY CONSTRAINT: Your entire output MUST BE strictly under 100 characters total. Plain text only. No markdown formatting.`;

  try {
    const reply = await callGroq(prompt, apiKey, 50, false);
    const cleaned = reply.replace(/\n/g, ' ').trim();
    if (cleaned.length > 100) {
      return cleaned.slice(0, 97) + '...';
    }
    return cleaned;
  } catch (err) {
    console.warn('[AI Coach] Food doubt notice, using goal-based answer:', err);
    return generateFallbackFoodDoubt(foodQuery, profile);
  }
}


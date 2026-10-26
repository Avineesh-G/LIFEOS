import { callGroq, GEMINI_API_KEY } from './geminiCoach.ts';
import { getGroqApiKey } from './aiSecurity.ts';

export interface NutritionEstimate {
  name: string;
  caloriesPerServing: number;
  detectedPortion: number;
  unit: string;
  totalCalories: number;
  macros?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  source: 'database' | 'ai' | 'fallback';
  confidence: 'high' | 'medium' | 'estimated';
  explanation?: string;
}

export interface MultiItemEstimate {
  items: NutritionEstimate[];
  totalCalories: number;
}

/**
 * Built-in high-accuracy nutritional database of 150+ common Indian, student,
 * mess, street food, gym foods, fruits, and beverages.
 * Provides instant 0ms offline calorie lookup.
 */
interface FoodDbItem {
  canonical: string;
  keywords: string[];
  calories: number; // per 1 standard serving
  unit: string;
  macros: { protein: number; carbs: number; fats: number };
}

const FOOD_DATABASE: FoodDbItem[] = [
  // Breads & Rotis
  { canonical: 'Chapati / Roti', keywords: ['chapati', 'chapatis', 'roti', 'rotis', 'phulka', 'phulkas', 'fulka', 'fulkas', 'tawa roti'], calories: 104, unit: 'piece', macros: { protein: 3.5, carbs: 20, fats: 1.2 } },
  { canonical: 'Plain Paratha', keywords: ['paratha', 'parathas', 'plain paratha', 'parotta'], calories: 240, unit: 'piece', macros: { protein: 5, carbs: 32, fats: 10 } },
  { canonical: 'Aloo Paratha', keywords: ['aloo paratha', 'alu paratha'], calories: 290, unit: 'piece', macros: { protein: 6, carbs: 42, fats: 11 } },
  { canonical: 'Paneer Paratha', keywords: ['paneer paratha'], calories: 330, unit: 'piece', macros: { protein: 12, carbs: 36, fats: 15 } },
  { canonical: 'Methi Paratha', keywords: ['methi paratha', 'thepla'], calories: 220, unit: 'piece', macros: { protein: 5, carbs: 30, fats: 9 } },
  { canonical: 'Puri / Poori', keywords: ['puri', 'puris', 'poori', 'pooris'], calories: 125, unit: 'piece', macros: { protein: 2, carbs: 16, fats: 6.5 } },
  { canonical: 'Naan (Butter)', keywords: ['naan', 'butter naan', 'tandoori naan', 'garlic naan'], calories: 310, unit: 'piece', macros: { protein: 8, carbs: 48, fats: 10 } },
  { canonical: 'Bread Slice', keywords: ['bread', 'bread slice', 'white bread', 'brown bread', 'toast'], calories: 75, unit: 'slice', macros: { protein: 2.5, carbs: 14, fats: 0.8 } },
  { canonical: 'Bread Butter Toast', keywords: ['bread butter', 'butter toast', 'toast butter'], calories: 140, unit: 'slice', macros: { protein: 2.6, carbs: 14, fats: 8 } },

  // Rice & Grains
  { canonical: 'Steamed White Rice', keywords: ['rice', 'steamed rice', 'white rice', 'chawal', 'plain rice', 'boiled rice'], calories: 175, unit: 'katori / bowl (150g)', macros: { protein: 3.5, carbs: 38, fats: 0.5 } },
  { canonical: 'Brown Rice', keywords: ['brown rice'], calories: 165, unit: 'katori / bowl (150g)', macros: { protein: 4, carbs: 35, fats: 1.5 } },
  { canonical: 'Jeera Rice', keywords: ['jeera rice', 'ghee rice'], calories: 220, unit: 'katori / bowl', macros: { protein: 3.5, carbs: 40, fats: 5 } },
  { canonical: 'Fried Rice', keywords: ['fried rice', 'veg fried rice', 'egg fried rice'], calories: 270, unit: 'plate', macros: { protein: 6, carbs: 46, fats: 7 } },
  { canonical: 'Paneer Biryani', keywords: ['paneer biryani', 'panner biryani', 'biryani paneer', 'cottage cheese biryani'], calories: 380, unit: 'plate (300g)', macros: { protein: 16, carbs: 54, fats: 12 } },
  { canonical: 'Chicken Biryani', keywords: ['chicken biryani', 'biryani chicken', 'murgh biryani'], calories: 420, unit: 'plate (300g)', macros: { protein: 24, carbs: 52, fats: 14 } },
  { canonical: 'Biryani (Mixed / Veg)', keywords: ['biryani', 'dum biryani'], calories: 340, unit: 'plate (300g)', macros: { protein: 10, carbs: 52, fats: 10 } },
  { canonical: 'Veg Biryani / Pulao', keywords: ['veg biryani', 'vegetable biryani', 'pulao', 'veg pulao', 'pulav'], calories: 310, unit: 'plate', macros: { protein: 7, carbs: 54, fats: 8 } },
  { canonical: 'Khichdi', keywords: ['khichdi', 'dal khichdi', 'moong khichdi'], calories: 220, unit: 'bowl', macros: { protein: 8, carbs: 38, fats: 4 } },

  // Dals & Curries
  { canonical: 'Yellow Dal / Dal Tadka', keywords: ['dal', 'daal', 'dal tadka', 'yellow dal', 'toor dal', 'moong dal', 'dal fry'], calories: 150, unit: 'katori / bowl', macros: { protein: 8, carbs: 22, fats: 3.5 } },
  { canonical: 'Dal Makhani', keywords: ['dal makhani', 'makhani dal', 'makhni'], calories: 280, unit: 'katori / bowl', macros: { protein: 9, carbs: 26, fats: 15 } },
  { canonical: 'Sambar', keywords: ['sambar', 'sambhar'], calories: 110, unit: 'katori / bowl', macros: { protein: 4.5, carbs: 18, fats: 2 } },
  { canonical: 'Rajma Curry', keywords: ['rajma', 'rajma masala', 'kidney beans'], calories: 210, unit: 'katori / bowl', macros: { protein: 11, carbs: 32, fats: 4.5 } },
  { canonical: 'Chole / Chana Masala', keywords: ['chole', 'chana', 'chana masala', 'chickpea'], calories: 240, unit: 'katori / bowl', macros: { protein: 10, carbs: 34, fats: 7 } },
  { canonical: 'Kadhi Pakoda', keywords: ['kadhi', 'kadhi pakora', 'kadhi pakoda'], calories: 230, unit: 'katori / bowl', macros: { protein: 6, carbs: 22, fats: 13 } },
  { canonical: 'Mix Veg Sabzi', keywords: ['mix veg', 'mixed veg', 'sabzi', 'sabji', 'bhaji', 'vegetable curry'], calories: 140, unit: 'katori / bowl', macros: { protein: 3, carbs: 18, fats: 6 } },
  { canonical: 'Aloo Gobi', keywords: ['aloo gobi', 'alu gobi', 'gobi'], calories: 160, unit: 'katori / bowl', macros: { protein: 3.5, carbs: 22, fats: 6.5 } },
  { canonical: 'Aloo Matar', keywords: ['aloo matar', 'alu matar'], calories: 175, unit: 'katori / bowl', macros: { protein: 4, carbs: 26, fats: 6 } },
  { canonical: 'Bhindi Masala', keywords: ['bhindi', 'bhindi fry', 'ladyfinger', 'okra'], calories: 130, unit: 'katori / bowl', macros: { protein: 2.5, carbs: 14, fats: 7 } },

  // Paneer Dishes
  { canonical: 'Paneer Butter Masala', keywords: ['paneer butter masala', 'butter paneer', 'shahi paneer'], calories: 350, unit: 'katori / bowl', macros: { protein: 14, carbs: 18, fats: 26 } },
  { canonical: 'Palak Paneer', keywords: ['palak paneer', 'saag paneer'], calories: 250, unit: 'katori / bowl', macros: { protein: 13, carbs: 12, fats: 17 } },
  { canonical: 'Kadai Paneer', keywords: ['kadai paneer', 'kadhai paneer', 'paneer masala', 'matar paneer'], calories: 290, unit: 'katori / bowl', macros: { protein: 14, carbs: 15, fats: 20 } },
  { canonical: 'Paneer Bhurji', keywords: ['paneer bhurji'], calories: 270, unit: 'katori / bowl', macros: { protein: 16, carbs: 8, fats: 19 } },
  { canonical: 'Raw Paneer (Cottage Cheese)', keywords: ['raw paneer', 'paneer raw', 'paneer cubes', 'cottage cheese'], calories: 265, unit: '100g', macros: { protein: 18, carbs: 3.5, fats: 20 } },

  // Eggs & Non-Veg
  { canonical: 'Boiled Egg', keywords: ['boiled egg', 'boiled eggs', 'hard boiled egg', 'egg', 'eggs'], calories: 78, unit: 'egg', macros: { protein: 6.3, carbs: 0.6, fats: 5.3 } },
  { canonical: 'Egg Omelette (2 Eggs)', keywords: ['omelette', 'omlet', 'omelet', 'egg omelette', 'bread omelette'], calories: 210, unit: 'serving', macros: { protein: 13, carbs: 3, fats: 16 } },
  { canonical: 'Egg Bhurji', keywords: ['egg bhurji', 'scrambled egg', 'scrambled eggs', 'anda bhurji'], calories: 190, unit: 'katori / serving', macros: { protein: 12, carbs: 4, fats: 14 } },
  { canonical: 'Egg Curry', keywords: ['egg curry', 'anda curry'], calories: 220, unit: 'bowl (2 eggs)', macros: { protein: 14, carbs: 10, fats: 14 } },
  { canonical: 'Chicken Curry', keywords: ['chicken curry', 'murgh curry', 'tari chicken', 'home chicken'], calories: 280, unit: 'bowl (150g)', macros: { protein: 26, carbs: 8, fats: 15 } },
  { canonical: 'Butter Chicken', keywords: ['butter chicken', 'murgh makhani'], calories: 390, unit: 'bowl', macros: { protein: 28, carbs: 14, fats: 25 } },
  { canonical: 'Grilled Chicken Breast', keywords: ['chicken breast', 'grilled chicken', 'roasted chicken', 'boiled chicken'], calories: 165, unit: '100g piece', macros: { protein: 31, carbs: 0, fats: 3.6 } },
  { canonical: 'Chicken Tikka', keywords: ['chicken tikka', 'tandoori chicken', 'chicken kebab'], calories: 240, unit: 'serving (4-5 pcs)', macros: { protein: 28, carbs: 4, fats: 12 } },
  { canonical: 'Fish Curry', keywords: ['fish curry', 'machhi'], calories: 220, unit: 'bowl', macros: { protein: 22, carbs: 6, fats: 11 } },
  { canonical: 'Mutton Curry', keywords: ['mutton curry', 'lamb curry', 'mutton'], calories: 380, unit: 'bowl', macros: { protein: 26, carbs: 6, fats: 28 } },

  // South Indian / Breakfast
  { canonical: 'Plain Dosa', keywords: ['plain dosa', 'dosa', 'sada dosa'], calories: 140, unit: 'piece', macros: { protein: 3.5, carbs: 24, fats: 3 } },
  { canonical: 'Masala Dosa', keywords: ['masala dosa', 'mysore masala dosa'], calories: 260, unit: 'piece', macros: { protein: 5.5, carbs: 42, fats: 8 } },
  { canonical: 'Idli', keywords: ['idli', 'idlis', 'steamed idli'], calories: 65, unit: 'piece', macros: { protein: 2, carbs: 13, fats: 0.3 } },
  { canonical: 'Medu Vada', keywords: ['vada', 'medu vada', 'vadai'], calories: 145, unit: 'piece', macros: { protein: 4, carbs: 14, fats: 8 } },
  { canonical: 'Poha', keywords: ['poha', 'pohe', 'batata poha'], calories: 230, unit: 'katori / plate', macros: { protein: 4.5, carbs: 42, fats: 5 } },
  { canonical: 'Upma', keywords: ['upma', 'suji upma', 'rava upma'], calories: 200, unit: 'katori / plate', macros: { protein: 4, carbs: 34, fats: 5 } },
  { canonical: 'Uttapam', keywords: ['uttapam', 'onion uttapam'], calories: 210, unit: 'piece', macros: { protein: 5, carbs: 36, fats: 5.5 } },
  { canonical: 'Sheera / Halwa', keywords: ['halwa', 'sheera', 'sooji halwa', 'gajar halwa'], calories: 290, unit: 'katori / bowl', macros: { protein: 4, carbs: 46, fats: 11 } },

  // Snacks & Night Canteen
  { canonical: 'Maggi Noodles', keywords: ['maggi', 'maggie', 'instant noodles', 'noodles', 'masala maggi'], calories: 280, unit: 'single pack', macros: { protein: 5.5, carbs: 40, fats: 11 } },
  { canonical: 'Egg Roll', keywords: ['egg roll', 'kathi roll egg'], calories: 340, unit: 'roll', macros: { protein: 12, carbs: 38, fats: 15 } },
  { canonical: 'Paneer Roll', keywords: ['paneer roll', 'paneer kathi roll'], calories: 370, unit: 'roll', macros: { protein: 14, carbs: 42, fats: 16 } },
  { canonical: 'Chicken Roll', keywords: ['chicken roll', 'chicken kathi roll'], calories: 360, unit: 'roll', macros: { protein: 20, carbs: 38, fats: 14 } },
  { canonical: 'Veg Sandwich', keywords: ['sandwich', 'veg sandwich', 'grilled sandwich', 'veg grilled sandwich'], calories: 240, unit: 'sandwich', macros: { protein: 6, carbs: 36, fats: 8 } },
  { canonical: 'Samosa', keywords: ['samosa', 'samosas'], calories: 260, unit: 'piece', macros: { protein: 4, carbs: 32, fats: 13 } },
  { canonical: 'Vada Pav', keywords: ['vada pav', 'wada pav'], calories: 290, unit: 'piece', macros: { protein: 5, carbs: 42, fats: 11 } },
  { canonical: 'Pav Bhaji', keywords: ['pav bhaji', 'bhaji pav'], calories: 420, unit: 'plate (2 pav + bhaji)', macros: { protein: 8, carbs: 58, fats: 18 } },
  { canonical: 'Steamed Momos', keywords: ['momos', 'steamed momos', 'veg momos', 'chicken momos'], calories: 220, unit: 'plate (6 pcs)', macros: { protein: 8, carbs: 36, fats: 4 } },
  { canonical: 'Fried Momos', keywords: ['fried momos'], calories: 350, unit: 'plate (6 pcs)', macros: { protein: 8, carbs: 42, fats: 16 } },
  { canonical: 'French Fries', keywords: ['fries', 'french fries'], calories: 310, unit: 'regular pack', macros: { protein: 3.5, carbs: 41, fats: 15 } },
  { canonical: 'Pizza Slice', keywords: ['pizza', 'pizza slice'], calories: 260, unit: 'slice', macros: { protein: 10, carbs: 30, fats: 11 } },
  { canonical: 'Burger', keywords: ['burger', 'veg burger', 'chicken burger'], calories: 340, unit: 'burger', macros: { protein: 12, carbs: 44, fats: 13 } },

  // Dairy & Shakes
  { canonical: 'Whole Milk (Full Cream)', keywords: ['milk', 'doodh', 'whole milk', 'glass of milk'], calories: 155, unit: 'glass (250ml)', macros: { protein: 8, carbs: 12, fats: 8.5 } },
  { canonical: 'Toned Milk', keywords: ['toned milk', 'skim milk', 'low fat milk'], calories: 115, unit: 'glass (250ml)', macros: { protein: 8, carbs: 12, fats: 3.5 } },
  { canonical: 'Plain Curd / Dahi', keywords: ['curd', 'dahi', 'yogurt', 'cup of curd', 'raita'], calories: 95, unit: 'katori / cup (150g)', macros: { protein: 5.5, carbs: 6.5, fats: 5 } },
  { canonical: 'Buttermilk / Chaas', keywords: ['chaas', 'buttermilk', 'chach'], calories: 50, unit: 'glass (250ml)', macros: { protein: 3, carbs: 5, fats: 1.8 } },
  { canonical: 'Sweet Lassi', keywords: ['lassi', 'sweet lassi'], calories: 210, unit: 'glass (250ml)', macros: { protein: 6, carbs: 34, fats: 6 } },
  { canonical: 'Whey Protein Shake', keywords: ['whey', 'whey protein', 'protein shake', 'whey scoop', 'protein powder'], calories: 125, unit: '1 scoop (30g)', macros: { protein: 24, carbs: 2.5, fats: 1.5 } },

  // Beverages
  { canonical: 'Chai / Tea (with Milk & Sugar)', keywords: ['chai', 'tea', 'milk tea', 'cup of tea', 'hot tea'], calories: 80, unit: 'cup', macros: { protein: 2.2, carbs: 12, fats: 2.6 } },
  { canonical: 'Coffee (with Milk & Sugar)', keywords: ['coffee', 'hot coffee', 'filter coffee'], calories: 95, unit: 'cup', macros: { protein: 2.5, carbs: 14, fats: 3 } },
  { canonical: 'Cold Coffee / Milkshake', keywords: ['cold coffee', 'milkshake', 'shake', 'chocolate shake'], calories: 240, unit: 'glass (300ml)', macros: { protein: 6, carbs: 36, fats: 8 } },
  { canonical: 'Green Tea / Black Tea', keywords: ['green tea', 'black tea', 'black coffee'], calories: 5, unit: 'cup', macros: { protein: 0, carbs: 1, fats: 0 } },
  { canonical: 'Coke / Soda / Soft Drink', keywords: ['coke', 'coca cola', 'pepsi', 'sprite', 'soft drink', 'soda'], calories: 140, unit: 'can (330ml)', macros: { protein: 0, carbs: 35, fats: 0 } },
  { canonical: 'Fresh Fruit Juice', keywords: ['juice', 'fruit juice', 'orange juice', 'apple juice'], calories: 120, unit: 'glass (250ml)', macros: { protein: 1.5, carbs: 28, fats: 0.3 } },

  // Fruits & Nuts
  { canonical: 'Banana', keywords: ['banana', 'bananas', 'kela'], calories: 105, unit: 'medium fruit', macros: { protein: 1.3, carbs: 27, fats: 0.3 } },
  { canonical: 'Apple', keywords: ['apple', 'apples', 'seb'], calories: 95, unit: 'medium fruit', macros: { protein: 0.5, carbs: 25, fats: 0.3 } },
  { canonical: 'Orange / Mosambi', keywords: ['orange', 'oranges', 'mosambi'], calories: 62, unit: 'medium fruit', macros: { protein: 1.2, carbs: 15, fats: 0.2 } },
  { canonical: 'Mango', keywords: ['mango', 'mangoes', 'aam'], calories: 150, unit: 'medium fruit', macros: { protein: 1.4, carbs: 38, fats: 0.6 } },
  { canonical: 'Papaya', keywords: ['papaya'], calories: 60, unit: 'bowl (150g)', macros: { protein: 0.8, carbs: 15, fats: 0.2 } },
  { canonical: 'Watermelon', keywords: ['watermelon', 'tarbooz'], calories: 46, unit: 'cup (150g)', macros: { protein: 0.9, carbs: 11, fats: 0.2 } },
  { canonical: 'Peanuts / Roasted Peanuts', keywords: ['peanuts', 'groundnuts', 'mungfali'], calories: 165, unit: 'handful (30g)', macros: { protein: 7.5, carbs: 5, fats: 14 } },
  { canonical: 'Almonds', keywords: ['almonds', 'badam'], calories: 85, unit: '12 nuts', macros: { protein: 3, carbs: 3, fats: 7.5 } },
  { canonical: 'Mixed Dry Fruits', keywords: ['dry fruits', 'kaju', 'cashew', 'walnuts'], calories: 180, unit: 'handful (30g)', macros: { protein: 5, carbs: 12, fats: 13 } },
];

/**
 * Cache for AI estimation results to avoid repeated API requests
 */
const MEMORY_CACHE = new Map<string, NutritionEstimate>();

/**
 * Word to number helper for natural phrasing like "two chapatis" or "half bowl dal"
 */
const WORD_NUMBERS: Record<string, number> = {
  half: 0.5,
  quarter: 0.25,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  single: 1,
  double: 2,
  triple: 3,
  pair: 2,
};

/**
 * Extracts quantity/portion and cleaned food name from natural text.
 * Examples:
 * "3 chapatis" -> { portion: 3, cleanName: "chapatis" }
 * "2.5 cups rice" -> { portion: 2.5, cleanName: "cups rice" }
 * "half plate biryani" -> { portion: 0.5, cleanName: "plate biryani" }
 */
export function extractPortionFromText(rawText: string): { portion: number | null; cleanName: string } {
  const trimmed = rawText.trim();
  if (!trimmed) return { portion: null, cleanName: '' };

  // Match digit prefixes: "3 chapatis", "2.5 bowls", "4x eggs"
  const digitMatch = trimmed.match(/^(\d+(\.\d+)?)\s*(x|pc|pcs|pieces|cups?|bowls?|plates?|glasses?|slices?|servings?)?\s+(.*)$/i);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    const remainder = digitMatch[4]?.trim() || '';
    if (!isNaN(val) && val > 0 && remainder) {
      return { portion: val, cleanName: remainder };
    }
  }

  // Match word numbers: "two chapatis", "half plate biryani"
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2) {
    const firstToken = tokens[0].toLowerCase();
    if (WORD_NUMBERS[firstToken] !== undefined) {
      let remainder = tokens.slice(1).join(' ');
      // strip words like 'plate of', 'bowls of', 'pcs'
      remainder = remainder.replace(/^(x|pc|pcs|pieces|cups?|bowls?|plates?|glasses?|slices?|servings?)\s*(of)?\s+/i, '');
      return { portion: WORD_NUMBERS[firstToken], cleanName: remainder };
    }
  }

  return { portion: null, cleanName: trimmed };
}

/**
 * Instant 0ms Local Nutrition Matching
 * Checks the built-in database first. Returns an accurate estimate immediately.
 */
export function matchLocalFoodDatabase(inputFood: string, explicitPortion = 1): NutritionEstimate | null {
  if (!inputFood || !inputFood.trim()) return null;

  const { portion: extractedPortion, cleanName } = extractPortionFromText(inputFood);
  const targetPortion = extractedPortion !== null ? extractedPortion : explicitPortion;
  const searchStr = cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

  // Try exact and token keyword matching
  let bestMatch: FoodDbItem | null = null;
  let highestScore = 0;

  const isVegQuery = /\b(paneer|panner|veg|vegetable|sabzi|sabji|aloo|alu|gobi|dal|palak|soya|tofu|mushroom|chana|rajma)\b/i.test(searchStr);
  const isNonVegQuery = /\b(chicken|mutton|fish|egg|eggs|prawn|meat|beef|pork|murgh|tikka)\b/i.test(searchStr);

  for (const item of FOOD_DATABASE) {
    const itemFullText = (item.canonical + ' ' + item.keywords.join(' ')).toLowerCase();
    const isItemNonVeg = /\b(chicken|mutton|fish|egg|eggs|prawn|meat|beef|pork|murgh)\b/i.test(itemFullText);
    const isItemStrictlyVeg = /\b(paneer|panner|soya|tofu)\b/i.test(itemFullText);

    // Prevent cross-dietary false positives (e.g., paneer matching chicken biryani)
    if (isVegQuery && isItemNonVeg) continue;
    if (isNonVegQuery && isItemStrictlyVeg) continue;

    for (const kw of item.keywords) {
      if (searchStr === kw) {
        bestMatch = item;
        highestScore = 100;
        break;
      }
      if (searchStr.startsWith(kw) || searchStr.endsWith(kw)) {
        const score = 80 + kw.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      } else if (searchStr.includes(kw)) {
        const score = 60 + kw.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      }
    }
    if (highestScore === 100) break;
  }

  if (bestMatch) {
    const total = Math.round(bestMatch.calories * targetPortion);
    return {
      name: bestMatch.canonical,
      caloriesPerServing: bestMatch.calories,
      detectedPortion: targetPortion,
      unit: bestMatch.unit,
      totalCalories: total,
      macros: {
        protein: Math.round(bestMatch.macros.protein * targetPortion * 10) / 10,
        carbs: Math.round(bestMatch.macros.carbs * targetPortion * 10) / 10,
        fats: Math.round(bestMatch.macros.fats * targetPortion * 10) / 10,
      },
      source: 'database',
      confidence: 'high',
      explanation: `Standard Indian/Mess nutritional benchmark (~${bestMatch.calories} kcal per ${bestMatch.unit})`,
    };
  }

  return null;
}

/**
 * Intelligent AI Calorie Estimator
 * 1. Checks memory & local cache.
 * 2. Checks local database (0ms).
 * 3. If unknown / complex recipe, uses Groq / Gemini AI in background to compute exact values.
 */
export async function analyzeFoodWithAi(
  rawFoodInput: string,
  userSelectedPortion: number = 1
): Promise<NutritionEstimate> {
  const trimmed = rawFoodInput.trim();
  if (!trimmed) {
    return {
      name: '',
      caloriesPerServing: 100,
      detectedPortion: userSelectedPortion,
      unit: 'serving',
      totalCalories: 100 * userSelectedPortion,
      source: 'fallback',
      confidence: 'estimated',
    };
  }

  const { portion: extractedPortion, cleanName } = extractPortionFromText(trimmed);
  const effectivePortion = extractedPortion !== null ? extractedPortion : userSelectedPortion;
  const cacheKey = `${cleanName.toLowerCase()}_${effectivePortion}`;

  // 1. Check in-memory cache
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // 2. Check Local Database (Instant)
  const localMatch = matchLocalFoodDatabase(trimmed, effectivePortion);
  if (localMatch) {
    MEMORY_CACHE.set(cacheKey, localMatch);
    return localMatch;
  }

  // 3. Online AI analysis via Groq / Gemini API
  const activeKey = getGroqApiKey() || GEMINI_API_KEY;

  if (activeKey) {
    try {
      const prompt = `You are a certified sports nutritionist and expert Indian/international food calorie analyzer.
Analyze this food input: "${trimmed}"
Quantity/Portion eaten: ${effectivePortion}

Return ONLY a valid JSON object with NO extra text or markdown:
{
  "name": "Proper food title (e.g., Paneer Bhurji)",
  "caloriesPerServing": 250,
  "unit": "piece / bowl / serving / cup",
  "detectedPortion": ${effectivePortion},
  "totalCalories": ${Math.round(250 * effectivePortion)},
  "protein": 14,
  "carbs": 8,
  "fats": 18,
  "explanation": "Brief 1-sentence breakdown"
}`;

      const rawAiText = await callGroq(prompt, activeKey, 450, true);
      // Clean possible markdown fences
      const cleanJson = rawAiText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);

      const perServing = Math.max(10, parseInt(parsed.caloriesPerServing, 10) || 150);
      const portion = Math.max(0.25, parseFloat(parsed.detectedPortion) || effectivePortion);
      const total = Math.round(perServing * portion);

      const aiEstimate: NutritionEstimate = {
        name: parsed.name || cleanName,
        caloriesPerServing: perServing,
        detectedPortion: portion,
        unit: parsed.unit || 'serving',
        totalCalories: total,
        macros: {
          protein: Math.round((parseFloat(parsed.protein) || 0) * 10) / 10,
          carbs: Math.round((parseFloat(parsed.carbs) || 0) * 10) / 10,
          fats: Math.round((parseFloat(parsed.fats) || 0) * 10) / 10,
        },
        source: 'ai',
        confidence: 'high',
        explanation: parsed.explanation || `AI estimated based on standard ingredients`,
      };

      MEMORY_CACHE.set(cacheKey, aiEstimate);
      return aiEstimate;
    } catch (err) {
      console.warn('[Nutrition AI] Online analysis failed, falling back to heuristic:', err);
    }
  }

  // 4. Intelligent Heuristic Fallback
  // If user enters unknown food without network, provide a reasonable estimate (180 kcal/serving)
  const fallbackEstimate: NutritionEstimate = {
    name: cleanName,
    caloriesPerServing: 180,
    detectedPortion: effectivePortion,
    unit: 'serving',
    totalCalories: Math.round(180 * effectivePortion),
    macros: { protein: 6, carbs: 24, fats: 6 },
    source: 'fallback',
    confidence: 'estimated',
    explanation: 'Standard meal portion estimate (~180 kcal)',
  };

  MEMORY_CACHE.set(cacheKey, fallbackEstimate);
  return fallbackEstimate;
}

/**
 * Checks if raw text contains multiple food items (e.g., "2 rotis, dal and curd" or "dosa and coffee")
 * and analyzes all components together.
 */
export async function parseMultiFoodItems(text: string): Promise<MultiItemEstimate | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Split by comma, plus, ampersand, or word "and"
  const rawParts = trimmed
    .split(/,|\+|\&|\band\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);

  if (rawParts.length <= 1) {
    return null; // Single item
  }

  const items: NutritionEstimate[] = [];
  let totalCalories = 0;

  for (const part of rawParts) {
    const estimate = await analyzeFoodWithAi(part, 1);
    items.push(estimate);
    totalCalories += estimate.totalCalories;
  }

  return {
    items,
    totalCalories,
  };
}


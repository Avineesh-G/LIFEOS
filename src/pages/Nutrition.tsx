import React, { useState, useMemo, useEffect, useCallback, startTransition } from 'react';
import { format } from 'date-fns';
import type { AppData, MealSlot, NutritionLog, MealItemLog } from '../types';
import type { MonthlyMenu } from '../data/messMenu';
import { triggerHaptic } from '../utils/haptics';
import { LunaComicBubbleIcon } from '../ui/tokens/LunaComicBubbleIcon';
import { SplitCalorieCircle, type MealSlotCalorieData } from '../components/nutrition/SplitCalorieCircle';
import { MealSlotCard, type MealSlotConfig } from '../components/nutrition/MealSlotCard';
import {
  LargeTitleHeader,
  ProgressBar,
  Sheet,
  TextField,
  Button,
  Sun,
  Moon,
  Plus,
  Minus,
  Drop,
  Sparkle,
} from '../ui';
import {
  analyzeFoodWithAi,
  matchLocalFoodDatabase,
  extractPortionFromText,
  parseMultiFoodItems,
  getInitialAiProteinMap,
  resolveItemProteinLocal,
  estimateFoodBatchWithAi,
  NutritionEstimate,
  MultiItemEstimate,
} from '../utils/aiNutrition';

interface NutritionProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

// Cached dynamically loaded mess menu so repeat visits are instant without bundling cost on first route commit
let cachedMonthlyMessMenu: MonthlyMenu[] | null = null;
const EMPTY_MEAL_ITEMS: MealItemLog[] = [];

const MEAL_SLOTS: MealSlotConfig[] = [
  { slot: 'breakfast', label: 'Breakfast', shortLabel: 'BRK', icon: <Sun size={18} weight="bold" />, time: '7:30–9:45 AM', color: '#7B4B36', textColor: '#E8B89E', estBudget: 500 },
  { slot: 'lunch', label: 'Lunch', shortLabel: 'LUNCH', icon: <Sun size={18} weight="bold" />, time: '12:15–2:45 PM', color: '#8C5841', textColor: '#D29B7E', estBudget: 750 },
  { slot: 'snacks', label: 'Snacks', shortLabel: 'SNACK', icon: <Sun size={18} weight="bold" />, time: '4:15–6:15 PM', color: '#A46D52', textColor: '#F2CEBA', estBudget: 250 },
  { slot: 'dinner', label: 'Dinner', shortLabel: 'DINNER', icon: <Moon size={18} weight="bold" />, time: '7:15–9:30 PM', color: '#6B3F2D', textColor: '#DCA88E', estBudget: 700 },
  { slot: 'nightCanteen', label: 'Night Canteen', shortLabel: 'NIGHT', icon: <Moon size={18} weight="bold" />, time: '10:30 PM–12:30 AM', color: '#945C44', textColor: '#ECC1AB', estBudget: 300 },
];

const NIGHT_CANTEEN_PRESETS = [
  { name: 'Maggi (Plain / Masala)', estCalories: 280 },
  { name: 'Egg Roll / Paneer Roll', estCalories: 320 },
  { name: 'Cold Coffee / Milkshake', estCalories: 220 },
  { name: 'Bread Omelette (2 Eggs)', estCalories: 260 },
  { name: 'Grilled Sandwich', estCalories: 250 },
];

export default function Nutrition({ data, updateData }: NutritionProps) {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const dayOfMonth = useMemo(() => new Date().getDate(), []);

  // Selected meal slot for highlight/focus
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | null>(null);

  // Lazy-load the 5,800-line mess menu dataset after first route paint to keep Home -> Nutrition transition instant
  const [monthlyMessMenu, setMonthlyMessMenu] = useState<MonthlyMenu[]>(() => cachedMonthlyMessMenu || []);
  useEffect(() => {
    if (cachedMonthlyMessMenu) return;
    let cancelled = false;
    import('../data/messMenu')
      .then((mod) => {
        cachedMonthlyMessMenu = mod.MONTHLY_MESS_MENU;
        if (!cancelled) {
          startTransition(() => {
            setMonthlyMessMenu(mod.MONTHLY_MESS_MENU);
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to lazy-load mess menu:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Progressive slot hydration: mount first 2 slots immediately (< 6ms commit),
  // then mount remaining slots after the 220ms dock droplet slide settles
  const [visibleSlotCount, setVisibleSlotCount] = useState(2);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        startTransition(() => {
          setVisibleSlotCount(MEAL_SLOTS.length);
        });
      }
    }, 240);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Active day's nutrition log
  const todayLog = useMemo(() => {
    return (
      (data.nutritionLogs || []).find((n) => n.date === todayStr) || {
        id: `nut_${todayStr}`,
        date: todayStr,
        dailyTotal: 0,
        mealsEaten: [],
      }
    );
  }, [data.nutritionLogs, todayStr]);

  const calorieTarget = data.profile?.currentCalorieTarget || 2200;
  const caloriesEaten = todayLog.dailyTotal || 0;
  const caloriesRemaining = Math.max(0, calorieTarget - caloriesEaten);
  const caloriePercent = Math.min(1, caloriesEaten / calorieTarget);

  // Calorie and skip data for the 5 meal slots
  const slotsCalorieData = useMemo<MealSlotCalorieData[]>(() => {
    return MEAL_SLOTS.map((slot) => {
      const slotLog = (todayLog.mealsEaten || []).find((m) => m.slot === slot.slot);
      const isSkipped = Boolean(slotLog?.isSkipped);
      const slotItems = isSkipped ? EMPTY_MEAL_ITEMS : slotLog?.items || EMPTY_MEAL_ITEMS;
      const calories = slotItems.reduce(
        (sum, it) => sum + it.calories * (it.portion || 1),
        0
      );
      return {
        slot: slot.slot,
        label: slot.label,
        shortLabel: slot.shortLabel,
        time: slot.time,
        color: slot.color,
        textColor: slot.textColor,
        calories,
        isSkipped,
        estBudget: slot.estBudget,
      };
    });
  }, [todayLog.mealsEaten]);

  // Ensure all slots are visible and smoothly scroll to a meal slot card
  const handleSelectSlot = useCallback((slot: MealSlot) => {
    setVisibleSlotCount(MEAL_SLOTS.length);
    setSelectedSlot((prev) => (prev === slot ? null : slot));
    requestAnimationFrame(() => {
      const targetEl = document.getElementById(`meal-slot-${slot}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  // Today's mess menu items mapped by meal slot
  const todayMess = useMemo(() => {
    return monthlyMessMenu.find((m) => m.date === dayOfMonth) || monthlyMessMenu[0];
  }, [monthlyMessMenu, dayOfMonth]);

  const messItemsBySlot = useMemo(() => {
    const map: Record<string, { name: string; estCalories: number; estProtein?: number }[]> = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
      nightCanteen: NIGHT_CANTEEN_PRESETS,
    };

    (todayMess?.meals || []).forEach((m) => {
      if (map[m.slot]) {
        map[m.slot] = m.items;
      }
    });

    return map;
  }, [todayMess]);

  // AI Protein Cache & Batch Resolver (resolves protein via Groq AI + persistent cache for all items)
  const [aiProteinMap, setAiProteinMap] = useState<Record<string, number>>(() => getInitialAiProteinMap());

  useEffect(() => {
    const allItemsToResolve: { name: string; estCalories?: number }[] = [
      ...NIGHT_CANTEEN_PRESETS,
      ...(todayMess?.meals || []).flatMap((m) => m.items),
      ...(todayLog.mealsEaten || []).flatMap((m) =>
        m.isSkipped
          ? []
          : m.items
              .filter((it) => it.protein === undefined)
              .map((it) => ({ name: it.name, estCalories: it.calories }))
      ),
    ];

    if (allItemsToResolve.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      estimateFoodBatchWithAi(allItemsToResolve)
        .then((resolved) => {
          if (cancelled || Object.keys(resolved).length === 0) return;
          setAiProteinMap((prev) => ({ ...prev, ...resolved }));
        })
        .catch(() => {});
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [todayMess, todayLog.mealsEaten]);

  // Real summed daily macros (uses AI/logged protein per item instead of flat calorie % ratio)
  const macroTotals = useMemo(() => {
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    for (const slotLog of todayLog.mealsEaten || []) {
      if (slotLog.isSkipped) continue;
      for (const it of slotLog.items || EMPTY_MEAL_ITEMS) {
        const portion = it.portion || 1;
        const unitProtein =
          it.protein !== undefined
            ? it.protein
            : resolveItemProteinLocal(it.name, it.calories, aiProteinMap);
        protein += unitProtein * portion;
        carbs += (it.carbs !== undefined ? it.carbs : it.calories * 0.12) * portion;
        fats += (it.fats !== undefined ? it.fats : it.calories * 0.03) * portion;
      }
    }

    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    };
  }, [todayLog.mealsEaten, aiProteinMap]);

  // Custom Food / Outside Food AI Logging State
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customSlot, setCustomSlot] = useState<MealSlot>('lunch');
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customPortion, setCustomPortion] = useState(1);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<NutritionEstimate | null>(null);
  const [multiItemEstimate, setMultiItemEstimate] = useState<MultiItemEstimate | null>(null);

  // Reset or initialize state when modal opens/closes
  useEffect(() => {
    if (!isAddCustomOpen) {
      setCustomName('');
      setCustomCalories('');
      setCustomProtein('');
      setCustomPortion(1);
      setAiEstimate(null);
      setMultiItemEstimate(null);
      setIsAiAnalyzing(false);
    }
  }, [isAddCustomOpen]);

  // Synchronous immediate local lookup + debounced online AI calorie & protein estimation
  useEffect(() => {
    const trimmed = customName.trim();
    if (!trimmed) {
      setAiEstimate(null);
      setMultiItemEstimate(null);
      setCustomCalories('');
      setCustomProtein('');
      setIsAiAnalyzing(false);
      return;
    }

    // 1. Auto-extract portion if mentioned in food name (e.g. "3 rotis", "2 eggs")
    const { portion: extractedPortion } = extractPortionFromText(trimmed);
    const effectivePortion = extractedPortion !== null ? extractedPortion : customPortion;
    if (extractedPortion !== null && extractedPortion !== customPortion) {
      setCustomPortion(extractedPortion);
    }

    // 2. Instant 0ms database lookup to populate calories and protein immediately
    const instantMatch = matchLocalFoodDatabase(trimmed, effectivePortion);
    if (instantMatch) {
      setCustomCalories(instantMatch.caloriesPerServing.toString());
      if (instantMatch.macros) {
        setCustomProtein(instantMatch.macros.protein.toString());
      }
      setAiEstimate(instantMatch);
    }

    // 3. Debounced AI Analysis (prefers online Groq AI so outside meals get accurate kcal & protein)
    let isCancelled = false;
    setIsAiAnalyzing(true);

    const timer = setTimeout(async () => {
      try {
        const multi = await parseMultiFoodItems(trimmed, true);
        if (isCancelled) return;
        if (multi && multi.items.length > 1) {
          setMultiItemEstimate(multi);
          setAiEstimate(null);
          setCustomCalories(multi.totalCalories.toString());
          setCustomProtein(multi.totalProtein.toString());
          setIsAiAnalyzing(false);
          return;
        } else {
          setMultiItemEstimate(null);
        }

        const estimate = await analyzeFoodWithAi(trimmed, effectivePortion, true);
        if (isCancelled) return;
        setAiEstimate(estimate);
        setCustomCalories(estimate.caloriesPerServing.toString());
        const estProtein =
          estimate.macros?.protein ??
          resolveItemProteinLocal(estimate.name, estimate.caloriesPerServing, aiProteinMap);
        setCustomProtein(estProtein.toString());
      } catch (err) {
        console.warn('AI Food analysis error:', err);
      } finally {
        if (!isCancelled) setIsAiAnalyzing(false);
      }
    }, 320);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [customName, customPortion, aiProteinMap]);

  const commitMealsUpdate = useCallback(
    async (currentMeals: NutritionLog['mealsEaten']) => {
      const newDailyTotal = currentMeals.reduce(
        (sum, m) => sum + m.items.reduce((iSum, it) => iSum + it.calories * (it.portion || 1), 0),
        0
      );

      const updatedLog: NutritionLog = {
        ...todayLog,
        dailyTotal: newDailyTotal,
        mealsEaten: currentMeals,
        isSaved: true,
      };

      const updatedLogs = [
        updatedLog,
        ...(data.nutritionLogs || []).filter((n) => n.date !== todayStr),
      ];
      await updateData({ nutritionLogs: updatedLogs });
    },
    [todayLog, data.nutritionLogs, todayStr, updateData]
  );

  // Toggle or select a mess item directly from the meals diary
  const handleToggleMessItem = useCallback(
    async (slot: MealSlot, itemName: string, estCalories: number, estProtein?: number) => {
      const currentMeals = (todayLog.mealsEaten || []).map((m) => ({
        ...m,
        items: [...m.items],
      }));
      const slotIndex = currentMeals.findIndex((m) => m.slot === slot);

      if (slotIndex >= 0 && currentMeals[slotIndex].isSkipped) {
        triggerHaptic('error');
        return;
      }

      const resolvedProtein =
        estProtein !== undefined
          ? estProtein
          : resolveItemProteinLocal(itemName, estCalories, aiProteinMap);

      triggerHaptic('selection');

      if (slotIndex >= 0) {
        const existingItemIndex = currentMeals[slotIndex].items.findIndex(
          (it) => it.name.toLowerCase() === itemName.toLowerCase()
        );

        if (existingItemIndex >= 0) {
          currentMeals[slotIndex].items.splice(existingItemIndex, 1);
        } else {
          currentMeals[slotIndex].items.push({
            id: `item_${Date.now()}_${Math.random()}`,
            name: itemName,
            calories: estCalories,
            protein: resolvedProtein,
            portion: 1,
            isExtra: false,
          });
        }
      } else {
        currentMeals.push({
          slot,
          items: [
            {
              id: `item_${Date.now()}_${Math.random()}`,
              name: itemName,
              calories: estCalories,
              protein: resolvedProtein,
              portion: 1,
              isExtra: false,
            },
          ],
        });
      }

      await commitMealsUpdate(currentMeals);
    },
    [todayLog.mealsEaten, aiProteinMap, commitMealsUpdate]
  );

  // Adjust portion quantity for any logged food item
  const handleUpdateItemPortion = useCallback(
    async (slot: MealSlot, itemId: string, delta: number) => {
      let currentMeals = (todayLog.mealsEaten || []).map((m) => ({
        ...m,
        items: [...m.items],
      }));
      const slotIndex = currentMeals.findIndex((m) => m.slot === slot);
      if (slotIndex < 0 || currentMeals[slotIndex].isSkipped) return;
      triggerHaptic('selection');

      const itemIndex = currentMeals[slotIndex].items.findIndex((it) => it.id === itemId);
      if (itemIndex < 0) return;

      const currentItem = currentMeals[slotIndex].items[itemIndex];
      const nextPortion = Math.max(0, Math.round(((currentItem.portion || 1) + delta) * 10) / 10);

      if (nextPortion <= 0) {
        currentMeals[slotIndex].items.splice(itemIndex, 1);
      } else {
        currentMeals[slotIndex].items[itemIndex] = {
          ...currentItem,
          portion: nextPortion,
        };
      }

      if (currentMeals[slotIndex].items.length === 0) {
        currentMeals = currentMeals.filter((m) => m.slot !== slot);
      }

      await commitMealsUpdate(currentMeals);
    },
    [todayLog.mealsEaten, commitMealsUpdate]
  );

  // Add a custom extra food item with portion multiplier (AI Auto-Implemented)
  const handleLogCustomFood = async () => {
    if (!customName.trim()) return;

    const currentMeals = (todayLog.mealsEaten || []).map((m) => ({
      ...m,
      items: [...m.items],
    }));
    const slotIndex = currentMeals.findIndex((m) => m.slot === customSlot);

    if (slotIndex >= 0 && currentMeals[slotIndex].isSkipped) {
      triggerHaptic('error');
      setIsAddCustomOpen(false);
      return;
    }

    triggerHaptic('success');

    if (multiItemEstimate && multiItemEstimate.items.length > 1) {
      const newItems: MealItemLog[] = multiItemEstimate.items.map((it, idx) => {
        const itemProtein =
          it.macros?.protein ??
          resolveItemProteinLocal(it.name, it.caloriesPerServing, aiProteinMap);
        return {
          id: `item_${Date.now()}_${idx}`,
          name: it.name,
          calories: it.caloriesPerServing,
          protein: Math.round(itemProtein * 10) / 10,
          carbs: it.macros?.carbs,
          fats: it.macros?.fats,
          portion: it.detectedPortion || 1,
          isExtra: true,
        };
      });

      if (slotIndex >= 0) {
        currentMeals[slotIndex].items.push(...newItems);
      } else {
        currentMeals.push({ slot: customSlot, items: newItems });
      }
    } else {
      const finalName = (customName.trim() || aiEstimate?.name || 'Food item').trim();
      const caloriesNum = parseInt(customCalories, 10) || (aiEstimate?.caloriesPerServing ?? 100);
      const parsedProtein = parseFloat(customProtein);
      const proteinNum = !Number.isNaN(parsedProtein)
        ? Math.max(0, parsedProtein)
        : aiEstimate?.macros?.protein ??
          resolveItemProteinLocal(finalName, caloriesNum, aiProteinMap);
      const portionNum = Math.max(0.5, customPortion || 1);

      const newItem: MealItemLog = {
        id: `item_${Date.now()}`,
        name: finalName,
        calories: caloriesNum,
        protein: Math.round(proteinNum * 10) / 10,
        carbs: aiEstimate?.macros?.carbs,
        fats: aiEstimate?.macros?.fats,
        portion: portionNum,
        isExtra: true,
      };

      if (slotIndex >= 0) {
        currentMeals[slotIndex].items.push(newItem);
      } else {
        currentMeals.push({ slot: customSlot, items: [newItem] });
      }
    }

    await commitMealsUpdate(currentMeals);

    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomPortion(1);
    setAiEstimate(null);
    setMultiItemEstimate(null);
    setIsAddCustomOpen(false);
  };

  // Remove an item from the meal slot
  const handleRemoveItem = useCallback(
    async (slot: MealSlot, itemId: string) => {
      const slotLog = (todayLog.mealsEaten || []).find((m) => m.slot === slot);
      if (slotLog?.isSkipped) return;
      triggerHaptic('light');
      const currentMeals = (todayLog.mealsEaten || [])
        .map((m) => {
          if (m.slot === slot) {
            return {
              ...m,
              items: m.items.filter((it) => it.id !== itemId),
            };
          }
          return m;
        })
        .filter((m) => m.items.length > 0);

      await commitMealsUpdate(currentMeals);
    },
    [todayLog.mealsEaten, commitMealsUpdate]
  );

  // Mark meal as skipped (blocked if food items are already entered in this meal slot)
  const handleToggleSkipMeal = useCallback(
    async (slot: MealSlot) => {
      const currentMeals = (todayLog.mealsEaten || []).map((m) => ({
        ...m,
        items: [...m.items],
      }));
      const slotIndex = currentMeals.findIndex((m) => m.slot === slot);

      if (
        slotIndex >= 0 &&
        (currentMeals[slotIndex].isSkipped || currentMeals[slotIndex].items.length > 0)
      ) {
        triggerHaptic('error');
        return;
      }

      triggerHaptic('medium');
      if (slotIndex >= 0) {
        currentMeals[slotIndex].isSkipped = true;
        currentMeals[slotIndex].items = [];
      } else {
        currentMeals.push({
          slot,
          items: [],
          isSkipped: true,
        });
      }

      await commitMealsUpdate(currentMeals);
    },
    [todayLog.mealsEaten, commitMealsUpdate]
  );

  const handleOpenCustomLog = useCallback((slot: MealSlot) => {
    setCustomSlot(slot);
    setCustomPortion(1);
    setIsAddCustomOpen(true);
  }, []);

  return (
    <div className="w-full text-white">
      {/* ── Standard Navigation Header ── */}
      <LargeTitleHeader
        title="Nutrition"
        subtitle={`Day ${dayOfMonth} Mess Menu & Diary`}
        actions={
          <span
            className="text-[12px] font-bold px-3 py-1.5 rounded-full tabular-nums glass-flat"
            style={{
              backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
              color: 'var(--app-accent-text, #D29B7E)',
            }}
          >
            {caloriesRemaining} kcal left
          </span>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── 1. Hero Calorie Ring & Macro Stats (Pure Liquid Glass + Single Ambient Hue) ── */}
        <div className="glass-hero p-5 flex flex-col items-center gap-4 select-none min-h-[140px]">
          {/* Main Segmented Calorie Ring (split by 5 meal slots with time colors and calorie text) */}
          <div className="flex flex-col items-center justify-center pt-1 w-full">
            <SplitCalorieCircle
              slotsData={slotsCalorieData}
              caloriesRemaining={caloriesRemaining}
              caloriesEaten={caloriesEaten}
              calorieTarget={calorieTarget}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
            />
          </div>

          {/* Macro Breakdown (Real AI Summed Protein & Macros) */}
          <div className="grid grid-cols-3 gap-2.5 w-full pt-2">
            <div className="droplet-tile flex flex-col items-center gap-1.5 p-2.5">
              <span className="text-[12px] font-bold text-white tabular-nums">
                {macroTotals.protein} / 140g
              </span>
              <ProgressBar progress={Math.min(1, macroTotals.protein / 140)} height={4} />
              <span className="text-[11px] text-[rgba(235,235,245,0.65)] font-medium">Protein</span>
            </div>

            <div className="droplet-tile flex flex-col items-center gap-1.5 p-2.5">
              <span className="text-[12px] font-bold text-white tabular-nums">
                {macroTotals.carbs} / 220g
              </span>
              <ProgressBar progress={Math.min(1, macroTotals.carbs / 220)} height={4} />
              <span className="text-[11px] text-[rgba(235,235,245,0.65)] font-medium">Carbs</span>
            </div>

            <div className="droplet-tile flex flex-col items-center gap-1.5 p-2.5">
              <span className="text-[12px] font-bold text-white tabular-nums">
                {macroTotals.fats} / 60g
              </span>
              <ProgressBar progress={Math.min(1, macroTotals.fats / 60)} height={4} />
              <span className="text-[11px] text-[rgba(235,235,245,0.65)] font-medium">Fats</span>
            </div>
          </div>
        </div>

        {/* ── 2. Smart Hydration Reminder Banner (droplet-card) ── */}
        <div className="droplet-card p-3.5 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                color: 'var(--app-accent-text, #D29B7E)',
              }}
            >
              <Drop size={22} weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-bold text-white leading-tight">
                Smart Hydration Active
              </span>
              <span className="text-[11.5px] text-[rgba(235,235,245,0.64)] mt-0.5 truncate">
                Automated 30-min reminders sent to your phone
              </span>
            </div>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
            style={{
              backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
              color: 'var(--app-accent-text, #D29B7E)',
            }}
          >
            Every 30m
          </span>
        </div>

        {/* ── 3. Integrated Meals Diary (glass-card per meal) ── */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-section-header">
              Today's Meals Diary & Mess Menu
            </span>
            <span className="text-[11px] text-[rgba(235,235,245,0.50)]">
              Adjust portions & items
            </span>
          </div>

          {MEAL_SLOTS.slice(0, visibleSlotCount).map((slotConfig) => {
            const slotLog = (todayLog.mealsEaten || []).find((m) => m.slot === slotConfig.slot);
            const isSkipped = Boolean(slotLog?.isSkipped);
            const slotItems = isSkipped ? EMPTY_MEAL_ITEMS : slotLog?.items || EMPTY_MEAL_ITEMS;
            const messItems = messItemsBySlot[slotConfig.slot] || [];

            return (
              <MealSlotCard
                key={slotConfig.slot}
                slotConfig={slotConfig}
                isSkipped={isSkipped}
                slotItems={slotItems}
                messItems={messItems}
                proteinMap={aiProteinMap}
                isSelected={selectedSlot === slotConfig.slot}
                onToggleSkip={handleToggleSkipMeal}
                onOpenCustomLog={handleOpenCustomLog}
                onToggleMessItem={handleToggleMessItem}
                onUpdatePortion={handleUpdateItemPortion}
                onRemoveItem={handleRemoveItem}
              />
            );
          })}
        </div>
      </div>

      {/* Add Custom Food Modal Sheet - AI Food & Portion Auto-Analyzer */}
      <Sheet
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        heightClass="max-h-[88vh] h-auto"
        title={`Log to ${customSlot.charAt(0).toUpperCase() + customSlot.slice(1)}`}
      >
        <div className="flex flex-col gap-3.5 py-2 pb-6">
          {/* Quick Popular Food Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
              Quick Select / Popular Items:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Chapati',
                'Steamed Rice',
                'Dal Tadka',
                'Paneer Butter Masala',
                '2 Boiled Eggs',
                'Maggi',
                'Chicken Curry',
                'Curd',
                'Banana',
                'Whey Protein',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setCustomName(chip);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    customName.toLowerCase().includes(chip.toLowerCase())
                      ? 'text-white font-semibold shadow-sm'
                      : 'glass-flat text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  style={
                    customName.toLowerCase().includes(chip.toLowerCase())
                      ? { background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36 0%, #A46D52 100%))' }
                      : undefined
                  }
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Food Input with AI Badge */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-[rgba(235,235,245,0.75)]">
                Food / Item Name
              </label>
              <span
                className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                  color: 'var(--app-accent-text, #D29B7E)',
                }}
              >
                <LunaComicBubbleIcon size={12} color="currentColor" variant="filled" />
                AI Analyzed
              </span>
            </div>
            <TextField
              placeholder="e.g., 3 Chapatis, Paneer bowl, 2 Boiled eggs, Dal..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              autoFocus
            />
          </div>

          {/* AI Analysis Status / Insights Card */}
          {isAiAnalyzing && (
            <div
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold animate-pulse"
              style={{
                backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                color: 'var(--app-accent-text, #D29B7E)',
              }}
            >
              <LunaComicBubbleIcon size={14} color="currentColor" className="animate-spin" />
              <span>AI is analyzing food ingredients and calculating calories...</span>
            </div>
          )}

          {/* Multi-Item AI Detection Card */}
          {multiItemEstimate && multiItemEstimate.items.length > 1 && !isAiAnalyzing && (
            <div
              className="flex flex-col gap-1.5 p-3 rounded-2xl glass-flat"
              style={{ backgroundColor: 'var(--app-accent-whisper, rgba(164, 109, 82, 0.08))' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                  <LunaComicBubbleIcon size={13} color="currentColor" />
                  AI Detected {multiItemEstimate.items.length} Items:
                </span>
                <span className="text-xs font-extrabold text-white tabular-nums">
                  {multiItemEstimate.totalCalories} kcal · {multiItemEstimate.totalProtein}g P
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {multiItemEstimate.items.map((it, idx) => {
                  const itProtein =
                    it.macros?.protein ??
                    resolveItemProteinLocal(it.name, it.caloriesPerServing, aiProteinMap);
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] text-white/90 font-medium"
                    >
                      {it.detectedPortion}× {it.name}{' '}
                      <span className="font-bold" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                        ({it.totalCalories} kcal · {Math.round(itProtein * it.detectedPortion * 10) / 10}g P)
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Single Item AI Estimate Card */}
          {aiEstimate && !multiItemEstimate && !isAiAnalyzing && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                  <LunaComicBubbleIcon size={13} color="currentColor" />
                  {aiEstimate.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/70 font-medium">
                  {aiEstimate.source === 'database' ? 'Verified Database' : 'Smart AI Estimate'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-extrabold text-white tabular-nums">
                  ~{aiEstimate.caloriesPerServing} kcal · {aiEstimate.macros?.protein ?? resolveItemProteinLocal(aiEstimate.name, aiEstimate.caloriesPerServing, aiProteinMap)}g P{' '}
                  <span className="text-xs text-white/50 font-normal">/ {aiEstimate.unit}</span>
                </span>
                {aiEstimate.macros && (
                  <div className="flex items-center gap-2 text-[11px] text-white/80 font-mono">
                    <span>
                      <span style={{ color: 'var(--app-accent-text, #D29B7E)' }}>P:</span> {aiEstimate.macros.protein}g
                    </span>
                    <span>
                      <span style={{ color: 'var(--app-accent-text, #D29B7E)' }}>C:</span> {aiEstimate.macros.carbs}g
                    </span>
                    <span>
                      <span style={{ color: 'var(--app-accent-text, #D29B7E)' }}>F:</span> {aiEstimate.macros.fats}g
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Quick Pills */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-[rgba(235,235,245,0.75)]">
                Quantity / Portions Eaten
              </label>
              <span className="text-[10.5px] text-[rgba(235,235,245,0.45)]">
                AI computes kcal & protein
              </span>
            </div>
            <div className="flex items-center justify-between glass-flat p-2 rounded-2xl">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCustomPortion(q);
                    }}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      customPortion === q
                        ? 'text-white shadow-md'
                        : 'bg-white/10 text-white/80 hover:bg-white/15'
                    }`}
                    style={
                      customPortion === q
                        ? { background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36 0%, #A46D52 100%))' }
                        : undefined
                    }
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-white/10 rounded-full px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCustomPortion((p) => Math.max(0.5, p - 1));
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
                >
                  <Minus size={12} weight="bold" />
                </button>
                <span className="w-6 text-center font-bold text-white tabular-nums text-sm">
                  {customPortion}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCustomPortion((p) => p + 1);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Estimated Calories & Protein (Auto-Applied by AI) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] font-semibold text-[rgba(235,235,245,0.85)]">
                Nutrition per serving (kcal & protein)
              </label>
              <div
                className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shrink-0 select-none border-none"
                style={{
                  backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                  color: 'var(--app-accent-text, #D29B7E)',
                }}
              >
                <Sparkle size={10} weight="fill" />
                <span>Auto-Applied by AI</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <TextField
                type="number"
                placeholder="Calories (kcal)"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
              />
              <TextField
                type="number"
                step="0.5"
                placeholder="Protein (g)"
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
              />
            </div>
          </div>

          {/* Live Calorie & Protein Total Preview */}
          <div
            className="p-3.5 rounded-2xl flex items-center justify-between gap-2"
            style={{ backgroundColor: 'var(--app-accent-whisper, rgba(164, 109, 82, 0.08))' }}
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white/90">
                Total Auto-Applied:
              </span>
              <span className="text-[11px] text-white/50">
                {multiItemEstimate
                  ? `${multiItemEstimate.items.length} detected items combined`
                  : `${customPortion} ${aiEstimate?.unit || 'portion(s)'} × ${parseInt(customCalories, 10) || 0} kcal · ${parseFloat(customProtein) || 0}g P`}
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-base font-extrabold tabular-nums text-white leading-tight">
                {multiItemEstimate
                  ? multiItemEstimate.totalCalories
                  : Math.round(customPortion * (parseInt(customCalories, 10) || 0))}{' '}
                kcal
              </span>
              <span
                className="text-xs font-bold tabular-nums leading-tight"
                style={{ color: 'var(--app-accent-text, #D29B7E)' }}
              >
                {multiItemEstimate
                  ? multiItemEstimate.totalProtein
                  : Math.round(customPortion * (parseFloat(customProtein) || 0) * 10) / 10}
                g protein
              </span>
            </div>
          </div>

          <div className="pt-1">
            <Button
              variant="prominent"
              className="w-full"
              disabled={!customName.trim() || (!customCalories && !multiItemEstimate)}
              onClick={handleLogCustomFood}
            >
              Log {multiItemEstimate ? `${multiItemEstimate.items.length} Items` : 'Food'} (
              {multiItemEstimate
                ? `${multiItemEstimate.totalCalories} kcal · ${multiItemEstimate.totalProtein}g P`
                : `${Math.round(customPortion * (parseInt(customCalories, 10) || 0))} kcal · ${Math.round(customPortion * (parseFloat(customProtein) || 0) * 10) / 10}g P`}
              )
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, MealSlot, NutritionLog, MealItemLog } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { navigateBack } from '../utils/backNavigation';
import { MONTHLY_MESS_MENU } from '../data/messMenu';
import {
  Ring,
  ProgressBar,
  Sheet,
  TextField,
  Button,
  MOTION_SPRINGS,
  Sun,
  Moon,
  Plus,
  Check,
  Trash,
  Drop,
  CaretLeft,
} from '../ui';

interface NutritionProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const MEAL_SLOTS: { slot: MealSlot; label: string; icon: React.ReactNode; time: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: <Sun size={18} weight="bold" />, time: '7:30–9:45 AM' },
  { slot: 'lunch', label: 'Lunch', icon: <Sun size={18} weight="bold" />, time: '12:15–2:45 PM' },
  { slot: 'snacks', label: 'Snacks', icon: <Sun size={18} weight="bold" />, time: '4:15–6:15 PM' },
  { slot: 'dinner', label: 'Dinner', icon: <Moon size={18} weight="bold" />, time: '7:15–9:30 PM' },
  { slot: 'nightCanteen', label: 'Night Canteen', icon: <Moon size={18} weight="bold" />, time: '10:30 PM–12:30 AM' },
];

const NIGHT_CANTEEN_PRESETS = [
  { name: 'Maggi (Plain / Masala)', estCalories: 280 },
  { name: 'Egg Roll / Paneer Roll', estCalories: 320 },
  { name: 'Cold Coffee / Milkshake', estCalories: 220 },
  { name: 'Bread Omelette (2 Eggs)', estCalories: 260 },
  { name: 'Grilled Sandwich', estCalories: 250 },
];

export default function Nutrition({ data, updateData }: NutritionProps) {
  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayOfMonth = new Date().getDate();

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

  // Water tracking state
  const [waterLiters, setWaterLiters] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`lifeos_water_${todayStr}`);
      return saved ? parseFloat(saved) : 1.5;
    } catch {
      return 1.5;
    }
  });

  const handleAddWater = (amountLiters: number) => {
    triggerHaptic('light');
    setWaterLiters((prev) => {
      const next = Math.round((prev + amountLiters) * 100) / 100;
      try {
        localStorage.setItem(`lifeos_water_${todayStr}`, next.toString());
      } catch {}
      return next;
    });
  };

  // Today's mess menu items mapped by meal slot
  const todayMess = useMemo(() => {
    return MONTHLY_MESS_MENU.find((m) => m.date === dayOfMonth) || MONTHLY_MESS_MENU[0];
  }, [dayOfMonth]);

  const messItemsBySlot = useMemo(() => {
    const map: Record<string, { name: string; estCalories: number }[]> = {
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

  // Custom Item Modal State
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customSlot, setCustomSlot] = useState<MealSlot>('lunch');
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('250');

  // Toggle or select a mess item directly from the meals diary
  const handleToggleMessItem = async (slot: MealSlot, itemName: string, estCalories: number) => {
    triggerHaptic('selection');
    const currentMeals = [...(todayLog.mealsEaten || [])];
    const slotIndex = currentMeals.findIndex((m) => m.slot === slot);

    if (slotIndex >= 0) {
      const existingItemIndex = currentMeals[slotIndex].items.findIndex(
        (it) => it.name.toLowerCase() === itemName.toLowerCase()
      );

      if (existingItemIndex >= 0) {
        // Deselect / remove
        currentMeals[slotIndex].items.splice(existingItemIndex, 1);
      } else {
        // Select / add
        currentMeals[slotIndex].items.push({
          id: `item_${Date.now()}_${Math.random()}`,
          name: itemName,
          calories: estCalories,
          portion: 1,
          isExtra: false,
        });
      }
    } else {
      // First item in this slot
      currentMeals.push({
        slot,
        items: [
          {
            id: `item_${Date.now()}_${Math.random()}`,
            name: itemName,
            calories: estCalories,
            portion: 1,
            isExtra: false,
          },
        ],
      });
    }

    const newDailyTotal = currentMeals.reduce(
      (sum, m) => sum + m.items.reduce((iSum, it) => iSum + it.calories * it.portion, 0),
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
  };

  // Add a custom extra food item
  const handleLogCustomFood = async () => {
    if (!customName.trim()) return;
    triggerHaptic('success');
    const caloriesNum = parseInt(customCalories, 10) || 250;

    const newItem: MealItemLog = {
      id: `item_${Date.now()}`,
      name: customName.trim(),
      calories: caloriesNum,
      portion: 1,
      isExtra: true,
    };

    const currentMeals = [...(todayLog.mealsEaten || [])];
    const slotIndex = currentMeals.findIndex((m) => m.slot === customSlot);

    if (slotIndex >= 0) {
      currentMeals[slotIndex].items.push(newItem);
    } else {
      currentMeals.push({ slot: customSlot, items: [newItem] });
    }

    const newDailyTotal = currentMeals.reduce(
      (sum, m) => sum + m.items.reduce((iSum, it) => iSum + it.calories * it.portion, 0),
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

    setCustomName('');
    setIsAddCustomOpen(false);
  };

  // Remove an item from the meal slot
  const handleRemoveItem = async (slot: MealSlot, itemId: string) => {
    triggerHaptic('light');
    const currentMeals = (todayLog.mealsEaten || []).map((m) => {
      if (m.slot === slot) {
        return {
          ...m,
          items: m.items.filter((it) => it.id !== itemId),
        };
      }
      return m;
    });

    const newDailyTotal = currentMeals.reduce(
      (sum, m) => sum + m.items.reduce((iSum, it) => iSum + it.calories * it.portion, 0),
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
  };

  return (
    <div className="w-full text-white selection:bg-[#FF9F0A]/30 font-sans">
      {/* ── Page Header ── */}
      <div className="pt-1 pb-2.5 px-0.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateBack(navigate)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer mr-1"
            title="Back"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div>
            <p className="text-[12.5px] font-semibold text-[rgba(235,235,245,0.65)] tracking-tight">
              Day {dayOfMonth} Mess Menu & Diary
            </p>
            <h1 className="text-[32px] leading-[38px] font-bold text-white tracking-[-0.02em]">
              Nutrition
            </h1>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25">
          {caloriesRemaining} kcal left
        </span>
      </div>

      <div className="flex flex-col gap-3 pb-2">
        {/* ── 1. Hero Calorie Ring & Macro Stats ── */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          transition={MOTION_SPRINGS.default}
          className="w-full bg-[#1C1C1E] rounded-[32px] p-5 border border-white/[0.08] flex flex-col items-center gap-4 shadow-xl select-none"
        >
          {/* Main Calorie Ring */}
          <div className="flex flex-col items-center justify-center">
            <Ring
              progress={caloriePercent}
              size={120}
              strokeWidth={10}
              color="#FF9F0A"
              trackColor="#2C2C2E"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">
                  {caloriesRemaining}
                </span>
                <span className="text-[10px] uppercase font-bold text-[rgba(235,235,245,0.50)] tracking-wider">
                  kcal left
                </span>
              </div>
            </Ring>
          </div>

          {/* Macro Breakdown */}
          <div className="grid grid-cols-3 gap-2.5 w-full pt-3 border-t border-white/[0.06]">
            <div className="flex flex-col items-center gap-1 p-2 rounded-[16px] bg-[#2C2C2E]/60">
              <span className="text-xs font-bold text-[#FF453A] tabular-nums">
                {Math.round(caloriesEaten * 0.06)} / 140g
              </span>
              <ProgressBar progress={Math.min(1, (caloriesEaten * 0.06) / 140)} height={4} color="#FF453A" />
              <span className="text-[11px] text-[rgba(235,235,245,0.60)]">Protein</span>
            </div>

            <div className="flex flex-col items-center gap-1 p-2 rounded-[16px] bg-[#2C2C2E]/60">
              <span className="text-xs font-bold text-[#FF9F0A] tabular-nums">
                {Math.round(caloriesEaten * 0.12)} / 220g
              </span>
              <ProgressBar progress={Math.min(1, (caloriesEaten * 0.12) / 220)} height={4} color="#FF9F0A" />
              <span className="text-[11px] text-[rgba(235,235,245,0.60)]">Carbs</span>
            </div>

            <div className="flex flex-col items-center gap-1 p-2 rounded-[16px] bg-[#2C2C2E]/60">
              <span className="text-xs font-bold text-[#FF375F] tabular-nums">
                {Math.round(caloriesEaten * 0.03)} / 60g
              </span>
              <ProgressBar progress={Math.min(1, (caloriesEaten * 0.03) / 60)} height={4} color="#FF375F" />
              <span className="text-[11px] text-[rgba(235,235,245,0.60)]">Fats</span>
            </div>
          </div>
        </motion.div>

        {/* ── 2. Water Hydration Tile ── */}
        <div className="w-full bg-[#1C1C1E] rounded-[24px] p-4 border border-white/[0.08] flex items-center justify-between gap-3 select-none shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-[#64D2FF]/20 flex items-center justify-center text-[#64D2FF] shrink-0">
              <Drop size={22} weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-base font-bold text-white tabular-nums">
                {waterLiters.toFixed(2)} L{' '}
                <span className="text-xs text-[rgba(235,235,245,0.40)] font-normal">
                  / 3.5 L target
                </span>
              </div>
              <div className="text-xs text-[rgba(235,235,245,0.60)] truncate">
                Daily Hydration Goal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="glass"
              tint="#64D2FF"
              size="sm"
              onClick={() => handleAddWater(0.25)}
            >
              +250ml
            </Button>
            <Button
              variant="glass"
              tint="#64D2FF"
              size="sm"
              onClick={() => handleAddWater(0.5)}
            >
              +500ml
            </Button>
          </div>
        </div>

        {/* ── 3. Integrated Meals Diary with Direct Mess Menu Selection ── */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[rgba(235,235,245,0.50)]">
              Today's Meals Diary & Mess Menu
            </span>
            <span className="text-xs text-white/50">
              Tap items to log eaten
            </span>
          </div>

          {MEAL_SLOTS.map((slot) => {
            const slotLog = (todayLog.mealsEaten || []).find((m) => m.slot === slot.slot);
            const slotCalories = (slotLog?.items || []).reduce(
              (s, it) => s + it.calories * it.portion,
              0
            );

            const messItems = messItemsBySlot[slot.slot] || [];
            const loggedItemNames = new Set(
              (slotLog?.items || []).map((it) => it.name.toLowerCase().trim())
            );

            // Custom extra items not matching mess list
            const customItems = (slotLog?.items || []).filter(
              (it) => it.isExtra || !messItems.some((m) => m.name.toLowerCase().trim() === it.name.toLowerCase().trim())
            );

            return (
              <div
                key={slot.slot}
                className="w-full bg-[#1C1C1E] rounded-[24px] p-4 border border-white/[0.08] flex flex-col gap-3 shadow-lg"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] bg-[#FF9F0A]/15 text-[#FF9F0A] flex items-center justify-center">
                      {slot.icon}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-white tracking-tight">
                        {slot.label}
                      </h3>
                      <span className="text-[11px] text-[rgba(235,235,245,0.50)]">
                        {slot.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FF9F0A] tabular-nums">
                      {slotCalories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setCustomSlot(slot.slot);
                        setIsAddCustomOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      title="Add Custom Item"
                    >
                      <Plus size={12} weight="bold" />
                      <span>Custom</span>
                    </button>
                  </div>
                </div>

                {/* Direct Mess Menu Selectable Pills */}
                {messItems.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
                      Mess Menu Items:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {messItems.map((item, idx) => {
                        const isSelected = loggedItemNames.has(item.name.toLowerCase().trim());
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleMessItem(slot.slot, item.name, item.estCalories)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all select-none cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#FF9F0A] text-black font-semibold shadow-md shadow-[#FF9F0A]/20'
                                : 'bg-[#2C2C2E] text-white/80 hover:text-white hover:bg-[#3A3A3C] border border-white/6'
                            }`}
                          >
                            {isSelected ? (
                              <Check size={13} weight="bold" />
                            ) : (
                              <Plus size={13} weight="bold" className="text-white/40" />
                            )}
                            <span>{item.name}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-black/70 font-bold' : 'text-white/40'}`}>
                              {item.estCalories} kcal
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Logged Items */}
                {customItems.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04]">
                    <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
                      Custom Logged Foods:
                    </span>
                    <div className="flex flex-col gap-1">
                      {customItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-3 py-1.5 rounded-[12px] bg-[#2C2C2E]/60 text-xs"
                        >
                          <span className="text-white/90 font-medium">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF9F0A] font-semibold tabular-nums">
                              {item.calories * item.portion} kcal
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(slot.slot, item.id)}
                              className="text-white/40 hover:text-[#FF453A] p-0.5 transition-colors cursor-pointer"
                              title="Delete food"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Food Modal Sheet */}
      <Sheet
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        detent="half"
        title={`Add to ${customSlot.charAt(0).toUpperCase() + customSlot.slice(1)}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <TextField
            label="Food / Item Name"
            placeholder="Salad, Paneer bowl, Protein shake..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            autoFocus
          />

          <TextField
            label="Estimated Calories (kcal)"
            type="number"
            placeholder="250"
            value={customCalories}
            onChange={(e) => setCustomCalories(e.target.value)}
          />

          <div className="pt-3">
            <Button
              variant="prominent"
              tint="#FF9F0A"
              className="w-full"
              disabled={!customName.trim()}
              onClick={handleLogCustomFood}
            >
              Add Custom Food
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

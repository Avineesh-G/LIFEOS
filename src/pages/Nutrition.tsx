import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, MealSlot, NutritionLog, MealItemLog } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { MONTHLY_MESS_MENU } from '../data/messMenu';
import {
  LargeTitleHeader,
  Ring,
  ProgressBar,
  Sheet,
  TextField,
  Button,
  MOTION_SPRINGS,
  Sun,
  Moon,
  Plus,
  Minus,
  Check,
  Trash,
  Drop,
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
  const [customCalories, setCustomCalories] = useState('100');
  const [customPortion, setCustomPortion] = useState(2);

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
        // Select / add with 1 portion
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
  };

  // Adjust portion quantity for any logged food item (e.g., 2 chapatis -> 4 chapatis)
  const handleUpdateItemPortion = async (slot: MealSlot, itemId: string, delta: number) => {
    triggerHaptic('selection');
    let currentMeals = [...(todayLog.mealsEaten || [])];
    const slotIndex = currentMeals.findIndex((m) => m.slot === slot);
    if (slotIndex < 0) return;

    const itemIndex = currentMeals[slotIndex].items.findIndex((it) => it.id === itemId);
    if (itemIndex < 0) return;

    const currentItem = currentMeals[slotIndex].items[itemIndex];
    const nextPortion = Math.max(0, Math.round(((currentItem.portion || 1) + delta) * 10) / 10);

    if (nextPortion <= 0) {
      // Remove item
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
  };

  // Add a custom extra food item with portion multiplier
  const handleLogCustomFood = async () => {
    if (!customName.trim()) return;
    triggerHaptic('success');
    const caloriesNum = parseInt(customCalories, 10) || 100;
    const portionNum = Math.max(1, customPortion || 1);

    const newItem: MealItemLog = {
      id: `item_${Date.now()}`,
      name: customName.trim(),
      calories: caloriesNum,
      portion: portionNum,
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

    setCustomName('');
    setCustomCalories('100');
    setCustomPortion(2);
    setIsAddCustomOpen(false);
  };

  // Remove an item from the meal slot
  const handleRemoveItem = async (slot: MealSlot, itemId: string) => {
    triggerHaptic('light');
    let currentMeals = (todayLog.mealsEaten || []).map((m) => {
      if (m.slot === slot) {
        return {
          ...m,
          items: m.items.filter((it) => it.id !== itemId),
        };
      }
      return m;
    }).filter((m) => m.items.length > 0);

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
  };

  return (
    <div className="w-full text-white selection:bg-[#FF9F0A]/30">
      {/* ── Standard Navigation Header ── */}
      <LargeTitleHeader
        title="Nutrition"
        subtitle={`Day ${dayOfMonth} Mess Menu & Diary`}
        tint="#FF9F0A"
        actions={
          <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] tabular-nums">
            {caloriesRemaining} kcal left
          </span>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── 1. Hero Calorie Ring & Macro Stats (glass-hero with Orange glow) ── */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          transition={MOTION_SPRINGS.default}
          style={{ '--hero-accent': '#FF9F0A' } as React.CSSProperties}
          className="glass-hero p-5 flex flex-col items-center gap-4 select-none min-h-[140px]"
        >
          {/* Main Calorie Ring */}
          <div className="flex flex-col items-center justify-center pt-1">
            <Ring
              progress={caloriePercent}
              size={130}
              strokeWidth={9}
              color="#FF9F0A"
              trackColor="rgba(255, 255, 255, 0.08)"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[28px] font-extrabold text-white tabular-nums tracking-tight leading-none">
                  {caloriesRemaining}
                </span>
                <span className="text-[10.5px] font-bold text-[rgba(235,235,245,0.50)] uppercase tracking-wider mt-1">
                  kcal left
                </span>
              </div>
            </Ring>
          </div>

          {/* Macro Breakdown (glass-flat) */}
          <div className="grid grid-cols-3 gap-2.5 w-full pt-2">
            <div className="glass-flat flex flex-col items-center gap-1.5 p-2.5">
              <span className="text-[12px] font-bold text-[#FF453A] tabular-nums">
                {Math.round(caloriesEaten * 0.06)} / 140g
              </span>
              <ProgressBar progress={Math.min(1, (caloriesEaten * 0.06) / 140)} height={4} color="#FF453A" />
              <span className="text-[11px] text-[rgba(235,235,245,0.60)] font-medium">Protein</span>
            </div>

            <div className="glass-flat flex flex-col items-center gap-1.5 p-2.5">
              <span className="text-[12px] font-bold text-[#FF9F0A] tabular-nums">
                {Math.round(caloriesEaten * 0.12)} / 220g
              </span>
              <ProgressBar progress={Math.min(1, (caloriesEaten * 0.12) / 220)} height={4} color="#FF9F0A" />
              <span className="text-[11px] text-[rgba(235,235,245,0.60)] font-medium">Carbs</span>
            </div>

            <div className="glass-flat flex flex-col items-center gap-1.5 p-2.5">
              <span className="text-[12px] font-bold text-[#FF375F] tabular-nums">
                {Math.round(caloriesEaten * 0.03)} / 60g
              </span>
              <ProgressBar progress={Math.min(1, (caloriesEaten * 0.03) / 60)} height={4} color="#FF375F" />
              <span className="text-[11px] text-[rgba(235,235,245,0.60)] font-medium">Fats</span>
            </div>
          </div>
        </motion.div>

        {/* ── 2. Water Hydration Tile (glass-card) ── */}
        <div className="glass-card p-4 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-[#64D2FF]/20 flex items-center justify-center text-[#64D2FF] shrink-0">
              <Drop size={22} weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-[15px] font-bold text-white tabular-nums">
                {waterLiters.toFixed(2)} L{' '}
                <span className="text-[12px] text-[rgba(235,235,245,0.45)] font-normal">
                  / 3.5 L target
                </span>
              </div>
              <div className="text-[11.5px] text-[rgba(235,235,245,0.60)] truncate">
                Daily Hydration Goal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

          {MEAL_SLOTS.map((slot) => {
            const slotLog = (todayLog.mealsEaten || []).find((m) => m.slot === slot.slot);
            const slotItems = slotLog?.items || [];
            const slotCalories = slotItems.reduce(
              (s, it) => s + it.calories * (it.portion || 1),
              0
            );

            const messItems = messItemsBySlot[slot.slot] || [];
            const loggedItemMap = new Map<string, MealItemLog>();
            slotItems.forEach((it) => {
              loggedItemMap.set(it.name.toLowerCase().trim(), it);
            });

            return (
              <div
                key={slot.slot}
                className="glass-card p-4 flex flex-col gap-3"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-1">
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
                    <span className="text-[12px] font-bold text-[#FF9F0A] tabular-nums">
                      {slotCalories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setCustomSlot(slot.slot);
                        setCustomPortion(2);
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

                {/* Direct Mess Menu Selectable Pills with Portion Badges */}
                {messItems.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
                      Mess Menu Items:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {messItems.map((item, idx) => {
                        const logged = loggedItemMap.get(item.name.toLowerCase().trim());
                        const isSelected = !!logged;
                        const portion = logged?.portion || 1;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleMessItem(slot.slot, item.name, item.estCalories)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition-all select-none cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#FF9F0A] text-black font-semibold shadow-md shadow-[#FF9F0A]/20'
                                : 'glass-flat text-white/80 hover:text-white hover:bg-white/[0.08]'
                            }`}
                          >
                            <span>{item.name}</span>
                            {isSelected && portion > 1 && (
                              <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-black text-[10px] font-bold">
                                {portion}x
                              </span>
                            )}
                            <span className={`text-[10.5px] tabular-nums ${isSelected ? 'text-black/75 font-semibold' : 'text-white/40'}`}>
                              {isSelected ? item.estCalories * portion : item.estCalories} kcal
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Logged Foods List with Interactive Quantity / Portion Stepper */}
                {slotItems.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
                      Logged Food Items & Portions:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {slotItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-3 py-2 rounded-[14px] glass-flat text-xs"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-white/95 font-semibold truncate">
                              {item.name}
                            </span>
                            <span className="text-[10.5px] text-[rgba(235,235,245,0.50)]">
                              {item.calories} kcal/serving
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Quantity Stepper [- quantity +] */}
                            <div className="flex items-center gap-1 bg-white/10 rounded-full px-1 py-0.5 border border-white/10">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemPortion(slot.slot, item.id, -1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
                                title="Decrease Quantity"
                              >
                                <Minus size={11} weight="bold" />
                              </button>
                              <span className="w-6 text-center font-bold text-white text-[12px] tabular-nums">
                                {item.portion || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemPortion(slot.slot, item.id, 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
                                title="Increase Quantity"
                              >
                                <Plus size={11} weight="bold" />
                              </button>
                            </div>

                            {/* Total Computed Item Calories */}
                            <span className="text-[#FF9F0A] font-bold tabular-nums min-w-[56px] text-right">
                              {item.calories * (item.portion || 1)} kcal
                            </span>

                            {/* Quick Delete */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(slot.slot, item.id)}
                              className="text-white/40 hover:text-[#FF453A] p-1 transition-colors cursor-pointer"
                              title="Delete food"
                            >
                              <Trash size={14} />
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
            placeholder="e.g., Chapati, Paneer bowl, Whey shake..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            autoFocus
          />

          <TextField
            label="Estimated Calories per piece / serving (kcal)"
            type="number"
            placeholder="100"
            value={customCalories}
            onChange={(e) => setCustomCalories(e.target.value)}
          />

          {/* Quantity Stepper & Quick Pills */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-[rgba(235,235,245,0.70)]">
              Quantity / Pieces Eaten
            </label>
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
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      customPortion === q
                        ? 'bg-[#FF9F0A] text-black shadow-md'
                        : 'bg-white/10 text-white/80 hover:bg-white/15'
                    }`}
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
                    setCustomPortion((p) => Math.max(1, p - 1));
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white"
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
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                >
                  <Plus size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Calorie Total Preview */}
          <div className="p-3 rounded-2xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80">
              Total Added Calories:
            </span>
            <span className="text-sm font-extrabold text-[#FF9F0A] tabular-nums">
              {customPortion} × {parseInt(customCalories, 10) || 0} = {customPortion * (parseInt(customCalories, 10) || 0)} kcal
            </span>
          </div>

          <div className="pt-2">
            <Button
              variant="prominent"
              tint="#FF9F0A"
              className="w-full"
              disabled={!customName.trim()}
              onClick={handleLogCustomFood}
            >
              Log Food ({customPortion * (parseInt(customCalories, 10) || 0)} kcal)
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

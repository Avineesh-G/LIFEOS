import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, IndianRupee, Flame, Sparkles, Loader2, Edit2, Trash2, Plus, Moon, UtensilsCrossed } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { NIGHT_CANTEEN_MENU, NightCanteenItem } from '../../data/nightCanteenMenu';
import type { MealItemLog, MealSlot } from '../../types';

interface NightCanteenSectionProps {
  mealLog: { slot: MealSlot; items: MealItemLog[] } | undefined;
  onToggleItem: (itemName: string, estCals: number) => void;
  onUpdatePortion: (itemId: string, change: number) => void;
  extraTexts: Record<string, string>;
  setExtraTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editingExtraId: string | null;
  setEditingExtraId: (id: string | null) => void;
  editExtraName: string;
  setEditExtraName: (val: string) => void;
  editExtraCals: string;
  setEditExtraCals: (val: string) => void;
  onSaveExtraEdit: (mealSlot: MealSlot, itemId: string) => void;
  onDeleteExtraItem: (mealSlot: MealSlot, itemId: string) => void;
  onAddExtraItem: (mealSlot: MealSlot) => Promise<void>;
  estimatingSlot: MealSlot | null;
}

const CATEGORY_TABS = [
  'All',
  'Tiffin',
  'Curry',
  'Noodles & Rice',
  'Roti & Breads',
  'Bakery & Desserts',
  'Chat',
  'Beverage',
  'Snacks & Soup',
  'Additional',
] as const;

export default function NightCanteenSection({
  mealLog,
  onToggleItem,
  onUpdatePortion,
  extraTexts,
  setExtraTexts,
  editingExtraId,
  setEditingExtraId,
  editExtraName,
  setEditExtraName,
  editExtraCals,
  setEditExtraCals,
  onSaveExtraEdit,
  onDeleteExtraItem,
  onAddExtraItem,
  estimatingSlot,
}: NightCanteenSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');

  // Filtered canteen items
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return NIGHT_CANTEEN_MENU.filter(item => {
      // Diet filter
      if (dietFilter !== 'All' && item.type !== dietFilter) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Curry') {
          if (item.category !== 'Curry' && item.category !== 'Wet Curry') return false;
        } else if (selectedCategory === 'Noodles & Rice') {
          if (item.category !== 'Noodles' && item.category !== 'Rice') return false;
        } else if (selectedCategory === 'Roti & Breads') {
          if (item.category !== 'Roti/Chapathi') return false;
        } else if (selectedCategory === 'Bakery & Desserts') {
          if (item.category !== 'Bakery') return false;
        } else if (selectedCategory === 'Snacks & Soup') {
          if (item.category !== 'Snacks' && item.category !== 'Soup') return false;
        } else if (selectedCategory === 'Additional') {
          if (item.category !== 'Additional' && item.category !== 'Curd') return false;
        } else {
          if (item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }
      }

      // Search query filter
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesType = item.type.toLowerCase().includes(query);
        const matchesQuantity = item.quantity.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesType && !matchesQuantity) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, dietFilter]);

  // Compute selected canteen stats (Count, Total Kcal, Estimated Total Bill ₹)
  const canteenOrderStats = useMemo(() => {
    if (!mealLog || !mealLog.items) return { count: 0, totalCals: 0, totalBill: 0 };
    let count = 0;
    let totalCals = 0;
    let totalBill = 0;

    mealLog.items.forEach(item => {
      if (item.id === 'skipped') return;
      count += 1;
      totalCals += item.calories * item.portion;
      const matched = NIGHT_CANTEEN_MENU.find(m => m.name === item.name);
      if (matched) {
        totalBill += matched.price * item.portion;
      }
    });

    return { count, totalCals: Math.round(totalCals), totalBill: Math.round(totalBill) };
  }, [mealLog]);

  // Quick picks chips for fast 1-tap logging
  const quickPicks = [
    'Maggie Noodles / Veg Pasta',
    'Cold Coffee',
    'Cheese Omelette (2 eggs)',
    'Chicken Kheema Dosa',
    'Egg Dosa',
    'French Fries',
    'Brownie Fudge',
    'Paneer Butter Masala',
    'Vada Pav',
  ];

  return (
    <div className="space-y-4">
      {/* ── Canteen Summary Banner (when items are selected) ── */}
      {canteenOrderStats.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-accent/10 to-indigo-500/15 border border-purple-500/30 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Moon size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-primary-light dark:text-primary-dark">
                {canteenOrderStats.count} {canteenOrderStats.count === 1 ? 'Item' : 'Items'} Selected
              </p>
              <p className="text-[11px] text-muted-light dark:text-muted-dark font-mono">
                {canteenOrderStats.totalCals} kcal logged
              </p>
            </div>
          </div>
          {canteenOrderStats.totalBill > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold text-sm">
              <IndianRupee size={14} />
              <span>{canteenOrderStats.totalBill}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Quick Canteen Picks Chips ── */}
      <div>
        <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mb-1.5 flex items-center gap-1.5">
          <Sparkles size={12} className="text-purple-500" />
          <span>Popular Canteen Picks:</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickPicks.map(chipName => {
            const matched = NIGHT_CANTEEN_MENU.find(m => m.name === chipName || m.name.includes(chipName));
            const itemName = matched ? matched.name : chipName;
            const estCals = matched ? matched.estCalories : 300;
            const isSelected = mealLog?.items.some(i => i.id === itemName && !i.isExtra);

            return (
              <button
                key={chipName}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onToggleItem(itemName, estCals);
                }}
                className={`text-xs px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark hover:border-purple-500/30 text-secondary-light dark:text-secondary-dark'
                }`}
              >
                {isSelected ? <Check size={11} strokeWidth={3} /> : <span>+</span>}
                <span>{chipName}</span>
                {matched && (
                  <span className="text-[10px] opacity-70 font-mono">₹{matched.price}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-2.5 pt-1">
        {/* Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search 91 canteen items (e.g. Dosa, Maggi, Paneer, Cake)..."
            className="input-field w-full pl-9 pr-8 py-2 text-xs rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark p-1"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dietary Switcher (All / Veg / Non-Veg) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex p-0.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs">
            {(['All', 'Veg', 'Non-Veg'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDietFilter(tab);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 ${
                  dietFilter === tab
                    ? 'bg-surface-light dark:bg-surface-dark shadow-xs font-semibold text-primary-light dark:text-primary-dark'
                    : 'text-muted-light dark:text-muted-dark hover:text-secondary-light dark:hover:text-secondary-dark'
                }`}
              >
                {tab === 'Veg' && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
                {tab === 'Non-Veg' && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />}
                <span>{tab}</span>
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-muted-light dark:text-muted-dark">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1">
          {CATEGORY_TABS.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(cat);
                }}
                className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-purple-500/30'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 91 Items Explorer List ── */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5 no-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center bg-surface-light/40 dark:bg-surface-dark/40 rounded-2xl border border-dashed border-border-light dark:border-border-dark">
            <UtensilsCrossed size={28} className="mx-auto text-muted-light dark:text-muted-dark mb-2 opacity-60" />
            <p className="text-xs text-muted-light dark:text-muted-dark">No canteen items match "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setDietFilter('All');
              }}
              className="text-xs text-purple-500 font-semibold mt-2 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const loggedItem = mealLog?.items.find(i => i.id === item.name && !i.isExtra);
            const isSelected = !!loggedItem;

            return (
              <div
                key={item.id}
                className={`w-full flex flex-col p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-purple-500/10 border-purple-500/40 shadow-xs'
                    : 'bg-white/60 dark:bg-white/[0.03] border-black/5 dark:border-white/5 hover:border-purple-500/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                    onClick={() => onToggleItem(item.name, item.estCalories)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border flex flex-shrink-0 items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-600 text-transparent'
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>

                    {/* Veg / Non-Veg Indian Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      {item.type === 'Veg' ? (
                        <div className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-[3px] border border-rose-600 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-primary-light dark:text-primary-dark line-clamp-2 break-words leading-tight">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-light dark:text-muted-dark font-mono flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5">{item.category}</span>
                        <span>•</span>
                        <span>{item.quantity}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          <Flame size={10} />
                          {item.estCalories} kcal
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Price & Stepper */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Price Pill */}
                    <span className="text-xs font-mono font-bold text-primary-light dark:text-primary-dark bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                      ₹{item.price}
                    </span>

                    {/* Stepper when selected */}
                    {isSelected && (
                      <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark border border-purple-500/30 rounded-xl px-1.5 py-0.5 shadow-xs">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark font-bold text-xs bg-black/5 dark:bg-white/5"
                          onClick={e => {
                            e.stopPropagation();
                            onUpdatePortion(item.name, -0.5);
                          }}
                        >
                          -
                        </motion.button>
                        <span className="text-xs font-bold font-mono w-5 text-center">{loggedItem.portion}</span>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark font-bold text-xs bg-black/5 dark:bg-white/5"
                          onClick={e => {
                            e.stopPropagation();
                            onUpdatePortion(item.name, 0.5);
                          }}
                        >
                          +
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-1.5 ml-10 flex items-center gap-2">
                    <span>Total: {Math.round(loggedItem.calories * loggedItem.portion)} kcal</span>
                    <span>•</span>
                    <span>Cost: ₹{Math.round(item.price * loggedItem.portion)}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Logged Custom / Extra Items List ── */}
      {mealLog && mealLog.items.filter(i => i.isExtra).length > 0 && (
        <div className="mt-4 mb-2 space-y-2">
          <h4 className="text-xs font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider">
            Custom Canteen Items
          </h4>
          {mealLog.items
            .filter(i => i.isExtra)
            .map(extra => (
              <div
                key={extra.id}
                className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl"
              >
                {editingExtraId === extra.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editExtraName}
                      onChange={e => setEditExtraName(e.target.value)}
                      className="input-field text-sm w-full py-1.5 px-3"
                      placeholder="Item name"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editExtraCals}
                        onChange={e => setEditExtraCals(e.target.value)}
                        className="input-field text-sm w-1/2 py-1.5 px-3"
                        placeholder="Calories (kcal)"
                      />
                      <button
                        onClick={() => onSaveExtraEdit('nightCanteen', extra.id)}
                        className="btn-primary text-xs flex-1 py-1.5"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingExtraId(null)}
                        className="btn-ghost-pill text-xs px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary-light dark:text-primary-dark">
                        {extra.name}
                      </p>
                      <p className="text-xs text-muted-light dark:text-muted-dark font-mono">
                        {Math.round(extra.calories * extra.portion)} kcal ({extra.calories} kcal × {extra.portion})
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 mr-2 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg px-1.5 py-0.5">
                        <button
                          onClick={() => onUpdatePortion(extra.id, -0.5)}
                          className="text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark font-bold text-xs px-1"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-mono w-4 text-center">{extra.portion}</span>
                        <button
                          onClick={() => onUpdatePortion(extra.id, 0.5)}
                          className="text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark font-bold text-xs px-1"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setEditingExtraId(extra.id);
                          setEditExtraName(extra.name);
                          setEditExtraCals(extra.calories.toString());
                        }}
                        className="p-1.5 text-muted-light dark:text-muted-dark hover:text-accent rounded-lg"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteExtraItem('nightCanteen', extra.id)}
                        className="p-1.5 text-muted-light dark:text-muted-dark hover:text-red-500 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* ── Custom Off-Menu Snack Logger (AI Calorie Estimator) ── */}
      <div className="pt-2 border-t border-black/5 dark:border-white/5">
        <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1.5">
          Custom Snack / Off-Menu Item? (AI estimates cals)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={extraTexts['nightCanteen'] || ''}
            onChange={e => setExtraTexts(prev => ({ ...prev, nightCanteen: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') onAddExtraItem('nightCanteen');
            }}
            placeholder="e.g. 1 plate Maggi, 1 cold coffee"
            className="input-field text-xs flex-1 py-2 px-3 rounded-xl"
          />
          <button
            onClick={() => onAddExtraItem('nightCanteen')}
            disabled={estimatingSlot === 'nightCanteen'}
            className="btn-primary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 flex-shrink-0"
          >
            {estimatingSlot === 'nightCanteen' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Plus size={13} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

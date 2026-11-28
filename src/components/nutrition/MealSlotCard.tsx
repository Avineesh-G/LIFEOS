import React, { useMemo } from 'react';
import type { MealSlot, MealItemLog } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { resolveItemProteinLocal } from '../../utils/aiNutrition';
import { LunaComicBubbleIcon } from '../../ui/tokens/LunaComicBubbleIcon';
import { Plus, Minus, Trash, Prohibit } from '../../ui';

export interface MealSlotConfig {
  slot: MealSlot;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  time: string;
  color: string;
  textColor?: string;
  estBudget: number;
}

export interface MealSlotCardProps {
  slotConfig: MealSlotConfig;
  isSkipped: boolean;
  slotItems: MealItemLog[];
  messItems: { name: string; estCalories: number; estProtein?: number }[];
  proteinMap?: Record<string, number>;
  isSelected: boolean;
  onToggleSkip: (slot: MealSlot) => void;
  onOpenCustomLog: (slot: MealSlot) => void;
  onToggleMessItem: (slot: MealSlot, itemName: string, estCalories: number, estProtein?: number) => void;
  onUpdatePortion: (slot: MealSlot, itemId: string, delta: number) => void;
  onRemoveItem: (slot: MealSlot, itemId: string) => void;
}

export const MealSlotCard = React.memo(function MealSlotCard({
  slotConfig,
  isSkipped,
  slotItems,
  messItems,
  proteinMap,
  isSelected,
  onToggleSkip,
  onOpenCustomLog,
  onToggleMessItem,
  onUpdatePortion,
  onRemoveItem,
}: MealSlotCardProps) {
  const hasLoggedItems = slotItems.length > 0;

  const slotCalories = useMemo(
    () => slotItems.reduce((s, it) => s + it.calories * (it.portion || 1), 0),
    [slotItems]
  );

  const slotProtein = useMemo(
    () =>
      Math.round(
        slotItems.reduce((s, it) => {
          const perServingProtein =
            it.protein !== undefined
              ? it.protein
              : resolveItemProteinLocal(it.name, it.calories, proteinMap);
          return s + perServingProtein * (it.portion || 1);
        }, 0) * 10
      ) / 10,
    [slotItems, proteinMap]
  );

  const loggedItemMap = useMemo(() => {
    const map = new Map<string, MealItemLog>();
    slotItems.forEach((it) => {
      map.set(it.name.toLowerCase().trim(), it);
    });
    return map;
  }, [slotItems]);

  return (
    <div
      id={`meal-slot-${slotConfig.slot}`}
      className={`p-4 flex flex-col gap-3 transition-opacity duration-200 ${
        isSkipped ? 'droplet-card opacity-65' : 'glass-card'
      }`}
      style={
        isSelected
          ? {
              background:
                'linear-gradient(135deg, rgba(164, 109, 82, 0.16) 0%, rgba(28, 28, 30, 0.92) 72%)',
            }
          : undefined
      }
    >
      {/* Header Row — balanced two-tier layout so full meal name & actions never collide or truncate on 360px phones */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-colors"
              style={{
                backgroundColor: isSkipped
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                color: isSkipped
                  ? 'rgba(255, 255, 255, 0.45)'
                  : 'var(--app-accent-text, #D29B7E)',
              }}
            >
              {slotConfig.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-[15.5px] font-bold tracking-tight leading-tight ${
                    isSkipped ? 'text-white/60 line-through' : 'text-white'
                  }`}
                >
                  {slotConfig.label}
                </h3>
                {isSkipped && (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#FF453A]/15 text-[#FF453A] uppercase tracking-wider shrink-0">
                    Skipped
                  </span>
                )}
              </div>
              <span className="text-[11.5px] text-[rgba(235,235,245,0.52)] leading-tight mt-0.5 block">
                {slotConfig.time}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isSkipped ? (
              <div
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 bg-[#FF453A]/15 text-[#FF453A] select-none cursor-default"
                title="Meal recorded as skipped"
              >
                <Prohibit size={12} weight="bold" />
                <span>Skipped</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={hasLoggedItems}
                aria-disabled={hasLoggedItems}
                onClick={() => {
                  if (hasLoggedItems) {
                    triggerHaptic('error');
                    return;
                  }
                  onToggleSkip(slotConfig.slot);
                }}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-colors flex items-center gap-1.5 select-none touch-manipulation ${
                  hasLoggedItems
                    ? 'bg-white/[0.04] text-white/30 cursor-not-allowed opacity-60'
                    : 'active:scale-95 cursor-pointer bg-white/[0.07] hover:bg-white/[0.12] text-white/70 hover:text-white'
                }`}
                title={
                  hasLoggedItems
                    ? 'Cannot skip: meal already has logged food items'
                    : 'Mark Meal as Skipped'
                }
              >
                <Prohibit size={12} weight="bold" />
                <span>Skip</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Summary + AI Log Action Bar */}
        {!isSkipped && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[14px] bg-white/[0.04]">
            <div className="flex items-center gap-1.5 min-w-0 text-[12px] tabular-nums">
              {slotCalories > 0 ? (
                <>
                  <span className="font-bold text-white">{slotCalories} kcal</span>
                  <span className="text-white/35">·</span>
                  <span
                    className="font-bold"
                    style={{ color: 'var(--app-accent-text, #D29B7E)' }}
                  >
                    {slotProtein}g P
                  </span>
                </>
              ) : (
                <span className="text-[11.5px] text-white/45 font-medium">
                  Tap mess items below or log outside food
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenCustomLog(slotConfig.slot);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 active:scale-[0.97] transition-transform cursor-pointer touch-manipulation select-none"
              style={{
                backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.16))',
                color: 'var(--app-accent-text, #D29B7E)',
              }}
              title="Log Outside / Custom Food with AI"
            >
              <LunaComicBubbleIcon size={12} color="currentColor" />
              <span>Log</span>
            </button>
          </div>
        )}
      </div>

      {/* Direct Mess Menu Selectable Pills with Portion Badges */}
      {!isSkipped && messItems.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
            Mess Menu Items:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {messItems.map((item, idx) => {
              const logged = loggedItemMap.get(item.name.toLowerCase().trim());
              const isItemSelected = !!logged;
              const portion = logged?.portion || 1;
              const unitProtein =
                item.estProtein !== undefined
                  ? item.estProtein
                  : resolveItemProteinLocal(item.name, item.estCalories, proteinMap);
              const displayProtein =
                Math.round((isItemSelected ? unitProtein * portion : unitProtein) * 10) / 10;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onToggleMessItem(slotConfig.slot, item.name, item.estCalories, unitProtein)
                  }
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 text-left transition-transform select-none cursor-pointer active:scale-95 ${
                    isItemSelected
                      ? 'text-white font-semibold shadow-md'
                      : 'bg-white/[0.055] text-white/80 hover:text-white hover:bg-white/[0.09]'
                  }`}
                  style={
                    isItemSelected
                      ? {
                          background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36 0%, #A46D52 100%))',
                        }
                      : undefined
                  }
                >
                  <span className="leading-snug">{item.name}</span>
                  {isItemSelected && portion > 1 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white text-[10px] font-bold shrink-0">
                      {portion}x
                    </span>
                  )}
                  <span
                    className={`text-[10.5px] tabular-nums whitespace-nowrap shrink-0 ${
                      isItemSelected ? 'text-white/90 font-semibold' : 'text-white/45'
                    }`}
                  >
                    {isItemSelected ? Math.round(item.estCalories * portion) : item.estCalories} kcal · {displayProtein}g P
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Logged Foods List with Interactive Quantity / Portion Stepper */}
      {slotItems.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2">
          <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)]">
            Logged Food Items & Portions:
          </span>
          <div className="flex flex-col gap-1.5">
            {slotItems.map((item) => {
              const unitProtein =
                item.protein !== undefined
                  ? item.protein
                  : resolveItemProteinLocal(item.name, item.calories, proteinMap);
              const totalProtein = Math.round(unitProtein * (item.portion || 1) * 10) / 10;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 px-3 py-2.5 rounded-[14px] bg-white/[0.045] text-xs"
                >
                  {/* Top row: full item title + total kcal & protein + delete */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[12.5px] text-white/95 font-semibold leading-snug break-words">
                        {item.name}
                      </span>
                      {item.isExtra && (
                        <span
                          className="ml-1.5 inline-flex align-middle px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.16))',
                            color: 'var(--app-accent-text, #D29B7E)',
                          }}
                        >
                          Outside
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="font-bold tabular-nums text-white text-[12.5px] leading-tight whitespace-nowrap">
                          {Math.round(item.calories * (item.portion || 1))} kcal
                        </span>
                        <span
                          className="text-[10.5px] font-bold tabular-nums leading-tight whitespace-nowrap"
                          style={{ color: 'var(--app-accent-text, #D29B7E)' }}
                        >
                          {totalProtein}g P
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(slotConfig.slot, item.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.05] text-white/45 hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors cursor-pointer touch-manipulation"
                        title="Delete food"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom row: per-serving breakdown + portion stepper */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] text-[rgba(235,235,245,0.52)] tabular-nums truncate">
                      {item.calories} kcal · {unitProtein}g P / serving
                    </span>

                    <div className="flex items-center gap-1 bg-white/10 rounded-full px-1 py-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdatePortion(slotConfig.slot, item.id, -1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-transform cursor-pointer touch-manipulation"
                        title="Decrease Quantity"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus size={11} weight="bold" />
                      </button>
                      <span className="w-6 text-center font-bold text-white text-[12px] tabular-nums">
                        {item.portion || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdatePortion(slotConfig.slot, item.id, 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-transform cursor-pointer touch-manipulation"
                        title="Increase Quantity"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus size={11} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skipped Message State (Permanently Locked) */}
      {isSkipped && (
        <div className="py-2.5 px-3 rounded-[16px] bg-[#FF453A]/10 flex items-center gap-2 text-xs select-none">
          <Prohibit size={14} className="text-[#FF453A] shrink-0" weight="bold" />
          <span className="text-white/80 font-medium">
            Meal recorded as skipped (0 kcal). This entry is permanently locked.
          </span>
        </div>
      )}
    </div>
  );
});


import React, { useMemo } from 'react';
import type { MealSlot, MealItemLog } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { LunaComicBubbleIcon } from '../../ui/tokens/LunaComicBubbleIcon';
import { Plus, Minus, Trash, Prohibit } from '../../ui';

export interface MealSlotConfig {
  slot: MealSlot;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  time: string;
  color: string;
  estBudget: number;
}

export interface MealSlotCardProps {
  slotConfig: MealSlotConfig;
  isSkipped: boolean;
  slotItems: MealItemLog[];
  messItems: { name: string; estCalories: number }[];
  isSelected: boolean;
  onToggleSkip: (slot: MealSlot) => void;
  onOpenCustomLog: (slot: MealSlot) => void;
  onToggleMessItem: (slot: MealSlot, itemName: string, estCalories: number) => void;
  onUpdatePortion: (slot: MealSlot, itemId: string, delta: number) => void;
  onRemoveItem: (slot: MealSlot, itemId: string) => void;
}

export const MealSlotCard = React.memo(function MealSlotCard({
  slotConfig,
  isSkipped,
  slotItems,
  messItems,
  isSelected,
  onToggleSkip,
  onOpenCustomLog,
  onToggleMessItem,
  onUpdatePortion,
  onRemoveItem,
}: MealSlotCardProps) {
  const slotCalories = useMemo(
    () => slotItems.reduce((s, it) => s + it.calories * (it.portion || 1), 0),
    [slotItems]
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
      style={{
        borderLeftColor: isSelected ? slotConfig.color : undefined,
        borderLeftWidth: isSelected ? '3px' : undefined,
        borderLeftStyle: isSelected ? 'solid' : undefined,
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-colors"
            style={{
              backgroundColor: isSkipped ? 'rgba(255, 255, 255, 0.08)' : `${slotConfig.color}22`,
              color: isSkipped ? 'rgba(255, 255, 255, 0.4)' : slotConfig.color,
            }}
          >
            {slotConfig.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className={`text-[15px] font-bold tracking-tight truncate ${
                  isSkipped ? 'text-white/60 line-through' : 'text-white'
                }`}
              >
                {slotConfig.label}
              </h3>
              {isSkipped && (
                <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-[#FF453A]/15 text-[#FF453A] uppercase tracking-wider shrink-0">
                  Skipped
                </span>
              )}
            </div>
            <span className="text-[11px] text-[rgba(235,235,245,0.50)] whitespace-nowrap block">
              {slotConfig.time}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isSkipped ? (
            <div
              className="px-2 py-1 rounded-full text-[10.5px] font-semibold flex items-center gap-1 bg-[#FF453A]/15 text-[#FF453A] select-none cursor-default"
              title="Meal recorded as skipped"
            >
              <Prohibit size={12} weight="bold" />
              <span>Skipped</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onToggleSkip(slotConfig.slot)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 active:scale-95 cursor-pointer select-none bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white touch-manipulation"
              title="Mark Meal as Skipped"
            >
              <Prohibit size={12} weight="bold" />
              <span>Skip</span>
            </button>
          )}

          {!isSkipped && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenCustomLog(slotConfig.slot);
              }}
              className="inline-flex items-center rounded-full bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 active:bg-[#FF9F0A]/30 active:scale-[0.97] transition-transform cursor-pointer touch-manipulation select-none"
              title="Log Food with AI"
            >
              {slotCalories > 0 && (
                <>
                  <span className="px-2.5 py-1 text-[#FF9F0A] text-[11px] font-bold tabular-nums tracking-tight">
                    {slotCalories} kcal
                  </span>
                  <span className="w-[1px] h-3 bg-[#FF9F0A]/30" />
                </>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 text-[#FF9F0A] text-[11px] font-bold">
                <LunaComicBubbleIcon size={12} color="currentColor" />
                <span>Log</span>
              </span>
            </button>
          )}
        </div>
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

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onToggleMessItem(slotConfig.slot, item.name, item.estCalories)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition-transform select-none cursor-pointer active:scale-95 ${
                    isItemSelected
                      ? 'bg-[#FF9F0A] text-black font-semibold shadow-md shadow-[#FF9F0A]/20'
                      : 'glass-flat text-white/80 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{item.name}</span>
                  {isItemSelected && portion > 1 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-black text-[10px] font-bold">
                      {portion}x
                    </span>
                  )}
                  <span
                    className={`text-[10.5px] tabular-nums ${
                      isItemSelected ? 'text-black/75 font-semibold' : 'text-white/40'
                    }`}
                  >
                    {isItemSelected ? item.estCalories * portion : item.estCalories} kcal
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
                  <div className="flex items-center gap-1 bg-white/10 rounded-full px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdatePortion(slotConfig.slot, item.id, -1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-transform cursor-pointer"
                      title="Decrease Quantity"
                    >
                      <Minus size={11} weight="bold" />
                    </button>
                    <span className="w-6 text-center font-bold text-white text-[12px] tabular-nums">
                      {item.portion || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdatePortion(slotConfig.slot, item.id, 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-transform cursor-pointer"
                      title="Increase Quantity"
                    >
                      <Plus size={11} weight="bold" />
                    </button>
                  </div>

                  <span className="text-[#FF9F0A] font-bold tabular-nums min-w-[56px] text-right">
                    {item.calories * (item.portion || 1)} kcal
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(slotConfig.slot, item.id)}
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


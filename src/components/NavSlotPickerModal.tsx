import React from 'react';
import { Check, ArrowLeftRight, LucideIcon } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import {
  NAV_MODULE_REGISTRY,
  NavModuleId,
  NavModuleDefinition
} from '../config/navRegistry';
import { triggerHaptic } from '../utils/haptics';

interface NavSlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: 1 | 2;
  currentSlotModuleId: NavModuleId;
  otherSlotModuleId: NavModuleId;
  onSelectModule: (targetSlot: 1 | 2, moduleId: NavModuleId) => void;
  onSwapSlots: (targetSlot: 1 | 2) => void;
}

export function NavSlotPickerModal({
  isOpen,
  onClose,
  targetSlot,
  currentSlotModuleId,
  otherSlotModuleId,
  onSelectModule,
  onSwapSlots,
}: NavSlotPickerModalProps) {
  const otherSlotNumber = targetSlot === 1 ? 2 : 1;

  const handleModuleClick = (module: NavModuleDefinition) => {
    triggerHaptic('light');

    if (module.id === currentSlotModuleId) {
      // Already selected in this slot
      onClose();
      return;
    }

    if (module.id === otherSlotModuleId) {
      // Swapping with the other slot
      onSwapSlots(targetSlot);
      onClose();
      return;
    }

    // Assign to this slot
    onSelectModule(targetSlot, module.id);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm:max-w-md"
      className="text-left"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25">
                Slot {targetSlot}
              </span>
              <h3 className="text-base font-bold text-primary-light dark:text-primary-dark">
                Customize Navigation
              </h3>
            </div>
            <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5">
              Choose a module to pin to Slot {targetSlot}
            </p>
          </div>
        </div>

        {/* Module Options List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar py-1">
          {NAV_MODULE_REGISTRY.map((mod) => {
            const IconComponent: LucideIcon = mod.icon;
            const isCurrent = mod.id === currentSlotModuleId;
            const isOther = mod.id === otherSlotModuleId;

            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-150 active:scale-[0.98] select-none text-left ${
                  isCurrent
                    ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] shadow-xs'
                    : isOther
                    ? 'bg-black/[0.03] dark:bg-white/[0.04] border border-dashed border-[var(--accent-primary)]/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                    : 'bg-black/[0.02] dark:bg-white/[0.03] border border-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isCurrent
                        ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                        : isOther
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                        : 'bg-black/5 dark:bg-white/10 text-primary-light dark:text-primary-dark'
                    }`}
                  >
                    <IconComponent size={20} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {mod.label}
                      </span>
                    </div>
                    {mod.description && (
                      <p className={`text-[11px] truncate mt-0.5 ${
                        isCurrent
                          ? 'opacity-85'
                          : 'text-secondary-light dark:text-secondary-dark'
                      }`}>
                        {mod.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[var(--accent-primary)] text-white shadow-xs">
                      <Check size={12} strokeWidth={2.8} />
                      Active
                    </span>
                  )}
                  {isOther && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-1 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                      <ArrowLeftRight size={11} strokeWidth={2.4} />
                      Slot {otherSlotNumber} (Swap)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}

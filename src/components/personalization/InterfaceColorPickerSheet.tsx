import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Lock,
  ArrowRightLeft,
  Sparkles,
  AlertCircle,
  X,
  Clock,
  Calendar,
  Wallet,
  CheckSquare,
  Shield,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_LIST,
  ColorFamilyId,
  ColorFamily,
  getReadableForeground,
} from '../../theme/colorFamilies';
import {
  InterfaceConfig,
  CustomizableInterfaceId,
  isColorAvailable,
  getOwnerInterface,
  INTERFACE_MAP,
} from '../../theme/interfaceColorManager';
import { triggerHaptic } from '../../utils/haptics';

interface InterfaceColorPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetInterface: InterfaceConfig | null;
  currentAssignments: Record<string, string>;
  onApplyColor: (
    interfaceId: CustomizableInterfaceId,
    familyId: ColorFamilyId,
    swappedWithInterfaceId?: CustomizableInterfaceId
  ) => void;
}

export default function InterfaceColorPickerSheet({
  isOpen,
  onClose,
  targetInterface,
  currentAssignments,
  onApplyColor,
}: InterfaceColorPickerSheetProps) {
  if (!targetInterface) return null;

  const currentAssignedId = (currentAssignments[targetInterface.id] || targetInterface.defaultFamily) as ColorFamilyId;
  const [selectedFamilyId, setSelectedFamilyId] = useState<ColorFamilyId>(currentAssignedId);
  const [pendingSwap, setPendingSwap] = useState<{
    familyId: ColorFamilyId;
    ownerInterface: InterfaceConfig;
  } | null>(null);

  // Sync selection when opened
  useEffect(() => {
    if (isOpen && targetInterface) {
      setSelectedFamilyId((currentAssignments[targetInterface.id] || targetInterface.defaultFamily) as ColorFamilyId);
      setPendingSwap(null);
    }
  }, [isOpen, targetInterface, currentAssignments]);

  const selectedFamily: ColorFamily = COLOR_FAMILIES[selectedFamilyId] || COLOR_FAMILIES.azure;
  const IconComponent = targetInterface.icon;

  const handleSelectFamily = (familyId: ColorFamilyId) => {
    triggerHaptic('selection');
    // Check if color is available or locked by another interface
    if (familyId === currentAssignedId) {
      setSelectedFamilyId(familyId);
      return;
    }

    const available = isColorAvailable(familyId, targetInterface.id, currentAssignments);
    if (!available) {
      const owner = getOwnerInterface(familyId, currentAssignments);
      if (owner && owner.id !== targetInterface.id) {
        // Trigger reassignment confirmation prompt instead of silent theft
        setPendingSwap({
          familyId,
          ownerInterface: owner,
        });
        return;
      }
    }

    setSelectedFamilyId(familyId);
  };

  const handleConfirmSwap = () => {
    if (!pendingSwap) return;
    triggerHaptic('medium');
    setSelectedFamilyId(pendingSwap.familyId);
    setPendingSwap(null);
  };

  const handleSave = () => {
    triggerHaptic('success');
    // Check if selected family was previously owned by someone else
    const owner = getOwnerInterface(selectedFamilyId, currentAssignments);
    const swappedWith = owner && owner.id !== targetInterface.id ? owner.id : undefined;
    onApplyColor(targetInterface.id, selectedFamilyId, swappedWith);
    onClose();
  };

  // Render contextual live preview card matching interface domain
  const renderInterfacePreviewCard = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const tones = isDark ? selectedFamily.dark : selectedFamily;
    const readableText = getReadableForeground(selectedFamily.primary);

    switch (targetInterface.id) {
      case 'home':
        return (
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? tones.surface : selectedFamily.surfaceSoft,
              borderColor: tones.border,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: tones.iconSurface, color: tones.icon }}
                >
                  <IconComponent size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading" style={{ color: tones.text }}>
                    Daily Dashboard
                  </h4>
                  <p className="text-[10px]" style={{ color: tones.textSecondary }}>
                    Good afternoon · All systems optimal
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: selectedFamily.primary, color: readableText }}
              >
                Active
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex-1 p-2 rounded-xl text-center"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' }}
              >
                <div className="text-[10px]" style={{ color: tones.textSecondary }}>Focus Time</div>
                <div className="text-sm font-bold font-stat" style={{ color: tones.text }}>2h 45m</div>
              </div>
              <div
                className="flex-1 p-2 rounded-xl text-center"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' }}
              >
                <div className="text-[10px]" style={{ color: tones.textSecondary }}>Tasks Due</div>
                <div className="text-sm font-bold font-stat" style={{ color: tones.text }}>4 Today</div>
              </div>
            </div>
          </div>
        );

      case 'study':
        return (
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? tones.surface : selectedFamily.surfaceSoft,
              borderColor: tones.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: tones.iconSurface, color: tones.icon }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading" style={{ color: tones.text }}>
                    Deep Focus Session
                  </h4>
                  <p className="text-[10px]" style={{ color: tones.textSecondary }}>
                    Artificial Intelligence · Unit 4
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: selectedFamily.primary, color: readableText }}
              >
                25:00
              </span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-1.5 overflow-hidden my-2">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: '65%', backgroundColor: selectedFamily.primary }} />
            </div>
          </div>
        );

      case 'timetable':
        return (
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? tones.surface : selectedFamily.surfaceSoft,
              borderColor: tones.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: tones.iconSurface, color: tones.icon }}
                >
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading" style={{ color: tones.text }}>
                    CS302 · Operating Systems
                  </h4>
                  <p className="text-[10px]" style={{ color: tones.textSecondary }}>
                    Hall B-102 · 10:00 AM – 11:30 AM
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl"
                style={{ backgroundColor: selectedFamily.primary, color: readableText }}
              >
                Upcoming
              </span>
            </div>
          </div>
        );

      case 'spending':
        return (
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? tones.surface : selectedFamily.surfaceSoft,
              borderColor: tones.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: tones.iconSurface, color: tones.icon }}
                >
                  <Wallet size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading" style={{ color: tones.text }}>
                    Weekly Cashflow
                  </h4>
                  <p className="text-[10px]" style={{ color: tones.textSecondary }}>
                    Remaining budget ₹6,450
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold font-stat" style={{ color: tones.text }}>
                ₹850.00
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: tones.textSecondary }}>
              <span className="px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: tones.iconSurface }}>
                Supermarket & Groceries
              </span>
              <span>· 2:40 PM</span>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? tones.surface : selectedFamily.surfaceSoft,
              borderColor: tones.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center border transition-colors"
                  style={{
                    backgroundColor: selectedFamily.primary,
                    borderColor: selectedFamily.primary,
                    color: readableText,
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: tones.text }}>
                    Submit Machine Learning Lab 3
                  </h4>
                  <p className="text-[10px]" style={{ color: tones.textSecondary }}>
                    Due tomorrow at 5:00 PM · High Priority
                  </p>
                </div>
              </div>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: tones.iconSurface, color: tones.icon }}
              >
                P1
              </span>
            </div>
          </div>
        );

      default:
        // Default clean contextual card for other interfaces (vault, laundry, shopping, history, outings, settings)
        return (
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? tones.surface : selectedFamily.surfaceSoft,
              borderColor: tones.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: tones.iconSurface, color: tones.icon }}
                >
                  <IconComponent size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading" style={{ color: tones.text }}>
                    {targetInterface.label} Active Module
                  </h4>
                  <p className="text-[10px]" style={{ color: tones.textSecondary }}>
                    {targetInterface.description}
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl"
                style={{ backgroundColor: selectedFamily.primary, color: readableText }}
              >
                Selected
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm:max-w-xl"
      className="max-h-[92vh] flex flex-col"
    >
      {/* Header with Interface Metadata */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs transition-colors"
            style={{
              backgroundColor: selectedFamily.iconSurface,
              color: selectedFamily.icon,
              borderColor: selectedFamily.border,
            }}
          >
            <IconComponent size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading font-bold text-primary-light dark:text-primary-dark">
                {targetInterface.label} Color Family
              </h3>
              <span
                className="text-[10px] font-tag font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: selectedFamily.surfaceSoft,
                  color: selectedFamily.primary,
                }}
              >
                {selectedFamily.name}
              </span>
            </div>
            <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium">
              {targetInterface.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Close picker"
        >
          <X size={18} />
        </button>
      </div>

      {/* Live Preview Area */}
      <div className="pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-tag flex items-center gap-1">
            <Sparkles size={12} className="text-accent" />
            Live Tonal Preview
          </span>
          <span className="text-[11px] text-muted-light dark:text-muted-dark font-medium">
            Adapts in real-time
          </span>
        </div>
        {renderInterfacePreviewCard()}
      </div>

      {/* Reassignment Warning Modal / Banner */}
      <AnimatePresence>
        {pendingSwap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden shrink-0 my-2"
          >
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold font-heading">
                    Color Family Already in Use
                  </h5>
                  <p className="text-[11px] mt-0.5 leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                    <span className="font-bold">{COLOR_FAMILIES[pendingSwap.familyId]?.name}</span> is currently assigned to{' '}
                    <span className="font-bold">{pendingSwap.ownerInterface.label}</span>. LifeOS enforces unique colors per section.
                    Swapping will reassign colors so neither is duplicated.
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={handleConfirmSwap}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <ArrowRightLeft size={13} />
                      <span>Swap with {pendingSwap.ownerInterface.label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingSwap(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-all text-amber-900 dark:text-amber-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Family Grid (Scrollable) */}
      <div className="py-2 flex-1 overflow-y-auto no-scrollbar space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-tag flex items-center justify-between">
          <span>Curated Color Families ({COLOR_FAMILY_LIST.length})</span>
          <span className="text-[10px] text-muted-light dark:text-muted-dark font-normal">
            1 color per interface
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {COLOR_FAMILY_LIST.map((family) => {
            const isSelected = selectedFamilyId === family.id;
            const isCurrent = currentAssignedId === family.id;
            const owner = getOwnerInterface(family.id, currentAssignments);
            const isUsedByOther = !!owner && owner.id !== targetInterface.id;

            return (
              <button
                key={family.id}
                type="button"
                onClick={() => handleSelectFamily(family.id)}
                className={`w-full p-3 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-[var(--accent-primary)] border-[var(--accent-primary)] shadow-sm bg-black/[0.02] dark:bg-white/[0.04]'
                    : isUsedByOther
                    ? 'opacity-70 hover:opacity-100 border-[var(--card-border)] bg-transparent'
                    : 'border-[var(--card-border)] hover:border-black/20 dark:hover:border-white/20 bg-black/[0.01] dark:bg-white/[0.02]'
                }`}
              >
                {/* Dot & Swatch Column */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: family.primary }}
                  >
                    {isSelected ? (
                      <Check size={15} strokeWidth={2.5} style={{ color: getReadableForeground(family.primary) }} />
                    ) : isUsedByOther ? (
                      <Lock size={12} style={{ color: getReadableForeground(family.primary) }} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </div>
                  {/* Micro color chips showing full tonal depth */}
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: family.accent }} />
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: family.surfaceSoft }} />
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: family.icon }} />
                  </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="text-xs font-heading font-bold text-primary-light dark:text-primary-dark truncate">
                      {family.name}
                    </h4>
                    {isCurrent ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark">
                        Current
                      </span>
                    ) : isUsedByOther ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-1 truncate max-w-[110px]">
                        <Lock size={10} className="shrink-0" />
                        <span className="truncate">{owner.label}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        Available
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-secondary-light dark:text-secondary-dark mt-0.5 line-clamp-1 leading-snug">
                    {family.mood}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
          style={{
            backgroundColor: selectedFamily.primary,
            color: getReadableForeground(selectedFamily.primary),
          }}
        >
          <Check size={15} strokeWidth={2.5} />
          <span>Apply {selectedFamily.name}</span>
        </button>
      </div>
    </BottomSheet>
  );
}

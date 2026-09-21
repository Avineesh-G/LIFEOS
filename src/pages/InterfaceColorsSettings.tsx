import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RotateCcw,
  Palette,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  CUSTOMIZABLE_INTERFACES,
  InterfaceConfig,
  CustomizableInterfaceId,
  getPersistedInterfaceColors,
  saveInterfaceColorsToStorage,
} from '../theme/interfaceColorManager';
import {
  COLOR_FAMILIES,
  ColorFamilyId,
  DEFAULT_INTERFACE_COLORS,
} from '../theme/colorFamilies';
import InterfaceColorPickerSheet from '../components/personalization/InterfaceColorPickerSheet';
import { triggerHaptic } from '../utils/haptics';
import type { AppData } from '../types';

interface InterfaceColorsSettingsProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function InterfaceColorsSettings({
  data,
  updateData,
}: InterfaceColorsSettingsProps) {
  const navigate = useNavigate();

  // Active color assignments
  const [assignments, setAssignments] = useState<Record<string, ColorFamilyId>>(() =>
    getPersistedInterfaceColors(data?.settings?.interfaceColors)
  );

  // Active picker sheet state
  const [activeInterface, setActiveInterface] = useState<InterfaceConfig | null>(null);

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false);

  // Feedback notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Keep state synced with props / localStorage
  useEffect(() => {
    const handleChanged = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, ColorFamilyId>>;
      if (customEvent.detail) {
        setAssignments(customEvent.detail);
      }
    };
    window.addEventListener('lifeos:interface-colors-changed', handleChanged);
    return () => {
      window.removeEventListener('lifeos:interface-colors-changed', handleChanged);
    };
  }, []);

  const handleOpenPicker = (iface: InterfaceConfig) => {
    triggerHaptic('selection');
    setActiveInterface(iface);
  };

  const handleApplyColor = async (
    interfaceId: CustomizableInterfaceId,
    familyId: ColorFamilyId,
    swappedWithInterfaceId?: CustomizableInterfaceId
  ) => {
    const nextAssignments = { ...assignments };

    if (swappedWithInterfaceId && swappedWithInterfaceId !== interfaceId) {
      // Atomic swap: give previous owner the current interface's old color
      const oldColor = nextAssignments[interfaceId] || DEFAULT_INTERFACE_COLORS[interfaceId] || 'azure';
      nextAssignments[swappedWithInterfaceId] = oldColor;
      nextAssignments[interfaceId] = familyId;
      setFeedback({
        type: 'info',
        message: `Swapped colors between ${CUSTOMIZABLE_INTERFACES.find(i => i.id === interfaceId)?.label} and ${CUSTOMIZABLE_INTERFACES.find(i => i.id === swappedWithInterfaceId)?.label}.`,
      });
    } else {
      nextAssignments[interfaceId] = familyId;
      setFeedback({
        type: 'success',
        message: `Updated color for ${CUSTOMIZABLE_INTERFACES.find(i => i.id === interfaceId)?.label}.`,
      });
    }

    setAssignments(nextAssignments);
    saveInterfaceColorsToStorage(nextAssignments);

    if (updateData) {
      try {
        await updateData({
          settings: {
            ...data?.settings,
            interfaceColors: nextAssignments,
          },
        });
      } catch (err) {
        console.error('Failed to sync interface colors to cloud:', err);
      }
    }

    setTimeout(() => setFeedback(null), 3500);
  };

  const handleResetToDefaults = async () => {
    triggerHaptic('medium');
    const defaults = { ...DEFAULT_INTERFACE_COLORS };
    setAssignments(defaults);
    try {
      localStorage.removeItem('lifeos_interface_colors');
      window.dispatchEvent(new CustomEvent('lifeos:interface-colors-changed', { detail: {} }));
    } catch {}
    setShowResetModal(false);

    if (updateData) {
      try {
        await updateData({
          settings: {
            ...data?.settings,
            interfaceColors: {},
          },
        });
      } catch (err) {
        console.error('Failed to reset interface colors:', err);
      }
    }

    setFeedback({
      type: 'success',
      message: 'All interface colors have been reset to factory defaults.',
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-4 pb-12 max-w-3xl mx-auto">
      {/* Top Header Card */}
      <div className="rounded-[32px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              navigate('/settings');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-secondary-light dark:text-secondary-dark text-xs font-semibold transition-all active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setShowResetModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] border border-[var(--card-border)] transition-all active:scale-95"
            title="Reset to factory color system"
          >
            <RotateCcw size={12} className="text-accent" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--pill-active-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--accent-primary)] shadow-xs shrink-0">
            <Palette size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] text-[10px] font-tag font-bold tracking-wider uppercase mb-1">
              <Sparkles size={11} className="text-[var(--accent-primary)]" />
              Per-Interface Personalization
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-light dark:text-primary-dark tracking-tight">
              Interface Colors
            </h1>
            <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5 font-medium leading-relaxed">
              Expressive identity across every major interface. Each section receives a distinct tonal palette with zero color duplication.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Feedback Notice */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            ) : (
              <Info size={16} className="text-blue-500 shrink-0" />
            )}
            <span className="flex-1">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interface Cards Section */}
      <div className="space-y-2.5">
        <div className="px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-tag">
          <span>Configured Interfaces ({CUSTOMIZABLE_INTERFACES.length})</span>
          <span>Tap to Customize</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {CUSTOMIZABLE_INTERFACES.map((iface) => {
            const familyId = (assignments[iface.id] || iface.defaultFamily) as ColorFamilyId;
            const family = COLOR_FAMILIES[familyId] || COLOR_FAMILIES.azure;
            const IconComponent = iface.icon;

            return (
              <motion.button
                key={iface.id}
                type="button"
                onClick={() => handleOpenPicker(iface)}
                whileHover={{ scale: 1.006 }}
                whileTap={{ scale: 0.985 }}
                className="w-full p-3 sm:p-4 rounded-[22px] sm:rounded-[26px] liquid-glass border border-[var(--card-border)] shadow-xs hover:shadow-sm text-left flex items-center justify-between gap-2.5 sm:gap-3.5 transition-all group"
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] flex items-center justify-center border shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: family.iconSurface,
                      color: family.icon,
                      borderColor: family.border,
                    }}
                  >
                    <IconComponent size={20} strokeWidth={2.2} className="sm:w-[22px] sm:h-[22px]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-xs sm:text-sm font-heading font-bold text-primary-light dark:text-primary-dark break-words leading-tight">
                        {iface.label}
                      </h3>
                      <span className="hidden compact:inline text-[10px] text-muted-light dark:text-muted-dark font-mono font-medium">
                        {iface.route}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-secondary-light dark:text-secondary-dark font-medium line-clamp-1 break-words mt-0.5">
                      {iface.description}
                    </p>
                  </div>
                </div>

                {/* Right: Color Indicator Badge & Arrow */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <div
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border flex items-center gap-1.5 sm:gap-2 shadow-2xs"
                    style={{
                      backgroundColor: family.surfaceSoft,
                      borderColor: family.border,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-xs"
                      style={{ backgroundColor: family.dotColor || family.primary }}
                    />
                    <span
                      className="text-[11px] sm:text-xs font-heading font-bold tracking-tight"
                      style={{ color: family.primary }}
                    >
                      {family.name}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-light dark:text-muted-dark group-hover:text-primary-light dark:group-hover:text-primary-dark group-hover:translate-x-0.5 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color Picker Bottom Sheet */}
      <InterfaceColorPickerSheet
        isOpen={!!activeInterface}
        onClose={() => setActiveInterface(null)}
        targetInterface={activeInterface}
        currentAssignments={assignments}
        onApplyColor={handleApplyColor}
      />

      {/* Reset Confirmation Dialog Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/75"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md liquid-glass rounded-[32px] p-6 border border-[var(--card-border)] shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark">
                    Reset Color Assignments?
                  </h3>
                  <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium">
                    Revert all 11 sections to their authentic default tonal families.
                  </p>
                </div>
              </div>

              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                This will reset any personalized color combinations across Home, Study, Timetable, Spending, Shopping, Outings, Tasks, Laundry, History, Vault, and Settings.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Reset All Colors</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Sheet } from '../feedback/Sheet';
import { SearchPill } from './SearchPill';
import {
  LockKey,
  House,
  Check,
  ArrowClockwise,
  Sparkle,
} from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { MODULE_TINTS } from '../tokens/colors';
import { ALL_HUB_ITEMS } from '../../components/Layout';
import type { HubItem } from './MoreHubSheet';

export interface SlotCustomizerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slotIndex: number | null; // 0 for Slot 2, 1 for Slot 3
  currentPinned: [string, string]; // [slot1Id, slot2Id]
  onSelectSlotModule: (moduleId: string) => void;
  onResetDefaults: () => void;
}

export function SlotCustomizerSheet({
  isOpen,
  onClose,
  slotIndex,
  currentPinned,
  onSelectSlotModule,
  onResetDefaults,
}: SlotCustomizerSheetProps) {
  const [search, setSearch] = useState('');

  const targetSlotIdx = slotIndex ?? 0;
  const currentSlotId = currentPinned[targetSlotIdx] || (targetSlotIdx === 0 ? 'gym' : 'nutrition');
  const otherSlotId = currentPinned[targetSlotIdx === 0 ? 1 : 0] || (targetSlotIdx === 0 ? 'nutrition' : 'gym');

  const currentItem = ALL_HUB_ITEMS.find((i) => i.id === currentSlotId);
  const otherItem = ALL_HUB_ITEMS.find((i) => i.id === otherSlotId);

  // Group items by category
  const categorizedSections = useMemo(() => {
    const itemMap = new Map<string, HubItem & { route: string }>();
    ALL_HUB_ITEMS.forEach((it) => itemMap.set(it.id, it));

    const planItems = ['tasks', 'morning', 'timetable', 'laundry']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem & { route: string } => !!i);

    const learnItems = ['notes', 'study', 'flow', 'recall', 'brainDump', 'transcribe']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem & { route: string } => !!i);

    const healthItems = ['gym', 'nutrition']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem & { route: string } => !!i);

    const moneyItems = ['spending', 'shopping', 'outings']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem & { route: string } => !!i);

    const systemItems = ['history', 'settings']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem & { route: string } => !!i);

    return [
      { title: 'Health & Fitness (Default Quick Slots)', items: healthItems },
      { title: 'Plan & Routines', items: planItems },
      { title: 'Deep Work & Learning', items: learnItems },
      { title: 'Finances & Life', items: moneyItems },
      { title: 'Security & System', items: systemItems },
    ];
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_HUB_ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (itemId: string) => {
    triggerHaptic('success');
    onSelectSlotModule(itemId);
    onClose();
  };

  const handleReset = () => {
    triggerHaptic('medium');
    onResetDefaults();
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent="full"
      title={
        <div className="flex flex-col items-center gap-1">
          <span className="text-[17px] font-bold text-white tracking-tight">
            Customize Quick Bar
          </span>
          <span className="text-[12px] font-medium text-white/50">
            Select an interface for Slot {targetSlotIdx + 1}
          </span>
        </div>
      }
      footer={
        <button
          type="button"
          onClick={handleReset}
          className="w-full py-3 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.20] transition-colors flex items-center justify-center gap-2 text-white/80 hover:text-white font-semibold text-sm cursor-pointer select-none"
        >
          <ArrowClockwise size={16} weight="bold" />
          <span>Reset to Defaults (Gym & Nutrition)</span>
        </button>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        {/* ── Visual 3-Slot Navigation Preview Bar ── */}
        <div className="p-3 rounded-2xl glass-card flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-1">
            Bottom Navigation Preview
          </div>

          <div className="flex items-center gap-1.5 justify-between">
            {/* Slot 0: Home (Locked) */}
            <div className="flex-1 py-2 px-1.5 rounded-xl glass-flat flex items-center justify-center gap-1.5 text-white/40 select-none">
              <LockKey size={13} weight="fill" className="text-[#FFD60A]" />
              <House size={16} weight="duotone" />
              <span className="text-xs font-semibold">Home</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/50 uppercase font-bold tracking-wider">
                Locked
              </span>
            </div>

            {/* Slot 1: Gym / Customizable */}
            <div
              className={`flex-1 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none ${
                targetSlotIdx === 0
                  ? 'glass-tile text-[#0A84FF] shadow-sm'
                  : 'glass-flat text-white/60'
              }`}
            >
              <span className="text-base shrink-0">
                {targetSlotIdx === 0 ? currentItem?.icon : otherItem?.icon}
              </span>
              <span className="text-xs font-semibold truncate">
                {targetSlotIdx === 0 ? currentItem?.label.split(' ')[0] : otherItem?.label.split(' ')[0]}
              </span>
              {targetSlotIdx === 0 && (
                <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
              )}
            </div>

            {/* Slot 2: Nutrition / Customizable */}
            <div
              className={`flex-1 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none ${
                targetSlotIdx === 1
                  ? 'glass-tile text-[#0A84FF] shadow-sm'
                  : 'glass-flat text-white/60'
              }`}
            >
              <span className="text-base shrink-0">
                {targetSlotIdx === 1 ? currentItem?.icon : otherItem?.icon}
              </span>
              <span className="text-xs font-semibold truncate">
                {targetSlotIdx === 1 ? currentItem?.label.split(' ')[0] : otherItem?.label.split(' ')[0]}
              </span>
              {targetSlotIdx === 1 && (
                <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11.5px] text-white/50 px-1">
            <LockKey size={13} weight="duotone" className="text-[#FFD60A] shrink-0" />
            <span>Home is locked as your primary interface. Slot 1 and Slot 2 can be swapped with any interface.</span>
          </div>
        </div>

        {/* Search Pill */}
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search interfaces to swap..."
        />

        {/* Search Results */}
        {filteredItems ? (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-white/40 px-2 pb-1">
              Matching Interfaces ({filteredItems.length})
            </span>
            {filteredItems.map((item) => {
              const isCurrent = item.id === currentSlotId;
              const isOther = item.id === otherSlotId;
              const tint = MODULE_TINTS[item.tintKey] || '#0A84FF';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer select-none text-left ${
                    isCurrent
                      ? 'glass-tile'
                      : 'hover:bg-white/[0.06] active:bg-white/[0.10]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 glass-flat"
                      style={{ color: tint }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[15px] font-semibold text-white">
                      {item.label}
                    </span>
                  </div>

                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A84FF]">
                      <Check size={16} weight="bold" />
                      <span>Current</span>
                    </div>
                  ) : isOther ? (
                    <span className="text-[11px] font-semibold text-white/40 px-2 py-0.5 rounded-full glass-flat">
                      In Other Slot
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          /* Categorized Module Sections */
          <div className="flex flex-col gap-4 pt-1">
            {categorizedSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-white/40 px-2.5">
                  {section.title}
                </span>

                <div className="flex flex-col gap-1">
                  {section.items.map((item) => {
                    const isCurrent = item.id === currentSlotId;
                    const isOther = item.id === otherSlotId;
                    const tint = MODULE_TINTS[item.tintKey] || '#0A84FF';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all cursor-pointer select-none text-left ${
                          isCurrent
                            ? 'glass-tile'
                            : 'hover:bg-white/[0.06] active:bg-white/[0.10]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 glass-flat"
                            style={{ color: tint }}
                          >
                            {item.icon}
                          </div>
                          <span className="text-[15px] font-semibold text-white">
                            {item.label}
                          </span>
                        </div>

                        {isCurrent ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A84FF] px-2.5 py-1 rounded-full glass-flat">
                            <Check size={14} weight="bold" />
                            <span>Active in Slot {targetSlotIdx + 1}</span>
                          </div>
                        ) : isOther ? (
                          <span className="text-[11px] font-semibold text-white/40 px-2 py-0.5 rounded-full glass-flat">
                            In Slot {targetSlotIdx === 0 ? 2 : 1}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

export default SlotCustomizerSheet;

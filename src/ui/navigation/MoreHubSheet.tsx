import React, { useState, useMemo } from 'react';
import { Sheet } from '../feedback/Sheet';
import { SearchPill } from './SearchPill';
import {
  X,
  DotsThree,
  CaretUpDown,
  EnvelopeSimple,
  SquaresFour,
  NotePencil,
  CalendarDots,
  CheckCircle,
  Paperclip,
  BookOpen,
  Tag,
  UsersThree,
  Sun,
  Barbell,
  ForkKnife,
  Wallet,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  ClockCounterClockwise,
  Gear,
  Flame,
  Microphone,
  TShirt,
  Cards,
  Brain,
  SlidersHorizontal,
} from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { MODULE_TINTS, ModuleKey } from '../tokens/colors';
import { auth } from '../../firebase';
import type { AppData } from '../../types';

export interface HubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tintKey: ModuleKey;
  category?: 'Plan' | 'Learn' | 'Health' | 'Money' | 'System';
  status?: string;
  route?: string;
}

export interface MoreHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: HubItem[];
  data?: AppData;
  onSelect: (item: HubItem) => void;
  onPinSlot?: (item: HubItem) => void;
}

interface NavSection {
  title: string;
  items: HubItem[];
}

export function MoreHubSheet({
  isOpen,
  onClose,
  items,
  data,
  onSelect,
  onPinSlot,
}: MoreHubSheetProps) {
  const [search, setSearch] = useState('');

  const userName = auth.currentUser?.displayName || 'User Profile';
  const userInitial = (auth.currentUser?.displayName ? auth.currentUser.displayName[0] : 'U').toUpperCase();

  // Map of items by ID
  const itemMap = useMemo(() => {
    const map = new Map<string, HubItem>();
    items.forEach((it) => map.set(it.id, it));
    return map;
  }, [items]);

  // Dynamic Recent Activity items from actual app data
  const recentCards = useMemo(() => {
    const list: Array<{ id: string; category: string; icon: React.ReactNode; title: string; time: string; hubId: string }> = [];

    // Latest Note from user data
    if (data?.notes && data.notes.length > 0) {
      const latestNote = data.notes[data.notes.length - 1];
      list.push({
        id: 'rec_note',
        category: 'Notes',
        icon: <NotePencil size={13} weight="regular" />,
        title: latestNote.title || 'Untitled Note',
        time: 'Recent',
        hubId: 'notes',
      });
    } else {
      list.push({
        id: 'rec_note_default',
        category: 'Notes',
        icon: <NotePencil size={13} weight="regular" />,
        title: 'Quick Capture Memo',
        time: 'Active',
        hubId: 'notes',
      });
    }

    // Active Workout / Gym
    list.push({
      id: 'rec_gym',
      category: 'Workout',
      icon: <Barbell size={13} weight="regular" />,
      title: data?.workoutLogs && data.workoutLogs.length > 0 ? 'Last Workout Split' : 'Daily Fitness Split',
      time: 'Today',
      hubId: 'gym',
    });

    // Today's Nutrition / Mess Menu
    list.push({
      id: 'rec_nutrition',
      category: 'Nutrition',
      icon: <ForkKnife size={13} weight="regular" />,
      title: 'Mess Menu & Macros',
      time: 'Today',
      hubId: 'nutrition',
    });

    // Deep Focus Flow Room
    list.push({
      id: 'rec_flow',
      category: 'Focus Flow',
      icon: <Flame size={13} weight="regular" />,
      title: 'Deep Work Session',
      time: 'Ready',
      hubId: 'flow',
    });

    return list;
  }, [data]);

  // Clean categorized sections for all 18 LifeOS interfaces
  const sections: NavSection[] = useMemo(() => {
    const planItems = ['tasks', 'morning', 'timetable', 'laundry']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem => !!i);

    const learnItems = ['notes', 'study', 'flow', 'recall', 'brainDump', 'transcribe']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem => !!i);

    const healthItems = ['gym', 'nutrition']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem => !!i);

    const moneyItems = ['spending', 'shopping', 'outings']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem => !!i);

    const systemItems = ['history', 'settings']
      .map((id) => itemMap.get(id))
      .filter((i): i is HubItem => !!i);

    return [
      { title: 'Plan & Routines', items: planItems },
      { title: 'Deep Work & Learning', items: learnItems },
      { title: 'Health & Fitness', items: healthItems },
      { title: 'Finances & Life', items: moneyItems },
      { title: 'Security & System', items: systemItems },
    ];
  }, [itemMap]);

  // Filtered search results across all modules
  const filteredModules = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        (item.status && item.status.toLowerCase().includes(query))
    );
  }, [items, search]);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent="full"
      title={
        /* ── Profile Header Bar with Avatar, Status, and Name ── */
        <div className="flex items-center w-full px-2">
          {/* User Avatar + Name + Caret */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#2C2C2E] flex items-center justify-center font-bold text-white text-sm overflow-hidden border border-white/10 select-none">
                {auth.currentUser?.photoURL ? (
                  <img
                    src={auth.currentUser.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              {/* Online Green Indicator Dot */}
              <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] ring-2 ring-[#121212] absolute -bottom-0.5 -right-0.5" />
            </div>

            <div
              onClick={() => {
                triggerHaptic('light');
                const settingsItem = itemMap.get('settings');
                if (settingsItem) {
                  onSelect(settingsItem);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 cursor-pointer select-none group"
            >
              <span className="text-[16px] font-bold text-white tracking-tight group-hover:text-white/90">
                {userName}
              </span>
              <CaretUpDown size={13} weight="bold" className="text-white/40 group-hover:text-white/70 transition-colors" />
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5 pb-4 px-1 pt-1">
        {/* Search Filter */}
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search modules..."
        />

        {/* Search Results if user is searching */}
        {search.trim() ? (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-white/40 px-2 pb-1">
              Matching Modules ({filteredModules.length})
            </span>
            {filteredModules.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelect(item);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.10] transition-colors cursor-pointer select-none group"
              >
                <div className="flex items-center gap-3.5 text-white/80 group-hover:text-white">
                  <div
                    className="text-[20px] shrink-0"
                    style={{ color: MODULE_TINTS[item.tintKey] || '#0A84FF' }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[15px] font-medium tracking-tight">
                    {item.label}
                  </span>
                </div>
                {item.status && (
                  <span className="text-[12px] text-white/40">
                    {item.status}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* ── 1. Recent Activity Horizontal Carousel ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[13px] font-medium text-white/50 tracking-normal">
                  Recent activity
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    const historyItem = itemMap.get('history');
                    if (historyItem) {
                      onSelect(historyItem);
                      onClose();
                    }
                  }}
                  className="text-white/30 hover:text-white/60 p-1 cursor-pointer transition-colors"
                  title="View history"
                >
                  <DotsThree size={16} weight="bold" />
                </button>
              </div>

              {/* Horizontal Scrolling Cards */}
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
                {recentCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      const match = itemMap.get(card.hubId);
                      if (match) {
                        onSelect(match);
                        onClose();
                      }
                    }}
                    className="min-w-[145px] p-3 rounded-2xl glass-tile transition-all flex flex-col gap-2 cursor-pointer select-none active:scale-98"
                  >
                    <div className="flex items-center justify-between text-white/60">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-medium">
                        <span className="text-[#0A84FF]">{card.icon}</span>
                        <span>{card.category}</span>
                      </div>
                      <span className="text-[11px] text-white/40">{card.time}</span>
                    </div>
                    <span className="text-[13.5px] font-semibold text-white tracking-tight truncate">
                      {card.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. Categorized Sleek List of All LifeOS Interfaces ── */}
            <div className="flex flex-col gap-3.5 pt-1">
              {sections.map((section, sIdx) => (
                <div key={section.title} className="flex flex-col gap-1">
                  {sIdx > 0 && <div className="h-[1px] bg-white/[0.05] my-1" />}
                  <span className="text-[12px] font-semibold text-white/40 px-2.5 pt-1">
                    {section.title}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          onSelect(item);
                          onClose();
                        }}
                        className="flex items-center justify-between px-2.5 py-2.5 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.10] transition-colors cursor-pointer select-none group text-left"
                      >
                        <div className="flex items-center gap-3.5 text-white/90 group-hover:text-white transition-colors min-w-0">
                          <div
                            className="text-[20px] shrink-0"
                            style={{ color: MODULE_TINTS[item.tintKey] || '#0A84FF' }}
                          >
                            {item.icon}
                          </div>
                          <span className="text-[15px] font-medium tracking-tight truncate">
                            {item.label}
                          </span>
                        </div>

                        {item.status && (
                          <span className="text-[12px] text-white/40 shrink-0 pl-2">
                            {item.status}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

export default MoreHubSheet;

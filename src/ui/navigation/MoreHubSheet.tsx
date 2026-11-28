import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Clock,
  Sparkle,
  Compass,
  ArrowSquareOut,
  Camera,
  Copy,
  Check,
} from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { prefetchRoute } from '../../utils/routePrefetch';
import { getModuleTint, MODULE_TINTS, ModuleKey } from '../tokens/colors';
import { auth } from '../../firebase';
import { useUserProfile } from '../../utils/userProfileCache';
import { CURRENT_VERSION_NAME } from '../../version';
import { APP_UPDATES, AppUpdate } from '../../data/appUpdates';
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
  data: _data,
  onSelect,
  onPinSlot,
}: MoreHubSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedUpdate, setSelectedUpdate] = useState<AppUpdate | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const userProfile = useUserProfile();
  const userName = userProfile.displayName || 'User Profile';
  const userInitial = (userProfile.displayName ? userProfile.displayName[0] : 'U').toUpperCase();

  // Map of items by ID
  const itemMap = useMemo(() => {
    const map = new Map<string, HubItem>();
    items.forEach((it) => map.set(it.id, it));
    return map;
  }, [items]);

  // App Updates & New Features list from central data source
  const appUpdates = APP_UPDATES;

  // Categorized by the work each interface does, with sections & items sorted alphabetically (A–Z)
  const sections: NavSection[] = useMemo(() => {
    const buildSortedSection = (title: string, ids: string[]): NavSection => ({
      title,
      items: ids
        .map((id) => itemMap.get(id))
        .filter((i): i is HubItem => !!i)
        .sort((a, b) => a.label.localeCompare(b.label)),
    });

    return [
      buildSortedSection('Finance & Money', ['outings', 'shopping', 'spending']),
      buildSortedSection('Health & Wellness', ['gym', 'nutrition']),
      buildSortedSection('Intelligence & Study', ['decisions', 'focus', 'ai', 'notes']),
      buildSortedSection('Personal & Travel', ['journal', 'circle', 'laundry', 'trips']),
      buildSortedSection('Planning & Work', ['calendar', 'drive', 'projects', 'timetable', 'tasks']),
      buildSortedSection('System & History', ['settings', 'history']),
    ].sort((a, b) => a.title.localeCompare(b.title));
  }, [itemMap]);

  // Filtered search results across all modules (sorted alphabetically)
  const filteredModules = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          (item.status && item.status.toLowerCase().includes(query))
      )
      .sort((a, b) => a.label.localeCompare(b.label));
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
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm overflow-hidden select-none shadow-md"
                style={{ background: 'var(--preset-gradient, linear-gradient(135deg, #3B82F6, #7B4B36))' }}
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              {/* Online Indicator Dot */}
              <span
                className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 shadow-sm"
                style={{ backgroundColor: 'var(--app-accent-text, #D29B7E)' }}
              />
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
                onPointerDown={() => item.route && prefetchRoute(item.route)}
                onClick={() => {
                  triggerHaptic('selection');
                  onSelect(item);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.10] transition-colors cursor-pointer select-none group"
              >
                <div className="flex items-center gap-3 text-white/95 group-hover:text-white min-w-0">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[18px] shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #D29B7E) 15%, #1D1D23) 0%, color-mix(in srgb, var(--app-accent, #7B4B36) 6%, #17171B) 100%)',
                      color: 'var(--app-accent-text, #D29B7E)',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[15px] font-medium tracking-tight truncate">
                    {item.label}
                  </span>
                </div>
                {item.status && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: 'var(--app-accent-soft, rgba(10, 132, 255, 0.12))',
                      color: 'var(--app-accent-text, #D29B7E)',
                    }}
                  >
                    {item.status}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* ── 1. App Updates & New Features Horizontal Carousel ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-white/60 tracking-normal">
                    What's new & updates
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                      color: 'var(--app-accent-text, #D29B7E)',
                    }}
                  >
                    v{CURRENT_VERSION_NAME}
                  </span>
                </div>
                <span className="text-[11px] text-white/40">
                  Tap card for details
                </span>
              </div>

              {/* Horizontal Scrolling Cards */}
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
                {appUpdates.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedUpdate(card);
                    }}
                    className="min-w-[158px] max-w-[178px] p-3 rounded-2xl glass-tile transition-transform flex flex-col justify-between cursor-pointer select-none active:scale-[0.98] h-[94px] shrink-0"
                  >
                    <div>
                      <div className="flex items-center justify-between text-white/75 mb-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold truncate" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                          <span>{card.icon}</span>
                          <span className="truncate">{card.category}</span>
                        </div>
                        <span className="text-[9.5px] text-white/50 shrink-0 font-medium ml-1">
                          {card.dateTime}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-white tracking-tight truncate block">
                        {card.title}
                      </span>
                    </div>

                    {/* Primary Email displayed on each card */}
                    <div
                      className="flex items-center gap-1 text-[9.5px] text-white/55 truncate pt-1"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
                    >
                      <EnvelopeSimple size={10} className="shrink-0" style={{ color: 'var(--app-accent-text, #D29B7E)' }} />
                      <span className="truncate">{card.contactEmails[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. Categorized Sleek List of All LifeOS Interfaces ── */}
            <div className="flex flex-col gap-3.5 pt-1">
              {sections.map((section, sIdx) => (
                <div key={section.title} className="flex flex-col gap-1">
                  {sIdx > 0 && <div className="h-[1px] bg-white/[0.05] my-1" />}
                  <span
                    className="text-[11.5px] uppercase tracking-wider font-semibold px-2.5 pt-1"
                    style={{ color: 'color-mix(in srgb, var(--app-accent-text, #D29B7E) 42%, rgba(255,255,255,0.72))' }}
                  >
                    {section.title}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onPointerDown={() => item.route && prefetchRoute(item.route)}
                        onClick={() => {
                          triggerHaptic('selection');
                          onSelect(item);
                          onClose();
                        }}
                        className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.09] transition-colors cursor-pointer select-none group text-left"
                      >
                        <div className="flex items-center gap-3 text-white/95 group-hover:text-white transition-colors min-w-0">
                          <div
                            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[18px] shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #D29B7E) 15%, #1D1D23) 0%, color-mix(in srgb, var(--app-accent, #7B4B36) 6%, #17171B) 100%)',
                              color: 'var(--app-accent-text, #D29B7E)',
                            }}
                          >
                            {item.icon}
                          </div>
                          <span className="text-[15px] font-medium tracking-tight truncate">
                            {item.label}
                          </span>
                        </div>

                        {item.status && (
                          <span className="text-[12px] text-white/45 shrink-0 pl-2">
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

      {/* ── App Update Details Pop-up Modal ── */}
      {selectedUpdate && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setSelectedUpdate(null)}
          />
          <div className="relative w-full max-w-md max-h-[86vh] glass-sheet rounded-3xl p-4 sm:p-5 flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl glass-tile flex items-center justify-center shrink-0"
                  style={{ color: 'var(--app-accent-text, #D29B7E)' }}
                >
                  {selectedUpdate.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-white/70 tracking-wide uppercase truncate">
                      {selectedUpdate.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/80 font-medium shrink-0">
                      {selectedUpdate.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/45 flex items-center gap-1 mt-0.5 truncate">
                    <Clock size={11} className="shrink-0" />
                    <span className="truncate">{selectedUpdate.fullDateTime}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUpdate(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto no-scrollbar py-3 space-y-3.5 flex-1 pr-0.5 pb-2">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight">
                  {selectedUpdate.title}
                </h3>
                <p className="text-[12.5px] text-white/75 mt-1 leading-relaxed">
                  {selectedUpdate.summary}
                </p>
              </div>

              {/* What was implemented in points */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  What was implemented
                </span>
                <div className="space-y-1.5">
                  {selectedUpdate.points.map((pt, idx) => {
                    const colonIndex = pt.indexOf(':');
                    const heading = colonIndex !== -1 ? pt.slice(0, colonIndex) : null;
                    const body = colonIndex !== -1 ? pt.slice(colonIndex + 1) : pt;

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl glass-flat"
                      >
                        <div className="mt-0.5 shrink-0" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                          <CheckCircle size={14} weight="fill" />
                        </div>
                        <div className="text-[12px] text-white/85 leading-snug">
                          {heading && (
                            <span className="font-semibold text-white mr-1">
                              {heading}:
                            </span>
                          )}
                          <span>{body}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations & Feedback Box with Contact Emails */}
              <div className="p-3 rounded-2xl glass-tile space-y-2.5">
                <div className="flex items-center gap-1.5" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                  <EnvelopeSimple size={15} weight="bold" />
                  <span className="text-[11.5px] font-semibold tracking-wide uppercase">
                    Recommendations & Feedback
                  </span>
                </div>
                <p className="text-[11.5px] text-white/75 leading-relaxed">
                  Have a suggestion, new feature recommendation, or feedback on this update? Mail me directly:
                </p>

                <div className="space-y-2">
                  {selectedUpdate.contactEmails.map((email) => {
                    const isCopied = copiedEmail === email;

                    return (
                      <div key={email} className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/45">
                        <div className="flex items-center justify-between">
                          <span className="text-[11.5px] font-mono font-medium text-white/90 select-all break-all">
                            {email}
                          </span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/[0.08] text-white/55 shrink-0 ml-1">
                            Developer
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(email);
                              setCopiedEmail(email);
                              triggerHaptic('success');
                              setTimeout(() => setCopiedEmail(null), 2000);
                            }}
                            className="flex-1 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-medium text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check size={12} style={{ color: 'var(--app-accent-text, #D29B7E)' }} /> : <Copy size={12} />}
                            <span>{isCopied ? 'Copied' : 'Copy Email'}</span>
                          </button>
                          <a
                            href={`mailto:${email}?subject=LifeOS%20Feature%20Recommendation%20-%20${encodeURIComponent(selectedUpdate.title)}`}
                            className="flex-1 py-1 rounded-lg text-[11px] font-medium text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, var(--app-accent, #7B4B36) 0%, var(--app-accent-end, #5AC8FA) 100%)' }}
                          >
                            <ArrowSquareOut size={12} weight="bold" />
                            <span>Send Mail</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Sheet>
  );
}

export default MoreHubSheet;

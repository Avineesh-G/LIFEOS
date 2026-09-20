/**
 * LifeOS — OutingsListPage Component (`/outings`)
 * 
 * Main list screen for Outing Expenses:
 * - Header: "Outing Expenses"
 * - Filter chips: All, Planned, Ongoing, Completed
 * - Search by name or place
 * - Sort by date (newest first)
 * - Outing cards with financial summary & budget progress
 * - Primary Action: "New Outing" squircle button
 * - Empty state with creation CTA
 * - Undo deletion toast
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Compass,
  MapPin,
  Calendar,
  Filter,
  Undo2,
  Sparkles,
} from 'lucide-react';
import { OutingCard } from '../components/OutingCard';
import { CreateOutingSheet } from '../components/CreateOutingSheet';
import { useOutings } from '../context/OutingsContext';
import { calculateOutingSummary } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
import type { Outing, OutingStatus } from '../types';

type FilterTab = 'all' | OutingStatus;

export default function OutingsListPage() {
  const { outings, isLoading, undoAction, undoDelete } = useOutings();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter and search
  const filteredOutings = useMemo(() => {
    return outings
      .filter((o) => {
        // Tab filter
        if (activeTab !== 'all' && o.status !== activeTab) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = o.name.toLowerCase().includes(q);
          const placeMatch = o.place?.toLowerCase().includes(q);
          return nameMatch || placeMatch;
        }

        return true;
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [outings, activeTab, searchQuery]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'planned', label: 'Planned' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-16 pb-28 space-y-4 select-none">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-light dark:text-primary-dark tracking-tight">
              Outing Expenses
            </h1>
            <span className="text-[10px] font-tag font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 uppercase tracking-wider">
              {outings.length} {outings.length === 1 ? 'Outing' : 'Outings'}
            </span>
          </div>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5">
            Track group trips, movies, dinners, and settle balances effortlessly
          </p>
        </div>

        {/* Primary Action: New Outing (Squircle button, radius 20px, seed fill) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsCreateOpen(true);
          }}
          className="h-11 px-4 rounded-[20px] bg-accent text-white font-bold text-xs shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          aria-label="Create new outing"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden min-[360px]:inline">New Outing</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3.5 text-secondary-light dark:text-secondary-dark opacity-60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by outing name or place..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(tab.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                active
                  ? 'bg-accent text-white border-accent shadow-xs'
                  : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark hover:border-accent/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Undo Toast ── */}
      {undoAction && (
        <div className="p-3 rounded-2xl bg-black/85 dark:bg-white/90 text-white dark:text-black text-xs font-medium flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="truncate">
            Deleted {undoAction.type} "{undoAction.name}"
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('save');
              undoDelete();
            }}
            className="px-2.5 py-1 rounded-lg bg-accent text-white text-[11px] font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
          >
            <Undo2 size={12} />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* ── Outing Cards List ── */}
      {filteredOutings.length > 0 ? (
        <div className="space-y-3 pt-1">
          {filteredOutings.map((outing) => (
            <OutingCard key={outing.id} outing={outing} />
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="py-12 px-6 rounded-[32px] liquid-glass border border-[var(--card-border)] text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-[24px] bg-accent/15 text-accent mx-auto flex items-center justify-center shadow-xs">
            <Compass size={32} strokeWidth={2.2} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark">
              {searchQuery
                ? 'No matching outings found'
                : activeTab !== 'all'
                ? `No ${activeTab} outings`
                : 'Plan Your First Outing'}
            </h3>
            <p className="text-xs text-secondary-light dark:text-secondary-dark max-w-xs mx-auto">
              {searchQuery
                ? 'Try a different search keyword or clear the search field.'
                : 'Create an outing for a road trip, dinner, movies, or weekend getaway with friends and family.'}
            </p>
          </div>

          {!searchQuery && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-accent text-white font-bold text-xs shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>Create your first outing</span>
            </button>
          )}
        </div>
      )}

      {/* Create Outing Modal */}
      <CreateOutingSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

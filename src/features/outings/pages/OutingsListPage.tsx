/**
 * LifeOS — OutingsListPage Component (`/outings`) - iOS 26 Liquid Glass
 * Features Premium Horizontal Card Stacking with spring physics,
 * subtle 3D perspective, fluid pagination, and view toggle.
 */

import React, { useState, useMemo, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Compass,
  ArrowCounterClockwise,
  Cards,
  List,
} from '@phosphor-icons/react';
import { OutingCard } from '../components/OutingCard';
import { CreateOutingSheet } from '../components/CreateOutingSheet';
import { useOutings } from '../context/OutingsContext';
import { triggerHaptic } from '../../../utils/haptics';
import { LargeTitleHeader } from '../../../ui/navigation/LargeTitleHeader';
import { SearchPill } from '../../../ui/navigation/SearchPill';
import { Segmented } from '../../../ui/controls/Segmented';
import { Button } from '../../../ui/controls/Button';
import { EmptyState } from '../../../ui/feedback/EmptyState';
import {
  HorizontalCardStack,
  recordStackNavigation,
  getRestoredStackNavigation,
} from '../../../ui/stack';
import type { Outing, OutingStatus } from '../types';

type FilterTab = 'all' | OutingStatus;
type ViewMode = 'stack' | 'list';

export default function OutingsListPage() {
  const navigate = useNavigate();
  const { outings, undoAction, undoDelete } = useOutings();

  // Restore previous stack state if returning from OutingDetailPage
  const restored = useMemo(() => getRestoredStackNavigation('outings'), []);

  const [activeTab, setActiveTab] = useState<FilterTab>(
    (restored?.filterTab as FilterTab) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(restored?.searchQuery || '');
  const [stackIndex, setStackIndex] = useState<number>(restored?.stackIndex || 0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // View mode preference (persisted in localStorage)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('lifeos_outings_view_mode') as ViewMode) || 'stack';
    } catch {
      return 'stack';
    }
  });

  const toggleViewMode = () => {
    triggerHaptic('selection');
    const nextMode = viewMode === 'stack' ? 'list' : 'stack';
    setViewMode(nextMode);
    try {
      localStorage.setItem('lifeos_outings_view_mode', nextMode);
    } catch {}
  };

  // Filter and search
  const filteredOutings = useMemo(() => {
    return outings
      .filter((o) => {
        if (activeTab !== 'all' && o.status !== activeTab) return false;

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

  // Clamp stackIndex if filtered collection size shrinks
  useEffect(() => {
    if (stackIndex >= filteredOutings.length && filteredOutings.length > 0) {
      setStackIndex(filteredOutings.length - 1);
    }
  }, [filteredOutings.length, stackIndex]);

  const handleOpenDetails = (outing: Outing, index: number) => {
    recordStackNavigation('outings', {
      stackIndex: index,
      filterTab: activeTab,
      searchQuery,
    });
    triggerHaptic('light');
    startTransition(() => {
      navigate(`/outings/${outing.id}`);
    });
  };

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'planned', label: 'Planned' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-6 selection:bg-[#40C8E0]/30">
      <LargeTitleHeader
        title="Outings"
        subtitle="Group trips, dinners · Expense balance splitter"
        tint="#40C8E0"
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <button
              onClick={toggleViewMode}
              className="p-2 rounded-full glass-flat text-[#40C8E0] active:scale-95 transition-transform"
              title={viewMode === 'stack' ? 'Switch to List View' : 'Switch to Stack View'}
              aria-label={viewMode === 'stack' ? 'Switch to List View' : 'Switch to Stack View'}
            >
              {viewMode === 'stack' ? (
                <List size={20} weight="bold" />
              ) : (
                <Cards size={20} weight="bold" />
              )}
            </button>

            {/* Create Outing */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsCreateOpen(true);
              }}
              className="p-2 rounded-full glass-flat text-[#40C8E0] active:scale-95 transition-transform"
              title="New Outing"
              aria-label="New Outing"
            >
              <Plus size={20} weight="bold" />
            </button>
          </div>
        }
      />

      <div className="max-w-xl mx-auto px-4 space-y-4">
        {/* Search */}
        <SearchPill
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setStackIndex(0);
          }}
          placeholder="Search by name or place..."
        />

        {/* Filter Segmented Control */}
        <Segmented
          options={tabs}
          value={activeTab}
          onChange={(val) => {
            triggerHaptic('selection');
            setActiveTab(val as FilterTab);
            setStackIndex(0);
          }}
          tint="#40C8E0"
        />

        {/* Undo Toast */}
        {undoAction && (
          <div className="p-3.5 rounded-2xl glass-card text-white text-xs font-medium flex items-center justify-between gap-3 shadow-lg">
            <span className="truncate">
              Deleted {undoAction.type} "{undoAction.name}"
            </span>
            <Button
              size="sm"
              variant="glass"
              icon={<ArrowCounterClockwise size={14} />}
              onClick={() => {
                triggerHaptic('save');
                undoDelete();
              }}
            >
              Undo
            </Button>
          </div>
        )}

        {/* Content Display: Horizontal Stack vs Classic List */}
        {filteredOutings.length > 0 ? (
          viewMode === 'stack' ? (
            <div className="pt-1">
              <HorizontalCardStack<Outing>
                items={filteredOutings}
                activeIndex={stackIndex}
                onIndexChange={setStackIndex}
                tint="#40C8E0"
                ariaLabel="Outing trips stack"
                renderCard={({ item }) => (
                  <OutingCard outing={item} />
                )}
                onCardClick={(item: Outing, index: number) => handleOpenDetails(item, index)}
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {filteredOutings.map((outing) => (
                <OutingCard key={outing.id} outing={outing} />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            icon={<Compass size={36} weight="light" className="text-[#40C8E0]" />}
            title={
              searchQuery
                ? 'No matching outings'
                : activeTab !== 'all'
                ? `No ${activeTab} outings`
                : 'Plan Your First Outing'
            }
            description={
              searchQuery
                ? 'Try a different search keyword or clear the search field.'
                : 'Create an outing for a road trip, dinner, movies, or weekend getaway with friends.'
            }
            actionLabel={!searchQuery ? 'Create Outing' : undefined}
            onAction={
              !searchQuery
                ? () => {
                    triggerHaptic('light');
                    setIsCreateOpen(true);
                  }
                : undefined
            }
            tint="#40C8E0"
          />
        )}
      </div>

      {/* Create Outing Sheet */}
      <CreateOutingSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

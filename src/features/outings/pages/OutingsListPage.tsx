/**
 * LifeOS — OutingsListPage Component (`/outings`) - iOS 26 Liquid Glass
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Compass,
  ArrowCounterClockwise,
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
import type { OutingStatus } from '../types';

type FilterTab = 'all' | OutingStatus;

export default function OutingsListPage() {
  const navigate = useNavigate();
  const { outings, undoAction, undoDelete } = useOutings();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'planned', label: 'Planned' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-4 selection:bg-[#40C8E0]/30">
      <LargeTitleHeader
        title="Outings"
        subtitle="Group trips, dinners · Expense balance splitter"
        tint="#40C8E0"
        actions={
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsCreateOpen(true);
            }}
            className="p-2 rounded-full glass-flat text-[#40C8E0] active:scale-95 transition-transform"
            title="New Outing"
          >
            <Plus size={20} weight="bold" />
          </button>
        }
      />

      <div className="max-w-xl mx-auto px-4 space-y-4">
        {/* Search */}
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or place..."
        />

        {/* Filter Segmented Control */}
        <Segmented
          options={tabs}
          value={activeTab}
          onChange={(val) => {
            triggerHaptic('selection');
            setActiveTab(val as FilterTab);
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

        {/* Outing Cards List */}
        {filteredOutings.length > 0 ? (
          <div className="space-y-3 pt-1">
            {filteredOutings.map((outing) => (
              <OutingCard key={outing.id} outing={outing} />
            ))}
          </div>
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

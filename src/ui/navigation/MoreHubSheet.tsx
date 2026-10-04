import React, { useState } from 'react';
import { Sheet } from '../feedback/Sheet';
import { SearchPill } from './SearchPill';
import { CaretRight, X } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { MODULE_TINTS, ModuleKey } from '../tokens/colors';

export interface HubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tintKey: ModuleKey;
  category?: string;
}

export interface MoreHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: HubItem[];
  onSelect: (item: HubItem) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onPinSlot?: (item: HubItem) => void;
}

export function MoreHubSheet({
  isOpen,
  onClose,
  items,
  onSelect,
}: MoreHubSheetProps) {
  const [search, setSearch] = useState('');

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent="full"
      title={
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">App Directory</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/70">
              {filteredItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-16">
        {/* Search Pill */}
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search all destinations..."
        />

        {/* In-Line List of Destinations */}
        <div className="flex flex-col rounded-[24px] bg-[#1C1C1E] border border-white/8 overflow-hidden divide-y divide-white/6 shadow-xl">
          {filteredItems.map((item) => {
            const tint = MODULE_TINTS[item.tintKey] || '#0A84FF';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelect(item);
                  onClose();
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer select-none group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Dot / Squircle Icon */}
                  <div
                    className="w-9 h-9 rounded-[12px] flex items-center justify-center text-lg shrink-0 shadow-sm transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${tint}20`,
                      color: tint,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-medium text-white tracking-tight truncate">
                      {item.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-white/30 group-hover:text-white/70 transition-colors">
                  <CaretRight size={16} weight="bold" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

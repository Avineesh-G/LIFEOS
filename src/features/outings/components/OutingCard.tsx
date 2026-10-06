/**
 * LifeOS — OutingCard Component (iOS 26 Liquid Glass)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  CalendarBlank,
  Users,
  CaretRight,
} from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import { formatPaiseToRupees } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
import { ProgressBar } from '../../../ui/visualization/ProgressBar';
import { Badge } from '../../../ui/controls/Badge';
import type { Outing, OutingSummary } from '../types';

interface OutingCardProps {
  outing: Outing;
  summary?: OutingSummary | null;
}

export function OutingCard({ outing, summary }: OutingCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    triggerHaptic('light');
    navigate(`/outings/${outing.id}`);
  };

  // Format dates
  const startDateStr = outing.startDate ? format(parseISO(outing.startDate), 'MMM d, yyyy') : '';
  const endDateStr = outing.endDate ? format(parseISO(outing.endDate), 'MMM d, yyyy') : '';
  const dateDisplay = endDateStr && endDateStr !== startDateStr
    ? `${startDateStr} – ${endDateStr}`
    : startDateStr;

  const participantCount = outing.participantIds?.length || 1;

  const statusLabel = outing.status ? outing.status.charAt(0).toUpperCase() + outing.status.slice(1) : 'Planned';
  const statusColor = outing.status === 'completed' ? '#8E8E93' : outing.status === 'ongoing' ? '#30D158' : '#0A84FF';

  const budgetPaise = outing.budget || 0;
  const totalCost = summary?.totalCost || 0;
  const budgetProgress = budgetPaise > 0 ? Math.min(1, totalCost / budgetPaise) : 0;
  const isOverBudget = summary?.isOverBudget || (budgetPaise > 0 && totalCost > budgetPaise);

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-2xl glass-card p-4 shadow-sm hover:bg-white/[0.08] transition-all active:scale-[0.99] cursor-pointer overflow-hidden select-none"
    >
      {/* Top row: Name & Status Chip */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate group-hover:text-[#40C8E0] transition-colors">
            {outing.name}
          </h3>
          {outing.place && (
            <p className="text-xs text-[#8E8E93] flex items-center gap-1.5 mt-0.5 truncate">
              <MapPin size={13} weight="fill" className="text-[#40C8E0] shrink-0" />
              <span className="truncate">{outing.place}</span>
            </p>
          )}
        </div>

        <Badge label={statusLabel} color={statusColor} />
      </div>

      {/* Meta Row: Dates & People */}
      <div className="flex items-center gap-3 text-xs text-[#8E8E93] font-medium mb-3">
        {dateDisplay && (
          <div className="flex items-center gap-1">
            <CalendarBlank size={13} className="text-[#8E8E93]" />
            <span>{dateDisplay}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users size={13} className="text-[#8E8E93]" />
          <span>
            {participantCount} {participantCount === 1 ? 'person' : 'people'}
          </span>
        </div>
      </div>

      {/* Financials Row: My Share & Total Cost */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl glass-flat mb-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8E8E93] font-medium block">
            My Share
          </span>
          <span className="text-sm font-semibold text-white">
            {formatPaiseToRupees(summary?.myShare || 0)}
          </span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8E8E93] font-medium block">
            Total Spent
          </span>
          <span className="text-sm font-semibold text-white">
            {formatPaiseToRupees(totalCost)}
          </span>
        </div>
      </div>

      {/* Budget Progress if budget is set */}
      {budgetPaise > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8E8E93]">Budget ({Math.round(budgetProgress * 100)}%)</span>
            <span className={isOverBudget ? 'text-[#FF453A] font-semibold' : 'text-[#8E8E93]'}>
              {formatPaiseToRupees(totalCost)} / {formatPaiseToRupees(budgetPaise)}
            </span>
          </div>
          <ProgressBar
            progress={budgetProgress}
            color={isOverBudget ? '#FF453A' : '#40C8E0'}
            height={6}
          />
        </div>
      )}

      {/* Right chevron indicator */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[#8E8E93]">
        <CaretRight size={16} />
      </div>
    </div>
  );
}

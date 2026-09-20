/**
 * LifeOS — OutingCard Component
 * 
 * Displays outing summary in the /outings list:
 * - Name, place, date range
 * - Status badge (Planned, Ongoing, Completed)
 * - My Share vs Total Cost
 * - Budget progress bar with exact remaining / over label
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatPaiseToRupees } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
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

  // Status styling
  const statusConfig = {
    planned: {
      label: 'Planned',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
    },
    ongoing: {
      label: 'Ongoing',
      badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    },
    completed: {
      label: 'Completed',
      badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25',
    },
  }[outing.status || 'planned'];

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-[26px] liquid-glass border border-[var(--card-border)] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer overflow-hidden select-none"
    >
      {/* Top row: Name & Status Chip */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark truncate group-hover:text-accent transition-colors">
            {outing.name}
          </h3>
          {outing.place && (
            <p className="text-xs text-secondary-light dark:text-secondary-dark flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={12} className="text-accent shrink-0" />
              <span className="truncate">{outing.place}</span>
            </p>
          )}
        </div>

        <span
          className={`text-[10px] font-tag font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${statusConfig.badge}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Meta Row: Dates & People */}
      <div className="flex items-center gap-3 text-[11px] text-secondary-light dark:text-secondary-dark font-medium mb-3.5">
        {dateDisplay && (
          <div className="flex items-center gap-1">
            <Calendar size={12} className="opacity-70" />
            <span>{dateDisplay}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users size={12} className="opacity-70" />
          <span>
            {participantCount} {participantCount === 1 ? 'person' : 'people'}
          </span>
        </div>
      </div>

      {/* Financials Row: My Share & Total Cost */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-[18px] bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] mb-3">
        <div>
          <span className="text-[10px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            My Share
          </span>
          <p className="text-sm font-stat font-bold text-primary-light dark:text-primary-dark mt-0.5">
            {summary ? formatPaiseToRupees(summary.myShare) : '₹0'}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            Total Cost
          </span>
          <p className="text-sm font-stat font-bold text-primary-light dark:text-primary-dark mt-0.5">
            {summary ? formatPaiseToRupees(summary.totalCost) : '₹0'}
          </p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      {outing.budget && outing.budget > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-secondary-light dark:text-secondary-dark font-medium">
              Budget ({outing.budgetBasis === 'totalCost' ? 'Total' : 'My Share'}):{' '}
              <span className="font-stat font-bold text-primary-light dark:text-primary-dark">
                {formatPaiseToRupees(outing.budget)}
              </span>
            </span>

            {summary && (
              <span
                className={`font-stat font-bold flex items-center gap-1 ${
                  summary.isOverBudget
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {summary.isOverBudget ? (
                  <>
                    <AlertCircle size={12} />
                    <span>{formatPaiseToRupees(Math.abs(summary.budgetRemaining))} over</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>{formatPaiseToRupees(summary.budgetRemaining)} left</span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary?.isOverBudget
                  ? 'bg-rose-500'
                  : 'bg-accent'
              }`}
              style={{
                width: `${Math.min(100, summary?.budgetProgressPct || 0)}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-muted-light dark:text-muted-dark pt-1">
          <span>No budget set</span>
          <span className="flex items-center gap-1 text-accent font-medium group-hover:translate-x-0.5 transition-transform">
            View details <ChevronRight size={13} />
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * LifeOS — OutingDetailPage Component (`/outings/:id`)
 * 
 * Comprehensive Outing Detail View:
 * - Header: Name, place (with Open in Maps), dates, status, edit & delete menu
 * - Summary cards: Total cost, My share, I paid, Budget progress, Net balance
 * - Tabs: Expenses, People, Receipts, Notes
 * - Category breakdown horizontal bars
 * - Add expense button & sheet
 * - Settle up button & modal
 * - Multi-line notes with 500ms debounced autosave
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Plus,
  Receipt,
  Scale,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  DollarSign,
  ShoppingBag,
  PenLine,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useOutings } from '../context/OutingsContext';
import { formatPaiseToRupees } from '../utils/calculations';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ExpenseList } from '../components/ExpenseList';
import { ReceiptsGrid } from '../components/ReceiptsGrid';
import { CreateOutingSheet } from '../components/CreateOutingSheet';
import { AddExpenseSheet } from '../components/AddExpenseSheet';
import { ManualEntrySheet } from '../components/ManualEntrySheet';
import { SettleUpModal } from '../components/SettleUpModal';
import { triggerHaptic } from '../../../utils/haptics';
import { useM3Feedback } from '../../../components/m3/M3FeedbackContext';
import type { OutingExpense } from '../types';

type DetailTab = 'expenses' | 'people' | 'receipts' | 'notes';

export default function OutingDetailPage() {
  const { id: outingId, expenseId } = useParams<{ id: string; expenseId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmDelete } = useM3Feedback();

  const {
    outings,
    people,
    activeOuting,
    activeExpenses,
    activeReceipts,
    activeSummary,
    setActiveOutingId,
    updateOuting,
    deleteOuting,
    deleteExpense,
    deleteReceipt,
  } = useOutings();

  const [activeTab, setActiveTab] = useState<DetailTab>('expenses');
  const [isEditOutingOpen, setIsEditOutingOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OutingExpense | null>(null);


  // Local notes autosave state
  const [notesContent, setNotesContent] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const autosaveTimerRef = useRef<any>(null);

  // Set active outing in context
  useEffect(() => {
    if (outingId) {
      setActiveOutingId(outingId);
    }
    return () => {
      setActiveOutingId(null);
    };
  }, [outingId, setActiveOutingId]);

  // Sync notes content
  useEffect(() => {
    if (activeOuting) {
      setNotesContent(activeOuting.notes || '');
    }
  }, [activeOuting]);

  // Handle deep sub-routes (/add, /settle, /expense/:id)
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/add')) {
      setIsAddExpenseOpen(true);
      setEditingExpense(null);
    } else if (path.endsWith('/settle')) {
      setIsSettleOpen(true);
    } else if (expenseId && activeExpenses.length > 0) {
      const exp = activeExpenses.find((e) => e.id === expenseId);
      if (exp) {
        setEditingExpense(exp);
        setIsAddExpenseOpen(true);
      }
    }
  }, [location.pathname, expenseId, activeExpenses]);

  // Debounced notes autosave
  const handleNotesChange = (text: string) => {
    setNotesContent(text);
    setIsSavingNotes(true);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      if (activeOuting) {
        await updateOuting(activeOuting.id, { notes: text });
      }
      setIsSavingNotes(false);
    }, 500);
  };

  // Participant list mapped
  const participants = useMemo(() => {
    if (!activeOuting) return [];
    const pIds = activeOuting.participantIds || ['me'];
    return people.filter((p) => pIds.includes(p.id));
  }, [activeOuting, people]);

  if (!activeOuting) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-20 text-center space-y-3 select-none">
        <h3 className="text-base font-bold text-primary-light dark:text-primary-dark">
          Outing Not Found
        </h3>
        <button
          type="button"
          onClick={() => navigate('/outings')}
          className="px-4 py-2 rounded-2xl bg-accent text-white text-xs font-bold active:scale-95 transition-all"
        >
          Return to Outings
        </button>
      </div>
    );
  }

  // Dates display
  const startDateStr = activeOuting.startDate
    ? format(parseISO(activeOuting.startDate), 'MMM d, yyyy')
    : '';
  const endDateStr = activeOuting.endDate
    ? format(parseISO(activeOuting.endDate), 'MMM d, yyyy')
    : '';
  const dateDisplay =
    endDateStr && endDateStr !== startDateStr
      ? `${startDateStr} – ${endDateStr}`
      : startDateStr;

  // Status config
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
  }[activeOuting.status || 'planned'];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-16 pb-28 space-y-4 select-none">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('nav');
            navigate('/outings');
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-primary-light dark:text-primary-dark active:scale-95 transition-all cursor-pointer"
          aria-label="Back to outings list"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          {/* Settle Up Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsSettleOpen(true);
            }}
            className="px-3 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/25 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <Scale size={14} />
            <span>Settle Up</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsEditOutingOpen(true);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark hover:text-primary-light active:scale-95 transition-all cursor-pointer"
            title="Edit outing details"
          >
            <Edit2 size={15} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => {
              confirmDelete({
                title: 'Delete Outing?',
                itemName: activeOuting.name,
                message: 'All associated expenses, receipts, and split balances will be deleted.',
                section: 'outings',
                onConfirm: async () => {
                  deleteOuting(activeOuting.id);
                  navigate('/outings');
                },
              });
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
            title="Delete outing"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Outing Title & Metadata ── */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-light dark:text-primary-dark tracking-tight leading-tight">
            {activeOuting.name}
          </h1>
          <span
            className={`text-[10px] font-tag font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 mt-1 ${statusConfig.badge}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-light dark:text-secondary-dark font-medium">
          {activeOuting.place && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                activeOuting.place
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic('selection')}
              className="inline-flex items-center gap-1 text-accent hover:underline font-bold"
            >
              <MapPin size={13} className="shrink-0" />
              <span>{activeOuting.place}</span>
              <ExternalLink size={10} className="opacity-70" />
            </a>
          )}

          {dateDisplay && (
            <div className="flex items-center gap-1">
              <Calendar size={13} className="opacity-70" />
              <span>{dateDisplay}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Users size={13} className="opacity-70" />
            <span>
              {participants.length} {participants.length === 1 ? 'person' : 'people'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary Cards Grid ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Cost Card */}
        <div className="p-3.5 sm:p-4 rounded-[22px] liquid-glass border border-[var(--card-border)] space-y-0.5 shadow-xs">
          <span className="text-[10px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            Total Cost
          </span>
          <p className="text-lg sm:text-xl font-stat font-bold text-primary-light dark:text-primary-dark">
            {activeSummary ? formatPaiseToRupees(activeSummary.totalCost) : '₹0'}
          </p>
        </div>

        {/* My Share Card */}
        <div className="p-3.5 sm:p-4 rounded-[22px] liquid-glass border border-[var(--card-border)] space-y-0.5 shadow-xs">
          <span className="text-[10px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            My Share
          </span>
          <p className="text-lg sm:text-xl font-stat font-bold text-accent">
            {activeSummary ? formatPaiseToRupees(activeSummary.myShare) : '₹0'}
          </p>
        </div>

        {/* I Paid Card */}
        <div className="p-3.5 sm:p-4 rounded-[22px] liquid-glass border border-[var(--card-border)] space-y-0.5 shadow-xs">
          <span className="text-[10px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            I Paid
          </span>
          <p className="text-base sm:text-lg font-stat font-bold text-primary-light dark:text-primary-dark">
            {activeSummary ? formatPaiseToRupees(activeSummary.myPaid) : '₹0'}
          </p>
        </div>

        {/* Net Balance Card */}
        <div className="p-3.5 sm:p-4 rounded-[22px] liquid-glass border border-[var(--card-border)] space-y-0.5 shadow-xs">
          <span className="text-[10px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            My Balance
          </span>
          <p
            className={`text-base sm:text-lg font-stat font-bold ${
              (activeSummary?.myNetBalance || 0) > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : (activeSummary?.myNetBalance || 0) < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-muted-light dark:text-muted-dark'
            }`}
          >
            {activeSummary?.myNetBalance === 0
              ? 'All Settled'
              : (activeSummary?.myNetBalance || 0) > 0
              ? `+${formatPaiseToRupees(activeSummary!.myNetBalance)}`
              : formatPaiseToRupees(activeSummary?.myNetBalance || 0)}
          </p>
        </div>
      </div>

      {/* ── Budget Progress Card ── */}
      {activeOuting.budget && activeOuting.budget > 0 && (
        <div className="p-4 rounded-[24px] liquid-glass border border-[var(--card-border)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary-light dark:text-secondary-dark font-medium">
              Budget ({activeOuting.budgetBasis === 'totalCost' ? 'Total Cost' : 'My Share'}):{' '}
              <span className="font-stat font-bold text-primary-light dark:text-primary-dark">
                {formatPaiseToRupees(activeOuting.budget)}
              </span>
            </span>

            {activeSummary && (
              <span
                className={`font-stat font-bold flex items-center gap-1 ${
                  activeSummary.isOverBudget
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {activeSummary.isOverBudget ? (
                  <>
                    <AlertCircle size={12} />
                    <span>{formatPaiseToRupees(Math.abs(activeSummary.budgetRemaining))} over</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>{formatPaiseToRupees(activeSummary.budgetRemaining)} left</span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                activeSummary?.isOverBudget ? 'bg-rose-500' : 'bg-accent'
              }`}
              style={{
                width: `${Math.min(100, activeSummary?.budgetProgressPct || 0)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Primary Actions: Add Expense + Manual Entry ── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
          className="py-3.5 rounded-[22px] bg-accent text-white font-bold text-sm shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.4} />
          <span>Add Expense</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsManualEntryOpen(true);
          }}
          className="py-3.5 rounded-[22px] bg-black/[0.05] dark:bg-white/[0.08] border border-[var(--card-border)] text-primary-light dark:text-primary-dark font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PenLine size={16} strokeWidth={2.3} />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* ── Category Breakdown Bars ── */}
      {activeSummary && (
        <CategoryBreakdown
          expenses={activeExpenses}
          totalCost={activeSummary.totalCost}
        />
      )}

      {/* ── Tabs (Expenses, People, Receipts, Notes) ── */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs font-bold">
          {(
            [
              { id: 'expenses', label: `Expenses (${activeExpenses.length})` },
              { id: 'people', label: `People (${participants.length})` },
              { id: 'receipts', label: `Receipts (${activeReceipts.length})` },
              { id: 'notes', label: 'Notes' },
            ] as { id: DetailTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab(tab.id);
                }}
                className={`py-2 rounded-xl transition-all truncate text-center ${
                  active
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Expenses */}
        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={activeExpenses}
            people={people}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsAddExpenseOpen(true);
            }}
            onDeleteExpense={deleteExpense}
          />
        )}

        {/* Tab 2: People & Individual Balances */}
        {activeTab === 'people' && (
          <div className="space-y-2">
            {participants.map((p) => {
              const balance = activeSummary?.balances.get(p.id) ?? 0;
              const isCreditor = balance > 0;
              const isDebtor = balance < 0;

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-[22px] liquid-glass border border-[var(--card-border)] flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-primary-light dark:text-primary-dark truncate">
                      {p.isMe ? 'Me (You)' : p.name}
                    </h5>
                    <p className="text-[11px] text-secondary-light dark:text-secondary-dark">
                      {p.isMe ? 'Main App User' : 'Participant'}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-stat font-bold ${
                      isCreditor
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isDebtor
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-muted-light dark:text-muted-dark'
                    }`}
                  >
                    {isCreditor && `Gets ${formatPaiseToRupees(balance)}`}
                    {isDebtor && `Owes ${formatPaiseToRupees(Math.abs(balance))}`}
                    {balance === 0 && 'Settled (₹0)'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Receipts */}
        {activeTab === 'receipts' && (
          <ReceiptsGrid
            receipts={activeReceipts}
            expenses={activeExpenses}
            onDeleteReceipt={deleteReceipt}
            onNavigateToExpense={(exp) => {
              setEditingExpense(exp);
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {/* Tab 4: Notes */}
        {activeTab === 'notes' && (
          <div className="rounded-[24px] liquid-glass border border-[var(--card-border)] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-secondary-light dark:text-secondary-dark font-medium">
              <span className="font-tag uppercase tracking-wider">Outing Notes</span>
              {isSavingNotes && (
                <span className="text-[10px] text-accent font-bold animate-pulse">
                  Saving...
                </span>
              )}
            </div>

            <textarea
              value={notesContent}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={8}
              placeholder="Jot down packing lists, itineraries, hotel booking numbers, or memories..."
              className="w-full bg-transparent text-sm text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Edit Outing Sheet */}
      <CreateOutingSheet
        isOpen={isEditOutingOpen}
        onClose={() => setIsEditOutingOpen(false)}
        outingToEdit={activeOuting}
      />

      {/* Add / Edit Expense Sheet */}
      <AddExpenseSheet
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        outing={activeOuting}
        expenseToEdit={editingExpense}
      />

      {/* Manual Entry Sheet (Shopping Receipt / Lend / Received) */}
      <ManualEntrySheet
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        outing={activeOuting}
        defaultMode="shopping"
      />

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        outing={activeOuting}
        summary={activeSummary}
      />
    </div>
  );
}

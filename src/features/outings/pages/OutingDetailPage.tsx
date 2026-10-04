/**
 * LifeOS — OutingDetailPage Component (`/outings/:id`) - iOS 26 Liquid Glass
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CaretLeft,
  MapPin,
  CalendarBlank,
  Users,
  Plus,
  Scales,
  ArrowSquareOut,
  PencilSimple,
  Trash,
  WarningCircle,
  CheckCircle,
  NotePencil,
} from '@phosphor-icons/react';
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
import { handleAppBack } from '../../../utils/backNavigation';
import { useM3Feedback } from '../../../components/m3/M3FeedbackContext';
import { Toolbar } from '../../../ui/navigation/Toolbar';
import { Segmented } from '../../../ui/controls/Segmented';
import { Button } from '../../../ui/controls/Button';
import { Badge } from '../../../ui/controls/Badge';
import { ProgressBar } from '../../../ui/visualization/ProgressBar';
import type { OutingExpense } from '../types';

type DetailTab = 'expenses' | 'people' | 'receipts' | 'notes';

export default function OutingDetailPage() {
  const { id: outingId, expenseId } = useParams<{ id: string; expenseId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmDelete } = useM3Feedback();

  const {
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">Outing Not Found</h3>
        <Button variant="glass" onClick={() => navigate('/outings')}>
          Return to Outings
        </Button>
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

  const statusLabel = activeOuting.status ? activeOuting.status.charAt(0).toUpperCase() + activeOuting.status.slice(1) : 'Planned';
  const statusColor = activeOuting.status === 'completed' ? '#8E8E93' : activeOuting.status === 'ongoing' ? '#30D158' : '#0A84FF';

  const budgetPaise = activeOuting.budget || 0;
  const budgetProgress = budgetPaise > 0 ? Math.min(1, (activeSummary?.totalCost || 0) / budgetPaise) : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* ── Top Navigation Bar ── */}
      <Toolbar
        leading={
          <button
            onClick={() => handleAppBack(navigate)}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
        }
        center={
          <span className="text-sm font-semibold text-white truncate max-w-[180px]">
            {activeOuting.name}
          </span>
        }
        trailing={
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsSettleOpen(true);
              }}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              title="Settle"
            >
              <Scales size={20} />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsEditOutingOpen(true);
              }}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              title="Edit"
            >
              <PencilSimple size={20} />
            </button>
            <button
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
              className="p-2 rounded-lg text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
              title="Delete"
            >
              <Trash size={20} />
            </button>
          </div>
        }
      />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* ── Outing Title & Metadata ── */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
              {activeOuting.name}
            </h1>
            <Badge label={statusLabel} color={statusColor} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E8E93] font-medium">
            {activeOuting.place && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activeOuting.place
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('selection')}
                className="inline-flex items-center gap-1 text-[#40C8E0] hover:underline font-semibold"
              >
                <MapPin size={14} weight="fill" className="shrink-0" />
                <span>{activeOuting.place}</span>
                <ArrowSquareOut size={11} className="opacity-70" />
              </a>
            )}

            {dateDisplay && (
              <div className="flex items-center gap-1">
                <CalendarBlank size={14} className="opacity-70" />
                <span>{dateDisplay}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Users size={14} className="opacity-70" />
              <span>
                {participants.length} {participants.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Summary Cards Grid ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Cost Card */}
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8E93] font-medium">
              Total Cost
            </span>
            <p className="text-xl font-bold text-white tracking-tight">
              {activeSummary ? formatPaiseToRupees(activeSummary.totalCost) : '₹0'}
            </p>
          </div>

          {/* My Share Card */}
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8E93] font-medium">
              My Share
            </span>
            <p className="text-xl font-bold text-[#40C8E0] tracking-tight">
              {activeSummary ? formatPaiseToRupees(activeSummary.myShare) : '₹0'}
            </p>
          </div>

          {/* I Paid Card */}
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8E93] font-medium">
              I Paid
            </span>
            <p className="text-lg font-bold text-white">
              {activeSummary ? formatPaiseToRupees(activeSummary.myPaid) : '₹0'}
            </p>
          </div>

          {/* Net Balance Card */}
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8E93] font-medium">
              My Balance
            </span>
            <p
              className={`text-lg font-bold ${
                (activeSummary?.myNetBalance || 0) > 0
                  ? 'text-[#30D158]'
                  : (activeSummary?.myNetBalance || 0) < 0
                  ? 'text-[#FF453A]'
                  : 'text-[#8E8E93]'
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
          <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E8E93] font-medium">
                Budget ({activeOuting.budgetBasis === 'totalCost' ? 'Total' : 'My Share'}):{' '}
                <span className="font-semibold text-white">
                  {formatPaiseToRupees(activeOuting.budget)}
                </span>
              </span>

              {activeSummary && (
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    activeSummary.isOverBudget
                      ? 'text-[#FF453A]'
                      : 'text-[#30D158]'
                  }`}
                >
                  {activeSummary.isOverBudget ? (
                    <>
                      <WarningCircle size={13} weight="fill" />
                      <span>{formatPaiseToRupees(Math.abs(activeSummary.budgetRemaining))} over</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} weight="fill" />
                      <span>{formatPaiseToRupees(activeSummary.budgetRemaining)} left</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <ProgressBar
              progress={budgetProgress}
              color={activeSummary?.isOverBudget ? '#FF453A' : '#40C8E0'}
              height={6}
            />
          </div>
        )}

        {/* ── Primary Actions: Add Expense + Manual Entry ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="prominent"
            tint="#40C8E0"
            icon={<Plus size={18} weight="bold" />}
            onClick={() => {
              triggerHaptic('light');
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
          >
            Add Expense
          </Button>

          <Button
            variant="glass"
            icon={<NotePencil size={18} />}
            onClick={() => {
              triggerHaptic('light');
              setIsManualEntryOpen(true);
            }}
          >
            Manual Entry
          </Button>
        </div>

        {/* ── Category Breakdown Bars ── */}
        {activeSummary && (
          <CategoryBreakdown
            expenses={activeExpenses}
            totalCost={activeSummary.totalCost}
          />
        )}

        {/* ── Tabs (Expenses, People, Receipts, Notes) ── */}
        <div className="space-y-3 pt-1">
          <Segmented
            options={[
              { value: 'expenses', label: `Expenses (${activeExpenses.length})` },
              { value: 'people', label: `People (${participants.length})` },
              { value: 'receipts', label: `Receipts (${activeReceipts.length})` },
              { value: 'notes', label: 'Notes' },
            ]}
            value={activeTab}
            onChange={(val) => {
              triggerHaptic('selection');
              setActiveTab(val as DetailTab);
            }}
            tint="#40C8E0"
          />

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
                    className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <h5 className="text-sm font-semibold text-white truncate">
                        {p.isMe ? 'Me (You)' : p.name}
                      </h5>
                      <p className="text-[11px] text-[#8E8E93]">
                        {p.isMe ? 'Main App User' : 'Participant'}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        isCreditor
                          ? 'text-[#30D158]'
                          : isDebtor
                          ? 'text-[#FF453A]'
                          : 'text-[#8E8E93]'
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
            <div className="rounded-2xl bg-[#1C1C1E] border border-white/[0.08] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8E8E93] font-medium">
                <span className="uppercase tracking-wider">Outing Notes</span>
                {isSavingNotes && (
                  <span className="text-[11px] text-[#40C8E0] font-semibold animate-pulse">
                    Saving...
                  </span>
                )}
              </div>

              <textarea
                value={notesContent}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={8}
                placeholder="Jot down packing lists, itineraries, hotel booking numbers, or memories..."
                className="w-full bg-transparent text-sm text-white placeholder:text-[#636366] focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
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

      {/* Manual Entry Sheet */}
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

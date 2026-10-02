import React, { useState } from 'react';
import { Check, X, Sparkles, Loader2, CheckSquare, ShoppingCart, MapPin, Utensils, Dumbbell } from 'lucide-react';
import { AiActionProposal, executeConfirmedAiAction } from '../../services/aiActionEngine';
import { triggerHaptic } from '../../utils/haptics';

interface ActionConfirmationCardProps {
  proposal: AiActionProposal;
  updateData: (partial: any) => Promise<any>;
  currentData: any;
  onExecuted: (resultMessage: string) => void;
}

export default function ActionConfirmationCard({
  proposal,
  updateData,
  currentData,
  onExecuted,
}: ActionConfirmationCardProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>(
    proposal.confirmed ? 'confirmed' : 'pending'
  );

  const getActionIcon = () => {
    switch (proposal.type) {
      case 'ADD_TASK':
        return <CheckSquare size={14} className="text-[var(--md-primary)]" />;
      case 'ADD_SHOPPING_ITEM':
      case 'ADD_MULTIPLE_SHOPPING_ITEMS':
        return <ShoppingCart size={14} className="text-emerald-500" />;
      case 'CREATE_OUTING':
        return <MapPin size={14} className="text-amber-500" />;
      case 'LOG_MEAL':
        return <Utensils size={14} className="text-orange-500" />;
      case 'LOG_WORKOUT':
        return <Dumbbell size={14} className="text-cyan-500" />;
      default:
        return <Sparkles size={14} className="text-[var(--md-primary)]" />;
    }
  };

  const handleConfirm = async () => {
    triggerHaptic('medium');
    setLoading(true);
    try {
      const result = await executeConfirmedAiAction(proposal, updateData, currentData);
      if (result.success) {
        setStatus('confirmed');
        proposal.confirmed = true;
        proposal.executed = true;
        onExecuted(result.message);
      } else {
        alert(`Action error: ${result.message}`);
      }
    } catch (err: any) {
      alert(`Action error: ${err.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    triggerHaptic('light');
    setStatus('cancelled');
  };

  if (status === 'cancelled') {
    return (
      <div className="p-3 rounded-2xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface-variant)] italic">
        Action cancelled.
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
        <Check size={15} className="text-emerald-500 shrink-0" />
        <span>Confirmed & Executed: {proposal.title}</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] hover:border-[var(--md-primary)]/40 shadow-xs space-y-2.5 my-2.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--md-primary)]">
          {getActionIcon()}
          <span>Proposed AI Action</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]">
          1-Tap Save
        </span>
      </div>

      <div>
        <h4 className="text-xs font-bold text-[var(--md-on-surface)] leading-snug">
          {proposal.title}
        </h4>
        {proposal.description && (
          <p className="text-[11px] text-[var(--md-on-surface-variant)] font-mono mt-0.5 leading-relaxed">
            {proposal.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="py-1.5 px-3 rounded-xl border border-[var(--md-outline-variant)] text-[11px] font-bold text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-highest)] transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="py-1.5 px-3 rounded-xl bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90 active:scale-95 text-[11px] font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          <span>Confirm & Add</span>
        </button>
      </div>
    </div>
  );
}

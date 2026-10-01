import React, { useState } from 'react';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
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
      <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-muted-light dark:text-muted-dark italic">
        Action cancelled.
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
        <Check size={14} className="text-emerald-500 shrink-0" />
        <span>Confirmed & Executed: {proposal.title}</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/30 space-y-2.5 my-2">
      <div className="flex items-center gap-2 text-xs font-bold text-accent">
        <Sparkles size={14} />
        <span>Proposed AI Action</span>
      </div>

      <div>
        <h4 className="text-xs font-extrabold text-primary-light dark:text-primary-dark">
          {proposal.title}
        </h4>
        {proposal.description && (
          <p className="text-[11px] text-secondary-light dark:text-secondary-dark font-mono mt-0.5">
            {proposal.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="py-1.5 px-3 rounded-xl border border-border-light dark:border-border-dark text-[11px] font-bold text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="py-1.5 px-3 rounded-xl btn-primary text-[11px] font-bold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          <span>Confirm</span>
        </button>
      </div>
    </div>
  );
}

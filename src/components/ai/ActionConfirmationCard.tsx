import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkle,
  SpinnerGap,
  CheckSquare,
  ShoppingCart,
  MapPin,
  ForkKnife,
  Barbell,
  Wallet,
  NotePencil,
  GraduationCap,
} from '../../ui/tokens/icons';
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
        return <CheckSquare size={16} weight="duotone" className="text-[#0A84FF]" />;
      case 'ADD_NOTE':
        return <NotePencil size={16} weight="duotone" className="text-[#FFD60A]" />;
      case 'ADD_STUDY_SESSION':
        return <GraduationCap size={16} weight="duotone" className="text-[#64D2FF]" />;
      case 'ADD_EXPENSE':
        return <Wallet size={16} weight="duotone" className="text-[#30D158]" />;
      case 'ADD_SHOPPING_ITEM':
      case 'ADD_MULTIPLE_SHOPPING_ITEMS':
        return <ShoppingCart size={16} weight="duotone" className="text-[#FF375F]" />;
      case 'CREATE_OUTING':
        return <MapPin size={16} weight="duotone" className="text-[#40C8E0]" />;
      case 'LOG_MEAL':
        return <ForkKnife size={16} weight="duotone" className="text-[#FF9F0A]" />;
      case 'LOG_WORKOUT':
        return <Barbell size={16} weight="duotone" className="text-[#FF453A]" />;
      default:
        return <Sparkle size={16} weight="fill" className="text-[#BF5AF2]" />;
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
      <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-white/10 text-xs text-white/50 italic">
        Action cancelled.
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">
        <Check size={16} weight="bold" className="text-emerald-400 shrink-0" />
        <span>Confirmed: {proposal.title}</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-[22px] bg-[#1C1C1E] border border-white/12 shadow-lg space-y-2.5 my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            {getActionIcon()}
          </div>
          <span className="truncate">{proposal.title}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
          Proposal
        </span>
      </div>

      {proposal.description && (
        <p className="text-xs text-white/70 pl-8 leading-relaxed">
          {proposal.description}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
        >
          <X size={13} weight="bold" />
          <span>Dismiss</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow flex items-center gap-1.5"
        >
          {loading ? (
            <SpinnerGap size={13} className="animate-spin" />
          ) : (
            <Check size={13} weight="bold" />
          )}
          <span>Confirm &amp; Save</span>
        </button>
      </div>
    </div>
  );
}

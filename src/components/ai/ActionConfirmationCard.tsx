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
          {getActionIcon()}
          <span>Proposed AI Action</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#BF5AF2]/20 text-[#BF5AF2]">
          1-Tap Save
        </span>
      </div>

      <div>
        <h4 className="text-xs font-bold text-white leading-snug">
          {proposal.title}
        </h4>
        {proposal.description && (
          <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed font-sans">
            {proposal.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="py-2 px-3 rounded-xl border border-white/15 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#BF5AF2] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          {loading ? <SpinnerGap size={14} className="animate-spin" /> : <Check size={14} weight="bold" />}
          <span>Confirm & Add</span>
        </button>
      </div>
    </div>
  );
}

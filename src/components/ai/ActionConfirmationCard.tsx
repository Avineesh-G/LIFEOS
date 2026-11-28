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
  RocketLaunch,
  SuitcaseRolling,
  Scales,
  UsersThree,
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
    const iconProps = { size: 16, weight: 'duotone' as const, style: { color: 'var(--app-accent-text, #D29B7E)' } };
    switch (proposal.type) {
      case 'ADD_TASK':
        return <CheckSquare {...iconProps} />;
      case 'ADD_NOTE':
        return <NotePencil {...iconProps} />;
      case 'ADD_EXPENSE':
        return <Wallet {...iconProps} />;
      case 'ADD_SHOPPING_ITEM':
      case 'ADD_MULTIPLE_SHOPPING_ITEMS':
        return <ShoppingCart {...iconProps} />;
      case 'CREATE_OUTING':
        return <MapPin {...iconProps} />;
      case 'LOG_MEAL':
        return <ForkKnife {...iconProps} />;
      case 'LOG_WORKOUT':
        return <Barbell {...iconProps} />;
      case 'CREATE_PROJECT':
      case 'ADD_PROJECT_MILESTONE':
        return <RocketLaunch {...iconProps} />;
      case 'CREATE_TRIP':
      case 'ADD_PACKING_ITEMS':
        return <SuitcaseRolling {...iconProps} />;
      case 'CREATE_DECISION':
        return <Scales {...iconProps} />;
      case 'LOG_CIRCLE_CATCHUP':
        return <UsersThree {...iconProps} />;
      default:
        return <Sparkle size={16} weight="fill" style={{ color: 'var(--app-accent-text, #D29B7E)' }} />;
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
      <div className="w-full max-w-full p-3 rounded-2xl bg-white/[0.04] border-none text-xs text-white/40 italic flex items-center gap-2">
        <X size={13} weight="bold" className="text-white/30 shrink-0" />
        <span>Action dismissed</span>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div
        className="w-full max-w-full p-3 rounded-2xl border-none text-xs font-semibold flex items-center gap-2 shadow-sm"
        style={{
          backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
          color: 'var(--app-accent-text, #D29B7E)',
        }}
      >
        <Check size={16} weight="bold" className="shrink-0" />
        <span className="truncate">Confirmed: {proposal.title}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-3.5 rounded-[22px] bg-[#141418] border-none shadow-[0_12px_36px_-8px_rgba(0,0,0,0.85)] space-y-2.5 my-2.5 overflow-hidden">
      {/* Header Row: Title & Badge with Flexible Wrap */}
      <div className="flex items-start justify-between gap-2.5 w-full">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
            {getActionIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white leading-snug break-words">
              {proposal.title}
            </h4>
          </div>
        </div>
        <span
          className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 shadow-sm self-start mt-0.5"
          style={{
            backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
            color: 'var(--app-accent-text, #D29B7E)',
          }}
        >
          Proposal
        </span>
      </div>

      {/* Description / Metadata */}
      {proposal.description && (
        <p className="text-[11.5px] text-white/60 pl-9.5 leading-relaxed break-words">
          {proposal.description}
        </p>
      )}

      {/* Footer Divider & Action Buttons */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-[transform,opacity,background-color,color] flex items-center gap-1.5 cursor-pointer touch-manipulation"
        >
          <X size={13} weight="bold" />
          <span>Dismiss</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 active:scale-95 transition-[transform,opacity,background-color,color] shadow-[0_2px_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 cursor-pointer touch-manipulation"
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

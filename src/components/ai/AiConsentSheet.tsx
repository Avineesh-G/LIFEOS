import React from 'react';
import { ShieldCheck, Lock, Sparkles, Check } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import { setHasAgreedConsent } from '../../utils/aiSecurity';
import { triggerHaptic } from '../../utils/haptics';

interface AiConsentSheetProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function AiConsentSheet({ isOpen, onAccept, onClose }: AiConsentSheetProps) {
  const handleAgree = () => {
    triggerHaptic('medium');
    setHasAgreedConsent(true);
    onAccept();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 select-none pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-primary-light dark:text-primary-dark tracking-tight">
              Before You Use Ask LifeOS
            </h2>
            <p className="text-xs text-secondary-light dark:text-secondary-dark font-mono">
              Privacy & Data Transparency Notice
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-accent/08 border border-accent/20 space-y-2.5 text-xs text-primary-light dark:text-primary-dark">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              When you ask a question, a compact summary of relevant data (tasks, spending, workout, nutrition) is sent to Groq AI to formulate an answer.
            </p>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-accent/15">
            <Lock size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Vault Strictly Excluded:</strong> Your Vault credentials and passwords are <u className="decoration-emerald-500">always hard-excluded</u> and never read or transmitted.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-light dark:text-muted-dark leading-normal">
          You can customize exactly which sections AI may read or turn off AI data reading anytime in <strong>Settings &gt; AI Settings</strong>. Chat history remains saved locally on your device only.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-2xl border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAgree}
            className="py-3 rounded-2xl btn-primary text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Check size={15} />
            <span>I Agree & Continue</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

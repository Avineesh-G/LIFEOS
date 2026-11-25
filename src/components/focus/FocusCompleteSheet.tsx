import React, { useState, useEffect } from 'react';
import { Sheet } from '../../ui/feedback/Sheet';
import { Button } from '../../ui/controls/Button';
import { Switch } from '../../ui/controls/Switch';
import { CheckCircle, Play, Clock, Brain, SpinnerGap } from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { summarizeFocusNotes } from '../../services/newInterfaceAiService';

export interface FocusCompleteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  phase: 'focus' | 'break';
  targetLabel: string;
  durationMinutes: number;
  hasLinkedTask: boolean;
  initialNotes: string[];
  breakMinutes: number;
  onSaveFocus: (opts: { notes: string; markTaskComplete: boolean; startBreakAfter: boolean }) => void;
  onDiscard: () => void;
}

export function FocusCompleteSheet({
  isOpen,
  onClose,
  phase,
  targetLabel,
  durationMinutes,
  hasLinkedTask,
  initialNotes,
  breakMinutes,
  onSaveFocus,
  onDiscard,
}: FocusCompleteSheetProps) {
  const [notes, setNotes] = useState('');
  const [markTaskComplete, setMarkTaskComplete] = useState(hasLinkedTask);
  const [aiSummarizing, setAiSummarizing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes.join('\n'));
      setMarkTaskComplete(hasLinkedTask);
    }
  }, [isOpen, hasLinkedTask, initialNotes]);

  const accentText = 'var(--app-accent-text, #D29B7E)';

  if (phase === 'break') {
    return (
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        detent="half"
        title="Recovery Break Complete"
      >
        <div className="space-y-5 py-2">
          <div className="p-5 rounded-[24px] glow-card text-center space-y-2">
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
              style={{
                background: 'color-mix(in srgb, var(--app-accent-text, #D29B7E) 16%, #1C1C22)',
                color: accentText,
              }}
            >
              <Clock size={26} weight="duotone" />
            </div>
            <p className="text-card-title text-white">Ready for your next block?</p>
            <p className="text-sub">Your mind is reset. Jump back into {targetLabel} when ready.</p>
          </div>
          <Button
            variant="prominent"
            className="w-full"
            icon={<Play size={18} weight="fill" />}
            onClick={() => {
              triggerHaptic('success');
              onDiscard();
            }}
          >
            Return to Focus Studio
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent="half"
      title="Session Complete"
    >
      <div className="space-y-4 py-1">
        <div className="p-4 rounded-[22px] glow-card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-section-header block">Logged Block</span>
            <p className="text-card-title text-white truncate mt-0.5">{targetLabel}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-value tabular-nums" style={{ color: accentText }}>
              {durationMinutes}m
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between pl-1">
            <label className="text-label">Session Reflection / Summary</label>
            {notes.trim().length > 10 && (
              <button
                type="button"
                disabled={aiSummarizing}
                onClick={async () => {
                  setAiSummarizing(true);
                  try {
                    const summary = await summarizeFocusNotes(targetLabel, notes.split('\n').filter(Boolean));
                    if (summary) setNotes(summary);
                  } catch {
                    // Keep existing rough notes unchanged if offline
                  } finally {
                    setAiSummarizing(false);
                  }
                }}
                className="text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                style={{ color: accentText }}
              >
                {aiSummarizing ? <SpinnerGap size={12} className="animate-spin" /> : <Brain size={12} weight="duotone" />}
                <span>Clean Notes</span>
              </button>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What did you finish or learn in this block?"
            className="w-full rounded-[16px] bg-[#222228] px-3.5 py-2.5 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
          />
        </div>

        {hasLinkedTask && (
          <div className="p-3.5 rounded-[18px] glow-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle size={20} weight="duotone" style={{ color: accentText }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Mark linked task as done</p>
                <p className="text-sub truncate">{targetLabel}</p>
              </div>
            </div>
            <Switch checked={markTaskComplete} onChange={setMarkTaskComplete} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <Button
            variant="prominent"
            className="w-full"
            icon={<Play size={16} weight="fill" />}
            onClick={() => {
              triggerHaptic('success');
              onSaveFocus({ notes, markTaskComplete, startBreakAfter: true });
            }}
          >
            Save & {breakMinutes}m Break
          </Button>
          <Button
            variant="glass"
            className="w-full"
            icon={<CheckCircle size={16} weight="duotone" />}
            onClick={() => {
              triggerHaptic('success');
              onSaveFocus({ notes, markTaskComplete, startBreakAfter: false });
            }}
          >
            Save & Finish
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onDiscard();
          }}
          className="w-full py-2 text-xs font-semibold text-[rgba(235,235,245,0.48)] hover:text-white transition-colors"
        >
          Discard session without saving
        </button>
      </div>
    </Sheet>
  );
}

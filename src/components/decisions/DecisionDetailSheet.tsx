import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import type { DecisionCriterion, DecisionOption, DecisionRecord } from '../../types';
import { Sheet } from '../../ui/feedback/Sheet';
import { Button } from '../../ui/controls/Button';
import { TextField } from '../../ui/controls/TextField';
import { Switch } from '../../ui/controls/Switch';
import {
  Plus,
  Trash,
  CheckCircle,
  Scales,
  CalendarPlus,
  Brain,
  SpinnerGap,
} from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { computeOptionScores } from '../../utils/decisionMath';
import { auditDecisionBlindSpots } from '../../services/newInterfaceAiService';

export interface DecisionDetailSheetProps {
  decision: DecisionRecord | null;
  onClose: () => void;
  onUpdateDecision: (updated: DecisionRecord, opts?: { syncCalendar?: boolean }) => Promise<void>;
  onDeleteDecision: (id: string) => Promise<void>;
}

const SCORE_VALUES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

export function DecisionDetailSheet({
  decision,
  onClose,
  onUpdateDecision,
  onDeleteDecision,
}: DecisionDetailSheetProps) {
  const [newCriterionLabel, setNewCriterionLabel] = useState('');
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [proConInputs, setProConInputs] = useState<Record<string, { pro: string; con: string }>>({});
  const [revisitHorizonDays, setRevisitHorizonDays] = useState<30 | 90 | 180>(90);
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAudit, setAiAudit] = useState<{
    missingCriteria: { label: string; weight: 1 | 2 | 3 | 4 | 5 }[];
    riskCheck: string;
    synthesis: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!decision) return null;

  const accentText = 'var(--app-accent-text, #D29B7E)';
  const ranked = computeOptionScores(decision);

  const handleAddCriterion = async () => {
    const trimmed = newCriterionLabel.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setNewCriterionLabel('');
    const newCrit: DecisionCriterion = {
      id: `crit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: trimmed,
      weight: 3,
    };
    await onUpdateDecision({
      ...decision,
      criteria: [...decision.criteria, newCrit],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCriterionWeight = async (critId: string, weight: 1 | 2 | 3 | 4 | 5) => {
    triggerHaptic('selection');
    await onUpdateDecision({
      ...decision,
      criteria: decision.criteria.map((c) => (c.id === critId ? { ...c, weight } : c)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteCriterion = async (critId: string) => {
    triggerHaptic('light');
    await onUpdateDecision({
      ...decision,
      criteria: decision.criteria.filter((c) => c.id !== critId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddOption = async () => {
    const trimmed = newOptionTitle.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setNewOptionTitle('');
    const newOpt: DecisionOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      scores: {},
      pros: [],
      cons: [],
    };
    await onUpdateDecision({
      ...decision,
      options: [...decision.options, newOpt],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleScoreChange = async (optionId: string, critId: string, val: 1 | 2 | 3 | 4 | 5) => {
    triggerHaptic('selection');
    await onUpdateDecision({
      ...decision,
      options: decision.options.map((opt) =>
        opt.id === optionId ? { ...opt, scores: { ...opt.scores, [critId]: val } } : opt
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddProCon = async (optionId: string, kind: 'pros' | 'cons') => {
    const raw = kind === 'pros' ? proConInputs[optionId]?.pro : proConInputs[optionId]?.con;
    const trimmed = (raw || '').trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setProConInputs((prev) => ({
      ...prev,
      [optionId]: {
        pro: kind === 'pros' ? '' : prev[optionId]?.pro || '',
        con: kind === 'cons' ? '' : prev[optionId]?.con || '',
      },
    }));
    await onUpdateDecision({
      ...decision,
      options: decision.options.map((opt) =>
        opt.id === optionId ? { ...opt, [kind]: [...opt[kind], trimmed] } : opt
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCommitChoice = async (optionId: string) => {
    triggerHaptic('success');
    const revisitDate = format(addDays(new Date(), revisitHorizonDays), 'yyyy-MM-dd');
    await onUpdateDecision(
      {
        ...decision,
        chosenOptionId: optionId,
        status: 'decided',
        decidedAt: format(new Date(), 'yyyy-MM-dd'),
        revisitDate,
        updatedAt: new Date().toISOString(),
      },
      { syncCalendar: syncToCalendar }
    );
  };

  return (
    <Sheet
      isOpen={Boolean(decision)}
      onClose={onClose}
      detent="full"
      title={decision.question}
    >
      <div className="space-y-4 pb-8">
        {/* Live Score Leaderboard */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-section-header flex items-center gap-1.5">
              <Scales size={15} weight="duotone" style={{ color: accentText }} />
              Weighted Comparison
            </span>
            <span className="text-badge capitalize" style={{ color: accentText }}>
              {decision.status}
            </span>
          </div>

          <div className="space-y-2.5">
            {ranked.map((row, idx) => {
              const isChosen = decision.chosenOptionId === row.optionId;
              return (
                <div key={row.optionId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span>{idx + 1}. {row.title}</span>
                      {isChosen && (
                        <CheckCircle size={13} weight="fill" style={{ color: accentText }} />
                      )}
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: accentText }}>
                      {row.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36, #A46D52))',
                        transform: `scaleX(${Math.max(0.03, row.percentage / 100)})`,
                        transformOrigin: 'left',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 space-y-2">
            <Button
              variant="glass"
              size="sm"
              className="w-full"
              disabled={aiLoading}
              icon={aiLoading ? <SpinnerGap size={14} className="animate-spin" /> : <Brain size={14} weight="duotone" />}
              onClick={async () => {
                triggerHaptic('selection');
                setAiLoading(true);
                setAiError(null);
                try {
                  const res = await auditDecisionBlindSpots(decision);
                  setAiAudit(res);
                } catch (err: any) {
                  setAiError(err?.message || 'Could not run blind-spot check.');
                } finally {
                  setAiLoading(false);
                }
              }}
            >
              Luna Blind-Spot &amp; Steelman Check
            </Button>

            {aiError && <p className="text-xs text-[#FF453A]">{aiError}</p>}

            {aiAudit && (
              <div className="p-3 rounded-2xl bg-white/[0.04] space-y-2">
                {aiAudit.riskCheck && (
                  <p className="text-xs text-white leading-relaxed">
                    <span className="font-bold" style={{ color: accentText }}>Counterargument: </span>
                    {aiAudit.riskCheck}
                  </p>
                )}
                {aiAudit.synthesis && (
                  <p className="text-xs text-[rgba(240,240,245,0.82)] leading-relaxed">{aiAudit.synthesis}</p>
                )}
                {aiAudit.missingCriteria.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiAudit.missingCriteria.map((mc, idx) => (
                      <button
                        key={`mc_${idx}`}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          void onUpdateDecision({
                            ...decision,
                            criteria: [
                              ...decision.criteria,
                              { id: `crit_${Date.now()}_${idx}`, label: mc.label, weight: mc.weight },
                            ],
                            updatedAt: new Date().toISOString(),
                          });
                          setAiAudit((prev) =>
                            prev
                              ? { ...prev, missingCriteria: prev.missingCriteria.filter((_, i) => i !== idx) }
                              : null
                          );
                        }}
                        className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-semibold text-white"
                      >
                        + {mc.label} (wt {mc.weight})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Criteria Weights & Scoring */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <span className="text-section-header block">Criteria & Option Ratings (1–5)</span>
          <div className="flex gap-2">
            <TextField
              placeholder="Add criterion (e.g., Learning, Pay, Stress)"
              value={newCriterionLabel}
              onChange={(e) => setNewCriterionLabel(e.target.value)}
              onClear={() => setNewCriterionLabel('')}
            />
            <Button variant="glass" icon={<Plus size={16} weight="bold" />} onClick={handleAddCriterion}>
              Add
            </Button>
          </div>

          <div className="space-y-3 pt-1">
            {decision.criteria.map((crit) => (
              <div key={crit.id} className="p-3 rounded-[18px] bg-white/[0.04] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white truncate">{crit.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-[rgba(235,235,245,0.55)]">Wt:</span>
                    {SCORE_VALUES.map((w) => (
                      <button
                        key={`wt_${crit.id}_${w}`}
                        type="button"
                        onClick={() => void handleCriterionWeight(crit.id, w)}
                        className={`w-6 h-6 rounded-full text-[11px] font-bold tabular-nums ${
                          crit.weight === w ? 'droplet-active' : 'bg-white/[0.05] text-[rgba(235,235,245,0.6)]'
                        }`}
                        style={crit.weight === w ? { color: accentText } : undefined}
                      >
                        {w}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => void handleDeleteCriterion(crit.id)}
                      className="p-1 text-[rgba(235,235,245,0.38)] hover:text-[#FF453A]"
                      aria-label="Delete criterion"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </div>

                {/* Per-option ratings */}
                <div className="space-y-1.5">
                  {decision.options.map((opt) => {
                    const currentScore = opt.scores?.[crit.id] ?? 3;
                    return (
                      <div key={`score_${crit.id}_${opt.id}`} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[rgba(240,240,245,0.78)] truncate flex-1">{opt.title}</span>
                        <div className="flex items-center gap-1">
                          {SCORE_VALUES.map((s) => (
                            <button
                              key={`s_${s}`}
                              type="button"
                              onClick={() => void handleScoreChange(opt.id, crit.id, s)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold tabular-nums ${
                                currentScore === s
                                  ? 'droplet-active'
                                  : 'bg-white/[0.04] text-[rgba(235,235,245,0.55)]'
                              }`}
                              style={currentScore === s ? { color: accentText } : undefined}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Options & Pros/Cons */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <span className="text-section-header block">Options, Pros & Cons</span>
          <div className="flex gap-2">
            <TextField
              placeholder="Add another option to compare..."
              value={newOptionTitle}
              onChange={(e) => setNewOptionTitle(e.target.value)}
              onClear={() => setNewOptionTitle('')}
            />
            <Button variant="glass" icon={<Plus size={16} weight="bold" />} onClick={handleAddOption}>
              Add
            </Button>
          </div>

          {decision.options.map((opt) => (
            <div key={`pc_${opt.id}`} className="p-3 rounded-[18px] bg-white/[0.04] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{opt.title}</span>
                {decision.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => void handleCommitChoice(opt.id)}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-bold"
                    style={{ color: accentText }}
                  >
                    Choose This
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#30D158]">PROS</span>
                  {opt.pros.map((p, i) => (
                    <p key={`p_${i}`} className="text-xs text-white bg-white/[0.04] px-2.5 py-1.5 rounded-lg">
                      + {p}
                    </p>
                  ))}
                  <div className="flex gap-1">
                    <input
                      value={proConInputs[opt.id]?.pro || ''}
                      onChange={(e) =>
                        setProConInputs((prev) => ({
                          ...prev,
                          [opt.id]: { pro: e.target.value, con: prev[opt.id]?.con || '' },
                        }))
                      }
                      placeholder="Add pro..."
                      className="flex-1 bg-[#222228] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddProCon(opt.id, 'pros')}
                      className="px-2 rounded-lg bg-white/[0.08] text-xs font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#FF453A]">CONS</span>
                  {opt.cons.map((c, i) => (
                    <p key={`c_${i}`} className="text-xs text-white bg-white/[0.04] px-2.5 py-1.5 rounded-lg">
                      - {c}
                    </p>
                  ))}
                  <div className="flex gap-1">
                    <input
                      value={proConInputs[opt.id]?.con || ''}
                      onChange={(e) =>
                        setProConInputs((prev) => ({
                          ...prev,
                          [opt.id]: { pro: prev[opt.id]?.pro || '', con: e.target.value },
                        }))
                      }
                      placeholder="Add con..."
                      className="flex-1 bg-[#222228] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddProCon(opt.id, 'cons')}
                      className="px-2 rounded-lg bg-white/[0.08] text-xs font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Commit & Revisit Horizon */}
        {decision.status === 'open' ? (
          <section className="p-4 rounded-[24px] glow-card space-y-3">
            <span className="text-section-header block">Expected Outcome & Revisit Schedule</span>
            <textarea
              value={decision.expectedOutcome || ''}
              onChange={(e) =>
                void onUpdateDecision({
                  ...decision,
                  expectedOutcome: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              rows={2}
              placeholder="What do you expect to happen 3–6 months from now?"
              className="w-full rounded-[14px] bg-[#222228] px-3.5 py-2 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
            />
            <div className="grid grid-cols-3 gap-2">
              {([30, 90, 180] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRevisitHorizonDays(days)}
                  className={`py-2 rounded-xl text-xs font-bold ${
                    revisitHorizonDays === days
                      ? 'droplet-active'
                      : 'bg-white/[0.05] text-[rgba(235,235,245,0.68)]'
                  }`}
                  style={revisitHorizonDays === days ? { color: accentText } : undefined}
                >
                  Review {days}d
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <CalendarPlus size={15} weight="duotone" style={{ color: accentText }} />
                Add revisit reminder to Calendar
              </span>
              <Switch checked={syncToCalendar} onChange={setSyncToCalendar} />
            </div>
            {ranked[0] && (
              <Button
                variant="prominent"
                className="w-full"
                onClick={() => void handleCommitChoice(ranked[0].optionId)}
              >
                Commit Top Score ({ranked[0].title})
              </Button>
            )}
          </section>
        ) : (
          <section className="p-4 rounded-[24px] glow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-section-header">Outcome Review</span>
              {decision.revisitDate && (
                <span className="text-sub tabular-nums">Review date: {decision.revisitDate}</span>
              )}
            </div>
            <textarea
              value={decision.actualOutcome || ''}
              onChange={(e) =>
                void onUpdateDecision({
                  ...decision,
                  actualOutcome: e.target.value,
                  status: 'revisited',
                  updatedAt: new Date().toISOString(),
                })
              }
              rows={2}
              placeholder="How did this choice play out in reality?"
              className="w-full rounded-[14px] bg-[#222228] px-3.5 py-2 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
            />
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'right_call', label: 'Right Call' },
                  { id: 'mixed', label: 'Mixed' },
                  { id: 'lesson_learned', label: 'Lesson' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    void onUpdateDecision({
                      ...decision,
                      verdict: v.id,
                      status: 'revisited',
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className={`py-2 rounded-xl text-xs font-bold ${
                    decision.verdict === v.id
                      ? 'droplet-active'
                      : 'bg-white/[0.05] text-[rgba(235,235,245,0.68)]'
                  }`}
                  style={decision.verdict === v.id ? { color: accentText } : undefined}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <Button
          variant="glass"
          className="w-full text-[#FF453A]"
          icon={<Trash size={16} weight="duotone" />}
          onClick={async () => {
            await onDeleteDecision(decision.id);
            onClose();
          }}
        >
          Delete Decision
        </Button>
      </div>
    </Sheet>
  );
}


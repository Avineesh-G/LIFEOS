import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { AppData, CalendarEvent, DecisionRecord } from '../types';
import {
  LargeTitleHeader,
  Segmented,
  Button,
  Badge,
  Sheet,
  TextField,
  EmptyState,
  Plus,
  Scales,
  CheckCircle,
} from '../ui';
import { triggerHaptic } from '../utils/haptics';
import { computeOptionScores, isDecisionReviewDue, getRevisitDaysDelta } from '../utils/decisionMath';
import { DecisionDetailSheet } from '../components/decisions/DecisionDetailSheet';

interface DecisionsProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type DecisionFilter = 'open' | 'decided' | 'due';

const CATEGORY_OPTIONS: { value: DecisionRecord['category']; label: string }[] = [
  { value: 'career', label: 'Career' },
  { value: 'finance', label: 'Finance' },
  { value: 'tech', label: 'Tech' },
  { value: 'study', label: 'Study' },
  { value: 'life', label: 'Life' },
];

export default function Decisions({ data, updateData }: DecisionsProps) {
  const [filter, setFilter] = useState<DecisionFilter>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<DecisionRecord['category']>('career');
  const [optAInput, setOptAInput] = useState('');
  const [optBInput, setOptBInput] = useState('');

  const decisions = data.decisions || [];
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const accentText = 'var(--app-accent-text, #D29B7E)';

  const counts = useMemo(() => {
    const open = decisions.filter((d) => d.status === 'open').length;
    const due = decisions.filter((d) => isDecisionReviewDue(d, todayStr)).length;
    return { open, due };
  }, [decisions, todayStr]);

  const filteredDecisions = useMemo(() => {
    return decisions
      .filter((d) => {
        if (filter === 'open') return d.status === 'open';
        if (filter === 'due') return isDecisionReviewDue(d, todayStr);
        return d.status === 'decided' || d.status === 'revisited';
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [decisions, filter, todayStr]);

  const selectedDecision = useMemo(
    () => decisions.find((d) => d.id === selectedId) || null,
    [decisions, selectedId]
  );

  const handleCreateDecision = async () => {
    const q = questionInput.trim();
    if (!q) return;
    triggerHaptic('success');
    const nowIso = new Date().toISOString();
    const crit1Id = `crit_${Date.now()}_1`;
    const crit2Id = `crit_${Date.now()}_2`;

    const newDecision: DecisionRecord = {
      id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      question: q,
      category: categoryInput,
      status: 'open',
      criteria: [
        { id: crit1Id, label: 'Long-Term Growth', weight: 4 },
        { id: crit2Id, label: 'Cost / Effort Fit', weight: 3 },
      ],
      options: [
        {
          id: `opt_${Date.now()}_a`,
          title: optAInput.trim() || 'Option A',
          scores: { [crit1Id]: 3, [crit2Id]: 3 },
          pros: [],
          cons: [],
        },
        {
          id: `opt_${Date.now()}_b`,
          title: optBInput.trim() || 'Option B',
          scores: { [crit1Id]: 3, [crit2Id]: 3 },
          pros: [],
          cons: [],
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setQuestionInput('');
    setOptAInput('');
    setOptBInput('');
    setCreateOpen(false);
    await updateData({ decisions: [newDecision, ...decisions] });
    setSelectedId(newDecision.id);
  };

  const handleUpdateDecision = async (
    updated: DecisionRecord,
    opts?: { syncCalendar?: boolean }
  ) => {
    let finalDecision = updated;
    let nextCalendarEvents = data.calendarEvents;

    if (opts?.syncCalendar && updated.revisitDate) {
      const chosen = updated.options.find((o) => o.id === updated.chosenOptionId);
      const nowIso = new Date().toISOString();
      const eventId = updated.calendarEventId || `cal_dec_${updated.id}`;
      const newEvent: CalendarEvent = {
        id: eventId,
        title: `Review Decision: ${updated.question}`,
        description: chosen ? `Chosen: ${chosen.title}` : undefined,
        date: updated.revisitDate,
        isAllDay: true,
        category: 'personal',
        syncToTasks: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const existingEvents = data.calendarEvents || [];
      const existsIdx = existingEvents.findIndex((ev) => ev.id === eventId);
      nextCalendarEvents =
        existsIdx >= 0
          ? existingEvents.map((ev, i) => (i === existsIdx ? newEvent : ev))
          : [newEvent, ...existingEvents];
      finalDecision = { ...updated, calendarEventId: eventId };
    }

    await updateData({
      decisions: decisions.map((d) => (d.id === finalDecision.id ? finalDecision : d)),
      ...(nextCalendarEvents !== data.calendarEvents ? { calendarEvents: nextCalendarEvents } : {}),
    });
  };

  const handleDeleteDecision = async (id: string) => {
    triggerHaptic('error');
    await updateData({ decisions: decisions.filter((d) => d.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Decisions"
        subtitle="Weighted pros/cons & outcome reviews"
        actions={
          <div className="flex items-center gap-2">
            <Badge count={counts.due > 0 ? counts.due : counts.open} label={counts.due > 0 ? 'Due' : 'Open'} />
            <Button
              variant="glass"
              size="sm"
              icon={<Plus size={15} weight="bold" />}
              onClick={() => setCreateOpen(true)}
            >
              New
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'decided', label: 'Decided' },
            { value: 'due', label: `Review (${counts.due})` },
          ]}
        />

        {filteredDecisions.length === 0 ? (
          <EmptyState
            icon={<Scales size={32} weight="duotone" />}
            title={
              filter === 'due'
                ? 'No outcome reviews due right now'
                : filter === 'decided'
                ? 'No committed decisions yet'
                : 'No open decisions yet'
            }
            description="Compare tricky trade-offs with weighted criteria, pros/cons, and scheduled 30/90/180-day outcome reviews."
            actionLabel={filter === 'open' ? 'Start Decision Matrix' : undefined}
            onAction={filter === 'open' ? () => setCreateOpen(true) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredDecisions.map((dec) => {
              const ranked = computeOptionScores(dec);
              const leader = ranked[0];
              const runnerUp = ranked[1];
              const daysDelta = getRevisitDaysDelta(dec.revisitDate);

              return (
                <article
                  key={dec.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(dec.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(dec.id);
                    }
                  }}
                  className="p-4 rounded-[24px] liquid-glass space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08]"
                          style={{ color: accentText }}
                        >
                          {dec.category}
                        </span>
                        {daysDelta !== null && dec.status === 'decided' && (
                          <span className="text-sub tabular-nums">
                            {daysDelta <= 0 ? 'Review due' : `Review in ${daysDelta}d`}
                          </span>
                        )}
                      </div>
                      <h3 className="text-card-title text-white mt-1.5">{dec.question}</h3>
                    </div>

                    {leader && (
                      <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: accentText }}>
                        {leader.percentage}%
                      </span>
                    )}
                  </div>

                  {leader && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36, #A46D52))',
                            transform: `scaleX(${Math.max(0.03, leader.percentage / 100)})`,
                            transformOrigin: 'left',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[rgba(235,235,245,0.62)]">
                        <span className="flex items-center gap-1 truncate">
                          {dec.chosenOptionId && (
                            <CheckCircle size={13} weight="fill" style={{ color: accentText }} />
                          )}
                          <span>
                            {dec.chosenOptionId
                              ? `Chosen: ${dec.options.find((o) => o.id === dec.chosenOptionId)?.title || leader.title}`
                              : `Leading: ${leader.title}`}
                          </span>
                        </span>
                        {runnerUp && (
                          <span className="tabular-nums shrink-0">vs {runnerUp.percentage}%</span>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <DecisionDetailSheet
        decision={selectedDecision}
        onClose={() => setSelectedId(null)}
        onUpdateDecision={handleUpdateDecision}
        onDeleteDecision={handleDeleteDecision}
      />

      <Sheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        detent="half"
        title="New Decision Matrix"
      >
        <div className="space-y-4 pb-6">
          <TextField
            label="What are you deciding?"
            placeholder="e.g., Internship A vs Startup B, Upgrade Laptop?"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onClear={() => setQuestionInput('')}
          />

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Domain</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((opt) => {
                const active = categoryInput === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategoryInput(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      active ? 'droplet-active' : 'bg-white/[0.06] text-[rgba(240,240,245,0.72)]'
                    }`}
                    style={active ? { color: accentText } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <TextField
              label="Option A"
              placeholder="e.g., Startup Offer"
              value={optAInput}
              onChange={(e) => setOptAInput(e.target.value)}
            />
            <TextField
              label="Option B"
              placeholder="e.g., Research Lab"
              value={optBInput}
              onChange={(e) => setOptBInput(e.target.value)}
            />
          </div>

          <Button variant="prominent" size="lg" className="w-full" onClick={handleCreateDecision}>
            Open Matrix
          </Button>
        </div>
      </Sheet>
    </div>
  );
}


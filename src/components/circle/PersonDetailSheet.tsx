import React, { useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { CirclePerson, CircleInteraction } from '../../types';
import { Sheet } from '../../ui/feedback/Sheet';
import { Button } from '../../ui/controls/Button';
import { TextField } from '../../ui/controls/TextField';
import { GroupedList } from '../../ui/grouped/GroupedList';
import { ListRow } from '../../ui/grouped/ListRow';
import {
  Phone,
  UsersThree,
  ChatDots,
  Gift,
  CheckCircle,
  CircleIcon,
  Plus,
  Trash,
  Wallet,
  Receipt,
  PencilSimple,
  ArrowRight,
  Brain,
  SpinnerGap,
  Copy,
} from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import {
  PersonFinanceSummary,
  getDaysUntilBirthday,
  getCatchUpStatus,
  formatRupeeNet,
} from '../../utils/circleFinance';
import { suggestCircleAssistant } from '../../services/newInterfaceAiService';

export interface PersonDetailSheetProps {
  person: CirclePerson | null;
  finance: PersonFinanceSummary | null;
  onClose: () => void;
  onUpdatePerson: (updated: CirclePerson) => Promise<void>;
  onEditPerson: (person: CirclePerson) => void;
  onDeletePerson: (id: string) => Promise<void>;
}

export function PersonDetailSheet({
  person,
  finance,
  onClose,
  onUpdatePerson,
  onEditPerson,
  onDeletePerson,
}: PersonDetailSheetProps) {
  const navigate = useNavigate();
  const [catchUpNote, setCatchUpNote] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHelper, setAiHelper] = useState<{ gifts: string[]; message: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!person) return null;

  const accentText = 'var(--app-accent-text, #D29B7E)';
  const bdayDays = getDaysUntilBirthday(person.birthday);
  const catchUp = getCatchUpStatus(person);

  const handleLogInteraction = async (type: CircleInteraction['type']) => {
    triggerHaptic('success');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newIx: CircleInteraction = {
      id: `ix_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: todayStr,
      type,
      note: catchUpNote.trim() || undefined,
    };
    setCatchUpNote('');
    await onUpdatePerson({
      ...person,
      lastContactedDate: todayStr,
      interactions: [newIx, ...(person.interactions || [])].slice(0, 30),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddGift = async () => {
    const trimmed = giftInput.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setGiftInput('');
    await onUpdatePerson({
      ...person,
      giftIdeas: [
        { id: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text: trimmed, gifted: false },
        ...(person.giftIdeas || []),
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleGift = async (giftId: string) => {
    triggerHaptic('selection');
    await onUpdatePerson({
      ...person,
      giftIdeas: (person.giftIdeas || []).map((g) =>
        g.id === giftId ? { ...g, gifted: !g.gifted } : g
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteGift = async (giftId: string) => {
    triggerHaptic('light');
    await onUpdatePerson({
      ...person,
      giftIdeas: (person.giftIdeas || []).filter((g) => g.id !== giftId),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Sheet
      isOpen={Boolean(person)}
      onClose={onClose}
      detent="full"
      title={person.name}
    >
      <div className="space-y-4 pb-8">
        {/* Top Profile Strip */}
        <div className="p-4 rounded-[24px] glow-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36, #A46D52))' }}
            >
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-badge capitalize px-2 py-0.5 rounded-full bg-white/[0.08]" style={{ color: accentText }}>
                  {person.relation}
                </span>
                {bdayDays !== null && (
                  <span className="text-sub tabular-nums">
                    {bdayDays === 0 ? 'Birthday today' : `Birthday in ${bdayDays}d`}
                  </span>
                )}
              </div>
              <p className="text-sub mt-1">
                {catchUp.daysSinceLast === null
                  ? 'No catch-up logged yet'
                  : `Last caught up ${catchUp.daysSinceLast}d ago`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white hover:bg-white/[0.14]"
                aria-label={`Call ${person.name}`}
              >
                <Phone size={17} weight="duotone" style={{ color: accentText }} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onEditPerson(person)}
              className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white hover:bg-white/[0.14]"
              aria-label="Edit contact"
            >
              <PencilSimple size={17} weight="duotone" />
            </button>
          </div>
        </div>

        {/* One-Tap Catch-Up Logger */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <span className="text-section-header block">Log Catch-Up</span>
          <TextField
            placeholder="Optional 1-line note (e.g., talked about internships)"
            value={catchUpNote}
            onChange={(e) => setCatchUpNote(e.target.value)}
            onClear={() => setCatchUpNote('')}
          />
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="glass"
              size="sm"
              icon={<Phone size={15} weight="duotone" />}
              onClick={() => handleLogInteraction('call')}
            >
              Call
            </Button>
            <Button
              variant="glass"
              size="sm"
              icon={<UsersThree size={15} weight="duotone" />}
              onClick={() => handleLogInteraction('meetup')}
            >
              Met Up
            </Button>
            <Button
              variant="glass"
              size="sm"
              icon={<ChatDots size={15} weight="duotone" />}
              onClick={() => handleLogInteraction('message')}
            >
              Texted
            </Button>
          </div>
        </section>

        {/* Unified Balances (Spending Lending + Outing Splitter) */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-section-header">Shared Balances</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: accentText }}>
              {finance ? formatRupeeNet(finance.totalNetRupees) : 'Settled'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                startTransition(() => {
                  navigate('/spending');
                });
              }}
              className="p-3 rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sub flex items-center gap-1">
                  <Wallet size={13} weight="duotone" style={{ color: accentText }} />
                  Casual Loans
                </span>
                <ArrowRight size={13} className="text-[rgba(235,235,245,0.45)]" />
              </div>
              <p className="text-base font-bold text-white mt-1 tabular-nums">
                {finance ? formatRupeeNet(finance.moneyLentNetRupees) : 'Settled'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                startTransition(() => {
                  navigate('/outings');
                });
              }}
              className="p-3 rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sub flex items-center gap-1">
                  <Receipt size={13} weight="duotone" style={{ color: accentText }} />
                  Outings Split
                </span>
                <ArrowRight size={13} className="text-[rgba(235,235,245,0.45)]" />
              </div>
              <p className="text-base font-bold text-white mt-1 tabular-nums">
                {finance ? formatRupeeNet(finance.outingNetRupees) : 'Settled'}
              </p>
            </button>
          </div>
        </section>

        {/* Gift Ideas */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-section-header">Gift Ideas & Favorites</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={aiLoading}
                onClick={async () => {
                  triggerHaptic('selection');
                  setAiLoading(true);
                  setAiError(null);
                  try {
                    const res = await suggestCircleAssistant(person, 'gifts');
                    setAiHelper(res);
                  } catch (err: any) {
                    setAiError(err?.message || 'Could not suggest ideas.');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                style={{ color: accentText }}
              >
                {aiLoading ? <SpinnerGap size={12} className="animate-spin" /> : <Brain size={12} weight="duotone" />}
                <span>Luna Ideas</span>
              </button>
            </div>
          </div>
          {aiError && <p className="text-xs text-[#FF453A]">{aiError}</p>}
          {aiHelper && (
            <div className="p-3 rounded-2xl bg-white/[0.04] space-y-2.5">
              {aiHelper.message && (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-[rgba(240,240,245,0.88)] italic">"{aiHelper.message}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(aiHelper.message).catch(() => {});
                      setCopiedMsg(true);
                      window.setTimeout(() => setCopiedMsg(false), 1800);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/[0.08] text-[10px] font-bold text-white flex items-center gap-1 shrink-0"
                  >
                    <Copy size={11} />
                    <span>{copiedMsg ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
              {aiHelper.gifts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiHelper.gifts.map((gText, idx) => (
                    <button
                      key={`ai_gift_${idx}`}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        void onUpdatePerson({
                          ...person,
                          giftIdeas: [
                            { id: `gift_${Date.now()}_${idx}`, text: gText, gifted: false },
                            ...(person.giftIdeas || []),
                          ],
                          updatedAt: new Date().toISOString(),
                        });
                        setAiHelper((prev) =>
                          prev ? { ...prev, gifts: prev.gifts.filter((_, i) => i !== idx) } : null
                        );
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-semibold text-white"
                    >
                      + {gText}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <TextField
              placeholder="Add gift idea or favorite item..."
              value={giftInput}
              onChange={(e) => setGiftInput(e.target.value)}
              onClear={() => setGiftInput('')}
            />
            <Button variant="glass" icon={<Plus size={16} weight="bold" />} onClick={handleAddGift}>
              Add
            </Button>
          </div>

          {(person.giftIdeas || []).length > 0 && (
            <div className="space-y-1.5">
              {(person.giftIdeas || []).map((gift) => (
                <div
                  key={gift.id}
                  className="flex items-center justify-between px-3 py-2 rounded-[14px] bg-white/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleGift(gift.id)}
                    className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                  >
                    <span style={{ color: gift.gifted ? accentText : 'rgba(240,240,245,0.45)' }}>
                      {gift.gifted ? <CheckCircle size={17} weight="fill" /> : <CircleIcon size={17} />}
                    </span>
                    <span
                      className={`text-sm truncate ${
                        gift.gifted ? 'line-through text-[rgba(235,235,245,0.4)]' : 'text-white'
                      }`}
                    >
                      {gift.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGift(gift.id)}
                    className="p-1 text-[rgba(235,235,245,0.4)] hover:text-[#FF453A]"
                    aria-label="Remove gift idea"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notes */}
        {person.notes && (
          <section className="p-4 rounded-[24px] glow-card space-y-1.5">
            <span className="text-section-header block">Personal Notes</span>
            <p className="text-body text-white whitespace-pre-wrap">{person.notes}</p>
          </section>
        )}

        {/* Recent Interactions */}
        {(person.interactions || []).length > 0 && (
          <GroupedList header="RECENT CATCH-UPS">
            {(person.interactions || []).slice(0, 8).map((ix, idx, arr) => (
              <ListRow
                key={ix.id}
                icon={
                  ix.type === 'call' ? (
                    <Phone size={17} weight="duotone" />
                  ) : ix.type === 'meetup' ? (
                    <UsersThree size={17} weight="duotone" />
                  ) : (
                    <ChatDots size={17} weight="duotone" />
                  )
                }
                title={ix.type === 'call' ? 'Phone Call' : ix.type === 'meetup' ? 'Met in Person' : 'Message'}
                subtitle={ix.note || ix.date}
                trailing={<span className="text-sub tabular-nums">{ix.date}</span>}
                showSeparator={idx < arr.length - 1}
              />
            ))}
          </GroupedList>
        )}

        {/* Delete Contact */}
        <Button
          variant="glass"
          className="w-full text-[#FF453A]"
          icon={<Trash size={16} weight="duotone" />}
          onClick={async () => {
            await onDeletePerson(person.id);
            onClose();
          }}
        >
          Remove From Inner Circle
        </Button>
      </div>
    </Sheet>
  );
}

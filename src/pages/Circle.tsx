import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import type { AppData, CirclePerson, CircleRelation } from '../types';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Segmented,
  Button,
  Sheet,
  TextField,
  SearchPill,
  EmptyState,
  Plus,
  UsersThree,
  Gift,
  Phone,
  CheckCircle,
} from '../ui';
import { triggerHaptic } from '../utils/haptics';
import {
  loadOutingBalanceIndex,
  getPersonFinanceSummary,
  getDaysUntilBirthday,
  getCatchUpStatus,
  formatRupeeNet,
  type OutingBalanceIndex,
} from '../utils/circleFinance';
import { PersonDetailSheet } from '../components/circle/PersonDetailSheet';

interface CircleProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type CircleFilter = 'all' | 'due' | 'birthdays' | 'balances';

const RELATION_OPTIONS: { value: CircleRelation; label: string }[] = [
  { value: 'friend', label: 'Friend' },
  { value: 'family', label: 'Family' },
  { value: 'college', label: 'College' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

const CADENCE_OPTIONS = [
  { days: 7, label: 'Weekly (7d)' },
  { days: 14, label: 'Bi-Weekly (14d)' },
  { days: 30, label: 'Monthly (30d)' },
  { days: 0, label: 'No Alert' },
];

export default function Circle({ data, updateData }: CircleProps) {
  const [filter, setFilter] = useState<CircleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [outingIndex, setOutingIndex] = useState<OutingBalanceIndex | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Add / Edit Person Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [relationInput, setRelationInput] = useState<CircleRelation>('friend');
  const [phoneInput, setPhoneInput] = useState('');
  const [birthdayInput, setBirthdayInput] = useState('');
  const [cadenceDays, setCadenceDays] = useState<number>(14);
  const [notesInput, setNotesInput] = useState('');

  // Non-blocking background Outings IDB aggregation
  useEffect(() => {
    let active = true;
    loadOutingBalanceIndex().then((idx) => {
      if (active) setOutingIndex(idx);
    });
    return () => {
      active = false;
    };
  }, []);

  const contacts = data.circleContacts || [];
  const accentText = 'var(--app-accent-text, #D29B7E)';

  const financeById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPersonFinanceSummary>>();
    contacts.forEach((p) => {
      map.set(p.id, getPersonFinanceSummary(p, data.moneyLent || [], outingIndex));
    });
    return map;
  }, [contacts, data.moneyLent, outingIndex]);

  const attentionList = useMemo(() => {
    return contacts
      .map((p) => ({
        person: p,
        bdayDays: getDaysUntilBirthday(p.birthday),
        catchUp: getCatchUpStatus(p),
      }))
      .filter((item) => (item.bdayDays !== null && item.bdayDays <= 14) || item.catchUp.isDue)
      .slice(0, 8);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let list = [...contacts];
    if (filter === 'due') {
      list = list.filter((p) => getCatchUpStatus(p).isDue);
    } else if (filter === 'birthdays') {
      list = list
        .filter((p) => getDaysUntilBirthday(p.birthday) !== null)
        .sort((a, b) => (getDaysUntilBirthday(a.birthday) ?? 999) - (getDaysUntilBirthday(b.birthday) ?? 999));
    } else if (filter === 'balances') {
      list = list.filter((p) => (financeById.get(p.id)?.totalNetRupees || 0) !== 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.relation.toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.giftIdeas || []).some((g) => g.text.toLowerCase().includes(q))
      );
    }
    return list;
  }, [contacts, filter, searchQuery, financeById]);

  const selectedPerson = useMemo(
    () => contacts.find((p) => p.id === selectedPersonId) || null,
    [contacts, selectedPersonId]
  );

  const openAddModal = () => {
    setEditingId(null);
    setNameInput('');
    setRelationInput('friend');
    setPhoneInput('');
    setBirthdayInput('');
    setCadenceDays(14);
    setNotesInput('');
    setEditorOpen(true);
  };

  const openEditModal = (person: CirclePerson) => {
    setEditingId(person.id);
    setNameInput(person.name);
    setRelationInput(person.relation);
    setPhoneInput(person.phone || '');
    setBirthdayInput(person.birthday || '');
    setCadenceDays(person.catchUpIntervalDays ?? 14);
    setNotesInput(person.notes || '');
    setEditorOpen(true);
  };

  const handleSavePerson = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;
    triggerHaptic('success');
    const nowIso = new Date().toISOString();

    if (editingId) {
      const nextList = contacts.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: trimmedName,
              relation: relationInput,
              phone: phoneInput.trim() || undefined,
              birthday: birthdayInput.trim() || undefined,
              catchUpIntervalDays: cadenceDays,
              notes: notesInput.trim() || '',
              updatedAt: nowIso,
            }
          : p
      );
      await updateData({ circleContacts: nextList });
    } else {
      const newPerson: CirclePerson = {
        id: `circle_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: trimmedName,
        relation: relationInput,
        phone: phoneInput.trim() || undefined,
        birthday: birthdayInput.trim() || undefined,
        catchUpIntervalDays: cadenceDays,
        lastContactedDate: format(new Date(), 'yyyy-MM-dd'),
        giftIdeas: [],
        notes: notesInput.trim() || '',
        interactions: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await updateData({ circleContacts: [newPerson, ...contacts] });
    }
    setEditorOpen(false);
  };

  const handleUpdatePerson = async (updated: CirclePerson) => {
    const nextList = contacts.map((p) => (p.id === updated.id ? updated : p));
    await updateData({ circleContacts: nextList });
  };

  const handleDeletePerson = async (id: string) => {
    triggerHaptic('error');
    await updateData({ circleContacts: contacts.filter((p) => p.id !== id) });
    if (selectedPersonId === id) setSelectedPersonId(null);
  };

  const handleQuickCatchUp = async (person: CirclePerson) => {
    triggerHaptic('success');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await handleUpdatePerson({
      ...person,
      lastContactedDate: todayStr,
      interactions: [
        { id: `ix_${Date.now()}`, date: todayStr, type: 'message' as const, note: 'Quick catch-up' },
        ...(person.interactions || []),
      ].slice(0, 30),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="pb-28 px-4 max-w-2xl mx-auto">
      <LargeTitleHeader
        title="Inner Circle"
        subtitle="Birthdays, catch-ups & unified balances"
        actions={
          <Button
            variant="glass"
            size="sm"
            icon={<Plus size={15} weight="bold" />}
            onClick={openAddModal}
          >
            Add
          </Button>
        }
      />

      <div className="mt-2 space-y-3">
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search people, gifts, notes..."
        />

        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'due', label: 'Due' },
            { value: 'birthdays', label: 'Birthdays' },
            { value: 'balances', label: 'Balances' },
          ]}
        />
      </div>

      {/* ── Attention Strip: Upcoming Birthdays & Due Catch-Ups ── */}
      {attentionList.length > 0 && filter === 'all' && !searchQuery.trim() && (
        <div className="mt-4 space-y-2">
          <span className="text-section-header px-1 block">Needs Care Now</span>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {attentionList.map(({ person, bdayDays, catchUp }) => (
              <div
                key={`attn_${person.id}`}
                className="min-w-[196px] p-3.5 rounded-[22px] liquid-glass flex flex-col justify-between gap-2.5 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setSelectedPersonId(person.id)}
                  className="text-left"
                >
                  <p className="text-sm font-bold text-white truncate">{person.name}</p>
                  <p className="text-sub mt-0.5 flex items-center gap-1">
                    {bdayDays !== null && bdayDays <= 14 ? (
                      <>
                        <Gift size={12} weight="duotone" style={{ color: accentText }} />
                        <span>{bdayDays === 0 ? 'Birthday today' : `Birthday in ${bdayDays}d`}</span>
                      </>
                    ) : (
                      <>
                        <Phone size={12} weight="duotone" style={{ color: accentText }} />
                        <span>
                          {catchUp.daysSinceLast === null
                            ? 'Check in soon'
                            : `${catchUp.daysSinceLast}d since last chat`}
                        </span>
                      </>
                    )}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCatchUp(person)}
                  className="w-full py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  style={{ color: accentText }}
                >
                  <CheckCircle size={13} weight="fill" />
                  <span>Log Catch-Up</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Directory ── */}
      <div className="mt-5">
        {filteredContacts.length === 0 ? (
          <EmptyState
            icon={<UsersThree size={32} weight="duotone" />}
            title={contacts.length === 0 ? 'Your Inner Circle is empty' : 'No matching contacts'}
            description={
              contacts.length === 0
                ? 'Add close friends or family to track birthdays, catch-ups, gift ideas, and shared IOUs.'
                : 'Try clearing your search or switching filter tabs.'
            }
            actionLabel={contacts.length === 0 ? 'Add First Person' : undefined}
            onAction={contacts.length === 0 ? openAddModal : undefined}
          />
        ) : (
          <GroupedList header={`PEOPLE (${filteredContacts.length})`}>
            {filteredContacts.map((person, idx) => {
              const finance = financeById.get(person.id);
              const bdayDays = getDaysUntilBirthday(person.birthday);
              const catchUp = getCatchUpStatus(person);

              const subtitleParts: string[] = [person.relation.charAt(0).toUpperCase() + person.relation.slice(1)];
              if (bdayDays !== null) {
                subtitleParts.push(bdayDays === 0 ? 'Birthday today' : `Bday in ${bdayDays}d`);
              }
              if (catchUp.isDue) {
                subtitleParts.push('Catch-up due');
              } else if (catchUp.daysSinceLast !== null) {
                subtitleParts.push(`${catchUp.daysSinceLast}d ago`);
              }

              const net = finance?.totalNetRupees || 0;

              return (
                <ListRow
                  key={person.id}
                  icon={
                    <span className="text-xs font-bold text-white">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  }
                  title={person.name}
                  subtitle={subtitleParts.join(' • ')}
                  trailing={
                    net !== 0 ? (
                      <span
                        className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-full bg-white/[0.06]"
                        style={{ color: accentText }}
                      >
                        {formatRupeeNet(net)}
                      </span>
                    ) : undefined
                  }
                  showChevron
                  onClick={() => setSelectedPersonId(person.id)}
                  showSeparator={idx < filteredContacts.length - 1}
                />
              );
            })}
          </GroupedList>
        )}
      </div>

      {/* ── Person Detail Sheet ── */}
      <PersonDetailSheet
        person={selectedPerson}
        finance={selectedPerson ? financeById.get(selectedPerson.id) || null : null}
        onClose={() => setSelectedPersonId(null)}
        onUpdatePerson={handleUpdatePerson}
        onEditPerson={openEditModal}
        onDeletePerson={handleDeletePerson}
      />

      {/* ── Add / Edit Contact Sheet ── */}
      <Sheet
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        detent="full"
        title={editingId ? 'Edit Person' : 'Add to Inner Circle'}
      >
        <div className="space-y-4 pb-8">
          <TextField
            label="Name"
            placeholder="e.g., Rohan, Mom, Aarav"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onClear={() => setNameInput('')}
          />

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Group</label>
            <div className="flex flex-wrap gap-2">
              {RELATION_OPTIONS.map((opt) => {
                const active = relationInput === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setRelationInput(opt.value);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
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

          <TextField
            label="Phone (optional)"
            placeholder="+91 98..."
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onClear={() => setPhoneInput('')}
          />

          <TextField
            label="Birthday (MM-DD or YYYY-MM-DD)"
            placeholder="e.g., 08-19 or 2005-08-19"
            value={birthdayInput}
            onChange={(e) => setBirthdayInput(e.target.value)}
            onClear={() => setBirthdayInput('')}
          />

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Catch-Up Reminder Cadence</label>
            <div className="grid grid-cols-2 gap-2">
              {CADENCE_OPTIONS.map((opt) => {
                const active = cadenceDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCadenceDays(opt.days);
                    }}
                    className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-colors ${
                      active ? 'droplet-active' : 'bg-white/[0.05] text-[rgba(240,240,245,0.72)]'
                    }`}
                    style={active ? { color: accentText } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Notes</label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows={3}
              placeholder="Favorites, clothing size, conversation topics..."
              className="w-full rounded-[16px] bg-[#222228] px-3.5 py-2.5 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
            />
          </div>

          <Button
            variant="prominent"
            size="lg"
            className="w-full"
            onClick={handleSavePerson}
          >
            {editingId ? 'Save Changes' : 'Save Contact'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

/**
 * LifeOS — CreateOutingSheet Component
 * 
 * Bottom sheet for creating or editing an outing:
 * - Name (required)
 * - Start date (default today) & optional end date
 * - Place (free text with optional Maps link)
 * - Budget (optional) with "budget applies to: My share | Total cost" toggle
 * - Participants picker (name chips, add by typing, pick from saved, "Me" is fixed)
 * - Notes & status
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, MapPin, Calendar, DollarSign, Users, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { BottomSheet } from '../../../components/BottomSheet';
import { parseRupeesToPaise } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
import { useOutings } from '../context/OutingsContext';
import type { Outing, OutingBudgetBasis, OutingStatus } from '../types';

interface CreateOutingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  outingToEdit?: Outing | null;
}

export function CreateOutingSheet({ isOpen, onClose, outingToEdit }: CreateOutingSheetProps) {
  const { people, addPerson, createOuting, updateOuting } = useOutings();

  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetBasis, setBudgetBasis] = useState<OutingBudgetBasis>('myShare');
  const [status, setStatus] = useState<OutingStatus>('planned');
  const [notes, setNotes] = useState('');

  // Selected participant IDs (always contains 'me')
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(['me']);
  const [newPersonName, setNewPersonName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Populate state when editing
  useEffect(() => {
    if (outingToEdit) {
      setName(outingToEdit.name);
      setPlace(outingToEdit.place || '');
      setStartDate(outingToEdit.startDate);
      setEndDate(outingToEdit.endDate || '');
      setBudgetInput(outingToEdit.budget ? (outingToEdit.budget / 100).toString() : '');
      setBudgetBasis(outingToEdit.budgetBasis || 'myShare');
      setStatus(outingToEdit.status || 'planned');
      setNotes(outingToEdit.notes || '');
      setSelectedPersonIds(
        Array.from(new Set(['me', ...(outingToEdit.participantIds || [])]))
      );
    } else {
      setName('');
      setPlace('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setBudgetInput('');
      setBudgetBasis('myShare');
      setStatus('planned');
      setNotes('');
      setSelectedPersonIds(['me']);
    }
    setError(null);
  }, [outingToEdit, isOpen]);

  const handleAddCustomPerson = async () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) return;

    triggerHaptic('light');
    const person = await addPerson(trimmed);
    if (!selectedPersonIds.includes(person.id)) {
      setSelectedPersonIds((prev) => [...prev, person.id]);
    }
    setNewPersonName('');
  };

  const togglePerson = (personId: string) => {
    if (personId === 'me') return; // Me is fixed!
    triggerHaptic('selection');
    setSelectedPersonIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Outing name is required');
      triggerHaptic('error');
      return;
    }

    triggerHaptic('save');
    const budgetPaise = budgetInput ? parseRupeesToPaise(budgetInput) : undefined;

    try {
      if (outingToEdit) {
        await updateOuting(outingToEdit.id, {
          name: name.trim(),
          place: place.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          budget: budgetPaise,
          budgetBasis,
          status,
          notes: notes.trim() || undefined,
          participantIds: selectedPersonIds,
        });
      } else {
        await createOuting({
          name: name.trim(),
          place: place.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          budget: budgetPaise,
          budgetBasis,
          participantIds: selectedPersonIds,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save outing');
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4 pt-1 pb-6 select-none">
        <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-heading font-bold text-primary-light dark:text-primary-dark">
            {outingToEdit ? 'Edit Outing' : 'New Outing'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Name */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Outing Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goa Trip, Weekend Movies, Dinner with Friends"
            className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-sm text-primary-light dark:text-primary-dark placeholder:text-muted-light dark:placeholder:text-muted-dark focus:outline-none focus:border-accent transition-colors"
            autoFocus={!outingToEdit}
          />
        </div>

        {/* 2. Place */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Place / Destination
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-3.5 text-accent opacity-70" />
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g. North Goa, PVR Cinemas, Downtown Cafe"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-sm text-primary-light dark:text-primary-dark placeholder:text-muted-light dark:placeholder:text-muted-dark focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* 3. Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* 4. Budget & Basis */}
        <div className="p-4 rounded-[22px] bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--card-border)] space-y-3">
          <div>
            <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
              Budget (₹, Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-stat font-bold text-accent">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-sm font-stat font-bold text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
              Budget applies to
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.04]">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setBudgetBasis('myShare');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  budgetBasis === 'myShare'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                My Share (Default)
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setBudgetBasis('totalCost');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  budgetBasis === 'totalCost'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                Total Cost
              </button>
            </div>
          </div>
        </div>

        {/* 5. Participants */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Participants ({selectedPersonIds.length})
            </label>
            <span className="text-[10px] text-muted-light dark:text-muted-dark">
              "Me" is always included
            </span>
          </div>

          {/* Chips list */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {/* Me Chip (Fixed) */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent text-white shadow-xs flex items-center gap-1.5">
              <span>Me (You)</span>
            </span>

            {/* Other People Chips */}
            {people
              .filter((p) => !p.isMe && p.id !== 'me')
              .map((p) => {
                const selected = selectedPersonIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerson(p.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selected
                        ? 'bg-accent/15 border-accent text-accent font-bold'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                    }`}
                  >
                    <span>{p.name}</span>
                    {selected && <X size={12} />}
                  </button>
                );
              })}
          </div>

          {/* Add custom person inline */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomPerson();
                }
              }}
              placeholder="Add friend's name..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleAddCustomPerson}
              disabled={!newPersonName.trim()}
              className="px-3 py-2 rounded-xl bg-accent text-white text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* 6. Status */}
        {outingToEdit && (
          <div>
            <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['planned', 'ongoing', 'completed'] as OutingStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setStatus(s);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    status === s
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7. Notes */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Packing list, booking references, or general ideas..."
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Action Button (Sticky Footer so it's always accessible and never cut off) */}
        <div className="sticky bottom-0 -mx-6 -mb-6 px-6 pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] bg-[var(--md-surface-container-low)]/95 backdrop-blur-md border-t border-[var(--card-border)] mt-4 z-20">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{outingToEdit ? 'Save Changes' : 'Create Outing'}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

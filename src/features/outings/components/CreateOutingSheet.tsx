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
 * 
 * Styled with LifeOS Dark Theme, crisp contrast, and Phosphor icons.
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  MapPin,
  CalendarBlank,
  Users,
  WarningCircle,
  NotePencil,
  Compass,
} from '@phosphor-icons/react';
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
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 pt-1 pb-6 select-none font-sans text-left">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E11D48]/15 border border-[#E11D48]/25 flex items-center justify-center text-[#FB7185]">
              <Compass size={18} weight="duotone" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {outingToEdit ? 'Edit Outing' : 'New Outing'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <WarningCircle size={16} weight="fill" className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Name */}
        <div>
          <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
            Outing Name <span className="text-[#FB7185]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goa Trip, Weekend Movies, Dinner with Friends"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FB7185]/60 focus:ring-1 focus:ring-[#FB7185]/30 transition-all font-sans"
            autoFocus={!outingToEdit}
          />
        </div>

        {/* 2. Place */}
        <div>
          <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
            Place / Destination
          </label>
          <div className="relative">
            <MapPin size={18} weight="duotone" className="absolute left-3.5 top-3.5 text-[#FB7185] pointer-events-none" />
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g. North Goa, PVR Cinemas, Downtown Cafe"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FB7185]/60 focus:ring-1 focus:ring-[#FB7185]/30 transition-all font-sans"
            />
          </div>
        </div>

        {/* 3. Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5 flex items-center gap-1.5">
              <CalendarBlank size={14} weight="duotone" className="text-[#FB7185]" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-[#FB7185]/60 transition-all font-sans"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5 flex items-center gap-1.5">
              <CalendarBlank size={14} weight="duotone" className="text-white/40" />
              <span>End Date (Optional)</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-[#FB7185]/60 transition-all font-sans"
            />
          </div>
        </div>

        {/* 4. Budget & Basis */}
        <div className="p-4 rounded-[22px] bg-white/[0.03] border border-white/10 space-y-3">
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
              Budget (₹, Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#FB7185]">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-[#FB7185]/60 font-sans"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Budget applies to
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setBudgetBasis('myShare');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  budgetBasis === 'myShare'
                    ? 'bg-white/[0.10] border border-white/15 text-[#FB7185] shadow-sm'
                    : 'text-white/50 hover:text-white'
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
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  budgetBasis === 'totalCost'
                    ? 'bg-white/[0.10] border border-white/15 text-[#FB7185] shadow-sm'
                    : 'text-white/50 hover:text-white'
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
            <label className="text-[11.5px] font-semibold text-white/70 tracking-wide flex items-center gap-1.5">
              <Users size={14} weight="duotone" className="text-[#FB7185]" />
              <span>Participants ({selectedPersonIds.length})</span>
            </label>
            <span className="text-[11px] text-white/40">
              "Me" is always included
            </span>
          </div>

          {/* Chips list */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {/* Me Chip (Fixed) */}
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.06] border border-[#FB7185]/40 text-[#FB7185] shadow-sm flex items-center gap-1.5">
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selected
                        ? 'bg-white/[0.08] border-[#FB7185]/60 text-[#FB7185] font-bold shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{p.name}</span>
                    {selected && <X size={12} weight="bold" />}
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
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FB7185]/60 font-sans"
            />
            <button
              type="button"
              onClick={handleAddCustomPerson}
              disabled={!newPersonName.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-[#FB7185]/40 text-[#FB7185] text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <Plus size={14} weight="bold" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* 6. Status (Only in edit mode) */}
        {outingToEdit && (
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
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
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    status === s
                      ? 'bg-white/[0.10] text-[#FB7185] border-[#FB7185]/60 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white'
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
          <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5 flex items-center gap-1.5">
            <NotePencil size={14} weight="duotone" className="text-white/40" />
            <span>Notes</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Packing list, booking references, or general ideas..."
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FB7185]/60 resize-none font-sans"
          />
        </div>

        {/* Action Button */}
        <div className="pt-3 pb-1">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-white/[0.10] hover:bg-white/[0.16] border border-[#FB7185]/50 text-[#FB7185] font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{outingToEdit ? 'Save Changes' : 'Create Outing'}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

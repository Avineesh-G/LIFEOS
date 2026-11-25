import React, { useState, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { AppData, TripCategory, TripPlan } from '../types';
import {
  LargeTitleHeader,
  Segmented,
  Button,
  Badge,
  Sheet,
  TextField,
  EmptyState,
  Plus,
  SuitcaseRolling,
  AirplaneTilt,
  Receipt,
  CheckCircle,
} from '../ui';
import { triggerHaptic } from '../utils/haptics';
import { useOutings } from '../features/outings/context/OutingsContext';
import { TRIP_STARTER_TEMPLATES, buildPackingItemsFromTemplate } from '../utils/tripTemplates';
import { TripDetailSheet } from '../components/trips/TripDetailSheet';

interface TripsProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type TripFilter = 'upcoming' | 'past';

const CATEGORY_OPTIONS: { value: TripCategory; label: string }[] = [
  { value: 'hostel', label: 'Hostel Return' },
  { value: 'home', label: 'Home Break' },
  { value: 'weekend', label: 'Weekend Trip' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'interview', label: 'Interview' },
  { value: 'other', label: 'Other' },
];

export default function Trips({ data, updateData }: TripsProps) {
  const navigate = useNavigate();
  const { createOuting } = useOutings();
  const [filter, setFilter] = useState<TripFilter>('upcoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Add/Edit Trip Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<TripCategory>('hostel');
  const [departureInput, setDepartureInput] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [returnInput, setReturnInput] = useState('');
  const [bookingRefInput, setBookingRefInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [starterTplId, setStarterTplId] = useState<string>('hostel_return');

  const trips = data.trips || [];
  const accentText = 'var(--app-accent-text, #D29B7E)';

  const upcomingCount = useMemo(
    () => trips.filter((t) => !t.isCompleted).length,
    [trips]
  );

  const filteredTrips = useMemo(() => {
    return trips
      .filter((t) => (filter === 'upcoming' ? !t.isCompleted : Boolean(t.isCompleted)))
      .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  }, [trips, filter]);

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === selectedId) || null,
    [trips, selectedId]
  );

  const openAddModal = () => {
    setEditingId(null);
    setTitleInput('');
    setDestinationInput('');
    setCategoryInput('hostel');
    setDepartureInput(format(new Date(), 'yyyy-MM-dd'));
    setReturnInput('');
    setBookingRefInput('');
    setNotesInput('');
    setStarterTplId('hostel_return');
    setEditorOpen(true);
  };

  const openEditModal = (trip: TripPlan) => {
    setEditingId(trip.id);
    setTitleInput(trip.title);
    setDestinationInput(trip.destination || '');
    setCategoryInput(trip.category);
    setDepartureInput(trip.departureDate);
    setReturnInput(trip.returnDate || '');
    setBookingRefInput(trip.bookingRef || '');
    setNotesInput(trip.notes || '');
    setEditorOpen(true);
  };

  const handleSaveTrip = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) return;
    triggerHaptic('success');
    const nowIso = new Date().toISOString();

    if (editingId) {
      await updateData({
        trips: trips.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title: trimmed,
                destination: destinationInput.trim() || '',
                category: categoryInput,
                departureDate: departureInput || format(new Date(), 'yyyy-MM-dd'),
                returnDate: returnInput.trim() || undefined,
                bookingRef: bookingRefInput.trim() || '',
                notes: notesInput.trim() || '',
                updatedAt: nowIso,
              }
            : t
        ),
      });
    } else {
      const initialItems = starterTplId ? buildPackingItemsFromTemplate(starterTplId) : [];
      const newTrip: TripPlan = {
        id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: trimmed,
        destination: destinationInput.trim() || '',
        category: categoryInput,
        departureDate: departureInput || format(new Date(), 'yyyy-MM-dd'),
        returnDate: returnInput.trim() || undefined,
        bookingRef: bookingRefInput.trim() || '',
        notes: notesInput.trim() || '',
        packingItems: initialItems,
        isCompleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await updateData({ trips: [newTrip, ...trips] });
    }
    setEditorOpen(false);
  };

  const handleUpdateTrip = async (updated: TripPlan) => {
    await updateData({
      trips: trips.map((t) => (t.id === updated.id ? updated : t)),
    });
  };

  const handleDeleteTrip = async (id: string) => {
    triggerHaptic('error');
    await updateData({ trips: trips.filter((t) => t.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const handleCreateOrOpenOuting = async (trip: TripPlan) => {
    if (trip.linkedOutingId) {
      startTransition(() => {
        navigate(`/outings/${trip.linkedOutingId}`);
      });
      return;
    }

    const outingId = await createOuting({
      name: trip.title,
      place: trip.destination || undefined,
      startDate: trip.departureDate,
      endDate: trip.returnDate,
      notes: trip.notes || undefined,
    });

    await handleUpdateTrip({
      ...trip,
      linkedOutingId: outingId,
      updatedAt: new Date().toISOString(),
    });

    startTransition(() => {
      navigate(`/outings/${outingId}`);
    });
  };

  const getCountdownLabel = (dateStr: string): string => {
    try {
      const today = new Date();
      const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const days = differenceInCalendarDays(parseISO(dateStr), base);
      if (days === 0) return 'Departs today';
      if (days === 1) return 'Tomorrow';
      if (days > 1) return `In ${days}d`;
      return `${Math.abs(days)}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Trips & Packing"
        subtitle="Checklists, PNRs & outing bridges"
        actions={
          <div className="flex items-center gap-2">
            <Badge count={upcomingCount} label="Upcoming" />
            <Button
              variant="glass"
              size="sm"
              icon={<Plus size={15} weight="bold" />}
              onClick={openAddModal}
            >
              Plan
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Completed' },
          ]}
        />

        {filteredTrips.length === 0 ? (
          <EmptyState
            icon={<SuitcaseRolling size={32} weight="duotone" />}
            title={filter === 'upcoming' ? 'No upcoming trips planned' : 'No completed trips yet'}
            description={
              filter === 'upcoming'
                ? 'Start with a smart packing checklist for Hostel Return, Home Break, Hackathon, or Weekend Trip.'
                : 'Completed trips appear here for reuse anytime.'
            }
            actionLabel={filter === 'upcoming' ? 'Plan First Trip' : undefined}
            onAction={filter === 'upcoming' ? openAddModal : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => {
              const total = trip.packingItems.length;
              const packed = trip.packingItems.filter((i) => i.packed).length;
              const ratio = total > 0 ? packed / total : 0;

              return (
                <article
                  key={trip.id}
                  className="p-4 rounded-[24px] liquid-glass space-y-3"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(trip.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(trip.id);
                      }
                    }}
                    className="cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08]"
                            style={{ color: accentText }}
                          >
                            {trip.category}
                          </span>
                          <span className="text-sub tabular-nums">
                            {getCountdownLabel(trip.departureDate)}
                          </span>
                        </div>
                        <h3 className="text-card-title text-white mt-1.5">{trip.title}</h3>
                        {trip.destination && (
                          <p className="text-sub mt-0.5 flex items-center gap-1">
                            <AirplaneTilt size={12} weight="duotone" style={{ color: accentText }} />
                            <span>{trip.destination}</span>
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-bold tabular-nums text-[rgba(240,240,245,0.75)] shrink-0">
                        {packed}/{total}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36, #A46D52))',
                          transform: `scaleX(${Math.max(0.03, ratio)})`,
                          transformOrigin: 'left',
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(trip.id)}
                      className="text-xs font-semibold flex items-center gap-1.5 text-white hover:opacity-85"
                    >
                      <CheckCircle size={14} weight="duotone" style={{ color: accentText }} />
                      <span>{total > 0 && packed === total ? 'All Packed' : 'Open Packing List'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCreateOrOpenOuting(trip)}
                      className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-bold flex items-center gap-1"
                      style={{ color: accentText }}
                    >
                      <Receipt size={12} weight="duotone" />
                      <span>{trip.linkedOutingId ? 'Outing' : 'Split'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <TripDetailSheet
        trip={selectedTrip}
        onClose={() => setSelectedId(null)}
        onUpdateTrip={handleUpdateTrip}
        onEditTrip={openEditModal}
        onDeleteTrip={handleDeleteTrip}
        onCreateOrOpenOuting={handleCreateOrOpenOuting}
      />

      <Sheet
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        detent="full"
        title={editingId ? 'Edit Trip' : 'Plan New Trip'}
      >
        <div className="space-y-4 pb-8">
          <TextField
            label="Trip Name"
            placeholder="e.g., Semester Return, Diwali Break, Goa Weekend"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onClear={() => setTitleInput('')}
          />

          <TextField
            label="Destination / Route (optional)"
            placeholder="e.g., Campus Hostel, Home, Bengaluru"
            value={destinationInput}
            onChange={(e) => setDestinationInput(e.target.value)}
            onClear={() => setDestinationInput('')}
          />

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Trip Type</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const active = categoryInput === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCategoryInput(opt.value);
                      if (!editingId) {
                        const match = TRIP_STARTER_TEMPLATES.find((t) => t.category === opt.value);
                        if (match) setStarterTplId(match.id);
                      }
                    }}
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
              label="Departure (YYYY-MM-DD)"
              value={departureInput}
              onChange={(e) => setDepartureInput(e.target.value)}
            />
            <TextField
              label="Return (optional)"
              placeholder="YYYY-MM-DD"
              value={returnInput}
              onChange={(e) => setReturnInput(e.target.value)}
            />
          </div>

          <TextField
            label="PNR / Flight / Ticket Ref (optional)"
            placeholder="e.g., PNR 4125-889120, Coach B4-22"
            value={bookingRefInput}
            onChange={(e) => setBookingRefInput(e.target.value)}
            onClear={() => setBookingRefInput('')}
          />

          {!editingId && (
            <div className="space-y-1.5">
              <label className="text-label pl-1 block">Pre-Fill Packing Template</label>
              <div className="flex flex-wrap gap-1.5">
                {TRIP_STARTER_TEMPLATES.map((tpl) => {
                  const active = starterTplId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setStarterTplId(active ? '' : tpl.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        active ? 'droplet-active' : 'bg-white/[0.05] text-[rgba(235,235,245,0.68)]'
                      }`}
                      style={active ? { color: accentText } : undefined}
                    >
                      {tpl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Notes</label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows={2}
              placeholder="Gate timings, pickup details, reminders..."
              className="w-full rounded-[16px] bg-[#222228] px-3.5 py-2.5 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
            />
          </div>

          <Button variant="prominent" size="lg" className="w-full" onClick={handleSaveTrip}>
            {editingId ? 'Save Changes' : 'Save Trip'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}


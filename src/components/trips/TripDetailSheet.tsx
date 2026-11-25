import React, { useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PackingGroup, TripPackingItem, TripPlan } from '../../types';
import { Sheet } from '../../ui/feedback/Sheet';
import { Button } from '../../ui/controls/Button';
import { TextField } from '../../ui/controls/TextField';
import {
  CheckCircle,
  CircleIcon,
  Plus,
  Trash,
  PencilSimple,
  Receipt,
  ArrowRight,
  ArrowCounterClockwise,
  AirplaneTilt,
  Brain,
  SpinnerGap,
} from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { TRIP_STARTER_TEMPLATES, buildPackingItemsFromTemplate } from '../../utils/tripTemplates';
import { auditTripPackingList } from '../../services/newInterfaceAiService';

export interface TripDetailSheetProps {
  trip: TripPlan | null;
  onClose: () => void;
  onUpdateTrip: (updated: TripPlan) => Promise<void>;
  onEditTrip: (trip: TripPlan) => void;
  onDeleteTrip: (id: string) => Promise<void>;
  onCreateOrOpenOuting: (trip: TripPlan) => Promise<void>;
}

const GROUP_LABELS: { key: PackingGroup; label: string }[] = [
  { key: 'documents', label: 'Documents & IDs' },
  { key: 'tech', label: 'Tech & Chargers' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'essentials', label: 'Essentials & Meds' },
];

export function TripDetailSheet({
  trip,
  onClose,
  onUpdateTrip,
  onEditTrip,
  onDeleteTrip,
  onCreateOrOpenOuting,
}: TripDetailSheetProps) {
  const navigate = useNavigate();
  const [newItemName, setNewItemName] = useState('');
  const [newItemGroup, setNewItemGroup] = useState<PackingGroup>('essentials');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAudit, setAiAudit] = useState<{ missing: { name: string; group: PackingGroup }[]; note: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!trip) return null;

  const accentText = 'var(--app-accent-text, #D29B7E)';
  const totalCount = trip.packingItems.length;
  const packedCount = trip.packingItems.filter((i) => i.packed).length;
  const ratio = totalCount > 0 ? packedCount / totalCount : 0;

  const handleToggleItem = async (itemId: string) => {
    triggerHaptic('selection');
    await onUpdateTrip({
      ...trip,
      packingItems: trip.packingItems.map((it) =>
        it.id === itemId ? { ...it, packed: !it.packed } : it
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddItem = async () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setNewItemName('');
    const newItem: TripPackingItem = {
      id: `pack_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      group: newItemGroup,
      packed: false,
    };
    await onUpdateTrip({
      ...trip,
      packingItems: [...trip.packingItems, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    triggerHaptic('light');
    await onUpdateTrip({
      ...trip,
      packingItems: trip.packingItems.filter((it) => it.id !== itemId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    triggerHaptic('success');
    const existingNames = new Set(trip.packingItems.map((i) => i.name.trim().toLowerCase()));
    const fresh = buildPackingItemsFromTemplate(templateId).filter(
      (item) => !existingNames.has(item.name.trim().toLowerCase())
    );
    if (fresh.length === 0) return;
    await onUpdateTrip({
      ...trip,
      packingItems: [...trip.packingItems, ...fresh],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUnpackAll = async () => {
    triggerHaptic('selection');
    await onUpdateTrip({
      ...trip,
      packingItems: trip.packingItems.map((i) => ({ ...i, packed: false })),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Sheet
      isOpen={Boolean(trip)}
      onClose={onClose}
      detent="full"
      title={trip.title}
    >
      <div className="space-y-4 pb-8">
        {/* Readiness & Booking Card */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-badge capitalize px-2.5 py-0.5 rounded-full bg-white/[0.08]"
                  style={{ color: accentText }}
                >
                  {trip.category}
                </span>
                <span className="text-sub tabular-nums">
                  {trip.departureDate}
                  {trip.returnDate ? ` → ${trip.returnDate}` : ''}
                </span>
              </div>
              {trip.destination && (
                <p className="text-sm font-semibold text-white mt-1.5 flex items-center gap-1.5">
                  <AirplaneTilt size={14} weight="duotone" style={{ color: accentText }} />
                  {trip.destination}
                </p>
              )}
              {trip.bookingRef && (
                <p className="text-sub mt-1">Ref / PNR: {trip.bookingRef}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEditTrip(trip)}
              className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white hover:bg-white/[0.14] shrink-0"
              aria-label="Edit trip"
            >
              <PencilSimple size={16} weight="duotone" />
            </button>
          </div>

          <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36, #A46D52))',
                transform: `scaleX(${Math.max(0.03, ratio)})`,
                transformOrigin: 'left',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-sub tabular-nums">
              {packedCount}/{totalCount} items packed
            </span>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => void handleUnpackAll()}
                className="font-semibold flex items-center gap-1 hover:text-white text-[rgba(235,235,245,0.65)]"
              >
                <ArrowCounterClockwise size={12} weight="bold" />
                <span>Unpack All</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Button
              variant="glass"
              size="sm"
              icon={<Receipt size={15} weight="duotone" />}
              onClick={async () => {
                await onCreateOrOpenOuting(trip);
                onClose();
              }}
            >
              {trip.linkedOutingId ? 'Open Outing Split' : 'Split Expenses'}
            </Button>
            <Button
              variant={trip.isCompleted ? 'glass' : 'prominent'}
              size="sm"
              icon={<CheckCircle size={15} weight="fill" />}
              onClick={() =>
                void onUpdateTrip({
                  ...trip,
                  isCompleted: !trip.isCompleted,
                  updatedAt: new Date().toISOString(),
                })
              }
            >
              {trip.isCompleted ? 'Reopen Trip' : 'Mark Completed'}
            </Button>
          </div>
        </section>

        {/* Quick Inject Templates */}
        <section className="p-3.5 rounded-[22px] glow-card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-section-header">Inject Starter Checklist</span>
            <button
              type="button"
              disabled={aiLoading}
              onClick={async () => {
                triggerHaptic('selection');
                setAiLoading(true);
                setAiError(null);
                try {
                  const res = await auditTripPackingList(trip);
                  setAiAudit(res);
                } catch (err: any) {
                  setAiError(err?.message || 'Could not audit packing list.');
                } finally {
                  setAiLoading(false);
                }
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
              style={{ color: accentText }}
            >
              {aiLoading ? <SpinnerGap size={12} className="animate-spin" /> : <Brain size={12} weight="duotone" />}
              <span>AI Packing Audit</span>
            </button>
          </div>
          {aiError && <p className="text-xs text-[#FF453A]">{aiError}</p>}
          {aiAudit && (
            <div className="p-3 rounded-2xl bg-white/[0.04] space-y-2">
              {aiAudit.note && <p className="text-xs text-[rgba(240,240,245,0.85)]">{aiAudit.note}</p>}
              {aiAudit.missing.length === 0 ? (
                <p className="text-xs text-sub">Checklist looks well covered for this trip.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {aiAudit.missing.map((m, idx) => (
                    <button
                      key={`ai_pack_${idx}`}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        void onUpdateTrip({
                          ...trip,
                          packingItems: [
                            ...trip.packingItems,
                            { id: `pack_${Date.now()}_${idx}`, name: m.name, group: m.group, packed: false },
                          ],
                          updatedAt: new Date().toISOString(),
                        });
                        setAiAudit((prev) =>
                          prev ? { ...prev, missing: prev.missing.filter((_, i) => i !== idx) } : null
                        );
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-semibold text-white"
                    >
                      + {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {TRIP_STARTER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => void handleApplyTemplate(tpl.id)}
                className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors"
              >
                + {tpl.label}
              </button>
            ))}
          </div>
        </section>

        {/* Add Custom Item */}
        <section className="p-4 rounded-[24px] glow-card space-y-2.5">
          <span className="text-section-header block">Add Item to Bag</span>
          <div className="flex gap-2">
            <TextField
              placeholder="e.g., Lab Coat, Power Adapter"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onClear={() => setNewItemName('')}
            />
            <Button variant="glass" icon={<Plus size={16} weight="bold" />} onClick={handleAddItem}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GROUP_LABELS.map((grp) => {
              const active = newItemGroup === grp.key;
              return (
                <button
                  key={grp.key}
                  type="button"
                  onClick={() => setNewItemGroup(grp.key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    active ? 'droplet-active' : 'bg-white/[0.04] text-[rgba(235,235,245,0.65)]'
                  }`}
                  style={active ? { color: accentText } : undefined}
                >
                  {grp.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Grouped Packing Checklist */}
        {GROUP_LABELS.map((grp) => {
          const items = trip.packingItems.filter((i) => i.group === grp.key);
          if (items.length === 0) return null;
          return (
            <section key={grp.key} className="p-4 rounded-[24px] glow-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-section-header">{grp.label}</span>
                <span className="text-sub tabular-nums">
                  {items.filter((i) => i.packed).length}/{items.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 rounded-[14px] bg-white/[0.04] flex items-center gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => void handleToggleItem(item.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
                      <span style={{ color: item.packed ? accentText : 'rgba(240,240,245,0.45)' }}>
                        {item.packed ? <CheckCircle size={18} weight="fill" /> : <CircleIcon size={18} />}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          item.packed ? 'line-through text-[rgba(235,235,245,0.42)]' : 'text-white'
                        }`}
                      >
                        {item.name}
                        {item.quantity ? ` (${item.quantity})` : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteItem(item.id)}
                      className="p-1 text-[rgba(235,235,245,0.38)] hover:text-[#FF453A]"
                      aria-label="Remove item"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {trip.notes && (
          <section className="p-4 rounded-[24px] glow-card space-y-1.5">
            <span className="text-section-header block">Travel Notes</span>
            <p className="text-body text-white whitespace-pre-wrap">{trip.notes}</p>
          </section>
        )}

        {trip.linkedOutingId && (
          <button
            type="button"
            onClick={() => {
              onClose();
              startTransition(() => {
                navigate(`/outings/${trip.linkedOutingId}`);
              });
            }}
            className="w-full p-3.5 rounded-[20px] glow-card flex items-center justify-between text-sm font-semibold text-white"
          >
            <span className="flex items-center gap-2">
              <Receipt size={16} weight="duotone" style={{ color: accentText }} />
              View Linked Outing Expenses
            </span>
            <ArrowRight size={15} className="text-[rgba(235,235,245,0.5)]" />
          </button>
        )}

        <Button
          variant="glass"
          className="w-full text-[#FF453A]"
          icon={<Trash size={16} weight="duotone" />}
          onClick={async () => {
            await onDeleteTrip(trip.id);
            onClose();
          }}
        >
          Delete Trip
        </Button>
      </div>
    </Sheet>
  );
}


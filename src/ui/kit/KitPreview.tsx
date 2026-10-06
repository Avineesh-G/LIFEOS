import React, { useState, useEffect } from 'react';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  Segmented,
  Switch,
  Stepper,
  TextField,
  Badge,
  Ring,
  ProgressBar,
  Chart,
  Heatmap,
  Sheet,
  ActionSheet,
  SearchPill,
  EmptyState,
  Chip,
  RatingButton,
  RatingLevel,
  MODULE_TINTS,
  House,
  Barbell,
  ForkKnife,
  Timer,
  Wallet,
  CheckCircle,
  Sparkle,
  PencilSimple,
  Trash,
  SlidersHorizontal,
  Flame,
  Brain,
} from '../../ui';

export default function KitPreview() {
  const [segmentedVal, setSegmentedVal] = useState('one');
  const [ambientSetting, setAmbientSetting] = useState<'off' | 'low' | 'medium'>(() => {
    try {
      const saved = localStorage.getItem('lifeos_ambient_light') as any;
      if (saved === 'off' || saved === 'low' || saved === 'medium') return saved;
    } catch {}
    return 'medium';
  });
  const [switchVal, setSwitchVal] = useState(true);
  const [stepperVal, setStepperVal] = useState(80);
  const [textVal, setTextVal] = useState('Liquid Glass');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [selectedChips, setSelectedChips] = useState<Record<string, boolean>>({
    chest: true,
    triceps: true,
    cardio: false,
  });

  const handleAmbientChange = (val: 'off' | 'low' | 'medium') => {
    setAmbientSetting(val);
    try {
      localStorage.setItem('lifeos_ambient_light', val);
      window.dispatchEvent(new Event('lifeos:ambient-light-changed'));
    } catch {}
  };

  const sampleChartData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 60 },
    { label: 'Wed', value: 75 },
    { label: 'Thu', value: 50 },
    { label: 'Fri', value: 90 },
    { label: 'Sat', value: 80 },
    { label: 'Sun', value: 95 },
  ];

  const sampleHeatmapDays = Array.from({ length: 126 }, (_, i) => ({
    date: `2026-10-${(i % 30) + 1}`,
    level: i % 5,
  }));

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <LargeTitleHeader
        title="UI Kit v2"
        subtitle="Liquid Glass Design System"
      />

      <div className="px-4 flex flex-col gap-6 max-w-lg mx-auto">
        {/* ── Ambient Light Control ── */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-label text-white/90">Ambient Light</span>
            <span className="text-sub capitalize">{ambientSetting} (14% Top 45vh)</span>
          </div>
          <Segmented
            options={[
              { value: 'off', label: 'Off' },
              { value: 'low', label: 'Low (6%)' },
              { value: 'medium', label: 'Medium (14%)' },
            ]}
            value={ambientSetting}
            onChange={handleAmbientChange}
            tint="#5E5CE6"
          />
        </div>

        {/* ── Glass Card Anatomy Showcase (Section 3.2) ── */}
        <div className="flex flex-col gap-3">
          <div className="text-section-header px-1">Glass Card Variants (No Blur, No Border)</div>
          
          {/* Glass Hero */}
          <div className="glass-hero p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sub text-white/60">.glass-hero (radius 32, double radial)</span>
              <span className="px-2.5 py-0.5 rounded-full text-badge bg-white/10 text-white">Hero Card</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-value-hero">0:00</span>
              <span className="text-label text-white/60">hrs focused</span>
            </div>
            <Button variant="prominent" tint="#5E5CE6" size="md">
              Start Focus Block
            </Button>
          </div>

          {/* Glass Tiles Grid (Bento) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-tile p-4 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center glass-flat text-[#FF9F0A]">
                <ForkKnife size={16} weight="fill" />
              </div>
              <div className="text-value">510 <span className="text-sub">kcal</span></div>
              <div className="text-sub">Daily Fuel</div>
            </div>

            <div className="glass-tile p-4 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center glass-flat text-[#30D158]">
                <Wallet size={16} weight="fill" />
              </div>
              <div className="text-value">Rs 0</div>
              <div className="text-sub">Spent Today</div>
            </div>
          </div>

          {/* Glass Row Group */}
          <div className="glass-row divide-y divide-white/[0.06]">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center glass-flat text-[#FF453A]">
                  <Barbell size={16} weight="fill" />
                </div>
                <div>
                  <div className="text-card-title text-white">Jumping Jacks</div>
                  <div className="text-sub">Rest 30s</div>
                </div>
              </div>
              <span className="text-sub font-semibold">1 x 30</span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center glass-flat text-[#64D2FF]">
                  <Flame size={16} weight="fill" />
                </div>
                <div>
                  <div className="text-card-title text-white">Flow Session</div>
                  <div className="text-sub">Deep work timer</div>
                </div>
              </div>
              <span className="text-sub font-semibold">50 min</span>
            </div>
          </div>
        </div>

        {/* ── Navigation Glass Layer (Section 3.3) ── */}
        <div className="flex flex-col gap-3">
          <div className="text-section-header px-1">Navigation Glass Layer (Real Blur + Rim Light)</div>
          <div className="glass-nav nav-rim-light p-4 rounded-2xl flex items-center justify-between">
            <span className="text-inline-title text-white">.glass-nav</span>
            <div className="flex items-center gap-2">
              <Button variant="pill" tint="#FF453A" icon={<SlidersHorizontal size={14} weight="bold" />}>
                Split
              </Button>
              <Button variant="pill" tint="#30D158" icon={<CheckCircle size={14} weight="bold" />}>
                Done
              </Button>
            </div>
          </div>
        </div>

        {/* ── Borderless Controls (Section 3.5) ── */}
        <div className="flex flex-col gap-3">
          <div className="text-section-header px-1">Borderless Controls (Section 3.5)</div>

          {/* Selectable Chips */}
          <div className="flex flex-wrap gap-2">
            <Chip
              label="Chest"
              selected={selectedChips.chest}
              tint="#FF453A"
              onSelect={() => setSelectedChips((p) => ({ ...p, chest: !p.chest }))}
            />
            <Chip
              label="Triceps"
              selected={selectedChips.triceps}
              tint="#FF453A"
              onSelect={() => setSelectedChips((p) => ({ ...p, triceps: !p.triceps }))}
            />
            <Chip
              label="Cardio"
              selected={selectedChips.cardio}
              tint="#FF453A"
              onSelect={() => setSelectedChips((p) => ({ ...p, cardio: !p.cardio }))}
            />
          </div>

          {/* Rating Buttons (Active Recall) */}
          <div className="flex items-center gap-2">
            <RatingButton level="again" label="Again" intervalText="< 1m" onClick={() => {}} />
            <RatingButton level="hard" label="Hard" intervalText="2 d" onClick={() => {}} />
            <RatingButton level="good" label="Good" intervalText="4 d" onClick={() => {}} />
            <RatingButton level="easy" label="Easy" intervalText="7 d" onClick={() => {}} />
          </div>

          {/* Primary Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="prominent" tint="#FF453A" className="flex-1" size="md">
              Primary Sheen
            </Button>
            <Button variant="glass" tint="#0A84FF" className="flex-1" size="md">
              Glass Action
            </Button>
          </div>
        </div>

        {/* ── Module Tints Grid ── */}
        <div className="flex flex-col gap-2">
          <div className="text-section-header px-1">Module Tints (Precomputed RGBA)</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODULE_TINTS).map(([name, hex]) => (
              <div
                key={name}
                className="px-2.5 py-1 rounded-full text-badge"
                style={{
                  backgroundColor: `color-mix(in srgb, ${hex} 18%, transparent)`,
                  color: hex,
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* ── Typography Scale Specimen (Section 6) ── */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="text-section-header">Typography System (Inter Variable)</div>
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-sub text-white/50">Large Title (34/41, 700)</div>
              <div className="text-large-title">Today</div>
            </div>
            <div>
              <div className="text-sub text-white/50">Inline Title (17/22, 600)</div>
              <div className="text-inline-title">Focus Block</div>
            </div>
            <div>
              <div className="text-sub text-white/50">Value (30/34, 600, tabular)</div>
              <div className="text-value">1,840 <span className="text-sub">kcal</span></div>
            </div>
            <div>
              <div className="text-sub text-white/50">Body (16/22, 400)</div>
              <div className="text-body text-white/90">Body text crafted for clarity and legibility.</div>
            </div>
            <div>
              <div className="text-sub text-white/50">Sub (12.5/16, 400, text-3)</div>
              <div className="text-sub">Subtitle or secondary footnote metadata.</div>
            </div>
          </div>
        </div>

        {/* Visualizations (Rings, Progress, Heatmap) */}
        <GroupedList header="Visualizations & Metrics">
          <div className="p-4 flex items-center justify-around">
            <Ring progress={0.75} size={72} strokeWidth={7} color="#FF9F0A">
              <span className="text-xs font-bold text-white tabular-nums">75%</span>
            </Ring>
            <Ring progress={0.9} size={72} strokeWidth={7} color="#FF453A">
              <span className="text-xs font-bold text-white tabular-nums">90%</span>
            </Ring>
            <Ring progress={0.5} size={72} strokeWidth={7} color="#64D2FF">
              <span className="text-xs font-bold text-white tabular-nums">50%</span>
            </Ring>
          </div>
          <div className="px-4 pb-4">
            <ProgressBar progress={0.65} height={8} color="#0A84FF" />
          </div>
          <div className="px-4 pb-4">
            <Heatmap days={sampleHeatmapDays} color="#64D2FF" />
          </div>
        </GroupedList>

        {/* Modal Triggers */}
        <div className="flex gap-2">
          <Button
            variant="glass"
            tint="#0A84FF"
            className="flex-1"
            onClick={() => setSheetOpen(true)}
          >
            Open Sheet
          </Button>
          <Button
            variant="glass"
            tint="#FF453A"
            className="flex-1"
            onClick={() => setActionSheetOpen(true)}
          >
            Action Sheet
          </Button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<CheckCircle weight="bold" />}
          title="All Tasks Finished"
          description="You're all caught up for today. Enjoy your evening!"
          actionLabel="Add Tomorrow's Task"
          onAction={() => {}}
          tint="#0A84FF"
        />
      </div>

      {/* Sheets */}
      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        detent="half"
        title="Liquid Glass Sheet"
      >
        <div className="py-4 text-center text-sm text-[rgba(235,235,245,0.70)]">
          This sheet has an inset radius of 38px, grabber handle, and backdrop blur.
        </div>
      </Sheet>

      <ActionSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title="Workout Options"
        message="Choose an action for Chest & Triceps"
        options={[
          { key: 'edit', label: 'Edit Exercises', onClick: () => {} },
          { key: 'dup', label: 'Duplicate Split', onClick: () => {} },
          { key: 'del', label: 'Delete Split', destructive: true, onClick: () => {} },
        ]}
      />
    </div>
  );
}

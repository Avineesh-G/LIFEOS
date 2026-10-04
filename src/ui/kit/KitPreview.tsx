import React, { useState } from 'react';
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
  GlassSurface,
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
  Copy,
} from '../../ui';

export default function KitPreview() {
  const [segmentedVal, setSegmentedVal] = useState('one');
  const [switchVal, setSwitchVal] = useState(true);
  const [stepperVal, setStepperVal] = useState(80);
  const [textVal, setTextVal] = useState('Liquid Glass');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const sampleChartData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 60 },
    { label: 'Wed', value: 75 },
    { label: 'Thu', value: 50 },
    { label: 'Fri', value: 90 },
    { label: 'Sat', value: 80 },
    { label: 'Sun', value: 95 },
  ];

  const sampleHeatmapDays = Array.from({ length: 70 }, (_, i) => ({
    date: `2026-10-${(i % 30) + 1}`,
    level: i % 5,
  }));

  return (
    <div className="w-full min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <LargeTitleHeader
        title="UI Kit Preview"
        subtitle="Design System Components"
        syncStatus="synced"
      />

      <div className="px-4 flex flex-col gap-6 max-w-lg mx-auto">
        {/* Module Tints Strip */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold text-[rgba(235,235,245,0.60)] px-1">MODULE TINTS</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODULE_TINTS).map(([name, hex]) => (
              <div
                key={name}
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${hex} 18%, #2C2C2E)`,
                  color: hex,
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons & Steppers */}
        <GroupedList header="Buttons & Controls">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Button variant="prominent" tint="#0A84FF">
                Prominent Action
              </Button>
              <Button variant="glass" tint="#FF453A">
                Glass Pill
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="plain" tint="#30D158">
                Plain Action
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
          <ListRow
            title="Switch Toggle"
            subtitle="Smooth spring knob interaction"
            trailing={<Switch checked={switchVal} onChange={setSwitchVal} />}
          />
          <ListRow
            title="Weight Stepper"
            subtitle="Tabular display numbers"
            trailing={
              <Stepper
                value={stepperVal}
                onChange={setStepperVal}
                unit="kg"
                tint="#FF453A"
                size="sm"
              />
            }
          />
        </GroupedList>

        {/* Segmented & Search Pill */}
        <div className="flex flex-col gap-3">
          <Segmented
            options={[
              { value: 'one', label: 'Day', icon: <House size={14} weight="bold" /> },
              { value: 'two', label: 'Week', icon: <Barbell size={14} weight="bold" /> },
              { value: 'three', label: 'Month', icon: <Timer size={14} weight="bold" /> },
            ]}
            value={segmentedVal}
            onChange={setSegmentedVal}
            tint="#0A84FF"
          />

          <SearchPill
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search kit components..."
          />

          <TextField
            label="Input Field (surface-2)"
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onClear={() => setTextVal('')}
          />
        </div>

        {/* Grouped Inset List Rows */}
        <GroupedList header="Grouped Inset Rows" footer="Separators inset 16px past leading icon">
          <ListRow
            icon={<House weight="bold" />}
            iconTint="#0A84FF"
            title="Home Dashboard"
            subtitle="Today's Battle Plan"
            showChevron
            onClick={() => {}}
          />
          <ListRow
            icon={<Barbell weight="bold" />}
            iconTint="#FF453A"
            title="Chest & Triceps"
            subtitle="4 exercises • 55 min"
            trailing={<span className="text-[#FF453A] font-bold">Today</span>}
            showChevron
            onClick={() => {}}
          />
          <ListRow
            icon={<ForkKnife weight="bold" />}
            iconTint="#FF9F0A"
            title="Calories Remaining"
            trailing="1,840 kcal"
            showChevron
            onClick={() => {}}
          />
          <ListRow
            icon={<Wallet weight="bold" />}
            iconTint="#30D158"
            title="Daily Spending"
            trailing="Rs 420"
            showChevron
            onClick={() => {}}
          />
        </GroupedList>

        {/* Badges & Streaks */}
        <div className="flex items-center gap-3">
          <Badge count={14} label="Day Streak" points={12} color="#FF7A45" />
          <Badge count="PR" label="Bench Press" points={8} color="#FF453A" />
          <Badge count="Luna AI" points={12} color="#BF5AF2" />
        </div>

        {/* Visualization (Rings, Progress, Charts, Heatmaps) */}
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
            <Chart data={sampleChartData} color="#0A84FF" unit="hrs" height={140} />
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
            Open Sheet (50%)
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

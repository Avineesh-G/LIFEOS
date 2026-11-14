import React from 'react';
import type { MealSlot } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export interface MealSlotCalorieData {
  slot: MealSlot;
  label: string;
  shortLabel: string;
  time: string;
  color: string;
  calories: number;
  isSkipped: boolean;
  estBudget: number;
}

export interface SplitCalorieCircleProps {
  slotsData: MealSlotCalorieData[];
  caloriesRemaining: number;
  caloriesEaten: number;
  calorieTarget: number;
  onSelectSlot?: (slot: MealSlot) => void;
  selectedSlot?: MealSlot | null;
}

/**
 * Converts polar coordinates to cartesian SVG coordinates.
 * Angle in degrees is measured clockwise from 12 o'clock (0 deg = top).
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: Number((centerX + radius * Math.cos(angleInRadians)).toFixed(2)),
    y: Number((centerY + radius * Math.sin(angleInRadians)).toFixed(2)),
  };
}

/**
 * Generates an SVG path for a clockwise circular arc from startAngle to endAngle.
 */
function describeArcClockwise(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(' ');
}

/**
 * Generates an SVG path along which text curves, with optimal reading orientation.
 */
function describeTextArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise = true
) {
  const start = polarToCartesian(centerX, centerY, radius, clockwise ? startAngle : endAngle);
  const end = polarToCartesian(centerX, centerY, radius, clockwise ? endAngle : startAngle);
  const sweepFlag = clockwise ? 1 : 0;
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    0,
    sweepFlag,
    end.x,
    end.y,
  ].join(' ');
}

// Fixed angular partitions for the 5 meal slots (clockwise from top)
// 5 slots x 64 deg = 320 deg; 5 gaps x 8 deg = 40 deg; Total = 360 deg
const SLOT_ANGLES: Record<MealSlot, { start: number; end: number; mid: number; textClockwise: boolean }> = {
  breakfast: { start: 4, end: 68, mid: 36, textClockwise: true },
  lunch: { start: 76, end: 140, mid: 108, textClockwise: true },
  snacks: { start: 148, end: 212, mid: 180, textClockwise: false },
  dinner: { start: 220, end: 284, mid: 252, textClockwise: false },
  nightCanteen: { start: 292, end: 356, mid: 324, textClockwise: true },
};

// Radial divider notch angles centered exactly in the 8-degree gaps
const GAP_DIVIDER_ANGLES = [0, 72, 144, 216, 288];

// Precomputed static SVG paths for zero-overhead GPU rendering
const SIZE = 260;
const CENTER = SIZE / 2; // 130
const RADIUS = 92;
const STROKE_WIDTH = 28;

const STATIC_ARC_PATHS: Record<MealSlot, string> = {
  breakfast: describeArcClockwise(CENTER, CENTER, RADIUS, 4, 68),
  lunch: describeArcClockwise(CENTER, CENTER, RADIUS, 76, 140),
  snacks: describeArcClockwise(CENTER, CENTER, RADIUS, 148, 212),
  dinner: describeArcClockwise(CENTER, CENTER, RADIUS, 220, 284),
  nightCanteen: describeArcClockwise(CENTER, CENTER, RADIUS, 292, 356),
};

const STATIC_TEXT_PATHS: Record<MealSlot, string> = {
  breakfast: describeTextArc(CENTER, CENTER, RADIUS, 4, 68, true),
  lunch: describeTextArc(CENTER, CENTER, RADIUS, 76, 140, true),
  snacks: describeTextArc(CENTER, CENTER, RADIUS, 148, 212, false),
  dinner: describeTextArc(CENTER, CENTER, RADIUS, 220, 284, false),
  nightCanteen: describeTextArc(CENTER, CENTER, RADIUS, 292, 356, true),
};

const STATIC_GAP_DIVIDERS = GAP_DIVIDER_ANGLES.map((angleDeg) => ({
  angleDeg,
  innerPt: polarToCartesian(CENTER, CENTER, RADIUS - STROKE_WIDTH / 2, angleDeg),
  outerPt: polarToCartesian(CENTER, CENTER, RADIUS + STROKE_WIDTH / 2, angleDeg),
}));

export const SplitCalorieCircle: React.FC<SplitCalorieCircleProps> = React.memo(({
  slotsData,
  caloriesRemaining,
  caloriesEaten,
  onSelectSlot,
  selectedSlot,
}) => {
  const size = SIZE;
  const strokeWidth = STROKE_WIDTH;

  const handleSlotClick = (slot: MealSlot) => {
    triggerHaptic('light');
    if (onSelectSlot) {
      onSelectSlot(slot);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full select-none py-1">
      {/* ── Circular Split Gauge Container (GPU Hardware-Accelerated) ── */}
      <div className="relative w-[260px] h-[260px] flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {/* Dedicated curved paths for textPath text curving inside each slot arc */}
            {slotsData.map((slot) => {
              const textPathD = STATIC_TEXT_PATHS[slot.slot];
              if (!textPathD) return null;
              return (
                <path
                  key={`text-path-${slot.slot}`}
                  id={`text-path-${slot.slot}`}
                  d={textPathD}
                  fill="none"
                />
              );
            })}
          </defs>

          {/* ── Precision Gap Notches (separates each meal slot) ── */}
          {STATIC_GAP_DIVIDERS.map(({ angleDeg, innerPt, outerPt }) => (
            <line
              key={`gap-tick-${angleDeg}`}
              x1={innerPt.x}
              y1={innerPt.y}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={1}
              style={{ strokeLinecap: 'butt' }}
            />
          ))}

          {/* ── Render the 5 Meal Arcs ── */}
          {slotsData.map((slot) => {
            const isSelected = selectedSlot === slot.slot;
            const hasCalories = slot.calories > 0;
            const arcPath = STATIC_ARC_PATHS[slot.slot];
            if (!arcPath) return null;

            return (
              <g
                key={slot.slot}
                onClick={() => handleSlotClick(slot.slot)}
                className="cursor-pointer transition-opacity duration-150"
                style={{ opacity: selectedSlot && !isSelected ? 0.55 : 1 }}
              >
                {/* Background Track Arc */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke={slot.isSkipped ? 'rgba(255, 69, 58, 0.14)' : `${slot.color}20`}
                  strokeWidth={strokeWidth}
                  style={{ strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
                />

                {/* Active Colored Arc (Hardware-Accelerated native SVG stroke) */}
                {hasCalories && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={slot.color}
                    strokeWidth={strokeWidth}
                    style={{ strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
                  />
                )}

                {/* Skipped Meal Pattern Arc */}
                {slot.isSkipped && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke="#FF453A"
                    strokeWidth={strokeWidth}
                    strokeDasharray="4 5"
                    opacity={0.35}
                    style={{ strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
                  />
                )}

                {/* Curved Calorie Text curving along the circular arc of that segment */}
                <text
                  fontSize={9.5}
                  fontWeight={800}
                  letterSpacing={0.4}
                  dominantBaseline="central"
                  className="select-none pointer-events-none"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.95))',
                  }}
                >
                  <textPath
                    href={`#text-path-${slot.slot}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    <tspan fill={slot.color} fontWeight={900}>
                      {slot.shortLabel}
                    </tspan>
                    <tspan fill="rgba(255, 255, 255, 0.65)" fontWeight={700}>
                      {' · '}
                    </tspan>
                    <tspan
                      fill="#FFFFFF"
                      fontWeight={900}
                    >
                      {slot.isSkipped ? 'SKIP' : `${slot.calories} cal`}
                    </tspan>
                  </textPath>
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Center Metric Content ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[34px] font-black text-white tabular-nums tracking-tight leading-none">
            {caloriesRemaining}
          </span>
          <span className="text-[10px] font-bold text-[rgba(235,235,245,0.50)] uppercase tracking-widest mt-1.5">
            kcal left
          </span>
          {caloriesEaten > 0 && (
            <span className="text-[10.5px] font-bold text-[#FF9F0A] tabular-nums mt-1">
              {caloriesEaten} eaten
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

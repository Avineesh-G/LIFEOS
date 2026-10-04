import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { GlassSurface } from '../glass/GlassSurface';
import { triggerHaptic } from '../../utils/haptics';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  unit?: string;
  className?: string;
}

export function Chart({
  data,
  color = '#0A84FF',
  height = 180,
  unit = '',
  className = '',
}: ChartProps) {
  const gradientId = `chart-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`w-full select-none ${className}`} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          onMouseMove={() => triggerHaptic('selection')}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.24} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            stroke="#5F626B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#38383A', strokeDasharray: '3 3' }}
          />
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <GlassSurface className="px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                    <span className="text-xs font-bold text-white tabular-nums">
                      {payload[0].value} {unit}
                    </span>
                  </GlassSurface>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

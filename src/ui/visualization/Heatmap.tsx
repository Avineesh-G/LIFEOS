import React from 'react';

export interface HeatmapDay {
  date: string;
  level: number; // 0 to 4
}

export interface HeatmapProps {
  days: HeatmapDay[];
  color?: string;
  className?: string;
}

export function Heatmap({
  days,
  color = '#64D2FF',
  className = '',
}: HeatmapProps) {
  // 5 levels of intensity
  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return `color-mix(in srgb, ${color} 25%, #2C2C2E)`;
      case 2:
        return `color-mix(in srgb, ${color} 50%, #2C2C2E)`;
      case 3:
        return `color-mix(in srgb, ${color} 75%, #2C2C2E)`;
      case 4:
        return color;
      default:
        return '#2C2C2E';
    }
  };

  return (
    <div className={`w-full overflow-x-auto pb-2 scrollbar-none select-none ${className}`}>
      <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
        {days.map((d, i) => (
          <div
            key={d.date || i}
            title={`${d.date}: Level ${d.level}`}
            className="w-3.5 h-3.5 rounded-[4px] transition-colors"
            style={{ backgroundColor: getCellColor(d.level) }}
          />
        ))}
      </div>
    </div>
  );
}

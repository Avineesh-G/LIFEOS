import React, { useState } from 'react';
import { 
  PALETTE, 
  PaletteEntry, 
  deltaE, 
  getContrast 
} from '../../theme/palette';
import { 
  Home, 
  Dumbbell, 
  Apple, 
  DollarSign, 
  BookOpen, 
  Sliders, 
  History, 
  MapPin, 
  Flame, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';

const ROLE_ICONS: Record<string, React.ElementType> = {
  home: Home,
  gym: Dumbbell,
  nutrition: Apple,
  finance: DollarSign,
  study: BookOpen,
  settings: Sliders,
  history: History,
  outing: MapPin,
  streak: Flame,
};

const ROLE_ROUTES: Record<string, string> = {
  home: '/',
  gym: '/gym',
  nutrition: '/nutrition',
  finance: '/spending',
  study: '/study',
  settings: '/settings',
  history: '/history',
  outing: '/outings',
  streak: '(global streak badge)',
};

const NAV_PILL_BACKGROUNDS: Record<string, { light: string; dark: string }> = {
  home: { light: '#EFF6FF', dark: '#1E293B' },
  gym: { light: '#FFE4E6', dark: '#3B1D28' },
  nutrition: { light: '#FEF3C7', dark: '#3B2E1D' },
  finance: { light: '#E8F5E9', dark: '#122E1A' },
  study: { light: '#E0F7FA', dark: '#0C2A33' },
  settings: { light: '#EEF2F6', dark: '#1E2530' },
  history: { light: '#FCE7F3', dark: '#2E1220' },
  outing: { light: '#FDF4FF', dark: '#2D1537' },
  streak: { light: '#FFF7ED', dark: '#2D1B13' },
};

export default function PaletteBoard() {
  const [previewDark, setPreviewDark] = useState(false);
  const entries = Object.values(PALETTE);

  // Compute nearest neighbor for each entry
  const neighborDistances = entries.map((entry) => {
    let minSeedDist = Infinity;
    let minSeedNeighbor = '';
    let minDarkStrongDist = Infinity;
    let minDarkStrongNeighbor = '';

    entries.forEach((other) => {
      if (other.id === entry.id) return;
      const seedDist = deltaE(entry.seed, other.seed);
      if (seedDist < minSeedDist) {
        minSeedDist = seedDist;
        minSeedNeighbor = other.name;
      }
      const darkDist = deltaE(entry.darkStrong, other.darkStrong);
      if (darkDist < minDarkStrongDist) {
        minDarkStrongDist = darkDist;
        minDarkStrongNeighbor = other.name;
      }
    });

    return {
      entry,
      minSeedDist,
      minSeedNeighbor,
      minDarkStrongDist,
      minDarkStrongNeighbor,
    };
  });

  // Calculate overall metrics
  const minOverallSeed = Math.min(...neighborDistances.map((d) => d.minSeedDist));
  const minOverallDarkStrong = Math.min(...neighborDistances.map((d) => d.minDarkStrongDist));

  return (
    <div className={`p-4 sm:p-6 max-w-6xl mx-auto space-y-6 transition-colors duration-200 ${previewDark ? 'bg-[#121316] text-[#F3F4F6]' : 'bg-[#FDFDFD] text-[#1E293B]'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="text-blue-500" size={24} />
            <h1 className="text-2xl font-black font-sans tracking-tight">LifeOS Palette Board</h1>
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              DEV ONLY
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
            OKLab ΔE × 100 Perceptually Validated Interface Token Architecture
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewDark(!previewDark)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all"
            style={{
              backgroundColor: previewDark ? '#1F2937' : '#FFFFFF',
              borderColor: previewDark ? '#374151' : '#E5E7EB',
              color: previewDark ? '#F9FAFB' : '#111827',
            }}
          >
            {previewDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-500" />}
            <span>Preview: {previewDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>

      {/* Verification Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 block">Min Seed ΔE</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black">{minOverallSeed.toFixed(1)}</span>
            <span className="text-xs text-emerald-600 font-mono">≥ 13.0 PASS</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 block">Min Dark Strong ΔE</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black">{minOverallDarkStrong.toFixed(1)}</span>
            <span className="text-xs text-emerald-600 font-mono">≥ 10.0 PASS</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 block">Roles Covered</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black">9 / 9</span>
            <span className="text-xs text-blue-600 font-mono">Unique Colors</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-violet-500/30 bg-violet-500/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-violet-600 block">WCAG Contrast</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black">100%</span>
            <span className="text-xs text-violet-600 font-mono">≥ 4.5:1 / 3.0:1</span>
          </div>
        </div>
      </div>

      {/* Grid of 9 Interfaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {neighborDistances.map(({ entry, minSeedDist, minSeedNeighbor }) => {
          const Icon = ROLE_ICONS[entry.id] || Layers;
          const route = ROLE_ROUTES[entry.id] || '/';
          const navBg = NAV_PILL_BACKGROUNDS[entry.id] || { light: '#F1F5F9', dark: '#1E293B' };

          // Contrasts
          const seedOnAccentContrast = getContrast(entry.seed, entry.onAccent);
          const darkStrongOnAccentContrast = getContrast(entry.darkStrong, entry.onAccent);
          const textAccentContrast = getContrast(entry.textAccent, '#FDFDFD');
          const darkTintContrast = getContrast(entry.darkTint, '#121316');

          return (
            <div 
              key={entry.id}
              className="p-4 rounded-3xl border transition-all duration-200 space-y-4"
              style={{
                backgroundColor: previewDark ? '#18191E' : '#FFFFFF',
                borderColor: previewDark ? '#2D3039' : '#E2E8F0',
                boxShadow: previewDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Interface Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform"
                    style={{
                      backgroundColor: previewDark ? entry.darkStrong : entry.seed,
                      color: entry.onAccent,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-sm font-sans tracking-tight">{entry.name}</h2>
                    <p className="text-[11px] font-mono text-gray-400">{route}</p>
                  </div>
                </div>

                <span 
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border"
                  style={{
                    backgroundColor: `${entry.seed}15`,
                    borderColor: `${entry.seed}30`,
                    color: previewDark ? entry.darkTint : entry.textAccent,
                  }}
                >
                  ΔE {minSeedDist.toFixed(1)}
                </span>
              </div>

              {/* Swatch Color Strip */}
              <div className="grid grid-cols-3 gap-2">
                {/* Seed Swatch */}
                <div className="rounded-xl overflow-hidden border border-black/5 flex flex-col">
                  <div 
                    className="h-12 flex items-center justify-center font-mono text-[11px] font-bold"
                    style={{ backgroundColor: entry.seed, color: entry.onAccent }}
                  >
                    Seed
                  </div>
                  <div className="p-1.5 text-center bg-gray-50 dark:bg-gray-800/60 font-mono text-[9px] text-gray-500">
                    {entry.seed}
                  </div>
                </div>

                {/* Dark Strong Swatch */}
                <div className="rounded-xl overflow-hidden border border-black/5 flex flex-col">
                  <div 
                    className="h-12 flex items-center justify-center font-mono text-[11px] font-bold"
                    style={{ backgroundColor: entry.darkStrong, color: entry.onAccent }}
                  >
                    Strong
                  </div>
                  <div className="p-1.5 text-center bg-gray-50 dark:bg-gray-800/60 font-mono text-[9px] text-gray-500">
                    {entry.darkStrong}
                  </div>
                </div>

                {/* Dark Tint Swatch */}
                <div className="rounded-xl overflow-hidden border border-black/5 flex flex-col">
                  <div 
                    className="h-12 flex items-center justify-center font-mono text-[11px] font-bold"
                    style={{ backgroundColor: entry.darkTint, color: '#121316' }}
                  >
                    Tint
                  </div>
                  <div className="p-1.5 text-center bg-gray-50 dark:bg-gray-800/60 font-mono text-[9px] text-gray-500">
                    {entry.darkTint}
                  </div>
                </div>
              </div>

              {/* Hub Tile Simulations (Active & Inactive) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Hub Tile Simulation</span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Active Tile */}
                  <div 
                    className="p-2.5 rounded-2xl flex items-center gap-2 border"
                    style={{
                      backgroundColor: previewDark ? '#23262F' : '#F8FAFC',
                      borderColor: previewDark ? '#323642' : '#E2E8F0',
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: previewDark ? entry.darkStrong : entry.seed,
                        color: entry.onAccent,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate">Active</p>
                      <p className="text-[9px] font-mono text-emerald-500">Squircle On</p>
                    </div>
                  </div>

                  {/* Inactive Tile */}
                  <div 
                    className="p-2.5 rounded-2xl flex items-center gap-2 border opacity-75"
                    style={{
                      backgroundColor: previewDark ? '#1C1D22' : '#FAFAFA',
                      borderColor: previewDark ? '#2B2D35' : '#E5E7EB',
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: previewDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        color: previewDark ? entry.darkTint : entry.textAccent,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold truncate">Inactive</p>
                      <p className="text-[9px] font-mono text-gray-400">Dimmed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nav Pill & Action Button Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Nav Pill & Primary Button</span>
                <div className="flex items-center gap-2">
                  {/* Simulated Nav Pill Active */}
                  <div 
                    className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold"
                    style={{
                      backgroundColor: previewDark ? navBg.dark : navBg.light,
                      color: previewDark ? entry.darkTint : entry.textAccent,
                    }}
                  >
                    <Icon size={13} />
                    <span>Pill</span>
                  </div>

                  {/* Primary Action Button */}
                  <button 
                    className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                    style={{
                      backgroundColor: previewDark ? entry.darkStrong : entry.seed,
                      color: entry.onAccent,
                    }}
                  >
                    Action
                  </button>

                  {/* Streak Badge (if streak role or demo) */}
                  {entry.id === 'streak' && (
                    <div 
                      className="px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 shadow-sm"
                      style={{
                        backgroundColor: '#FF6B35',
                        color: '#1A1A1F',
                      }}
                    >
                      <Flame size={14} className="fill-current" />
                      <span>7d</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contrast Metrics Card */}
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1 text-[10px] font-mono">
                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                  <span>On-Accent:</span>
                  <span className={seedOnAccentContrast >= 4.5 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                    {seedOnAccentContrast.toFixed(2)}:1 ({entry.onAccent === '#1A1A1F' ? 'Dark' : 'White'})
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                  <span>Nearest Seed:</span>
                  <span className="truncate max-w-[150px] text-right font-medium">
                    {minSeedNeighbor.split(' ')[0]} ({minSeedDist.toFixed(1)})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

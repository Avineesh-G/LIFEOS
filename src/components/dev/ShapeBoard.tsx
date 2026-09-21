import React, { useState } from 'react';
import { PALETTE, deltaE, getContrast, MORE_BUTTON_TOKENS } from '../../theme/palette';
import { ScallopShape } from '../ScallopShape';
import {
  Home,
  Dumbbell,
  Utensils,
  Wallet,
  BookOpen,
  Sliders,
  History,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  Sun,
  Moon,
  X,
} from 'lucide-react';

const INTERFACES = [
  { id: 'home', name: 'Home', icon: Home, seed: PALETTE.home.seed, darkStrong: PALETTE.home.darkStrong, onAccent: PALETTE.home.onAccent },
  { id: 'gym', name: 'Gym', icon: Dumbbell, seed: PALETTE.gym.seed, darkStrong: PALETTE.gym.darkStrong, onAccent: PALETTE.gym.onAccent },
  { id: 'nutrition', name: 'Nutrition', icon: Utensils, seed: PALETTE.nutrition.seed, darkStrong: PALETTE.nutrition.darkStrong, onAccent: PALETTE.nutrition.onAccent },
  { id: 'finance', name: 'Spending', icon: Wallet, seed: PALETTE.finance.seed, darkStrong: PALETTE.finance.darkStrong, onAccent: PALETTE.finance.onAccent },
  { id: 'study', name: 'Study & Timetable', icon: BookOpen, seed: PALETTE.study.seed, darkStrong: PALETTE.study.darkStrong, onAccent: PALETTE.study.onAccent },
  { id: 'settings', name: 'Settings & Vault', icon: Sliders, seed: PALETTE.settings.seed, darkStrong: PALETTE.settings.darkStrong, onAccent: PALETTE.settings.onAccent },
  { id: 'history', name: 'History', icon: History, seed: PALETTE.history.seed, darkStrong: PALETTE.history.darkStrong, onAccent: PALETTE.history.onAccent },
  { id: 'outing', name: 'Outing Expenses', icon: MapPin, seed: PALETTE.outing.seed, darkStrong: PALETTE.outing.darkStrong, onAccent: PALETTE.outing.onAccent },
  { id: 'shopping', name: 'Shopping Lists', icon: ShoppingBag, seed: '#172554', darkStrong: '#254BB5', onAccent: '#FFFFFF' },
  { id: 'vault', name: 'Vault', icon: ShieldCheck, seed: '#2034A0', darkStrong: '#3B82F6', onAccent: '#FFFFFF' },
];

const SIZES = [38, 48, 60, 100, 160];

export default function ShapeBoard() {
  const [isDark, setIsDark] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(48);

  const moreFill = isDark ? MORE_BUTTON_TOKENS.dark.fill : MORE_BUTTON_TOKENS.light.fill;
  const moreIcon = isDark ? MORE_BUTTON_TOKENS.dark.icon : MORE_BUTTON_TOKENS.light.icon;

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-200 select-none ${
        isDark ? 'bg-[#121316] text-[#E6E4EE]' : 'bg-[#F8FAFC] text-[#1B1C22]'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LifeOS Navigation Scallop Shape Board</h1>
            <p className="text-sm opacity-70 mt-1">
              Development-only validation board: 12-lobed organic contour across all interfaces, tokens, and viewports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-black/5 dark:bg-white/5 rounded-full p-1 border border-black/10 dark:border-white/10">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedSize === sz
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="p-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:opacity-80 active:scale-95 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Section 1: Active Icon Indicator Preview (Dynamic Interface Color) */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-2">1. Active Icon Indicator (Size: {selectedSize}px)</h2>
          <p className="text-xs opacity-60 mb-4">
            Color dynamically tracks active interface: {isDark ? 'Dark Strong Fill' : 'Seed Color'}. Glyph uses on-accent token.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {INTERFACES.map((item) => {
              const Icon = item.icon;
              const fill = isDark ? item.darkStrong : item.seed;
              const iconSize = Math.round(selectedSize * 0.5);

              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 shadow-xs"
                >
                  <div
                    className="relative flex items-center justify-center mb-3"
                    style={{ width: selectedSize, height: selectedSize }}
                  >
                    <ScallopShape size={selectedSize} fill={fill} />
                    <Icon
                      size={iconSize}
                      strokeWidth={2.4}
                      style={{ color: item.onAccent }}
                      className="absolute z-10"
                    />
                  </div>
                  <span className="text-xs font-semibold">{item.name}</span>
                  <span className="text-[10px] opacity-60 font-mono mt-0.5">{fill}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: More Button (Fixed Neutral Color) */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-2">2. More Button (60px Fixed Neutral)</h2>
          <p className="text-xs opacity-60 mb-4">
            Fixed neutral anchor on every interface: Light is #1B1C22 (ink), Dark is #E6E4EE (cloud).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Closed State */}
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
              <span className="text-xs font-semibold mb-4">Closed State (2×2 Dots)</span>
              <div className="relative w-[60px] h-[60px] flex items-center justify-center">
                <ScallopShape size={60} fill={moreFill} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill={moreIcon} className="absolute z-10">
                  <circle cx="7" cy="7" r="2.4" />
                  <circle cx="17" cy="7" r="2.4" />
                  <circle cx="7" cy="17" r="2.4" />
                  <circle cx="17" cy="17" r="2.4" />
                </svg>
              </div>
              <span className="text-xs font-mono opacity-60 mt-3">Fill: {moreFill}</span>
            </div>

            {/* Hub Open State */}
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
              <span className="text-xs font-semibold mb-4">Hub Open State (X Glyph)</span>
              <div className="relative w-[60px] h-[60px] flex items-center justify-center">
                <ScallopShape size={60} fill={moreFill} />
                <X size={26} strokeWidth={2.5} style={{ color: moreIcon }} className="absolute z-10" />
              </div>
              <span className="text-xs font-mono opacity-60 mt-3">Fill: {moreFill}</span>
            </div>

            {/* Unpinned Current Page Indicator Dot */}
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
              <span className="text-xs font-semibold mb-4">Unpinned Page Active Dot</span>
              <div className="relative w-[60px] h-[60px] flex items-center justify-center">
                <ScallopShape size={60} fill={moreFill} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill={moreIcon} className="absolute z-10">
                  <circle cx="7" cy="7" r="2.4" />
                  <circle cx="17" cy="7" r="2.4" />
                  <circle cx="7" cy="17" r="2.4" />
                  <circle cx="17" cy="17" r="2.4" />
                </svg>
                {/* Active accent dot inset safely from top right */}
                <span
                  className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ring-2 shadow-xs"
                  style={{
                    backgroundColor: PALETTE.gym.seed,
                    boxShadow: isDark ? '0 0 0 2px #1B1C22' : '0 0 0 2px #FDFDFD',
                  }}
                  title="Gym active unpinned route"
                />
              </div>
              <span className="text-xs opacity-60 mt-3">Safe Inset + 2px Contrast Ring</span>
            </div>
          </div>
        </section>

        {/* Section 3: Navigation Bar Assembly Preview */}
        <section className="mt-10 mb-12">
          <h2 className="text-lg font-semibold mb-2">3. Assembled Navigation Dock Simulation</h2>
          <p className="text-xs opacity-60 mb-4">
            Simulated nav dock showing pill (with 48px scallop) beside More button (60px scallop).
          </p>

          <div className="flex justify-center p-8 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-[14px]">
              {/* Nav pill */}
              <div className="h-[64px] px-[20px] rounded-full flex items-center gap-[28px] bg-[#E0E9FC] dark:bg-[#162545] border border-black/[0.06] dark:border-white/[0.12] shadow-sm">
                {/* Slot 0: Active Home */}
                <div className="relative w-[48px] h-[48px] flex items-center justify-center">
                  <ScallopShape size={48} fill="#2563EB" />
                  <Home size={24} strokeWidth={2.5} className="text-white relative z-10" />
                </div>
                {/* Slot 1: Inactive Gym */}
                <div className="w-[48px] h-[48px] flex items-center justify-center opacity-60">
                  <Dumbbell size={24} strokeWidth={2.2} />
                </div>
                {/* Slot 2: Inactive Nutrition */}
                <div className="w-[48px] h-[48px] flex items-center justify-center opacity-60">
                  <Utensils size={24} strokeWidth={2.2} />
                </div>
              </div>

              {/* More button */}
              <div className="relative w-[60px] h-[60px] flex items-center justify-center">
                <ScallopShape size={60} fill={moreFill} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill={moreIcon} className="relative z-10">
                  <circle cx="7" cy="7" r="2.4" />
                  <circle cx="17" cy="7" r="2.4" />
                  <circle cx="7" cy="17" r="2.4" />
                  <circle cx="17" cy="17" r="2.4" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

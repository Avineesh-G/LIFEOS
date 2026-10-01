import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, AudioWaveform, Sparkles, Send } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface AskLifeOSPillProps {
  onAsk?: (prompt: string) => void;
  className?: string;
}

export function AskLifeOSPill({ onAsk, className = '' }: AskLifeOSPillProps) {
  const { isLite } = usePerformanceMode();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleOpen = () => {
    triggerHaptic('light');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    triggerHaptic('medium');
    onAsk?.(query.trim());
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Floating Pill Capsule Trigger */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleOpen}
        className="
          group relative flex w-full items-center justify-between gap-3 overflow-hidden
          rounded-full px-4 py-3.5 sm:px-5 sm:py-4
          bg-[#050B0D]/85 dark:bg-[#050B0D]/85 light:bg-white/85
          border border-[rgba(255,255,255,0.12)] hover:border-[rgba(56,189,248,0.4)]
          shadow-lg transition-all duration-300 touch-manipulation outline-none select-none
        "
        style={{
          backdropFilter: isLite ? 'none' : 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: isLite ? 'none' : 'blur(24px) saturate(140%)',
        }}
      >
        {/* Soft inner teal glow */}
        {!isLite && (
          <div
            className="pointer-events-none absolute -inset-2 rounded-full opacity-20 blur-xl transition-opacity group-hover:opacity-40"
            style={{
              background: 'radial-gradient(circle at 30% 50%, #0F766E 0%, #0E7490 60%, transparent 100%)',
            }}
          />
        )}

        {/* Left Section: + icon & label */}
        <div className="relative z-10 flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Plus size={16} strokeWidth={2.5} />
          </div>

          <span className="truncate text-sm font-medium text-white/70 group-hover:text-white transition-colors">
            Ask LifeOS...
          </span>
        </div>

        {/* Right Section: Glowing mic circle & Waveform icon */}
        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.5)] group-hover:scale-105 transition-transform">
            <Mic size={15} strokeWidth={2.2} />
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-cyan-300">
            <AudioWaveform size={16} className="animate-pulse" />
          </div>
        </div>
      </motion.button>

      {/* Quick Input Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/15 bg-[#050B0D] p-5 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm">
                    <Sparkles size={16} />
                    <span>Gemini Intelligence</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-white/50 hover:text-white px-2 py-1"
                  >
                    Close
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about workouts, nutrition, tasks, study plan..."
                    autoFocus
                    className="w-full rounded-2xl bg-white/5 border border-white/15 px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <span>Ask</span>
                    <Send size={12} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['What workout today?', 'Log 500 kcal lunch', 'Study plan for today'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setQuery(chip)}
                      className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-white/80"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AskLifeOSPill;

import { Moon, Sun, Monitor, Check, LogOut, AlertTriangle, Dumbbell, Key, Eye, EyeOff, Smartphone, Volume2, Volume1, VolumeX, Save, Zap, Gauge, Waves, ChevronDown, ChevronUp, ShieldCheck, Lock, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { triggerHaptic, getHapticLevel, setHapticLevel, getHapticIntensity, setHapticIntensity, HapticLevel } from '../utils/haptics';
import { getSecurityConfig, saveSecurityConfig, setAppLocked, authenticateDeviceLock, SecurityConfig } from '../utils/security';
import type { AppData, AppSettings, TransitionMode } from '../types';
import BodyProfileForm from '../components/BodyProfileForm';
import { FITNESS_GOALS } from '../utils/calculations';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface SettingsProps {
  theme: AppSettings['theme'];
  setTheme: (t: AppSettings['theme']) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  transitionMode?: TransitionMode;
  setTransitionMode?: (m: TransitionMode) => void;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
  refresh: () => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function Settings({ theme, setTheme, transitionMode = 'efficient', setTransitionMode, data, updateData }: SettingsProps) {
  const navigate = useNavigate();

  // Private Groq API Key State
  const [apiKeyInput, setApiKeyInput] = useState(data.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Haptic feedback preference state (Volume slider inspired with leverage & save button)
  const [hapticLevel, setHapticLevelState] = useState<HapticLevel>(() => getHapticLevel());
  const [hapticIntensity, setHapticIntensityState] = useState<number>(() => getHapticIntensity());
  const [savedHapticIntensity, setSavedHapticIntensity] = useState<number>(() => getHapticIntensity());
  const [hapticSaved, setHapticSaved] = useState(false);

  const handleHapticSliderChange = (newVal: number) => {
    setHapticIntensityState(newVal);
    const newLevel: HapticLevel = newVal === 0 ? 'off' : 'medium';
    setHapticLevelState(newLevel);
  };

  const handleSaveHaptic = () => {
    setHapticIntensity(hapticIntensity);
    setSavedHapticIntensity(hapticIntensity);
    const newLevel: HapticLevel = hapticIntensity === 0 ? 'off' : 'medium';
    setHapticLevelState(newLevel);
    setHapticLevel(newLevel);
    setHapticSaved(true);
    setTimeout(() => setHapticSaved(false), 2500);
  };

  const handleSaveApiKey = async () => {
    await updateData({ geminiApiKey: apiKeyInput.trim() });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  // App Security & Lock state
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => getSecurityConfig());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const handleEnableSecurity = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setSecurityNotice(null);
    try {
      const res = await authenticateDeviceLock('Confirm your phone lock to enable app protection');
      if (res.success) {
        const updated = saveSecurityConfig({ enabled: true });
        setSecurityConfig(updated);
        setSecurityNotice('Phone Screen Lock enabled successfully! 60s cooldown is active.');
        setTimeout(() => setSecurityNotice(null), 4000);
      } else if (res.error && !res.error.toLowerCase().includes('cancel')) {
        setSecurityNotice(res.error || 'Could not verify phone lock. Please ensure a PIN, pattern, or fingerprint is set in Android Settings.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisableSecurity = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setSecurityNotice(null);
    try {
      const res = await authenticateDeviceLock('Verify your phone lock to disable app protection');
      if (res.success) {
        const updated = saveSecurityConfig({ enabled: false });
        setSecurityConfig(updated);
        setSecurityNotice('Phone Screen Lock has been disabled.');
        setTimeout(() => setSecurityNotice(null), 3000);
      } else if (res.error && !res.error.toLowerCase().includes('cancel')) {
        setSecurityNotice(res.error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleToggleSecurity = async () => {
    if (securityConfig.enabled) {
      await handleDisableSecurity();
    } else {
      await handleEnableSecurity();
    }
  };

  // Motion & Transition dynamics state
  const [expandedTransition, setExpandedTransition] = useState<TransitionMode | null>(null);

  const handleTransitionChange = (mode: TransitionMode) => {
    if (setTransitionMode) {
      setTransitionMode(mode);
      triggerHaptic('light');
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-28">
      
      {/* Settings Header */}
      <motion.div variants={item} className="pt-2 px-1">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono mb-1">
          Preferences & System
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
          Settings
        </h1>
      </motion.div>

      {/* Theme Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-amber-500/10 text-amber-500 shadow-sm">
              <Sun size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Display & Theme
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                Choose your visual environment
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent capitalize font-sans">
            {theme} Mode
          </span>
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light', activeClass: 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-md' },
              { value: 'dark' as const, icon: Moon, label: 'Dark', activeClass: 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-md' },
              { value: 'system' as const, icon: Monitor, label: 'System', activeClass: 'bg-accent/15 text-accent border-accent/40 shadow-sm' },
            ].map(({ value, icon: Icon, label, activeClass }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[22px] border transition-all duration-150 active:scale-[0.96] ${
                    active
                      ? activeClass
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-xs font-bold font-sans">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Motion & Interface Transitions (120/144 FPS) */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm">
              <Gauge size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Interface Transitions
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                120 / 144 FPS adaptive motion engine
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full font-mono uppercase bg-accent/15 text-accent border border-accent/20 shadow-sm">
            {transitionMode}
          </span>
        </div>

        {/* Transition Mode Cards (Enlarge option same as mess cards) */}
        <div className="space-y-3 pt-1">
          {[
            {
              id: 'fast' as const,
              title: 'Fast',
              icon: Zap,
              badge: '< 150ms',
              badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
              iconBox: 'bg-amber-500/10 text-amber-500',
              subtitle: 'Snappy Response • Micro-Scale Fade',
              description: 'High-speed micro-scale crossfade optimized for immediate touch response. Strips exit delays for ultra-crisp screen switches.',
              specs: {
                pacing: 'Instant (< 150ms)',
                duration: '0.14s',
                engine: 'Scale + Opacity Composite',
                physics: 'Ease-Out Deceleration'
              }
            },
            {
              id: 'efficient' as const,
              title: 'Efficient',
              icon: Gauge,
              badge: '120 / 144 FPS',
              badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
              iconBox: 'bg-emerald-500/10 text-emerald-500',
              recommended: true,
              subtitle: 'Fluid Slide • GPU Acceleration',
              description: 'Silky smooth horizontal page motion engineered for high refresh rate displays. Delivers native OS navigation feel with zero stutter.',
              specs: {
                pacing: '120 / 144 FPS Lock',
                duration: '0.20s',
                engine: 'GPU translate3d Layer',
                physics: 'Cubic-Bezier [0.25, 1, 0.5, 1]'
              }
            },
            {
              id: 'soft' as const,
              title: 'Soft',
              icon: Waves,
              badge: 'Silky Motion',
              badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
              iconBox: 'bg-indigo-500/10 text-indigo-500',
              subtitle: 'Fluid & Organic • Apple-Style Spring',
              description: 'Silky smooth momentum with gentle depth scaling and upward float. Provides a luxurious, tactile feel designed for high visual elegance.',
              specs: {
                pacing: 'Smooth 60–120 FPS',
                duration: '0.28s',
                engine: 'Scale + Opacity Composite',
                physics: 'Damped Spring [0.16, 1, 0.3, 1]'
              }
            },
          ].map((modeItem) => {
            const active = transitionMode === modeItem.id;
            const isOpen = expandedTransition === modeItem.id;
            const Icon = modeItem.icon;
            return (
              <div
                key={modeItem.id}
                className={`card overflow-hidden transition-all duration-200 border ${
                  active
                    ? 'border-accent ring-2 ring-accent/20 bg-accent/[0.03] dark:bg-accent/[0.06] shadow-md'
                    : 'border-border-light/80 dark:border-border-dark/80 bg-surface-light dark:bg-surface-dark hover:border-accent/40'
                }`}
              >
                {/* Header Row - Click to Enlarge / Collapse (same as mess cards) */}
                <div
                  className="w-full flex items-center justify-between p-4 sm:p-4.5 cursor-pointer active:bg-black/[0.02] dark:active:bg-white/[0.02] transition-colors"
                  onClick={() => {
                    setExpandedTransition(isOpen ? null : modeItem.id);
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${modeItem.iconBox} shadow-sm`}>
                      <Icon size={20} strokeWidth={2.4} />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-primary-light dark:text-primary-dark font-sans tracking-tight">
                          {modeItem.title}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${modeItem.badgeClass}`}>
                          {modeItem.badge}
                        </span>
                        {modeItem.recommended && (
                          <span className="text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5 font-medium truncate">
                        {modeItem.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions on right: Active Checkmark & Enlarge Chevron */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransitionChange(modeItem.id);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-sans transition-all active:scale-95 flex items-center gap-1.5 ${
                        active
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                      }`}
                    >
                      {active ? (
                        <>
                          <Check size={13} strokeWidth={2.8} />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </button>

                    <div className="text-secondary-light dark:text-secondary-dark p-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Enlarged Details Body (same as mess cards) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4.5 pt-2 border-t border-border-light/70 dark:border-border-dark/70 space-y-3.5 bg-black/[0.015] dark:bg-white/[0.015]">
                        <p className="text-xs leading-relaxed text-secondary-light dark:text-secondary-dark pt-1 font-sans">
                          {modeItem.description}
                        </p>

                        {/* Technical Architecture Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                          <div className="p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-2xs">
                            <p className="text-[9.5px] font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-bold">Target Pacing</p>
                            <p className="text-xs font-bold text-primary-light dark:text-primary-dark font-sans mt-0.5">{modeItem.specs.pacing}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-2xs">
                            <p className="text-[9.5px] font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-bold">Duration</p>
                            <p className="text-xs font-bold text-primary-light dark:text-primary-dark font-sans mt-0.5">{modeItem.specs.duration}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-2xs">
                            <p className="text-[9.5px] font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-bold">Hardware Engine</p>
                            <p className="text-xs font-bold text-primary-light dark:text-primary-dark font-sans mt-0.5">{modeItem.specs.engine}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-2xs">
                            <p className="text-[9.5px] font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-bold">Physics Curve</p>
                            <p className="text-xs font-bold text-primary-light dark:text-primary-dark font-sans mt-0.5">{modeItem.specs.physics}</p>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-mono text-secondary-light/90 dark:text-secondary-dark/90">
                            {active ? '● Currently Active Profile' : 'Ready to apply'}
                          </span>
                          {!active && (
                            <button
                              type="button"
                              onClick={() => handleTransitionChange(modeItem.id)}
                              className="px-4 py-1.5 rounded-full bg-accent text-white text-xs font-bold font-sans transition-transform active:scale-95 shadow-sm"
                            >
                              Activate {modeItem.title}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </motion.div>

      {/* Haptic Feedback & Vibration Intensity Slider Section (Volume inspired with smooth leverage & Save button) */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm">
              <Smartphone size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Navigation Bar Haptics
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                Vibration response for the navigation bar
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full font-mono shadow-sm ${
            hapticIntensity === 0
              ? 'bg-neutral-100 dark:bg-neutral-800 text-muted-light dark:text-muted-dark'
              : 'bg-accent/15 text-accent'
          }`}>
            {hapticIntensity === 0 ? 'Off (0%)' : `Medium (${hapticIntensity}%)`}
          </span>
        </div>

        {/* Volume-Inspired Slider Container */}
        <div className="p-5 rounded-2xl bg-bg-light dark:bg-bg-dark border border-border-light/80 dark:border-border-dark/80 space-y-4">
          {/* Header Row with Dynamic Volume Icon and Readout */}
          <div className="flex items-center justify-between text-xs font-mono font-bold text-secondary-light dark:text-secondary-dark">
            <span className="flex items-center gap-2">
              {hapticIntensity === 0 ? (
                <VolumeX size={16} className="text-muted-light dark:text-muted-dark" />
              ) : hapticIntensity < 50 ? (
                <Volume1 size={16} className="text-accent" />
              ) : (
                <Volume2 size={16} className="text-accent" />
              )}
              <span className="font-sans font-bold">Nav Dock Vibration</span>
            </span>
            <span className="font-mono font-black text-accent text-sm">{hapticIntensity}%</span>
          </div>

          {/* Interactive Fluid Volume Slider Bar with Full Leverage */}
          <div className="relative flex items-center h-8">
            {/* Background Track with Filled Volume Level */}
            <div className="absolute inset-x-0 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent/70 via-accent to-accent rounded-full transition-[width] duration-75"
                style={{ width: `${hapticIntensity}%` }}
              />
            </div>

            {/* Continuous Range Input with 0–100% Smooth Drag Leverage */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={hapticIntensity}
              onChange={(e) => handleHapticSliderChange(parseInt(e.target.value, 10))}
              className="absolute inset-x-0 w-full h-8 opacity-0 cursor-pointer z-20"
              aria-label="Adjust Haptic Vibration Intensity"
            />

            {/* Tactile Slider Thumb Indicator */}
            <div
              className="absolute h-6 w-6 rounded-full bg-white dark:bg-neutral-100 shadow-md border-2 border-accent pointer-events-none z-10 transition-[left] duration-75 -translate-x-1/2 flex items-center justify-center"
              style={{ left: `${hapticIntensity}%` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
          </div>

          {/* Stepped Preset Markers (Off to Medium range only) */}
          <div className="flex justify-between text-[11px] font-mono font-bold text-muted-light dark:text-muted-dark px-1">
            <button
              type="button"
              onClick={() => handleHapticSliderChange(0)}
              className={`hover:text-primary-light dark:hover:text-primary-dark transition-colors ${hapticIntensity === 0 ? 'text-accent font-black' : ''}`}
            >
              Off (0%)
            </button>
            <button
              type="button"
              onClick={() => handleHapticSliderChange(35)}
              className={`hover:text-primary-light dark:hover:text-primary-dark transition-colors ${hapticIntensity >= 30 && hapticIntensity < 55 ? 'text-accent font-black' : ''}`}
            >
              Light (35%)
            </button>
            <button
              type="button"
              onClick={() => handleHapticSliderChange(65)}
              className={`hover:text-primary-light dark:hover:text-primary-dark transition-colors ${hapticIntensity >= 55 && hapticIntensity < 85 ? 'text-accent font-black' : ''}`}
            >
              Balanced (65%)
            </button>
            <button
              type="button"
              onClick={() => handleHapticSliderChange(100)}
              className={`hover:text-primary-light dark:hover:text-primary-dark transition-colors ${hapticIntensity >= 85 ? 'text-accent font-black' : ''}`}
            >
              Medium (100%)
            </button>
          </div>

          {/* Action Row: Save Button */}
          <div className="flex items-center justify-end pt-2 border-t border-border-light/60 dark:border-border-dark/60">
            <button
              type="button"
              onClick={handleSaveHaptic}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 shadow-sm ${
                hapticSaved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                  : hapticIntensity !== savedHapticIntensity
                  ? 'bg-accent text-white hover:opacity-90 ring-2 ring-accent/30'
                  : 'bg-accent text-white hover:opacity-90'
              }`}
            >
              {hapticSaved ? (
                <>
                  <Check size={14} strokeWidth={2.8} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={14} strokeWidth={2.2} />
                  <span>{hapticIntensity !== savedHapticIntensity ? 'Save Changes' : 'Save Preference'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* App Security & Phone Lock Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        {/* Card Header: Icon, Title, Subtitle, and Toggle Switch */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center shadow-sm shrink-0 ${
              securityConfig.enabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-accent/15 text-accent'
            }`}>
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                App Security & Lock
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                {securityConfig.enabled ? 'Phone biometric & lock active' : 'Protect with phone screen lock'}
              </p>
            </div>
          </div>

          {/* Header Toggle Switch */}
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={handleToggleSecurity}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex items-center disabled:opacity-50 shrink-0 ${
              securityConfig.enabled ? 'bg-accent' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
            aria-label="Toggle Phone Screen Lock"
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                securityConfig.enabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Feedback / Alert Notice Banner */}
        {securityNotice && (
          <div className="p-3.5 rounded-2xl bg-accent/10 dark:bg-accent/15 border border-accent/25 text-xs text-primary-light dark:text-primary-dark flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold leading-relaxed">{securityNotice}</p>
                {securityNotice.includes('updated LifeOS APK') && (
                  <a
                    href="/LifeOS.apk"
                    download="LifeOS.apk"
                    className="inline-flex items-center gap-1 font-bold text-accent hover:underline pt-0.5"
                  >
                    <span>Download Latest APK</span>
                    <span>→</span>
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSecurityNotice(null)}
              className="text-secondary-light dark:text-secondary-dark hover:text-primary-light p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Security Card Content */}
        {securityConfig.enabled ? (
          <div className="space-y-4 pt-1">
            {/* Status overview tile - Spacious, single border */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border-light/60 dark:border-border-dark/60">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-bold text-primary-light dark:text-primary-dark font-sans">
                    Hardware Biometrics Active
                  </p>
                  <p className="text-[11px] text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                    Fingerprint, Face Unlock or Device PIN
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                Protected
              </span>
            </div>

            {/* Cooldown Information */}
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-secondary-light dark:text-secondary-dark font-medium">
                Auto-Lock Cooldown:
              </span>
              <span className="font-mono font-bold text-accent">
                60 seconds after minimize
              </span>
            </div>

            {/* Action: Clean full-width Lock Now button */}
            <div className="pt-2 border-t border-border-light/60 dark:border-border-dark/60">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setAppLocked(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-accent text-white font-sans text-xs font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 hover:opacity-95"
              >
                <Lock size={14} />
                <span>Lock LifeOS Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-center">
            <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium leading-relaxed max-w-sm mx-auto">
              Secure your health, gym, and private habit data with your phone's native lock screen (Fingerprint, Face recognition, or device PIN/pattern).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-border-light/70 dark:border-border-dark/70 text-secondary-light dark:text-secondary-dark">
                ✓ Fingerprint & Face
              </span>
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-border-light/70 dark:border-border-dark/70 text-secondary-light dark:text-secondary-dark">
                ✓ Device PIN / Pattern
              </span>
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-border-light/70 dark:border-border-dark/70 text-secondary-light dark:text-secondary-dark">
                ✓ 60s Auto-Lock
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isAuthenticating}
                onClick={handleEnableSecurity}
                className="w-full sm:w-auto min-w-[220px] py-3 px-6 rounded-xl bg-accent text-white text-xs font-bold font-sans shadow-md shadow-accent/20 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Verifying Lock...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={16} strokeWidth={2.4} />
                    <span>Enable Phone Lock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Body Profile Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText shadow-sm">
              <Dumbbell size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Body Profile & Targets
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                Metabolic baseline & calorie target
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="rounded-full bg-m3-mint-badge/60 dark:bg-m3-mint-darkBadge/60 text-m3-mint-text dark:text-m3-mint-darkText font-mono font-bold text-xs px-3.5 py-1.5 shadow-sm whitespace-nowrap">
              {data.profile?.currentCalorieTarget || 2000} kcal
            </span>
            {data.profile?.fitnessGoal && (
              <span className="text-[10px] font-mono font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 whitespace-nowrap">
                {FITNESS_GOALS.find(g => g.id === data.profile?.fitnessGoal)?.label || data.profile?.fitnessGoal}
              </span>
            )}
          </div>
        </div>
        <BodyProfileForm 
          initialProfile={data.profile} 
          onSave={(profile) => updateData({ profile })} 
        />
      </motion.div>

      {/* Private Groq AI Coach Configuration */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[14px] bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Key size={20} />
            </span>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
                AI Coach Integration
              </p>
              <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans">
                Groq API Key
              </h3>
            </div>
          </div>
          {data.geminiApiKey ? (
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
              Active ✓
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
              Not Set
            </span>
          )}
        </div>

        <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
          Your key is saved exclusively in your private account. It is never committed to Git, never visible in the APK, and completely private to you.
        </p>

        <div className="space-y-2 pt-1">
          <div className="relative flex items-center">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 pr-11 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 font-mono"
            >
              Get Free Key from Groq →
            </a>
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput.trim()}
              className="btn-pill px-4 py-2 text-xs bg-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              {apiKeySaved ? (
                <>
                  <Check size={14} className="stroke-[3]" /> Saved!
                </>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        {/* User Account Info Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-accent/10 border border-accent/25 flex items-center justify-center text-lg font-black text-accent font-sans shadow-sm shrink-0">
            {(auth.currentUser?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Signed In Account
            </p>
            <p className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans break-all mt-0.5 leading-snug">
              {auth.currentUser?.email || 'Signed In User'}
            </p>
            <p className="text-[10px] text-muted-light dark:text-muted-dark font-mono mt-0.5 truncate">
              UID: {auth.currentUser?.uid || 'Not available'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border-light/60 dark:bg-border-dark/60" />

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              if (Capacitor.isNativePlatform()) {
                GoogleAuth.signOut().catch(() => {});
              }
              navigate('/');
              signOut(auth);
            }}
            className="w-full py-2.5 px-4 rounded-full bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                if (auth.currentUser) {
                  await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                  alert('Data reset successfully! The app will now reload.');
                  window.location.reload();
                }
              }
            }}
            className="w-full py-2.5 px-4 rounded-full bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <AlertTriangle size={14} className="text-amber-500" />
            Reset Data
          </button>
        </div>
      </motion.div>

      <div className="text-center py-4">
        <p className="text-xs font-bold text-muted-light dark:text-muted-dark tracking-wide">LifeOS v1.5.5 (Build 15)</p>
      </div>
    </motion.div>
  );
}

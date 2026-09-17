import { Moon, Sun, Monitor, Check, LogOut, AlertTriangle, Dumbbell, Key, Eye, EyeOff, Smartphone, Volume2, Volume1, VolumeX, Save, Zap, Gauge, ChevronDown, ChevronUp, ShieldCheck, Lock, Fingerprint, Bell, Clock, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { checkForAppUpdate } from '../utils/updater';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { triggerHaptic, getHapticLevel, setHapticLevel, getHapticIntensity, setHapticIntensity, HapticLevel } from '../utils/haptics';
import { getSecurityConfig, saveSecurityConfig, setAppLocked, authenticateDeviceLock, SecurityConfig } from '../utils/security';
import { requestNotificationPermission, checkNotificationPermission, sendInstantTestNotification, syncTimetableNotifications, syncTaskNotifications } from '../utils/notifications';
import type { AppData, AppSettings, TransitionMode } from '../types';
import BodyProfileForm from '../components/BodyProfileForm';
import InteractiveBiometricScan from '../components/interactive/InteractiveBiometricScan';
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

export default function Settings({
  theme,
  setTheme,
  transitionMode = 'efficient',
  setTransitionMode,
  data,
  updateData
}: SettingsProps) {
  const navigate = useNavigate();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Accordion open/close state for all sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    theme: false,
    notifications: true,
    transitions: false,
    haptics: false,
    security: false,
    profile: false,
    ai: false,
    account: false,
  });

  const toggleSection = (section: string) => {
    triggerHaptic('selection');
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Notification State
  const notificationsEnabled = data?.settings?.notificationsEnabled !== false;
  const leadMinutes = data?.settings?.notificationLeadMinutes || 10;
  const [testSent, setTestSent] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  const handleToggleNotifications = async () => {
    triggerHaptic('medium');
    const nextState = !notificationsEnabled;
    if (nextState) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionNotice('Notification permission not granted. Please enable LifeOS notifications in your phone Settings.');
        setTimeout(() => setPermissionNotice(null), 5000);
      }
    }
    await updateData({
      settings: {
        ...data.settings,
        notificationsEnabled: nextState,
      },
    });
  };

  const handleSelectLeadMinutes = async (mins: number) => {
    triggerHaptic('selection');
    await updateData({
      settings: {
        ...data.settings,
        notificationLeadMinutes: mins,
      },
    });
    // Reschedule with new lead time
    if (data.timetable) syncTimetableNotifications(data.timetable, mins);
    if (data.tasks) syncTaskNotifications(data.tasks, mins);
  };

  const handleSendTestNotification = async () => {
    triggerHaptic('save');
    const ok = await sendInstantTestNotification(
      'LifeOS Notification',
      `Notifications active! You will be alerted ${leadMinutes}m before timetable classes and tasks.`
    );
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      setPermissionNotice('Could not send test notification. Please grant notification permission.');
      setTimeout(() => setPermissionNotice(null), 4000);
    }
  };

  // Private Groq API Key State
  const [apiKeyInput, setApiKeyInput] = useState(data.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Haptic feedback preference state
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

  const handleTransitionChange = (mode: TransitionMode) => {
    if (setTransitionMode) {
      setTransitionMode(mode);
      triggerHaptic('light');
    }
  };

  return (
    <div className="space-y-4 pb-28">

      {/* Settings Header */}
      <div className="pt-1 px-1">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono mb-1">
          Preferences & System
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
          Settings
        </h1>
      </div>

      {/* ── 1. Notifications & Reminders (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('notifications')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
              <Bell size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                Notifications & Reminders
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                Android Notification Center · Timetable & Tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
              notificationsEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-600 dark:text-neutral-400'
            }`}>
              {notificationsEnabled ? `${leadMinutes}m Lead` : 'Off'}
            </span>
            {openSections.notifications ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.notifications && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 space-y-4">
                {permissionNotice && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 font-medium">
                    {permissionNotice}
                  </div>
                )}

                {/* Master Notification Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                  <div>
                    <p className="text-xs font-bold text-primary-light dark:text-primary-dark">
                      Enable System Notifications
                    </p>
                    <p className="text-[11px] text-secondary-light dark:text-secondary-dark mt-0.5 font-medium">
                      Receive alerts in mobile notification shade
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex items-center shrink-0 ${
                      notificationsEnabled ? 'bg-accent' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Lead Time Selector (5 / 10 / 15 / 20 min pills) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark flex items-center gap-1.5">
                      <Clock size={12} className="text-accent" /> Reminder Lead Time
                    </label>
                    <span className="text-xs font-mono font-bold text-accent">
                      {leadMinutes} minutes before
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(mins => {
                      const active = leadMinutes === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleSelectLeadMinutes(mins)}
                          className={`py-2.5 rounded-2xl font-mono text-xs font-bold transition-all text-center border ${
                            active
                              ? 'bg-accent text-white border-accent shadow-md shadow-accent/20 scale-[1.02]'
                              : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                          }`}
                        >
                          {mins} min
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notification Channels list */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                    Active Android Channels
                  </p>
                  <div className="space-y-1 text-xs text-secondary-light dark:text-secondary-dark font-medium">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Timetable: Upcoming lectures with room & teacher
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      To-Do Tasks: Deadlines & scheduled task times
                    </p>
                  </div>
                </div>

                {/* Test Notification Button */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-muted-light dark:text-muted-dark font-medium">
                    Test in Android Notification Shade
                  </span>
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-accent/15 text-accent hover:bg-accent/25 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {testSent ? (
                      <>
                        <Check size={14} strokeWidth={2.5} /> Sent to Phone!
                      </>
                    ) : (
                      'Send Test Alert'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 2. Display & Theme (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('theme')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-amber-500/10 text-amber-500 shadow-sm shrink-0">
              <Sun size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                Display & Theme
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                Light, Dark & OLED Obsidian mode
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-accent capitalize font-sans">
              {theme} Mode
            </span>
            {openSections.theme ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.theme && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5">
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-[24px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
                  {[
                    { value: 'light' as const, icon: Sun, label: 'Light' },
                    { value: 'dark' as const, icon: Moon, label: 'Dark' },
                    { value: 'system' as const, icon: Monitor, label: 'System' },
                  ].map(({ value, icon: Icon, label }) => {
                    const active = theme === value;
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          triggerHaptic('light');
                          setTheme(value);
                        }}
                        className={`relative flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-[20px] transition-all active:scale-[0.96] select-none ${
                          active
                            ? 'text-primary-dark dark:text-primary-light font-bold bg-primary-light dark:bg-primary-dark shadow-md'
                            : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark font-medium'
                        }`}
                      >
                        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className={`relative z-10 ${active ? 'text-primary-dark dark:text-primary-light' : ''}`} />
                        <span className={`relative z-10 text-xs font-bold font-sans ${active ? 'text-primary-dark dark:text-primary-light' : ''}`}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 3. Interface Transitions (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('transitions')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm shrink-0">
              <Gauge size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                Interface Transitions
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                120 / 144 FPS adaptive fluid motion engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full font-mono uppercase bg-accent/15 text-accent border border-accent/20">
              {transitionMode}
            </span>
            {openSections.transitions ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.transitions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 space-y-2.5">
                {[
                  { id: 'fast' as const, title: 'Fast', icon: Zap, badge: '< 150ms', desc: 'Snappy Response • High-speed micro-scale crossfade' },
                  { id: 'efficient' as const, title: 'Efficient (Default)', icon: Gauge, badge: '180ms', desc: 'Balanced Performance • GPU composited fluid slide' },
                  { id: 'soft' as const, title: 'Soft', icon: Moon, badge: '260ms', desc: 'Liquid Smooth • Kinetic spring easing curve' },
                ].map(mode => {
                  const active = transitionMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => handleTransitionChange(mode.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        active
                          ? 'border-accent/50 bg-accent/10 shadow-sm'
                          : 'border-black/5 dark:border-white/5 hover:border-accent/30 bg-black/[0.02] dark:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-accent text-white' : 'bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark'}`}>
                          <mode.icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary-light dark:text-primary-dark">{mode.title}</p>
                          <p className="text-[11px] text-secondary-light dark:text-secondary-dark">{mode.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark shrink-0">
                        {mode.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 4. Navigation Bar Haptics (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('haptics')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm shrink-0">
              <Smartphone size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                Navigation Bar Haptics
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                Tactile feedback on dock & interactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full font-mono bg-accent/15 text-accent">
              {hapticIntensity}%
            </span>
            {openSections.haptics ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.haptics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 space-y-4">
                <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-secondary-light dark:text-secondary-dark">
                    <span className="flex items-center gap-2 font-sans">
                      {hapticIntensity === 0 ? <VolumeX size={16} /> : <Volume2 size={16} className="text-accent" />}
                      Intensity Slider
                    </span>
                    <span className="text-accent font-black">{hapticIntensity}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={hapticIntensity}
                    onChange={e => handleHapticSliderChange(parseInt(e.target.value, 10))}
                    className="w-full accent-accent cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] font-mono font-bold text-muted-light dark:text-muted-dark">
                    <button type="button" onClick={() => handleHapticSliderChange(0)}>Off (0%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(35)}>Light (35%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(65)}>Balanced (65%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(100)}>Medium (100%)</button>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-black/5 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handleSaveHaptic}
                      className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-sm"
                    >
                      {hapticSaved ? 'Saved ✓' : 'Save Preference'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 5. App Security & Phone Lock (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('security')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center shadow-sm shrink-0 ${
              securityConfig.enabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-accent/15 text-accent'
            }`}>
              <InteractiveBiometricScan isLocked={securityConfig.enabled} size={24} onScan={handleEnableSecurity} />
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

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              securityConfig.enabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-600 dark:text-neutral-400'
            }`}>
              {securityConfig.enabled ? 'Locked' : 'Unlocked'}
            </span>
            {openSections.security ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.security && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 space-y-3">
                {securityConfig.enabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-primary-light dark:text-primary-dark">Hardware Biometrics Active</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisableSecurity}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Disable
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => { triggerHaptic('light'); setAppLocked(true); }}
                      className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Lock size={14} /> Lock LifeOS Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-center">
                    <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium">
                      Protect your private data with Android screen lock (Fingerprint, Face or PIN).
                    </p>
                    <button
                      type="button"
                      disabled={isAuthenticating}
                      onClick={handleEnableSecurity}
                      className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Fingerprint size={16} /> Enable Phone Lock
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 6. Body Profile & Targets (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('profile')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Dumbbell size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                Body Profile & Targets
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                Metabolic baseline & calorie target
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-accent">
              {data.profile?.currentCalorieTarget || 2000} kcal
            </span>
            {openSections.profile ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.profile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5">
                <BodyProfileForm
                  initialProfile={data.profile}
                  onSave={profile => updateData({ profile })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 7. AI Coach / Groq API Key (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('ai')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-sm shrink-0">
              <Key size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                AI Coach Integration
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                Private Groq API Key for smart suggestions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              data.geminiApiKey ? 'bg-emerald-500/15 text-emerald-600' : 'bg-neutral-500/15 text-muted-light'
            }`}>
              {data.geminiApiKey ? 'Active ✓' : 'Not Set'}
            </span>
            {openSections.ai ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.ai && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 space-y-3">
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2.5 pr-11 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 text-secondary-light dark:text-secondary-dark hover:text-primary-light"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-accent hover:underline font-mono"
                  >
                    Get Free Key →
                  </a>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim()}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-accent text-white shadow-sm disabled:opacity-40"
                  >
                    {apiKeySaved ? 'Saved ✓' : 'Save Key'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 8. Account & Danger Zone (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('account')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] bg-accent/10 border border-accent/25 flex items-center justify-center text-lg font-black text-accent font-sans shadow-sm shrink-0">
              {(auth.currentUser?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                Account & Reset
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                {auth.currentUser?.email || 'Signed in user'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {openSections.account ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.account && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (Capacitor.isNativePlatform()) {
                        GoogleAuth.signOut().catch(() => {});
                      }
                      navigate('/');
                      signOut(auth);
                    }}
                    className="w-full py-2.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                        if (auth.currentUser) {
                          await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                          alert('Data reset successfully! The app will now reload.');
                          window.location.reload();
                        }
                      }
                    }}
                    className="w-full py-2.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={14} className="text-amber-500" /> Reset Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 9. Software Updates & Release (Card) ── */}
      <div className="rounded-[30px] liquid-glass border border-white/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm shrink-0">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans truncate">
                  Software Updates
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                  v1.5.8
                </span>
              </div>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 truncate">
                Direct In-App APK Auto-Updater • Build 18
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setCheckingUpdate(true);
              setUpdateFeedback(null);
              triggerHaptic('selection');
              try {
                const res = await checkForAppUpdate();
                if (res.hasUpdate && res.remoteVersion) {
                  window.dispatchEvent(new CustomEvent('lifeos-open-updater'));
                } else {
                  setUpdateFeedback({
                    type: 'success',
                    message: 'LifeOS is fully up to date! Running latest v1.5.8 (Build 18).'
                  });
                  setTimeout(() => setUpdateFeedback(null), 5000);
                }
              } catch {
                setUpdateFeedback({
                  type: 'error',
                  message: 'Could not reach update server. Please check your internet connection.'
                });
                setTimeout(() => setUpdateFeedback(null), 5000);
              } finally {
                setCheckingUpdate(false);
              }
            }}
            disabled={checkingUpdate}
            className="shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold bg-accent text-white shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw size={13} className={checkingUpdate ? 'animate-spin' : ''} />
            <span>{checkingUpdate ? 'Checking...' : 'Check Update'}</span>
          </button>
        </div>

        {/* Dynamic feedback banner */}
        <AnimatePresence>
          {updateFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 14 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 overflow-hidden ${
                updateFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
              }`}
            >
              {updateFeedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-500 shrink-0" />
              )}
              <span>{updateFeedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center py-2">
        <p className="text-xs font-mono font-bold text-muted-light dark:text-muted-dark tracking-wide">
          v1.5.8
        </p>
      </div>
    </div>
  );
}

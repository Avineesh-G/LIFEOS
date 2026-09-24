import { Sun, Monitor, Check, LogOut, AlertTriangle, Dumbbell, Key, Eye, EyeOff, Smartphone, Volume2, Volume1, VolumeX, Save, Gauge, ChevronDown, ChevronUp, ShieldCheck, Lock, Fingerprint, Bell, Clock, RefreshCw, Sparkles, CheckCircle2, Download, HardDrive, Receipt, Trash2, Layers, Palette, ChevronRight } from 'lucide-react';
import { checkForAppUpdate, VERCEL_APK_URL, CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../utils/updater';
import { getReceiptsStorageSize, clearAllReceiptBlobs } from '../features/outings/storage/outingsIdb';
import { exportBackupFile, previewBackupPackage, restoreBackupPackage, BackupPreviewSummary } from '../utils/backupRestore.ts';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { triggerHaptic, getHapticLevel, setHapticLevel, getHapticIntensity, setHapticIntensity, HapticLevel } from '../utils/haptics';
import { getSecurityConfig, saveSecurityConfig, setAppLocked, authenticateDeviceLock, SecurityConfig } from '../utils/security';
import { requestNotificationPermission, checkNotificationPermission, sendInstantTestNotification, syncTimetableNotifications, syncTaskNotifications } from '../utils/notifications';
import type { AppData, AppSettings } from '../types';
import BodyProfileForm from '../components/BodyProfileForm';
import InteractiveBiometricScan from '../components/interactive/InteractiveBiometricScan';
import { FITNESS_GOALS } from '../utils/calculations';

import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useThemeMode, ThemeMode } from '../hooks/useDayPhase';
import { usePerformanceMode, PerformanceMode } from '../utils/performanceMode';
import SegmentedTogglePill from '../components/SegmentedTogglePill';
import M3ToggleChip from '../components/M3ToggleChip';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';

interface SettingsProps {
  accentColor?: string;
  setAccentColor?: (c: string) => void;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
  refresh: () => Promise<AppData>;
  resetAllData?: () => Promise<void>;
}

export default function Settings({
  data,
  updateData,
  refresh,
  resetAllData,
}: SettingsProps) {
  const navigate = useNavigate();
  const { confirmDelete, showSavedFeedback } = useM3Feedback();
  const [themeMode, setThemeMode] = useThemeMode();
  const [perfMode, setPerfMode, effectivePerfMode] = usePerformanceMode();

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupPreviewSummary | null>(null);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<string | null>(null);
  const [includeAiKeysInExport, setIncludeAiKeysInExport] = useState(false);

  const handleToggleThemeMode = () => {
    triggerHaptic('selection');
    const nextMode: ThemeMode = themeMode === 'dynamic' ? 'night' : 'dynamic';
    setThemeMode(nextMode);
    if (updateData && data?.settings) {
      updateData({
        settings: {
          ...data.settings,
          themeMode: nextMode,
        },
      }).catch(() => {});
    }
  };

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    notifications: false,
    haptics: false,
    security: false,
    profile: false,
    ai: false,
    outingsStorage: false,
    account: false,
  });

  const anyOpen = Object.values(openSections).some(Boolean);
  const handleToggleAllSections = () => {
    triggerHaptic('selection');
    const targetState = !anyOpen;
    setOpenSections({
      notifications: targetState,
      haptics: targetState,
      security: targetState,
      profile: targetState,
      ai: targetState,
      outingsStorage: targetState,
      account: targetState,
    });
  };

  const [receiptsStorageBytes, setReceiptsStorageBytes] = useState<number>(0);
  const [isClearingReceipts, setIsClearingReceipts] = useState(false);
  const [receiptsClearedNotice, setReceiptsClearedNotice] = useState(false);

  useEffect(() => {
    getReceiptsStorageSize().then(setReceiptsStorageBytes).catch(() => {});
  }, [openSections.outingsStorage]);

  const toggleSection = (section: string) => {
    triggerHaptic('selection');
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Notification State
  const notificationsEnabled = data?.settings?.notificationsEnabled !== false;
  const leadMinutes = data?.settings?.notificationLeadMinutes || 10;
  const [testSent, setTestSent] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isExportingBeforeLogout, setIsExportingBeforeLogout] = useState(false);

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
    const clamped = Math.max(0, Math.min(100, newVal));
    setHapticIntensityState(clamped);
    setHapticIntensity(clamped);
    const newLevel: HapticLevel = clamped === 0 ? 'off' : 'medium';
    setHapticLevelState(newLevel);
    setHapticLevel(newLevel);
    if (clamped > 0) {
      triggerHaptic('medium');
    }
  };

  const handleSaveHaptic = () => {
    setHapticIntensity(hapticIntensity);
    setSavedHapticIntensity(hapticIntensity);
    const newLevel: HapticLevel = hapticIntensity === 0 ? 'off' : 'medium';
    setHapticLevelState(newLevel);
    setHapticLevel(newLevel);
    setHapticSaved(true);
    if (hapticIntensity > 0) {
      triggerHaptic('save');
    }
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

  return (
    <div className="space-y-4">

      {/* Settings Hero Header Card */}
      <div className="rounded-[32px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-sm flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] text-xs font-tag font-bold tracking-wider uppercase mb-2 shadow-xs">
            <Sparkles size={12} className="text-[var(--accent-primary)]" />
            Preferences & System
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-light dark:text-primary-dark tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1 font-medium">
            System tuning, biometrics & offline synchronization
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] flex items-center justify-center text-[var(--accent-primary)] shadow-xs">
            <Gauge size={22} strokeWidth={2.2} />
          </div>
          <button
            type="button"
            onClick={handleToggleAllSections}
            className="px-2.5 py-1 rounded-full text-[10px] font-tag font-bold tracking-wider uppercase bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-secondary-light dark:text-secondary-dark border border-[var(--card-border)] flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
            title={anyOpen ? 'Enclose all sections' : 'Enlarge all sections'}
          >
            {anyOpen ? (
              <>
                <ChevronUp size={12} className="text-[var(--accent-primary)]" />
                <span>Enclose All</span>
              </>
            ) : (
              <>
                <ChevronDown size={12} className="text-[var(--accent-primary)]" />
                <span>Enlarge All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 1. Notifications & Reminders (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('notifications')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-[var(--accent-text)] shadow-sm shrink-0">
              <Bell size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark leading-snug break-words">
                Notifications & Reminders
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 line-clamp-2">
                Android Notification Center · Timetable & Tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-tag font-bold px-2.5 py-1 rounded-full border tracking-wider uppercase ${
              notificationsEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-600 dark:text-neutral-400'
            }`}>
              {notificationsEnabled ? (
                <>
                  <span className="font-stat">{leadMinutes}</span>m Lead
                </>
              ) : 'Off'}
            </span>
            {openSections.notifications ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.notifications && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05] space-y-4">
                {permissionNotice && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 font-medium">
                    {permissionNotice}
                  </div>
                )}

                {/* Master Notification Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)]">
                  <div>
                    <p className="text-xs font-bold text-[var(--md-on-surface)]">
                      Enable System Notifications
                    </p>
                    <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-0.5 font-medium">
                      Receive alerts in mobile notification shade
                    </p>
                  </div>

                  <M3ToggleChip
                    label={notificationsEnabled ? 'Active' : 'Off'}
                    checked={notificationsEnabled}
                    onChange={() => handleToggleNotifications()}
                  />
                </div>

                {/* Lead Time Selector (Segmented Spring Pills) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] flex items-center gap-1.5">
                      <Clock size={12} className="text-[var(--md-primary)]" /> Reminder Lead Time
                    </label>
                    <span className="text-xs font-bold text-[var(--md-primary)] font-stat">
                      {leadMinutes} min before
                    </span>
                  </div>

                  <SegmentedTogglePill
                    options={[
                      { value: '5', label: '5m' },
                      { value: '10', label: '10m' },
                      { value: '15', label: '15m' },
                      { value: '20', label: '20m' },
                    ]}
                    value={String(leadMinutes)}
                    onChange={(val: string) => handleSelectLeadMinutes(Number(val))}
                  />
                </div>

                {/* Notification Channels list */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-tag font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                    Active Android Channels
                  </p>
                  <div className="space-y-1 text-xs text-secondary-light dark:text-secondary-dark font-medium">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2]" />
                      Timetable: Upcoming lectures with room & teacher
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      To-Do Tasks: Deadlines & scheduled task times
                    </p>
                  </div>
                </div>

                {/* Test Notification Button */}
                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
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

      {/* ── 2. Appearance & Theme ── */}
      <div className="rounded-[30px] bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] shadow-none overflow-hidden">
        <div className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] shrink-0">
              <Sun size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-heading font-bold text-[var(--md-on-surface)] leading-snug break-words">
                Appearance & Theme
              </h3>
              <p className="text-xs text-[var(--md-on-surface-variant)] font-medium mt-0.5 line-clamp-2">
                Material 3 Expressive surface modes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <M3ToggleChip
              label={themeMode === 'dynamic' ? 'Light Mode' : 'Dark Mode'}
              checked={themeMode === 'night'}
              onChange={() => handleToggleThemeMode()}
            />
          </div>
        </div>
      </div>

      {/* ── 2a. Per-Interface Color Personalization ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            navigate('/settings/interface-colors');
          }}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-[var(--pill-active-bg)] text-[var(--accent-primary)] shadow-xs shrink-0 transition-transform group-hover:scale-105">
              <Palette size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark leading-snug break-words">
                  Interface Colors
                </h3>
                <span className="text-[10px] font-tag font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-[var(--accent-text)] border border-[var(--card-border)]">
                  Personalize
                </span>
              </div>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 line-clamp-2">
                Assign distinct tonal color families for each of the 11 app interfaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tonal preview swatches */}
            <div className="hidden sm:flex items-center -space-x-1 px-2">
              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900 bg-blue-500 shadow-xs" />
              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900 bg-emerald-500 shadow-xs" />
              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900 bg-violet-500 shadow-xs" />
              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900 bg-amber-500 shadow-xs" />
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-light dark:text-muted-dark group-hover:text-primary-light dark:group-hover:text-primary-dark group-hover:translate-x-0.5 transition-all">
              <ChevronRight size={18} />
            </div>
          </div>
        </button>
      </div>

      {/* ── 2b. Performance Mode: Auto / Full / Lite ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Gauge size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-bold text-[var(--md-on-surface)] leading-snug break-words">
                  Performance Mode
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark">
                  Active: {effectivePerfMode}
                </span>
              </div>
              <p className="text-xs text-[var(--md-on-surface-variant)] font-medium mt-0.5 line-clamp-2">
                {perfMode === 'auto' 
                  ? 'Auto-adapts to device hardware (Lite on low-end chipsets, Full on flagship)' 
                  : perfMode === 'lite' 
                    ? 'Lite: disables ambient blobs, stagger animations, and spring overshoot' 
                    : 'Full: full 120 FPS spring physics and expressive background shaders'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {(['auto', 'full', 'lite'] as PerformanceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setPerfMode(mode);
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold capitalize transition-all border ${
                perfMode === mode
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-secondary-light dark:text-secondary-dark border-black/5 dark:border-white/10 hover:bg-black/[0.06]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Navigation Bar Haptics (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('haptics')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm shrink-0">
              <Smartphone size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark leading-snug break-words">
                Navigation Bar Haptics
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 line-clamp-2">
                Tactile feedback on dock & interactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent">
              <span className="font-stat">{hapticIntensity}</span>%
            </span>
            {openSections.haptics ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.haptics && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05] space-y-4">
                <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-secondary-light dark:text-secondary-dark">
                    <span className="flex items-center gap-2">
                      {hapticIntensity === 0 ? <VolumeX size={16} /> : <Volume2 size={16} className="text-accent" />}
                      Intensity Slider
                    </span>
                    <span className="text-accent font-bold"><span className="font-stat">{hapticIntensity}</span>%</span>
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

                  <div className="flex justify-between text-[10px] font-tag font-bold text-muted-light dark:text-muted-dark uppercase tracking-wider">
                    <button type="button" onClick={() => handleHapticSliderChange(0)}>Off (0%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(25)}>Subtle (25%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(50)}>Default (50%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(75)}>High (75%)</button>
                    <button type="button" onClick={() => handleHapticSliderChange(100)}>Max (+0.9X)</button>
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
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('security')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center border shadow-sm shrink-0 ${
              securityConfig.enabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-accent/15 text-accent'
            }`}>
              <InteractiveBiometricScan isLocked={securityConfig.enabled} size={24} onScan={handleEnableSecurity} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark leading-snug break-words">
                App Security & Lock
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 line-clamp-2">
                {securityConfig.enabled ? 'Phone biometric & lock active' : 'Protect with phone screen lock'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-tag font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
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
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05] space-y-3">
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
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('profile')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Dumbbell size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark leading-snug break-words">
                Body Profile & Targets
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 line-clamp-2">
                Metabolic baseline & calorie target
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-accent">
              <span className="font-stat">{data.profile?.currentCalorieTarget || 2000}</span> kcal
            </span>
            {openSections.profile ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.profile && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05]">
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
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('ai')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-sm shrink-0">
              <Key size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark leading-snug break-words">
                AI Coach Integration (Groq)
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 line-clamp-2">
                Private Groq API Key for smart suggestions & coaching
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-tag font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              data.geminiApiKey ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-500/15 text-muted-light'
            }`}>
              {data.geminiApiKey ? 'Active ✓' : 'Not Set'}
            </span>
            {openSections.ai ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.ai && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05] space-y-3">
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

      {/* ── 8. Outings & Offline Storage (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('outingsStorage')}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] bg-[#8C500A]/15 text-[#8C500A] dark:text-[#C88A58] border border-[#8C500A]/25 flex items-center justify-center shadow-sm shrink-0">
              <Receipt size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark break-words leading-snug">
                  Outings & Storage
                </h3>
                <span className="text-[10px] font-tag font-bold px-2 py-0.5 rounded-full bg-[#8C500A]/15 text-[#78350F] dark:text-[#C88A58] border border-[#8C500A]/25 shrink-0 whitespace-nowrap">
                  Offline-First
                </span>
              </div>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 break-words line-clamp-2">
                On-device IndexedDB receipt cache & sync status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {openSections.outingsStorage ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
          </div>
        </button>

        <AnimatePresence>
          {openSections.outingsStorage && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05] space-y-4">
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border-light dark:border-border-dark flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <HardDrive size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary-light dark:text-primary-dark">
                        Local Receipts Cache
                      </p>
                      <p className="text-[11px] text-secondary-light dark:text-secondary-dark">
                        High-resolution photo attachments saved on-device
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-stat font-bold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-primary-light dark:text-primary-dark">
                    {receiptsStorageBytes === 0
                      ? '0 KB'
                      : receiptsStorageBytes < 1024 * 1024
                      ? `${(receiptsStorageBytes / 1024).toFixed(1)} KB`
                      : `${(receiptsStorageBytes / (1024 * 1024)).toFixed(2)} MB`}
                  </span>
                </div>

                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Receipt photos captured in Outing Expenses are compressed and stored locally in on-device IndexedDB (<code className="font-mono text-[11px]">outing_receipts</code>). Calculations and metadata sync to the cloud with zero file bandwidth costs.
                </p>

                {receiptsClearedNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Receipt image cache cleared successfully.</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isClearingReceipts || receiptsStorageBytes === 0}
                    onClick={() => {
                      confirmDelete({
                        title: 'Clear Receipt Cache?',
                        itemName: `${(receiptsStorageBytes / (1024 * 1024)).toFixed(1)} MB photos`,
                        message: 'Local receipt images will be removed. Outings, expenses, and split calculations remain completely safe.',
                        section: 'settings',
                        onConfirm: async () => {
                          setIsClearingReceipts(true);
                          try {
                            await clearAllReceiptBlobs();
                            const freshSize = await getReceiptsStorageSize();
                            setReceiptsStorageBytes(freshSize);
                            setReceiptsClearedNotice(true);
                            setTimeout(() => setReceiptsClearedNotice(false), 4000);
                          } finally {
                            setIsClearingReceipts(false);
                          }
                        },
                      });
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                    <span>{isClearingReceipts ? 'Clearing...' : 'Clear Receipt Cache'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      navigate('/outings');
                    }}
                    className="px-4 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 text-primary-light dark:text-primary-dark text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Receipt size={13} className="text-[#8C500A] dark:text-[#C88A58]" />
                    <span>Open Outing Expenses</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 9. Account & Danger Zone (Accordion) ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm overflow-hidden">
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
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans break-words leading-snug">
                Account & Reset
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 break-words line-clamp-2">
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
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
              className="overflow-hidden"
            >
              <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.05] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setShowLogoutModal(true);
                    }}
                    className="w-full py-2.5 min-h-[44px] rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      confirmDelete({
                        title: 'Reset ALL Data?',
                        itemName: 'Entire LifeOS Database',
                        message: 'Every note, workout, meal, expense, setting, and key will be permanently erased. This cannot be undone.',
                        section: 'settings',
                        onConfirm: async () => {
                          try {
                            // 1. Wipe Firestore, memory state, localStorage, sessionStorage, and IndexedDB
                            if (resetAllData) {
                              await resetAllData();
                            } else {
                              if (auth.currentUser) {
                                await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                              }
                              try { localStorage.clear(); } catch {}
                              try { sessionStorage.clear(); } catch {}
                              try { await clearAllReceiptBlobs(); } catch {}
                            }

                            // 2. Clear native preferences & caches
                            try {
                              localStorage.clear();
                              sessionStorage.clear();
                            } catch {}

                            // 3. Sign out cleanly
                            if (Capacitor.isNativePlatform()) {
                              GoogleAuth.signOut().catch(() => {});
                            }
                            await signOut(auth);

                            // 4. Reload cleanly to root
                            window.location.href = '/';
                          } catch (err) {
                            alert('Reset failed. Please try again.');
                          }
                        },
                      });
                    }}
                    className="w-full py-2.5 min-h-[44px] rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={14} className="text-amber-500" /> Reset Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Data Backup & Recovery (Card) ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm p-5 sm:p-6 overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
              <HardDrive size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark break-words leading-snug">
                  Data Backup &amp; Recovery
                </h3>
                <span className="text-[10px] font-tag font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0 whitespace-nowrap tracking-wider uppercase">
                  Versioned JSON
                </span>
              </div>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 break-words line-clamp-2">
                Export complete encrypted backup or restore workouts, nutrition, outings, receipts, and tasks.
              </p>
            </div>
          </div>
        </div>

        {backupFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs font-medium border flex items-center gap-2.5 ${
            backupFeedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            {backupFeedback.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
            <span className="break-words leading-relaxed">{backupFeedback.message}</span>
          </div>
        )}

        {/* Restore Confirmation Modal / Card */}
        {restorePreview && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={15} /> Confirm Data Restoration
              </span>
              <button
                type="button"
                onClick={() => { setRestorePreview(null); setPendingRestoreJson(null); }}
                className="text-secondary-light dark:text-secondary-dark hover:text-primary-light font-bold"
              >
                Cancel
              </button>
            </div>
            <p className="text-secondary-light dark:text-secondary-dark">
              Backup created on: <strong>{new Date(restorePreview.exportedAt).toLocaleString()}</strong>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-white/5">
                <span className="block font-bold text-primary-light dark:text-primary-dark">{restorePreview.counts.workouts}</span>
                <span className="text-[10px] text-secondary-light dark:text-secondary-dark">Workouts</span>
              </div>
              <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-white/5">
                <span className="block font-bold text-primary-light dark:text-primary-dark">{restorePreview.counts.nutritionLogs}</span>
                <span className="text-[10px] text-secondary-light dark:text-secondary-dark">Food Logs</span>
              </div>
              <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-white/5">
                <span className="block font-bold text-primary-light dark:text-primary-dark">{restorePreview.counts.tasks}</span>
                <span className="text-[10px] text-secondary-light dark:text-secondary-dark">Tasks</span>
              </div>
              <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-white/5">
                <span className="block font-bold text-primary-light dark:text-primary-dark">{restorePreview.counts.outings}</span>
                <span className="text-[10px] text-secondary-light dark:text-secondary-dark">Outings</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={backupLoading}
                onClick={async () => {
                  if (!pendingRestoreJson) return;
                  setBackupLoading(true);
                  try {
                    const res = await restoreBackupPackage(pendingRestoreJson, data, async (newData) => {
                      await updateData(newData);
                      if (refresh) await refresh();
                    });
                    setBackupFeedback({ type: 'success', message: res.message });
                    setRestorePreview(null);
                    setPendingRestoreJson(null);
                  } catch (e: any) {
                    setBackupFeedback({ type: 'error', message: e.message || 'Restoration failed.' });
                  } finally {
                    setBackupLoading(false);
                  }
                }}
                className="flex-1 py-2.5 min-h-[44px] rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm &amp; Restore All
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <button
            type="button"
            disabled={backupLoading}
            onClick={async () => {
              setBackupLoading(true);
              setBackupFeedback(null);
              triggerHaptic('selection');
              try {
                const res = await exportBackupFile(data, includeAiKeysInExport);
                setBackupFeedback({
                  type: 'success',
                  message: `Backup saved successfully as ${res.filename}`
                });
              } catch (e: any) {
                setBackupFeedback({
                  type: 'error',
                  message: `Export failed: ${e.message || 'Unknown error'}`
                });
              } finally {
                setBackupLoading(false);
              }
            }}
            className="flex-1 py-3 px-4 min-h-[44px] rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {backupLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            <span>Export Backup (JSON)</span>
          </button>

          <label className="flex-1 py-3 px-4 min-h-[44px] rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-primary-light dark:text-primary-dark border border-border-light dark:border-border-dark font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95">
            <HardDrive size={15} />
            <span>Restore from Backup</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  if (text) {
                    const preview = previewBackupPackage(text);
                    if (preview.valid) {
                      setPendingRestoreJson(text);
                      setRestorePreview(preview);
                      setBackupFeedback(null);
                    } else {
                      setBackupFeedback({ type: 'error', message: preview.error || 'Invalid backup file.' });
                    }
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-secondary-light dark:text-secondary-dark">
          <input
            type="checkbox"
            id="includeAiKeys"
            checked={includeAiKeysInExport}
            onChange={(e) => setIncludeAiKeysInExport(e.target.checked)}
            className="rounded border-gray-400 text-primary focus:ring-0"
          />
          <label htmlFor="includeAiKeys" className="cursor-pointer select-none">
            Include Gemini &amp; AI API keys in export (uncheck if sharing backup file)
          </label>
        </div>
      </div>

      {/* ── 9. Software Updates & Release (Card) ── */}
      <div className="rounded-[30px] liquid-glass border border-[var(--card-border)] shadow-sm p-5 sm:p-6 overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-accent/15 text-accent shadow-sm shrink-0">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-heading font-bold text-primary-light dark:text-primary-dark break-words leading-snug">
                  Software Updates
                </h3>
                <span className="text-[10px] font-tag font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0 whitespace-nowrap tracking-wider uppercase">
                  v<span className="font-stat">{CURRENT_VERSION_NAME}</span>
                </span>
              </div>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5 break-words line-clamp-2">
                Direct In-App APK Auto-Updater • Build <span className="font-stat">{CURRENT_VERSION_CODE}</span>
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
                  window.dispatchEvent(new CustomEvent('lifeos-open-updater', {
                    detail: { remoteVersion: res.remoteVersion, hasUpdate: true }
                  }));
                  setUpdateFeedback({
                    type: 'success',
                    message: `Update Available: v${res.remoteVersion.versionName} (Build ${res.remoteVersion.versionCode})! Opening in-app installer...`
                  });
                } else {
                  setUpdateFeedback({
                    type: 'success',
                    message: `LifeOS is fully up to date! Running latest v${CURRENT_VERSION_NAME} (Build ${CURRENT_VERSION_CODE}).`
                  });
                }
              } catch {
                setUpdateFeedback({
                  type: 'error',
                  message: 'Could not reach update server. Please check your internet connection.'
                });
              } finally {
                setCheckingUpdate(false);
              }
            }}
            disabled={checkingUpdate}
            className="w-full sm:w-auto mt-1 sm:mt-0 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold bg-accent text-white shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 shrink-0"
          >
            <RefreshCw size={13} className={checkingUpdate ? 'animate-spin' : ''} />
            <span>{checkingUpdate ? 'Checking...' : 'Check Update'}</span>
          </button>
        </div>

        {/* Dynamic feedback banner */}
        <AnimatePresence>
          {updateFeedback && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{ transformOrigin: 'top' }}
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
              <span className="flex-1">{updateFeedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick action buttons row */}
        <div className="pt-1 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 text-xs">
          <button
            type="button"
            onClick={async () => {
              triggerHaptic('light');
              try {
                const res = await checkForAppUpdate();
                window.dispatchEvent(new CustomEvent('lifeos-open-updater', {
                  detail: { remoteVersion: res.remoteVersion, hasUpdate: res.hasUpdate }
                }));
              } catch {
                window.dispatchEvent(new CustomEvent('lifeos-open-updater'));
              }
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-primary-light dark:text-primary-dark font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Sparkles size={13} className="text-accent shrink-0" />
            <span>Open Updater Dialog</span>
          </button>

          <a
            href={VERCEL_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            download="LifeOS.apk"
            onClick={() => triggerHaptic('selection')}
            className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Download size={13} className="shrink-0" />
            <span>Download APK (Direct)</span>
          </a>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                navigate('/dev/palette');
              }}
              className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Layers size={13} className="shrink-0" />
              <span>Open Palette Board (Dev)</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-center py-2">
        <p className="text-xs font-tag font-bold text-muted-light dark:text-muted-dark tracking-wider uppercase">
          v<span className="font-stat">{CURRENT_VERSION_NAME}</span> (Build <span className="font-stat">{CURRENT_VERSION_CODE}</span>) · Native Baseline
        </p>
      </div>

      {/* ── Pre-Logout Data Recovery Modal ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-sm rounded-3xl bg-[var(--card-surface)] border border-[var(--card-border)] p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-primary-light dark:text-primary-dark">
                  Data Safety Before Sign Out
                </h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Would you like to download a complete backup copy of your LifeOS data (JSON file) to ensure no records or notes are ever lost?
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsExportingBeforeLogout(true);
                    try {
                      await exportBackupFile(data);
                    } catch (e) {
                      alert('Backup download failed.');
                    } finally {
                      setIsExportingBeforeLogout(false);
                    }
                  }}
                  disabled={isExportingBeforeLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent text-on-accent text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Download size={14} />
                  <span>{isExportingBeforeLogout ? 'Preparing Backup...' : 'Download Backup File (JSON)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (Capacitor.isNativePlatform()) {
                      GoogleAuth.signOut().catch(() => {});
                    }
                    setShowLogoutModal(false);
                    navigate('/');
                    signOut(auth);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut size={14} /> Sign Out Anyway
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-2 px-4 rounded-xl text-secondary-light dark:text-secondary-dark text-xs font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

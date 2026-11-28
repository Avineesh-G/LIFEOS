import React, { useState, useEffect, useRef, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Fingerprint,
  Sparkle,
  HardDrive,
  DownloadSimple,
  ArrowClockwise,
  SignOut,
  Trash,
  ShieldCheck,
  Check,
  WarningCircle,
  SlidersHorizontal,
  User,
  Lightning,
  Clock,
  LunaComicBubbleIcon,
} from '../ui/tokens/icons';
import { useDeviceTier } from '../hooks/useDeviceTier';
import { LargeTitleHeader } from '../ui/navigation/LargeTitleHeader';
import { GroupedList } from '../ui/grouped/GroupedList';
import { ListRow } from '../ui/grouped/ListRow';
import { Switch } from '../ui/controls/Switch';
import { Button } from '../ui/controls/Button';
import { TextField } from '../ui/controls/TextField';
import { Sheet } from '../ui/feedback/Sheet';
import { triggerHaptic, getHapticLevel, setHapticLevel, HapticLevel } from '../utils/haptics';
import { getSecurityConfig, saveSecurityConfig, SecurityConfig } from '../utils/security';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  sendInstantTestNotification,
  sendAllAppInterfaceTestAlerts,
  syncAllNotifications,
} from '../utils/notifications';
import {
  getGroqApiKey,
  setGroqApiKey,
  getLetAiReadData,
  setLetAiReadData,
} from '../utils/aiSecurity';
import { exportBackupFile, restoreBackupPackage } from '../utils/backupRestore';
import { checkForAppUpdate, CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../utils/updater';
import { auth } from '../firebase';
import { useUserProfile } from '../utils/userProfileCache';
import type { AppData } from '../types';

interface SettingsProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
  refresh: () => Promise<AppData>;
  resetAllData?: () => Promise<void>;
  onSignOut?: () => Promise<void> | void;
}

export default function Settings({
  data,
  updateData,
  refresh: _refresh,
  resetAllData,
  onSignOut,
}: SettingsProps) {
  const navigate = useNavigate();
  const deviceTier = useDeviceTier();

  // Two-phase progressive mount so initial navigation renders profile & top cards in <6ms
  const [showLowerSections, setShowLowerSections] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) {
        startTransition(() => setShowLowerSections(true));
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // Notifications
  const [hasNotifications, setHasNotifications] = useState(true);
  const [leadMinutes] = useState(data.settings?.notificationLeadMinutes || 10);
  const [testAlertCooldown, setTestAlertCooldown] = useState(0);
  const cooldownTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    checkNotificationPermission().then(setHasNotifications);
  }, []);

  // Haptics
  const [hapticLevel, setHapticLevelState] = useState<HapticLevel>(() => getHapticLevel());

  const handleHapticChange = (level: HapticLevel) => {
    setHapticLevel(level);
    setHapticLevelState(level);
    if (level === 'light') triggerHaptic('light');
    else if (level === 'medium') triggerHaptic('medium');
    else if (level === 'heavy') triggerHaptic('heavy');
  };

  // Security
  const [secConfig, setSecConfig] = useState<SecurityConfig>(() => getSecurityConfig());

  const handleToggleBiometric = (enabled: boolean) => {
    triggerHaptic('selection');
    const updated: SecurityConfig = { ...secConfig, enabled };
    saveSecurityConfig(updated);
    setSecConfig(updated);
  };

  // AI & Groq
  const [groqKey, setGroqKeyState] = useState(() => getGroqApiKey() || '');
  const [aiReadData, setAiReadDataState] = useState(() => getLetAiReadData());
  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  const handleSaveAiKey = (key: string) => {
    setGroqApiKey(key.trim());
    setGroqKeyState(key.trim());
    triggerHaptic('light');
  };

  const handleToggleAiRead = (val: boolean) => {
    setLetAiReadData(val);
    setAiReadDataState(val);
    triggerHaptic('selection');
  };

  // Backup & Restore
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  const handleExportBackup = async () => {
    triggerHaptic('medium');
    try {
      const filename = await exportBackupFile(data, false);
      setBackupFeedback(`Backup saved: ${filename}`);
      setTimeout(() => setBackupFeedback(null), 3000);
    } catch {
      setBackupFeedback('Backup export failed.');
      setTimeout(() => setBackupFeedback(null), 3000);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await restoreBackupPackage(text, data, async (newData) => {
        await updateData(newData);
      });
      if (res.success) {
        setBackupFeedback('Backup restored successfully!');
        setTimeout(() => setBackupFeedback(null), 3000);
      }
    } catch {
      setBackupFeedback('Restore failed.');
      setTimeout(() => setBackupFeedback(null), 3000);
    }
  };

  // Updater
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    triggerHaptic('light');
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const res = await checkForAppUpdate();
      if (res.hasUpdate && res.remoteVersion) {
        setUpdateStatus(`New Version available: v${res.remoteVersion.versionName}`);
      } else {
        setUpdateStatus('LifeOS is up to date.');
      }
    } catch {
      setUpdateStatus('Could not check for updates.');
    } finally {
      setCheckingUpdate(false);
      setTimeout(() => setUpdateStatus(null), 3500);
    }
  };

  // Reset Confirmation Sheet
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const userProfile = useUserProfile();
  const currentUser = { ...auth.currentUser, photoURL: userProfile.photoURL || auth.currentUser?.photoURL, displayName: userProfile.displayName || auth.currentUser?.displayName, email: userProfile.email || auth.currentUser?.email };

  return (
    <div className="w-full flex flex-col pb-2 selection:bg-[#7B4B36]/30">
      {/* toast/toast + header icons */}
      <LargeTitleHeader
        title="Settings"
        subtitle={`LifeOS v${CURRENT_VERSION_NAME} · Build ${CURRENT_VERSION_CODE}`}
        tint="#A46D52"
      />

      {/* User Profile Card (Pure iOS Glass + Unified Warm Brown Accent) */}
      <div className="px-1 mb-3">
        <div className="w-full p-4 rounded-[26px] glass-hero flex items-center gap-3.5 shadow-sm">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User Profile'}
              className="w-12 h-12 rounded-full object-cover shadow-md"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
              style={{ background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36, #A46D52))' }}
            >
              {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <User size={22} weight="bold" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {currentUser?.displayName || 'LifeOS User'}
            </h3>
            <p className="text-xs text-white/65 truncate font-mono">
              {currentUser?.email || 'Offline Local Storage'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Hardware Performance & Adaptive Tier ── */}
      <GroupedList
        header="HARDWARE PERFORMANCE & COMPATIBILITY"
        footer={
          deviceTier.isLowPower
            ? 'Battery saver active (≤20%): smoothly stepped down rendering tier to preserve frame pacing.'
            : deviceTier.isLowStorage
            ? 'Low free storage detected: cache trimming active to prevent I/O stutter.'
            : `All tiers run zero-blur GPU compositor transitions, startTransition route isolation, and layout/paint containment.`
        }
      >
        {/* 1. Accurate Device & Hardware Profile */}
        <div className="px-4 py-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, #FFD60A 16%, #1D1D22) 0%, color-mix(in srgb, #FFD60A 7%, #17171B) 100%)',
                  color: '#FFD60A',
                }}
              >
                <Lightning size={18} weight="duotone" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-white leading-tight truncate">
                  {deviceTier.deviceModel}
                </div>
                <div className="text-[11.5px] text-white/55 leading-tight mt-0.5 truncate">
                  {deviceTier.isExactHardware ? 'Verified Device Hardware' : 'Hardware Profile'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--app-accent-text, #D29B7E)' }}
              />
              <span
                className="text-[11px] font-semibold glass-flat px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ color: 'var(--app-accent-text, #D29B7E)' }}
              >
                Auto-Selected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/50">RAM</span>
              <span className="text-[11.5px] font-bold text-white tabular-nums">{deviceTier.ramDisplay}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/50">CPU</span>
              <span className="text-[11.5px] font-bold text-white tabular-nums">{deviceTier.cores} Cores</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/50 shrink-0">GPU</span>
              <span className="text-[11.5px] font-semibold text-white truncate">{deviceTier.cleanGpu}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/50 shrink-0">Storage</span>
              <span className="text-[11.5px] font-bold text-white tabular-nums truncate">{deviceTier.storageFreeDisplay}</span>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.06] mx-4" />

        {/* 2. Read-Only System-Managed Performance Tier List */}
        <div className="px-4 py-3.5 space-y-2.5 select-none">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #D29B7E) 16%, #1D1D22) 0%, color-mix(in srgb, var(--app-accent, #7B4B36) 7%, #17171B) 100%)',
                  color: 'var(--app-accent-text, #D29B7E)',
                }}
              >
                <SlidersHorizontal size={18} weight="duotone" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-white leading-tight">
                  Performance Tier
                </div>
                <div className="text-[11.5px] text-white/55 leading-tight mt-0.5">
                  Automatically chosen from your device capability
                </div>
              </div>
            </div>

            <span
              className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wide droplet-active shrink-0"
              style={{ color: 'var(--app-accent-text, #D29B7E)' }}
            >
              System Auto
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              {
                tier: 1 as const,
                badge: 'T1',
                name: 'High Fidelity',
                target: '8GB+ RAM · 8+ Cores',
                detail: 'Dual-pass specular OLED surfaces, full Warm Brown depth & 120Hz spring physics.',
              },
              {
                tier: 2 as const,
                badge: 'T2',
                name: 'Balanced Fluidity',
                target: '6GB RAM · Mid-Range',
                detail: 'Streamlined single-pass OLED gradients & low-overhead GPU fades.',
              },
              {
                tier: 3 as const,
                badge: 'T3',
                name: 'Max Speed',
                target: '≤4GB RAM · Battery Saver',
                detail: 'Flat solid OLED cards, paused background marquees (perf-lite) & lowest frame time.',
              },
            ].map((item) => {
              const isActive = deviceTier.tier === item.tier;
              return (
                <div
                  key={item.tier}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl flex items-start justify-between gap-2.5 ${
                    isActive ? 'droplet-active' : 'bg-white/[0.03] opacity-65'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums"
                        style={{
                          backgroundColor: isActive
                            ? 'var(--app-accent-soft, rgba(164, 109, 82, 0.22))'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? 'var(--app-accent-text, #D29B7E)' : 'rgba(255, 255, 255, 0.65)',
                        }}
                      >
                        {item.badge}
                      </span>
                      <span className="text-[13px] font-bold text-white">{item.name}</span>
                      <span className="text-[10.5px] text-white/45 font-medium">{item.target}</span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-snug mt-1">
                      {item.detail}
                    </p>
                  </div>

                  {isActive && (
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                      style={{
                        backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.16))',
                        color: 'var(--app-accent-text, #D29B7E)',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </GroupedList>

      {/* ── System Preferences ── */}
      <GroupedList header="SYSTEM PREFERENCES">
        <ListRow
          icon={<SlidersHorizontal size={18} weight="duotone" />}
          title="Haptic Feedback"
          trailing={
            <div className="flex items-center gap-1">
              {(['off', 'light', 'medium', 'heavy'] as HapticLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleHapticChange(lvl)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-colors ${
                    hapticLevel === lvl
                      ? 'droplet-active'
                      : 'glass-flat text-white/55 hover:text-white'
                  }`}
                  style={hapticLevel === lvl ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
                >
                  {lvl}
                </button>
              ))}
            </div>
          }
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Notifications & Lower Settings Groups (Deferred past route transition) ── */}
      {showLowerSections && (
      <>
      <GroupedList
        header="NOTIFICATIONS"
        footer="LifeOS uses high-precision exact alarms with wakeful locks for Timetable, Tasks, Gym, and 30-min Hydration reminders. Keep device battery settings on 'Unrestricted' for 100% on-time delivery."
      >
        <ListRow
          icon={<Bell size={18} weight="duotone" />}
          iconTint="#FF9F0A"
          title="Device Alerts"
          subtitle={hasNotifications ? 'Push notifications active' : 'Permissions needed'}
          trailing={
            <Switch
              checked={hasNotifications}
              onChange={async (val) => {
                if (val) {
                  const granted = await requestNotificationPermission();
                  setHasNotifications(granted);
                  if (granted) {
                    await syncAllNotifications(data);
                  }
                }
              }}
            />
          }
        />
        <ListRow
          icon={<Clock size={18} weight="duotone" />}
          title="Alert Schedule"
          subtitle="Fixed: 20m before and 1m after event starts"
          trailing={
            <span
              className="font-semibold text-xs px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                color: 'var(--app-accent-text, #D29B7E)',
              }}
            >
              -20m / +1m
            </span>
          }
        />
        <ListRow
          icon={<Sparkle size={18} weight="duotone" />}
          iconTint="#D29B7E"
          title={testAlertCooldown > 0 ? `Send Test Alert (${testAlertCooldown}s)` : 'Send Test Alert'}
          subtitle={
            testAlertCooldown > 0
              ? `Cooldown active · wait ${testAlertCooldown}s before testing again`
              : 'Trigger test alerts for all app interfaces'
          }
          trailing={
            testAlertCooldown > 0 ? (
              <span className="font-semibold text-white/40 text-xs px-2.5 py-1 rounded-full bg-white/5 tabular-nums">
                {testAlertCooldown}s
              </span>
            ) : undefined
          }
          onClick={async () => {
            if (testAlertCooldown > 0) return;
            triggerHaptic('save');
            await sendAllAppInterfaceTestAlerts();
            setTestAlertCooldown(20);
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = setInterval(() => {
              setTestAlertCooldown((prev) => {
                if (prev <= 1) {
                  clearInterval(cooldownTimerRef.current);
                  cooldownTimerRef.current = null;
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }}
          showChevron={testAlertCooldown === 0}
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Security & App Lock ── */}
      <GroupedList
        header="SECURITY & HARDWARE LOCK"
        footer="Require biometric fingerprint or face authentication before unlocking the app."
      >
        <ListRow
          icon={<Fingerprint size={18} weight="duotone" />}
          iconTint="#30D158"
          title="Biometric App Lock"
          subtitle="Hardware unlock gate"
          trailing={
            <Switch
              checked={secConfig.enabled}
              onChange={handleToggleBiometric}
            />
          }
          showSeparator={false}
        />
      </GroupedList>

      {/* ── AI & Groq Intelligence ── */}
      <GroupedList
        header="AI & GROQ INTELLIGENCE"
        footer="Luna AI analyzes your data locally and securely using your private Groq API key."
      >
        <ListRow
          icon={<LunaComicBubbleIcon size={20} />}
          iconTint="#B968FF"
          title="Groq AI Configuration"
          subtitle={groqKey ? 'API Key Configured' : 'Using default intelligence proxy'}
          showChevron
          onClick={() => setAiSheetOpen(true)}
        />
        <ListRow
          icon={<Sparkle size={18} weight="duotone" />}
          iconTint="#38BDF8"
          title="Allow AI Data Context"
          subtitle="Let Luna analyze tasks & workouts"
          trailing={
            <Switch
              checked={aiReadData}
              onChange={handleToggleAiRead}
            />
          }
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Backup & Storage ── */}
      <GroupedList
        header="BACKUP & DATA"
        footer="Export a complete encrypted JSON backup of all your routines, tasks, and history."
      >
        <ListRow
          icon={<DownloadSimple size={18} weight="duotone" />}
          iconTint="#40C8E0"
          title="Export Backup File"
          subtitle="Save entire LifeOS data package"
          showChevron
          onClick={handleExportBackup}
        />
        <ListRow
          icon={<HardDrive size={18} weight="duotone" />}
          iconTint="#D29B7E"
          title="Restore Backup"
          subtitle="Import from backup file"
          trailing={
            <label className="px-3 py-1 rounded-full glass-flat text-white text-xs font-bold cursor-pointer active:scale-95 transition-transform">
              Choose
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          }
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Updates & Version ── */}
      <GroupedList header="UPDATES & BUILD">
        <ListRow
          icon={<ArrowClockwise size={18} weight="bold" />}
          iconTint="#FF375F"
          title="Check for Updates"
          subtitle={updateStatus || `Version ${CURRENT_VERSION_NAME} (Build ${CURRENT_VERSION_CODE})`}
          trailing={checkingUpdate ? <span className="text-xs text-white/50">Checking...</span> : undefined}
          showChevron
          onClick={handleCheckUpdate}
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Account Actions ── */}
      <GroupedList header="ACCOUNT">
        {onSignOut && (
          <ListRow
            icon={<SignOut size={18} weight="bold" />}
            iconTint="#FF453A"
            title="Sign Out"
            destructive
            onClick={() => onSignOut()}
          />
        )}
        <ListRow
          icon={<Trash size={18} weight="bold" />}
          iconTint="#FF453A"
          title="Reset All Local Data"
          subtitle="Erase local database & restore defaults"
          destructive
          onClick={() => setResetConfirmOpen(true)}
          showSeparator={false}
        />
      </GroupedList>
      </>
      )}

      {/* Toast Feedback */}
      {backupFeedback && (
        <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto p-3 rounded-2xl glass-card text-white font-semibold text-xs shadow-2xl flex items-center justify-center gap-2 z-50">
          <Check size={16} weight="bold" style={{ color: 'var(--app-accent-text, #D29B7E)' }} />
          <span>{backupFeedback}</span>
        </div>
      )}

      {/* AI Key Configuration Modal */}
      <Sheet
        isOpen={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        title={
          <div className="flex items-center justify-center gap-2">
            <LunaComicBubbleIcon size={20} />
            <span>Groq AI Settings</span>
          </div>
        }
        footer={
          <div className="flex justify-end">
            <Button
              variant="prominent"
              className="w-full font-bold"
              onClick={() => {
                triggerHaptic('medium');
                setAiSheetOpen(false);
              }}
            >
              Save Key
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-white">
          {/* Refined Luna AI Engine Header Card */}
          <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3.5 shadow-lg">
            <div
              className="w-12 h-12 rounded-2xl glass-tile shrink-0 shadow-md flex items-center justify-center"
              style={{ color: 'var(--app-accent-text, #D29B7E)' }}
            >
              <LunaComicBubbleIcon size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-tight">Luna AI Engine</h4>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                    color: 'var(--app-accent-text, #D29B7E)',
                  }}
                >
                  {groqKey ? 'Direct Key' : 'Proxy Mode'}
                </span>
              </div>
              <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                High-speed conversational inference with automated model fallback.
              </p>
            </div>
          </div>

          <p className="text-xs text-white/70 leading-relaxed">
            Enter your custom Groq API key to power Luna AI directly with high-speed Llama models, or leave empty to use the built-in LifeOS intelligence proxy.
          </p>
          <TextField
            label="Groq API Key"
            value={groqKey}
            onChange={(e) => handleSaveAiKey(e.target.value)}
            placeholder="gsk_..."
          />
        </div>
      </Sheet>

      {/* Reset Confirmation Sheet */}
      <Sheet
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset All Data?"
      >
        <div className="space-y-4 py-2 text-white text-center">
          <WarningCircle size={40} className="text-[#FF453A] mx-auto" />
          <p className="text-sm text-white/80 leading-relaxed">
            This will permanently delete all local tasks, workout logs, nutrition history, and routines.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="glass"
              onClick={() => setResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                triggerHaptic('error');
                setResetConfirmOpen(false);
                if (resetAllData) await resetAllData();
              }}
            >
              Reset Data
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
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
  CaretRight,
} from '../ui/tokens/icons';
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
  syncTimetableNotifications,
  syncTaskNotifications,
} from '../utils/notifications';
import {
  getGroqApiKey,
  setGroqApiKey,
  getLetAiReadData,
  setLetAiReadData,
  getSectionPermissions,
  setSectionPermission,
} from '../utils/aiSecurity';
import { exportBackupFile, restoreBackupPackage } from '../utils/backupRestore';
import { checkForAppUpdate, CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../utils/updater';
import { auth } from '../firebase';
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
  refresh,
  resetAllData,
  onSignOut,
}: SettingsProps) {
  const navigate = useNavigate();

  // Notifications
  const [hasNotifications, setHasNotifications] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(data.settings?.notificationLeadMinutes || 10);

  useEffect(() => {
    checkNotificationPermission().then(setHasNotifications);
  }, []);

  // Haptics
  const [hapticLevel, setHapticLevelState] = useState<HapticLevel>(() => getHapticLevel());

  const handleHapticChange = (level: HapticLevel) => {
    setHapticLevel(level);
    setHapticLevelState(level);
    triggerHaptic('medium');
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
  const [aiPerms, setAiPerms] = useState(() => getSectionPermissions());
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
    } catch (err: any) {
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

  const currentUser = auth.currentUser;

  return (
    <div className="w-full flex flex-col pb-2">
      <LargeTitleHeader
        title="Settings"
        subtitle={`LifeOS v${CURRENT_VERSION_NAME} (${CURRENT_VERSION_CODE})`}
      />

      {/* User Profile Card */}
      <div className="px-1 mb-2">
        <div className="w-full p-4 rounded-[26px] bg-[#1C1C1E] border border-white/8 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center text-white text-lg font-bold shadow-md">
            {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <User size={22} weight="bold" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {currentUser?.displayName || 'LifeOS User'}
            </h3>
            <p className="text-xs text-white/50 truncate font-mono">
              {currentUser?.email || 'Offline Local Storage'}
            </p>
          </div>
        </div>
      </div>

      {/* ── System Preferences ── */}
      <GroupedList header="SYSTEM PREFERENCES">
        <ListRow
          icon={<SlidersHorizontal size={18} weight="duotone" />}
          iconTint="#BF5AF2"
          title="Haptic Feedback"
          trailing={
            <div className="flex items-center gap-1">
              {(['off', 'light', 'medium', 'heavy'] as HapticLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleHapticChange(lvl)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase transition-all ${
                    hapticLevel === lvl
                      ? 'bg-[#BF5AF2] text-white'
                      : 'bg-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          }
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Notifications ── */}
      <GroupedList
        header="NOTIFICATIONS"
        footer="LifeOS alerts you in advance for scheduled timetable classes and priority tasks."
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
                    if (data.timetable) syncTimetableNotifications(data.timetable, leadMinutes);
                    if (data.tasks) syncTaskNotifications(data.tasks, leadMinutes);
                  }
                }
              }}
            />
          }
        />
        <ListRow
          title="Lead Time"
          subtitle="Alert before event starts"
          trailing={
            <span className="font-semibold text-white/80 text-sm">
              {leadMinutes} min
            </span>
          }
        />
        <ListRow
          title="Send Test Alert"
          subtitle="Trigger instant test notification"
          onClick={async () => {
            triggerHaptic('light');
            await sendInstantTestNotification('LifeOS Alert', 'Your notification system is working perfectly!');
          }}
          showChevron
          showSeparator={false}
        />
      </GroupedList>

      {/* ── Security & Vault ── */}
      <GroupedList
        header="SECURITY & HARDWARE LOCK"
        footer="Require biometric fingerprint or face authentication before unlocking the app and secure notes."
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
        />
        <ListRow
          icon={<ShieldCheck size={18} weight="duotone" />}
          iconTint="#8E7CFF"
          title="Secure Vault Settings"
          subtitle="AES-256-GCM encrypted notes"
          showChevron
          onClick={() => navigate('/vault')}
          showSeparator={false}
        />
      </GroupedList>

      {/* ── AI & Groq Intelligence ── */}
      <GroupedList
        header="AI & GROQ INTELLIGENCE"
        footer="Luna AI analyzes your data locally and securely using your private Groq API key."
      >
        <ListRow
          icon={<Sparkle size={18} weight="fill" />}
          iconTint="#BF5AF2"
          title="Groq AI Configuration"
          subtitle={groqKey ? 'API Key Configured' : 'Using default intelligence proxy'}
          showChevron
          onClick={() => setAiSheetOpen(true)}
        />
        <ListRow
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
          iconTint="#64D2FF"
          title="Restore Backup"
          subtitle="Import from backup file"
          trailing={
            <label className="px-3 py-1 rounded-full bg-[#0A84FF] text-white text-xs font-bold cursor-pointer active:scale-95 transition-transform">
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

      {/* Toast Feedback */}
      {backupFeedback && (
        <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto p-3 rounded-2xl bg-white text-black font-semibold text-xs shadow-2xl flex items-center justify-center gap-2 z-50 animate-bounce">
          <Check size={16} weight="bold" />
          <span>{backupFeedback}</span>
        </div>
      )}

      {/* AI Key Configuration Modal */}
      <Sheet
        isOpen={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        title="Groq AI Settings"
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
          <p className="text-xs text-white/70 leading-relaxed">
            Enter your custom Groq API key to power Luna AI with high-speed Llama 3 models.
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

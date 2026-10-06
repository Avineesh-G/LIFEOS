import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle, 
  DownloadSimple, 
  CheckCircle, 
  WarningCircle, 
  ArrowRight, 
  ShieldCheck, 
  ArrowClockwise, 
  X,
  DeviceMobile,
  CircleNotch
} from '@phosphor-icons/react';
import { 
  checkForAppUpdate, 
  startApkUpdate, 
  checkCanInstallApk, 
  openInstallSettings, 
  installVerifiedApk,
  isNativeAndroid,
  CURRENT_VERSION_NAME,
  CURRENT_VERSION_CODE,
  AppVersionInfo,
  DownloadProgressEvent,
  VERCEL_APK_URL
} from '../utils/updater';
import { sendUpdateAvailableNotification } from '../utils/notifications';
import { registerDismissible } from '../utils/backNavigation';

interface InAppUpdateModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function InAppUpdateModal({ forceOpen = false, onClose }: InAppUpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<AppVersionInfo | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'permission_needed' | 'downloading' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [bytesRead, setBytesRead] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  useEffect(() => {
    if (isOpen) {
      return registerDismissible('in-app-update-modal', () => {
        if (status !== 'downloading' && status !== 'installing') {
          setIsOpen(false);
          if (onClose) onClose();
          return true;
        }
        return false;
      });
    }
  }, [isOpen, status, onClose]);

  const autoRetryDoneRef = useRef(false);
  const isResumingRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runAutoCheck = async () => {
      try {
        const res = await checkForAppUpdate();
        if (res.hasUpdate && res.remoteVersion) {
          setRemoteVersion(res.remoteVersion);
          setStatus('idle');
          setIsOpen(true);

          sendUpdateAvailableNotification(
            res.currentVersion,
            res.remoteVersion.versionName,
            res.remoteVersion.releaseNotes
          );

          window.dispatchEvent(
            new CustomEvent('lifeos-show-notification-banner', {
              detail: {
                id: `update_${res.remoteVersion.versionCode}`,
                title: `Update Available: LifeOS v${res.remoteVersion.versionName}`,
                message: 'A newer version of LifeOS is available with new features and performance enhancements.',
                details: res.remoteVersion.releaseNotes,
                type: 'update',
                actionLabel: 'Update Now',
                onAction: () => {
                  setIsOpen(true);
                },
              },
            })
          );
        }
      } catch (err) {
        console.warn('[InAppUpdateModal] Auto check failed:', err);
      }
    };

    timer = setTimeout(runAutoCheck, 1100);

    const handleManualTrigger = async (event?: any) => {
      if (event?.detail?.remoteVersion) {
        setRemoteVersion(event.detail.remoteVersion);
        setStatus('idle');
        autoRetryDoneRef.current = false;
        setIsOpen(true);
        return;
      }
      setStatus('checking');
      setIsOpen(true);
      try {
        const res = await checkForAppUpdate();
        if (res.remoteVersion) {
          setRemoteVersion(res.remoteVersion);
        }
      } catch (e) {
        console.warn('Manual update check failed', e);
      } finally {
        setStatus('idle');
      }
    };

    window.addEventListener('lifeos-open-updater', handleManualTrigger);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('lifeos-open-updater', handleManualTrigger);
    };
  }, []);

  useEffect(() => {
    const handleResumeCheck = async () => {
      if (status !== 'permission_needed' || isResumingRef.current) return;
      isResumingRef.current = true;

      try {
        const canInstall = await checkCanInstallApk();
        if (canInstall) {
          setStatusNotice('Permission granted! Proceeding with update...');
          const installRes = await installVerifiedApk();
          if (installRes.success && !installRes.needPermission) {
            setStatus('installing');
          } else {
            executeDownload();
          }
        }
      } catch (e) {
        console.warn('Error checking install permission on resume', e);
      } finally {
        isResumingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleResumeCheck();
      }
    };

    window.addEventListener('focus', handleResumeCheck);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleResumeCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, remoteVersion]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleDismiss = () => {
    localStorage.setItem('lifeos_update_snoozed_time', Date.now().toString());
    setIsOpen(false);
    if (onClose) onClose();
  };

  const executeDownload = async () => {
    if (!remoteVersion) return;

    setErrorMessage('');
    setStatusNotice('');
    setStatus('downloading');
    setProgress(0);
    setBytesRead(0);
    setTotalBytes(remoteVersion.apkSizeBytes || 14404380);

    await startApkUpdate(
      remoteVersion,
      (ev: DownloadProgressEvent) => {
        if (ev.progress >= 0) {
          setProgress(ev.progress);
        }
        setBytesRead(ev.bytesRead);
        if (ev.totalBytes > 0) {
          setTotalBytes(ev.totalBytes);
        }

        if (ev.progress >= 100) {
          setStatus('installing');
        }
      },
      (err: string, isChecksumError?: boolean) => {
        console.error('Update error encountered:', err, 'checksum:', isChecksumError);

        if (isChecksumError && !autoRetryDoneRef.current) {
          autoRetryDoneRef.current = true;
          setStatusNotice('Download was corrupted, retrying automatically...');
          setTimeout(() => {
            executeDownload();
          }, 1500);
          return;
        }

        setErrorMessage(isChecksumError ? 'Downloaded file was corrupted (integrity check failed).' : err);
        setStatus('error');
      },
      () => {
        setStatus('permission_needed');
      }
    );
  };

  const hasUpdate = remoteVersion ? remoteVersion.versionCode > CURRENT_VERSION_CODE : false;

  const handleStartUpdate = async () => {
    if (!remoteVersion || !hasUpdate) return;

    setErrorMessage('');
    setStatusNotice('');

    if (isNativeAndroid()) {
      const canInstall = await checkCanInstallApk();
      if (!canInstall) {
        setStatus('permission_needed');
        return;
      }
    }

    await executeDownload();
  };

  const handleCheckAgain = async () => {
    setStatus('checking');
    try {
      const res = await checkForAppUpdate();
      if (res.remoteVersion) {
        setRemoteVersion(res.remoteVersion);
      }
    } catch (e) {
      console.warn('Refresh update check failed', e);
    } finally {
      setStatus('idle');
    }
  };

  const handleGrantPermission = async () => {
    await openInstallSettings();
  };

  const handleManualDownload = () => {
    const downloadUrl = remoteVersion?.apkUrl && remoteVersion.apkUrl.startsWith('http')
      ? remoteVersion.apkUrl
      : VERCEL_APK_URL;
    window.open(downloadUrl, '_system');
  };

  const formatMB = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0.0 MB';
    return (bytes / 1000000).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          onClick={status === 'downloading' || status === 'installing' ? undefined : handleDismiss}
        />

        {/* Natural Glass Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] bg-[#141416] shadow-[0_24px_64px_rgba(0,0,0,0.95)] z-10"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl glass-tile flex items-center justify-center shrink-0">
                {hasUpdate ? (
                  <Sparkle size={24} weight="fill" className="text-[#0A84FF]" />
                ) : (
                  <CheckCircle size={24} weight="fill" className="text-[#30D158]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {hasUpdate ? 'LifeOS Update' : 'LifeOS Up to Date'}
                  </h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full glass-flat ${
                    hasUpdate
                      ? 'text-[#0A84FF]'
                      : 'text-[#30D158]'
                  }`}>
                    v{hasUpdate ? (remoteVersion?.versionName || 'New') : CURRENT_VERSION_NAME}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {hasUpdate ? 'Direct In-App Auto-Updater' : 'Latest Release Installed'}
                </p>
              </div>
            </div>

            {status !== 'downloading' && status !== 'installing' && (
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white glass-flat active:scale-95 transition-all shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X size={16} weight="bold" />
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="px-6 pb-6 pt-1 space-y-4">
            {/* Version Card */}
            {hasUpdate ? (
              <div className="p-4 rounded-2xl glass-tile space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                      Current
                    </span>
                    <span className="text-sm font-semibold text-white">
                      v{CURRENT_VERSION_NAME}
                    </span>
                  </div>

                  <div className="w-7 h-7 rounded-full glass-flat flex items-center justify-center text-[#0A84FF]">
                    <ArrowRight size={14} weight="bold" />
                  </div>

                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[11px] font-medium text-[#0A84FF] uppercase tracking-wider">
                      Latest
                    </span>
                    <span className="text-sm font-bold text-[#0A84FF]">
                      v{remoteVersion?.versionName || CURRENT_VERSION_NAME}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                  <span className="flex items-center gap-1.5 font-medium">
                    <DownloadSimple size={14} className="text-[#0A84FF] shrink-0" />
                    Download Size
                  </span>
                  <span className="font-semibold text-white/80">
                    {remoteVersion?.apkSize || '14.4 MB'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl glass-tile flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[#30D158]">
                  <ShieldCheck size={20} weight="fill" className="shrink-0" />
                  <span className="text-xs font-semibold text-white/90">
                    Version {CURRENT_VERSION_NAME} (Build {CURRENT_VERSION_CODE})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full glass-flat text-[#30D158] uppercase tracking-wider">
                  Latest
                </span>
              </div>
            )}

            {/* Status Views */}
            {status === 'checking' ? (
              <div className="py-6 text-center space-y-3">
                <CircleNotch size={32} weight="bold" className="text-[#0A84FF] animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Checking for Updates...</h4>
                  <p className="text-xs text-white/50 mt-0.5">Connecting to LifeOS release server</p>
                </div>
              </div>
            ) : status === 'permission_needed' ? (
              <div className="p-4 rounded-2xl glass-tile space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl glass-flat text-[#FF9F0A] flex items-center justify-center shrink-0">
                    <DeviceMobile size={18} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#FF9F0A]">Permission Required</h4>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">
                      LifeOS needs permission to install its own updates. You'll only need to grant this once.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGrantPermission}
                  className="w-full py-3 px-4 rounded-2xl glass-tile hover:bg-white/[0.12] active:bg-white/[0.18] text-[#FF9F0A] font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <ShieldCheck size={16} weight="bold" />
                  <span>Grant Permission</span>
                </button>
              </div>
            ) : status === 'downloading' ? (
              <div className="space-y-3 py-1">
                {statusNotice && (
                  <div className="p-2.5 rounded-2xl glass-tile text-xs text-[#0A84FF] flex items-center gap-2">
                    <ArrowClockwise size={14} className="animate-spin shrink-0" />
                    <span>{statusNotice}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DownloadSimple size={16} className="text-[#0A84FF] animate-bounce" />
                    <span className="text-xs font-medium text-white/90">Downloading LifeOS.apk</span>
                  </div>
                  <span className="text-xs font-bold text-[#0A84FF] tabular-nums">
                    {progress >= 0 ? `${progress}%` : 'Connecting...'}
                  </span>
                </div>

                {/* Glass Progress Bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#0A84FF] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span>In-App Download</span>
                  <span className="tabular-nums">
                    {`${formatMB(bytesRead)} / ${formatMB(totalBytes > 0 ? totalBytes : (remoteVersion?.apkSizeBytes || 14404380))}`}
                  </span>
                </div>
              </div>
            ) : status === 'installing' ? (
              <div className="p-5 rounded-2xl glass-tile text-center space-y-2 py-5">
                <CircleNotch size={32} weight="bold" className="text-[#0A84FF] animate-spin mx-auto" />
                <h4 className="text-sm font-semibold text-[#0A84FF]">Launching Package Installer...</h4>
                <p className="text-xs text-white/50">Tap "Update" on the system prompt appearing on your screen.</p>
              </div>
            ) : status === 'error' ? (
              <div className="p-4 rounded-2xl glass-tile space-y-3">
                <div className="flex items-start gap-2.5 text-[#FF453A]">
                  <WarningCircle size={18} weight="bold" className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#FF453A]">Update Interrupted</h4>
                    <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                      {errorMessage || 'Download failed. Please check connection and try again.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartUpdate}
                  className="w-full py-2.5 rounded-2xl glass-tile hover:bg-white/[0.12] active:bg-white/[0.18] text-[#FF453A] text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowClockwise size={14} weight="bold" />
                  <span>Retry Download</span>
                </button>
              </div>
            ) : hasUpdate ? (
              <div className="space-y-3">
                <div className="text-xs text-white/70 leading-relaxed max-h-32 overflow-y-auto pr-1 space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <CheckCircle size={14} weight="fill" className="text-[#30D158]" />
                    <span>What's New in this Build:</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pl-5">
                    {remoteVersion?.releaseNotes || 'Optimized performance, updated natural glass interfaces, refined navigation, and stability improvements.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-1">
                <p className="text-xs text-white/60 leading-relaxed">
                  You are currently running the latest build of LifeOS with all features and optimizations enabled.
                </p>
              </div>
            )}

            {/* Actions */}
            {status === 'idle' && (
              <div className="flex items-center gap-2.5 pt-1">
                {hasUpdate ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-1 py-3 px-4 rounded-2xl glass-tile hover:bg-white/[0.10] text-white/70 hover:text-white text-xs font-medium transition-all text-center active:scale-98 cursor-pointer"
                    >
                      Later
                    </button>
                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="flex-[2] py-3 px-4 rounded-2xl glass-tile hover:bg-white/[0.14] text-[#0A84FF] text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <DownloadSimple size={16} weight="bold" />
                      <span>Update Now</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCheckAgain}
                      className="flex-1 py-3 px-4 rounded-2xl glass-tile hover:bg-white/[0.10] text-white/70 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <ArrowClockwise size={14} weight="bold" />
                      <span>Check Again</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-[2] py-3 px-4 rounded-2xl glass-tile hover:bg-white/[0.14] text-[#30D158] text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle size={16} weight="bold" />
                      <span>Got It</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

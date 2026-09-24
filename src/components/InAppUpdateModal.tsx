import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  X,
  Smartphone,
  ExternalLink
} from 'lucide-react';
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
  // Optional manual trigger override
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
  const [failureCount, setFailureCount] = useState(0);

  // Back button dismissible overlay registration
  useEffect(() => {
    if (isOpen) {
      return registerDismissible('in-app-update-modal', () => {
        // Only allow dismissing if not actively downloading or installing
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

  // Check on initial load (with 3-second delay to ensure smooth, instantaneous app boot)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runAutoCheck = async () => {
      // Check if user snoozed updates recently (within 24 hours)
      const lastSnoozed = localStorage.getItem('lifeos_update_snoozed_time');
      if (lastSnoozed && Date.now() - parseInt(lastSnoozed, 10) < 24 * 60 * 60 * 1000) {
        return;
      }

      const res = await checkForAppUpdate();
      if (res.hasUpdate && res.remoteVersion) {
        setRemoteVersion(res.remoteVersion);
        setIsOpen(true);
        // Fire native phone notification so user is alerted even if app is in background
        sendUpdateAvailableNotification(
          res.currentVersion,
          res.remoteVersion.versionName,
          res.remoteVersion.releaseNotes
        );
      }
    };

    timer = setTimeout(runAutoCheck, 3000);

    // Also listen for manual trigger events (e.g. from Settings)
    const handleManualTrigger = async (event?: any) => {
      if (event?.detail?.remoteVersion) {
        setRemoteVersion(event.detail.remoteVersion);
        setStatus('idle');
        setFailureCount(0);
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

  // Listen for app return/focus from Android Settings to re-check permission automatically
  useEffect(() => {
    const handleResumeCheck = async () => {
      if (status !== 'permission_needed' || isResumingRef.current) return;
      isResumingRef.current = true;

      try {
        const canInstall = await checkCanInstallApk();
        if (canInstall) {
          setStatusNotice('Permission granted! Proceeding with update...');
          // Check if APK was already downloaded and verified
          const installRes = await installVerifiedApk();
          if (installRes.success && !installRes.needPermission) {
            setStatus('installing');
          } else {
            // Need to download and install
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
    // Snooze for 24 hours
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
    setTotalBytes(0);

    await startApkUpdate(
      remoteVersion,
      (ev: DownloadProgressEvent) => {
        if (ev.progress >= 0) {
          setProgress(ev.progress);
        }
        setBytesRead(ev.bytesRead);
        setTotalBytes(ev.totalBytes);

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

        setFailureCount(prev => prev + 1);
        setErrorMessage(isChecksumError ? 'Downloaded file was corrupted (SHA-256 verification failed).' : err);
        setStatus('error');
      },
      () => {
        // Native plugin detected permission is required
        setStatus('permission_needed');
      }
    );
  };

  const hasUpdate = remoteVersion ? remoteVersion.versionCode > CURRENT_VERSION_CODE : false;

  const handleStartUpdate = async () => {
    if (!remoteVersion || !hasUpdate) return;

    setErrorMessage('');
    setStatusNotice('');

    // Pre-flight check: On Android 8+, verify if app can request package installs
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
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Deep Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75"
          onClick={status === 'downloading' || status === 'installing' ? undefined : handleDismiss}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white dark:bg-[#12141c] border border-black/10 dark:border-white/10 shadow-2xl z-10"
        >
          {/* Glowing Header Banner */}
          <div className="relative p-6 pb-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-b border-black/5 dark:border-white/5">
            <div
              className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
              style={{
                background: hasUpdate
                  ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
              }}
            />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  hasUpdate
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/25'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/25'
                }`}>
                  {hasUpdate ? (
                    <Sparkles size={22} className="animate-pulse" />
                  ) : (
                    <CheckCircle2 size={22} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                      {hasUpdate ? 'LifeOS Update' : 'LifeOS Up to Date'}
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      hasUpdate
                        ? 'bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        : 'bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      v{hasUpdate ? (remoteVersion?.versionName || 'New') : CURRENT_VERSION_NAME}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    {hasUpdate ? 'Direct In-App Auto-Updater' : 'Latest Release Installed'}
                  </p>
                </div>
              </div>

              {status !== 'downloading' && status !== 'installing' && (
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Version Transition Capsule */}
            {hasUpdate ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">Current:</span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono">v{CURRENT_VERSION_NAME}</span>
                </div>
                <ArrowRight size={14} className="text-indigo-500" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">Latest:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    v{remoteVersion?.versionName || CURRENT_VERSION_NAME}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>Version {CURRENT_VERSION_NAME} (Build {CURRENT_VERSION_CODE})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Latest
                </span>
              </div>
            )}

            {/* Status Views */}
            {status === 'checking' ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-500 mx-auto flex items-center justify-center animate-spin">
                  <RefreshCw size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Checking for Updates...
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Connecting to LifeOS release channels
                </p>
              </div>
            ) : status === 'permission_needed' ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      Permission Required
                    </h4>
                    <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-1 leading-relaxed">
                      LifeOS needs permission to install its own updates. You'll only need to grant this once.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGrantPermission}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <ShieldCheck size={16} /> Grant Permission
                  </button>
                  <p className="text-[10px] text-center text-amber-600/75 dark:text-amber-400/75 mt-2 font-medium">
                    The update will resume automatically when you return.
                  </p>
                </div>
              </div>
            ) : status === 'downloading' ? (
              <div className="space-y-3 py-2">
                {statusNotice && (
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <RefreshCw size={13} className="animate-spin" />
                    <span>{statusNotice}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Download size={14} className="text-indigo-500 animate-bounce" />
                    Downloading LifeOS.apk...
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                    {progress >= 0 ? `${progress}%` : 'Connecting...'}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="relative w-full h-3.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.max(progress, 4)}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <span>Android DownloadManager (resumable)</span>
                  <span className="font-mono">
                    {totalBytes > 0 ? `${formatMB(bytesRead)} / ${formatMB(totalBytes)}` : formatMB(bytesRead)}
                  </span>
                </div>
              </div>
            ) : status === 'installing' ? (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2.5 py-5">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-500 mx-auto flex items-center justify-center animate-spin">
                  <RefreshCw size={20} />
                </div>
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Launching Android PackageInstaller...
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tap "Update" on the system prompt appearing on your screen.
                </p>
              </div>
            ) : status === 'error' ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <div className="flex items-start gap-2.5 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">Update Interrupted</h4>
                    <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 mt-0.5 leading-relaxed">
                      {errorMessage || 'Download failed. Please check connection and try again.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleStartUpdate}
                    className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw size={14} /> Retry Download
                  </button>

                  {/* Fallback option after 2 failures */}
                  {failureCount >= 2 && (
                    <button
                      onClick={handleManualDownload}
                      className="w-full py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={13} /> Download manually instead
                    </button>
                  )}
                </div>
              </div>
            ) : hasUpdate ? (
              /* IDLE STATE (UPDATE AVAILABLE): Show Release Notes */
              <div className="space-y-3">
                <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-36 overflow-y-auto pr-1 space-y-1.5">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" /> What's New in this Build:
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal pl-5">
                    {remoteVersion?.releaseNotes || 'Optimized in-app updater with Android DownloadManager, SHA-256 integrity verification, and refined smoothness transitions.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>SHA-256 verified build • Installs cleanly inside LifeOS</span>
                </div>
              </div>
            ) : (
              /* IDLE STATE (ALREADY UP TO DATE) */
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  You are currently running the latest build of LifeOS with all navigation features and 120 FPS performance optimizations enabled.
                </p>
                <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>Channel: Stable Production</span>
                  <button
                    type="button"
                    onClick={handleManualDownload}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download size={12} /> Direct APK
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {status === 'idle' && (
              <div className="flex items-center gap-3 pt-2">
                {hasUpdate ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-1 py-3 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs font-bold transition-all text-center"
                    >
                      Later
                    </button>

                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={15} />
                      <span>Update Now</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCheckAgain}
                      className="flex-1 py-3 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={13} />
                      <span>Check Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} />
                      <span>Got It</span>
                    </button>
                  </>
                )}
              </div>
            )}
            {status === 'checking' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs font-bold transition-all text-center"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

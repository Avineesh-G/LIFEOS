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
import { M3_SCALLOP_PATH, M3ProgressIndicator } from './m3/M3Shapes';
import M3WavyProgressBar from './M3WavyProgressBar';
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

  // Check on initial load (triggers right after startup greeting completes)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runAutoCheck = async () => {
      try {
        const res = await checkForAppUpdate();
        if (res.hasUpdate && res.remoteVersion) {
          setRemoteVersion(res.remoteVersion);
          setStatus('idle');

          // Always pop up the update modal immediately after entering the app
          setIsOpen(true);

          // Fire native phone notification into Android notification bar/shade
          sendUpdateAvailableNotification(
            res.currentVersion,
            res.remoteVersion.versionName,
            res.remoteVersion.releaseNotes
          );

          // Also broadcast to the expandable In-App Material 3 Notification Bar
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
          className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
          onClick={status === 'downloading' || status === 'installing' ? undefined : handleDismiss}
        />

        {/* M3 Expressive Modal Card Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-[420px] overflow-hidden rounded-[36px] bg-white dark:bg-[#1B1D26] shadow-[0_28px_64px_-16px_rgba(0,0,0,0.35)] dark:shadow-[0_28px_64px_-16px_rgba(0,0,0,0.7)] z-10"
          style={{ fontFamily: 'var(--font-family-primary)' }}
        >
          {/* Header Banner — Seamless M3 Surface without dividing lines */}
          <div className="relative px-7 pt-7 pb-4 bg-gradient-to-b from-indigo-500/[0.08] via-purple-500/[0.03] to-transparent">
            <div
              className="absolute top-0 right-0 w-44 h-44 rounded-full pointer-events-none"
              style={{
                background: hasUpdate
                  ? 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%)',
              }}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {/* Official M3 Expressive Scallop Shape Container */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 48 48" className="w-14 h-14 drop-shadow-md">
                    <defs>
                      <linearGradient id="m3-update-scallop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        {hasUpdate ? (
                          <>
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#9333EA" />
                          </>
                        ) : (
                          <>
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#0D9488" />
                          </>
                        )}
                      </linearGradient>
                    </defs>
                    <path d={M3_SCALLOP_PATH} fill="url(#m3-update-scallop-grad)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    {hasUpdate ? (
                      <Sparkles size={22} className="animate-pulse" />
                    ) : (
                      <CheckCircle2 size={22} />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-xl text-gray-900 dark:text-[#F3F4F8] tracking-tight"
                      style={{ fontVariationSettings: "'wght' 650, 'ROND' 60" }}
                    >
                      {hasUpdate ? 'LifeOS Update' : 'LifeOS Up to Date'}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full ${
                        hasUpdate
                          ? 'bg-indigo-500/12 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-300'
                          : 'bg-emerald-500/12 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-300'
                      }`}
                      style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                    >
                      v{hasUpdate ? (remoteVersion?.versionName || 'New') : CURRENT_VERSION_NAME}
                    </span>
                  </div>
                  <p
                    className="text-xs text-gray-500 dark:text-[#9EA2B0] mt-1"
                    style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                  >
                    {hasUpdate ? 'Direct In-App Auto-Updater' : 'Latest Release Installed'}
                  </p>
                </div>
              </div>

              {status !== 'downloading' && status !== 'installing' && (
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#8D92A0] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95 transition-all shrink-0 mt-0.5"
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          {/* Body Content — Spacious M3 Tonal Surfaces without dividing lines */}
          <div className="px-7 pb-7 pt-2 space-y-5">
            {/* Version Transition Capsule */}
            {hasUpdate ? (
              <div className="flex items-center justify-between p-4 px-5 rounded-2xl bg-black/[0.035] dark:bg-white/[0.05]">
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[11px] text-gray-500 dark:text-[#8D92A0] uppercase tracking-wider"
                    style={{ fontVariationSettings: "'wght' 500, 'ROND' 40" }}
                  >
                    Current
                  </span>
                  <span
                    className="text-sm text-gray-800 dark:text-[#E2E4EB]"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    v{CURRENT_VERSION_NAME}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-400/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ArrowRight size={15} />
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
                    style={{ fontVariationSettings: "'wght' 500, 'ROND' 40" }}
                  >
                    Latest
                  </span>
                  <span
                    className="text-sm text-indigo-600 dark:text-indigo-300"
                    style={{ fontVariationSettings: "'wght' 700, 'ROND' 50" }}
                  >
                    v{remoteVersion?.versionName || CURRENT_VERSION_NAME}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 px-5 rounded-2xl bg-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                  <span
                    className="text-xs"
                    style={{ fontVariationSettings: "'wght' 550, 'ROND' 45" }}
                  >
                    Version {CURRENT_VERSION_NAME} (Build {CURRENT_VERSION_CODE})
                  </span>
                </div>
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider"
                  style={{ fontVariationSettings: "'wght' 650, 'ROND' 50" }}
                >
                  Latest
                </span>
              </div>
            )}

            {/* Status Views */}
            {status === 'checking' ? (
              <div className="py-7 text-center space-y-3.5">
                <div className="mx-auto flex items-center justify-center">
                  <M3ProgressIndicator size={36} color="#6366F1" />
                </div>
                <div>
                  <h4
                    className="text-sm text-gray-900 dark:text-white"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    Checking for Updates...
                  </h4>
                  <p
                    className="text-xs text-gray-500 dark:text-[#8D92A0] mt-1"
                    style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                  >
                    Connecting to LifeOS release channels
                  </p>
                </div>
              </div>
            ) : status === 'permission_needed' ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 space-y-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4
                      className="text-sm text-amber-900 dark:text-amber-200"
                      style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                    >
                      Permission Required
                    </h4>
                    <p
                      className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed"
                      style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                    >
                      LifeOS needs permission to install its own updates. You'll only need to grant this once.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleGrantPermission}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    <ShieldCheck size={16} />
                    <span>Grant Permission</span>
                  </button>
                  <p
                    className="text-[11px] text-center text-amber-700/80 dark:text-amber-400/80 mt-2.5"
                    style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                  >
                    The update will resume automatically when you return.
                  </p>
                </div>
              </div>
            ) : status === 'downloading' ? (
              <div className="space-y-4 py-1">
                {statusNotice && (
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-2.5">
                    <RefreshCw size={14} className="animate-spin shrink-0" />
                    <span style={{ fontVariationSettings: "'wght' 500, 'ROND' 45" }}>{statusNotice}</span>
                  </div>
                )}

                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/12 dark:bg-indigo-400/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Download size={14} className="animate-bounce" />
                    </div>
                    <span
                      className="text-xs text-gray-800 dark:text-[#E2E4EB]"
                      style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                    >
                      Downloading LifeOS.apk
                    </span>
                  </div>
                  <span
                    className="text-base text-indigo-600 dark:text-indigo-400"
                    style={{
                      fontVariationSettings: "'wght' 700, 'ROND' 50",
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {progress >= 0 ? `${progress}%` : 'Connecting...'}
                  </span>
                </div>

                {/* Official Material 3 Expressive Wavy Progress Bar */}
                <div className="py-1">
                  <M3WavyProgressBar progress={progress} activeColor="#C084FC" trackColor="#581C87" height={22} />
                </div>

                {/* Progress Details — Cleanly Spaced, Zero Text Wrapping */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#8D92A0]">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    Android DownloadManager
                  </span>
                  <span
                    className="text-gray-700 dark:text-[#D1D4DE] whitespace-nowrap shrink-0 ml-3"
                    style={{
                      fontVariationSettings: "'wght' 550, 'ROND' 45",
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {totalBytes > 0
                      ? `${formatMB(bytesRead)} / ${formatMB(totalBytes)}`
                      : formatMB(bytesRead)}
                  </span>
                </div>
              </div>
            ) : status === 'installing' ? (
              <div className="p-5 rounded-2xl bg-indigo-500/10 text-center space-y-3 py-6">
                <div className="mx-auto flex items-center justify-center">
                  <M3ProgressIndicator size={36} color="#6366F1" />
                </div>
                <div>
                  <h4
                    className="text-sm text-indigo-600 dark:text-indigo-400"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    Launching Android PackageInstaller...
                  </h4>
                  <p
                    className="text-xs text-gray-500 dark:text-[#8D92A0] mt-1"
                    style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                  >
                    Tap "Update" on the system prompt appearing on your screen.
                  </p>
                </div>
              </div>
            ) : status === 'error' ? (
              <div className="p-5 rounded-2xl bg-rose-500/10 space-y-3.5">
                <div className="flex items-start gap-3 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <h4
                      className="text-xs"
                      style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                    >
                      Update Interrupted
                    </h4>
                    <p
                      className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-1 leading-relaxed"
                      style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                    >
                      {errorMessage || 'Download failed. Please check connection and try again.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleStartUpdate}
                    className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    <RefreshCw size={14} />
                    <span>Retry Download</span>
                  </button>

                  {failureCount >= 2 && (
                    <button
                      onClick={handleManualDownload}
                      className="w-full py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs flex items-center justify-center gap-1.5 transition-all"
                      style={{ fontVariationSettings: "'wght' 550, 'ROND' 45" }}
                    >
                      <ExternalLink size={13} />
                      <span>Download manually instead</span>
                    </button>
                  )}
                </div>
              </div>
            ) : hasUpdate ? (
              /* IDLE STATE (UPDATE AVAILABLE): Show Release Notes */
              <div className="space-y-3.5">
                <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-36 overflow-y-auto pr-1 space-y-1.5">
                  <div
                    className="text-gray-900 dark:text-white flex items-center gap-1.5"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>What's New in this Build:</span>
                  </div>
                  <p
                    className="text-[11px] text-gray-500 dark:text-[#8D92A0] leading-relaxed pl-5"
                    style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                  >
                    {remoteVersion?.releaseNotes || 'Optimized in-app updater with Android DownloadManager, SHA-256 integrity verification, and refined smoothness transitions.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span style={{ fontVariationSettings: "'wght' 500, 'ROND' 45" }}>
                    SHA-256 verified build • Installs cleanly inside LifeOS
                  </span>
                </div>
              </div>
            ) : (
              /* IDLE STATE (ALREADY UP TO DATE) */
              <div className="space-y-3.5 text-center py-2">
                <p
                  className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
                  style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}
                >
                  You are currently running the latest build of LifeOS with all navigation features and 120 FPS performance optimizations enabled.
                </p>
                <div className="p-3.5 rounded-2xl bg-black/[0.035] dark:bg-white/[0.05] text-xs text-gray-500 dark:text-[#8D92A0] flex items-center justify-between">
                  <span style={{ fontVariationSettings: "'wght' 450, 'ROND' 40" }}>
                    Channel: Stable Production
                  </span>
                  <button
                    type="button"
                    onClick={handleManualDownload}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                    style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                  >
                    <Download size={13} />
                    <span>Direct APK</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons — M3 Expressive Pill Buttons without rigid borders */}
            {status === 'idle' && (
              <div className="flex items-center gap-3 pt-1">
                {hasUpdate ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs transition-all text-center active:scale-98"
                      style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                    >
                      Later
                    </button>

                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="flex-[2] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white text-xs shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-98 transition-all flex items-center justify-center gap-2"
                      style={{ fontVariationSettings: "'wght' 650, 'ROND' 50" }}
                    >
                      <Download size={16} />
                      <span>Update Now</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCheckAgain}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
                      style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
                    >
                      <RefreshCw size={13} />
                      <span>Check Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-[2] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 transition-all flex items-center justify-center gap-2"
                      style={{ fontVariationSettings: "'wght' 650, 'ROND' 50" }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Got It</span>
                    </button>
                  </>
                )}
              </div>
            )}
            {status === 'checking' && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-3 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-gray-700 dark:text-gray-300 text-xs transition-all text-center active:scale-98"
                  style={{ fontVariationSettings: "'wght' 600, 'ROND' 50" }}
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

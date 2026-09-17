import React, { useState, useEffect } from 'react';
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
  Smartphone
} from 'lucide-react';
import { 
  checkForAppUpdate, 
  startApkUpdate, 
  checkCanInstallApk, 
  openInstallSettings, 
  isNativeAndroid,
  CURRENT_VERSION_NAME,
  AppVersionInfo,
  DownloadProgressEvent
} from '../utils/updater';
import { sendUpdateAvailableNotification } from '../utils/notifications';

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
    const handleManualTrigger = async () => {
      setStatus('checking');
      setIsOpen(true);
      const res = await checkForAppUpdate();
      if (res.hasUpdate && res.remoteVersion) {
        setRemoteVersion(res.remoteVersion);
        setStatus('idle');
      } else {
        setStatus('idle');
        // If no update, let Settings show a toast or alert
        if (!res.hasUpdate) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('lifeos-open-updater', handleManualTrigger);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('lifeos-open-updater', handleManualTrigger);
    };
  }, []);

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

  const handleStartUpdate = async () => {
    if (!remoteVersion) return;

    setErrorMessage('');

    // On Android 8+, verify if app can request package installs
    if (isNativeAndroid()) {
      const canInstall = await checkCanInstallApk();
      if (!canInstall) {
        setStatus('permission_needed');
        return;
      }
    }

    setStatus('downloading');
    setProgress(0);
    setBytesRead(0);
    setTotalBytes(0);

    await startApkUpdate(
      remoteVersion.apkUrl,
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
      (err: string) => {
        setErrorMessage(err);
        setStatus('error');
      }
    );
  };

  const handleGrantPermission = async () => {
    await openInstallSettings();
    // After user returns from Settings, prompt install again
    setStatus('idle');
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
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={status === 'downloading' || status === 'installing' ? undefined : handleDismiss}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-[#12141c] border border-black/10 dark:border-white/10 shadow-2xl z-10"
        >
          {/* Glowing Header Banner */}
          <div className="relative p-6 pb-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-b border-black/5 dark:border-white/5">
            {/* Background Accent Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                      LifeOS Update
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      v{remoteVersion?.versionName || 'New'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    Direct In-App Auto-Updater
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
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">Current:</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono">v{CURRENT_VERSION_NAME}</span>
              </div>
              <ArrowRight size={14} className="text-indigo-500" />
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">Latest:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                  v{remoteVersion?.versionName || '1.5.7'}
                </span>
              </div>
            </div>

            {/* Status Views */}
            {status === 'permission_needed' ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      Permission Required
                    </h4>
                    <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-1 leading-relaxed">
                      To install updates without opening a web browser, allow LifeOS to install APKs in Android Settings.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGrantPermission}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <ShieldCheck size={14} /> Open Settings to Allow
                </button>
              </div>
            ) : status === 'downloading' ? (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <Download size={14} className="text-indigo-500 animate-bounce" />
                    Downloading LifeOS.apk...
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {progress > 0 ? `${progress}%` : 'Connecting...'}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="relative w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.max(progress, 5)}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                  >
                    {/* Shimmer light effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <span>In-app background download</span>
                  <span className="font-mono">
                    {totalBytes > 0 ? `${formatMB(bytesRead)} / ${formatMB(totalBytes)}` : formatMB(bytesRead)}
                  </span>
                </div>
              </div>
            ) : status === 'installing' ? (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2 py-5">
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
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">{errorMessage || 'Download failed. Please check connection.'}</p>
                </div>
                <button
                  onClick={handleStartUpdate}
                  className="w-full py-2 rounded-xl bg-rose-500 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} /> Retry Download
                </button>
              </div>
            ) : (
              /* IDLE STATE: Show Release Notes & Highlights */
              <div className="space-y-3">
                <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-h-36 overflow-y-auto pr-1 space-y-1.5">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" /> What's New in this Build:
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal pl-5">
                    {remoteVersion?.releaseNotes || 'Performance improvements, updated notification icons, and system enhancements.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>Zero web links needed • Installs cleanly inside LifeOS</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {status === 'idle' && (
              <div className="flex items-center gap-3 pt-2">
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
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

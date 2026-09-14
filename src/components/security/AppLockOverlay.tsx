import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import {
  getSecurityConfig,
  isAppLocked,
  subscribeToLockState,
  authenticateDeviceLock,
} from '../../utils/security';
import { triggerHaptic } from '../../utils/haptics';

export default function AppLockOverlay() {
  const [config, setConfig] = useState(getSecurityConfig());
  const [isLocked, setIsLocked] = useState(isAppLocked());
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasAutoPrompted = useRef(false);

  // Sync configuration updates
  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('lifeos-security-config-changed', handleConfigChange);
    return () => window.removeEventListener('lifeos-security-config-changed', handleConfigChange);
  }, []);

  // Sync session lock state
  useEffect(() => {
    return subscribeToLockState((locked) => {
      setIsLocked(locked);
      if (locked) {
        hasAutoPrompted.current = false;
        setErrorMessage('');
      }
    });
  }, []);

  const triggerAuth = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const res = await authenticateDeviceLock();
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  // Automatically prompt native phone lock bottom sheet when overlay appears
  useEffect(() => {
    if (config.enabled && isLocked && !hasAutoPrompted.current) {
      hasAutoPrompted.current = true;
      const t = setTimeout(() => {
        triggerAuth();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [config.enabled, isLocked, triggerAuth]);

  if (!config.enabled || !isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[#F8F9FA]/98 dark:bg-[#090A0D]/98 backdrop-blur-[64px] flex flex-col items-center justify-center p-6 sm:p-8 select-none touch-none overflow-hidden">
      {/* Ambient Theme Radial Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 max-w-sm w-full flex flex-col items-center text-center space-y-5"
      >
        {/* Pulsing Fingerprint Icon */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative w-24 h-24 rounded-[32px] bg-accent/15 text-accent border border-accent/25 flex items-center justify-center shadow-xl cursor-pointer"
          onClick={() => {
            triggerHaptic('light');
            triggerAuth();
          }}
        >
          <Fingerprint size={48} strokeWidth={2} />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface-light dark:bg-[#1A1B1F] border border-border-light dark:border-border-dark flex items-center justify-center text-primary-light dark:text-primary-dark shadow-sm">
            <Lock size={14} strokeWidth={2.4} />
          </div>
        </motion.div>

        {/* Title and Descriptions */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
            LifeOS Protected
          </h2>
          <p className="text-xs sm:text-sm text-secondary-light dark:text-secondary-dark font-medium max-w-xs mx-auto leading-relaxed">
            Touch the fingerprint sensor or unlock using your phone's screen lock
          </p>
        </div>

        {/* Error message feedback */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ShieldAlert size={15} />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Manual Unlock Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            triggerHaptic('light');
            triggerAuth();
          }}
          disabled={isAuthenticating}
          className="w-full py-3.5 px-6 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
        >
          <Fingerprint size={18} />
          <span>{isAuthenticating ? 'Waiting for phone lock...' : 'Unlock with Phone Lock'}</span>
        </motion.button>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-light dark:text-muted-dark opacity-60">
          Hardware Protected
        </p>
      </div>
    </div>
  );
}

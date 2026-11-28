import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, LockKey, WarningCircle, ShieldCheck } from '@phosphor-icons/react';
import {
  getSecurityConfig,
  isAppLocked,
  subscribeToLockState,
  authenticateDeviceLock,
} from '../../utils/security';

export default function AppLockOverlay() {
  const [config, setConfig] = useState(() => getSecurityConfig());
  const [isLocked, setIsLocked] = useState(() => isAppLocked());
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
      if (res.success) {
        setIsLocked(false);
      } else if (res.error && !res.error.toLowerCase().includes('cancel')) {
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
    <div className="fixed inset-0 z-[99999] bg-[#000000]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-8 select-none touch-none overflow-hidden font-sans">
      {/* Ambient Single-Hue Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--app-accent, #7B4B36) 0%, transparent 70%)', opacity: 0.22 }}
      />
      <div
        className="absolute bottom-12 right-12 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--app-accent-end, #A46D52) 0%, transparent 70%)', opacity: 0.16 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 max-w-sm w-full flex flex-col items-center text-center space-y-6"
      >
        {/* Pulsing Fingerprint Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative w-24 h-24 rounded-[30px] glass-tile flex items-center justify-center shadow-2xl cursor-pointer active:scale-95 transition-transform"
          style={{
            backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
            color: 'var(--app-accent-text, #D29B7E)',
          }}
          onClick={triggerAuth}
        >
          <Fingerprint size={48} weight="duotone" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1C1C1E] border-none flex items-center justify-center text-white shadow-md">
            <LockKey size={14} weight="bold" />
          </div>
        </motion.div>

        {/* Title and Descriptions */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            LifeOS Protected
          </h2>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium max-w-xs mx-auto leading-relaxed">
            Touch fingerprint sensor or authenticate with your device screen lock
          </p>
        </div>

        {/* Error message feedback */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs font-semibold flex items-center justify-center gap-2 leading-tight"
          >
            <WarningCircle size={16} weight="fill" className="shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Manual Unlock Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={triggerAuth}
          disabled={isAuthenticating}
          className="w-full py-3.5 px-6 rounded-2xl text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition-[transform,opacity,background-color,color] flex items-center justify-center gap-2.5 cursor-pointer"
          style={{
            background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36 0%, #A46D52 100%))',
          }}
        >
          <Fingerprint size={18} weight="bold" />
          <span>{isAuthenticating ? 'Authenticating...' : 'Unlock with Device'}</span>
        </motion.button>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]/60">
        <ShieldCheck size={14} weight="bold" />
        <span>Hardware Protected</span>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, ShieldAlert, KeyRound, Delete, ArrowLeft } from 'lucide-react';
import {
  getSecurityConfig,
  isAppLocked,
  subscribeToLockState,
  authenticateDeviceLock,
  verifyCustomPin,
  setAppLocked,
} from '../../utils/security';

export default function AppLockOverlay() {
  const [config, setConfig] = useState(() => getSecurityConfig());
  const [isLocked, setIsLocked] = useState(() => isAppLocked());
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState<'biometric' | 'pin'>('biometric');
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState(false);
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
        setPinDigits('');
        setPinError(false);
        setAuthMode('biometric');
      }
    });
  }, []);

  const triggerAuth = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const res = await authenticateDeviceLock();
      if (!res.success && res.error && !res.error.toLowerCase().includes('cancel')) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  // Automatically prompt native phone lock bottom sheet when overlay appears
  useEffect(() => {
    if (config.enabled && isLocked && !hasAutoPrompted.current && authMode === 'biometric') {
      hasAutoPrompted.current = true;
      const t = setTimeout(() => {
        triggerAuth();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [config.enabled, isLocked, authMode, triggerAuth]);

  // Handle PIN keypad input
  const handlePinInput = (digit: string) => {
    if (pinDigits.length >= 4) return;
    const next = pinDigits + digit;
    setPinDigits(next);
    setPinError(false);

    if (next.length === 4) {
      if (verifyCustomPin(next)) {
        setAppLocked(false);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinDigits('');
          setPinError(false);
        }, 800);
      }
    }
  };

  const handleBackspace = () => {
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError(false);
  };

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
        <AnimatePresence mode="wait">
          {authMode === 'biometric' ? (
            <motion.div
              key="biometric-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center space-y-5"
            >
              {/* Pulsing Fingerprint Icon */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="relative w-24 h-24 rounded-[32px] bg-accent/15 text-accent border border-accent/25 flex items-center justify-center shadow-xl cursor-pointer"
                onClick={triggerAuth}
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
                  className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 leading-tight"
                >
                  <ShieldAlert size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Manual Unlock Button */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={triggerAuth}
                disabled={isAuthenticating}
                className="w-full py-3.5 px-6 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <Fingerprint size={18} />
                <span>{isAuthenticating ? 'Waiting for phone lock...' : 'Unlock with Phone Lock'}</span>
              </motion.button>

              {/* PIN / Password Fallback Button (if configured) */}
              {config.customPinEnabled && (
                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:underline pt-1"
                >
                  <KeyRound size={14} />
                  <span>Enter App PIN / Pattern</span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pin-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center space-y-4"
            >
              {/* Back to Biometrics Button */}
              <button
                type="button"
                onClick={() => setAuthMode('biometric')}
                className="self-start flex items-center gap-1 text-xs font-bold text-secondary-light dark:text-secondary-dark hover:text-primary-light"
              >
                <ArrowLeft size={14} />
                <span>Use Phone Lock</span>
              </button>

              <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent border border-accent/25 flex items-center justify-center shadow-md">
                <KeyRound size={26} strokeWidth={2.2} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
                  Enter App PIN
                </h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium">
                  Enter your 4-digit security PIN to unlock
                </p>
              </div>

              {/* 4-digit Indicator Dots */}
              <div className={`flex items-center justify-center gap-3.5 py-2 ${pinError ? 'animate-shake' : ''}`}>
                {[0, 1, 2, 3].map((i) => {
                  const filled = pinDigits.length > i;
                  return (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        filled
                          ? pinError
                            ? 'bg-red-500 scale-110'
                            : 'bg-accent scale-110 shadow-sm'
                          : 'bg-black/15 dark:bg-white/20'
                      }`}
                    />
                  );
                })}
              </div>

              {pinError && (
                <p className="text-xs font-bold text-red-500 animate-fadeIn">
                  Incorrect PIN. Please try again.
                </p>
              )}

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinInput(digit)}
                    className="h-13 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95 text-lg font-black text-primary-light dark:text-primary-dark font-sans transition-all flex items-center justify-center shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  type="button"
                  onClick={() => handlePinInput('0')}
                  className="h-13 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95 text-lg font-black text-primary-light dark:text-primary-dark font-sans transition-all flex items-center justify-center shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-13 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95 text-secondary-light dark:text-secondary-dark font-sans transition-all flex items-center justify-center shadow-sm"
                >
                  <Delete size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

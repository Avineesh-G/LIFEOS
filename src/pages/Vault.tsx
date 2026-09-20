import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound, Fingerprint,
  Eye, EyeOff, Copy, Check, Plus, Search, ExternalLink, Trash2,
  Edit3, RefreshCw, X, Sparkles, Sliders, Globe, User, AlertCircle,
  GraduationCap, Share2, Briefcase, DollarSign, Heart, Folder,
  Smartphone, Shield, MoreVertical
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { authenticateDeviceLock, isDeviceLockAvailable } from '../utils/security';
import { auth } from '../firebase';
import { BottomSheet, Modal } from '../components/BottomSheet';
import {
  deriveVaultKey,
  generateRandomSalt,
  encryptPassword,
  decryptPassword,
  generateSecurePassword,
  evaluatePasswordStrength,
  GeneratorOptions
} from '../utils/cryptoVault';
import type { AppData, VaultItem, VaultCategory, VaultConfig } from '../types';

interface VaultProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

const CATEGORY_CONFIG: Record<VaultCategory, { label: string; shortLabel: string; icon: any; color: string; bg: string }> = {
  study: { label: 'Study & College', shortLabel: 'Study', icon: GraduationCap, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  social: { label: 'Social & Media', shortLabel: 'Social', icon: Share2, color: 'text-pink-500 dark:text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
  work: { label: 'Work & Projects', shortLabel: 'Work', icon: Briefcase, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  finance: { label: 'Banking & Pay', shortLabel: 'Finance', icon: DollarSign, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  personal: { label: 'Personal & Health', shortLabel: 'Personal', icon: Heart, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  other: { label: 'Other Accounts', shortLabel: 'Other', icon: Folder, color: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
};

const AUTO_LOCK_SECONDS = 90;

export default function Vault({ data, updateData }: VaultProps) {
  // ── Vault State ───────────────────────────────────────────────────────────
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(true);

  // Inactivity & Auto-lock countdown
  const [lockCountdown, setLockCountdown] = useState(AUTO_LOCK_SECONDS);
  const lastActiveRef = useRef<number>(Date.now());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory | 'all'>('all');

  // Revealed passwords map: { [itemId]: { plain: string; expiresAt: number } }
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, { plain: string; expiresAt: number }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUserItemId, setCopiedUserItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [modalForm, setModalForm] = useState({
    title: '',
    category: 'personal' as VaultCategory,
    usernameOrEmail: '',
    password: '',
    websiteUrl: '',
    notes: '',
  });
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Generator Modal state
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genOptions, setGenOptions] = useState<GeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  const vaultConfig: VaultConfig | null = data.vaultConfig || null;
  const vaultItems: VaultItem[] = data.vaultItems || [];

  // Check Biometrics Availability On Mount
  useEffect(() => {
    isDeviceLockAvailable().then((avail) => setHasBiometrics(avail));
  }, []);

  // Helper to derive user-bound vault key
  const getOrDeriveVaultKey = async (): Promise<CryptoKey> => {
    let currentSalt = vaultConfig?.salt;
    if (!currentSalt) {
      currentSalt = generateRandomSalt();
      const newConfig: VaultConfig = {
        salt: currentSalt,
        useSystemLock: true,
      };
      await updateData({ vaultConfig: newConfig });
    }

    const userSecret = auth.currentUser?.uid || 'lifeos_device_vault_user_seed';
    return await deriveVaultKey(userSecret, currentSalt);
  };

  // ── Unlock via Device Biometrics / Screen Lock ────────────────────────────
  const handleDeviceUnlock = async (auto = false) => {
    if (isAuthenticating || isUnlocked) return;
    setIsAuthenticating(true);
    setAuthError(null);
    if (!auto) {
      triggerHaptic('medium');
    }

    try {
      const result = await authenticateDeviceLock('Verify your fingerprint, face, or phone screen lock');
      if (result.success) {
        const key = await getOrDeriveVaultKey();
        setVaultKey(key);
        setIsUnlocked(true);
        triggerHaptic('success');
      } else if (result.error && !result.error.toLowerCase().includes('cancel')) {
        setAuthError(result.error);
        triggerHaptic('heavy');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed');
      triggerHaptic('heavy');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auto-prompt device lock on initial page arrival for seamless entry
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isUnlocked && !isAuthenticating) {
        handleDeviceUnlock(true);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // ── Lock & Auto-Lock Listeners ───────────────────────────────────────────
  const handleLock = () => {
    triggerHaptic('medium');
    setIsUnlocked(false);
    setVaultKey(null);
    setRevealedPasswords({});
    setAuthError(null);
  };

  useEffect(() => {
    if (!isUnlocked) return;

    const resetTimer = () => {
      lastActiveRef.current = Date.now();
      setLockCountdown(AUTO_LOCK_SECONDS);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleLock();
      }
    };

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActiveRef.current) / 1000);
      const remaining = Math.max(0, AUTO_LOCK_SECONDS - elapsed);
      setLockCountdown(remaining);
      if (remaining <= 0) {
        handleLock();
      }
    }, 1000);

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('keydown', resetTimer);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isUnlocked]);

  // Peek Countdown: Auto re-mask after 10s
  useEffect(() => {
    if (Object.keys(revealedPasswords).length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setRevealedPasswords((prev) => {
        let hasExpired = false;
        const next: Record<string, { plain: string; expiresAt: number }> = {};
        for (const [id, item] of Object.entries(prev)) {
          if (item.expiresAt > now) {
            next[id] = item;
          } else {
            hasExpired = true;
          }
        }
        return hasExpired ? next : prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [revealedPasswords]);

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // ── Password Peek / Reveal ───────────────────────────────────────────────
  const handleToggleReveal = async (item: VaultItem) => {
    if (!vaultKey) return;
    triggerHaptic('light');

    if (revealedPasswords[item.id]) {
      // Conceal immediately
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }

    try {
      const plain = await decryptPassword(item.encryptedPassword, item.iv, vaultKey);
      setRevealedPasswords((prev) => ({
        ...prev,
        [item.id]: {
          plain,
          expiresAt: Date.now() + 10000, // 10s peek
        },
      }));
    } catch {
      setToastMessage('Decryption error');
    }
  };

  // ── Copy Password to Clipboard ───────────────────────────────────────────
  const handleCopyPassword = async (item: VaultItem) => {
    if (!vaultKey) return;
    triggerHaptic('success');
    try {
      let plain = revealedPasswords[item.id]?.plain;
      if (!plain) {
        plain = await decryptPassword(item.encryptedPassword, item.iv, vaultKey);
      }
      await navigator.clipboard.writeText(plain);
      setCopiedId(item.id);
      setToastMessage('Password copied to clipboard');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setToastMessage('Failed to copy password');
    }
  };

  const handleCopyUsername = async (itemId: string, username: string) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(username);
      setCopiedUserItemId(itemId);
      setToastMessage(`Copied: ${username}`);
      setTimeout(() => setCopiedUserItemId(null), 2000);
    } catch {}
  };

  // ── Add / Edit / Delete Credential ───────────────────────────────────────
  const openAddModal = () => {
    triggerHaptic('light');
    setEditingItem(null);
    setModalForm({
      title: '',
      category: 'personal',
      usernameOrEmail: '',
      password: '',
      websiteUrl: '',
      notes: '',
    });
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = async (item: VaultItem) => {
    if (!vaultKey) return;
    triggerHaptic('light');
    setEditingItem(item);
    let plain = revealedPasswords[item.id]?.plain || '';
    if (!plain) {
      try {
        plain = await decryptPassword(item.encryptedPassword, item.iv, vaultKey);
      } catch {
        plain = '';
      }
    }
    setModalForm({
      title: item.title,
      category: item.category,
      usernameOrEmail: item.usernameOrEmail,
      password: plain,
      websiteUrl: item.websiteUrl || '',
      notes: item.notes || '',
    });
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultKey) return;
    if (!modalForm.title.trim() || !modalForm.password.trim()) {
      setToastMessage('Title and password are required');
      return;
    }

    try {
      triggerHaptic('medium');
      const encrypted = await encryptPassword(modalForm.password.trim(), vaultKey);

      let updatedList: VaultItem[];
      const now = new Date().toISOString();

      if (editingItem) {
        updatedList = vaultItems.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                title: modalForm.title.trim(),
                category: modalForm.category,
                usernameOrEmail: modalForm.usernameOrEmail.trim(),
                encryptedPassword: encrypted.cipherText,
                iv: encrypted.iv,
                websiteUrl: modalForm.websiteUrl.trim() || undefined,
                notes: modalForm.notes.trim() || undefined,
                updatedAt: now,
              }
            : item
        );
        setToastMessage('Account credentials updated');
      } else {
        const newItem: VaultItem = {
          id: `vault_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: modalForm.title.trim(),
          category: modalForm.category,
          usernameOrEmail: modalForm.usernameOrEmail.trim(),
          encryptedPassword: encrypted.cipherText,
          iv: encrypted.iv,
          websiteUrl: modalForm.websiteUrl.trim() || undefined,
          notes: modalForm.notes.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        };
        updatedList = [newItem, ...vaultItems];
        setToastMessage('Password encrypted & saved');
      }

      await updateData({ vaultItems: updatedList });
      setIsModalOpen(false);
    } catch (err: any) {
      setToastMessage('Encryption failed: ' + err.message);
    }
  };

  const handleDeleteItem = async (item: VaultItem) => {
    if (!confirm(`Delete "${item.title}" from your vault?`)) return;
    triggerHaptic('heavy');
    const updated = vaultItems.filter((i) => i.id !== item.id);
    await updateData({ vaultItems: updated });
    setToastMessage(`Deleted ${item.title}`);
  };

  // ── Password Generator ───────────────────────────────────────────────────
  const handleOpenGenerator = () => {
    triggerHaptic('light');
    const pass = generateSecurePassword(genOptions);
    setGeneratedPassword(pass);
    setIsGenModalOpen(true);
  };

  const handleRegeneratePassword = () => {
    triggerHaptic('light');
    const pass = generateSecurePassword(genOptions);
    setGeneratedPassword(pass);
  };

  const handleUseGeneratedPassword = () => {
    triggerHaptic('medium');
    setModalForm((prev) => ({ ...prev, password: generatedPassword }));
    setIsGenModalOpen(false);
    setToastMessage('Generated password applied');
  };

  // Filtered vault items
  const filteredItems = useMemo(() => {
    return vaultItems.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.usernameOrEmail.toLowerCase().includes(q) ||
        (item.websiteUrl && item.websiteUrl.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [vaultItems, selectedCategory, searchQuery]);

  const modalPasswordStrength = useMemo(
    () => evaluatePasswordStrength(modalForm.password),
    [modalForm.password]
  );

  const genPasswordStrength = useMemo(
    () => evaluatePasswordStrength(generatedPassword),
    [generatedPassword]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER: LOCKED STATE (PHONE SYSTEM LOCK & BIOMETRICS)
  // ───────────────────────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[76vh] px-3 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-[32px] p-6 sm:p-8 liquid-glass border border-[var(--card-border)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center overflow-hidden"
        >
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute -top-16 -left-16 w-44 h-44 bg-[var(--md-primary)]/15 dark:bg-[var(--md-primary)]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[var(--md-secondary)]/15 dark:bg-[var(--md-secondary)]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Biometric Holographic Scanner Icon */}
          <div className="relative mb-5 mt-2">
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 0 0 rgba(32, 52, 160, 0.25)',
                  '0 0 0 18px rgba(32, 52, 160, 0)',
                  '0 0 0 0 rgba(32, 52, 160, 0.25)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[var(--md-primary)]/20 via-[var(--md-secondary)]/20 to-[var(--md-primary)]/10 border border-[var(--md-primary)]/40 dark:border-[var(--md-secondary)]/40 flex items-center justify-center relative overflow-hidden"
            >
              {/* Vertical Laser Scan Line */}
              <motion.div
                animate={{ y: [-54, 54, -54] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--md-secondary)] to-transparent shadow-[0_0_14px_var(--md-secondary)]"
              />
              <Fingerprint size={50} strokeWidth={1.7} className="text-[var(--md-primary)] dark:text-[var(--md-secondary)] relative z-10" />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 bg-[var(--md-primary)] text-[var(--md-on-primary)] rounded-full p-1.5 shadow-md">
              <Lock size={14} strokeWidth={2.6} />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-primary-light dark:text-primary-dark mb-1">
            LifeOS Secure Vault
          </h2>
          <p className="text-xs sm:text-sm text-secondary-light dark:text-secondary-dark mb-6 max-w-xs leading-relaxed">
            Protected by your phone’s screen lock & biometrics. No master passwords to remember or forget.
          </p>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-left"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          {/* Primary Action Button: Verify System Lock / Fingerprint */}
          <button
            onClick={() => handleDeviceUnlock(false)}
            disabled={isAuthenticating}
            className="w-full relative group overflow-hidden flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[var(--md-primary)] hover:opacity-95 text-[var(--md-on-primary)] font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 active:scale-98 shadow-lg shadow-[var(--md-primary)]/25 mb-4"
          >
            {isAuthenticating ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Fingerprint size={19} strokeWidth={2.2} />
            )}
            <span>
              {isAuthenticating ? 'Verifying Phone Lock...' : 'Unlock with Phone Lock / Biometrics'}
            </span>
          </button>

          <div className="w-full pt-4 border-t border-white/[0.05] flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 text-[11px] text-secondary-light dark:text-secondary-dark/80">
              <Smartphone size={13} className="text-[var(--md-primary)] dark:text-[var(--md-secondary)]" />
              <span>Bound to your device's hardware screen lock</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-secondary-light dark:text-secondary-dark/80">
              <ShieldCheck size={13} className="text-[var(--md-primary)] dark:text-[var(--md-secondary)]" />
              <span>AES-256-GCM Zero Knowledge Encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER: UNLOCKED VAULT DASHBOARD (MOBILE-FIRST RE-ARRANGEMENT)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3.5 max-w-xl mx-auto">
      {/* ── Compact Mobile Header Bar ── */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-[24px] liquid-glass border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-primary)]/15 border border-[var(--md-primary)]/30 flex items-center justify-center text-[var(--md-primary)] dark:text-[var(--md-secondary)] shrink-0">
            <ShieldCheck size={19} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-heading font-bold tracking-tight text-primary-light dark:text-primary-dark">
                Vault
              </h1>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-tag font-bold tracking-wider uppercase bg-[var(--md-primary)]/15 text-[var(--md-primary)] dark:text-[var(--md-secondary)] border border-[var(--md-primary)]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)] dark:bg-[var(--md-secondary)] animate-pulse" />
                {vaultItems.length}
              </span>
            </div>
            <p className="text-[10px] text-secondary-light dark:text-secondary-dark">
              Auto-locks in <span className="font-semibold text-[var(--md-primary)] dark:text-[var(--md-secondary)]">{lockCountdown}s</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--md-primary)] hover:opacity-95 text-[var(--md-on-primary)] font-bold text-xs shadow-sm shadow-[var(--md-primary)]/20 active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add</span>
          </button>

          <button
            onClick={handleLock}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold active:scale-95 transition-all"
            title="Lock Vault"
          >
            <Lock size={14} />
          </button>
        </div>
      </div>

      {/* ── Search Bar with Integrated Generator Launcher ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-light dark:text-secondary-dark" />
          <input
            type="text"
            placeholder="Search accounts, usernames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] text-xs sm:text-sm text-primary-light dark:text-primary-dark placeholder-secondary-light dark:placeholder-secondary-dark focus:outline-none focus:border-[var(--md-primary)] transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-light hover:text-primary-light dark:hover:text-primary-dark p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Generator Quick Tool Button */}
        <button
          onClick={handleOpenGenerator}
          className="h-10 px-3 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] text-[var(--md-primary)] dark:text-[var(--md-secondary)] flex items-center gap-1.5 text-xs font-bold hover:bg-[var(--md-primary)]/10 active:scale-95 transition-all shadow-xs shrink-0"
          title="Password Generator Tool"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">Generator</span>
        </button>
      </div>

      {/* ── Category Chips with Fluid Spring Capsule ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 py-1 touch-pan-x">
        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedCategory('all');
          }}
          className={`relative px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all select-none shrink-0 focus:outline-none ${
            selectedCategory !== 'all' ? 'text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark' : ''
          }`}
        >
          {selectedCategory === 'all' && (
            <motion.div
              layoutId="activeVaultCategoryCapsule"
              className="absolute inset-0 rounded-xl bg-[var(--md-primary)] shadow-md shadow-[var(--md-primary)]/20"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className={`relative z-10 ${selectedCategory === 'all' ? 'text-[var(--md-on-primary)]' : ''}`}>
            All ({vaultItems.length})
          </span>
        </button>
        {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          const count = vaultItems.filter((i) => i.category === cat).length;
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory(cat);
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all select-none shrink-0 focus:outline-none ${
                !active ? 'text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark' : ''
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeVaultCategoryCapsule"
                  className="absolute inset-0 rounded-xl bg-[var(--md-primary)] shadow-md shadow-[var(--md-primary)]/20"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Icon size={12} className={`relative z-10 transition-colors ${active ? 'text-[var(--md-on-primary)]' : config.color}`} />
              <span className={`relative z-10 transition-colors ${active ? 'text-[var(--md-on-primary)]' : ''}`}>{config.shortLabel}</span>
              {count > 0 && <span className={`relative z-10 text-[10px] opacity-80 ${active ? 'text-[var(--md-on-primary)]' : ''}`}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* ── Toast Notification Banner ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black/90 dark:bg-white/95 text-white dark:text-black text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20 dark:border-black/20"
          >
            <Sparkles size={13} className="text-[var(--md-secondary)]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Credentials List (Mobile-Optimized Cards) ── */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/40 dark:bg-[#161820]/40 border border-dashed border-black/10 dark:border-white/10 text-center my-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-primary)]/10 flex items-center justify-center text-[var(--md-primary)] dark:text-[var(--md-secondary)] mb-2.5">
            <KeyRound size={22} strokeWidth={1.8} />
          </div>
          <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark mb-1">
            {searchQuery ? 'No matching passwords' : 'Your vault is empty'}
          </h3>
          <p className="text-xs text-secondary-light dark:text-secondary-dark max-w-xs mb-3.5 leading-relaxed">
            {searchQuery
              ? 'Try another search keyword or switch category.'
              : 'Keep all your college portals, social accounts, and apps securely encrypted.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Add Your First Password</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredItems.map((item) => {
            const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
            const CategoryIcon = categoryConfig.icon;
            const isRevealed = Boolean(revealedPasswords[item.id]);
            const revealedPlain = revealedPasswords[item.id]?.plain || '';
            const peekSecondsLeft = isRevealed
              ? Math.max(0, Math.ceil((revealedPasswords[item.id].expiresAt - Date.now()) / 1000))
              : 0;
            const isPasswordCopied = copiedId === item.id;
            const isUserCopied = copiedUserItemId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="group relative rounded-[22px] p-3 sm:p-3.5 liquid-glass border border-[var(--card-border)] hover:border-[var(--md-primary)]/40 transition-all shadow-xs flex flex-col gap-2.5"
              >
                {/* 1. Header: Squircle Icon + Title + Category + Edit/Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${categoryConfig.bg} shrink-0`}>
                      <CategoryIcon size={16} className={categoryConfig.color} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-primary-light dark:text-primary-dark tracking-tight truncate leading-tight">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-secondary-light dark:text-secondary-dark mt-0.5">
                        <span className="font-semibold">{categoryConfig.shortLabel}</span>
                        {item.websiteUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={item.websiteUrl.startsWith('http') ? item.websiteUrl : `https://${item.websiteUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline flex items-center gap-0.5 truncate max-w-[130px]"
                            >
                              <span>{item.websiteUrl.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink size={9} />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-light dark:text-secondary-dark hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* 2. Username / Email Row (Tap to Copy) */}
                {item.usernameOrEmail && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-2 truncate text-secondary-light dark:text-secondary-dark min-w-0">
                      <User size={12} className="shrink-0 opacity-60" />
                      <span className="font-medium text-[11px] truncate select-all">{item.usernameOrEmail}</span>
                    </div>
                    <button
                      onClick={() => handleCopyUsername(item.id, item.usernameOrEmail)}
                      className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all active:scale-95 ${
                        isUserCopied ? 'text-[var(--md-primary)] dark:text-[var(--md-secondary)] bg-[var(--md-primary)]/10' : 'text-secondary-light hover:text-primary-light dark:hover:text-primary-dark'
                      }`}
                      title="Copy Username"
                    >
                      {isUserCopied ? <Check size={11} /> : <Copy size={11} />}
                      <span className="hidden xs:inline">{isUserCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* 3. Password Action Row (Mobile-Optimized Compact Dock) */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/[0.03] dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 px-1 min-w-0 truncate font-mono">
                    <KeyRound size={13} className="text-[var(--md-primary)] dark:text-[var(--md-secondary)] shrink-0" />
                    {isRevealed ? (
                      <span className="text-xs font-bold text-[var(--md-primary)] dark:text-[var(--md-secondary)] tracking-wider truncate select-all">
                        {revealedPlain}
                      </span>
                    ) : (
                      <span className="text-xs tracking-widest text-secondary-light dark:text-secondary-dark/60 select-none">
                        ••••••••••••
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Peek Timer Countdown */}
                    {isRevealed && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[var(--md-primary)]/20 text-[var(--md-primary)] dark:text-[var(--md-secondary)] border border-[var(--md-primary)]/30 animate-pulse">
                        {peekSecondsLeft}s
                      </span>
                    )}

                    {/* Peek Button */}
                    <button
                      onClick={() => handleToggleReveal(item)}
                      className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center active:scale-95 ${
                        isRevealed
                          ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] border-[var(--md-primary)] shadow-sm'
                          : 'bg-surface-light dark:bg-[#20232E] border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                      }`}
                      title={isRevealed ? 'Hide' : 'Peek for 10s'}
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>

                    {/* Copy Password Button */}
                    <button
                      onClick={() => handleCopyPassword(item)}
                      className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center active:scale-95 ${
                        isPasswordCopied
                          ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] border-[var(--md-primary)] shadow-sm'
                          : 'bg-surface-light dark:bg-[#20232E] border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                      }`}
                      title="Copy Password"
                    >
                      {isPasswordCopied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* 4. Optional Private Note */}
                {item.notes && (
                  <div className="px-2 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-[10px] text-secondary-light dark:text-secondary-dark italic leading-relaxed">
                    Note: {item.notes}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ADD / EDIT CREDENTIAL MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm:max-w-md"
      >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--md-primary)]/15 border border-[var(--md-primary)]/30 flex items-center justify-center text-[var(--md-primary)] dark:text-[var(--md-secondary)]">
                    <KeyRound size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-primary-light dark:text-primary-dark">
                      {editingItem ? 'Edit Credential' : 'New Password'}
                    </h3>
                    <p className="text-[10px] text-secondary-light dark:text-secondary-dark">
                      Encrypted with AES-256 before saving
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-secondary-light hover:text-primary-light dark:hover:text-primary-dark"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCredential} className="flex flex-col gap-3">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-1">
                    Service / Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIT Student Portal, GitHub, Netflix"
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-light dark:bg-[#1F212A] border border-border-light dark:border-border-dark text-xs sm:text-sm text-primary-light dark:text-primary-dark focus:outline-none focus:border-[var(--md-primary)]"
                  />
                </div>

                {/* Category Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map((cat) => {
                      const c = CATEGORY_CONFIG[cat];
                      const active = modalForm.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setModalForm({ ...modalForm, category: cat });
                          }}
                          className={`flex items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition-all ${
                            active
                              ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] border-[var(--md-primary)] shadow-sm'
                              : 'bg-surface-light dark:bg-[#1F212A] text-secondary-light dark:text-secondary-dark border-border-light dark:border-border-dark'
                          }`}
                        >
                          <c.icon size={12} className={active ? 'text-[var(--md-on-primary)]' : c.color} />
                          <span className="truncate">{c.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Username / Email */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-1">
                    Username / Email / Reg No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21BCE1024 / user@email.com"
                    value={modalForm.usernameOrEmail}
                    onChange={(e) => setModalForm({ ...modalForm, usernameOrEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-light dark:bg-[#1F212A] border border-border-light dark:border-border-dark text-xs sm:text-sm text-primary-light dark:text-primary-dark focus:outline-none focus:border-[var(--md-primary)]"
                  />
                </div>

                {/* Password with Generator Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenGenerator}
                      className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-primary)] dark:text-[var(--md-secondary)] hover:opacity-80"
                    >
                      <Sparkles size={11} />
                      <span>Generate Strong</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={modalForm.password}
                      onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surface-light dark:bg-[#1F212A] border border-border-light dark:border-border-dark text-xs sm:text-sm font-mono text-primary-light dark:text-primary-dark focus:outline-none focus:border-[var(--md-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-light hover:text-primary-light dark:hover:text-primary-dark p-1"
                    >
                      {showModalPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {modalForm.password && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${modalPasswordStrength.percentage}%` }}
                          className={`h-full ${modalPasswordStrength.color.split(' ')[1]}`}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${modalPasswordStrength.color.split(' ')[0]}`}>
                        {modalPasswordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Website URL (optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-1">
                    Website URL (Optional)
                  </label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-light" />
                    <input
                      type="text"
                      placeholder="e.g. vtop.vit.ac.in"
                      value={modalForm.websiteUrl}
                      onChange={(e) => setModalForm({ ...modalForm, websiteUrl: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-surface-light dark:bg-[#1F212A] border border-border-light dark:border-border-dark text-xs sm:text-sm text-primary-light dark:text-primary-dark focus:outline-none focus:border-[var(--md-primary)]"
                    />
                  </div>
                </div>

                {/* Notes (optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-1">
                    Private Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Security questions, recovery codes, or hints..."
                    value={modalForm.notes}
                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-light dark:bg-[#1F212A] border border-border-light dark:border-border-dark text-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-[var(--md-primary)] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-border-light dark:border-border-dark text-xs font-bold text-secondary-light hover:text-primary-light dark:hover:text-primary-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[var(--md-primary)] hover:opacity-95 text-[var(--md-on-primary)] text-xs font-bold shadow-md shadow-[var(--md-primary)]/25 active:scale-95 transition-all"
                  >
                    {editingItem ? 'Update' : 'Save Encrypted'}
                  </button>
                </div>
              </form>
      </BottomSheet>

      {/* ───────────────────────────────────────────────────────────────────────
          PASSWORD GENERATOR MODAL TOOL
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        maxWidth="max-w-sm"
      >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--md-primary)]/15 text-[var(--md-primary)] dark:text-[var(--md-secondary)] flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-primary-light dark:text-primary-dark">
                      Password Generator
                    </h3>
                    <p className="text-[10px] text-secondary-light dark:text-secondary-dark">
                      High-entropy cryptographic random
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGenModalOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-secondary-light hover:text-primary-light dark:hover:text-primary-dark"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Password Display Box */}
              <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-black/40 border border-black/10 dark:border-white/10 mb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-primary-light dark:text-primary-dark break-all select-all">
                    {generatedPassword}
                  </span>
                  <button
                    onClick={handleRegeneratePassword}
                    className="p-1.5 rounded-lg text-secondary-light hover:text-[var(--md-primary)] dark:hover:text-[var(--md-secondary)] active:scale-95"
                    title="Regenerate"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full ${genPasswordStrength.color.split(' ')[1]}`}
                      style={{ width: `${genPasswordStrength.percentage}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${genPasswordStrength.color.split(' ')[0]}`}>
                    {genPasswordStrength.label}
                  </span>
                </div>
              </div>

              {/* Length Slider */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-secondary-light dark:text-secondary-dark mb-1">
                  <span>Length</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark">{genOptions.length} chars</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={genOptions.length}
                  onChange={(e) => {
                    const l = Number(e.target.value);
                    const updated = { ...genOptions, length: l };
                    setGenOptions(updated);
                    setGeneratedPassword(generateSecurePassword(updated));
                  }}
                  className="w-full accent-[var(--md-primary)] cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg"
                />
              </div>

              {/* Character Toggles */}
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {[
                  { key: 'includeUppercase', label: 'A-Z Uppercase' },
                  { key: 'includeLowercase', label: 'a-z Lowercase' },
                  { key: 'includeNumbers', label: '0-9 Numbers' },
                  { key: 'includeSymbols', label: '!@#$ Symbols' },
                ].map(({ key, label }) => {
                  const active = genOptions[key as keyof GeneratorOptions] as boolean;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        const updated = { ...genOptions, [key]: !active };
                        setGenOptions(updated);
                        setGeneratedPassword(generateSecurePassword(updated));
                      }}
                      className={`p-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-between ${
                        active
                          ? 'bg-[var(--md-primary)]/15 text-[var(--md-primary)] dark:text-[var(--md-secondary)] border border-[var(--md-primary)]/30'
                          : 'bg-surface-light dark:bg-[#1E2029] text-secondary-light border-border-light dark:border-border-dark'
                      }`}
                    >
                      <span>{label}</span>
                      <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${active ? 'bg-[var(--md-primary)] border-[var(--md-primary)] text-[var(--md-on-primary)]' : 'border-neutral-400'}`}>
                        {active && <Check size={8} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    triggerHaptic('light');
                    await navigator.clipboard.writeText(generatedPassword);
                    setToastMessage('Password copied to clipboard');
                    setIsGenModalOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl border border-border-light dark:border-border-dark text-xs font-bold text-secondary-light hover:text-primary-light dark:hover:text-primary-dark"
                >
                  Copy Only
                </button>
                <button
                  type="button"
                  onClick={handleUseGeneratedPassword}
                  className="flex-1 py-2 rounded-xl bg-[var(--md-primary)] hover:opacity-95 text-[var(--md-on-primary)] text-xs font-bold shadow-md shadow-[var(--md-primary)]/25 active:scale-95 transition-all"
                >
                  Use Password
                </button>
              </div>
      </Modal>
    </div>
  );
}

/**
 * LifeOS — Vault Component (iOS 26 Liquid Glass)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretLeft,
  ShieldCheck,
  Lock,
  Key,
  Fingerprint,
  Eye,
  EyeSlash,
  Copy,
  Check,
  Plus,
  ArrowSquareOut,
  Trash,
  PencilSimple,
  ArrowClockwise,
  Sparkle,
  Globe,
  User,
  WarningCircle,
  GraduationCap,
  ShareNetwork,
  Briefcase,
  CurrencyInr,
  Heart,
  Folder,
  DeviceMobile,
} from '@phosphor-icons/react';
import { triggerHaptic } from '../utils/haptics';
import { authenticateDeviceLock } from '../utils/security';
import { auth } from '../firebase';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import {
  deriveVaultKey,
  generateRandomSalt,
  encryptPassword,
  decryptPassword,
  generateSecurePassword,
  evaluatePasswordStrength,
  GeneratorOptions
} from '../utils/cryptoVault';
import { Toolbar } from '../ui/navigation/Toolbar';
import { SearchPill } from '../ui/navigation/SearchPill';
import { Button } from '../ui/controls/Button';
import { Sheet } from '../ui/feedback/Sheet';
import { TextField } from '../ui/controls/TextField';
import { EmptyState } from '../ui/feedback/EmptyState';
import type { AppData, VaultItem, VaultCategory, VaultConfig } from '../types';

interface VaultProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

const CATEGORY_CONFIG: Record<VaultCategory, { label: string; shortLabel: string; icon: any; color: string; bg: string }> = {
  study: { label: 'Study & College', shortLabel: 'Study', icon: GraduationCap, color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/15 border-[#0A84FF]/30' },
  social: { label: 'Social & Media', shortLabel: 'Social', icon: ShareNetwork, color: 'text-[#FF375F]', bg: 'bg-[#FF375F]/15 border-[#FF375F]/30' },
  work: { label: 'Work & Projects', shortLabel: 'Work', icon: Briefcase, color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30' },
  finance: { label: 'Banking & Pay', shortLabel: 'Finance', icon: CurrencyInr, color: 'text-[#30D158]', bg: 'bg-[#30D158]/15 border-[#30D158]/30' },
  personal: { label: 'Personal & Health', shortLabel: 'Personal', icon: Heart, color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/15 border-[#FF453A]/30' },
  other: { label: 'Other Accounts', shortLabel: 'Other', icon: Folder, color: 'text-[#40C8E0]', bg: 'bg-[#40C8E0]/15 border-[#40C8E0]/30' },
};

const AUTO_LOCK_SECONDS = 90;

export default function Vault({ data, updateData }: VaultProps) {
  const navigate = useNavigate();
  const { confirmDelete, showSavedFeedback, showEditedFeedback } = useM3Feedback();

  // ── Vault State ───────────────────────────────────────────────────────────
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
          expiresAt: Date.now() + 10000,
        },
      }));
    } catch {
      setToastMessage('Decryption error');
    }
  };

  // ── Copy Password ───────────────────────────────────────────
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
        showEditedFeedback({
          title: 'Account Updated',
          message: `Credentials for "${modalForm.title.trim()}" updated`,
          section: 'vault',
        });
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
        showSavedFeedback({
          title: 'Vault Item Secured',
          message: `"${modalForm.title.trim()}" encrypted & stored`,
          section: 'vault',
        });
      }

      await updateData({ vaultItems: updatedList });
      setIsModalOpen(false);
    } catch (err: any) {
      setToastMessage('Encryption failed: ' + err.message);
    }
  };

  const handleDeleteItem = (item: VaultItem) => {
    confirmDelete({
      title: 'Delete from Vault?',
      itemName: item.title,
      message: 'This encrypted credential will be permanently removed from your vault.',
      section: 'vault',
      onConfirm: async () => {
        const updated = vaultItems.filter((i) => i.id !== item.id);
        await updateData({ vaultItems: updated });
        setToastMessage(`Deleted ${item.title}`);
      },
    });
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

  // ── RENDER: LOCKED STATE ──────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col p-4">
        <div className="w-full flex items-center justify-start pt-2">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
            title="Back to Home"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl p-8 bg-[#1C1C1E] border border-white/[0.08] flex flex-col items-center space-y-5 shadow-2xl"
          >
            {/* Biometric Holographic Scanner Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#8E7CFF]/15 border border-[#8E7CFF]/30 flex items-center justify-center text-[#8E7CFF]">
                <Fingerprint size={48} weight="light" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#8E7CFF] text-black rounded-full p-1.5 shadow-md">
                <Lock size={14} weight="bold" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                LifeOS Vault
              </h2>
              <p className="text-xs text-[#8E8E93] max-w-xs leading-relaxed">
                Protected by device biometrics and screen lock. Zero master passwords.
              </p>
            </div>

            {authError && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs text-left">
                <WarningCircle size={16} weight="fill" className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <Button
              variant="prominent"
              tint="#8E7CFF"
              size="lg"
              icon={<Fingerprint size={20} weight="bold" />}
              onClick={() => handleDeviceUnlock(false)}
              className="w-full"
            >
              {isAuthenticating ? 'Verifying Lock...' : 'Unlock Vault'}
            </Button>

            <div className="w-full pt-4 border-t border-white/[0.06] space-y-2 text-[11px] text-[#8E8E93]">
              <div className="flex items-center justify-center gap-1.5">
                <DeviceMobile size={13} className="text-[#8E7CFF]" />
                <span>Hardware-backed device lock</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} className="text-[#8E7CFF]" />
                <span>AES-256-GCM Zero Knowledge</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── RENDER: UNLOCKED VAULT DASHBOARD ──────────────────────────────────────
  return (
    <div className="w-full text-white pb-4">
      <Toolbar
        leading={
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              title="Back"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={handleLock}
              className="p-2 rounded-lg text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
              title="Lock Vault"
            >
              <Lock size={20} weight="bold" />
            </button>
          </div>
        }
        center={
          <span className="text-sm font-semibold text-white">
            Vault
          </span>
        }
        trailing={
          <div className="flex items-center gap-1">
            <button
              onClick={handleOpenGenerator}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              title="Generator"
            >
              <Sparkle size={20} />
            </button>
            <button
              onClick={openAddModal}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              title="Add Credential"
            >
              <Plus size={20} weight="bold" />
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 pt-2">
        {/* Subtitle & Timer */}
        <div className="flex items-center justify-between px-1 text-xs text-[#8E8E93]">
          <span>{vaultItems.length} accounts secured</span>
          <span>Auto-locks in <strong className="text-[#8E7CFF] font-semibold">{lockCountdown}s</strong></span>
        </div>

        {/* Search */}
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search accounts, usernames..."
        />

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#8E7CFF] text-white'
                : 'bg-[#1C1C1E] text-[#8E8E93] border border-white/[0.06] hover:text-white'
            }`}
          >
            All ({vaultItems.length})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const count = vaultItems.filter((i) => i.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#8E7CFF] text-white'
                    : 'bg-[#1C1C1E] text-[#8E8E93] border border-white/[0.06] hover:text-white'
                }`}
              >
                {config.shortLabel} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-[#1C1C1E] border border-white/[0.08] text-white text-xs font-medium flex items-center gap-2">
            <Sparkle size={14} className="text-[#8E7CFF]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Credentials List */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<Key size={36} weight="light" className="text-[#8E7CFF]" />}
            title={searchQuery ? 'No matching accounts' : 'Your vault is empty'}
            description={
              searchQuery
                ? 'Try another search keyword or switch category.'
                : 'Keep all your college portals, social accounts, and passwords securely encrypted.'
            }
            actionLabel={!searchQuery ? 'Add Password' : undefined}
            onAction={!searchQuery ? openAddModal : undefined}
            tint="#8E7CFF"
          />
        ) : (
          <div className="space-y-2.5">
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
                <div
                  key={item.id}
                  className="rounded-2xl p-4 bg-[#1C1C1E] border border-white/[0.08] space-y-3"
                >
                  {/* Top: Icon + Title + Category + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${categoryConfig.bg} shrink-0`}>
                        <CategoryIcon size={18} className={categoryConfig.color} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
                          <span>{categoryConfig.shortLabel}</span>
                          {item.websiteUrl && (
                            <>
                              <span>•</span>
                              <a
                                href={item.websiteUrl.startsWith('http') ? item.websiteUrl : `https://${item.websiteUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#8E7CFF] hover:underline flex items-center gap-0.5 truncate max-w-[140px]"
                              >
                                <span>{item.websiteUrl.replace(/^https?:\/\//, '')}</span>
                                <ArrowSquareOut size={10} />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E] transition-colors"
                        title="Edit"
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                        title="Delete"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Username Row */}
                  {item.usernameOrEmail && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#2C2C2E] border border-white/[0.04] text-xs">
                      <div className="flex items-center gap-2 truncate text-[#8E8E93] min-w-0">
                        <User size={13} className="shrink-0" />
                        <span className="font-medium truncate text-white">{item.usernameOrEmail}</span>
                      </div>
                      <button
                        onClick={() => handleCopyUsername(item.id, item.usernameOrEmail)}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                          isUserCopied ? 'text-[#30D158] bg-[#30D158]/15' : 'text-[#8E8E93] hover:text-white'
                        }`}
                      >
                        {isUserCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{isUserCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {/* Password Row */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#2C2C2E] border border-white/[0.04]">
                    <div className="flex items-center gap-2 px-1 min-w-0 truncate font-mono text-xs">
                      <Key size={14} className="text-[#8E7CFF] shrink-0" />
                      {isRevealed ? (
                        <span className="font-semibold text-[#8E7CFF] tracking-wider truncate select-all">
                          {revealedPlain}
                        </span>
                      ) : (
                        <span className="tracking-widest text-[#8E8E93] select-none">
                          ••••••••••••
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isRevealed && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#8E7CFF]/20 text-[#8E7CFF] border border-[#8E7CFF]/30 animate-pulse">
                          {peekSecondsLeft}s
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleReveal(item)}
                        className={`p-2 rounded-lg border transition-all ${
                          isRevealed
                            ? 'bg-[#8E7CFF] text-white border-[#8E7CFF]'
                            : 'bg-[#1C1C1E] border-white/[0.08] text-[#8E8E93] hover:text-white'
                        }`}
                        title={isRevealed ? 'Hide' : 'Peek for 10s'}
                      >
                        {isRevealed ? <EyeSlash size={14} /> : <Eye size={14} />}
                      </button>

                      <button
                        onClick={() => handleCopyPassword(item)}
                        className={`p-2 rounded-lg border transition-all ${
                          isPasswordCopied
                            ? 'bg-[#30D158] text-white border-[#30D158]'
                            : 'bg-[#1C1C1E] border-white/[0.08] text-[#8E8E93] hover:text-white'
                        }`}
                        title="Copy Password"
                      >
                        {isPasswordCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-[#2C2C2E] text-[11px] text-[#8E8E93] italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Sheet ── */}
      <Sheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Credential' : 'New Password'}
      >
        <form onSubmit={handleSaveCredential} className="space-y-4">
          <TextField
            label="Service / Account Name"
            value={modalForm.title}
            onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
            placeholder="e.g. GitHub, Student Portal, Netflix"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8E8E93]">Category</label>
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
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#8E7CFF] text-white border-[#8E7CFF]'
                        : 'bg-[#2C2C2E] text-[#8E8E93] border-white/[0.08]'
                    }`}
                  >
                    <c.icon size={14} className={active ? 'text-white' : c.color} />
                    <span className="truncate">{c.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <TextField
            label="Username / Email"
            value={modalForm.usernameOrEmail}
            onChange={(e) => setModalForm({ ...modalForm, usernameOrEmail: e.target.value })}
            placeholder="e.g. user@email.com"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#8E8E93]">Password</label>
              <button
                type="button"
                onClick={handleOpenGenerator}
                className="text-xs font-semibold text-[#8E7CFF] flex items-center gap-1"
              >
                <Sparkle size={12} />
                <span>Generate</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showModalPassword ? 'text' : 'password'}
                required
                value={modalForm.password}
                onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-[#2C2C2E] border border-white/[0.08] rounded-xl px-3 py-2.5 pr-10 text-sm font-mono text-white focus:outline-none focus:border-[#8E7CFF]"
              />
              <button
                type="button"
                onClick={() => setShowModalPassword(!showModalPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
              >
                {showModalPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {modalForm.password && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[#8E8E93]">Strength</span>
                <span className={`font-semibold ${modalPasswordStrength.color.split(' ')[0]}`}>
                  {modalPasswordStrength.label}
                </span>
              </div>
            )}
          </div>

          <TextField
            label="Website URL (optional)"
            value={modalForm.websiteUrl}
            onChange={(e) => setModalForm({ ...modalForm, websiteUrl: e.target.value })}
            placeholder="e.g. github.com"
          />

          <TextField
            label="Private Notes (optional)"
            value={modalForm.notes}
            onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
            placeholder="Recovery codes, security hints..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="glass" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="prominent" tint="#8E7CFF" type="submit">
              {editingItem ? 'Update' : 'Save Encrypted'}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* ── Password Generator Sheet ── */}
      <Sheet
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        title="Password Generator"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#2C2C2E] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-white break-all select-all">
                {generatedPassword}
              </span>
              <button
                onClick={handleRegeneratePassword}
                className="p-2 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/10"
                title="Regenerate"
              >
                <ArrowClockwise size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8E8E93]">Strength</span>
              <span className={`font-semibold ${genPasswordStrength.color.split(' ')[0]}`}>
                {genPasswordStrength.label}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8E8E93]">
              <span>Length</span>
              <span className="text-white font-mono">{genOptions.length} chars</span>
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
              className="w-full accent-[#8E7CFF] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
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
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                    active
                      ? 'bg-[#8E7CFF]/15 text-[#8E7CFF] border-[#8E7CFF]/30'
                      : 'bg-[#2C2C2E] text-[#8E8E93] border-white/[0.04]'
                  }`}
                >
                  <span>{label}</span>
                  {active && <Check size={12} weight="bold" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="glass"
              className="flex-1"
              onClick={async () => {
                triggerHaptic('light');
                await navigator.clipboard.writeText(generatedPassword);
                setToastMessage('Password copied to clipboard');
                setIsGenModalOpen(false);
              }}
            >
              Copy Only
            </Button>
            <Button
              variant="prominent"
              tint="#8E7CFF"
              className="flex-1"
              onClick={handleUseGeneratedPassword}
            >
              Use Password
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

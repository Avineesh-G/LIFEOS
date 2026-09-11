import { Moon, Sun, Monitor, Check, LogOut, AlertTriangle, Dumbbell, Key, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, AppSettings } from '../types';
import BodyProfileForm from '../components/BodyProfileForm';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface SettingsProps {
  theme: AppSettings['theme'];
  setTheme: (t: AppSettings['theme']) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
  refresh: () => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function Settings({ theme, setTheme, data, updateData }: SettingsProps) {
  const navigate = useNavigate();

  // Private Groq API Key State
  const [apiKeyInput, setApiKeyInput] = useState(data.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = async () => {
    triggerHaptic('save');
    await updateData({ geminiApiKey: apiKeyInput.trim() });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-28">
      
      {/* Settings Header */}
      <motion.div variants={item} className="pt-2 px-1">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono mb-1">
          Preferences & System
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
          Settings
        </h1>
      </motion.div>

      {/* Theme Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-amber-500/10 text-amber-500 shadow-sm">
              <Sun size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Display & Theme
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                Choose your visual environment
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent capitalize font-sans">
            {theme} Mode
          </span>
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light', activeClass: 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-md' },
              { value: 'dark' as const, icon: Moon, label: 'Dark', activeClass: 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-md' },
              { value: 'system' as const, icon: Monitor, label: 'System', activeClass: 'bg-accent/15 text-accent border-accent/40 shadow-sm' },
            ].map(({ value, icon: Icon, label, activeClass }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    triggerHaptic(15);
                    setTheme(value);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[22px] border transition-all duration-150 active:scale-[0.96] ${
                    active
                      ? activeClass
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-xs font-bold font-sans">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Body Profile Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText shadow-sm">
              <Dumbbell size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Body Profile & Targets
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                Metabolic baseline & calorie target
              </p>
            </div>
          </div>
          <span className="rounded-full bg-m3-mint-badge/60 dark:bg-m3-mint-darkBadge/60 text-m3-mint-text dark:text-m3-mint-darkText font-mono font-bold text-xs px-3.5 py-1.5 shadow-sm whitespace-nowrap shrink-0">
            {data.profile?.currentCalorieTarget || 2000} kcal
          </span>
        </div>
        <BodyProfileForm 
          initialProfile={data.profile} 
          onSave={(profile) => updateData({ profile })} 
        />
      </motion.div>

      {/* Private Groq AI Coach Configuration */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[14px] bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Key size={20} />
            </span>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
                AI Coach Integration
              </p>
              <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans">
                Groq API Key
              </h3>
            </div>
          </div>
          {data.geminiApiKey ? (
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
              Active ✓
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
              Not Set
            </span>
          )}
        </div>

        <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
          Your key is saved exclusively in your private account. It is never committed to Git, never visible in the APK, and completely private to you.
        </p>

        <div className="space-y-2 pt-1">
          <div className="relative flex items-center">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 pr-11 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 font-mono"
            >
              Get Free Key from Groq →
            </a>
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput.trim()}
              className="btn-pill px-4 py-2 text-xs bg-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              {apiKeySaved ? (
                <>
                  <Check size={14} className="stroke-[3]" /> Saved!
                </>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        {/* User Account Info Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-accent/10 border border-accent/25 flex items-center justify-center text-lg font-black text-accent font-sans shadow-sm shrink-0">
            {(auth.currentUser?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Signed In Account
            </p>
            <p className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans break-all mt-0.5 leading-snug">
              {auth.currentUser?.email || 'Signed In User'}
            </p>
            <p className="text-[10px] text-muted-light dark:text-muted-dark font-mono mt-0.5 truncate">
              UID: {auth.currentUser?.uid || 'Not available'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border-light/60 dark:bg-border-dark/60" />

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              triggerHaptic('medium');
              if (Capacitor.isNativePlatform()) {
                GoogleAuth.signOut().catch(() => {});
              }
              navigate('/');
              signOut(auth);
            }}
            className="w-full py-2.5 px-4 rounded-full bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>
          <button
            onClick={async () => {
              triggerHaptic('heavy');
              if (window.confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                if (auth.currentUser) {
                  await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                  alert('Data reset successfully! The app will now reload.');
                  window.location.reload();
                }
              }
            }}
            className="w-full py-2.5 px-4 rounded-full bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <AlertTriangle size={14} className="text-amber-500" />
            Reset Data
          </button>
        </div>
      </motion.div>

      <div className="text-center py-4">
        <p className="text-xs font-bold text-muted-light dark:text-muted-dark tracking-wide">LifeOS v1.5.2 (Build 11)</p>
      </div>
    </motion.div>
  );
}

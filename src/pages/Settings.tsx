import { Moon, Sun, Monitor, Check, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, AppSettings } from '../types';
import BodyProfileForm from '../components/BodyProfileForm';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

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
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } } };

export default function Settings({ theme, setTheme, data, updateData }: SettingsProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveFeedback = () => {
    triggerHaptic(15);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="pt-2">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Preferences</p>
        <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">Settings</h1>
      </motion.div>

      {/* Appearance Section */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <p className="label-mono text-secondary-light dark:text-secondary-dark">Appearance</p>

        {/* Theme Picker */}
        <div>
          <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ].map(({ value, icon: Icon, label }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    triggerHaptic(15);
                    setTheme(value);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all duration-150 active:scale-[0.97] ${
                    active
                      ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-sm'
                      : 'bg-bg-light dark:bg-bg-dark border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
      {/* Body Profile Section */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <p className="label-mono text-secondary-light dark:text-secondary-dark">Body Profile & Targeting</p>
        <BodyProfileForm 
          initialProfile={data.profile} 
          onSave={(profile) => updateData({ profile })} 
        />
      </motion.div>

      {/* Advanced Settings */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <p className="label-mono text-secondary-light dark:text-secondary-dark">Advanced</p>
        
        <div>
          <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-1">Groq API Key</label>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={data.geminiApiKey || ''} 
              onChange={e => updateData({ geminiApiKey: e.target.value })} 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSaveFeedback();
                }
              }}
              className="flex-1 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light" 
              placeholder="AIzaSy..."
            />
            <button
              onClick={handleSaveFeedback}
              className={`btn-pill px-4 py-2 text-sm transition-all flex items-center gap-1.5 ${isSaved ? 'bg-emerald-500 text-white' : ''}`}
            >
              {isSaved ? <><Check size={14} /> Saved!</> : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-muted-light dark:text-muted-dark mt-1">Required for AI Coach and Nutrition parsing.</p>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Account</p>
            <p className="text-sm font-medium text-primary-light dark:text-primary-dark truncate" title={auth.currentUser?.email || ''}>{auth.currentUser?.email}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="text-center py-4">
        <p className="label-mono text-muted-light dark:text-muted-dark">LifeOS v1.0</p>
      </motion.div>
    </motion.div>
  );
}

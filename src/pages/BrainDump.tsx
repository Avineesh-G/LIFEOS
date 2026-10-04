import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  ListTodo, 
  Wallet, 
  FileText, 
  Trash2, 
  ChevronLeft,
  Layers,
  Wand2
} from 'lucide-react';
import { OrbiCompanion } from '../components/illustrations/OrbiCompanion';
import { haptics } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import { AppData, Task, Expense, NoteItem } from '../types';

interface BrainDumpProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

interface ParsedItem {
  id: string;
  type: 'task' | 'expense' | 'note';
  title: string;
  detail?: string;
  amount?: number;
  category?: string;
  dueDate?: string;
}

const SAMPLE_PROMPTS = [
  'Coffee $4.50, Math homework due tomorrow 5pm',
  'Buy gym straps $18.00, Read 20 pages of clean code',
  'Submit lab report by Friday, Lunch with team $15.50',
];

export const BrainDump: React.FC<BrainDumpProps> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [committed, setCommitted] = useState(false);

  // Deterministic local parsing logic
  const handleParse = () => {
    if (!inputText.trim()) return;
    haptics.tap();
    setIsParsing(true);

    setTimeout(() => {
      const lines = inputText
        .split(/[,;\n]+/)
        .map(l => l.trim())
        .filter(Boolean);

      const items: ParsedItem[] = [];
      const todayStr = new Date().toISOString().split('T')[0];

      lines.forEach((line, idx) => {
        // Check for expense pattern: $xx or xx dollars / rs
        const moneyMatch = line.match(/\$?(\d+(?:\.\d{1,2})?)\s*(?:dollars|bucks|rs|\$)?/i);
        const hasDueMatch = line.match(/(?:due|by|before)\s+([a-zA-Z0-9\s:]+)/i);

        if (moneyMatch && (line.toLowerCase().includes('spent') || line.toLowerCase().includes('bought') || line.toLowerCase().includes('paid') || line.includes('$') || line.toLowerCase().includes('lunch') || line.toLowerCase().includes('coffee') || line.toLowerCase().includes('food'))) {
          const amount = parseFloat(moneyMatch[1]);
          const desc = line.replace(moneyMatch[0], '').replace(/(?:spent|bought|paid|for)/gi, '').trim();
          items.push({
            id: `item-${Date.now()}-${idx}`,
            type: 'expense',
            title: desc || 'Expense',
            amount: isNaN(amount) ? 10 : amount,
            category: 'General',
          });
        } else if (hasDueMatch || line.toLowerCase().includes('task') || line.toLowerCase().includes('submit') || line.toLowerCase().includes('finish') || line.toLowerCase().includes('do') || line.toLowerCase().includes('assignment')) {
          items.push({
            id: `item-${Date.now()}-${idx}`,
            type: 'task',
            title: line,
            dueDate: todayStr,
          });
        } else {
          // Default to quick note
          items.push({
            id: `item-${Date.now()}-${idx}`,
            type: 'note',
            title: line,
            detail: `Captured via Brain Dump on ${new Date().toLocaleTimeString()}`,
          });
        }
      });

      setParsedItems(items);
      setIsParsing(false);
      haptics.save();
    }, 400);
  };

  const removeItem = (id: string) => {
    haptics.warning();
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCommit = async () => {
    if (parsedItems.length === 0) return;
    haptics.milestone();
    triggerConfettiBurst();
    setCommitted(true);

    const newTasks: Task[] = [...(data?.tasks || [])];
    const newExpenses: Expense[] = [...(data?.expenses || [])];
    const newNotes: NoteItem[] = [...(data?.notes || [])];
    const todayStr = new Date().toISOString().split('T')[0];
    const monthKey = todayStr.substring(0, 7);

    parsedItems.forEach(item => {
      if (item.type === 'task') {
        newTasks.unshift({
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: item.title,
          completed: false,
          date: todayStr,
          dueDate: item.dueDate || todayStr,
        });
      } else if (item.type === 'expense') {
        newExpenses.unshift({
          id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: item.amount || 0,
          category: item.category || 'General',
          note: item.title,
          date: todayStr,
        });
      } else if (item.type === 'note') {
        newNotes.unshift({
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          content: item.detail || item.title,
          pageView: 'lined',
          monthKey,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    await updateData({
      tasks: newTasks,
      expenses: newExpenses,
      notes: newNotes,
    });

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="w-full space-y-4 max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-primary)] uppercase tracking-wider">
              <Wand2 size={14} />
              <span>AI Multi-Intent Ingestion</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--md-on-surface)] tracking-tight">
              Brain Dump HUD
            </h1>
          </div>
        </div>
      </div>

      {/* Input Card */}
      <div className="p-4 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col gap-3">
        <label className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} />
          <span>Dump Your Thoughts Here</span>
        </label>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste or write anything: expenses, tasks, workout notes, or quick ideas..."
          rows={4}
          className="w-full p-3 rounded-2xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-sm text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)] resize-none"
        />

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(prompt);
                haptics.tap();
              }}
              className="px-2.5 py-1 rounded-full bg-[var(--md-surface-container-high)] text-[11px] font-medium text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] border border-[var(--md-outline-variant)] truncate max-w-full"
            >
              {prompt}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleParse}
          disabled={!inputText.trim() || isParsing}
          className="w-full py-3 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
        >
          <Sparkles size={16} />
          <span>{isParsing ? 'Parsing with AI...' : 'Parse & Categorize'}</span>
        </motion.button>
      </div>

      {/* Ingestion Preview List */}
      <AnimatePresence>
        {parsedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-on-surface)] uppercase tracking-wider">
                Recognized Items ({parsedItems.length})
              </span>
              <span className="text-xs text-[var(--md-primary)] font-semibold">
                Tap check below to sync
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {parsedItems.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'task'
                        ? 'bg-[var(--md-primary-container)] text-[var(--md-primary)]'
                        : item.type === 'expense'
                        ? 'bg-[var(--md-secondary-container)] text-[var(--md-secondary)]'
                        : 'bg-[var(--md-tertiary-container)] text-[var(--md-tertiary)]'
                    }`}>
                      {item.type === 'task' ? <ListTodo size={18} /> : item.type === 'expense' ? <Wallet size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-primary)] block">
                        {item.type} {item.amount ? `• $${item.amount}` : ''}
                      </span>
                      <p className="text-sm font-medium text-[var(--md-on-surface)] truncate">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-[var(--md-on-surface-variant)] hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Commit Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleCommit}
              disabled={committed}
              className="w-full py-4 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all mt-2"
            >
              <CheckCircle2 size={18} />
              <span>{committed ? 'Synced to LifeOS!' : `Sync All ${parsedItems.length} Items to LifeOS`}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luna Companion Section */}
      <div className="mt-auto p-4 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex items-center gap-3">
        <OrbiCompanion variant={committed ? 'tasks-done' : 'notes-spark'} size={56} />
        <div>
          <span className="text-xs font-bold text-[var(--md-primary)] block">Luna Smart Ingestion</span>
          <p className="text-xs text-[var(--md-on-surface-variant)]">
            One text dump cleanly routes your tasks, expenses, and notes with zero manual tab switching.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrainDump;

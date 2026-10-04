import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AppData, Task, Expense } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  Sparkle,
  CheckCircle,
  Wallet,
  NotePencil,
  Plus,
  Trash,
  Check,
} from '../ui';

interface BrainDumpProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

interface ParsedItem {
  id: string;
  type: 'task' | 'expense' | 'note';
  title: string;
  amount?: number;
  selected: boolean;
}

export default function BrainDump({ data, updateData }: BrainDumpProps) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isSorting, setIsSorting] = useState(false);

  const handleSortWithLuna = () => {
    if (!inputText.trim()) return;
    triggerHaptic('ai');
    setIsSorting(true);

    setTimeout(() => {
      const lines = inputText
        .split(/[,;\n]+/)
        .map((l) => l.trim())
        .filter(Boolean);

      const items: ParsedItem[] = [];

      lines.forEach((line, idx) => {
        const moneyMatch = line.match(/(?:rs\.?|₹|\$)?\s*(\d+(?:\.\d{1,2})?)/i);
        if (
          moneyMatch &&
          (line.toLowerCase().includes('spent') ||
            line.toLowerCase().includes('bought') ||
            line.toLowerCase().includes('paid') ||
            line.toLowerCase().includes('lunch') ||
            line.toLowerCase().includes('coffee') ||
            line.toLowerCase().includes('food'))
        ) {
          const amount = parseFloat(moneyMatch[1]);
          const desc = line.replace(moneyMatch[0], '').replace(/(?:spent|bought|paid|for)/gi, '').trim();
          items.push({
            id: `dump_${Date.now()}_${idx}`,
            type: 'expense',
            title: desc || 'Expense',
            amount: isNaN(amount) ? 100 : amount,
            selected: true,
          });
        } else if (
          line.toLowerCase().includes('task') ||
          line.toLowerCase().includes('submit') ||
          line.toLowerCase().includes('finish') ||
          line.toLowerCase().includes('assignment') ||
          line.toLowerCase().includes('due')
        ) {
          items.push({
            id: `dump_${Date.now()}_${idx}`,
            type: 'task',
            title: line,
            selected: true,
          });
        } else {
          items.push({
            id: `dump_${Date.now()}_${idx}`,
            type: 'note',
            title: line,
            selected: true,
          });
        }
      });

      setParsedItems(items);
      setIsSorting(false);
      triggerHaptic('success');
    }, 400);
  };

  const handleCommitAll = async () => {
    triggerHaptic('milestone');
    triggerConfettiBurst();

    const todayStr = new Date().toISOString().split('T')[0];
    const newTasks: Task[] = [];
    const newExpenses: Expense[] = [];

    parsedItems
      .filter((i) => i.selected)
      .forEach((i) => {
        if (i.type === 'task') {
          newTasks.push({
            id: `task_${Date.now()}_${Math.random()}`,
            text: i.title,
            completed: false,
            date: todayStr,
          });
        } else if (i.type === 'expense') {
          newExpenses.push({
            id: `exp_${Date.now()}_${Math.random()}`,
            amount: i.amount || 100,
            category: 'General',
            note: i.title,
            date: todayStr,
          });
        }
      });

    const updatedTasks = [...newTasks, ...(data.tasks || [])];
    const updatedExpenses = [...newExpenses, ...(data.expenses || [])];

    await updateData({ tasks: updatedTasks, expenses: updatedExpenses });
    setParsedItems([]);
    setInputText('');
    navigate('/');
  };

  return (
    <div className="w-full text-white selection:bg-[#BF5AF2]/30">
      <LargeTitleHeader
        title="Brain Dump"
        subtitle="Unload thoughts, tasks & expenses"
        tint="#BF5AF2"
        onBack={() => navigate('/')}
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Distraction-Free Input Field */}
        <div className="w-full bg-[#1C1C1E] rounded-[28px] p-5 border border-white/[0.06] shadow-xl flex flex-col gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type anything freely: 'Coffee Rs 120, submit DBMS assignment tomorrow, study OS for 2 hours'..."
            className="w-full h-36 bg-transparent text-white text-[16px] placeholder-[rgba(235,235,245,0.30)] focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex justify-end pt-2 border-t border-white/[0.06]">
            <Button
              variant="prominent"
              tint="#BF5AF2"
              size="md"
              disabled={!inputText.trim() || isSorting}
              onClick={handleSortWithLuna}
              icon={<Sparkle weight="fill" />}
            >
              {isSorting ? 'Analyzing...' : 'Sort with Luna'}
            </Button>
          </div>
        </div>

        {/* Parsed Items Breakdown */}
        {parsedItems.length > 0 && (
          <div className="flex flex-col gap-3">
            <GroupedList header="Detected Items">
              {parsedItems.map((item) => (
                <ListRow
                  key={item.id}
                  icon={
                    item.type === 'task' ? (
                      <CheckCircle weight="bold" />
                    ) : item.type === 'expense' ? (
                      <Wallet weight="bold" />
                    ) : (
                      <NotePencil weight="bold" />
                    )
                  }
                  iconTint={
                    item.type === 'task'
                      ? '#0A84FF'
                      : item.type === 'expense'
                      ? '#30D158'
                      : '#FFD60A'
                  }
                  title={item.title}
                  subtitle={item.type.toUpperCase()}
                  trailing={item.amount ? `Rs ${item.amount}` : undefined}
                />
              ))}
            </GroupedList>

            <Button
              variant="prominent"
              tint="#0A84FF"
              className="w-full"
              onClick={handleCommitAll}
            >
              Add All to LifeOS
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

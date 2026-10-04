import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import type { AppData } from '../types';
import {
  LargeTitleHeader,
  Button,
  Segmented,
  Sheet,
  TextField,
  EmptyState,
  Badge,
  Cards,
  Plus,
  ArrowClockwise,
  Check,
  CaretLeft,
} from '../ui';

interface ActiveRecallProps {
  data: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<any>;
}

export interface Flashcard {
  id: string;
  deck: string;
  front: string;
  back: string;
  intervalDays: number;
  lastReviewed: string;
  nextReview: string;
  reps: number;
}

export default function ActiveRecall({ data: _data }: ActiveRecallProps) {
  const navigate = useNavigate();

  const [cards, setCards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('lifeos_recall_cards');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: '1',
              deck: 'Computer Science',
              front: 'What is ACID in Database Management?',
              back: 'Atomicity, Consistency, Isolation, and Durability.',
              intervalDays: 1,
              lastReviewed: '',
              nextReview: '',
              reps: 0,
            },
            {
              id: '2',
              deck: 'Computer Science',
              front: 'What is the time complexity of QuickSort average vs worst case?',
              back: 'Average: O(n log n), Worst: O(n^2).',
              intervalDays: 3,
              lastReviewed: '',
              nextReview: '',
              reps: 1,
            },
          ];
    } catch {
      return [];
    }
  });

  const [selectedDeck, setSelectedDeck] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add Card Form
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deck, setDeck] = useState('Computer Science');

  const uniqueDecks = useMemo(() => {
    const set = new Set(cards.map((c) => c.deck));
    return ['All', ...Array.from(set)];
  }, [cards]);

  const filteredCards = useMemo(() => {
    if (selectedDeck === 'All') return cards;
    return cards.filter((c) => c.deck === selectedDeck);
  }, [cards, selectedDeck]);

  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    triggerHaptic('light');
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    triggerHaptic(rating === 'again' ? 'error' : 'success');

    let nextInterval = currentCard.intervalDays;
    if (rating === 'again') nextInterval = 1;
    else if (rating === 'hard') nextInterval = Math.max(1, Math.round(currentCard.intervalDays * 1.2));
    else if (rating === 'good') nextInterval = Math.max(3, currentCard.intervalDays * 2);
    else if (rating === 'easy') nextInterval = Math.max(7, currentCard.intervalDays * 3);

    const updated = cards.map((c) =>
      c.id === currentCard.id
        ? {
            ...c,
            intervalDays: nextInterval,
            reps: c.reps + 1,
            lastReviewed: new Date().toISOString(),
          }
        : c
    );

    setCards(updated);
    try {
      localStorage.setItem('lifeos_recall_cards', JSON.stringify(updated));
    } catch {}

    setIsFlipped(false);
    if (currentIndex + 1 < filteredCards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      triggerConfettiBurst();
      setCurrentIndex(0);
    }
  };

  const handleCreateCard = () => {
    if (!front.trim() || !back.trim()) return;
    triggerHaptic('success');
    const newCard: Flashcard = {
      id: `card_${Date.now()}`,
      deck: deck.trim() || 'General',
      front: front.trim(),
      back: back.trim(),
      intervalDays: 1,
      lastReviewed: '',
      nextReview: '',
      reps: 0,
    };

    const updated = [newCard, ...cards];
    setCards(updated);
    try {
      localStorage.setItem('lifeos_recall_cards', JSON.stringify(updated));
    } catch {}

    setFront('');
    setBack('');
    setIsAddOpen(false);
  };

  return (
    <div className="w-full text-white selection:bg-[#BF5AF2]/30">
      <LargeTitleHeader
        title="Active Recall"
        subtitle={`${filteredCards.length} cards in deck`}
        tint="#BF5AF2"
        onBack={() => navigate('/study')}
        actions={
          <Button
            variant="glass"
            tint="#BF5AF2"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<Plus size={16} weight="bold" />}
          >
            Add Card
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Deck Filters */}
        {uniqueDecks.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {uniqueDecks.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedDeck(d);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDeck === d
                    ? 'bg-[#BF5AF2] text-white'
                    : 'bg-[#1C1C1E] text-[rgba(235,235,245,0.60)] hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* ── Immersive 3D Flip Review Card ── */}
        {!currentCard ? (
          <EmptyState
            icon={<Cards weight="bold" />}
            title="No Flashcards Found"
            description="Create your first spaced-repetition card to start testing active recall."
            actionLabel="Create Flashcard"
            onAction={() => setIsAddOpen(true)}
            tint="#BF5AF2"
          />
        ) : (
          <div className="flex flex-col gap-5 items-center py-2 select-none">
            <div className="w-full flex justify-between items-center text-xs font-semibold text-[rgba(235,235,245,0.60)] px-2">
              <span>
                Card {currentIndex + 1} of {filteredCards.length}
              </span>
              <span className="text-[#BF5AF2] font-bold">{currentCard.deck}</span>
            </div>

            {/* 3D Flippable Card Container */}
            <div
              className="w-full h-[320px] cursor-pointer"
              style={{ perspective: 1200 }}
              onClick={handleFlip}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full h-full relative"
              >
                {/* Front Side */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="absolute inset-0 bg-[#1C1C1E] rounded-[32px] p-6 border border-white/[0.08] shadow-2xl flex flex-col justify-between"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[rgba(235,235,245,0.40)]">
                    QUESTION
                  </span>
                  <div className="text-xl font-bold text-white text-center leading-relaxed">
                    {currentCard.front}
                  </div>
                  <span className="text-xs text-center text-[#BF5AF2] font-semibold">
                    Tap to reveal answer
                  </span>
                </div>

                {/* Back Side */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className="absolute inset-0 bg-[#2C2C2E] rounded-[32px] p-6 border border-[#BF5AF2]/30 shadow-2xl flex flex-col justify-between"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#BF5AF2]">
                    ANSWER
                  </span>
                  <div className="text-xl font-bold text-white text-center leading-relaxed">
                    {currentCard.back}
                  </div>
                  <span className="text-xs text-center text-[rgba(235,235,245,0.40)] font-medium">
                    Rate below to schedule next review
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Rating Buttons Row (Again, Hard, Good, Easy) */}
            <div className="grid grid-cols-4 gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => handleRate('again')}
                className="py-3 px-1 rounded-[18px] bg-[#1C1C1E] border border-[#FF453A]/30 text-[#FF453A] font-bold text-xs active:scale-95 transition-transform"
              >
                Again
              </button>
              <button
                type="button"
                onClick={() => handleRate('hard')}
                className="py-3 px-1 rounded-[18px] bg-[#1C1C1E] border border-[#FF9F0A]/30 text-[#FF9F0A] font-bold text-xs active:scale-95 transition-transform"
              >
                Hard
              </button>
              <button
                type="button"
                onClick={() => handleRate('good')}
                className="py-3 px-1 rounded-[18px] bg-[#1C1C1E] border border-[#30D158]/30 text-[#30D158] font-bold text-xs active:scale-95 transition-transform"
              >
                Good
              </button>
              <button
                type="button"
                onClick={() => handleRate('easy')}
                className="py-3 px-1 rounded-[18px] bg-[#1C1C1E] border border-[#0A84FF]/30 text-[#0A84FF] font-bold text-xs active:scale-95 transition-transform"
              >
                Easy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Card Sheet */}
      <Sheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        detent="half"
        title="New Recall Card"
      >
        <div className="flex flex-col gap-4 py-2">
          <TextField
            label="Deck / Subject"
            placeholder="Computer Science, Anatomy..."
            value={deck}
            onChange={(e) => setDeck(e.target.value)}
          />

          <TextField
            label="Front (Question / Prompt)"
            placeholder="e.g. What is the Big-O of binary search?"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            autoFocus
          />

          <TextField
            label="Back (Answer / Explanation)"
            placeholder="e.g. O(log n)"
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />

          <div className="pt-3">
            <Button
              variant="prominent"
              tint="#BF5AF2"
              className="w-full"
              disabled={!front.trim() || !back.trim()}
              onClick={handleCreateCard}
            >
              Save Flashcard
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

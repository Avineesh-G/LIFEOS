import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  RotateCw,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  Trash2,
  ThumbsUp,
  Flame,
  Award
} from 'lucide-react';
import { OrbiCompanion } from '../components/illustrations/OrbiCompanion';
import { haptics } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import { AppData } from '../types';

interface ActiveRecallProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
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

export const ActiveRecall: React.FC<ActiveRecallProps> = ({ data: _data, updateData: _updateData }) => {
  const navigate = useNavigate();

  // Load flashcards from local storage
  const [cards, setCards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('lifeos_recall_cards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDeck, setSelectedDeck] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Card Form
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newDeck, setNewDeck] = useState('General');

  // Filter cards by deck
  const filteredCards = useMemo(() => {
    if (selectedDeck === 'All') return cards;
    return cards.filter(c => c.deck === selectedDeck);
  }, [cards, selectedDeck]);

  const uniqueDecks = useMemo(() => {
    const set = new Set(cards.map(c => c.deck));
    return ['All', ...Array.from(set)];
  }, [cards]);

  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    haptics.tap();
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    haptics.tap();

    let nextInterval = currentCard.intervalDays;
    if (rating === 'hard') nextInterval = 1;
    else if (rating === 'good') nextInterval = Math.max(3, currentCard.intervalDays * 2);
    else if (rating === 'easy') nextInterval = Math.max(7, currentCard.intervalDays * 3);

    const todayStr = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);

    const updatedCard: Flashcard = {
      ...currentCard,
      intervalDays: nextInterval,
      lastReviewed: todayStr,
      nextReview: nextDate.toISOString().split('T')[0],
      reps: currentCard.reps + 1,
    };

    const updatedCards = cards.map(c => (c.id === currentCard.id ? updatedCard : c));
    setCards(updatedCards);
    localStorage.setItem('lifeos_recall_cards', JSON.stringify(updatedCards));

    setIsFlipped(false);
    if (currentIndex + 1 < filteredCards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      haptics.milestone();
      triggerConfettiBurst();
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    haptics.save();
    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      deck: newDeck.trim() || 'General',
      front: newFront.trim(),
      back: newBack.trim(),
      intervalDays: 1,
      lastReviewed: new Date().toISOString().split('T')[0],
      nextReview: new Date().toISOString().split('T')[0],
      reps: 0,
    };

    const updated = [newCard, ...cards];
    setCards(updated);
    localStorage.setItem('lifeos_recall_cards', JSON.stringify(updated));

    setNewFront('');
    setNewBack('');
    setShowAddModal(false);
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.warning();
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    localStorage.setItem('lifeos_recall_cards', JSON.stringify(updated));
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleRestart = () => {
    haptics.tap();
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  return (
    <div className="w-full space-y-4 max-w-lg mx-auto flex flex-col">
      {/* Top Header */}
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
              <Brain size={14} />
              <span>Spaced Repetition Engine</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--md-on-surface)] tracking-tight">
              Active Recall
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-2.5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm active:scale-95 transition-transform"
          aria-label="Create Flashcard"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Deck Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 w-full min-w-0">
        {uniqueDecks.map(deck => (
          <button
            key={deck}
            onClick={() => {
              setSelectedDeck(deck);
              setCurrentIndex(0);
              setIsFlipped(false);
              setSessionCompleted(false);
              haptics.tap();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedDeck === deck
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] border-[var(--md-primary)] shadow-xs'
                : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)]'
            }`}
          >
            {deck}
          </button>
        ))}
      </div>

      {/* Flashcard Area */}
      {filteredCards.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] text-center flex flex-col items-center gap-3 my-auto">
          <OrbiCompanion variant="notes-spark" size={80} />
          <h3 className="text-base font-bold text-[var(--md-on-surface)]">No cards in this deck</h3>
          <p className="text-xs text-[var(--md-on-surface-variant)] max-w-xs">
            Add your first flashcard to start building permanent memory mastery.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-bold"
          >
            Create Flashcard
          </button>
        </div>
      ) : sessionCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] text-center flex flex-col items-center gap-4 my-auto shadow-sm"
        >
          <OrbiCompanion variant="tasks-done" size={90} />
          <div>
            <span className="text-xs font-bold text-[var(--md-primary)] uppercase tracking-wider block">Session Finished</span>
            <h2 className="text-xl font-black text-[var(--md-on-surface)] mt-1">Great Recall Mastery!</h2>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              You reviewed all {filteredCards.length} cards in this deck.
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-sm flex items-center gap-2 shadow-sm"
          >
            <RotateCw size={16} />
            <span>Review Deck Again</span>
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-between">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-[var(--md-on-surface-variant)] px-1">
            <span>Card {currentIndex + 1} of {filteredCards.length}</span>
            <span className="text-[var(--md-primary)]">{currentCard?.deck}</span>
          </div>

          {/* Flip Card Container */}
          <div
            onClick={handleFlip}
            className="relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] p-6 flex flex-col justify-between cursor-pointer shadow-sm active:scale-[0.99] transition-transform select-none"
            style={{ perspective: 1000 }}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
              <span className="flex items-center gap-1">
                <BookOpen size={13} className="text-[var(--md-primary)]" />
                <span>{isFlipped ? 'Answer' : 'Question (Tap to flip)'}</span>
              </span>
              <button
                onClick={(e) => handleDeleteCard(currentCard.id, e)}
                className="text-[var(--md-on-surface-variant)] hover:text-red-500 p-1"
                aria-label="Delete card"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="my-auto text-center py-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={isFlipped ? 'back' : 'front'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`font-semibold text-[var(--md-on-surface)] leading-relaxed ${
                    isFlipped ? 'text-sm sm:text-base text-left' : 'text-base sm:text-lg text-center font-bold'
                  }`}
                >
                  {isFlipped ? currentCard.back : currentCard.front}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center text-xs text-[var(--md-on-surface-variant)] font-medium">
              <span className="flex items-center gap-1 text-[var(--md-primary)]">
                <RotateCw size={13} />
                <span>Tap card to {isFlipped ? 'show question' : 'reveal answer'}</span>
              </span>
            </div>
          </div>

          {/* Recall Rating Buttons (Only shown when flipped) */}
          <div className="min-h-[64px] flex items-center justify-center">
            {isFlipped ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-2 w-full"
              >
                <button
                  onClick={() => handleRate('hard')}
                  className="py-3 px-2 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                >
                  <span>Hard</span>
                  <span className="text-[10px] font-normal opacity-80">1 day</span>
                </button>

                <button
                  onClick={() => handleRate('good')}
                  className="py-3 px-2 rounded-2xl bg-[var(--md-secondary-container)] border border-[var(--md-outline-variant)] text-[var(--md-on-secondary-container)] font-bold text-xs flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                >
                  <span>Good</span>
                  <span className="text-[10px] font-normal opacity-80">3-7 days</span>
                </button>

                <button
                  onClick={() => handleRate('easy')}
                  className="py-3 px-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                >
                  <span>Easy</span>
                  <span className="text-[10px] font-normal opacity-80">14+ days</span>
                </button>
              </motion.div>
            ) : (
              <button
                onClick={handleFlip}
                className="w-full py-3.5 rounded-2xl bg-[var(--md-surface-container-high)] text-[var(--md-primary)] font-bold text-sm border border-[var(--md-outline-variant)] flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                <span>Show Answer</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Flashcard Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-5 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] shadow-xl flex flex-col gap-4 text-[var(--md-on-surface)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Add New Flashcard</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)]"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCard} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase block mb-1">Deck / Subject</label>
                  <input
                    type="text"
                    value={newDeck}
                    onChange={e => setNewDeck(e.target.value)}
                    placeholder="e.g. Biology, System Design"
                    className="w-full p-2.5 rounded-xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase block mb-1">Front (Question)</label>
                  <textarea
                    value={newFront}
                    onChange={e => setNewFront(e.target.value)}
                    placeholder="Type question or prompt..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase block mb-1">Back (Answer)</label>
                  <textarea
                    value={newBack}
                    onChange={e => setNewBack(e.target.value)}
                    placeholder="Type clear, concise answer..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--md-on-surface-variant)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-xs shadow-sm"
                  >
                    Save Flashcard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveRecall;

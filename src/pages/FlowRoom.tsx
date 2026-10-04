import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Plus, 
  CheckCircle2, 
  ChevronLeft, 
  Sparkles,
  Flame,
  Target
} from 'lucide-react';
import { OrbiCompanion } from '../components/illustrations/OrbiCompanion';
import { haptics } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import { AppData, StudySession, NoteItem } from '../types';

interface FlowRoomProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

type Soundscape = 'none' | 'brown' | 'binaural';

export const FlowRoom: React.FC<FlowRoomProps> = ({ data, updateData }) => {
  const navigate = useNavigate();

  // Timer states
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('Deep Focus Session');
  
  // Distraction scratchpad
  const [scratchText, setScratchText] = useState('');
  const [scratchSaved, setScratchSaved] = useState(false);
  
  // Ambient Sound generator via Web Audio API
  const [activeSound, setActiveSound] = useState<Soundscape>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Available tasks to lock into
  const pendingTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => !t.completed);
  }, [data?.tasks]);

  useEffect(() => {
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  // Main countdown loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          if (prev <= 4 && prev > 1) {
            haptics.tick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle session completion
  const handleCompleteSession = async () => {
    setIsRunning(false);
    stopSound();
    haptics.milestone();
    triggerConfettiBurst();

    const newSession: StudySession = {
      id: `session-${Date.now()}`,
      subject: selectedTask,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: durationMinutes,
      notes: 'Completed in Flow Room',
    };

    const updatedSessions = [newSession, ...(data?.studySessions || [])];
    await updateData({ studySessions: updatedSessions });
  };

  // Web Audio Synthesizer for Zero-Download Ambient Noise
  const startBrownNoise = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain boost
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);

      whiteNoise.connect(gainNode);
      gainNode.connect(ctx.destination);
      whiteNoise.start();

      noiseNodeRef.current = whiteNoise;
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }
  };

  const startBinauralTone = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime); // 140Hz carrier
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      noiseNodeRef.current = osc;
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }
  };

  const stopSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop();
        (noiseNodeRef.current as any).disconnect();
      } catch {}
      noiseNodeRef.current = null;
    }
    setActiveSound('none');
  };

  const toggleSound = (sound: Soundscape) => {
    haptics.tap();
    if (activeSound === sound) {
      stopSound();
    } else {
      stopSound();
      setActiveSound(sound);
      if (sound === 'brown') startBrownNoise();
      if (sound === 'binaural') startBinauralTone();
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Save distraction to Notes Inbox
  const handleSaveDistraction = async () => {
    if (!scratchText.trim()) return;
    haptics.save();
    const todayStr = new Date().toISOString().split('T')[0];
    const newNote: NoteItem = {
      id: `distraction-${Date.now()}`,
      title: scratchText.trim(),
      content: `Logged from Flow Room during focus on: ${selectedTask}`,
      pageView: 'lined',
      monthKey: todayStr.substring(0, 7),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentNotes = data?.notes || [];
    await updateData({ notes: [newNote, ...currentNotes] });

    setScratchText('');
    setScratchSaved(true);
    setTimeout(() => setScratchSaved(false), 2000);
  };

  // Time formatted string
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100;

  return (
    <div className="w-full space-y-4 max-w-lg mx-auto flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopSound();
            navigate('/');
          }}
          className="p-2 -ml-2 rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-surface-container-high)] text-xs font-bold text-[var(--md-primary)] border border-[var(--md-outline-variant)]">
          <Flame size={14} />
          <span>Deep Work Flow Room</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Focus Intention / Task Selector */}
      <div className="flex flex-col items-center gap-2 text-center my-2">
        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-primary)] uppercase tracking-wider">
          <Target size={13} />
          <span>Locked Intention</span>
        </div>
        <select
          value={selectedTask}
          onChange={e => {
            setSelectedTask(e.target.value);
            haptics.tap();
          }}
          disabled={isRunning}
          aria-label="Selected Task or Focus Intention"
          className="max-w-[280px] px-3 py-2 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] text-sm font-bold text-[var(--md-on-surface)] text-center truncate focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)]"
        >
          <option value="Deep Focus Session">Deep Focus Session</option>
          {pendingTasks.map(t => (
            <option key={t.id} value={t.text}>{t.text}</option>
          ))}
        </select>
      </div>

      {/* Central Large Timer Display */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        {/* Subtle background circular track */}
        <div className="relative w-64 h-64 rounded-full border-4 border-[var(--md-surface-container-highest)] flex flex-col items-center justify-center shadow-inner">
          {/* Active progress ring fill */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="var(--md-primary)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={753.98}
              strokeDashoffset={753.98 - (753.98 * progressPercent) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <span className="text-5xl font-black text-[var(--md-on-surface)] tracking-tight font-mono">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>

          <span className="text-xs font-semibold text-[var(--md-on-surface-variant)] mt-1">
            {isRunning ? 'Flow State Active' : 'Ready to Focus'}
          </span>

          <div className="mt-3">
            <OrbiCompanion variant={isRunning ? 'habits-fresh' : 'tasks-empty'} size={48} />
          </div>
        </div>
      </div>

      {/* Preset Duration Buttons */}
      {!isRunning && (
        <div className="flex items-center justify-center gap-2 mb-3">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => {
                setDurationMinutes(mins);
                haptics.tap();
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                durationMinutes === mins
                  ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] border-[var(--md-primary)] shadow-sm'
                  : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)]'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      {/* Main Play / Pause Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            haptics.tap();
            setTimeLeft(durationMinutes * 60);
            setIsRunning(false);
          }}
          className="p-3.5 rounded-full bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] border border-[var(--md-outline-variant)] shadow-sm"
          aria-label="Reset Timer"
        >
          <RotateCcw size={20} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            haptics.tap();
            setIsRunning(!isRunning);
          }}
          className="px-8 py-4 rounded-3xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-black text-lg flex items-center gap-3 shadow-lg"
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} className="fill-[var(--md-on-primary)]" />}
          <span>{isRunning ? 'Pause' : 'Start Flow'}</span>
        </motion.button>

        {/* Ambient Noise Toggles */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => toggleSound('brown')}
          className={`p-3.5 rounded-full border shadow-sm transition-all ${
            activeSound === 'brown'
              ? 'bg-[var(--md-secondary-container)] text-[var(--md-secondary)] border-[var(--md-secondary)]'
              : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)]'
          }`}
          title="Toggle Ambient Brown Noise"
          aria-label="Toggle Ambient Brown Noise"
        >
          {activeSound === 'brown' ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </motion.button>
      </div>

      {/* Distraction Scratchpad */}
      <div className="p-3.5 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col gap-2 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] flex items-center gap-1">
            <Sparkles size={12} className="text-[var(--md-primary)]" />
            <span>Distraction Dump Scratchpad</span>
          </span>
          {scratchSaved && (
            <span className="text-[10px] font-bold text-[var(--md-primary)] flex items-center gap-1">
              <CheckCircle2 size={11} /> Saved to Inbox
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={scratchText}
            onChange={e => setScratchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveDistraction()}
            placeholder="Got a random thought? Type & press Enter..."
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:outline-none focus:ring-1 focus:ring-[var(--md-primary)]"
          />
          <button
            onClick={handleSaveDistraction}
            disabled={!scratchText.trim()}
            className="p-2 rounded-xl bg-[var(--md-primary)] text-[var(--md-on-primary)] disabled:opacity-40 transition-opacity"
            aria-label="Save distraction note"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowRoom;

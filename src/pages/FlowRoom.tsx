import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AppData, StudySession } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import { handleAppBack } from '../utils/backNavigation';
import {
  Segmented,
  Ring,
  Play,
  Pause,
  ArrowClockwise,
  Headphones,
  Waveform,
  CaretLeft,
  Check,
} from '../ui';

interface FlowRoomProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

type ModeType = 'pomodoro' | 'deep' | 'ultra';
type Soundscape = 'none' | 'brown' | 'rain';

export default function FlowRoom({ data, updateData }: FlowRoomProps) {
  const navigate = useNavigate();

  const [mode, setMode] = useState<ModeType>('pomodoro');
  const durationMap: Record<ModeType, number> = {
    pomodoro: 25 * 60,
    deep: 50 * 60,
    ultra: 90 * 60,
  };

  const [timeLeft, setTimeLeft] = useState(durationMap.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [subject] = useState('Deep Work Session');
  const [sound, setSound] = useState<Soundscape>('none');

  // Audio Context for Zero-Download Web Audio Noise Synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Update timer on mode change
  useEffect(() => {
    setIsRunning(false);
    setTimeLeft(durationMap[mode]);
  }, [mode]);

  // Main countdown loop
  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          if (prev <= 4 && prev > 1) {
            triggerHaptic('light');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleCompleteSession = async () => {
    setIsRunning(false);
    stopSound();
    triggerHaptic('milestone');
    triggerConfettiBurst();

    const durationMins = Math.round(durationMap[mode] / 60);
    const newSession: StudySession = {
      id: `session_${Date.now()}`,
      subject,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: durationMins,
      notes: 'Completed in Flow Room',
    };

    const updated = [newSession, ...(data.studySessions || [])];
    await updateData({ studySessions: updated });
  };

  // Soundscape synthesizers
  const startBrownNoise = () => {
    stopSound();
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const channelData = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        channelData[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = channelData[i];
        channelData[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0.15;

      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noiseNodeRef.current = noise;
    } catch {}
  };

  const stopSound = () => {
    try {
      if (noiseNodeRef.current) {
        (noiseNodeRef.current as any).stop();
        noiseNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {}
  };

  const toggleSound = (target: Soundscape) => {
    triggerHaptic('selection');
    if (sound === target) {
      setSound('none');
      stopSound();
    } else {
      setSound(target);
      if (target === 'brown' || target === 'rain') {
        startBrownNoise();
      }
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = 1 - timeLeft / durationMap[mode];

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-between p-4 overflow-hidden selection:bg-[#64D2FF]/30">
      {/* Top Bar */}
      <div className="pt-[env(safe-area-inset-top,12px)] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            stopSound();
            handleAppBack(navigate);
          }}
          className="w-10 h-10 rounded-full glass-flat flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        <span className="text-xs font-semibold text-[rgba(235,235,245,0.70)]">
          Flow Room
        </span>

        <div className="px-3 py-1 rounded-full glass-flat text-[#64D2FF] text-xs font-bold shadow-sm">
          {subject}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="max-w-xs mx-auto w-full pt-1">
        <Segmented<ModeType>
          options={[
            { value: 'pomodoro', label: '25 min' },
            { value: 'deep', label: '50 min' },
            { value: 'ultra', label: '90 min' },
          ]}
          value={mode}
          onChange={setMode}
          tint="#64D2FF"
        />
      </div>

      {/* Center 96pt Display Numeral & Concentric Ring */}
      <div className="flex-1 flex flex-col items-center justify-center select-none py-2 min-h-0">
        <Ring
          progress={progress}
          size={Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.68 : 250, 260)}
          strokeWidth={8}
          color="#64D2FF"
          trackColor="rgba(255, 255, 255, 0.06)"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[64px] sm:text-[72px] font-black text-white tabular-nums tracking-[-0.04em] leading-none">
              {mins}:{secs < 10 ? `0${secs}` : secs}
            </span>
            <span className="text-xs font-semibold text-[rgba(235,235,245,0.50)] tracking-wider mt-2">
              {isRunning ? 'Focus Active' : 'Paused'}
            </span>
          </div>
        </Ring>

        {/* Ambient Soundscapes Glass Pill */}
        <div className="mt-5 flex items-center gap-1.5 p-1.5 rounded-full glass-flat">
          <button
            type="button"
            onClick={() => toggleSound('brown')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sound === 'brown'
                ? 'bg-[#64D2FF] text-black font-bold shadow-sm'
                : 'text-[rgba(235,235,245,0.60)] hover:text-white'
            }`}
          >
            <Waveform size={14} weight="bold" />
            <span>Brown Noise</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSound('rain')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sound === 'rain'
                ? 'bg-[#64D2FF] text-black font-bold shadow-sm'
                : 'text-[rgba(235,235,245,0.60)] hover:text-white'
            }`}
          >
            <Headphones size={14} weight="bold" />
            <span>Ambient Rain</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls inside safe area */}
      <div className="flex items-center justify-center gap-6 pb-[max(env(safe-area-inset-bottom,16px),16px)] pt-1">
        {/* Reset Action */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsRunning(false);
            setTimeLeft(durationMap[mode]);
          }}
          className="w-12 h-12 rounded-full glass-flat flex items-center justify-center text-[rgba(235,235,245,0.70)] hover:text-white active:scale-95 transition-transform"
        >
          <ArrowClockwise size={20} weight="bold" />
        </button>

        {/* Big 64px Glass Play/Pause Trigger */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            setIsRunning(!isRunning);
          }}
          className="w-16 h-16 rounded-full glass-nav nav-rim-light flex items-center justify-center text-[#64D2FF] text-3xl shadow-xl active:scale-95 transition-transform"
        >
          {isRunning ? <Pause weight="fill" /> : <Play weight="fill" className="pl-1" />}
        </button>

        {/* Complete Action */}
        <button
          type="button"
          onClick={handleCompleteSession}
          className="w-12 h-12 rounded-full glass-flat flex items-center justify-center text-[#30D158] active:scale-95 transition-transform"
        >
          <Check size={20} weight="bold" />
        </button>
      </div>
    </div>
  );
}

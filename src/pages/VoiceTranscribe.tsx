import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  ListTodo,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus
} from 'lucide-react';
import { OrbiCompanion } from '../components/illustrations/OrbiCompanion';
import { haptics } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { triggerConfettiBurst } from '../utils/confetti';
import { transcribeAudio } from '../services/aiClient';
import { speakText, stopSpeaking, isSpeaking } from '../utils/textToSpeech';
import { AppData, Task, NoteItem } from '../types';

interface VoiceTranscribeProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

export const VoiceTranscribe: React.FC<VoiceTranscribeProps> = ({ data, updateData }) => {
  const navigate = useNavigate();

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [extractedNotes, setExtractedNotes] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [savedTasks, setSavedTasks] = useState<Record<number, boolean>>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Recording timer loop
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    haptics.tap();
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          if (text) {
            setTranscript(text);
            generateSmartSummary(text);
            haptics.save();
          } else {
            setErrorMessage('No speech detected in recording.');
          }
        } catch (err: any) {
          console.warn('Transcription error:', err);
          setErrorMessage(err?.message || 'Voice transcription failed. Please verify API key and network.');
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e: any) {
      console.warn('Mic access error:', e);
      setErrorMessage('Microphone access denied or not available. Please grant audio permission.');
    }
  };

  const stopRecording = () => {
    haptics.tap();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Extract structured notes and tasks from transcript
  const generateSmartSummary = (text: string) => {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const bullets = sentences.slice(0, 3);
    setSummary(bullets);

    // Identify task-like sentences
    const tasks = sentences.filter(s => 
      s.toLowerCase().includes('need to') ||
      s.toLowerCase().includes('homework') ||
      s.toLowerCase().includes('assignment') ||
      s.toLowerCase().includes('finish') ||
      s.toLowerCase().includes('submit') ||
      s.toLowerCase().includes('review')
    );
    setExtractedTasks(tasks);

    // Identify key takeaways
    setExtractedNotes(sentences.filter(s => !tasks.includes(s)).slice(0, 2));
  };

  const handleSaveTask = async (taskText: string, index: number) => {
    haptics.save();
    const todayStr = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      id: `task-voice-${Date.now()}`,
      text: taskText,
      completed: false,
      date: todayStr,
      dueDate: todayStr,
    };

    const currentTasks = data?.tasks || [];
    await updateData({ tasks: [newTask, ...currentTasks] });
    setSavedTasks(prev => ({ ...prev, [index]: true }));
  };

  const handleSaveToNotes = async () => {
    if (!transcript) return;
    haptics.milestone();
    triggerConfettiBurst();

    const todayStr = new Date().toISOString().split('T')[0];
    const newNote: NoteItem = {
      id: `note-voice-${Date.now()}`,
      title: summary[0] || 'Voice Lecture Summary',
      content: `### Executive Summary\n${summary.map(s => `• ${s}`).join('\n')}\n\n### Full Transcript\n${transcript}`,
      pageView: 'lined',
      monthKey: todayStr.substring(0, 7),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentNotes = data?.notes || [];
    await updateData({ notes: [newNote, ...currentNotes] });
    navigate('/notes');
  };

  const toggleSpeakSummary = () => {
    haptics.tap();
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      const fullText = summary.join('. ');
      setSpeaking(true);
      speakText(fullText, (isLive) => {
        if (!isLive) setSpeaking(false);
      });
    }
  };

  const recordMins = Math.floor(recordSeconds / 60);
  const recordSecs = recordSeconds % 60;

  return (
    <div className="w-full space-y-4 max-w-lg mx-auto flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAppBack(navigate)}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] transition-colors active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-primary)] uppercase tracking-wider">
              <Mic size={14} />
              <span>Voice Lecture & Meeting</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--md-on-surface)] tracking-tight">
              Smart Transcriber
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Record Button & Visual Wave */}
      <div className="p-6 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col items-center justify-center text-center gap-4 shadow-sm">
        <div className="relative">
          {/* Animated Glow Pulse when recording */}
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-red-500/30"
            />
          )}

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
            }`}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording Voice'}
          >
            {isRecording ? <Square size={28} className="fill-white" /> : <Mic size={32} />}
          </motion.button>
        </div>

        <div>
          <span className="text-xs font-bold text-[var(--md-primary)] uppercase tracking-wider block font-mono">
            {isRecording
              ? `Recording: ${String(recordMins).padStart(2, '0')}:${String(recordSecs).padStart(2, '0')}`
              : transcribing
              ? 'Transcribing with Groq Whisper...'
              : 'Tap to Record Voice or Lecture'}
          </span>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 max-w-xs">
            {isRecording ? 'Listening live... tap square to finalize and extract notes.' : 'Powered by high-speed Groq Whisper AI.'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-bold underline text-red-300 hover:text-white ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Transcript & Summary Content */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            {/* 3-Bullet Executive Summary Card */}
            <div className="p-4 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--md-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Luna Executive Summary</span>
                </span>
                <button
                  onClick={toggleSpeakSummary}
                  className="p-1.5 rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] flex items-center gap-1 text-xs"
                >
                  {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{speaking ? 'Stop' : 'Listen'}</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {summary.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-medium text-[var(--md-on-surface)] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)] mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Tasks Card */}
            {extractedTasks.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col gap-2.5 shadow-xs">
                <span className="text-xs font-bold text-[var(--md-on-surface)] uppercase tracking-wider flex items-center gap-1.5">
                  <ListTodo size={14} className="text-[var(--md-primary)]" />
                  <span>Action Items & Tasks</span>
                </span>

                <div className="flex flex-col gap-2">
                  {extractedTasks.map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--md-on-surface)] truncate flex-1">
                        {t}
                      </span>
                      <button
                        onClick={() => handleSaveTask(t, idx)}
                        disabled={savedTasks[idx]}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 shrink-0 ${
                          savedTasks[idx]
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                        }`}
                      >
                        {savedTasks[idx] ? <Check size={11} /> : <Plus size={11} />}
                        <span>{savedTasks[idx] ? 'Added' : 'Add to Tasks'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Transcript Expandable */}
            <div className="p-4 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col gap-2">
              <span className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase tracking-wider">
                Full Audio Transcript
              </span>
              <p className="text-xs text-[var(--md-on-surface)] leading-relaxed italic bg-[var(--md-surface-container-highest)] p-3 rounded-xl border border-[var(--md-outline-variant)]">
                "{transcript}"
              </p>
            </div>

            {/* Commit to Notes Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSaveToNotes}
              className="w-full py-4 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <FileText size={18} />
              <span>Save Full Summary to Notes & Ideas</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State / Luna Companion */}
      {!transcript && (
        <div className="mt-auto p-4 rounded-3xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex items-center gap-3">
          <OrbiCompanion variant="notes-spark" size={56} />
          <div>
            <span className="text-xs font-bold text-[var(--md-primary)] block">Luna Voice Intelligence</span>
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Records lectures or meetings and extracts summaries, action tasks, and study points instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceTranscribe;

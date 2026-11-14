import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LunaComicBubbleIcon,
  NeuralInfinityIcon,
  PaperPlaneRight,
  Microphone,
  Stop,
  Copy,
  Trash,
  X,
  WifiSlash,
  WarningCircle,
  Check,
  ArrowClockwise,
  SpinnerGap,
  Wallet,
  CheckSquare,
  Barbell,
  NotePencil,
  ChatCircleText,
  ClockCounterClockwise,
  MagnifyingGlass,
  Plus,
  SpeakerHigh,
  ShareNetwork,
  Camera,
  ImageIcon,
  Globe,
  CaretDown,
} from '../../ui/tokens/icons';
import { Capacitor } from '@capacitor/core';
import WebcamCaptureModal from './WebcamCaptureModal';
import {
  capturePhotoFromCamera,
  pickPhotoFromGallery,
  processFileToAttachedImage,
  AttachedImage,
} from '../../utils/imagePicker';
import { GlassSurface } from '../../ui/glass/GlassSurface';
import { Sheet } from '../../ui/feedback/Sheet';
import { GROQ_CONFIG } from '../../config/ai';
import { getHasAgreedConsent } from '../../utils/aiSecurity';
import { streamChatCompletion, transcribeAudio, stripUrls, ChatMessage } from '../../services/aiClient';
import { extractAiActionProposals, AiActionProposal } from '../../services/aiActionEngine';
import { buildTargetedAiContext } from '../../services/aiContextBuilder';
import { recordScreenView } from '../../services/aiUsageTracker';
import { triggerHaptic } from '../../utils/haptics';
import { speakText, stopSpeaking } from '../../utils/textToSpeech';
import { shareContent } from '../../utils/shareUtils';
import FormattedAiMessage from './FormattedAiMessage';
import ActionConfirmationCard from './ActionConfirmationCard';
import type { AiChatSession } from '../../types';
import { auth } from '../../firebase';
import { getCachedUserName } from '../../utils/dailyBriefEngine';

interface AskLifeOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  updateData: (partial: any) => Promise<any>;
}

export const SPEC_STARTER_CHIPS = [
  { id: 'tasks_today', label: 'What are my top tasks today?', icon: <CheckSquare size={16} weight="duotone" className="text-[#0A84FF]" />, tint: '#0A84FF' },
  { id: 'notes_summary', label: 'What notes did I capture recently?', icon: <NotePencil size={16} weight="duotone" className="text-[#64D2FF]" />, tint: '#64D2FF' },
  { id: 'gym_split', label: 'What workout is scheduled today?', icon: <Barbell size={16} weight="duotone" className="text-[#FF453A]" />, tint: '#FF453A' },
  { id: 'budget_status', label: 'Am I within my daily spending limit?', icon: <Wallet size={16} weight="duotone" className="text-[#30D158]" />, tint: '#30D158' },
];

export default function AskLifeOSModal({ isOpen, onClose, data, updateData }: AskLifeOSModalProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const userGreetingName = React.useMemo(() => {
    try {
      if (auth.currentUser?.displayName) {
        return auth.currentUser.displayName.split(' ')[0];
      }
    } catch {}
    const cached = getCachedUserName();
    if (cached) return cached;
    return 'there';
  }, []);

  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [actionProposals, setActionProposals] = useState<Record<string, AiActionProposal[]>>({});
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isImageMenuOpen) return;
    const handleClickOutside = (e: PointerEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)) {
        setIsImageMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isImageMenuOpen]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedMimeRef = useRef<string>('audio/webm');
  const speechRecognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Auto-expand textarea height as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 120)}px`;
    }
  }, [inputQuery]);

  // Auto focus & cleanup on modal open/close
  useEffect(() => {
    if (isOpen) {
      recordScreenView('Ask LifeOS Assistant');
      const timer = setTimeout(() => {
        if (activeTab === 'chat') {
          inputRef.current?.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopSpeaking();
      setSpeakingMsgId(null);
      setIsImageMenuOpen(false);
    }
  }, [isOpen, activeTab]);

  // Persist messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current && activeTab === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isGenerating, activeTab]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const persistSessionToHistory = (sessionMessages: ChatMessage[], currentSessionId: string | null) => {
    if (sessionMessages.length === 0) return currentSessionId;
    const firstUserMsg = sessionMessages.find(m => m.role === 'user');
    if (!firstUserMsg) return currentSessionId;

    const title = firstUserMsg.content.slice(0, 48) || 'Untitled Search';
    const existingHistory: AiChatSession[] = data?.aiChatHistory || [];
    const sessionId = currentSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const sessionObj: AiChatSession = {
      id: sessionId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pathname: location.pathname || '/',
      messages: sessionMessages,
    };

    const existingIndex = existingHistory.findIndex(s => s.id === sessionId);
    let updatedHistory: AiChatSession[] = [];
    if (existingIndex >= 0) {
      updatedHistory = [...existingHistory];
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        updatedAt: new Date().toISOString(),
        messages: sessionMessages,
      };
    } else {
      updatedHistory = [sessionObj, ...existingHistory];
    }

    updateData({ aiChatHistory: updatedHistory });
    try {
      localStorage.setItem('lifeos_ai_history_sessions', JSON.stringify(updatedHistory));
    } catch {}

    return sessionId;
  };

  const handleStartNewChat = () => {
    triggerHaptic('medium');
    setMessages([]);
    setActionProposals({});
    setAttachedImages([]);
    setIsImageMenuOpen(false);
    setErrorMessage(null);
    setActiveSessionId(null);
    setActiveTab('chat');
    try {
      localStorage.removeItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleReopenSession = (session: AiChatSession) => {
    triggerHaptic('light');
    setMessages(session.messages || []);
    setActiveSessionId(session.id);
    setActiveTab('chat');
    setErrorMessage(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    const updated = (data?.aiChatHistory || []).filter((s: any) => s.id !== sessionId);
    updateData({ aiChatHistory: updated });
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
    setToastMessage('Session deleted.');
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCaptureCamera = async () => {
    setIsImageMenuOpen(false);
    if (attachedImages.length >= 3) {
      setToastMessage('Maximum 3 photos allowed.');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      triggerHaptic('medium');
      setPickingImage(true);
      try {
        const img = await capturePhotoFromCamera();
        if (img) {
          setAttachedImages((prev) => [...prev.slice(0, 2), img]);
          triggerHaptic('success');
        }
      } catch (err: any) {
        setErrorMessage('Camera capture failed: ' + (err.message || 'Error'));
      } finally {
        setPickingImage(false);
      }
      return;
    }

    // On Laptop / Desktop: Open sleek webcam capture modal
    setIsWebcamOpen(true);
  };

  const handlePickGallery = async () => {
    setIsImageMenuOpen(false);
    if (attachedImages.length >= 3) {
      setToastMessage('Maximum 3 photos allowed.');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      triggerHaptic('light');
      setPickingImage(true);
      try {
        const img = await pickPhotoFromGallery();
        if (img) {
          setAttachedImages((prev) => [...prev.slice(0, 2), img]);
          triggerHaptic('success');
        }
      } catch (err: any) {
        setErrorMessage('Photo upload failed: ' + (err.message || 'Error'));
      } finally {
        setPickingImage(false);
      }
      return;
    }

    // On Laptop / Desktop: Synchronously trigger hidden file input
    triggerHaptic('light');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 3 - attachedImages.length;
    if (remainingSlots <= 0) {
      setToastMessage('Maximum 3 photos allowed.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    setPickingImage(true);

    try {
      const newImages: AttachedImage[] = [];
      for (const file of filesToProcess) {
        const attached = await processFileToAttachedImage(file);
        if (attached) newImages.push(attached);
      }

      if (newImages.length > 0) {
        setAttachedImages((prev) => [...prev, ...newImages].slice(0, 3));
        triggerHaptic('success');
      }
    } catch (err: any) {
      setErrorMessage('Failed to load selected photo: ' + (err.message || 'Error'));
    } finally {
      setPickingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imgId: string) => {
    triggerHaptic('light');
    setAttachedImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const handleSendQuery = async (queryText: string = inputQuery) => {
    const trimmed = queryText.trim();
    const imagesToSend = attachedImages.map((i) => i.dataUrl);
    const hasImages = imagesToSend.length > 0;

    if (!trimmed && !hasImages) return;
    if (isGenerating) return;

    triggerHaptic('selection');
    setInputQuery('');
    setAttachedImages([]);
    setIsImageMenuOpen(false);
    setErrorMessage(null);

    const userMessageId = `msg_${Date.now()}_u`;
    const assistantMessageId = `msg_${Date.now()}_a`;

    const userMsgContent = trimmed || (hasImages ? 'Please extract all notes and points from these images, sort out the information by topic, and ask which interfaces to add them to.' : '');

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userMsgContent,
      timestamp: new Date().toISOString(),
      images: hasImages ? imagesToSend : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsGenerating(true);

    const initialAssistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages([...newMessages, initialAssistantMsg]);

    const targetedContext = buildTargetedAiContext(userMsgContent, data);
    abortControllerRef.current = new AbortController();

    try {
      let accumulatedResponse = '';
      let pendingToken = '';
      let rafId: number | null = null;

      const scheduleTokenUpdate = (token: string) => {
        pendingToken = token;
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            accumulatedResponse = pendingToken;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedResponse }
                  : msg
              )
            );
            rafId = null;
          });
        }
      };

      await streamChatCompletion(
        newMessages.map((m) => ({ role: m.role, content: m.content, images: m.images })),
        location.pathname || '/',
        targetedContext,
        (token: string) => {
          scheduleTokenUpdate(token);
        },
        (fullText: string) => {
          accumulatedResponse = fullText;
          const { proposals } = extractAiActionProposals(accumulatedResponse);
          if (proposals.length > 0) {
            setActionProposals((prev) => ({
              ...prev,
              [assistantMessageId]: proposals,
            }));
          }

          const finalMessages = newMessages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: accumulatedResponse } : m
          );

          const updatedSessionId = persistSessionToHistory(finalMessages, activeSessionId);
          setActiveSessionId(updatedSessionId);
        },
        (err: Error) => {
          setErrorMessage(err.message || 'Unable to generate response.');
        },
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMessage('Query cancelled.');
      } else {
        setErrorMessage(err.message || 'Unable to generate response.');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleToggleVoiceRecord = async () => {
    triggerHaptic('medium');
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      setIsRecording(false);
      return;
    }

    // Determine the browser's supported audio MIME types
    const getSupportedAudioMime = () => {
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ];
      for (const t of candidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          return t;
        }
      }
      return '';
    };

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const chosenMime = getSupportedAudioMime();
        const mediaRecorder = chosenMime
          ? new MediaRecorder(stream, { mimeType: chosenMime })
          : new MediaRecorder(stream);

        const recordedMime = mediaRecorder.mimeType || chosenMime || 'audio/webm';
        recordedMimeRef.current = recordedMime;
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeRef.current });
          if (audioBlob.size === 0) return;

          setTranscribing(true);
          try {
            const { text, language: detectedLang } = await transcribeAudio(audioBlob);
            const trimmed = (text || '').trim();
            if (trimmed) {
              setInputQuery((prev) => (prev ? `${prev} ${trimmed}` : trimmed));
              if (detectedLang) {
                const capitalized = detectedLang.charAt(0).toUpperCase() + detectedLang.slice(1);
                setToastMessage(`Analyzed language: ${capitalized}`);
              }
              triggerHaptic('light');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Voice transcription failed.');
          } finally {
            setTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setErrorMessage(null);
        return;
      }
    } catch (err: any) {
      console.warn('MediaRecorder error, attempting SpeechRecognition fallback:', err);
    }

    // Fallback: Web Speech API (supports multilingual input natively)
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        speechRecognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
            triggerHaptic('light');
          }
        };

        recognition.onerror = (event: any) => {
          setErrorMessage('Speech recognition: ' + (event.error || 'error'));
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        setIsRecording(true);
        setErrorMessage(null);
        return;
      } catch (recErr: any) {
        console.error('Speech recognition fallback failed:', recErr);
      }
    }

    setErrorMessage('Microphone access denied or unavailable. Please enable microphone permissions in your browser or device settings.');
    setIsRecording(false);
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    triggerHaptic('light');
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      stopSpeaking();
      setSpeakingMsgId(msgId);
      speakText(text, (speaking) => {
        if (!speaking) setSpeakingMsgId(null);
      });
    }
  };

  const handleShareResponse = async (text: string) => {
    triggerHaptic('light');
    await shareContent(text, 'LifeOS AI Guide');
  };

  const historyItems: AiChatSession[] = data?.aiChatHistory || [];
  const filteredHistory = historyItems.filter((session) => {
    if (!searchHistoryQuery.trim()) return true;
    const query = searchHistoryQuery.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(query);
    const messageMatch = session.messages.some((m) => m.content.toLowerCase().includes(query));
    return titleMatch || messageMatch;
  });

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent="full"
      className="bg-[#000000]/95 backdrop-blur-2xl"
      contentClassName="flex flex-col h-full p-0 overflow-hidden"
      title={
        <div className="flex items-center justify-between w-full px-1 font-sans-flex">
          {/* Left: Luna AI Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full glass-flat border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-white">
              <LunaComicBubbleIcon size={18} />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="font-bold text-[17px] text-white tracking-tight leading-tight font-sans-flex">Luna AI</span>
              <span className="text-[11px] text-[rgba(235,235,245,0.60)] leading-none font-sans-flex">Powered by Groq</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && activeTab === 'chat' && (
              <button
                type="button"
                title="New Chat"
                onClick={handleStartNewChat}
                className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white/80 hover:text-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white/80 hover:text-white flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Close"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full w-full min-w-0 font-sans-flex select-none">
        {/* Full-width Segmented Mode Tabs below header */}
        <div className="px-4 pt-1 pb-2 shrink-0 w-full">
          <div className="flex items-center p-1 rounded-full glass-flat w-full select-none">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('chat');
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold font-sans-flex transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white/[0.14] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ChatCircleText size={14} weight="bold" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('history');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold font-sans-flex transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white/[0.14] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ClockCounterClockwise size={14} weight="bold" />
              <span>History</span>
              {historyItems.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[9px] flex items-center justify-center font-bold">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="mx-4 mb-2 px-3.5 py-2 rounded-2xl glass-tile flex items-center gap-2 text-[#FF9F0A] text-xs font-semibold font-sans-flex shrink-0">
            <WifiSlash size={16} weight="bold" className="shrink-0" />
            <span className="text-white/80">You are offline. Luna AI requires internet access.</span>
          </div>
        )}

        {/* ── Chat Tab View ── */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Message History or Empty State */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 space-y-3.5 overscroll-contain touch-pan-y w-full min-w-0"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                  {/* Clean Minimal Luna Orb */}
                  <div className="relative flex items-center justify-center my-1 text-white">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full glass-nav nav-rim-light shadow-xl flex items-center justify-center relative border border-white/10">
                      <LunaComicBubbleIcon size={34} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight font-sans-flex">
                      Hi, {userGreetingName}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 max-w-xs mx-auto mt-1 leading-relaxed font-sans-flex">
                      I analyze your tasks, timetable, notes, workouts, and budget using Groq AI.
                    </p>
                  </div>

                  {/* Quick Start: Scan Notes & Vision Cards */}
                  <div className="w-full max-w-md mx-auto pt-1 space-y-2 select-none">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider font-sans-flex">
                        Quick Start: Scan Notes
                      </span>
                      <span className="text-[10px] text-[#BF5AF2] font-semibold font-sans-flex px-2 py-0.5 rounded-full bg-[#BF5AF2]/10 border border-[#BF5AF2]/20">
                        Groq Vision (Max 3)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Take Photo Card */}
                      <button
                        type="button"
                        onClick={handleCaptureCamera}
                        className="glass-tile p-3 text-left flex flex-col justify-between rounded-2xl group active:scale-[0.97] transition-all cursor-pointer h-24 border border-white/10 hover:border-[#0A84FF]/40 shadow-sm"
                      >
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#0A84FF]/20 text-[#0A84FF]">
                          <Camera size={16} weight="duotone" />
                        </div>
                        <div>
                          <span className="text-[12px] font-bold text-white leading-tight block group-hover:text-[#0A84FF] font-sans-flex">
                            {Capacitor.isNativePlatform() ? 'Take Photo' : 'Open Webcam'}
                          </span>
                          <span className="text-[10px] text-white/50 leading-tight block mt-0.5 font-sans-flex">
                            Scan exam &amp; notes
                          </span>
                        </div>
                      </button>

                      {/* Upload Photo Card */}
                      <button
                        type="button"
                        onClick={handlePickGallery}
                        className="glass-tile p-3 text-left flex flex-col justify-between rounded-2xl group active:scale-[0.97] transition-all cursor-pointer h-24 border border-white/10 hover:border-[#BF5AF2]/40 shadow-sm"
                      >
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#BF5AF2]/20 text-[#BF5AF2]">
                          <ImageIcon size={16} weight="duotone" />
                        </div>
                        <div>
                          <span className="text-[12px] font-bold text-white leading-tight block group-hover:text-[#BF5AF2] font-sans-flex">
                            {Capacitor.isNativePlatform() ? 'Upload Photo' : 'Upload Images'}
                          </span>
                          <span className="text-[10px] text-white/50 leading-tight block mt-0.5 font-sans-flex">
                            Pick from files (max 3)
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 4 Suggested Question Chips */}
                  <div className="w-full max-w-md mx-auto pt-2 space-y-1.5 select-none">
                    <div className="flex items-center px-1">
                      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider font-sans-flex">
                        Suggested Inquiries
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {SPEC_STARTER_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleSendQuery(chip.label)}
                          className="glass-tile p-3 text-left flex flex-col justify-between gap-2 rounded-2xl group active:scale-[0.97] transition-all cursor-pointer h-22"
                        >
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: `${chip.tint}20`, color: chip.tint }}
                          >
                            {chip.icon}
                          </div>
                          <span className="text-[12px] font-medium text-white/90 leading-tight line-clamp-2 group-hover:text-white font-sans-flex">
                            {chip.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const proposals = actionProposals[msg.id] || [];

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 w-full min-w-0`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`font-sans-flex min-w-0 ${
                          isUser
                            ? 'max-w-[85%] p-3.5 rounded-[22px] rounded-br-[6px] bg-[#0A84FF] text-white shadow-md self-end'
                            : 'w-full p-3.5 sm:p-4 rounded-[22px] rounded-tl-[6px] bg-[#141416] text-white/95 shadow-md border-none overflow-hidden'
                        }`}
                      >
                        {isUser ? (
                          <div>
                            {msg.images && msg.images.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {msg.images.map((imgSrc, i) => (
                                  <img
                                    key={i}
                                    src={imgSrc}
                                    alt={`Note attachment ${i + 1}`}
                                    className="w-16 h-16 rounded-xl object-cover border border-white/20 shadow-sm"
                                  />
                                ))}
                              </div>
                            )}
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans-flex">{msg.content}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <FormattedAiMessage content={msg.content} />
                            {msg.content === '' && isGenerating && (
                              <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/80 text-xs w-fit animate-pulse">
                                <SpinnerGap size={14} className="animate-spin text-[#38BDF8] shrink-0" />
                                <span className="font-sans-flex font-medium text-white/90">Choosing the best model for your question...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Proposals (1-Tap Save actions) */}
                      {!isUser && proposals.length > 0 && (
                        <div className="w-full max-w-sm space-y-2 pt-1 font-sans-flex">
                          {proposals.map((prop, idx) => (
                            <ActionConfirmationCard
                              key={idx}
                              proposal={prop}
                              updateData={updateData}
                              currentData={data}
                              onExecuted={(msg) => setToastMessage(msg)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Assistant Action Bar (Copy, Speak, Share) */}
                      {!isUser && msg.content && (
                        <div className="flex items-center gap-2 px-1 text-white/40 text-xs font-sans-flex">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-sans-flex"
                          >
                            {copiedId === msg.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.content)}
                            className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-sans-flex ${
                              speakingMsgId === msg.id ? 'text-[#BF5AF2]' : ''
                            }`}
                          >
                            <SpeakerHigh size={13} />
                            <span>{speakingMsgId === msg.id ? 'Stop' : 'Read'}</span>
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleShareResponse(msg.content)}
                            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-sans-flex"
                          >
                            <ShareNetwork size={13} />
                            <span>Share</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mx-4 my-1.5 p-2.5 rounded-2xl bg-red-500/15 text-red-300 text-xs flex items-center justify-between shrink-0 font-sans-flex">
                <div className="flex items-center gap-2">
                  <WarningCircle size={15} weight="bold" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── Bottom Floating Input Bar ── */}
            <div className="px-4 pt-2 pb-[max(env(safe-area-inset-bottom,0px),16px)] shrink-0 relative z-30">
              {/* Active Voice Recording Status Banner */}
              {isRecording && (
                <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-medium text-[11.5px]">Listening... (Auto-analyzing language)</span>
                  </div>
                  <span className="text-[10.5px] text-white/60">Tap mic when done</span>
                </div>
              )}
              {transcribing && (
                <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 text-xs text-white">
                  <SpinnerGap size={13} className="animate-spin text-[#0A84FF]" />
                  <span className="text-[11.5px]">Analyzing language & transcribing...</span>
                </div>
              )}
              {/* Quick Start Action Pills near Chat (when conversation is active & no photos staged) */}
              {messages.length > 0 && attachedImages.length === 0 && (
                <div className="flex items-center gap-1.5 mb-2 px-1 overflow-x-auto select-none">
                  <button
                    type="button"
                    onClick={handleCaptureCamera}
                    className="px-2.5 py-1 rounded-full glass-flat text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Camera size={13} weight="bold" className="text-[#0A84FF]" />
                    <span>{Capacitor.isNativePlatform() ? 'Take Photo' : 'Webcam'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePickGallery}
                    className="px-2.5 py-1 rounded-full glass-flat text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <ImageIcon size={13} weight="bold" className="text-[#BF5AF2]" />
                    <span>{Capacitor.isNativePlatform() ? 'Upload Photo' : 'Upload Images'}</span>
                  </button>
                </div>
              )}
              {/* Dropdown Menu for Camera vs Gallery (rendered outside GlassSurface to prevent overflow clipping) */}
              <AnimatePresence>
                {isImageMenuOpen && (
                  <motion.div
                    ref={imageMenuRef}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-[calc(100%-8px)] left-16 w-52 rounded-2xl bg-[#1C1C1E] border border-white/20 shadow-2xl p-1.5 z-50 space-y-1 pointer-events-auto"
                  >
                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <Camera size={15} weight="duotone" className="text-[#0A84FF]" />
                      <span>{Capacitor.isNativePlatform() ? 'Take Photo' : 'Open Webcam'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePickGallery}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <ImageIcon size={15} weight="duotone" className="text-[#BF5AF2]" />
                      <span>{Capacitor.isNativePlatform() ? 'Upload from Gallery' : 'Choose from Computer'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Attached Images Tray */}
              {attachedImages.length > 0 && (
                <div className="flex items-center gap-2 mb-2 px-1 py-1 overflow-x-auto">
                  {attachedImages.map((img) => (
                    <div key={img.id} className="relative shrink-0">
                      <img
                        src={img.dataUrl}
                        alt="Attached note"
                        className="w-14 h-14 rounded-2xl object-cover border border-white/25 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-col justify-center px-1">
                    <span className="text-[11px] font-semibold text-white/80">
                      {attachedImages.length}/3 photos
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">
                      Vision Active
                    </span>
                  </div>
                </div>
              )}

              <div
                className="rounded-[24px] p-1.5 flex items-end gap-1.5 shadow-2xl bg-[#1C1C1E] relative z-40 w-full"
              >
                {/* Voice Dictation Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  disabled={isGenerating || transcribing}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5 ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Voice Input'}
                >
                  {transcribing ? (
                    <SpinnerGap size={16} className="animate-spin text-white" />
                  ) : isRecording ? (
                    <Stop size={16} weight="bold" />
                  ) : (
                    <Microphone size={16} weight="bold" />
                  )}
                </button>

                {/* Camera / Attachment Button */}
                <div className="relative shrink-0 mb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (attachedImages.length >= 3) {
                        setToastMessage('Maximum 3 photos allowed.');
                        return;
                      }
                      setIsImageMenuOpen((prev) => !prev);
                    }}
                    disabled={isGenerating || pickingImage}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      attachedImages.length >= 3
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : isImageMenuOpen
                        ? 'bg-[#0A84FF] text-white shadow-md'
                        : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
                    }`}
                    title={attachedImages.length >= 3 ? 'Max 3 photos reached' : 'Attach note photo'}
                  >
                    {pickingImage ? (
                      <SpinnerGap size={16} className="animate-spin text-white" />
                    ) : (
                      <Camera size={16} weight="bold" />
                    )}
                  </button>
                </div>

                {/* Multi-line Auto-Expanding Textarea Field */}
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  placeholder={
                    transcribing
                      ? 'Analyzing language & transcribing...'
                      : isRecording
                      ? 'Listening to speech in any language...'
                      : attachedImages.length > 0
                      ? 'Type a message or tap send...'
                      : 'Ask Luna or say "Add task..."'
                  }
                  disabled={isGenerating}
                  className="flex-1 bg-transparent text-[14px] text-white placeholder-white/40 focus:outline-none px-2 py-1.5 min-w-0 font-sans-flex resize-none leading-relaxed overflow-y-auto max-h-[120px]"
                  style={{ minHeight: '24px' }}
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  disabled={(!inputQuery.trim() && attachedImages.length === 0) || isGenerating}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mb-0.5 ${
                    (inputQuery.trim() || attachedImages.length > 0) && !isGenerating
                      ? 'bg-gradient-to-tr from-[#0A84FF] to-[#BF5AF2] text-white shadow-md active:scale-95 cursor-pointer'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  {isGenerating ? (
                    <SpinnerGap size={16} className="animate-spin text-white" />
                  ) : (
                    <PaperPlaneRight size={16} weight="fill" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── History Tab View ── */
          <div className="flex-1 flex flex-col min-h-0 space-y-3 px-4 py-2 font-sans-flex">
            {/* Search History Pill */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full glass-flat text-white/80">
              <MagnifyingGlass size={16} className="text-white/50" />
              <input
                type="text"
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                placeholder="Search past conversations..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none font-sans-flex"
              />
              {searchHistoryQuery && (
                <button type="button" onClick={() => setSearchHistoryQuery('')}>
                  <X size={14} className="text-white/50 hover:text-white" />
                </button>
              )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2 overscroll-contain touch-pan-y">
              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-sm font-sans-flex">
                  {searchHistoryQuery ? 'No matching conversations found.' : 'No conversation history saved yet.'}
                </div>
              ) : (
                filteredHistory.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleReopenSession(session)}
                    className="p-3.5 rounded-[22px] glass-tile active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 rounded-2xl glass-flat text-[#BF5AF2] flex items-center justify-center shrink-0">
                        <ChatCircleText size={18} weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#BF5AF2] font-sans-flex">
                          {session.title}
                        </h4>
                        <span className="text-[10px] text-white/40 mt-0.5 block font-sans-flex">
                          {new Date(session.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' • '}
                          {session.messages.length} messages
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Delete Session"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden native file input for laptop & desktop fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Live Webcam Snapshot Modal for laptop/desktop */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCaptured={(img) => {
          setAttachedImages((prev) => [...prev.slice(0, 2), img]);
        }}
        onFallbackToFile={() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
          }
        }}
      />
    </Sheet>
  );
}

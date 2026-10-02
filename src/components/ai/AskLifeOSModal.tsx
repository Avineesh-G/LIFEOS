import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Mic,
  Square,
  Copy,
  Trash2,
  X,
  WifiOff,
  AlertCircle,
  Check,
  RotateCcw,
  Loader2,
  Wallet,
  CheckSquare,
  Dumbbell,
  Utensils,
  HelpCircle,
  Palette,
  Eye,
  ShieldCheck,
  History,
  MessageSquare,
  Search,
  Plus,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import GlassSheet from '../glass/GlassSheet';
import GlassSurface from '../glass/GlassSurface';
import GlowCard from '../glass/GlowCard';
import AiConsentSheet from './AiConsentSheet';
import ActionConfirmationCard from './ActionConfirmationCard';
import { GROQ_CONFIG } from '../../config/ai';
import { getGroqApiKey, getAiProxyUrl, getHasAgreedConsent, setGroqApiKey } from '../../utils/aiSecurity';
import { streamChatCompletion, transcribeAudio, stripUrls, ChatMessage } from '../../services/aiClient';
import { extractAiActionProposals, AiActionProposal } from '../../services/aiActionEngine';
import { buildTargetedAiContext } from '../../services/aiContextBuilder';
import { recordScreenView } from '../../services/aiUsageTracker';
import { triggerHaptic } from '../../utils/haptics';
import { speechRecognizer } from '../../utils/speechRecognition';
import type { AiChatSession } from '../../types';

import { PulseBubbleIcon } from '../icons/PulseBubbleIcon';
import FormattedAiMessage from './FormattedAiMessage';

interface AskLifeOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  updateData: (partial: any) => Promise<any>;
}

export const SPEC_STARTER_CHIPS = [
  { id: 'how_add_expense', label: 'How do I add an expense?', icon: 'Wallet' },
  { id: 'where_change_color', label: 'Where do I change the app color?', icon: 'Palette' },
  { id: 'how_use_screen', label: 'How do I use this screen?', icon: 'HelpCircle' },
  { id: 'app_features', label: 'What features are in this app?', icon: 'Sparkles' },
];

export default function AskLifeOSModal({ isOpen, onClose, data, updateData }: AskLifeOSModalProps) {
  const location = useLocation();

  // Tab State: 'chat' | 'history'
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConsentSheet, setShowConsentSheet] = useState(false);
  const [previewDataContext, setPreviewDataContext] = useState<string | null>(null);

  // Active proposals associated with recent message
  const [actionProposals, setActionProposals] = useState<Record<string, AiActionProposal[]>>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Auto-focus input when opening AI assistant
  useEffect(() => {
    if (isOpen) {
      recordScreenView('Ask LifeOS Assistant');
      const timer = setTimeout(() => {
        if (activeTab === 'chat') {
          inputRef.current?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  // Persist messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto scroll to bottom in chat view
  useEffect(() => {
    if (chatContainerRef.current && activeTab === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isGenerating, activeTab]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Helper to persist current active chat session into database history
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

  const handleOpenConsentCheck = () => {
    if (!getHasAgreedConsent()) {
      setShowConsentSheet(true);
      return false;
    }
    return true;
  };

  const handleStartNewChat = () => {
    triggerHaptic('medium');
    setMessages([]);
    setActionProposals({});
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
    setToastMessage('Saved search session deleted.');
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendQuery = async (queryText: string = inputQuery) => {
    const trimmed = queryText.trim();
    if (!trimmed || isGenerating) return;

    if (!handleOpenConsentCheck()) return;

    if (!isOnline) {
      setErrorMessage('AI needs internet connection. Please connect to the internet and try again.');
      return;
    }

    const apiKey = getGroqApiKey();
    const proxyUrl = getAiProxyUrl();
    if (!apiKey && !proxyUrl) {
      setErrorMessage('Groq API Key missing. Please set your key in Settings > AI or enter key below.');
      return;
    }

    triggerHaptic('light');
    setErrorMessage(null);
    setErrorDetails(null);
    setShowErrorDetails(false);
    setLastFailedPrompt(null);
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Gather recent conversation topics to maintain seamless multi-turn context
    const recentConvoContext = messages
      .slice(-4)
      .map(m => m.content)
      .join(' ');
    const contextQuery = recentConvoContext ? `${trimmed} ${recentConvoContext}` : trimmed;
    const dataContext = buildTargetedAiContext(contextQuery, data);

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      dataSentContext: dataContext,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, initialAssistantMsg]);
    setIsGenerating(true);

    // Multi-turn continuity: pass up to 14 messages (7 complete conversation turns)
    const historyPayload = updatedMessages.slice(-14).map(m => ({ role: m.role, content: m.content }));
    abortControllerRef.current = new AbortController();

    try {
      await streamChatCompletion(
        historyPayload,
        location.pathname || '/',
        dataContext,
        (chunkText) => {
          const cleanChunk = stripUrls(chunkText);
          setMessages(prev => {
            const next = prev.map(m => m.id === assistantMsgId ? { ...m, content: cleanChunk } : m);
            return next;
          });
        },
        (fullText) => {
          setIsGenerating(false);
          const cleanFull = stripUrls(fullText);
          const { cleanText, proposals } = extractAiActionProposals(cleanFull);
          setMessages(prev => {
            const next = prev.map(m => m.id === assistantMsgId ? { ...m, content: cleanText } : m);
            const newSessionId = persistSessionToHistory(next, activeSessionId);
            setActiveSessionId(newSessionId);
            return next;
          });
          if (proposals.length > 0) {
            setActionProposals(prev => ({ ...prev, [assistantMsgId]: proposals }));
          }
        },
        (err, payload) => {
          setIsGenerating(false);
          setErrorMessage(payload?.friendlyMessage || err.message || 'An error occurred while calling Groq AI.');
          setErrorDetails(payload?.rawDetails || null);
          setLastFailedPrompt(trimmed);
          setMessages(prev => prev.filter(m => m.id !== assistantMsgId || m.content.trim().length > 0));
        },
        abortControllerRef.current.signal
      );
    } catch (e: any) {
      setIsGenerating(false);
      setErrorMessage(e?.message || 'Failed to complete AI query.');
      setLastFailedPrompt(trimmed);
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId || m.content.trim().length > 0));
    }
  };

  // Voice recording: Native Web Speech API with seamless MediaRecorder fallback
  const handleToggleRecord = async () => {
    if (isRecording) {
      triggerHaptic('medium');
      setIsRecording(false);
      if (speechRecognizer.isSupported()) {
        speechRecognizer.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (!isOnline) {
      setErrorMessage('AI needs internet connection for voice recognition.');
      return;
    }

    triggerHaptic('medium');

    // 1. Try Native Web Speech API (Live zero-latency dictation)
    if (speechRecognizer.isSupported()) {
      setIsRecording(true);
      const started = speechRecognizer.start(
        (result) => {
          if (result.transcript) {
            setInputQuery(result.transcript);
          }
        },
        (err) => {
          console.warn('[Speech Recognition Error]', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      if (started) return;
    }

    // 2. Fallback to MediaRecorder + Whisper Audio Transcription
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
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
            setInputQuery(prev => (prev ? `${prev} ${text}` : text));
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
    } catch (err: any) {
      setErrorMessage('Microphone access denied or unsupported on this device.');
      setIsRecording(false);
    }
  };

  const getChipIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet': return <Wallet size={13} />;
      case 'Palette': return <Palette size={13} />;
      case 'HelpCircle': return <HelpCircle size={13} />;
      case 'CheckSquare': return <CheckSquare size={13} />;
      case 'Dumbbell': return <Dumbbell size={13} />;
      case 'Utensils': return <Utensils size={13} />;
      default: return <Sparkles size={13} />;
    }
  };

  // Filter history items by search query
  const historyItems: AiChatSession[] = data?.aiChatHistory || [];
  const filteredHistory = historyItems.filter((session) => {
    if (!searchHistoryQuery.trim()) return true;
    const query = searchHistoryQuery.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(query);
    const messageMatch = session.messages.some(m => m.content.toLowerCase().includes(query));
    return titleMatch || messageMatch;
  });

  return (
    <>
      <GlassSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col h-full max-w-2xl mx-auto overflow-hidden relative text-[var(--md-on-surface)]">
          
          {/* ── Top Header with Mode Tabs ── */}
          <div className="flex items-center justify-between py-1.5 mb-1 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[var(--md-primary-container)] flex items-center justify-center text-[var(--md-on-primary-container)] shrink-0 shadow-xs">
                <PulseBubbleIcon size={20} />
              </div>
              <div className="min-w-0">

                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-gradient-dark tracking-tight leading-tight truncate">
                    Ask LifeOS
                  </h2>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)] tracking-wider uppercase shrink-0">
                    Groq AI
                  </span>
                </div>
                <p className="text-[10px] text-[var(--md-on-surface-variant)] font-medium truncate">
                  Offline-First System Intelligence
                </p>
              </div>
            </div>

            {/* Header Controls: Chat/History Tabs & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center p-0.5 rounded-full bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('chat');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-xs'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                >
                  <MessageSquare size={12} />
                  <span>Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('history');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeTab === 'history'
                      ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-xs'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                >
                  <History size={12} />
                  <span>History</span>
                  {historyItems.length > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] text-[9px] flex items-center justify-center font-bold">
                      {historyItems.length}
                    </span>
                  )}
                </button>
              </div>

              {messages.length > 0 && activeTab === 'chat' && (
                <button
                  type="button"
                  title="New Chat Session"
                  onClick={handleStartNewChat}
                  className="p-1.5 rounded-full text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)] transition-all active:scale-95"
                >
                  <Plus size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)] transition-all active:scale-95"
                aria-label="Close Ask LifeOS"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Assist Chip: Screen Context ── */}
          <div className="pb-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--md-surface-container-highest)] text-[var(--md-on-surface-variant)] border border-[var(--md-outline-variant)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)]" />
              <span>Screen: {location.pathname === '/' ? 'Home' : location.pathname.replace('/', '')}</span>
            </span>
          </div>

          {/* ── Offline Banner ── */}
          {!isOnline && (
            <div className="my-1.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2 shrink-0">
              <WifiOff size={14} className="text-amber-500 shrink-0" />
              <span>AI needs internet connection. Offline mode active.</span>
            </div>
          )}

          {/* ── Toast Notification ── */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="my-1.5 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between shrink-0"
              >
                <span className="font-semibold">{toastMessage}</span>
                <Check size={14} className="text-emerald-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error Banner ── */}
          {errorMessage && (
            <div className="my-1.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span className="font-medium leading-tight break-words [overflow-wrap:anywhere]">{errorMessage}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {lastFailedPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = lastFailedPrompt;
                        setErrorMessage(null);
                        setErrorDetails(null);
                        handleSendQuery(q);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline px-1 py-0.5"
                    >
                      <RefreshCw size={10} />
                      <span>Retry</span>
                    </button>
                  )}
                  {errorDetails && (
                    <button
                      type="button"
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="flex items-center gap-0.5 text-[11px] font-bold text-white/70 hover:text-white px-1 py-0.5"
                    >
                      <span>Details</span>
                      {showErrorDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setErrorDetails(null);
                      setShowErrorDetails(false);
                    }}
                    className="text-[11px] font-bold underline text-red-300 hover:text-white px-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Collapsible Sanitize Details */}
              {showErrorDetails && errorDetails && (
                <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-[10px] font-mono text-red-300 max-h-24 overflow-y-auto break-words select-text allow-select leading-tight">
                  {errorDetails}
                </div>
              )}

              {(errorMessage.includes('API key') || errorMessage.includes('Key missing')) && (
                <div className="flex items-center gap-1.5 pt-1 w-full min-w-0">
                  <input
                    type="password"
                    placeholder="Paste Groq API Key (gsk_...)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent allow-select select-text"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          await setGroqApiKey(val, updateData);
                          setErrorMessage(null);
                          setErrorDetails(null);
                          setToastMessage('API Key saved and synced successfully!');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={async (e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement)?.value.trim();
                      if (input) {
                        await setGroqApiKey(input, updateData);
                        setErrorMessage(null);
                        setErrorDetails(null);
                        setToastMessage('API Key saved and synced successfully!');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-accent text-slate-950 font-bold text-xs shadow-sm hover:opacity-90 cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 1: ACTIVE CHAT SCREEN ── */}
          {activeTab === 'chat' && (
            <>
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-1.5 space-y-2.5 scrollbar-none flex flex-col min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center py-2 px-2 space-y-3">
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h3 className="text-sm sm:text-base font-bold text-[var(--md-on-surface)] tracking-tight">
                        Ask me anything about LifeOS
                      </h3>
                      <p className="text-[11px] text-[var(--md-on-surface-variant)] leading-relaxed">
                        Features, navigation, step-by-step guides, and settings locations.
                      </p>
                    </div>

                    {/* 2-Column Responsive Starter Chips Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto w-full pt-0.5">
                      {SPEC_STARTER_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleSendQuery(chip.label)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-surface-container)] hover:bg-[var(--md-secondary-container)] border border-[var(--md-outline-variant)] text-left transition-all active:scale-98 group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] flex items-center justify-center shrink-0 transition-colors">
                            {getChipIcon(chip.icon)}
                          </div>
                          <span className="text-xs font-semibold text-[var(--md-on-surface)] group-hover:text-[var(--md-on-secondary-container)] leading-snug">
                            {chip.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const proposals = actionProposals[msg.id] || [];

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`w-full max-w-[94%] sm:max-w-[88%] p-3.5 rounded-[20px] text-xs sm:text-sm leading-relaxed overflow-hidden ${
                            isUser
                              ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] rounded-br-xs shadow-xs self-end'
                              : 'bg-[var(--md-surface-container-highest)] text-[var(--md-on-surface)] border border-[var(--md-outline-variant)] rounded-bl-xs self-start'
                          }`}
                        >
                          {msg.content ? (
                            <FormattedAiMessage content={msg.content} isUser={isUser} />
                          ) : (
                            <div className="flex items-center gap-2 text-[var(--md-primary)] italic">
                              <Loader2 size={14} className="animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          )}

                          {!isUser && msg.content && (
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--md-outline-variant)] text-[10px] text-[var(--md-on-surface-variant)] font-mono">
                              <span>Groq AI • App Guide</span>
                              <div className="flex items-center gap-2.5">
                                {msg.dataSentContext && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDataContext(msg.dataSentContext || null)}
                                    className="flex items-center gap-1 hover:text-[var(--md-primary)] transition-colors cursor-pointer"
                                  >
                                    <Eye size={11} />
                                    <span>Data Sent</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="flex items-center gap-1 hover:text-[var(--md-primary)] transition-colors"
                                >
                                  {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Confirmation Cards */}
                        {proposals.map((prop) => (
                          <div key={prop.id} className="max-w-[88%] w-full">
                            <ActionConfirmationCard
                              proposal={prop}
                              updateData={updateData}
                              currentData={data}
                              onExecuted={(msg) => setToastMessage(msg)}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}

                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl text-xs text-[var(--md-primary)] flex items-center gap-2 bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)]">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Streaming response...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Bottom Input Row (Pill Input in M3 Surface Container Highest) ── */}
              <div className="pt-1.5 shrink-0 relative z-30">
                {isRecording && (
                  <div className="mb-2 px-3.5 py-1.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-between text-xs text-red-600 dark:text-red-400 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="font-semibold text-[11px] truncate">Listening live... (Speak task or query)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--md-on-surface-variant)] shrink-0 ml-2">Tap red stop when done</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 p-1.5 pl-3 rounded-full bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)]">
                  {/* Left input field */}
                  <div className="flex-1 flex items-center min-w-0">
                    <input
                      id="ask-lifeos-input"
                      name="ask-lifeos-query"
                      ref={inputRef}
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendQuery();
                        }
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="sentences"
                      spellCheck={false}
                      tabIndex={0}
                      placeholder={
                        transcribing
                          ? 'Transcribing voice...'
                          : isRecording
                          ? 'Listening in real-time...'
                          : 'Ask LifeOS or say "Add to-do task..."'
                      }
                      className="w-full bg-transparent px-1 py-1 text-xs sm:text-sm font-medium text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:outline-none allow-select select-text cursor-text"
                      style={{ pointerEvents: 'auto', touchAction: 'auto', userSelect: 'text' }}
                    />
                    
                    {/* Clear text X button inside input */}
                    {inputQuery.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInputQuery('');
                          inputRef.current?.focus();
                        }}
                        className="p-1 rounded-full text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-all shrink-0 mr-1"
                        title="Clear text"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Actions: Voice Mic & Send Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRecord();
                      }}
                      disabled={isGenerating || transcribing}
                      title={isRecording ? 'Stop Recording' : 'Voice Input'}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                          : transcribing
                          ? 'bg-[var(--md-primary-container)] text-[var(--md-primary)] animate-spin'
                          : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] hover:text-[var(--md-primary)]'
                      }`}
                    >
                      {isRecording ? <Square size={13} /> : transcribing ? <Loader2 size={14} /> : <Mic size={16} strokeWidth={2.2} />}
                    </button>

                    {inputQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendQuery();
                        }}
                        disabled={isGenerating || transcribing}
                        title="Send query"
                        className="w-9 h-9 rounded-full bg-[var(--md-primary)] hover:opacity-95 active:scale-95 text-[var(--md-on-primary)] flex items-center justify-center shadow-xs disabled:opacity-40 transition-all shrink-0"
                      >
                        <Send size={15} className="ml-[-1px]" strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── VIEW 2: SAVED SEARCH HISTORY SCREEN ── */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3 py-1 overflow-hidden">
              
              {/* Search History Filter Bar & New Chat Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)]">
                  <Search size={15} className="text-[var(--md-on-surface-variant)] shrink-0" />
                  <input
                    type="text"
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    placeholder="Search past questions & answers..."
                    className="w-full bg-transparent text-xs text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:outline-none allow-select select-text"
                  />
                  {searchHistoryQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchHistoryQuery('')}
                      className="p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] shrink-0"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="px-3.5 py-2 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  <Plus size={15} />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Saved History List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3 my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--md-surface-container-highest)] flex items-center justify-center text-[var(--md-on-surface-variant)] mx-auto">
                      <Clock size={22} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[var(--md-on-surface)]">
                        {searchHistoryQuery ? 'No matching saved chats' : 'No Saved Search History'}
                      </h4>
                      <p className="text-xs text-[var(--md-on-surface-variant)] max-w-xs mx-auto">
                        {searchHistoryQuery
                          ? 'Try searching with a different keyword or topic.'
                          : 'Your past questions and search conversations will be automatically saved here for instant reuse.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredHistory.map((session) => {
                    const isCurrent = activeSessionId === session.id;
                    const lastMsg = session.messages[session.messages.length - 1];
                    const dateStr = new Date(session.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={session.id}
                        onClick={() => handleReopenSession(session)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:border-[var(--md-primary)]/50 group relative ${
                          isCurrent
                            ? 'bg-[var(--md-primary-container)] border-[var(--md-primary)] text-[var(--md-on-primary-container)] shadow-xs'
                            : 'bg-[var(--md-surface-container)] hover:bg-[var(--md-surface-container-high)] border-[var(--md-outline-variant)] text-[var(--md-on-surface)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-[var(--md-on-surface)] tracking-tight truncate group-hover:text-[var(--md-primary)] transition-colors">
                                {session.title}
                              </h4>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--md-primary)] text-[var(--md-on-primary)] shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            {lastMsg && (
                              <p className="text-[11px] text-[var(--md-on-surface-variant)] line-clamp-2 leading-relaxed">
                                {stripUrls(lastMsg.content)}
                              </p>
                            )}
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-[var(--md-on-surface-variant)] font-mono">
                              <span>{dateStr}</span>
                              <span>•</span>
                              <span>{session.messages.length} messages</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              title="Delete saved session"
                              className="p-1.5 rounded-xl text-[var(--md-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="w-7 h-7 rounded-xl bg-[var(--md-surface-container-highest)] group-hover:bg-[var(--md-primary)] group-hover:text-[var(--md-on-primary)] text-[var(--md-on-surface)] flex items-center justify-center transition-all">
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}


        </div>
      </GlassSheet>

      {/* One-time Privacy Consent Sheet */}
      <AiConsentSheet
        isOpen={showConsentSheet}
        onAccept={() => {
          setShowConsentSheet(false);
          handleSendQuery();
        }}
        onClose={() => setShowConsentSheet(false)}
      />

      {/* Data Sent Preview Modal */}
      {previewDataContext !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent">
          <div className="w-full max-w-md bg-slate-900 border border-accent/30 rounded-3xl p-4 space-y-3 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck size={18} />
                <span className="text-xs font-bold font-mono">Data Sent Preview (Redacted)</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDataContext(null)}
                className="p-1 rounded-full bg-white/10 text-white/70 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              This exact redacted summary context was transmitted securely to Groq AI for your question:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-white/10 text-[11px] font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap text-emerald-400 allow-select select-text">
              {previewDataContext}
            </div>
            <button
              type="button"
              onClick={() => setPreviewDataContext(null)}
              className="w-full py-2.5 rounded-xl btn-primary font-bold text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </>
  );
}

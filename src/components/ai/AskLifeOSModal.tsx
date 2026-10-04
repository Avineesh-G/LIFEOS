import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkle,
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
  BookOpen,
  ChatCircleText,
  ClockCounterClockwise,
  MagnifyingGlass,
  Plus,
  SpeakerHigh,
  ShareNetwork,
} from '../../ui/tokens/icons';
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

interface AskLifeOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  updateData: (partial: any) => Promise<any>;
}

export const SPEC_STARTER_CHIPS = [
  { id: 'tasks_today', label: 'What are my top tasks today?', icon: <CheckSquare size={16} weight="duotone" className="text-[#0A84FF]" />, tint: '#0A84FF' },
  { id: 'study_focus', label: 'How is my study focus this week?', icon: <BookOpen size={16} weight="duotone" className="text-[#64D2FF]" />, tint: '#64D2FF' },
  { id: 'gym_split', label: 'What workout is scheduled today?', icon: <Barbell size={16} weight="duotone" className="text-[#FF453A]" />, tint: '#FF453A' },
  { id: 'budget_status', label: 'Am I within my daily spending limit?', icon: <Wallet size={16} weight="duotone" className="text-[#30D158]" />, tint: '#30D158' },
];

export default function AskLifeOSModal({ isOpen, onClose, data, updateData }: AskLifeOSModalProps) {
  const location = useLocation();
  const navigate = useNavigate();

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

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

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

  const handleSendQuery = async (queryText: string = inputQuery) => {
    const trimmed = queryText.trim();
    if (!trimmed || isGenerating) return;

    triggerHaptic('selection');
    setInputQuery('');
    setErrorMessage(null);

    const userMessageId = `msg_${Date.now()}_u`;
    const assistantMessageId = `msg_${Date.now()}_a`;

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
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

    const targetedContext = buildTargetedAiContext(trimmed, data);
    abortControllerRef.current = new AbortController();

    try {
      let accumulatedResponse = '';
      await streamChatCompletion(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        location.pathname || '/',
        targetedContext,
        (token: string) => {
          accumulatedResponse += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedResponse }
                : msg
            )
          );
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
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

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
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          if (text) {
            setInputQuery((prev) => (prev ? `${prev} ${text}` : text));
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
      setErrorMessage('Microphone access denied or unavailable.');
      setIsRecording(false);
    }
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
      className="bg-[#000000]/95 backdrop-blur-2xl border border-white/12"
      title={
        <div className="flex items-center justify-between w-full px-1">
          {/* Left: Luna AI Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0A84FF] via-[#BF5AF2] to-[#FF375F] flex items-center justify-center text-white shadow-lg shadow-[#BF5AF2]/20">
              <Sparkle size={17} weight="fill" />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight leading-none">Luna AI</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#BF5AF2]/20 text-[#BF5AF2] uppercase tracking-wider">
                  Groq AI
                </span>
              </div>
            </div>
          </div>

          {/* Right: Segmented Mode Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-full bg-[#1C1C1E] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('chat');
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-[#BF5AF2] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ChatCircleText size={13} weight="bold" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('history');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#BF5AF2] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ClockCounterClockwise size={13} weight="bold" />
                <span>History</span>
                {historyItems.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[9px] flex items-center justify-center font-bold">
                    {historyItems.length}
                  </span>
                )}
              </button>
            </div>

            {messages.length > 0 && activeTab === 'chat' && (
              <button
                type="button"
                title="New Chat"
                onClick={handleStartNewChat}
                className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white/80 hover:text-white border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white/80 hover:text-white border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Close"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full w-full min-w-0 pb-3">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="mb-3 px-3 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs font-medium shrink-0">
            <WifiSlash size={16} weight="bold" className="shrink-0" />
            <span>You are offline. Luna AI requires internet access.</span>
          </div>
        )}

        {/* ── Chat Tab View ── */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Message History or Empty State */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pr-1 overscroll-contain"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-2 text-center space-y-5">
                  {/* Glowing Animated Luna AI Orb */}
                  <div className="relative flex items-center justify-center my-2">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#0A84FF] via-[#BF5AF2] to-[#FF375F] blur-2xl -z-10"
                    />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0A84FF] via-[#BF5AF2] to-[#FF375F] p-[2px] shadow-2xl">
                      <div className="w-full h-full rounded-full bg-[#000000] flex items-center justify-center">
                        <Sparkle size={36} weight="fill" className="text-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Hi! I am Luna AI</h3>
                    <p className="text-sm text-white/60 max-w-xs mx-auto mt-1 leading-relaxed">
                      I analyze your tasks, timetable, study hours, workouts, and budget using Groq AI.
                    </p>
                  </div>

                  {/* 4 Starter Chips in Solid #1C1C1E Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
                    {SPEC_STARTER_CHIPS.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handleSendQuery(chip.label)}
                        className="p-3.5 rounded-[20px] bg-[#1C1C1E] border border-white/10 hover:border-white/20 active:scale-95 transition-all text-left flex items-center gap-3 group"
                      >
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: `${chip.tint}20`, color: chip.tint }}
                        >
                          {chip.icon}
                        </div>
                        <span className="text-xs font-semibold text-white/90 leading-snug group-hover:text-white">
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
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[88%] p-3.5 rounded-[22px] ${
                          isUser
                            ? 'bg-[#0A84FF] text-white rounded-br-[6px] shadow-md'
                            : 'bg-[#1C1C1E] text-white/95 rounded-bl-[6px] border border-white/10 shadow-lg'
                        }`}
                      >
                        {isUser ? (
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="space-y-2">
                            <FormattedAiMessage content={msg.content} />
                            {msg.content === '' && isGenerating && (
                              <div className="flex items-center gap-1.5 py-1 text-white/50 text-xs">
                                <SpinnerGap size={15} className="animate-spin text-[#BF5AF2]" />
                                <span>Luna is thinking...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Proposals (1-Tap Save actions) */}
                      {!isUser && proposals.length > 0 && (
                        <div className="w-full max-w-sm space-y-2 pt-1">
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
                        <div className="flex items-center gap-2 px-1 text-white/40 text-xs">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-white transition-colors flex items-center gap-1"
                          >
                            {copiedId === msg.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.content)}
                            className={`hover:text-white transition-colors flex items-center gap-1 ${
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
                            className="hover:text-white transition-colors flex items-center gap-1"
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
              <div className="my-2 p-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between shrink-0">
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
            <div className="pt-2 shrink-0">
              <GlassSurface
                className="rounded-full p-1.5 flex items-center gap-2 border border-white/16 shadow-2xl"
              >
                {/* Voice Dictation Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  disabled={isGenerating || transcribing}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
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

                {/* Text Input Field */}
                <input
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
                  placeholder={transcribing ? 'Transcribing speech...' : 'Ask Luna AI or say "Add to-do task..."'}
                  disabled={isGenerating}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none px-2 min-w-0"
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  disabled={!inputQuery.trim() || isGenerating}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    inputQuery.trim() && !isGenerating
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
              </GlassSurface>
            </div>
          </div>
        ) : (
          /* ── History Tab View ── */
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Search History Pill */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1C1C1E] border border-white/10 text-white/80">
              <MagnifyingGlass size={16} className="text-white/50" />
              <input
                type="text"
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                placeholder="Search past conversations..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
              />
              {searchHistoryQuery && (
                <button type="button" onClick={() => setSearchHistoryQuery('')}>
                  <X size={14} className="text-white/50 hover:text-white" />
                </button>
              )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2 overscroll-contain">
              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-sm">
                  {searchHistoryQuery ? 'No matching conversations found.' : 'No conversation history saved yet.'}
                </div>
              ) : (
                filteredHistory.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleReopenSession(session)}
                    className="p-3.5 rounded-[22px] bg-[#1C1C1E] border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 rounded-2xl bg-[#BF5AF2]/20 text-[#BF5AF2] flex items-center justify-center shrink-0">
                        <ChatCircleText size={18} weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#BF5AF2]">
                          {session.title}
                        </h4>
                        <span className="text-[10px] text-white/40 mt-0.5 block">
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
    </Sheet>
  );
}

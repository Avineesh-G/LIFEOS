import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import GlassSheet from '../glass/GlassSheet';
import GlassSurface from '../glass/GlassSurface';
import SuggestionChip from '../glass/SuggestionChip';
import GlowCard from '../glass/GlowCard';
import AiConsentSheet from './AiConsentSheet';
import ActionConfirmationCard from './ActionConfirmationCard';
import { STARTER_SUGGESTION_CHIPS, GROQ_CONFIG } from '../../config/ai';
import { getGroqApiKey, getAiProxyUrl, getHasAgreedConsent } from '../../utils/aiSecurity';
import { buildTargetedAiContext } from '../../services/aiContextBuilder';
import { streamChatCompletion, transcribeAudio, ChatMessage } from '../../services/aiClient';
import { extractAiActionProposals, AiActionProposal } from '../../services/aiActionEngine';
import { triggerHaptic } from '../../utils/haptics';

interface AskLifeOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  updateData: (partial: any) => Promise<any>;
}

export default function AskLifeOSModal({ isOpen, onClose, data, updateData }: AskLifeOSModalProps) {
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
  const [showConsentSheet, setShowConsentSheet] = useState(false);

  // Active proposals associated with recent message
  const [actionProposals, setActionProposals] = useState<Record<string, AiActionProposal[]>>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Persist messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleOpenConsentCheck = () => {
    if (!getHasAgreedConsent()) {
      setShowConsentSheet(true);
      return false;
    }
    return true;
  };

  const handleClearChat = () => {
    triggerHaptic('medium');
    setMessages([]);
    setActionProposals({});
    setErrorMessage(null);
    try {
      localStorage.removeItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
    } catch {}
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
      setErrorMessage('Groq API Key missing. Please set your key in Settings > AI.');
      return;
    }

    triggerHaptic('light');
    setErrorMessage(null);
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, initialAssistantMsg]);
    setIsGenerating(true);

    const contextSummary = buildTargetedAiContext(trimmed, data);
    const historyPayload = updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    abortControllerRef.current = new AbortController();

    await streamChatCompletion(
      historyPayload,
      contextSummary,
      (chunkText) => {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: chunkText } : m));
      },
      (fullText) => {
        setIsGenerating(false);
        const { cleanText, proposals } = extractAiActionProposals(fullText);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: cleanText } : m));
        if (proposals.length > 0) {
          setActionProposals(prev => ({ ...prev, [assistantMsgId]: proposals }));
        }
      },
      (err) => {
        setIsGenerating(false);
        setErrorMessage(err.message || 'An error occurred while calling Groq AI.');
      },
      abortControllerRef.current.signal
    );
  };

  // Voice recording Rambler style (Records mic -> transcribes -> puts text in input)
  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop recording
      triggerHaptic('medium');
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (!isOnline) {
      setErrorMessage('AI needs internet connection for voice recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      triggerHaptic('medium');
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
    }
  };

  const getChipIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet': return <Wallet size={13} />;
      case 'CheckSquare': return <CheckSquare size={13} />;
      case 'Dumbbell': return <Dumbbell size={13} />;
      case 'Utensils': return <Utensils size={13} />;
      default: return <Sparkles size={13} />;
    }
  };

  return (
    <>
      <GlassSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col h-[85vh] sm:h-[680px] max-w-2xl mx-auto select-none overflow-hidden relative">
          
          {/* ── Top Header ── */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-primary-light dark:text-primary-dark tracking-tight">
                  Ask LifeOS
                </h2>
                <p className="text-[10px] text-muted-light dark:text-muted-dark font-mono">
                  Groq Intelligence • Gemini Glass System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  title="Clear Chat History"
                  onClick={handleClearChat}
                  className="p-2 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Offline Banner ── */}
          {!isOnline && (
            <div className="my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 shrink-0">
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
                className="my-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between shrink-0"
              >
                <span className="font-semibold">{toastMessage}</span>
                <Check size={14} className="text-emerald-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error Banner ── */}
          {errorMessage && (
            <div className="my-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle size={14} className="shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-bold underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── Chat Scroll Messages Area ── */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-none">
            {messages.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Sparkles size={24} />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark">
                    How can I assist you today?
                  </h3>
                  <p className="text-xs text-secondary-light dark:text-secondary-dark">
                    Ask about your spending, tasks, nutrition, workout records, or get general advice.
                  </p>
                </div>

                {/* Starter Chips */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
                  {STARTER_SUGGESTION_CHIPS.map((chip) => (
                    <SuggestionChip
                      key={chip.id}
                      icon={getChipIcon(chip.icon)}
                      title={chip.label}
                      onClick={() => handleSendQuery(chip.label)}
                    />
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
                    <GlassSurface
                      level={isUser ? 2 : 1}
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-accent/15 border-accent/30 text-primary-light dark:text-primary-dark rounded-br-none'
                          : 'bg-white/60 dark:bg-surface-dark border-black/10 dark:border-white/10 text-primary-light dark:text-primary-dark rounded-bl-none'
                      }`}
                    >
                      {msg.content ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <div className="flex items-center gap-2 text-accent italic">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      )}

                      {!isUser && msg.content && (
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5 dark:border-white/5 text-[10px] text-muted-light dark:text-muted-dark font-mono">
                          <span>Groq AI</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-accent transition-colors"
                          >
                            {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </GlassSurface>

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
                <GlassSurface level={1} className="p-3 rounded-2xl text-xs text-accent flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" />
                  <span>Streaming response...</span>
                </GlassSurface>
              </div>
            )}
          </div>

          {/* ── Bottom Input GlowCard Bar ── */}
          <div className="pt-2 shrink-0">
            <GlowCard className="p-2 flex items-center gap-2">
              <input
                type="text"
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
                    ? 'Transcribing voice...'
                    : isRecording
                    ? 'Listening... tap mic to finish'
                    : 'Ask LifeOS anything...'
                }
                disabled={isGenerating || transcribing}
                className="flex-1 bg-transparent px-2 text-xs sm:text-sm font-medium text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark focus:outline-none"
              />

              {/* Mic / Rambler Button */}
              <button
                type="button"
                onClick={handleToggleRecord}
                disabled={isGenerating || transcribing}
                title={isRecording ? 'Stop Recording' : 'Voice Input (Rambler style)'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                    : transcribing
                    ? 'bg-accent/20 text-accent animate-spin'
                    : 'bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                {isRecording ? <Square size={14} /> : transcribing ? <Loader2 size={15} /> : <Mic size={16} />}
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendQuery()}
                disabled={isGenerating || !inputQuery.trim() || transcribing}
                className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center shadow-md disabled:opacity-40 transition-all active:scale-95 shrink-0"
              >
                <Send size={15} />
              </button>
            </GlowCard>
          </div>
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
    </>
  );
}

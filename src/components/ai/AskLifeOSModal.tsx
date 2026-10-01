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
} from 'lucide-react';
import GlassSheet from '../glass/GlassSheet';
import GlassSurface from '../glass/GlassSurface';
import SuggestionChip from '../glass/SuggestionChip';
import GlowCard from '../glass/GlowCard';
import AiConsentSheet from './AiConsentSheet';
import ActionConfirmationCard from './ActionConfirmationCard';
import { GROQ_CONFIG } from '../../config/ai';
import { getGroqApiKey, getAiProxyUrl, getHasAgreedConsent } from '../../utils/aiSecurity';
import { streamChatCompletion, transcribeAudio, stripUrls, ChatMessage } from '../../services/aiClient';
import { extractAiActionProposals, AiActionProposal } from '../../services/aiActionEngine';
import { triggerHaptic } from '../../utils/haptics';

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

    const historyPayload = updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    abortControllerRef.current = new AbortController();

    await streamChatCompletion(
      historyPayload,
      location.pathname || '/',
      (chunkText) => {
        const cleanChunk = stripUrls(chunkText);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: cleanChunk } : m));
      },
      (fullText) => {
        setIsGenerating(false);
        const cleanFull = stripUrls(fullText);
        const { cleanText, proposals } = extractAiActionProposals(cleanFull);
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
      case 'Palette': return <Palette size={13} />;
      case 'HelpCircle': return <HelpCircle size={13} />;
      case 'CheckSquare': return <CheckSquare size={13} />;
      case 'Dumbbell': return <Dumbbell size={13} />;
      case 'Utensils': return <Utensils size={13} />;
      default: return <Sparkles size={13} />;
    }
  };

  return (
    <>
      <GlassSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col h-full max-w-2xl mx-auto select-none overflow-hidden relative">
          
          {/* ── Top Header ── */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-primary-light dark:text-primary-dark tracking-tight leading-tight">
                  Ask LifeOS
                </h2>
                <p className="text-[10px] text-secondary-light dark:text-secondary-dark font-mono">
                  Groq Intelligence • App Guide Mode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  title="Clear Chat History"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-white/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-white/10 transition-colors"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* ── Offline Banner ── */}
          {!isOnline && (
            <div className="my-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 shrink-0">
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
                className="my-1.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between shrink-0"
              >
                <span className="font-semibold">{toastMessage}</span>
                <Check size={14} className="text-emerald-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error Banner ── */}
          {errorMessage && (
            <div className="my-1.5 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-2 shrink-0">
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
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-none">
            {messages.length === 0 ? (
              <div className="text-center py-6 px-3 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark">
                    Ask me anything about LifeOS
                  </h3>
                  <p className="text-xs text-secondary-light dark:text-secondary-dark">
                    I can explain features, navigation, step-by-step guides, and settings locations.
                  </p>
                </div>

                {/* Starter Chips */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
                  {SPEC_STARTER_CHIPS.map((chip) => (
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
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/10 text-[10px] text-secondary-light dark:text-secondary-dark font-mono">
                          <span>Groq AI • App Guide</span>
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
          <div className="pt-1 shrink-0">
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
                    : 'Ask Ask LifeOS anything...'
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

/**
 * LifeOS — Luna AI ChatGPT-Style Standalone Interface
 * 
 * Design & Architecture:
 * 1. 1:1 Translation of OpenAI ChatGPT Mobile Architecture:
 *    - Minimalist Top Bar: Drawer toggle, Model Selector pill, New Chat action.
 *    - Central Hero Empty State: Breathing Luna geometric starburst logo, personalized greeting, 2x2 suggestion tiles.
 *    - Conversation Stream: Right-aligned user droplet bubbles, full-width assistant answers with Luna avatar.
 *    - Floating Bottom Input Dock: Borderless liquid glass capsule with auto-expanding textarea, mic dictation, photo vision upload, and dynamic upward send button.
 *    - Slide-over Chat History Drawer: Real-time search, date-grouped threads (Today, Yesterday, 7 Days, Older).
 * 2. Visual Enhancements:
 *    - Point-based structured responses via FormattedAiMessage.
 *    - Interactive Workflow progress cards with step checkboxes.
 *    - Inline SVG Data Breakdown charts.
 *    - Real-time 1-tap Action Confirmation cards (Add Task, Log Meal, Schedule Event).
 * 3. Strict Compliance:
 *    - Zero Emojis (Phosphor icons only).
 *    - Zero White Line Borders (OLED pure droplet ambient shadows).
 *    - 120 FPS Compositor animations (only transform & opacity).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretLeft,
  CaretDown,
  CaretRight,
  ClockCounterClockwise,
  NotePencil,
  Plus,
  PaperPlaneRight,
  Microphone,
  Stop,
  Camera,
  Images,
  Trash,
  X,
  Copy,
  Check,
  SpeakerHigh,
  ArrowClockwise,
  ShareNetwork,
  MagnifyingGlass,
  CheckSquare,
  Barbell,
  Wallet,
  Sparkle,
  Lightning,
  Brain,
  SlidersHorizontal,
  ChatCircleText,
  ChatCircleDots,
  Square,
  Key,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
} from '@phosphor-icons/react';
import { isToday, isYesterday, subDays, isAfter, parseISO } from 'date-fns';
import { LunaComicBubbleIcon } from '../ui/tokens/icons';
import { FormattedAiMessage } from '../components/ai/FormattedAiMessage';
import ActionConfirmationCard from '../components/ai/ActionConfirmationCard';
import { streamChatCompletion, transcribeAudio, stripUrls, ChatMessage } from '../services/aiClient';
import { extractAiActionProposals, AiActionProposal } from '../services/aiActionEngine';
import { buildTargetedAiContext } from '../services/aiContextBuilder';
import { recordScreenView } from '../services/aiUsageTracker';
import { triggerHaptic } from '../utils/haptics';
import { speakText, stopSpeaking } from '../utils/textToSpeech';
import { shareContent } from '../utils/shareUtils';
import {
  capturePhotoFromCamera,
  pickPhotoFromGallery,
  processFileToAttachedImage,
  AttachedImage,
} from '../utils/imagePicker';
import { auth } from '../firebase';
import { getCachedUserName } from '../utils/dailyBriefEngine';
import { useUserProfile } from '../utils/userProfileCache';
import { getGroqApiKey, setGroqApiKey } from '../utils/aiSecurity';
import { navigateBack } from '../utils/backNavigation';
import { GROQ_CONFIG } from '../config/ai';
import { CHAT_PRIMARY, CHAT_FALLBACKS, ALLOWED_CHAT_MODELS, RETIRED_MODELS } from '../config/aiModels';
import type { AppData, AiChatSession } from '../types';

interface LunaChatPageProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

// Model Selection Options (Derived from central verified registry in aiModels.ts)
const AI_MODELS = [
  {
    id: CHAT_PRIMARY,
    name: 'Luna 2.0 Pro',
    desc: 'GPT-OSS 120B • High-reasoning intelligence for deep analysis & planning',
    tag: 'Primary',
    icon: <Brain size={18} weight="duotone" className="text-[#BF5AF2]" />,
  },
  {
    id: CHAT_FALLBACKS[0],
    name: 'Luna 2.0 Fast',
    desc: 'GPT-OSS 20B • Instant speed for daily tasks & summaries',
    tag: 'Fast',
    icon: <Lightning size={18} weight="duotone" className="text-[#0A84FF]" />,
  },
];

// ChatGPT-Style 2x2 Prompt Starter Tiles
const PROMPT_STARTERS = [
  {
    id: 'tasks_today',
    title: 'Daily Priorities',
    subtitle: 'What tasks and timetable classes do I have today?',
    icon: <CheckSquare size={17} weight="duotone" className="text-[#0A84FF]" />,
    query: 'What are my top priorities, classes, and pending tasks scheduled for today?',
  },
  {
    id: 'workout_routine',
    title: 'Workout Split',
    subtitle: 'Plan today exercise sets, reps, and target muscles',
    icon: <Barbell size={17} weight="duotone" className="text-[#30D158]" />,
    query: 'What workout is scheduled for me today? Provide a step-by-step workout routine with exercises and target sets.',
  },
  {
    id: 'budget_overview',
    title: 'Financial Health',
    subtitle: 'Analyze recent spending and budget limits',
    icon: <Wallet size={17} weight="duotone" className="text-[#FF9F0A]" />,
    query: 'Analyze my spending trends and let me know if I am within my safe daily budget limit.',
  },
  {
    id: 'study_roadmap',
    title: 'Study Roadmap',
    subtitle: 'Create a 4-step focused revision workflow',
    icon: <NotePencil size={17} weight="duotone" className="text-[#64D2FF]" />,
    query: 'Create a focused 4-step study workflow for my upcoming exams and revision topics.',
  },
];

/**
 * Intelligently generates an executive topic heading from the user's prompt and Luna's response.
 * Strips conversational boilerplate ("what are my", "can you tell me", "please explain")
 * and extracts the true domain topic heading.
 */
export function extractMainTopicHeading(userPrompt: string, assistantResponse?: string): string {
  // 1. If Luna's response starts with or contains a markdown title heading (### Topic or ## Topic)
  if (assistantResponse) {
    const headingMatch = assistantResponse.match(/^#{1,3}\s+([^\n\r]+)/m);
    if (headingMatch && headingMatch[1]) {
      const cleanHeading = headingMatch[1]
        .replace(/[*_`#]/g, '')
        .replace(/[:\-–—]\s*$/, '')
        .trim();
      if (cleanHeading.length >= 4 && cleanHeading.length <= 44) {
        return cleanHeading;
      }
    }
  }

  const raw = (userPrompt || '').trim();
  if (!raw) return 'New Discussion';

  // 2. Check for exact matches against prompt starters or domain topics
  const lower = raw.toLowerCase();
  if (
    lower.includes('priority') ||
    lower.includes('priorities') ||
    (lower.includes('task') && lower.includes('today')) ||
    lower.includes('timetable') ||
    lower.includes('classes')
  ) {
    return 'Daily Priorities & Schedule';
  }
  if (
    lower.includes('workout') ||
    lower.includes('routine') ||
    lower.includes('exercise') ||
    lower.includes('gym split') ||
    lower.includes('chest') ||
    lower.includes('legs') ||
    lower.includes('pull day')
  ) {
    return 'Workout Routine & Fitness';
  }
  if (
    lower.includes('spend') ||
    lower.includes('budget') ||
    lower.includes('financ') ||
    lower.includes('money') ||
    lower.includes('expense')
  ) {
    return 'Financial Health & Budget';
  }
  if (
    lower.includes('study') ||
    lower.includes('revision') ||
    lower.includes('exam') ||
    lower.includes('syllabus') ||
    lower.includes('roadmap')
  ) {
    return 'Study Roadmap & Revision';
  }
  if (lower.includes('habit') || lower.includes('sleep') || lower.includes('water')) {
    return 'Daily Habits & Routine';
  }
  if (
    lower.includes('diet') ||
    lower.includes('meal') ||
    lower.includes('calorie') ||
    lower.includes('protein') ||
    lower.includes('nutrition')
  ) {
    return 'Nutrition & Meal Strategy';
  }

  // 3. Strip conversational prefixes & fillers
  let cleaned = raw
    .replace(
      /^(please\s+)?(can|could|would)\s+you\s+(please\s+)?(tell|explain|show|give|help|describe|list|provide|write|create|generate|plan)\s+(me\s+)?(about\s+|a\s+|an\s+|the\s+)?/i,
      ''
    )
    .replace(
      /^(please\s+)?(tell|explain|show|give|help|describe|list|provide|write|create|generate|plan)\s+(me\s+)?(about\s+|a\s+|an\s+|the\s+)?/i,
      ''
    )
    .replace(
      /^(what\s+is|what\s+are|what's|who\s+is|who\s+are|how\s+to|how\s+do\s+i|how\s+can\s+i|why\s+is|why\s+are)\s+(a\s+|an\s+|the\s+)?/i,
      ''
    )
    .replace(/^(i\s+want\s+to|i\s+need\s+to|i'd\s+like\s+to|i\s+would\s+like\s+to)\s+/i, '')
    .replace(/^(do\s+you\s+know|is\s+there\s+any)\s+/i, '')
    .replace(/^(hey|hello|hi|luna)\s*[,!:]*\s*/i, '')
    .trim();

  // If cleaning emptied it, fallback to raw
  if (!cleaned) cleaned = raw;

  // Truncate at punctuation boundary (period, question mark, newline, semicolon)
  const punctuationIndex = cleaned.search(/[?.!\n;]/);
  if (punctuationIndex > 0) {
    cleaned = cleaned.slice(0, punctuationIndex).trim();
  }

  // If still too long, take the first 36 characters at word boundary
  if (cleaned.length > 36) {
    const spaceIndex = cleaned.lastIndexOf(' ', 36);
    cleaned = (spaceIndex > 16 ? cleaned.slice(0, spaceIndex) : cleaned.slice(0, 36)).trim();
  }

  // Capitalize into Title Case
  cleaned = cleaned
    .split(/\s+/)
    .map((word) => {
      const wLower = word.toLowerCase();
      if (
        ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(
          wLower
        )
      ) {
        return wLower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  // Ensure first character is always capitalized
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  return cleaned || 'Chat Discussion';
}

export default function LunaChatPage({ data, updateData }: LunaChatPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Instant User Profile Cache (Firebase Gmail photoURL, display name, email)
  const userProfile = useUserProfile();

  // User Greeting Name (Proper Title Case & Personal Name Prioritized)
  const userName = useMemo(() => {
    try {
      const full = userProfile.displayName || auth.currentUser?.displayName || getCachedUserName() || '';
      if (full) {
        const parts = full.trim().split(/\s+/);
        // Look for Avineesh or personal name first
        const avineesh = parts.find((p) => /avineesh/i.test(p));
        if (avineesh) {
          return 'Avineesh';
        }
        // If first word is surname like GUJJETI and second word exists, prefer the second word
        if (parts.length > 1 && /gujjeti/i.test(parts[0])) {
          const second = parts[1];
          return second.charAt(0).toUpperCase() + second.slice(1).toLowerCase();
        }
        const first = parts[0];
        return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
      }
    } catch {}
    return 'there';
  }, [userProfile.displayName]);

  // API Key Management & Direct Sync with Application Settings
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getGroqApiKey() || data?.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaveSuccess, setApiKeySaveSuccess] = useState(false);

  // Hydrate API key cleanly into device-local secure storage (do not re-upload plaintext key to Firestore)
  useEffect(() => {
    const currentCached = getGroqApiKey();
    const legacySettingsKey = (data?.geminiApiKey || '').trim();
    if (legacySettingsKey && !currentCached) {
      setGroqApiKey(legacySettingsKey);
      setApiKeyInput(legacySettingsKey);
    } else if (currentCached) {
      setApiKeyInput(currentCached);
    }
  }, [data?.geminiApiKey]);

  // Handle Save API key strictly in device storage (Preferences/localStorage)
  const handleSaveApiKey = async (newKey: string) => {
    const trimmed = newKey.trim();
    await setGroqApiKey(trimmed);
    setApiKeyInput(trimmed);
    setApiKeySaveSuccess(true);
    triggerHaptic('success');
    setTimeout(() => {
      setApiKeySaveSuccess(false);
      setIsApiKeyModalOpen(false);
    }, 700);
  };

  // Active Model State (automatically purges stale/retired model IDs)
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('lifeos_active_luna_model');
      if (
        saved &&
        (ALLOWED_CHAT_MODELS as readonly string[]).includes(saved) &&
        !(RETIRED_MODELS as readonly string[]).includes(saved)
      ) {
        return saved;
      }
      localStorage.setItem('lifeos_active_luna_model', CHAT_PRIMARY);
      return CHAT_PRIMARY;
    } catch {
      return CHAT_PRIMARY;
    }
  });
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);

  // Chat History Drawer State
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Active Session State (Defaults to fresh clean chat on every open)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const stateSessionId = (location.state as any)?.sessionId;
      return stateSessionId || null;
    } catch {
      return null;
    }
  });

  // Messages State (Always opens brand new chat by default; restores only if explicitly selected)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stateSessionId = (location.state as any)?.sessionId;
      if (stateSessionId && data?.aiChatHistory) {
        const found = data.aiChatHistory.find((s) => s.id === stateSessionId);
        if (found?.messages && found.messages.length > 0) return found.messages;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Query & Generation State
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [actionProposals, setActionProposals] = useState<Record<string, AiActionProposal[]>>({});

  // Multimodal Image Attachments
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '36px';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, 36), 130)}px`;
    }
  }, [inputQuery]);

  // Record screen view, clean ephemeral cache, and autofocus for fresh chat
  useEffect(() => {
    recordScreenView('Luna AI Interface');
    // Ensure ephemeral cache is purged on open so every entry starts a brand new conversation
    const stateSessionId = (location.state as any)?.sessionId;
    if (!stateSessionId) {
      try {
        localStorage.removeItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
        localStorage.removeItem('lifeos_active_session_id');
      } catch {}
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, [location.state]);

  // Clean ephemeral storage on unmount so navigating back always yields a new chat
  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
        localStorage.removeItem('lifeos_active_session_id');
      } catch {}
    };
  }, []);

  // Stop TTS speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Persist messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll chat to bottom
  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Persist Session to History with Intelligent Topic Heading and Strict Continuity
  const persistSessionToHistory = (
    sessionMessages: ChatMessage[],
    currentSessionId: string | null
  ) => {
    if (sessionMessages.length === 0) return currentSessionId;
    const firstUserMsg = sessionMessages.find((m) => m.role === 'user');
    if (!firstUserMsg) return currentSessionId;

    const firstAssistantMsg = sessionMessages.find((m) => m.role === 'assistant');
    const existingHistory: AiChatSession[] = data?.aiChatHistory || [];
    const sessionId =
      currentSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const existingIndex = existingHistory.findIndex((s) => s.id === sessionId);
    const existingSession = existingIndex >= 0 ? existingHistory[existingIndex] : null;

    // Determine clean topic title: preserve if already refined, or generate executive topic heading
    let sessionTitle = '';
    if (
      existingSession?.title &&
      !existingSession.title.endsWith('...') &&
      existingSession.title !== 'Chat with Luna' &&
      !/^(what\s+are|what\s+is|can\s+you|please|could\s+you|tell\s+me)/i.test(existingSession.title)
    ) {
      sessionTitle = existingSession.title;
    } else {
      sessionTitle = extractMainTopicHeading(firstUserMsg.content, firstAssistantMsg?.content);
    }

    const sessionObj: AiChatSession = {
      id: sessionId,
      title: sessionTitle,
      createdAt: existingSession ? existingSession.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pathname: '/ai',
      messages: sessionMessages,
    };

    let updatedHistory: AiChatSession[] = [];
    if (existingIndex >= 0) {
      // Re-order active thread to top of history while keeping historical threads intact
      const remaining = existingHistory.filter((s) => s.id !== sessionId);
      updatedHistory = [sessionObj, ...remaining];
    } else {
      updatedHistory = [sessionObj, ...existingHistory];
    }

    updateData({ aiChatHistory: updatedHistory });
    try {
      localStorage.setItem('lifeos_ai_history_sessions', JSON.stringify(updatedHistory));
      localStorage.setItem('lifeos_active_session_id', sessionId);
    } catch {}

    return sessionId;
  };

  // Start New Chat Thread (Resets canvas & continuity cleanly)
  const handleStartNewChat = () => {
    triggerHaptic('medium');
    setMessages([]);
    setActionProposals({});
    setAttachedImages([]);
    setErrorMessage(null);
    setActiveSessionId(null);
    setIsHistoryDrawerOpen(false);
    try {
      localStorage.removeItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
      localStorage.removeItem('lifeos_active_session_id');
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Reopen existing history thread with full context continuity
  const handleReopenSession = (session: AiChatSession) => {
    triggerHaptic('light');
    setMessages(session.messages || []);
    setActiveSessionId(session.id);
    setIsHistoryDrawerOpen(false);
    setErrorMessage(null);
    try {
      localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(session.messages || []));
      localStorage.setItem('lifeos_active_session_id', session.id);
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Delete session from history
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    const existingHistory: AiChatSession[] = data?.aiChatHistory || [];
    const updated = existingHistory.filter((s) => s.id !== sessionId);
    updateData({ aiChatHistory: updated });
    try {
      localStorage.setItem('lifeos_ai_history_sessions', JSON.stringify(updated));
    } catch {}

    if (activeSessionId === sessionId) {
      handleStartNewChat();
    }
  };

  // Clear all past sessions
  const handleClearAllSessions = () => {
    triggerHaptic('medium');
    if (window.confirm('Delete all past conversation threads? This action cannot be undone.')) {
      updateData({ aiChatHistory: [] });
      try {
        localStorage.removeItem('lifeos_ai_history_sessions');
        localStorage.removeItem('lifeos_active_session_id');
      } catch {}
      handleStartNewChat();
    }
  };

  // Copy message
  const handleCopyMessage = (msgId: string, content: string) => {
    triggerHaptic('light');
    const clean = stripUrls(content);
    navigator.clipboard.writeText(clean);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-To-Speech Toggle
  const handleToggleSpeak = (msgId: string, content: string) => {
    triggerHaptic('light');
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      const clean = stripUrls(content);
      const started = speakText(clean, (speaking) => {
        if (!speaking) setSpeakingMsgId(null);
      });
      if (started) {
        setSpeakingMsgId(msgId);
      }
    }
  };

  // Regenerate last response
  const handleRegenerate = async () => {
    if (isGenerating || messages.length === 0) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const realUserIdx = messages.length - 1 - lastUserIdx;
    const lastUserQuery = messages[realUserIdx].content;
    const trimmedMessages = messages.slice(0, realUserIdx);
    setMessages(trimmedMessages);
    await handleSendQuery(lastUserQuery, trimmedMessages);
  };

  // Photo Attachments (Multimodal)
  const handleCameraCapture = async () => {
    setIsAttachMenuOpen(false);
    triggerHaptic('light');
    setPickingImage(true);
    try {
      const attached = await capturePhotoFromCamera();
      if (attached) {
        setAttachedImages((prev) => [...prev, attached].slice(0, 3));
        triggerHaptic('success');
      }
    } catch (err: any) {
      setErrorMessage('Camera access was cancelled or unavailable.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleGalleryPick = async () => {
    setIsAttachMenuOpen(false);
    triggerHaptic('light');
    setPickingImage(true);
    try {
      const attached = await pickPhotoFromGallery();
      if (attached) {
        setAttachedImages((prev) => [...prev, attached].slice(0, 3));
        triggerHaptic('success');
      }
    } catch (err: any) {
      setErrorMessage('Gallery selection was cancelled.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPickingImage(true);
    try {
      const newImages: AttachedImage[] = [];
      for (const file of files.slice(0, 3 - attachedImages.length)) {
        const attached = await processFileToAttachedImage(file);
        if (attached) newImages.push(attached);
      }
      if (newImages.length > 0) {
        setAttachedImages((prev) => [...prev, ...newImages].slice(0, 3));
        triggerHaptic('success');
      }
    } catch (err: any) {
      setErrorMessage('Failed to load selected photo.');
    } finally {
      setPickingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Speech Dictation
  const handleToggleVoiceRecord = async () => {
    triggerHaptic('medium');
    if (isRecording) {
      // Stop recording
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = true;
          recognition.continuous = false;

          recognition.onresult = (e: any) => {
            const transcript = Array.from(e.results)
              .map((r: any) => r[0].transcript)
              .join('');
            setInputQuery(transcript);
          };

          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);

          speechRecognitionRef.current = recognition;
          recognition.start();
          setIsRecording(true);
        } else {
          // Native media recorder fallback
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          audioChunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setTranscribing(true);
            try {
              const res = await transcribeAudio(audioBlob);
              if (res?.text) setInputQuery((prev) => (prev ? `${prev} ${res.text}` : res.text));
            } catch {
              setErrorMessage('Failed to transcribe audio.');
            } finally {
              setTranscribing(false);
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start();
          setIsRecording(true);
        }
      } catch {
        setErrorMessage('Microphone permission not granted.');
        setIsRecording(false);
      }
    }
  };

  // Send Message & Stream AI Response
  const handleSendQuery = async (queryText: string = inputQuery, baseHistory: ChatMessage[] = messages) => {
    const trimmed = queryText.trim();
    const imagesToSend = attachedImages.map((i) => i.dataUrl);
    const hasImages = imagesToSend.length > 0;

    if (!trimmed && !hasImages) return;
    if (isGenerating) return;

    triggerHaptic('selection');
    setInputQuery('');
    setAttachedImages([]);
    setIsAttachMenuOpen(false);
    setErrorMessage(null);

    const userMessageId = `msg_${Date.now()}_u`;
    const assistantMessageId = `msg_${Date.now()}_a`;

    const userMsgContent =
      trimmed || (hasImages ? 'Please extract and organize the points from these attached images.' : '');

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userMsgContent,
      timestamp: new Date().toISOString(),
      images: hasImages ? imagesToSend : undefined,
    };

    const newMessages = [...baseHistory, userMsg];
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
            setMessages((prev) => {
              const hasAssistant = prev.some((m) => m.id === assistantMessageId);
              if (hasAssistant) {
                return prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content: accumulatedResponse } : msg
                );
              }
              return [
                ...prev,
                {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: accumulatedResponse,
                  timestamp: new Date().toISOString(),
                },
              ];
            });
            rafId = null;
          });
        }
      };

      await streamChatCompletion(
        newMessages.map((m) => ({ role: m.role, content: m.content, images: m.images })),
        '/ai',
        targetedContext,
        (token: string) => {
          scheduleTokenUpdate(token);
        },
        (fullText: string) => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          accumulatedResponse = fullText;
          const { proposals } = extractAiActionProposals(accumulatedResponse);
          if (proposals.length > 0) {
            setActionProposals((prev) => ({
              ...prev,
              [assistantMessageId]: proposals,
            }));
          }

          const assistantMsg: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedResponse,
            timestamp: new Date().toISOString(),
          };

          const finalMessages = [...newMessages, assistantMsg];

          setMessages(finalMessages);
          const updatedSessionId = persistSessionToHistory(finalMessages, activeSessionId);
          setActiveSessionId(updatedSessionId);
          setIsGenerating(false);
          triggerHaptic('light');
        },
        (err: Error) => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          setIsGenerating(false);
          setErrorMessage(err?.message || 'Luna response encountered an issue.');
          if (!accumulatedResponse.trim()) {
            setMessages(newMessages);
          } else {
            const partialAssistantMsg: ChatMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulatedResponse,
              timestamp: new Date().toISOString(),
            };
            const partialMessages = [...newMessages, partialAssistantMsg];
            setMessages(partialMessages);
            persistSessionToHistory(partialMessages, activeSessionId);
          }
        },
        abortControllerRef.current.signal,
        { preferredModel: selectedModel, userId: auth.currentUser?.uid, appData: data }
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setIsGenerating(false);
        return;
      }
      setErrorMessage(err?.message || 'Luna engine temporarily unreachable. Please try again.');
      setIsGenerating(false);
      triggerHaptic('error');
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId || m.content.trim().length > 0));
    }
  };

  // Filtered History Sessions for Search Drawer
  const filteredSessions = useMemo(() => {
    const list: AiChatSession[] = data?.aiChatHistory || [];
    if (!historySearchQuery.trim()) return list;
    const q = historySearchQuery.toLowerCase();
    return list.filter((s) => s.title.toLowerCase().includes(q));
  }, [data?.aiChatHistory, historySearchQuery]);

  // Grouped Chat Sessions by Date (Today, Yesterday, Previous 7 Days, Older)
  const groupedSessions = useMemo(() => {
    const groups: { label: string; sessions: AiChatSession[] }[] = [
      { label: 'Today', sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'Previous 7 Days', sessions: [] },
      { label: 'Older', sessions: [] },
    ];

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    filteredSessions.forEach((session) => {
      try {
        const date = session.updatedAt ? parseISO(session.updatedAt) : parseISO(session.createdAt);
        if (isToday(date)) {
          groups[0].sessions.push(session);
        } else if (isYesterday(date)) {
          groups[1].sessions.push(session);
        } else if (isAfter(date, sevenDaysAgo)) {
          groups[2].sessions.push(session);
        } else {
          groups[3].sessions.push(session);
        }
      } catch {
        groups[3].sessions.push(session);
      }
    });

    return groups.filter((g) => g.sessions.length > 0);
  }, [filteredSessions]);

  // Active Model Name Display
  const activeModelDisplay = useMemo(() => {
    const found = AI_MODELS.find((m) => m.id === selectedModel);
    return found ? found.name : 'Luna 2.0';
  }, [selectedModel]);

  return (
    <div className="w-full min-h-screen text-white select-none font-sans flex flex-col bg-black relative overflow-x-hidden">
      {/* ── 1. ChatGPT Top Navigation Header (Floating Liquid Glass Island) ── */}
      <header
        className="fixed top-0 inset-x-0 z-40 max-w-lg mx-auto pointer-events-none"
        style={{
          paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 48px) + 8px)',
        }}
      >
        {/* Soft Ambient Vignette Shield to prevent message overlap with device status bar */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black via-black/85 to-transparent pointer-events-none" />

        {/* Floating Capsule Toolbar */}
        <div className="relative mx-3.5 h-[52px] px-2 rounded-full glass-nav nav-rim-light shadow-2xl flex items-center justify-between pointer-events-auto">
          {/* Left: Navigation Controls (Back & Chat Threads Drawer) */}
          <div className="flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                navigateBack(navigate);
              }}
              className="w-9 h-9 rounded-full glass-tile flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
              aria-label="Back"
              title="Back"
            >
              <CaretLeft size={18} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsHistoryDrawerOpen(true);
              }}
              className="w-9 h-9 rounded-full glass-tile flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
              aria-label="Chat Threads"
              title="Chat Threads"
            >
              <ClockCounterClockwise size={18} weight="bold" />
            </button>
          </div>

          {/* Center: Executive Model Selector Capsule (Mathematically Centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setIsModelSheetOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-tile hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none touch-manipulation shadow-sm group"
              aria-label="Select Intelligence Model"
            >
              <div className="w-5 h-5 rounded-[6px] bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.3)] shrink-0">
                <LunaComicBubbleIcon size={13} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[13px] font-bold tracking-tight text-white leading-none whitespace-nowrap">
                  {activeModelDisplay}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_#30D158] shrink-0" title="Online & Ready" />
              </div>
              <CaretDown size={11} weight="bold" className="text-white/40 group-hover:text-white/80 transition-colors ml-0.5 shrink-0" />
            </button>
          </div>

          {/* Right: Actions (Start New Chat) */}
          <div className="flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="w-9 h-9 rounded-full glass-tile flex items-center justify-center text-[#A5A3FF] hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
              aria-label="Start New Chat"
              title="Start New Chat"
            >
              <NotePencil size={18} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Slide-Over Chat History Drawer (ChatGPT Sidebar) ── */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <>
            {/* Ambient Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/75 touch-manipulation"
            />

            {/* Slide-Over Drawer Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[86%] max-w-[340px] bg-[#0E0E12] flex flex-col p-4 shadow-[0_24px_64px_rgba(0,0,0,0.95)] text-left select-none"
              style={{
                paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 48px) + 12px)',
                paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 16px) + 14px)',
              }}
            >
              {/* Drawer Top Navigation Header */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0A84FF]/25 to-[#5E5CE6]/20 flex items-center justify-center text-[#0A84FF] shadow-[0_0_12px_rgba(10,132,255,0.25)] shrink-0">
                    <LunaComicBubbleIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-tight leading-none">Chat Threads</h3>
                    <p className="text-[11px] font-medium text-white/40 mt-1 leading-none">Luna Intelligence History</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="w-8 h-8 rounded-full glass-tile flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
                  aria-label="Close Drawer"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>

              {/* Start New Chat Action Card */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="w-full mt-2 p-3 rounded-2xl glass-card hover:bg-white/[0.08] active:scale-[0.98] transition-all flex items-center justify-between shadow-lg cursor-pointer group touch-manipulation text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0A84FF]/25 to-[#5E5CE6]/25 flex items-center justify-center text-[#0A84FF] shrink-0 shadow-sm">
                    <Plus size={15} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white tracking-tight block">Start New Chat</span>
                    <span className="text-[10px] text-white/40 font-medium block">Fresh context thread</span>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-bold text-white/50 tracking-wider">
                  NEW
                </div>
              </button>

              {/* Spotlight Search Box */}
              <div className="relative mt-3 mb-2">
                <div className="relative flex items-center rounded-xl glass-tile px-3 py-2 text-xs">
                  <MagnifyingGlass size={14} weight="bold" className="text-white/40 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search past conversations..."
                    className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none font-medium"
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="text-white/40 hover:text-white p-0.5"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grouped Threads Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 mt-1 pr-1 custom-table-scrollbar">
                {groupedSessions.length === 0 ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center select-none">
                    <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-white/30 mb-3 shadow-inner">
                      <ChatCircleDots size={22} weight="duotone" />
                    </div>
                    <h5 className="text-xs font-bold text-white/70 mb-1">
                      {historySearchQuery ? 'No Results Found' : 'No Conversations Yet'}
                    </h5>
                    <p className="text-[11px] text-white/40 max-w-[200px] leading-relaxed">
                      {historySearchQuery
                        ? 'Try searching with a different keyword or topic.'
                        : 'Conversations you have with Luna will appear here automatically.'}
                    </p>
                  </div>
                ) : (
                  groupedSessions.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-white/35 px-2 pt-1 pb-1">
                        {group.label}
                      </div>
                      {group.sessions.map((session) => {
                        const isCurrent = activeSessionId === session.id;
                        return (
                          <div
                            key={session.id}
                            onClick={() => handleReopenSession(session)}
                            className={`group relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 touch-manipulation ${
                              isCurrent ? 'droplet-active shadow-md' : 'glass-tile hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-lg glass-flat flex items-center justify-center text-white/50 group-hover:text-white/80 shrink-0">
                              <ChatCircleText size={14} weight="duotone" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-white/90 truncate leading-snug">
                                {session.title || 'Untitled Thread'}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-white/40">
                                <span>{session.messages?.length || 0} messages</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all touch-manipulation shrink-0"
                              title="Delete thread"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer: User Profile & Quick Actions */}
              <div className="pt-3 mt-auto flex items-center justify-between border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setApiKeyInput(getGroqApiKey() || data?.geminiApiKey || '');
                    setShowApiKey(false);
                    setApiKeySaveSuccess(false);
                    setIsApiKeyModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 min-w-0 text-left p-1 -ml-1 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer group flex-1 touch-manipulation"
                  title="Configure Groq AI API Key"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#0A84FF]/30 to-[#BF5AF2]/30 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 ">
                    {userProfile.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt={userName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{userName.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Key size={12} weight="fill" className="text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate leading-none">{userName}</h4>
                      <Key size={11} weight="bold" className="text-white/40 group-hover:text-[#0A84FF] transition-colors shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_#30D158]" />
                      <span className="text-[10px] text-white/40 font-medium truncate">{activeModelDisplay}</span>
                    </div>
                  </div>
                </button>

                {data?.aiChatHistory && data.aiChatHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSessions}
                    className="p-2 rounded-xl glass-tile text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 ml-1 touch-manipulation"
                    title="Clear all chat history"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 3. Model Selection Bottom Sheet ── */}
      <AnimatePresence>
        {isModelSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModelSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto p-4 rounded-t-[28px] bg-[#141418] shadow-2xl text-left"
              style={{
                paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 16px) + 12px)',
              }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-sm font-bold text-white tracking-tight">Select Intelligence Model</h3>
                <button
                  type="button"
                  onClick={() => setIsModelSheetOpen(false)}
                  className="w-7 h-7 rounded-full glass-tile flex items-center justify-center text-white/60 hover:text-white"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              <div className="space-y-2 mt-3">
                {AI_MODELS.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedModel(m.id);
                        try {
                          localStorage.setItem('lifeos_active_luna_model', m.id);
                        } catch {}
                        setIsModelSheetOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected ? 'droplet-active shadow-md' : 'glass-tile'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl glass-flat flex items-center justify-center shrink-0">
                          {m.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{m.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-white/70">
                              {m.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 mt-0.5 leading-snug truncate">{m.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0A84FF] flex items-center justify-center text-white shrink-0">
                          <Check size={12} weight="bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* API Key Settings Shortcut inside Model Selector */}
              <div className="pt-3 border-t border-white/[0.06] mt-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsModelSheetOpen(false);
                    setApiKeyInput(getGroqApiKey() || data?.geminiApiKey || '');
                    setShowApiKey(false);
                    setApiKeySaveSuccess(false);
                    setIsApiKeyModalOpen(true);
                  }}
                  className="w-full p-3 rounded-2xl glass-tile flex items-center justify-between text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] shrink-0">
                      <Key size={14} weight="bold" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Groq AI API Key</div>
                      <div className="text-[10.5px] text-white/40">
                        {getGroqApiKey() || data?.geminiApiKey ? 'Custom Key Synced (Masked)' : 'Using Default Intelligence Proxy'}
                      </div>
                    </div>
                  </div>
                  <CaretRight size={14} weight="bold" className="text-white/40" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 4. API Key Configuration Liquid Glass Modal ── */}
      <AnimatePresence>
        {isApiKeyModalOpen && (
          <>
            {/* Liquid Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => {
                triggerHaptic('light');
                setIsApiKeyModalOpen(false);
              }}
              className="fixed inset-0 z-50 bg-black/80"
            />

            {/* Modal Card */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                className="w-full max-w-sm rounded-[28px] bg-[#141418] p-5 shadow-2xl pointer-events-auto border-none space-y-4"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] shadow-sm shrink-0">
                      <Key size={17} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Groq AI API Key</h3>
                      <p className="text-[11px] text-white/40">Synchronized with App Settings</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsApiKeyModalOpen(false);
                    }}
                    className="w-7 h-7 rounded-full glass-tile flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer touch-manipulation"
                    aria-label="Close"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>

                {/* Live Sync Status Banner */}
                <div className="p-3 rounded-2xl bg-white/[0.04] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        apiKeyInput.trim()
                          ? 'bg-[#30D158] shadow-[0_0_8px_#30D158]'
                          : 'bg-[#FF9F0A] shadow-[0_0_8px_#FF9F0A]'
                      }`}
                    />
                    <span className="text-xs font-semibold text-white/90">
                      {apiKeyInput.trim() ? 'Custom API Key Active' : 'Proxy Fallback Mode'}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-white/40">
                    {apiKeyInput.trim() ? 'Direct Mode' : 'Default Proxy'}
                  </span>
                </div>

                {/* API Key Input Field (Masked in Asterisks by Default) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
                    API Key
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-white/[0.06] px-3.5 py-2.5 text-xs focus-within:ring-1 focus-within:ring-[#0A84FF]/60 transition-all">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="gsk_••••••••••••••••••••••••"
                      className="w-full bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none font-mono tracking-wider"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setShowApiKey((prev) => !prev);
                      }}
                      className="p-1 rounded-lg text-white/40 hover:text-white transition-colors shrink-0 ml-1.5 cursor-pointer touch-manipulation"
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-white/40 leading-relaxed pt-0.5">
                    API key is masked in asterisks. Synced directly with Settings &gt; AI and secured in device storage.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {apiKeyInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSaveApiKey('')}
                      className="flex-1 py-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/15 text-white/60 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer text-center touch-manipulation"
                    >
                      Clear Key
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveApiKey(apiKeyInput)}
                    className="flex-1 py-2.5 rounded-2xl bg-[#0A84FF] text-white text-xs font-bold hover:bg-[#0A84FF]/90 active:scale-95 transition-all shadow-[0_0_16px_rgba(10,132,255,0.35)] cursor-pointer text-center flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    {apiKeySaveSuccess ? (
                      <>
                        <Check size={14} weight="bold" />
                        <span>Saved &amp; Synced!</span>
                      </>
                    ) : (
                      <span>Save &amp; Sync</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── 5. Main Chat Viewport ── */}
      <main
        ref={chatContainerRef}
        className={`flex-1 w-full max-w-lg mx-auto px-4 overflow-y-auto custom-table-scrollbar ${messages.length === 0 ? "flex flex-col justify-center" : ""}`}
        style={{
          paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 48px) + 70px)',
          paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 16px) + 160px)',
        }}
      >
        {/* ── Empty State Hero: Centered Logo & Welcome Greeting ── */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center select-none py-6 my-auto">
            {/* Ambient Glowing Luna Starburst Brand Emblem */}
            <div className="relative mb-4 flex items-center justify-center select-none pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 rounded-[28px] bg-[#0A84FF]/25 blur-2xl scale-125" />
              <div
                className="w-16 h-16 rounded-[20px] flex items-center justify-center text-white shadow-2xl relative border-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, rgba(20,20,24,0.98) 100%)',
                  boxShadow:
                    '0 20px 40px -10px rgba(0, 0, 0, 0.95), 0 0 32px -4px rgba(10, 132, 255, 0.40)',
                }}
              >
                <LunaComicBubbleIcon size={34} className="text-[#0A84FF] drop-shadow-[0_0_12px_rgba(10,132,255,0.6)]" />
              </div>
            </div>

            {/* Personalized Executive Greeting */}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
              How can I help you today, {userName}?
            </h2>

            {/* Intelligence Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-tile text-[11.5px] font-semibold text-white/60 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_#30D158]" />
              <span>Ask about workouts, schedule, budget, or studies</span>
            </div>
          </div>
        ) : (
          /* ── Active Conversation Stream ── */
          <div className="space-y-5 pt-2">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const proposals = actionProposals[msg.id] || [];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* User Message Bubble */}
                  {isUser ? (
                    <div className="max-w-[86%] rounded-[22px] rounded-br-[6px] bg-[#1C1C22] px-4 py-3 text-white text-[13.5px] leading-relaxed shadow-lg font-sans border-none">
                      {/* Attached images preview */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex gap-1.5 mb-2 overflow-x-auto">
                          {msg.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="attachment"
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    /* Assistant Message Stream (Full Width with Avatar) */
                    <div className="w-full text-left space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-xl glass-tile flex items-center justify-center text-[#0A84FF] shadow-sm shrink-0">
                          <LunaComicBubbleIcon size={15} />
                        </div>
                        <span className="text-xs font-bold text-white/90">Luna</span>
                      </div>

                      {/* Main Message Body */}
                      <div className="pl-1 w-full text-[13.5px] leading-relaxed text-white/95">
                        {msg.content ? (
                          <div className="relative">
                            <FormattedAiMessage content={msg.content} isUser={false} />
                            {isGenerating && messages[messages.length - 1]?.id === msg.id && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#0A84FF] animate-pulse align-middle rounded-sm" />
                            )}
                          </div>
                        ) : isGenerating ? (
                          <div className="flex items-center gap-1.5 py-1 text-white/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]/70 animate-pulse [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]/40 animate-pulse [animation-delay:300ms]" />
                          </div>
                        ) : null}
                      </div>

                      {/* Action Confirmation Cards */}
                      {proposals.length > 0 && (
                        <div className="space-y-2 mt-2 pt-1 pl-1">
                          {proposals.map((prop, pIdx) => (
                            <ActionConfirmationCard
                              key={pIdx}
                              proposal={prop}
                              updateData={updateData}
                              currentData={data}
                              onExecuted={() => triggerHaptic('success')}
                            />
                          ))}
                        </div>
                      )}

                      {/* Action Toolbar */}
                      {msg.content && !isGenerating && (
                        <div className="flex items-center gap-1.5 pt-1.5 pl-1 text-white/40">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check size={14} weight="bold" className="text-[#30D158]" />
                            ) : (
                              <Copy size={14} weight="bold" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.content)}
                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${
                              speakingMsgId === msg.id ? 'text-[#0A84FF]' : 'hover:text-white'
                            }`}
                            title="Read aloud"
                          >
                            <SpeakerHigh size={14} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                            title="Regenerate response"
                          >
                            <ArrowClockwise size={14} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => shareContent(msg.content, 'Luna Response')}
                            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                            title="Share"
                          >
                            <ShareNetwork size={14} weight="bold" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* If last message is user query and Luna is not generating, offer 1-tap regenerate */}
            {!isGenerating &&
              messages.length > 0 &&
              messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-center gap-2 pl-1 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendQuery(
                        messages[messages.length - 1].content,
                        messages.slice(0, -1)
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] text-xs font-semibold hover:bg-[#0A84FF]/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowClockwise size={13} weight="bold" />
                    <span>Generate Luna Response</span>
                  </button>
                </div>
              )}

            {/* End-of-Stream Dynamic Status & Chatbot Logo Indicator */}
            <AnimatePresence mode="popLayout">
              {isGenerating ? (
                <motion.div
                  key="generating-state"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 pl-1 pt-1.5 text-xs text-[#0A84FF] font-semibold"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 rounded-[6px] bg-[#0A84FF]/15 flex items-center justify-center text-[#0A84FF] shrink-0 shadow-[0_0_8px_rgba(10,132,255,0.25)]"
                  >
                    <LunaComicBubbleIcon size={14} />
                  </motion.div>
                  <span className="tracking-tight">Luna is thinking and generating points...</span>
                </motion.div>
              ) : (
                messages.length > 0 &&
                messages[messages.length - 1]?.role === 'assistant' && (
                  <motion.div
                    key="idle-logo-state"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                    className="flex items-center gap-2 pl-1 pt-2 pb-1"
                  >
                    <div
                      className="w-5 h-5 rounded-[6px] bg-[#0A84FF]/15 flex items-center justify-center text-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.2)] shrink-0"
                      title="Luna Ready"
                    >
                      <LunaComicBubbleIcon size={13} />
                    </div>
                    <span className="text-[11px] font-semibold text-white/35 tracking-tight">
                      Luna is ready
                    </span>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-300 text-xs flex items-center justify-between gap-2 mt-2">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 text-rose-300 hover:text-white"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── 5. ChatGPT Floating Bottom Input Dock with Soft Blur & Gradient Shield ── */}
      <footer
        className="fixed bottom-0 inset-x-0 z-40 max-w-lg mx-auto pointer-events-none pb-2.5"
        style={{
          paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 12px) + 6px)',
        }}
      >
        {/* High-Performance Progressive OLED Ambient Scrim Shield (Locked 120 FPS) */}
        <div
          className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.72) 44%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,0.15) 88%, rgba(0,0,0,0) 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative px-3.5 pointer-events-auto">
          {/* Minimized Quick-Access Starter Prompts (Docked above input bar, auto-hides when typing/active chat) */}
          <AnimatePresence>
            {messages.length === 0 && !inputQuery.trim() && !isInputFocused && attachedImages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="grid grid-cols-2 gap-2 mb-2.5 w-full pointer-events-auto"
              >
                {PROMPT_STARTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSendQuery(item.query)}
                    className="p-2 rounded-xl glass-card hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 text-left border-none shadow-md touch-manipulation select-none"
                  >
                    <div className="w-6 h-6 rounded-md glass-tile flex items-center justify-center shrink-0 shadow-sm text-white">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-bold text-white tracking-tight truncate leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[9.5px] text-white/45 truncate leading-tight mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Multimodal Attachment Picker Popover */}
          <AnimatePresence>
            {isAttachMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="mb-2 p-1.5 rounded-2xl glass-nav nav-rim-light shadow-2xl flex flex-col gap-1 w-48 text-left"
              >
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                >
                  <Camera size={16} weight="duotone" className="text-[#0A84FF]" />
                  <span>Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleGalleryPick}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                >
                  <Images size={16} weight="duotone" className="text-[#30D158]" />
                  <span>Photo Gallery</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached Photos Thumbnail Row */}
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 mb-2 px-1">
              {attachedImages.map((img) => (
                <div key={img.id} className="relative w-12 h-12 rounded-xl overflow-hidden glass-tile shadow-md">
                  <img src={img.dataUrl} alt="attach" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachedImages((prev) => prev.filter((i) => i.id !== img.id))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Main Input Dock: Matching Height Typing Capsule + Standalone Circular Send Pod */}
          <div className="flex items-end gap-2 w-full">
            {/* Resized & Refined Typing Bar Capsule */}
            <div className="flex-1 min-w-0 min-h-[50px] p-1.5 rounded-[25px] glass-nav nav-rim-light shadow-2xl flex items-center gap-1 border-none">
              {/* Attachment Button (+) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setIsAttachMenuOpen((prev) => !prev);
                }}
                className="w-[38px] h-[38px] rounded-full glass-tile flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
                title="Attach photo"
                aria-label="Attach photo"
              >
                <Plus size={18} weight="bold" />
              </button>

              {/* Auto-Expanding Textarea */}
              <textarea
                ref={inputRef}
                rows={1}
                value={inputQuery}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuery();
                  }
                }}
                placeholder="Message Luna..."
                className="flex-1 py-1.5 px-2 bg-transparent text-[14px] leading-[22px] text-white placeholder:text-white/35 focus:outline-none resize-none max-h-36 font-sans"
                style={{ height: '36px' }}
              />

              {/* Microphone Dictation Button */}
              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                    : 'glass-tile text-white/70 hover:text-white active:scale-95'
                }`}
                title="Voice Dictation"
                aria-label="Voice Dictation"
              >
                {isRecording ? <Stop size={16} weight="fill" /> : <Microphone size={17} weight="bold" />}
              </button>
            </div>

            {/* Separate Standalone Circular Send Pod - Exact Matching 50px Height */}
            <button
              type="button"
              disabled={!isGenerating && (!inputQuery.trim() && attachedImages.length === 0)}
              onClick={() => {
                triggerHaptic('medium');
                if (isGenerating) {
                  abortControllerRef.current?.abort();
                  setIsGenerating(false);
                } else {
                  handleSendQuery();
                }
              }}
              className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all shrink-0 select-none shadow-xl ${
                isGenerating
                  ? 'bg-white/20 text-white hover:bg-white/30 active:scale-95 shadow-[0_0_14px_rgba(255,255,255,0.25)] cursor-pointer'
                  : inputQuery.trim().length > 0 || attachedImages.length > 0
                  ? 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 active:scale-95 shadow-[0_0_18px_rgba(10,132,255,0.45)] cursor-pointer'
                  : 'bg-[#232329] text-white/70 hover:text-white cursor-default shadow-lg'
              }`}
              title={isGenerating ? 'Stop generating' : 'Send message'}
              aria-label={isGenerating ? 'Stop generating' : 'Send message'}
            >
              {isGenerating ? (
                <Square size={14} weight="fill" />
              ) : (
                <PaperPlaneRight size={20} weight="fill" className="translate-x-[1px]" />
              )}
            </button>
          </div>

          {/* Subtle ChatGPT Disclaimer */}
          <p className="text-[10px] text-white/40 text-center mt-1.5 tracking-tight font-medium">
            Luna can make mistakes. Verify important info.
          </p>
        </div>
      </footer>
    </div>
  );
}

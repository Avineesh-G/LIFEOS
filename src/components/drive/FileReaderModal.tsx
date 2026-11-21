import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, DriveFile, Expense, Task, NoteItem, WorkoutLog, MealItemLog, NutritionLog } from '../../types';
import { getDriveBlob } from '../../utils/idbStorage';
import { formatStorageSize } from '../../services/driveStorageService';
import { streamChatCompletion } from '../../services/aiClient';
import { triggerHaptic } from '../../utils/haptics';
import {
  CaretLeft,
  ShareNetwork,
  Trash,
  Sparkle,
  Wallet,
  Barbell,
  ForkKnife,
  CheckSquare,
  NotePencil,
  SpinnerGap,
  Check,
  WarningCircle,
  FileText,
  FilePdf,
  ArrowSquareOut,
  X,
} from '../../ui/tokens/icons';

interface FileReaderModalProps {
  file: DriveFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteFile?: (file: DriveFile) => void;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

type ExtractedModule = 'FINANCE' | 'GYM' | 'NUTRITION' | 'TASKS' | 'NOTES';

interface ExtractedInfoResult {
  module: ExtractedModule;
  title: string;
  summary: string;
  fields: { label: string; value: string }[];
  action: {
    type: 'ADD_EXPENSE' | 'LOG_WORKOUT' | 'LOG_MEAL' | 'ADD_TASK' | 'ADD_NOTE';
    payload: Record<string, any>;
  };
}

/**
 * Extracts printable ASCII/UTF-8 text streams from a PDF binary blob
 * for downstream AI analysis without requiring heavyweight external WASM binaries.
 */
async function extractTextFromPdfBlob(blob: Blob): Promise<string> {
  try {
    const buffer = await blob.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(buffer);

    // Extract text in PDF parentheses: (text) Tj or (text) ' or (text) "
    const matches = raw.match(/\(([^()]{2,})\)\s*(?:Tj|'|")/g) || [];
    const extracted = matches
      .map((m) => m.replace(/^[(\s]+|[)\s]+(?:Tj|'|")?$/g, '').trim())
      .filter((s) => s.length > 1 && !s.includes('\\'))
      .join(' ');

    if (extracted.length > 40) {
      return extracted.slice(0, 4000);
    }

    // Fallback: clean ASCII alphanumeric lines
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/[^\x20-\x7E]/g, ' ').trim())
      .filter(
        (l) =>
          l.length > 5 &&
          !l.startsWith('%') &&
          !l.startsWith('/') &&
          !l.includes('obj') &&
          !l.includes('endobj') &&
          !l.includes('stream')
      )
      .slice(0, 100)
      .join(' ');

    return lines.slice(0, 4000);
  } catch {
    return '';
  }
}

export function FileReaderModal({
  file,
  isOpen,
  onClose,
  onDeleteFile,
  data,
  updateData,
}: FileReaderModalProps) {
  const navigate = useNavigate();

  // Content states
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // AI Extraction state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInfoResult | null>(null);
  const [actionAdded, setActionAdded] = useState(false);
  const [actionAddedMessage, setActionAddedMessage] = useState('');

  const fileExt = useMemo(() => {
    if (!file) return '';
    return file.name.split('.').pop()?.toLowerCase() || '';
  }, [file]);

  const parentFolder = useMemo(() => {
    if (!file?.folderId) return null;
    return (data?.driveFolders || []).find((f) => f.id === file.folderId) || null;
  }, [file?.folderId, data?.driveFolders]);

  const isImage = useMemo(() => {
    return (
      ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'svg'].includes(fileExt) ||
      Boolean(file?.mimeType?.startsWith('image/'))
    );
  }, [fileExt, file]);

  const isPdf = useMemo(() => {
    return fileExt === 'pdf' || Boolean(file?.mimeType?.includes('pdf'));
  }, [fileExt, file]);

  const isText = useMemo(() => {
    return (
      ['txt', 'md', 'json', 'csv', 'log', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'xml'].includes(fileExt) ||
      Boolean(file?.mimeType?.startsWith('text/'))
    );
  }, [fileExt, file]);

  const isAudio = useMemo(() => {
    return (
      ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(fileExt) ||
      Boolean(file?.mimeType?.startsWith('audio/'))
    );
  }, [fileExt, file]);

  const isVideo = useMemo(() => {
    return (
      ['mp4', 'mov', 'webm', 'mkv'].includes(fileExt) ||
      Boolean(file?.mimeType?.startsWith('video/'))
    );
  }, [fileExt, file]);

  // Load file content when opened
  useEffect(() => {
    if (!isOpen || !file) {
      setBlobUrl(null);
      setTextContent(null);
      setIsAiPanelOpen(false);
      setExtractedData(null);
      setActionAdded(false);
      setAiError(null);
      return;
    }

    let active = true;
    setIsLoadingContent(true);

    const loadContent = async () => {
      try {
        const cachedBlob = await getDriveBlob(file.id);

        if (cachedBlob && active) {
          const url = URL.createObjectURL(cachedBlob);
          setBlobUrl(url);

          if (isText) {
            const text = await cachedBlob.text();
            if (active) setTextContent(text);
          } else if (isPdf) {
            const pdfText = await extractTextFromPdfBlob(cachedBlob);
            if (active && pdfText) setTextContent(pdfText);
          }
        } else if (file.localCachedUri && isImage) {
          if (active) setBlobUrl(file.localCachedUri);
        } else if (file.downloadUrl) {
          if (active) setBlobUrl(file.downloadUrl);
          if (isText && active) {
            try {
              const res = await fetch(file.downloadUrl);
              if (res.ok) {
                const text = await res.text();
                if (active) setTextContent(text);
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('[FileReaderModal] Failed to load local blob:', err);
      } finally {
        if (active) setIsLoadingContent(false);
      }
    };

    loadContent();

    return () => {
      active = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, file?.id, isText, isPdf, isImage]);

  // Convert image to base64 for Vision AI
  const getImageBase64 = async (): Promise<string | null> => {
    if (!file) return null;

    try {
      const blob = await getDriveBlob(file.id);
      if (blob) {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      if (file.localCachedUri && file.localCachedUri.startsWith('data:')) {
        return file.localCachedUri;
      }

      if (file.downloadUrl) {
        const resp = await fetch(file.downloadUrl);
        const fetchedBlob = await resp.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fetchedBlob);
        });
      }
    } catch (err) {
      console.warn('[FileReaderModal] Failed to get base64 for AI:', err);
    }
    return null;
  };

  // Run AI Intelligence on the opened file (supports images, PDFs, and text)
  const handleRunAiExtraction = async () => {
    if (!file) return;
    triggerHaptic('medium');
    setIsAiPanelOpen(true);
    setIsAiAnalyzing(true);
    setAiError(null);
    setExtractedData(null);
    setActionAdded(false);

    try {
      let imageBase64: string | null = null;
      let textToAnalyze = textContent || '';

      if (isImage) {
        imageBase64 = await getImageBase64();
        if (!imageBase64) {
          throw new Error('Unable to read image data for AI analysis.');
        }
      } else if (isPdf && !textToAnalyze) {
        const blob = await getDriveBlob(file.id);
        if (blob) {
          textToAnalyze = await extractTextFromPdfBlob(blob);
        }
        if (!textToAnalyze) {
          textToAnalyze = `PDF Document Name: ${file.name}, File Size: ${formatStorageSize(file.fileSize)}`;
        }
      }

      const promptText = `You are the LifeOS Document & Image Intelligence Assistant.
Analyze this file (${file.name}, type: ${file.mimeType || fileExt}).
Your job is to:
1. Extract ALL factual information, text, numbers, items, dates, and details from this document/image.
2. Determine which LifeOS interface is the single best match to route and save this data:
   - "FINANCE": If this is a receipt, invoice, bill, ticket, expense, or purchase.
   - "GYM": If this is a workout routine, gym exercises, sets/reps, or fitness program.
   - "NUTRITION": If this is a meal, food item, nutrition label, recipe, or calories/macros.
   - "TASKS": If this contains action items, tasks, checklists, to-do lists, or deadlines.
   - "NOTES": If this contains study notes, class notes, meeting minutes, summary points, or memos.

Return a pure JSON code block in \`\`\`json with this EXACT structure:
{
  "module": "FINANCE" | "GYM" | "NUTRITION" | "TASKS" | "NOTES",
  "title": "Short descriptive title",
  "summary": "1-2 sentence human-readable explanation of what was extracted",
  "fields": [
    { "label": "Key Detail", "value": "Extracted Value" }
  ],
  "action": {
    "type": "ADD_EXPENSE" | "LOG_WORKOUT" | "LOG_MEAL" | "ADD_TASK" | "ADD_NOTE",
    "payload": { ... }
  }
}

Payload specifications:
- For ADD_EXPENSE: { "amount": number, "category": "Food" | "Transport" | "Shopping" | "Bills" | "Entertainment" | "Health" | "Other", "note": string, "date": "YYYY-MM-DD" }
- For LOG_WORKOUT: { "workoutName": string, "exercises": [ { "name": string, "sets": number, "reps": number, "weight": number } ], "notes": string }
- For LOG_MEAL: { "mealName": string, "calories": number, "portion": 1 }
- For ADD_TASK: { "title": string, "subtask": string, "dueDate": "YYYY-MM-DD" }
- For ADD_NOTE: { "title": string, "content": string }
`;

      let fullAiResponse = '';

      await streamChatCompletion(
        [
          {
            role: 'user',
            content: isImage
              ? promptText
              : `${promptText}\n\nDocument Text Content:\n${(textToAnalyze || file.name).slice(0, 4000)}`,
            images: imageBase64 ? [imageBase64] : undefined,
          },
        ],
        '/drive',
        '',
        (chunk) => {
          fullAiResponse += chunk;
        },
        (finalText) => {
          fullAiResponse = finalText;
        },
        (err) => {
          throw err;
        }
      );

      // Extract JSON from AI response
      const jsonMatch =
        fullAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || fullAiResponse.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error('Could not parse structured extraction data from AI response.');
      }

      const parsed: ExtractedInfoResult = JSON.parse(jsonMatch[1]);
      if (!parsed.module || !parsed.action) {
        throw new Error('AI extraction returned incomplete metadata.');
      }

      setExtractedData(parsed);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('[FileReaderModal] AI extraction failed:', err);
      setAiError(err?.message || 'Failed to analyze file with AI.');
      triggerHaptic('error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Dispatch extracted data into target LifeOS module
  const handleApplyAiAction = async () => {
    if (!extractedData) return;
    triggerHaptic('medium');

    try {
      const { action } = extractedData;
      const today = new Date().toISOString().split('T')[0];

      if (action.type === 'ADD_EXPENSE') {
        const newExpense: Expense = {
          id: `exp_${Date.now()}`,
          amount: Number(action.payload.amount) || 0,
          category: action.payload.category || 'Other',
          date: action.payload.date || today,
          note: action.payload.note || extractedData.title,
        };
        const currentExpenses = data?.expenses || [];
        await updateData({ expenses: [newExpense, ...currentExpenses] });
        setActionAddedMessage('Expense added to Finance!');
      } else if (action.type === 'ADD_TASK') {
        const newTask: Task = {
          id: `task_${Date.now()}`,
          text: action.payload.title || extractedData.title,
          subtask: action.payload.subtask || extractedData.summary,
          completed: false,
          date: action.payload.dueDate || today,
        };
        const currentTasks = data?.tasks || [];
        await updateData({ tasks: [newTask, ...currentTasks] });
        setActionAddedMessage('Task added to Today Schedule!');
      } else if (action.type === 'ADD_NOTE') {
        const newNote: NoteItem = {
          id: `note_${Date.now()}`,
          title: action.payload.title || extractedData.title,
          content: action.payload.content || extractedData.summary,
          pageView: 'white',
          monthKey: today.slice(0, 7),
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const currentNotes = data?.notes || [];
        await updateData({ notes: [newNote, ...currentNotes] });
        setActionAddedMessage('Note created in Notes & Ideas!');
      } else if (action.type === 'LOG_WORKOUT') {
        const newWorkout: WorkoutLog = {
          id: `wlog_${Date.now()}`,
          date: today,
          day: 'Custom',
          type: 'Custom AI Workout',
          exercises: (action.payload.exercises || []).map((ex: any) => ({
            name: ex.name || 'Exercise',
            sets: Array.from({ length: Number(ex.sets) || 3 }).map(() => ({
              weight: Number(ex.weight) || 0,
              reps: Number(ex.reps) || 10,
              completed: true,
            })),
          })),
        };
        const currentLogs = data?.workoutLogs || [];
        await updateData({ workoutLogs: [newWorkout, ...currentLogs] });
        setActionAddedMessage('Workout saved to Gym Log!');
      } else if (action.type === 'LOG_MEAL') {
        const newMeal: MealItemLog = {
          id: `meal_${Date.now()}`,
          name: action.payload.mealName || extractedData.title,
          calories: Number(action.payload.calories) || 0,
          portion: Number(action.payload.portion) || 1,
          isExtra: true,
        };
        const currentNutrition = data?.nutritionLogs || [];
        const todayLogIndex = currentNutrition.findIndex((n) => n.date === today);
        let updatedNutrition: NutritionLog[];
        if (todayLogIndex >= 0) {
          const existing = currentNutrition[todayLogIndex];
          const updatedMeals = [...existing.mealsEaten];
          const snacksIdx = updatedMeals.findIndex((m) => m.slot === 'snacks');
          if (snacksIdx >= 0) {
            updatedMeals[snacksIdx] = {
              ...updatedMeals[snacksIdx],
              items: [...updatedMeals[snacksIdx].items, newMeal],
            };
          } else {
            updatedMeals.push({ slot: 'snacks', items: [newMeal] });
          }
          const newDailyTotal = existing.dailyTotal + newMeal.calories * newMeal.portion;
          updatedNutrition = currentNutrition.map((n, idx) =>
            idx === todayLogIndex ? { ...n, mealsEaten: updatedMeals, dailyTotal: newDailyTotal } : n
          );
        } else {
          const newLog: NutritionLog = {
            id: `nut_${Date.now()}`,
            date: today,
            mealsEaten: [{ slot: 'snacks', items: [newMeal] }],
            dailyTotal: newMeal.calories * newMeal.portion,
          };
          updatedNutrition = [newLog, ...currentNutrition];
        }
        await updateData({ nutritionLogs: updatedNutrition });
        setActionAddedMessage('Meal added to Nutrition Log!');
      }

      setActionAdded(true);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('[FileReaderModal] Failed to execute action:', err);
      setAiError('Failed to save to target interface.');
      triggerHaptic('error');
    }
  };

  // Helper: target module display metadata
  const getModuleMeta = (mod: ExtractedModule) => {
    switch (mod) {
      case 'FINANCE':
        return { name: 'Finance & Spending', color: '#FF9F0A', icon: <Wallet size={16} weight="duotone" />, route: '/spending' };
      case 'GYM':
        return { name: 'Gym & Fitness', color: '#FF453A', icon: <Barbell size={16} weight="duotone" />, route: '/gym' };
      case 'NUTRITION':
        return { name: 'Nutrition Log', color: '#30D158', icon: <ForkKnife size={16} weight="duotone" />, route: '/nutrition' };
      case 'TASKS':
        return { name: 'To-Do Tasks', color: '#0A84FF', icon: <CheckSquare size={16} weight="duotone" />, route: '/tasks' };
      case 'NOTES':
        return { name: 'Notes & Ideas', color: '#BF5AF2', icon: <NotePencil size={16} weight="duotone" />, route: '/notes' };
    }
  };

  const handleNativeShare = async () => {
    if (!file) return;
    triggerHaptic('light');

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: file.name,
          text: `Sharing ${file.name} from LifeOS Cloud Drive.`,
        };
        if (blobUrl) {
          try {
            const blob = await getDriveBlob(file.id);
            if (blob) {
              const shareFile = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });
              if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
                shareData.files = [shareFile];
              }
            }
          } catch {}
        }
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    } else {
      const targetUrl = blobUrl || file.downloadUrl;
      if (targetUrl) window.open(targetUrl, '_blank');
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('lifeos-subinterface-open'));
      return () => {
        window.dispatchEvent(new CustomEvent('lifeos-subinterface-close'));
      };
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex flex-col bg-[#0B0C0E] text-white select-none overflow-hidden touch-manipulation">
        {/* ── Native Top App Bar ── */}
        <header
          className="w-full flex items-center justify-between px-3.5 border-b border-white/10 shrink-0 bg-[#121316]"
          style={{
            paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 24px) + 8px)',
            paddingBottom: '10px',
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 flex items-center justify-center text-white/90 transition-all cursor-pointer touch-manipulation border border-white/10 shrink-0"
            aria-label="Back"
          >
            <CaretLeft size={20} weight="bold" />
          </button>

          {/* File Name & Format */}
          <div className="flex-1 min-w-0 px-2.5 text-center">
            <h2 className="text-[13.5px] font-bold text-white truncate max-w-[200px] mx-auto">
              {file.name}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-white/50 mt-0.5 flex-wrap">
              {parentFolder && (
                <>
                  <span
                    className="font-semibold px-1.5 py-0.5 rounded text-[10px]"
                    style={{ color: parentFolder.color, backgroundColor: `${parentFolder.color}22` }}
                  >
                    {parentFolder.name}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{formatStorageSize(file.fileSize)}</span>
              <span>•</span>
              <span className="uppercase font-medium tracking-wider text-[10px]">{fileExt || 'file'}</span>
            </div>
          </div>

          {/* Header Action Suite: Top AI Trigger + System Share + Delete */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Header AI Analysis Button */}
            <button
              type="button"
              onClick={handleRunAiExtraction}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-[11px] active:scale-95 transition-all cursor-pointer touch-manipulation shadow-md"
              title="AI Intelligence Extraction"
            >
              <Sparkle size={13} weight="fill" />
              <span>AI</span>
            </button>

            <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-full p-1 gap-0.5">
              {/* Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
                title="Share"
                aria-label="Share"
              >
                <ShareNetwork size={15} weight="bold" />
              </button>

              {/* Delete */}
              {onDeleteFile && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onDeleteFile(file);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash size={15} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Viewport Area ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <div className="flex-1 min-h-0 flex items-center justify-center p-2.5 overflow-hidden bg-black/50">
            {isLoadingContent ? (
              <div className="flex flex-col items-center gap-2 text-white/60">
                <SpinnerGap size={28} className="animate-spin text-[#0A84FF]" />
                <span className="text-[13px]">Opening file...</span>
              </div>
            ) : isImage && (blobUrl || file.localCachedUri) ? (
              <div className="relative w-full h-full flex items-center justify-center touch-manipulation p-2">
                <img
                  src={blobUrl || file.localCachedUri || ''}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>
            ) : isPdf && (blobUrl || file.downloadUrl) ? (
              /* Dedicated In-App PDF Document Viewport */
              <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl bg-[#1C1C1E] border border-white/10">
                <object
                  data={`${blobUrl || file.downloadUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  type="application/pdf"
                  className="w-full h-full rounded-2xl bg-[#1C1C1E]"
                >
                  <iframe
                    src={`${blobUrl || file.downloadUrl}#toolbar=0&navpanes=0`}
                    title={file.name}
                    className="w-full h-full rounded-2xl border-none"
                  >
                    <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 mb-3 border border-red-500/30">
                        <FilePdf size={32} weight="duotone" />
                      </div>
                      <h3 className="text-[15px] font-bold text-white truncate max-w-full">{file.name}</h3>
                      <p className="text-[12px] text-white/60 mt-1 mb-4">
                        PDF ({formatStorageSize(file.fileSize)})
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const targetUrl = blobUrl || file.downloadUrl;
                          if (targetUrl) window.open(targetUrl, '_blank');
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A84FF] text-white text-[13px] font-semibold active:scale-95 transition-all shadow-md cursor-pointer touch-manipulation"
                      >
                        <FilePdf size={16} weight="bold" />
                        <span>Open Document Reader</span>
                      </button>
                    </div>
                  </iframe>
                </object>
              </div>
            ) : isText && textContent !== null ? (
              <div className="w-full h-full p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 overflow-y-auto select-text font-mono text-[12.5px] leading-relaxed text-white/90">
                <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
              </div>
            ) : isAudio && blobUrl ? (
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#1C1C1E] border border-white/10 text-center max-w-xs w-full mx-auto shadow-2xl">
                <h3 className="text-[15px] font-bold text-white mb-2 truncate max-w-full">{file.name}</h3>
                <p className="text-[11.5px] text-white/50 mb-4">{formatStorageSize(file.fileSize)}</p>
                <audio controls src={blobUrl} className="w-full" />
              </div>
            ) : isVideo && blobUrl ? (
              <div className="max-w-full max-h-[72vh] flex items-center justify-center">
                <video controls src={blobUrl} className="max-w-full max-h-[72vh] rounded-2xl" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#1C1C1E] border border-white/10 text-center max-w-xs mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] mb-3 border border-[#0A84FF]/30">
                  <FileText size={32} weight="duotone" />
                </div>
                <h3 className="text-[15px] font-bold text-white truncate max-w-full">{file.name}</h3>
                <p className="text-[12px] text-white/60 mt-1 mb-4">
                  Document ({formatStorageSize(file.fileSize)})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const targetUrl = blobUrl || file.downloadUrl;
                    if (targetUrl) window.open(targetUrl, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A84FF] text-white text-[13px] font-semibold active:scale-95 transition-all shadow-md cursor-pointer touch-manipulation"
                >
                  <FileText size={16} weight="bold" />
                  <span>Open Document</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Dedicated Bottom Control Bar (Docked cleanly below viewport, zero clashing with PDF) ── */}
          <div
            className="w-full shrink-0 bg-[#121316] border-t border-white/10 px-4 py-2.5 flex items-center justify-between z-30 select-none"
            style={{
              paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 12px) + 4px)',
            }}
          >
            <div className="flex items-center gap-2 text-white/50 text-[11px] font-medium">
              <span className="uppercase text-white/70 font-semibold">{fileExt || 'DOC'}</span>
              <span>•</span>
              <span>{formatStorageSize(file.fileSize)}</span>
            </div>

            <button
              type="button"
              onClick={handleRunAiExtraction}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-[12.5px] shadow-md shadow-[#0A84FF]/30 active:scale-95 transition-all cursor-pointer touch-manipulation"
            >
              <Sparkle size={15} weight="fill" />
              <span>AI Document Analysis</span>
            </button>
          </div>

          {/* ── Native AI Intelligence Bottom Sheet ── */}
          <AnimatePresence>
            {isAiPanelOpen && (
              <>
                <div
                  className="fixed inset-0 z-[1000] bg-black/85"
                  onClick={() => setIsAiPanelOpen(false)}
                />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="fixed inset-x-0 bottom-0 z-[1010] rounded-t-[32px] bg-[#16171A] border-t border-white/15 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 pb-3 border-b border-white/10 shrink-0">
                    <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-2.5" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkle size={18} weight="fill" className="text-[#0A84FF]" />
                        <span className="text-[14px] font-bold text-white tracking-tight">
                          LifeOS AI Document Intelligence
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAiPanelOpen(false)}
                        className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        aria-label="Close Inspector"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>
                    <p className="text-[11.5px] text-white/60 leading-snug mt-1">
                      Extracts content from PDF/document/image and matches target LifeOS interface.
                    </p>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {/* Loading State */}
                    {isAiAnalyzing && (
                      <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center text-center gap-3">
                        <SpinnerGap size={30} className="animate-spin text-[#0A84FF]" />
                        <div>
                          <p className="text-[13px] font-semibold text-white">Analyzing Content...</p>
                          <p className="text-[11px] text-white/50 mt-0.5">
                            Matching Finance, Gym, Nutrition, Tasks, or Notes
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {aiError && !isAiAnalyzing && (
                      <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-start gap-2.5 text-red-400 text-[12px]">
                        <WarningCircle size={18} weight="bold" className="shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-300">Extraction Notice</p>
                          <p className="mt-0.5 opacity-90">{aiError}</p>
                          <button
                            type="button"
                            onClick={handleRunAiExtraction}
                            className="mt-2.5 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-semibold text-[11px] cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extracted Result */}
                    {extractedData && !isAiAnalyzing && (
                      <div className="flex flex-col gap-3">
                        {/* Destination Banner */}
                        {(() => {
                          const meta = getModuleMeta(extractedData.module);
                          return (
                            <div
                              className="p-3.5 rounded-2xl border flex items-center justify-between"
                              style={{
                                backgroundColor: `${meta.color}15`,
                                borderColor: `${meta.color}35`,
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                                  style={{ backgroundColor: `${meta.color}25`, color: meta.color }}
                                >
                                  {meta.icon}
                                </div>
                                <div>
                                  <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                                    Target Interface
                                  </div>
                                  <div className="text-[13px] font-bold text-white">{meta.name}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Title & Summary */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                          <h4 className="text-[13.5px] font-bold text-white">{extractedData.title}</h4>
                          <p className="text-[12px] text-white/70 leading-relaxed">
                            {extractedData.summary}
                          </p>
                        </div>

                        {/* Extracted Fields Table */}
                        {extractedData.fields && extractedData.fields.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
                            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                              Extracted Points
                            </div>
                            <div className="space-y-1.5">
                              {extractedData.fields.map((f, i) => (
                                <div
                                  key={i}
                                  className="flex items-start justify-between text-[12px] py-1 border-b border-white/[0.06] last:border-none"
                                >
                                  <span className="text-white/60 font-medium">{f.label}</span>
                                  <span className="text-white font-semibold text-right max-w-[65%] truncate">
                                    {f.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  {extractedData && !isAiAnalyzing && (
                    <div
                      className="shrink-0 p-4 border-t border-white/10 bg-[#16171A]"
                      style={{
                        paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 16px) + 8px)',
                      }}
                    >
                      {actionAdded ? (
                        <div className="p-3 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-[#30D158] text-[13px] font-bold">
                            <Check size={18} weight="bold" />
                            <span>{actionAddedMessage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const meta = getModuleMeta(extractedData.module);
                              triggerHaptic('light');
                              onClose();
                              navigate(meta.route);
                            }}
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#30D158] hover:bg-[#30D158]/90 text-black font-bold text-[12.5px] active:scale-95 transition-all cursor-pointer shadow-md"
                          >
                            <span>Open in {getModuleMeta(extractedData.module).name}</span>
                            <ArrowSquareOut size={15} weight="bold" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyAiAction}
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-95 text-white font-bold text-[14px] transition-all cursor-pointer shadow-lg shadow-[#0A84FF]/25"
                        >
                          <Sparkle size={17} weight="fill" />
                          <span>Add to {getModuleMeta(extractedData.module).name}</span>
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default FileReaderModal;

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, DriveFile, Expense, Task, NoteItem, WorkoutLog, MealItemLog } from '../../types';
import { getDriveBlob } from '../../utils/idbStorage';
import { formatStorageSize } from '../../services/driveStorageService';
import { streamChatCompletion } from '../../services/aiClient';
import { triggerHaptic } from '../../utils/haptics';
import {
  CaretLeft,
  DownloadSimple,
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
  }, [isOpen, file?.id]);

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

  // Run AI Intelligence on the opened file
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
      }

      const promptText = `You are the LifeOS Document & Image Intelligence Assistant.
Analyze this file (${file.name}, type: ${file.mimeType}).
Your job is to:
1. Extract ALL factual information, text, numbers, items, dates, and details from this image/document.
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
            content: isImage ? promptText : `${promptText}\n\nDocument Text Content:\n${textToAnalyze.slice(0, 4000)}`,
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
      const jsonMatch = fullAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || fullAiResponse.match(/(\{[\s\S]*\})/);
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
      setAiError(err?.message || 'Failed to extract file details. Check your connection.');
      triggerHaptic('error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 1-Tap Save to detected LifeOS module
  const handleApplyAiAction = async () => {
    if (!extractedData || !file) return;
    triggerHaptic('medium');

    const p = extractedData.action.payload || {};
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      switch (extractedData.action.type) {
        case 'ADD_EXPENSE': {
          const newExp: Expense = {
            id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amount: Number(p.amount) || 0,
            category: p.category || 'Other',
            note: p.note || extractedData.title || file.name,
            date: p.date || todayStr,
          };
          const updated = [newExp, ...(data.expenses || [])];
          await updateData({ expenses: updated });
          setActionAddedMessage(`Saved Rs ${newExp.amount} to Finance (${newExp.category}).`);
          break;
        }

        case 'LOG_WORKOUT': {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[new Date().getDay()];
          const newWk: WorkoutLog = {
            id: `wlog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            date: p.date || todayStr,
            day: p.day || dayName,
            type: p.workoutName || extractedData.title || 'Extracted Workout',
            exercises: (p.exercises || []).map((ex: any) => ({
              name: ex.name || 'Exercise',
              howTo: ex.howTo || '',
              rest: ex.rest || '60s',
              sets: Array.from({ length: Number(ex.sets) || 3 }).map(() => ({
                reps: Number(ex.reps) || 10,
                weight: Number(ex.weight) || 0,
                completed: true,
              })),
            })),
          };
          const updated = [newWk, ...(data.workoutLogs || [])];
          await updateData({ workoutLogs: updated });
          setActionAddedMessage(`Logged workout "${newWk.type}" to Gym.`);
          break;
        }

        case 'LOG_MEAL': {
          const newMeal: MealItemLog = {
            id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: p.mealName || extractedData.title || 'Logged Meal',
            calories: Number(p.calories) || 0,
            portion: Number(p.portion) || 1,
            isExtra: true,
          };
          const currentLogs = Array.isArray(data.nutritionLogs) ? [...data.nutritionLogs] : [];
          let todayLog = currentLogs.find((l) => l.date === todayStr);
          if (!todayLog) {
            todayLog = {
              id: `nutri_${todayStr}`,
              date: todayStr,
              isSaved: true,
              mealsEaten: [{ slot: 'snacks', items: [newMeal] }],
              dailyTotal: newMeal.calories,
            };
            currentLogs.push(todayLog);
          } else {
            todayLog.mealsEaten = todayLog.mealsEaten || [];
            let snackSlot = todayLog.mealsEaten.find((s) => s.slot === 'snacks');
            if (!snackSlot) {
              snackSlot = { slot: 'snacks', items: [newMeal] };
              todayLog.mealsEaten.push(snackSlot);
            } else {
              snackSlot.items.push(newMeal);
            }
            todayLog.dailyTotal = (todayLog.dailyTotal || 0) + newMeal.calories;
          }
          await updateData({ nutritionLogs: currentLogs });
          setActionAddedMessage(`Logged meal (${newMeal.calories} kcal) to Nutrition.`);
          break;
        }

        case 'ADD_TASK': {
          const newTask: Task = {
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text: p.title || extractedData.title || 'Extracted Task',
            subtask: p.subtask || '',
            completed: false,
            date: p.dueDate || todayStr,
            dueDate: p.dueDate || todayStr,
          };
          const updated = [newTask, ...(data.tasks || [])];
          await updateData({ tasks: updated });
          setActionAddedMessage(`Added task "${newTask.text}" to To-Do Tasks.`);
          break;
        }

        case 'ADD_NOTE': {
          const nowIso = new Date().toISOString();
          const newNote: NoteItem = {
            id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: p.title || extractedData.title || file.name,
            content: p.content || extractedData.summary || '',
            pageView: 'lined',
            monthKey: nowIso.slice(0, 7),
            isArchived: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          const updated = [newNote, ...(data.notes || [])];
          await updateData({ notes: updated });
          setActionAddedMessage(`Saved note "${newNote.title}" to Notes.`);
          break;
        }
      }

      setActionAdded(true);
      triggerHaptic('success');
    } catch (err) {
      console.error('[FileReaderModal] Failed to execute action:', err);
      setAiError('Failed to save to module.');
      triggerHaptic('error');
    }
  };

  // Download / Save to Android Storage trigger
  const handleDownload = () => {
    if (!file) return;
    triggerHaptic('light');
    const targetUrl = blobUrl || file.downloadUrl;
    if (!targetUrl) return;

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Android Native Share Sheet trigger
  const handleNativeShare = async () => {
    if (!file) return;
    triggerHaptic('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `File: ${file.name} (${formatStorageSize(file.fileSize)})`,
          url: file.downloadUrl || blobUrl || window.location.href,
        });
      } catch {}
    } else {
      handleDownload();
    }
  };

  // Module meta info
  const getModuleMeta = (mod: ExtractedModule) => {
    switch (mod) {
      case 'FINANCE':
        return {
          name: 'Finance',
          color: '#30D158',
          icon: <Wallet size={16} weight="duotone" className="text-[#30D158]" />,
          route: '/spending',
        };
      case 'GYM':
        return {
          name: 'Gym',
          color: '#FF453A',
          icon: <Barbell size={16} weight="duotone" className="text-[#FF453A]" />,
          route: '/gym',
        };
      case 'NUTRITION':
        return {
          name: 'Nutrition',
          color: '#FF9F0A',
          icon: <ForkKnife size={16} weight="duotone" className="text-[#FF9F0A]" />,
          route: '/nutrition',
        };
      case 'TASKS':
        return {
          name: 'Tasks',
          color: '#0A84FF',
          icon: <CheckSquare size={16} weight="duotone" className="text-[#0A84FF]" />,
          route: '/tasks',
        };
      case 'NOTES':
        return {
          name: 'Notes',
          color: '#BF5AF2',
          icon: <NotePencil size={16} weight="duotone" className="text-[#BF5AF2]" />,
          route: '/notes',
        };
    }
  };

  // Sub-interface event dispatch to hide navigation dock and lock gestures
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
        {/* ── Native Android Top App Bar ── */}
        <header
          className="w-full flex items-center justify-between px-3 border-b border-white/10 shrink-0 bg-[#121316]"
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

          {/* File Name & Type */}
          <div className="flex-1 min-w-0 px-3 text-center">
            <h2 className="text-[14px] font-bold text-white truncate max-w-[210px] mx-auto">
              {file.name}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50 mt-0.5">
              <span>{formatStorageSize(file.fileSize)}</span>
              <span>•</span>
              <span className="uppercase font-medium tracking-wider text-[10px]">{fileExt || 'file'}</span>
            </div>
          </div>

          {/* Action Icons Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-full p-1 gap-0.5">
              {/* Android System Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
                title="Share"
                aria-label="Share"
              >
                <ShareNetwork size={16} weight="bold" />
              </button>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
                title="Save to Device"
                aria-label="Save to Device"
              >
                <DownloadSimple size={16} weight="bold" />
              </button>

              {/* Delete */}
              {onDeleteFile && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onDeleteFile(file);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash size={16} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Mobile Viewport ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <div className="flex-1 min-h-0 flex items-center justify-center p-3 overflow-auto bg-black/40">
            {isLoadingContent ? (
              <div className="flex flex-col items-center gap-2 text-white/60">
                <SpinnerGap size={28} className="animate-spin text-[#0A84FF]" />
                <span className="text-[13px]">Opening file...</span>
              </div>
            ) : isImage && (blobUrl || file.localCachedUri) ? (
              <div className="relative max-w-full max-h-full flex items-center justify-center touch-manipulation">
                <img
                  src={blobUrl || file.localCachedUri || ''}
                  alt={file.name}
                  className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>
            ) : isText && textContent !== null ? (
              <div className="w-full h-full p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 overflow-y-auto select-text font-mono text-[12.5px] leading-relaxed text-white/90">
                <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
              </div>
            ) : isPdf ? (
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#1C1C1E] border border-white/10 text-center max-w-xs mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 mb-3 border border-red-500/30">
                  <FilePdf size={32} weight="duotone" />
                </div>
                <h3 className="text-[15px] font-bold text-white truncate max-w-full">{file.name}</h3>
                <p className="text-[12px] text-white/60 mt-1 mb-4">
                  PDF ({formatStorageSize(file.fileSize)})
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A84FF] text-white text-[13px] font-semibold active:scale-95 transition-all shadow-md cursor-pointer touch-manipulation"
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>Open / View PDF</span>
                </button>
              </div>
            ) : isAudio && blobUrl ? (
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#1C1C1E] border border-white/10 text-center max-w-xs w-full mx-auto">
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
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A84FF] text-white text-[13px] font-semibold active:scale-95 transition-all shadow-md cursor-pointer touch-manipulation"
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>Open File</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Native Android Mobile AI Bottom Sheet ── */}
          <AnimatePresence>
            {isAiPanelOpen && (
              <>
                {/* Backdrop dismiss */}
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
                  {/* Header (Pinned) */}
                  <div className="p-4 pb-3 border-b border-white/10 shrink-0">
                    <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-2.5" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkle size={18} weight="fill" className="text-[#0A84FF]" />
                        <span className="text-[14px] font-bold text-white tracking-tight">
                          LifeOS AI Inspector
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
                      Extracts document/image data and matches target LifeOS interface.
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
                              <div className="flex items-center gap-2">
                                {meta.icon}
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 block">
                                    Target Destination
                                  </span>
                                  <span className="text-[14px] font-bold text-white">
                                    {meta.name}
                                  </span>
                                </div>
                              </div>

                              <span
                                className="px-2.5 py-1 rounded-full text-[10.5px] font-bold"
                                style={{
                                  backgroundColor: `${meta.color}25`,
                                  color: meta.color,
                                }}
                              >
                                Auto-Matched
                              </span>
                            </div>
                          );
                        })()}

                        {/* Details Card */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2.5">
                          <div>
                            <p className="text-[13.5px] font-bold text-white">
                              {extractedData.title}
                            </p>
                            <p className="text-[12px] text-white/70 mt-1 leading-snug">
                              {extractedData.summary}
                            </p>
                          </div>

                          {/* Fields */}
                          {Array.isArray(extractedData.fields) && extractedData.fields.length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                              {extractedData.fields.map((f, i) => (
                                <div key={i} className="flex items-center justify-between text-[11.5px]">
                                  <span className="text-white/50">{f.label}:</span>
                                  <span className="font-semibold text-white/90 text-right truncate max-w-[190px]">
                                    {f.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pinned Action Footer */}
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

          {/* Floating AI Extraction Pill for reading mode */}
          {!isAiPanelOpen && (
            <div
              className="fixed inset-x-0 bottom-6 z-40 p-4 pointer-events-none flex justify-center"
              style={{
                paddingBottom: 'calc(max(var(--sab, 0px), env(safe-area-inset-bottom, 0px), 16px) + 8px)',
              }}
            >
              <button
                type="button"
                onClick={handleRunAiExtraction}
                className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-[13.5px] shadow-2xl shadow-[#0A84FF]/40 active:scale-95 transition-all cursor-pointer border border-white/20 touch-manipulation"
              >
                <Sparkle size={17} weight="fill" />
                <span>Extract & Route with AI</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
export default FileReaderModal;

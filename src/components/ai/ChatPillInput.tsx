import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Mic, 
  Square, 
  Send, 
  Loader2, 
  X, 
  Eye, 
  EyeOff, 
  RotateCcw
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const USE_PILL_INPUT = true;

export interface ChatPillInputProps {
  inputQuery: string;
  setInputQuery: (val: string) => void;
  onSend: (text?: string) => void;
  isGenerating: boolean;
  isRecording: boolean;
  transcribing: boolean;
  onToggleRecord: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onStartNewChat?: () => void;
  letAiReadData?: boolean;
  onToggleReadData?: (val: boolean) => void;
  isSlim?: boolean;
  disabled?: boolean;
}

export function ChatPillInput({
  inputQuery,
  setInputQuery,
  onSend,
  isGenerating,
  isRecording,
  transcribing,
  onToggleRecord,
  inputRef,
  onStartNewChat,
  letAiReadData = true,
  onToggleReadData,
  isSlim = false,
  disabled = false,
}: ChatPillInputProps) {
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const hasText = inputQuery.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !isGenerating && !transcribing) {
        onSend();
      }
    }
  };

  return (
    <div className="pt-1.5 shrink-0 relative z-30 select-none">
      {/* ── Optional Floating "+" Quick Actions Glass Menu ── */}
      <AnimatePresence>
        {showPlusMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-2 z-50 min-w-[200px] p-2 rounded-2xl bg-[#091417]/95 border border-teal-500/30 backdrop-blur-xl shadow-2xl space-y-1"
          >
            {onStartNewChat && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowPlusMenu(false);
                  onStartNewChat();
                }}
                className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all text-left"
              >
                <RotateCcw size={14} className="text-teal-400" />
                <span>Start New Chat</span>
              </button>
            )}

            {onToggleReadData && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onToggleReadData(!letAiReadData);
                }}
                className="w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  {letAiReadData ? (
                    <Eye size={14} className="text-emerald-400" />
                  ) : (
                    <EyeOff size={14} className="text-amber-400" />
                  )}
                  <span>Screen Context</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  letAiReadData ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {letAiReadData ? 'ON' : 'OFF'}
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Outer Pill Capsule Container ── */}
      <div className={`relative rounded-full p-[1.5px] bg-gradient-to-r from-teal-500/60 via-cyan-400/50 to-purple-500/60 shadow-[0_0_24px_-4px_rgba(45,212,191,0.3)] transition-all ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative z-10 flex items-center gap-1.5 sm:gap-2 w-full pl-2 pr-1.5 sm:pl-3 sm:pr-2 rounded-full bg-[#050B0D] overflow-hidden cursor-text transition-all ${
            isSlim ? 'py-0.5 sm:py-1' : 'py-1 sm:py-1.5'
          }`}
        >
          {/* Grain texture overlay strongest at bottom-left */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-15 rounded-full"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 0)',
              backgroundSize: '4px 4px',
              maskImage: 'radial-gradient(circle at 10% 90%, black 0%, transparent 60%)',
              WebkitMaskImage: 'radial-gradient(circle at 10% 90%, black 0%, transparent 60%)'
            }}
          />

          {/* Organic right-side fluid glow layer (teal into purple) */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-3/5 rounded-full blur-xl opacity-40"
            style={{
              background: 'radial-gradient(ellipse at 80% 50%, rgba(168, 85, 247, 0.45) 0%, rgba(20, 184, 166, 0.25) 50%, transparent 80%)',
            }}
          />

          {/* 1. Left "+" Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setShowPlusMenu(prev => !prev);
            }}
            className={`relative z-20 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all shrink-0 ${
              isSlim ? 'w-7 h-7' : 'w-8 h-8'
            }`}
            title="Options & Quick Actions"
          >
            <Plus size={isSlim ? 16 : 18} strokeWidth={2} />
          </button>

          {/* 2. Text Input Area */}
          <div className="flex-1 flex items-center min-w-0 relative z-20">
            <input
              id="ask-lifeos-input"
              name="ask-lifeos-query"
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              tabIndex={0}
              placeholder={
                transcribing
                  ? 'Transcribing voice...'
                  : isRecording
                  ? 'Listening... tap mic to finish'
                  : 'Ask LifeOS'
              }
              className={`w-full bg-transparent px-1 font-medium text-white placeholder-white/40 focus:outline-none focus:ring-0 allow-select select-text cursor-text ${
                isSlim ? 'py-0 text-xs' : 'py-1 text-xs sm:text-sm'
              }`}
              style={{ pointerEvents: 'auto', touchAction: 'auto', userSelect: 'text' }}
            />

            {/* Clear text X button when input has text */}
            {hasText && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInputQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0 mr-1"
                title="Clear text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 3. Right Action Cluster: Squircle Mic + Circle Send + Waveform */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative z-20">
            {/* Waveform graphic (visible ONLY when expanded, empty input & not recording) */}
            {!isSlim && !hasText && !isRecording && !transcribing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRecord();
                }}
                className="flex items-center gap-0.5 px-1 py-1 text-white/70 hover:text-teal-300 transition-colors cursor-pointer"
                title="Voice Input Waveform"
              >
                <div className="w-[2px] h-3 bg-teal-300/80 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-[2px] h-5 bg-teal-300/90 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-[2px] h-2.5 bg-teal-300/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </button>
            )}

            {/* Mic Button: Mint circle (rounded-full) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleRecord();
              }}
              disabled={isGenerating || transcribing}
              title={isRecording ? 'Stop Recording' : 'Voice Input'}
              className={`rounded-full flex items-center justify-center transition-all ${
                isSlim ? 'w-7 h-7' : 'w-9 h-9 sm:w-10 sm:h-10'
              } ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                  : transcribing
                  ? 'bg-emerald-400/30 text-emerald-300 animate-spin'
                  : 'bg-[#2DD4BF] text-slate-950 font-bold shadow-md shadow-teal-500/25 hover:bg-[#26bba8] active:scale-95'
              }`}
            >
              {isRecording ? <Square size={13} /> : transcribing ? <Loader2 size={14} /> : <Mic size={isSlim ? 15 : 17} strokeWidth={2.4} />}
            </button>

            {/* Send Button: perfect circle (rounded-full) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasText) onSend();
              }}
              disabled={isGenerating || !hasText || transcribing}
              title="Send Prompt"
              className={`rounded-full flex items-center justify-center transition-all ${
                isSlim ? 'w-7 h-7' : 'w-9 h-9 sm:w-10 sm:h-10'
              } ${
                hasText && !isGenerating && !transcribing
                  ? 'bg-[#0D9488] text-white font-bold shadow-md shadow-teal-500/30 hover:bg-[#14b8a6] hover:scale-105 active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={isSlim ? 14 : 16} className="translate-x-[0.5px]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPillInput;

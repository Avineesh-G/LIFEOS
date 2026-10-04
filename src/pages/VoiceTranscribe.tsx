import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { transcribeAudio } from '../services/aiClient';
import type { AppData, Task } from '../types';
import {
  LargeTitleHeader,
  Button,
  GroupedList,
  ListRow,
  GlassSurface,
  Badge,
  Microphone,
  Sparkle,
  CheckCircle,
  Copy,
  Check,
  Waveform,
} from '../ui';

interface VoiceTranscribeProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

export default function VoiceTranscribe({ data, updateData }: VoiceTranscribeProps) {
  const navigate = useNavigate();

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    triggerHaptic('medium');
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
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          if (text) {
            setTranscript(text);
            const bullets = text
              .split(/[.!?]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 5);
            setSummaryBullets(bullets.slice(0, 3));
            triggerHaptic('success');
          }
        } catch (err) {
          console.warn('Transcription error:', err);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Could not start recording:', err);
    }
  };

  const stopRecording = () => {
    triggerHaptic('medium');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCopy = () => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mins = Math.floor(recordSeconds / 60);
  const secs = recordSeconds % 60;

  return (
    <div className="w-full text-white selection:bg-[#FF6B35]/30">
      <LargeTitleHeader
        title="Voice Notes"
        subtitle={
          isRecording
            ? `Recording (${mins}:${secs < 10 ? `0${secs}` : secs})`
            : 'Tap mic to record speech'
        }
        tint="#FF6B35"
        onBack={() => navigate('/study')}
      />

      <div className="flex flex-col gap-4 pb-2 items-center">
        {/* Large 96px Record Glass Circle */}
        <div className="py-6 flex flex-col items-center gap-4">
          <GlassSurface
            as="button"
            interactive
            tint="#FF6B35"
            tintOpacity={isRecording ? 0.5 : 0.25}
            onClick={isRecording ? stopRecording : startRecording}
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl shadow-2xl border border-white/20"
          >
            {isRecording ? (
              <div className="w-8 h-8 rounded-lg bg-white" />
            ) : (
              <Microphone weight="fill" />
            )}
          </GlassSurface>

          {/* Waveform Animation */}
          {isRecording && (
            <div className="flex items-center gap-1 h-6">
              {[0.4, 0.8, 0.5, 1, 0.7, 0.9, 0.4, 0.6].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.3, scale, 0.3] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6 + i * 0.1,
                    ease: 'easeInOut',
                  }}
                  className="w-1 h-6 rounded-full bg-[#FF6B35]"
                />
              ))}
            </div>
          )}

          {transcribing && (
            <span className="text-xs font-semibold text-[rgba(235,235,245,0.60)] animate-pulse">
              Transcribing audio with Luna...
            </span>
          )}
        </div>

        {/* Real-Time Transcript Display */}
        {transcript && (
          <div className="w-full bg-[#1C1C1E] rounded-[28px] p-5 border border-white/[0.06] shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[rgba(235,235,245,0.50)] uppercase tracking-wider">
                TRANSCRIPT
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-full bg-white/10 text-xs font-medium text-white flex items-center gap-1 hover:bg-white/20"
              >
                {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[16px] text-white leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* AI Key Summary Bullets */}
        {summaryBullets.length > 0 && (
          <div className="w-full">
            <GroupedList header="Key Points (AI Generated)">
              {summaryBullets.map((bullet, i) => (
                <ListRow
                  key={i}
                  icon={<Sparkle weight="fill" />}
                  iconTint="#BF5AF2"
                  title={bullet}
                />
              ))}
            </GroupedList>
          </div>
        )}
      </div>
    </div>
  );
}

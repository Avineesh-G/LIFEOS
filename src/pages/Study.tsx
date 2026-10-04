import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  ProgressBar,
  Heatmap,
  MOTION_SPRINGS,
  Timer,
  Headphones,
  Cards,
  Microphone,
  ClockCounterClockwise,
  Play,
  CalendarDots,
  GraduationCap,
} from '../ui';

interface StudyProps {
  data: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function Study({ data }: StudyProps) {
  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Stats calculation
  const { todayMinutes, todayHours, todayMinsRemainder, percent, sortedSubjects, heatmapDays } =
    useMemo(() => {
      const sessions = (data.studySessions || []).filter((s) => s.date === todayStr);
      const totalMins = sessions.reduce((sum, s) => sum + s.duration, 0);
      const target = 180; // 3 hours default goal

      // Subjects aggregation
      const subjectMap: Record<string, number> = {};
      (data.studySessions || []).forEach((s) => {
        subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.duration;
      });
      const sorted = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);

      // Heatmap 70 days
      const days = Array.from({ length: 70 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (69 - i));
        const dateStr = format(d, 'yyyy-MM-dd');
        const daySessions = (data.studySessions || []).filter((s) => s.date === dateStr);
        const dayMins = daySessions.reduce((sum, s) => sum + s.duration, 0);
        const level =
          dayMins === 0 ? 0 : dayMins < 60 ? 1 : dayMins < 120 ? 2 : dayMins < 180 ? 3 : 4;
        return { date: dateStr, level };
      });

      return {
        todayMinutes: totalMins,
        todayHours: Math.floor(totalMins / 60),
        todayMinsRemainder: totalMins % 60,
        percent: Math.min(1, totalMins / target),
        sortedSubjects: sorted,
        heatmapDays: days,
      };
    }, [data.studySessions, todayStr]);

  return (
    <div className="w-full text-white selection:bg-[#64D2FF]/30">
      <LargeTitleHeader
        title="Study"
        subtitle={`${todayHours}h ${todayMinsRemainder}m focused today`}
        tint="#64D2FF"
        onBack={() => navigate('/')}
        actions={
          <Button
            variant="glass"
            tint="#64D2FF"
            size="sm"
            onClick={() => navigate('/flow')}
            icon={<Headphones size={16} weight="bold" />}
          >
            Flow Room
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* ── 1. Hero Summary Card (r-hero 32, surface-1) ── */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={MOTION_SPRINGS.default}
          className="w-full bg-[#1C1C1E] rounded-[32px] p-5 border border-white/[0.06] flex flex-col gap-4 shadow-xl select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-xs font-semibold text-[rgba(235,235,245,0.60)] tracking-tight">
                TODAY'S FOCUS TIME
              </div>
              <div className="text-4xl font-extrabold text-[#64D2FF] tabular-nums tracking-tight mt-1">
                {todayHours}:{todayMinsRemainder < 10 ? `0${todayMinsRemainder}` : todayMinsRemainder}{' '}
                <span className="text-sm font-normal text-[rgba(235,235,245,0.50)]">hrs</span>
              </div>
            </div>

            <Button
              variant="prominent"
              tint="#64D2FF"
              size="md"
              onClick={() => navigate('/study/timer')}
              icon={<Play size={16} weight="fill" />}
            >
              Start Focus
            </Button>
          </div>

          {/* Goal Progress Bar */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[rgba(235,235,245,0.60)]">Daily 3-Hour Target</span>
              <span className="text-white">{Math.round(percent * 100)}%</span>
            </div>
            <ProgressBar progress={percent} height={6} color="#64D2FF" />
          </div>
        </motion.div>

        {/* ── 2. 365-Day Study Intensity Heatmap ── */}
        <div className="w-full bg-[#1C1C1E] rounded-[26px] p-4 border border-white/[0.06] flex flex-col gap-3 select-none">
          <div className="flex justify-between items-center text-xs font-bold text-[rgba(235,235,245,0.60)]">
            <span>STUDY CONSISTENCY GRAPH</span>
            <span className="text-[10px] text-[#64D2FF]">Recent Activity</span>
          </div>
          <Heatmap days={heatmapDays} color="#64D2FF" />
        </div>

        {/* ── 3. Study Tools Grouped List ── */}
        <GroupedList header="Deep Work Tools">
          <ListRow
            icon={<Headphones weight="bold" />}
            iconTint="#64D2FF"
            title="Flow Room"
            subtitle="Ambient soundscapes & 96pt focus numeral"
            showChevron
            onClick={() => navigate('/flow')}
          />
          <ListRow
            icon={<Timer weight="bold" />}
            iconTint="#64D2FF"
            title="Pomodoro Timer"
            subtitle="Focus intervals with stopwatch"
            showChevron
            onClick={() => navigate('/study/timer')}
          />
          <ListRow
            icon={<Cards weight="bold" />}
            iconTint="#BF5AF2"
            title="Active Recall Decks"
            subtitle="Spaced repetition flashcards with 3D flip"
            showChevron
            onClick={() => navigate('/recall')}
          />
          <ListRow
            icon={<Microphone weight="bold" />}
            iconTint="#FF6B35"
            title="Voice Transcriber"
            subtitle="Audio summaries & lecture notes"
            showChevron
            onClick={() => navigate('/transcribe')}
          />
          <ListRow
            icon={<ClockCounterClockwise weight="bold" />}
            iconTint="#AC8E68"
            title="Session History"
            subtitle="Logged sessions, notes and doubts"
            showChevron
            onClick={() => navigate('/study/history')}
          />
        </GroupedList>

        {/* ── 4. Subject Breakdown ── */}
        {sortedSubjects.length > 0 && (
          <div className="w-full bg-[#1C1C1E] rounded-[26px] p-4 border border-white/[0.06] flex flex-col gap-3 select-none">
            <div className="text-xs font-bold text-[rgba(235,235,245,0.60)]">
              HOURS PER SUBJECT
            </div>
            <div className="flex flex-col gap-2.5">
              {sortedSubjects.slice(0, 4).map(([subj, mins]) => (
                <div key={subj}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-white font-semibold">{subj}</span>
                    <span className="text-[rgba(235,235,245,0.60)]">
                      {(mins / 60).toFixed(1)} hrs
                    </span>
                  </div>
                  <ProgressBar
                    progress={Math.min(1, mins / (sortedSubjects[0][1] || 1))}
                    height={4}
                    color="#64D2FF"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

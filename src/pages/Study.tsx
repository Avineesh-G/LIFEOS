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

      // Heatmap 18 weeks (126 days)
      const days = Array.from({ length: 126 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (125 - i));
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
        actions={
          <Button
            variant="glass"
            tint="#64D2FF"
            size="sm"
            onClick={() => {
              triggerHaptic('nav');
              navigate('/flow');
            }}
            icon={<Headphones size={15} weight="bold" />}
          >
            Flow Room
          </Button>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── 1. Hero Summary Card (glass-hero with Cyan glow) ── */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          transition={MOTION_SPRINGS.default}
          style={{ '--hero-accent': '#64D2FF' } as React.CSSProperties}
          className="glass-hero p-5 flex flex-col gap-4 select-none min-h-[140px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-[11.5px] font-semibold text-[rgba(235,235,245,0.65)] uppercase tracking-wider">
                Today's Focus Time
              </div>
              <div className="text-[34px] font-bold text-[#64D2FF] tabular-nums tracking-tight mt-1 leading-none">
                {todayHours}:{todayMinsRemainder < 10 ? `0${todayMinsRemainder}` : todayMinsRemainder}{' '}
                <span className="text-sm font-normal text-[rgba(235,235,245,0.45)]">hrs</span>
              </div>
            </div>

            <Button
              variant="prominent"
              tint="#64D2FF"
              size="md"
              onClick={() => {
                triggerHaptic('nav');
                navigate('/study/timer');
              }}
              icon={<Play size={15} weight="fill" />}
            >
              Start Focus
            </Button>
          </div>

          {/* Goal Progress Bar */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[rgba(235,235,245,0.60)]">Daily 3-Hour Target</span>
              <span className="text-white">{Math.round(percent * 100)}%</span>
            </div>
            <ProgressBar progress={percent} height={5} color="#64D2FF" />
          </div>
        </motion.div>

        {/* ── 2. 18-Week Study Consistency Heatmap (glass-card) ── */}
        <div className="glass-card p-4 flex flex-col gap-3 select-none">
          <div className="flex justify-between items-center text-xs font-semibold text-[rgba(235,235,245,0.70)]">
            <span className="text-section-header">Study Consistency</span>
            <span className="text-[11px] text-[#64D2FF] font-bold">Recent Activity</span>
          </div>
          <Heatmap days={heatmapDays} color="#64D2FF" />
        </div>

        {/* ── 3. Study Tools Grouped List ── */}
        <GroupedList header="Deep Work Tools">
          <ListRow
            icon={<Headphones weight="bold" />}
            iconTint="#64D2FF"
            title="Flow Room"
            subtitle="Ambient soundscapes & focus timer"
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

        {/* ── 4. Subject Breakdown (glass-card) ── */}
        {sortedSubjects.length > 0 && (
          <div className="glass-card p-4 flex flex-col gap-3 select-none">
            <div className="text-section-header">
              HOURS PER SUBJECT
            </div>
            <div className="flex flex-col gap-3 pt-1">
              {sortedSubjects.slice(0, 4).map(([subj, mins]) => (
                <div key={subj}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-white font-semibold">{subj}</span>
                    <span className="text-[rgba(235,235,245,0.60)] tabular-nums">
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


import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { ProjectItem, StudySession } from '../types.ts';

export interface ProjectMetrics {
  totalMilestones: number;
  doneMilestones: number;
  progressRatio: number; // 0..1
  nextMilestoneTitle: string | null;
  nextMilestoneId: string | null;
  focusMinutes: number;
  daysLeft: number | null;
}

export function getProjectMetrics(
  project: ProjectItem,
  studySessions: StudySession[] = []
): ProjectMetrics {
  const milestones = project.milestones || [];
  const totalMilestones = milestones.length;
  const doneMilestones = milestones.filter((m) => m.completed).length;
  const progressRatio = totalMilestones > 0 ? doneMilestones / totalMilestones : project.status === 'completed' ? 1 : 0;

  const nextMs = milestones.find((m) => !m.completed);
  const focusMinutes = studySessions
    .filter((s) => s.linkedProjectId === project.id)
    .reduce((acc, s) => acc + (Number(s.duration) || 0), 0);

  let daysLeft: number | null = null;
  if (project.targetDate) {
    try {
      const today = new Date();
      const baseToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      daysLeft = differenceInCalendarDays(parseISO(project.targetDate), baseToday);
    } catch {
      daysLeft = null;
    }
  }

  return {
    totalMilestones,
    doneMilestones,
    progressRatio,
    nextMilestoneTitle: nextMs?.title || null,
    nextMilestoneId: nextMs?.id || null,
    focusMinutes,
    daysLeft,
  };
}

export function formatFocusHoursMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}


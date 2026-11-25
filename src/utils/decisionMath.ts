import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { DecisionRecord } from '../types.ts';

export interface RankedDecisionOption {
  optionId: string;
  title: string;
  percentage: number;
  weightedPoints: number;
  maxPoints: number;
}

export function computeOptionScores(decision: DecisionRecord): RankedDecisionOption[] {
  const criteria = decision.criteria || [];
  const options = decision.options || [];
  const maxPoints = criteria.reduce((sum, c) => sum + (c.weight || 1) * 5, 0);

  return options
    .map((opt) => {
      const weightedPoints = criteria.reduce((sum, c) => {
        const rating = opt.scores?.[c.id] ?? 3;
        return sum + (c.weight || 1) * rating;
      }, 0);
      const percentage = maxPoints > 0 ? Math.round((weightedPoints / maxPoints) * 100) : 0;
      return {
        optionId: opt.id,
        title: opt.title,
        percentage,
        weightedPoints,
        maxPoints,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export function isDecisionReviewDue(decision: DecisionRecord, todayStr: string): boolean {
  return decision.status === 'decided' && Boolean(decision.revisitDate) && (decision.revisitDate || '') <= todayStr;
}

export function getRevisitDaysDelta(revisitDate?: string): number | null {
  if (!revisitDate) return null;
  try {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return differenceInCalendarDays(parseISO(revisitDate), base);
  } catch {
    return null;
  }
}


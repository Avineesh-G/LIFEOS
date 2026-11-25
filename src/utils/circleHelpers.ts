import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { CirclePerson, MoneyLentItem } from '../types.ts';

export interface PersonFinanceSummary {
  moneyLentNetRupees: number;
  pendingLentItems: MoneyLentItem[];
  outingNetRupees: number;
  totalNetRupees: number;
}

export interface OutingBalanceIndexLike {
  byPersonId: Record<string, number>;
  byNormalizedName: Record<string, number>;
}

export function getPersonFinanceSummary(
  person: CirclePerson,
  moneyLent: MoneyLentItem[] = [],
  outingIndex?: OutingBalanceIndexLike | null
): PersonFinanceSummary {
  const targetName = (person.linkedMoneyLentName || person.name).trim().toLowerCase();
  const pendingLentItems = moneyLent.filter(
    (item) => item.status === 'pending' && item.personName.trim().toLowerCase() === targetName
  );

  const moneyLentNetRupees = pendingLentItems.reduce((sum, item) => {
    return sum + (item.type === 'borrowed' ? -Number(item.amount || 0) : Number(item.amount || 0));
  }, 0);

  let outingNetRupees = 0;
  if (outingIndex) {
    if (person.linkedOutingPersonId && outingIndex.byPersonId[person.linkedOutingPersonId] !== undefined) {
      outingNetRupees = outingIndex.byPersonId[person.linkedOutingPersonId];
    } else if (outingIndex.byNormalizedName[targetName] !== undefined) {
      outingNetRupees = outingIndex.byNormalizedName[targetName];
    }
  }

  return {
    moneyLentNetRupees: Math.round(moneyLentNetRupees),
    pendingLentItems,
    outingNetRupees: Math.round(outingNetRupees),
    totalNetRupees: Math.round(moneyLentNetRupees + outingNetRupees),
  };
}

export function getDaysUntilBirthday(birthday?: string): number | null {
  if (!birthday || !birthday.trim()) return null;
  const clean = birthday.trim();
  let month = 0;
  let day = 0;

  const fullMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const shortMatch = clean.match(/^(\d{2})-(\d{2})$/);
  if (fullMatch) {
    month = Number(fullMatch[2]);
    day = Number(fullMatch[3]);
  } else if (shortMatch) {
    month = Number(shortMatch[1]);
    day = Number(shortMatch[2]);
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextBday = new Date(today.getFullYear(), month - 1, day);
  if (nextBday < today) {
    nextBday = new Date(today.getFullYear() + 1, month - 1, day);
  }
  return differenceInCalendarDays(nextBday, today);
}

export interface CatchUpStatus {
  daysSinceLast: number | null;
  isDue: boolean;
  daysOverdue: number;
}

export function getCatchUpStatus(person: CirclePerson): CatchUpStatus {
  const interval = person.catchUpIntervalDays ?? 0;
  if (interval <= 0) {
    if (!person.lastContactedDate) return { daysSinceLast: null, isDue: false, daysOverdue: 0 };
    try {
      const days = Math.max(0, differenceInCalendarDays(new Date(), parseISO(person.lastContactedDate)));
      return { daysSinceLast: days, isDue: false, daysOverdue: 0 };
    } catch {
      return { daysSinceLast: null, isDue: false, daysOverdue: 0 };
    }
  }

  if (!person.lastContactedDate) {
    return { daysSinceLast: null, isDue: true, daysOverdue: interval };
  }

  try {
    const days = Math.max(0, differenceInCalendarDays(new Date(), parseISO(person.lastContactedDate)));
    const diff = days - interval;
    return {
      daysSinceLast: days,
      isDue: diff >= 0,
      daysOverdue: Math.max(0, diff),
    };
  } catch {
    return { daysSinceLast: null, isDue: true, daysOverdue: interval };
  }
}

export function formatRupeeNet(amount: number): string {
  if (amount === 0) return 'Settled';
  const sign = amount > 0 ? '+' : '-';
  return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`;
}


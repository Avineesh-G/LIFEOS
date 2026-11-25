import {
  getOutings,
  getPeople,
  getExpensesByOuting,
  getSettlementsByOuting,
} from '../features/outings/storage/outingsIdb';
import { calculateOutingSummary } from '../features/outings/utils/calculations';
import type { OutingPerson } from '../features/outings/types';

export {
  getPersonFinanceSummary,
  getDaysUntilBirthday,
  getCatchUpStatus,
  formatRupeeNet,
  type PersonFinanceSummary,
  type CatchUpStatus,
} from './circleHelpers';

export interface OutingBalanceIndex {
  byPersonId: Record<string, number>;
  byNormalizedName: Record<string, number>;
  outingPeople: OutingPerson[];
}

export async function loadOutingBalanceIndex(): Promise<OutingBalanceIndex> {
  const byPersonId: Record<string, number> = {};
  const byNormalizedName: Record<string, number> = {};
  try {
    const [outings, people] = await Promise.all([getOutings(), getPeople()]);
    const mePerson = people.find((p) => p.isMe || p.name.trim().toLowerCase() === 'me');
    if (!mePerson || outings.length === 0) {
      return { byPersonId, byNormalizedName, outingPeople: people };
    }

    const nameById = new Map<string, string>();
    people.forEach((p) => nameById.set(p.id, p.name.trim().toLowerCase()));

    for (const outing of outings) {
      const [expenses, settlements] = await Promise.all([
        getExpensesByOuting(outing.id),
        getSettlementsByOuting(outing.id),
      ]);
      const summary = calculateOutingSummary(
        outing.budget,
        outing.budgetBasis || 'myShare',
        outing.participantIds || people.map((p) => p.id),
        expenses,
        settlements,
        mePerson.id
      );
      for (const payment of summary.suggestedPayments) {
        if (payment.toPersonId === mePerson.id) {
          const rupees = payment.amount / 100;
          byPersonId[payment.fromPersonId] = (byPersonId[payment.fromPersonId] || 0) + rupees;
          const norm = nameById.get(payment.fromPersonId);
          if (norm) byNormalizedName[norm] = (byNormalizedName[norm] || 0) + rupees;
        } else if (payment.fromPersonId === mePerson.id) {
          const rupees = payment.amount / 100;
          byPersonId[payment.toPersonId] = (byPersonId[payment.toPersonId] || 0) - rupees;
          const norm = nameById.get(payment.toPersonId);
          if (norm) byNormalizedName[norm] = (byNormalizedName[norm] || 0) - rupees;
        }
      }
    }

    return { byPersonId, byNormalizedName, outingPeople: people };
  } catch {
    return { byPersonId, byNormalizedName, outingPeople: [] };
  }
}

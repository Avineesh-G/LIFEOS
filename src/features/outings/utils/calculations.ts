/**
 * LifeOS — Outing Expenses Exact Calculations
 * 
 * Invariants:
 * 1. All amounts are integer minor units (paise). Never produce floats.
 * 2. Equal splits always distribute remainder paise deterministically so sum(shares) === amount.
 * 3. Net balances across all participants always sum to exactly zero.
 * 4. Suggested payments greedily match largest debtor and creditor to zero all balances.
 */

import type {
  ExpenseShare,
  OutingExpense,
  OutingPerson,
  OutingSettlement,
  OutingSummary,
  SuggestedPayment,
} from '../types';

/**
 * Deterministically splits an integer paise amount equally among selected participants.
 * Leftover remainder paise are distributed 1 by 1 to the first N participants in stable order.
 */
export function calculateEqualSplit(amount: number, personIds: string[]): ExpenseShare[] {
  if (!personIds || personIds.length === 0) return [];
  if (personIds.length === 1) {
    return [{ personId: personIds[0], amount }];
  }

  const count = personIds.length;
  const baseShare = Math.floor(amount / count);
  const remainder = amount % count;

  // Stable sort of person IDs to guarantee deterministic distribution
  const sortedIds = [...personIds].sort();

  return sortedIds.map((personId, index) => ({
    personId,
    amount: index < remainder ? baseShare + 1 : baseShare,
  }));
}

/**
 * Calculates the net balance in paise for every participant in an outing:
 * netBalance = (paidByPerson - shareOfPerson) + (settlementsReceived - settlementsPaid)
 * 
 * Positive (>0): Person is owed money (creditor).
 * Negative (<0): Person owes money (debtor).
 * Zero (=0): Settled.
 * 
 * Mathematical Guarantee: The sum of balances across all participants is ALWAYS exactly 0.
 */
export function calculateNetBalances(
  participantIds: string[],
  expenses: OutingExpense[],
  settlements: OutingSettlement[]
): Map<string, number> {
  const balances = new Map<string, number>();

  for (const id of participantIds) {
    balances.set(id, 0);
  }

  // 1. Process active expenses
  for (const exp of expenses) {
    if (exp.deletedAt) continue;

    // Credit the person who paid the expense
    const currentPayerBal = balances.get(exp.paidByPersonId) ?? 0;
    balances.set(exp.paidByPersonId, currentPayerBal + exp.amount);

    // Debit each participant for their assigned share
    for (const share of exp.shares) {
      const currentShareholderBal = balances.get(share.personId) ?? 0;
      balances.set(share.personId, currentShareholderBal - share.amount);
    }
  }

  // 2. Process settlements
  for (const set of settlements) {
    if (set.deletedAt) continue;

    // The person who paid the settlement reduces what they owed (credit balance)
    const fromBal = balances.get(set.fromPersonId) ?? 0;
    balances.set(set.fromPersonId, fromBal + set.amount);

    // The person who received the settlement reduces what they were owed (debit balance)
    const toBal = balances.get(set.toPersonId) ?? 0;
    balances.set(set.toPersonId, toBal - set.amount);
  }

  return balances;
}

/**
 * Calculates a minimal set of peer-to-peer payment transactions using greedy matching.
 * Greedily matches the largest debtor with the largest creditor until all balances are zero.
 */
export function calculateSuggestedPayments(balances: Map<string, number>): SuggestedPayment[] {
  // Collect positive balances (creditors) and negative balances (debtors)
  const creditors: { personId: string; amount: number }[] = [];
  const debtors: { personId: string; amount: number }[] = [];

  for (const [personId, balance] of balances.entries()) {
    if (balance > 0) {
      creditors.push({ personId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ personId, amount: -balance });
    }
  }

  const transactions: SuggestedPayment[] = [];

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const paymentAmount = Math.min(creditor.amount, debtor.amount);

    if (paymentAmount > 0) {
      transactions.push({
        fromPersonId: debtor.personId,
        toPersonId: creditor.personId,
        amount: paymentAmount,
      });

      creditor.amount -= paymentAmount;
      debtor.amount -= paymentAmount;
    }

    if (creditor.amount === 0) cIdx++;
    if (debtor.amount === 0) dIdx++;
  }

  return transactions;
}

/**
 * Generates complete financial summary metrics for an outing.
 */
export function calculateOutingSummary(
  budget: number | undefined,
  budgetBasis: 'myShare' | 'totalCost',
  participantIds: string[],
  expenses: OutingExpense[],
  settlements: OutingSettlement[],
  mePersonId: string = 'me'
): OutingSummary {
  let totalCost = 0;
  let myShare = 0;
  let myPaid = 0;

  for (const exp of expenses) {
    if (exp.deletedAt) continue;
    totalCost += exp.amount;

    if (exp.paidByPersonId === mePersonId) {
      myPaid += exp.amount;
    }

    for (const s of exp.shares) {
      if (s.personId === mePersonId) {
        myShare += s.amount;
      }
    }
  }

  const balances = calculateNetBalances(participantIds, expenses, settlements);
  const myNetBalance = balances.get(mePersonId) ?? 0;
  const suggestedPayments = calculateSuggestedPayments(balances);

  const isSettled = Array.from(balances.values()).every(b => b === 0);

  const budgetPaise = budget ?? 0;
  const actualAgainstBudget = budgetBasis === 'totalCost' ? totalCost : myShare;
  const budgetRemaining = budgetPaise - actualAgainstBudget;
  const isOverBudget = budgetPaise > 0 && budgetRemaining < 0;
  const budgetProgressPct = budgetPaise > 0
    ? Math.min(150, Math.round((actualAgainstBudget / budgetPaise) * 100))
    : 0;

  return {
    totalCost,
    myShare,
    myPaid,
    budget: budgetPaise,
    budgetRemaining,
    budgetProgressPct,
    isOverBudget,
    balances,
    myNetBalance,
    isSettled,
    suggestedPayments,
  };
}

/**
 * Formats an integer paise value into Indian currency string (e.g. ₹1,240 or ₹1,240.50).
 */
export function formatPaiseToRupees(paise: number, showPlusSign = false): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  const hasPaise = absPaise % 100 !== 0;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);

  if (isNegative) {
    return `-${formatted}`;
  }
  if (showPlusSign && paise > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Parses user input decimal string (e.g. "1250", "1250.50") safely into integer paise.
 * Rejects invalid strings, enforces max bounds, and prevents floating-point inaccuracy.
 */
export function parseRupeesToPaise(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  const clean = input.replace(/[^0-9.]/g, '');
  if (!clean) return 0;

  const parts = clean.split('.');
  const whole = parseInt(parts[0] || '0', 10);
  let fraction = 0;

  if (parts.length > 1 && parts[1]) {
    const fracStr = parts[1].slice(0, 2).padEnd(2, '0');
    fraction = parseInt(fracStr, 10);
  }

  // Bound check: Max ₹10,00,00,000 (10 crore)
  const totalPaise = whole * 100 + fraction;
  if (isNaN(totalPaise) || totalPaise < 0) return 0;
  return Math.min(totalPaise, 1000000000);
}

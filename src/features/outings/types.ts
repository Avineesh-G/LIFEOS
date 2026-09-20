/**
 * LifeOS — Outing Expenses Types
 * 
 * Strict minor units rule: All monetary amounts are integers in paise (₹1 = 100 paise).
 * Floating-point money values are strictly prohibited.
 */

export type OutingBudgetBasis = 'myShare' | 'totalCost';
export type OutingStatus = 'planned' | 'ongoing' | 'completed';
export type SplitMode = 'equal' | 'custom' | 'personal';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'other';
export type OutingCategory = 'Food' | 'Transport' | 'Tickets & fun' | 'Shopping' | 'Stay' | 'Other' | string;

export interface Outing {
  id: string;
  name: string;
  place?: string;
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate?: string;   // ISO date 'YYYY-MM-DD'
  notes?: string;
  budget?: number;    // Minor units (paise: e.g. 500000 = ₹5,000.00)
  budgetBasis: OutingBudgetBasis; // default 'myShare'
  currency: 'INR' | string;
  status: OutingStatus;
  participantIds: string[]; // always includes "Me"
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt?: string | null; // soft delete
}

export interface OutingPerson {
  id: string;
  name: string;
  isMe: boolean;
  archived?: boolean;
  createdAt?: string;
}

export interface ExpenseShare {
  personId: string;
  amount: number; // Minor units (paise)
}

export interface OutingExpense {
  id: string;
  outingId: string;
  title: string;
  amount: number; // Minor units (paise)
  category: OutingCategory;
  paidByPersonId: string;
  splitMode: SplitMode;
  shares: ExpenseShare[]; // must sum exactly to amount
  paymentMethod?: PaymentMethod;
  spentAt: string; // ISO timestamp
  note?: string;
  receiptIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface OutingSettlement {
  id: string;
  outingId: string;
  fromPersonId: string;
  toPersonId: string;
  amount: number; // Minor units (paise)
  settledAt: string; // ISO timestamp
  note?: string;
  deletedAt?: string | null;
}

export interface OutingReceipt {
  id: string;
  expenseId?: string;
  outingId: string;
  blobKey: string;
  thumbKey: string;
  mime: string;
  width: number;
  height: number;
  size: number; // in bytes
  createdAt: string;
}

export interface OutingReceiptRecord {
  id: string;
  expenseId?: string;
  outingId: string;
  blob: Blob;
  thumbBlob: Blob;
  mime: string;
  width: number;
  height: number;
  size: number;
  createdAt: string;
}

export interface SuggestedPayment {
  fromPersonId: string;
  toPersonId: string;
  amount: number; // Minor units (paise)
}

export interface OutingSummary {
  totalCost: number; // Minor units
  myShare: number;   // Minor units
  myPaid: number;    // Minor units
  budget: number;    // Minor units
  budgetRemaining: number; // Minor units (negative = over budget)
  budgetProgressPct: number; // 0 - 100+
  isOverBudget: boolean;
  balances: Map<string, number>; // personId -> net paise (+ = owed to them, - = owes)
  myNetBalance: number; // Minor units
  isSettled: boolean;
  suggestedPayments: SuggestedPayment[];
}

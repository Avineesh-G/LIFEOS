/**
 * LifeOS — Outing Expenses Context & State Provider
 * 
 * Provides centralized state and optimistic actions for Outing Expenses:
 * - Outings list with search and filter
 * - Active outing details, expenses, settlements, and receipts
 * - Participant management
 * - Undo support for deletions with a 5-second grace window
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getOutings,
  getOutingById,
  saveOuting,
  deleteOuting as idbDeleteOuting,
  restoreOuting as idbRestoreOuting,
  getPeople,
  savePerson,
  ensureMePerson,
  getExpensesByOuting,
  saveExpense,
  deleteExpense as idbDeleteExpense,
  restoreExpense as idbRestoreExpense,
  getSettlementsByOuting,
  saveSettlement,
  deleteSettlement as idbDeleteSettlement,
  getReceiptRecordsByOuting,
  saveReceiptRecord,
  deleteReceiptRecord,
} from '../storage/outingsIdb';
import { syncOutingsWithCloud } from '../storage/outingsSync';
import { calculateOutingSummary } from '../utils/calculations';
import { auth } from '../../../firebase';
import type {
  Outing,
  OutingPerson,
  OutingExpense,
  OutingSettlement,
  OutingReceiptRecord,
  OutingSummary,
} from '../types';

interface UndoAction {
  type: 'outing' | 'expense' | 'settlement';
  id: string;
  name: string;
  timerId: any;
}

interface OutingsContextType {
  outings: Outing[];
  people: OutingPerson[];
  activeOuting: Outing | null;
  activeExpenses: OutingExpense[];
  activeSettlements: OutingSettlement[];
  activeReceipts: OutingReceiptRecord[];
  activeSummary: OutingSummary | null;
  isLoading: boolean;
  undoAction: { type: 'outing' | 'expense' | 'settlement'; name: string } | null;
  setActiveOutingId: (id: string | null) => void;
  createOuting: (params: {
    name: string;
    place?: string;
    startDate: string;
    endDate?: string;
    notes?: string;
    budget?: number;
    budgetBasis?: 'myShare' | 'totalCost';
    participantIds?: string[];
  }) => Promise<string>;
  updateOuting: (id: string, updates: Partial<Outing>) => Promise<void>;
  deleteOuting: (id: string) => Promise<void>;
  addPerson: (name: string) => Promise<OutingPerson>;
  addExpense: (
    expenseData: Omit<OutingExpense, 'id' | 'createdAt' | 'updatedAt' | 'receiptIds'>,
    receiptBlobs?: { blob: Blob; thumbBlob: Blob; width: number; height: number; size: number }[]
  ) => Promise<string>;
  updateExpense: (
    id: string,
    updates: Partial<OutingExpense>,
    newReceiptBlobs?: { blob: Blob; thumbBlob: Blob; width: number; height: number; size: number }[]
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addSettlement: (settlementData: {
    outingId: string;
    fromPersonId: string;
    toPersonId: string;
    amount: number;
    note?: string;
  }) => Promise<string>;
  deleteSettlement: (id: string) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  refresh: () => Promise<void>;
}

const OutingsContext = createContext<OutingsContextType | null>(null);

export function OutingsProvider({ children }: { children: React.ReactNode }) {
  const [outings, setOutings] = useState<Outing[]>([]);
  const [people, setPeople] = useState<OutingPerson[]>([]);
  const [activeOutingId, setActiveOutingId] = useState<string | null>(null);
  const [activeExpenses, setActiveExpenses] = useState<OutingExpense[]>([]);
  const [activeSettlements, setActiveSettlements] = useState<OutingSettlement[]>([]);
  const [activeReceipts, setActiveReceipts] = useState<OutingReceiptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [undoItem, setUndoItem] = useState<UndoAction | null>(null);

  // Load base data
  const loadBaseData = useCallback(async () => {
    try {
      await ensureMePerson();
      const [allOutings, allPeople] = await Promise.all([getOutings(), getPeople()]);
      setOutings(allOutings);
      setPeople(allPeople);

      // Cloud sync in background if user is authenticated
      if (auth.currentUser?.uid) {
        syncOutingsWithCloud(auth.currentUser.uid).then(async () => {
          const freshOutings = await getOutings();
          setOutings(freshOutings);
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  // Load active outing details
  const loadActiveOutingDetails = useCallback(async (id: string) => {
    try {
      const [expenses, settlements, receipts] = await Promise.all([
        getExpensesByOuting(id),
        getSettlementsByOuting(id),
        getReceiptRecordsByOuting(id),
      ]);
      setActiveExpenses(expenses);
      setActiveSettlements(settlements);
      setActiveReceipts(receipts);
    } catch (err) {
      console.warn('[LifeOS Outings] Failed to load outing details:', err);
    }
  }, []);

  useEffect(() => {
    if (activeOutingId) {
      loadActiveOutingDetails(activeOutingId);
    } else {
      setActiveExpenses([]);
      setActiveSettlements([]);
      setActiveReceipts([]);
    }
  }, [activeOutingId, loadActiveOutingDetails]);

  const activeOuting = useMemo(() => {
    if (!activeOutingId) return null;
    return outings.find((o) => o.id === activeOutingId) || null;
  }, [outings, activeOutingId]);

  // Computed summary
  const activeSummary = useMemo(() => {
    if (!activeOuting) return null;
    return calculateOutingSummary(
      activeOuting.budget,
      activeOuting.budgetBasis || 'myShare',
      activeOuting.participantIds,
      activeExpenses,
      activeSettlements,
      'me'
    );
  }, [activeOuting, activeExpenses, activeSettlements]);

  // Actions
  const createOuting = useCallback(
    async (params: {
      name: string;
      place?: string;
      startDate: string;
      endDate?: string;
      notes?: string;
      budget?: number;
      budgetBasis?: 'myShare' | 'totalCost';
      participantIds?: string[];
    }): Promise<string> => {
      const id = `outing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const pIds = Array.from(new Set(['me', ...(params.participantIds || [])]));

      const newOuting: Outing = {
        id,
        name: params.name.trim(),
        place: params.place?.trim(),
        startDate: params.startDate,
        endDate: params.endDate,
        notes: params.notes,
        budget: params.budget,
        budgetBasis: params.budgetBasis || 'myShare',
        currency: 'INR',
        status: 'planned',
        participantIds: pIds,
        createdAt: now,
        updatedAt: now,
      };

      await saveOuting(newOuting);
      setOutings((prev) => [newOuting, ...prev]);
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
      return id;
    },
    []
  );

  const updateOuting = useCallback(
    async (id: string, updates: Partial<Outing>): Promise<void> => {
      const existing = await getOutingById(id);
      if (!existing) return;

      const updated: Outing = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await saveOuting(updated);
      setOutings((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
    },
    []
  );

  const deleteOuting = useCallback(
    async (id: string): Promise<void> => {
      const target = outings.find((o) => o.id === id);
      if (!target) return;

      // Soft delete immediately
      await idbDeleteOuting(id, false);
      setOutings((prev) => prev.filter((o) => o.id !== id));

      if (undoItem?.timerId) clearTimeout(undoItem.timerId);

      const timerId = setTimeout(async () => {
        // Permanent delete after 5 seconds
        await idbDeleteOuting(id, true);
        setUndoItem(null);
        if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
      }, 5000);

      setUndoItem({
        type: 'outing',
        id,
        name: target.name,
        timerId,
      });
    },
    [outings, undoItem]
  );

  const addPerson = useCallback(
    async (name: string): Promise<OutingPerson> => {
      const trimmed = name.trim();
      const existing = people.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;

      const newPerson: OutingPerson = {
        id: `person_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        isMe: false,
        createdAt: new Date().toISOString(),
      };

      await savePerson(newPerson);
      setPeople((prev) => [...prev, newPerson]);
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
      return newPerson;
    },
    [people]
  );

  const addExpense = useCallback(
    async (
      expenseData: Omit<OutingExpense, 'id' | 'createdAt' | 'updatedAt' | 'receiptIds'>,
      receiptBlobs?: { blob: Blob; thumbBlob: Blob; width: number; height: number; size: number }[]
    ): Promise<string> => {
      const expenseId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const receiptIds: string[] = [];

      // Save any receipt blobs
      if (receiptBlobs && receiptBlobs.length > 0) {
        for (const item of receiptBlobs) {
          const recId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const record: OutingReceiptRecord = {
            id: recId,
            expenseId,
            outingId: expenseData.outingId,
            blob: item.blob,
            thumbBlob: item.thumbBlob,
            mime: 'image/jpeg',
            width: item.width,
            height: item.height,
            size: item.size,
            createdAt: now,
          };
          await saveReceiptRecord(record);
          receiptIds.push(recId);
          setActiveReceipts((prev) => [record, ...prev]);
        }
      }

      const newExpense: OutingExpense = {
        ...expenseData,
        id: expenseId,
        receiptIds,
        createdAt: now,
        updatedAt: now,
      };

      await saveExpense(newExpense);
      setActiveExpenses((prev) => [newExpense, ...prev]);
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
      return expenseId;
    },
    []
  );

  const updateExpense = useCallback(
    async (
      id: string,
      updates: Partial<OutingExpense>,
      newReceiptBlobs?: { blob: Blob; thumbBlob: Blob; width: number; height: number; size: number }[]
    ): Promise<void> => {
      const existing = activeExpenses.find((e) => e.id === id);
      if (!existing) return;

      const now = new Date().toISOString();
      const addedReceiptIds: string[] = [];

      if (newReceiptBlobs && newReceiptBlobs.length > 0) {
        for (const item of newReceiptBlobs) {
          const recId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const record: OutingReceiptRecord = {
            id: recId,
            expenseId: id,
            outingId: existing.outingId,
            blob: item.blob,
            thumbBlob: item.thumbBlob,
            mime: 'image/jpeg',
            width: item.width,
            height: item.height,
            size: item.size,
            createdAt: now,
          };
          await saveReceiptRecord(record);
          addedReceiptIds.push(recId);
          setActiveReceipts((prev) => [record, ...prev]);
        }
      }

      const updated: OutingExpense = {
        ...existing,
        ...updates,
        receiptIds: [...(updates.receiptIds || existing.receiptIds), ...addedReceiptIds],
        updatedAt: now,
      };

      await saveExpense(updated);
      setActiveExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
    },
    [activeExpenses]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      const target = activeExpenses.find((e) => e.id === id);
      if (!target) return;

      await idbDeleteExpense(id, false);
      setActiveExpenses((prev) => prev.filter((e) => e.id !== id));

      if (undoItem?.timerId) clearTimeout(undoItem.timerId);

      const timerId = setTimeout(async () => {
        await idbDeleteExpense(id, true);
        setUndoItem(null);
        if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
      }, 5000);

      setUndoItem({
        type: 'expense',
        id,
        name: target.title,
        timerId,
      });
    },
    [activeExpenses, undoItem]
  );

  const addSettlement = useCallback(
    async (settlementData: {
      outingId: string;
      fromPersonId: string;
      toPersonId: string;
      amount: number;
      note?: string;
    }): Promise<string> => {
      const id = `stl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();

      const newSettlement: OutingSettlement = {
        ...settlementData,
        id,
        settledAt: now,
      };

      await saveSettlement(newSettlement);
      setActiveSettlements((prev) => [newSettlement, ...prev]);
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
      return id;
    },
    []
  );

  const deleteSettlement = useCallback(
    async (id: string): Promise<void> => {
      await idbDeleteSettlement(id);
      setActiveSettlements((prev) => prev.filter((s) => s.id !== id));
      if (auth.currentUser?.uid) syncOutingsWithCloud(auth.currentUser.uid);
    },
    []
  );

  const deleteReceipt = useCallback(
    async (id: string): Promise<void> => {
      await deleteReceiptRecord(id);
      setActiveReceipts((prev) => prev.filter((r) => r.id !== id));
      // Also update any expense referencing this receipt
      setActiveExpenses((prev) =>
        prev.map((e) => ({
          ...e,
          receiptIds: e.receiptIds.filter((rid) => rid !== id),
        }))
      );
    },
    []
  );

  const undoDelete = useCallback(async (): Promise<void> => {
    if (!undoItem) return;
    clearTimeout(undoItem.timerId);

    if (undoItem.type === 'outing') {
      await idbRestoreOuting(undoItem.id);
      const restored = await getOutingById(undoItem.id);
      if (restored) {
        setOutings((prev) => [restored, ...prev]);
      }
    } else if (undoItem.type === 'expense') {
      await idbRestoreExpense(undoItem.id);
      if (activeOutingId) {
        const exps = await getExpensesByOuting(activeOutingId);
        setActiveExpenses(exps);
      }
    }

    setUndoItem(null);
  }, [undoItem, activeOutingId]);

  return (
    <OutingsContext.Provider
      value={{
        outings,
        people,
        activeOuting,
        activeExpenses,
        activeSettlements,
        activeReceipts,
        activeSummary,
        isLoading,
        undoAction: undoItem ? { type: undoItem.type, name: undoItem.name } : null,
        setActiveOutingId,
        createOuting,
        updateOuting,
        deleteOuting,
        addPerson,
        addExpense,
        updateExpense,
        deleteExpense,
        addSettlement,
        deleteSettlement,
        deleteReceipt,
        undoDelete,
        refresh: loadBaseData,
      }}
    >
      {children}
    </OutingsContext.Provider>
  );
}

export function useOutings() {
  const context = useContext(OutingsContext);
  if (!context) {
    throw new Error('useOutings must be used within an OutingsProvider');
  }
  return context;
}

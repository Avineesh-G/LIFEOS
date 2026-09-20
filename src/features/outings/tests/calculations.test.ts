/**
 * LifeOS — Outing Expenses Calculations Verification Tests
 * 
 * Verifies all mathematical invariants from Section 5 of the spec:
 * 1. Equal split remainder paise distribution (shares always sum to total).
 * 2. Net balances across all participants always sum to 0.
 * 3. Suggested payments greedily cancel all debts to 0.
 * 4. Zero floats produced anywhere.
 */

import {
  calculateEqualSplit,
  calculateNetBalances,
  calculateSuggestedPayments,
  calculateOutingSummary,
  parseRupeesToPaise,
  formatPaiseToRupees,
} from '../utils/calculations.ts';
import type { OutingExpense, OutingSettlement, OutingPerson } from '../types.ts';

function runTests() {
  console.log('🧪 Starting Outing Expenses Mathematical Invariant Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Equal split with remainder
  // 100 paise (₹1.00) among 3 people -> 34, 33, 33
  const split3 = calculateEqualSplit(100, ['p1', 'p2', 'p3']);
  const sum3 = split3.reduce((acc, s) => acc + s.amount, 0);
  assert(sum3 === 100, 'Equal split 100 paise among 3 people sums to 100');
  assert(
    split3[0].amount === 34 && split3[1].amount === 33 && split3[2].amount === 33,
    'Remainder distributed deterministically (+1 to first)'
  );
  assert(split3.every(s => Number.isInteger(s.amount)), 'All split shares are strictly integers');

  // Test 2: Large prime split
  // ₹10,453.77 = 1,045,377 paise among 7 people
  const split7 = calculateEqualSplit(1045377, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
  const sum7 = split7.reduce((acc, s) => acc + s.amount, 0);
  assert(sum7 === 1045377, 'Large prime split sums exactly to total paise');

  // Test 3: Net Balance Invariant (Sum of balances === 0)
  // Person A paid ₹3,000 (300000 paise) split equally among A, B, C
  // Person B paid ₹1,500 (150000 paise) split equally among A, B
  const people = ['A', 'B', 'C'];
  const expenses: OutingExpense[] = [
    {
      id: 'e1',
      outingId: 'out1',
      title: 'Dinner',
      amount: 300000,
      category: 'Food',
      paidByPersonId: 'A',
      splitMode: 'equal',
      shares: calculateEqualSplit(300000, ['A', 'B', 'C']),
      spentAt: '2026-09-20T19:00:00Z',
      receiptIds: [],
      createdAt: '2026-09-20T19:00:00Z',
      updatedAt: '2026-09-20T19:00:00Z',
    },
    {
      id: 'e2',
      outingId: 'out1',
      title: 'Cab',
      amount: 150000,
      category: 'Transport',
      paidByPersonId: 'B',
      splitMode: 'equal',
      shares: calculateEqualSplit(150000, ['A', 'B']),
      spentAt: '2026-09-20T21:00:00Z',
      receiptIds: [],
      createdAt: '2026-09-20T21:00:00Z',
      updatedAt: '2026-09-20T21:00:00Z',
    },
  ];

  const balances = calculateNetBalances(people, expenses, []);
  let totalBalance = 0;
  for (const b of balances.values()) {
    totalBalance += b;
  }
  assert(totalBalance === 0, 'Sum of all net balances across all participants is strictly 0');
  // Expected:
  // A paid 300k, share is 100k + 75k = 175k -> net +125k
  // B paid 150k, share is 100k + 75k = 175k -> net -25k
  // C paid 0k, share is 100k -> net -100k
  assert(balances.get('A') === 125000, 'Person A net balance is +125,000 paise');
  assert(balances.get('B') === -25000, 'Person B net balance is -25,000 paise');
  assert(balances.get('C') === -100000, 'Person C net balance is -100,000 paise');

  // Test 4: Suggested payments greedy match
  const payments = calculateSuggestedPayments(new Map(balances));
  assert(payments.length === 2, 'Greedy matching produces exactly 2 payments for 3 people');
  // C pays A 100k, B pays A 25k
  const cToA = payments.find(p => p.fromPersonId === 'C' && p.toPersonId === 'A');
  const bToA = payments.find(p => p.fromPersonId === 'B' && p.toPersonId === 'A');
  assert(cToA !== undefined && cToA.amount === 100000, 'C pays A 100,000 paise (₹1,000)');
  assert(bToA !== undefined && bToA.amount === 25000, 'B pays A 25,000 paise (₹250)');

  // Test 5: Applying settlements zeroes out all balances
  const settlements: OutingSettlement[] = [
    {
      id: 's1',
      outingId: 'out1',
      fromPersonId: 'C',
      toPersonId: 'A',
      amount: 100000,
      settledAt: '2026-09-20T22:00:00Z',
    },
    {
      id: 's2',
      outingId: 'out1',
      fromPersonId: 'B',
      toPersonId: 'A',
      amount: 25000,
      settledAt: '2026-09-20T22:05:00Z',
    },
  ];

  const settledBalances = calculateNetBalances(people, expenses, settlements);
  const allZero = Array.from(settledBalances.values()).every(b => b === 0);
  assert(allZero, 'Applying suggested settlements zeroes out every net balance');

  // Test 6: Parsing and Formatting
  assert(parseRupeesToPaise('1240') === 124000, 'Parse 1240 -> 124000 paise');
  assert(parseRupeesToPaise('1240.50') === 124050, 'Parse 1240.50 -> 124050 paise');
  assert(parseRupeesToPaise('1240.5') === 124050, 'Parse 1240.5 -> 124050 paise');
  assert(parseRupeesToPaise('0') === 0, 'Parse 0 -> 0 paise');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

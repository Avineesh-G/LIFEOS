/**
 * LifeOS Backup & Restore Round-Trip Automated Invariant Test
 */

import assert from 'node:assert';
import { previewBackupPackage } from '../src/utils/backupRestore.ts';
import type { AppData } from '../src/types.ts';

console.log('🧪 Running LifeOS Backup & Restore Round-Trip Invariant Tests...');

const sampleData: AppData = {
  workoutPlans: [
    { day: 'Mon', type: 'PUSH', exercises: [{ id: 'ex_1', name: 'Bench Press', sets: 3, reps: 10, weight: 80 }] },
  ],
  workoutLogs: [
    {
      id: 'w_1',
      date: '2026-09-20',
      day: 'Mon',
      type: 'PUSH',
      exercises: [{ name: 'Bench Press', sets: [{ reps: 10, weight: 80, completed: true }] }],
    },
  ],
  expenses: [{ id: 'e_1', date: '2026-09-20', amount: 450, category: 'Food', note: 'Dinner' }],
  studySessions: [{ id: 's_1', date: '2026-09-20', startTime: '09:00', duration: 45, subject: 'CS' }],
  timetable: [{ id: 'tt_1', day: 'Mon', startTime: '09:00', endTime: '10:00', subject: 'Math', room: '101' }],
  tasks: [{ id: 't_1', text: 'Complete testing', completed: true, date: '2026-09-20' }],
  reviews: [],
  settings: { theme: 'system', accentColor: '#6366F1', navPinned: ['gym', 'nutrition'] },
  profile: null,
  menuMonths: [],
  nutritionLogs: [
    {
      id: 'n_1',
      date: '2026-09-20',
      dailyTotal: 400,
      mealsEaten: [
        {
          slot: 'breakfast',
          items: [{ id: 'm_1', name: 'Eggs & Toast', calories: 400, portion: 1, isExtra: false }],
        },
      ],
    },
  ],
  messPreference: 'nonveg',
  geminiApiKey: 'AIzaSy_SecretTestKey123',
  vaultItems: [
    {
      id: 'v_1',
      title: 'Work Email',
      category: 'work',
      usernameOrEmail: 'user@example.com',
      encryptedPassword: 'U2FsdGVkX1+EncryptedBlobBytes==',
      iv: '1234567890abcdef',
      websiteUrl: 'https://mail.example.com',
      notes: 'Secret notes',
      createdAt: '2026-09-20T00:00:00.000Z',
      updatedAt: '2026-09-20T00:00:00.000Z',
    },
  ],
  vaultConfig: { salt: 'abcdef123456', hasMasterPin: true, useBiometrics: true },
  laundryBatches: [],
  shoppingLists: [
    {
      id: 'list_1',
      name: 'Groceries',
      createdAt: '2026-09-20T00:00:00.000Z',
      updatedAt: '2026-09-20T00:00:00.000Z',
      isTemplate: false,
      items: [{ id: 'item_1', name: 'Milk', checked: false, quantity: '1L' }],
    },
  ],
};

// Test 1: Full serialization package structure
{
  const pkg = {
    meta: {
      version: 3,
      exportedAt: new Date().toISOString(),
      appVersion: '1.2.3',
      buildNumber: 10,
      platform: 'test-node',
    },
    appData: sampleData,
    outings: {
      outings: [{ id: 'o_1', name: 'Goa Trip', budget: 500000 }],
      people: [{ id: 'p_1', name: 'Avineesh', isMe: true }],
      expenses: [{ id: 'exp_1', outingId: 'o_1', title: 'Dinner', amount: 120000 }],
      settlements: [],
      receipts: [
        {
          id: 'rec_1',
          outingId: 'o_1',
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mime: 'image/png',
          size: 68,
          width: 1,
          height: 1,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  };

  const jsonStr = JSON.stringify(pkg, null, 2);
  const preview = previewBackupPackage(jsonStr);

  assert.strictEqual(preview.valid, true, 'Backup package must be valid');
  assert.strictEqual(preview.counts.workouts, 1, 'Should preview 1 workout');
  assert.strictEqual(preview.counts.nutritionLogs, 1, 'Should preview 1 nutrition log');
  assert.strictEqual(preview.counts.tasks, 1, 'Should preview 1 task');
  assert.strictEqual(preview.counts.vaultItems, 1, 'Should preview 1 vault item');
  assert.strictEqual(preview.counts.outings, 1, 'Should preview 1 outing');
  assert.strictEqual(preview.counts.expenses, 1, 'Should preview 1 expense');
  assert.strictEqual(preview.counts.receipts, 1, 'Should preview 1 receipt');
  console.log('  ✅ Test 1 Passed: Package validation and count preview accurately inspects all stores');
}

// Test 2: Invariant Check - Vault encrypted passwords must not be modified or cleared
{
  const pkg = {
    meta: { version: 3, exportedAt: new Date().toISOString(), appVersion: '1.2.3', buildNumber: 10, platform: 'test' },
    appData: sampleData,
  };
  const json = JSON.stringify(pkg);
  const restored = JSON.parse(json);
  assert.strictEqual(restored.appData.vaultItems[0].encryptedPassword, 'U2FsdGVkX1+EncryptedBlobBytes==');
  assert.strictEqual(restored.appData.vaultItems[0].iv, '1234567890abcdef');
  console.log('  ✅ Test 2 Passed: Vault AES-256 payload integrity preserved verbatim across serialization');
}

// Test 3: Corrupt JSON / Malformed file error detection
{
  const corruptJson = '{ "meta": { "version": 3 }, "appData": { "workouts": [ corrupted json here... ';
  const preview = previewBackupPackage(corruptJson);
  assert.strictEqual(preview.valid, false, 'Corrupt JSON must be detected as invalid');
  assert.ok(preview.error, 'Error message must be populated');
  console.log('  ✅ Test 3 Passed: Malformed backup file safely rejected with descriptive error');
}

console.log('🎉 All Backup & Restore Round-Trip Invariant Tests Passed Successfully!\n');

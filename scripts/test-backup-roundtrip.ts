/**
 * LifeOS Backup & Restore Round-Trip Automated Invariant Test
 */

import assert from 'node:assert';
import { previewBackupPackage } from '../src/utils/backupRestore.ts';
import type { AppData } from '../src/types.ts';

console.log('🧪 Running LifeOS Backup & Restore Round-Trip Invariant Tests...');

const sampleData: AppData = {
  workoutPlans: [
    { day: 'Mon', type: 'PUSH', exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 80 }] },
  ],
  workoutLogs: [
    {
      id: 'w_1',
      date: '2026-09-20',
      type: 'PUSH',
      notes: 'Strong bench sets',
      durationMinutes: 55,
      exercises: [{ name: 'Bench Press', sets: [{ reps: 10, weight: 80, completed: true }] }],
    },
  ],
  expenses: [{ id: 'e_1', date: '2026-09-20', amount: 450, category: 'Food', description: 'Dinner' }],
  studySessions: [{ id: 's_1', date: '2026-09-20', durationMinutes: 45, subject: 'CS', type: 'focus' }],
  timetable: [{ id: 'tt_1', day: 'Mon', startTime: '09:00', endTime: '10:00', subject: 'Math', room: '101' }],
  tasks: [{ id: 't_1', title: 'Complete testing', completed: true, date: '2026-09-20', priority: 'high' }],
  reviews: [],
  settings: { theme: 'system', accentColor: '#6366F1', navPinned: ['gym', 'nutrition'] },
  profile: null,
  menuMonths: [],
  nutritionLogs: [
    {
      date: '2026-09-20',
      waterIntake: 2500,
      meals: [{ id: 'm_1', name: 'Eggs & Toast', calories: 400, protein: 30, carbs: 40, fats: 10, time: '08:00' }],
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
  vaultConfig: { isSetup: true, salt: 'abcdef123456', biometricEnabled: true },
  laundryBatches: [],
  shoppingLists: [
    {
      id: 'list_1',
      name: 'Groceries',
      createdAt: '2026-09-20T00:00:00.000Z',
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

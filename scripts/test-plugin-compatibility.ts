/**
 * LifeOS Old Shell Plugin Compatibility Invariant Test
 * 
 * Simulates an environment where Capacitor native plugins are missing
 * (throwing "Plugin not implemented" or isPluginAvailable returning false).
 * Proves that:
 * 1. Receipt storage falls back to IndexedDB (idb://) without throwing.
 * 2. Backup export falls back to standard web download without crashing.
 * 3. Updater falls back to web constants and web download without throwing.
 * 4. No unhandled promise rejections or crashes occur.
 */

import assert from 'node:assert/strict';

console.log('🧪 Running LifeOS Old Shell Plugin Compatibility Tests...\n');

// Mock DOM for web download fallback
(globalThis as any).document = {
  createElement: (tag: string) => ({
    tagName: tag.toUpperCase(),
    href: '',
    download: '',
    click: () => {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};
(globalThis as any).URL = {
  createObjectURL: () => 'blob:mock-url',
  revokeObjectURL: () => {},
};

// 1. Test Receipt Filesystem Fallback
import {
  isNativeFilesystemAvailable,
  writeNativeReceipt,
  readNativeReceipt,
  deleteNativeReceipt,
} from '../src/features/outings/storage/receiptFilesystem.ts';

async function testReceiptFallback() {
  console.log('  Testing Outings Receipt Filesystem Fallback:');
  const available = await isNativeFilesystemAvailable();
  assert.equal(available, false, 'isNativeFilesystemAvailable must be false when plugin is missing');

  const uri = await writeNativeReceipt('rec_123', 'data:image/jpeg;base64,ZmFrZWltYWdl');
  assert.equal(uri, 'idb://rec_123', 'writeNativeReceipt must fall back to idb:// URI');

  const readData = await readNativeReceipt('rec_123');
  assert.equal(readData, null, 'readNativeReceipt must return null safely');

  await deleteNativeReceipt('rec_123'); // must not throw
  console.log('  ✅ Passed: Receipt filesystem safely falls back to IndexedDB\n');
}

// 2. Test Backup Export Fallback
import { exportBackupFile } from '../src/utils/backupRestore.ts';

async function testBackupFallback() {
  console.log('  Testing Backup Export Fallback:');
  const mockAppData: any = {
    workouts: [],
    foodLogs: [],
    tasks: [],
    habits: [],
    timetable: [],
    studySessions: [],
    vaultItems: [],
  };

  const res = await exportBackupFile(mockAppData, false);
  assert.equal(res.success, true, 'exportBackupFile must succeed via web download fallback');
  assert.ok(res.filename.startsWith('LifeOS_Backup_'), 'Filename must be generated correctly');
  console.log('  ✅ Passed: Backup export safely falls back to web blob download\n');
}

// 3. Test Updater Fallback
import {
  getInstalledVersion,
  checkCanInstallApk,
  startApkUpdate,
  CURRENT_VERSION_CODE,
  CURRENT_VERSION_NAME,
} from '../src/utils/updater.ts';

async function testUpdaterFallback() {
  console.log('  Testing In-App Updater Fallback:');
  const installed = await getInstalledVersion();
  assert.equal(typeof installed.versionCode, 'number', 'versionCode must be a number');
  assert.equal(typeof installed.versionName, 'string', 'versionName must be a string');
  assert.equal(installed.versionCode, CURRENT_VERSION_CODE, 'Must match bundled CURRENT_VERSION_CODE');

  const canInstall = await checkCanInstallApk();
  assert.equal(canInstall, true, 'checkCanInstallApk must return true safely');

  let errorOccurred = false;
  let progressReported = false;
  await startApkUpdate(
    {
      versionCode: 11,
      versionName: '1.2.4',
      releaseDate: '2026-09-21',
      releaseNotes: 'Update notes',
      apkUrl: 'https://example.com/LifeOS.apk',
    },
    (prog) => {
      progressReported = true;
    },
    (err) => {
      errorOccurred = true;
    }
  );

  assert.equal(errorOccurred, false, 'startApkUpdate must not trigger error in web fallback');
  assert.equal(progressReported, true, 'startApkUpdate must report progress in web fallback');
  console.log('  ✅ Passed: Updater safely falls back to bundled constants and web download\n');
}

async function runAll() {
  await testReceiptFallback();
  await testBackupFallback();
  await testUpdaterFallback();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 ALL OLD-SHELL PLUGIN COMPATIBILITY TESTS PASSED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runAll().catch((err) => {
  console.error('❌ Plugin compatibility test failed:', err);
  process.exit(1);
});

import assert from 'node:assert';
import { evaluateUpdateAvailable } from '../src/utils/updater.ts';

console.log('🧪 Running LifeOS Updater Version Comparison Tests...');

// Test 1: Remote is higher (Valid Update Available)
{
  const result = evaluateUpdateAvailable(4, 10);
  assert.strictEqual(result.hasUpdate, true, 'Remote 10 > Installed 4 must flag update available');
  assert.strictEqual(result.isDowngrade, false, 'Remote 10 > Installed 4 is not a downgrade');
  assert.strictEqual(result.isEqual, false, 'Remote 10 is not equal to Installed 4');
  console.log('  ✅ Test 1 Passed: Higher remote version triggers update');
}

// Test 2: Versions are equal (Already Up To Date / No Update)
{
  const result = evaluateUpdateAvailable(10, 10);
  assert.strictEqual(result.hasUpdate, false, 'Equal versions must not flag update');
  assert.strictEqual(result.isDowngrade, false, 'Equal versions is not a downgrade');
  assert.strictEqual(result.isEqual, true, 'Equal versions must flag isEqual');
  console.log('  ✅ Test 2 Passed: Equal version reports already up-to-date');
}

// Test 3: Remote is lower (Rejected Downgrade)
{
  const result = evaluateUpdateAvailable(10, 4);
  assert.strictEqual(result.hasUpdate, false, 'Lower remote must not flag update');
  assert.strictEqual(result.isDowngrade, true, 'Lower remote must be flagged as downgrade');
  assert.strictEqual(result.isEqual, false, 'Lower remote is not equal');
  console.log('  ✅ Test 3 Passed: Rejected downgrade identified cleanly');
}

// Test 4: Malformed / NaN inputs
{
  const result = evaluateUpdateAvailable(NaN, 10);
  assert.strictEqual(result.hasUpdate, false, 'NaN installed version must safely return false');
  assert.strictEqual(result.isDowngrade, false);
  assert.strictEqual(result.isEqual, false);

  const result2 = evaluateUpdateAvailable(10, NaN);
  assert.strictEqual(result2.hasUpdate, false, 'NaN remote version must safely return false');
  console.log('  ✅ Test 4 Passed: Malformed / NaN inputs handled gracefully without throwing');
}

console.log('🎉 All Updater Unit Tests Passed Successfully!\n');

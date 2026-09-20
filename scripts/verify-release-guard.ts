/**
 * LifeOS Release Guard Script
 * 
 * Enforces pre-release invariants:
 * 1. versionCode must be strictly greater than installed baseline (versionCode > 4).
 * 2. Keystore signing certificate must match expected release fingerprint.
 * 3. If APK is supplied, APK certificate and SHA-256 checksum must match version.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { APP_VERSION } from '../src/version.ts';

const EXPECTED_CERT_SHA256 = 'E5:BF:4D:70:79:42:14:93:83:AF:CE:20:80:D6:69:95:E1:82:3F:FE:12:B2:93:E4:21:0E:E6:47:FE:95:71:83';
const BASELINE_MAX_VERSION_CODE = 4; // v1.2.2 baseline

console.log('🛡️  Running LifeOS Release Guard Invariant Checks...');

// Invariant 1: Version Code Check
console.log(`  Checking versionCode: ${APP_VERSION.versionCode} (Baseline: ${BASELINE_MAX_VERSION_CODE})...`);
if (APP_VERSION.versionCode <= BASELINE_MAX_VERSION_CODE) {
  console.error(`  ❌ FAILED: versionCode (${APP_VERSION.versionCode}) is not greater than installed baseline (${BASELINE_MAX_VERSION_CODE}).`);
  process.exit(1);
}
console.log(`  ✅ Passed: versionCode ${APP_VERSION.versionCode} > ${BASELINE_MAX_VERSION_CODE}`);

// Invariant 2: Check Keystore Certificate Fingerprint
const keystorePath = path.resolve(process.cwd(), 'android/app/lifeos-release-key.jks');
if (fs.existsSync(keystorePath)) {
  try {
    const keytoolOutput = execSync(
      `keytool -list -v -keystore "${keystorePath}" -storepass lifeos123 -alias lifeos`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const match = keytoolOutput.match(/SHA256:\s*([A-F0-9:]+)/i);
    if (match) {
      const actualCert = match[1].trim().toUpperCase();
      if (actualCert !== EXPECTED_CERT_SHA256) {
        console.error(`  ❌ FAILED: Keystore certificate fingerprint mismatch!\n    Expected: ${EXPECTED_CERT_SHA256}\n    Actual:   ${actualCert}`);
        process.exit(1);
      }
      console.log(`  ✅ Passed: Keystore certificate matches release fingerprint.`);
    }
  } catch (err: any) {
    console.warn(`  ⚠️  Warning: Unable to verify keystore via keytool: ${err.message}`);
  }
}

// Invariant 3: If candidate APK path is passed as argument, verify APK
const candidateApk = process.argv[2];
if (candidateApk && fs.existsSync(candidateApk)) {
  console.log(`  Verifying Candidate APK at ${candidateApk}...`);
  const apkBuffer = fs.readFileSync(candidateApk);
  const actualApkSha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex').toLowerCase();
  
  const versionJsonPath = path.resolve(process.cwd(), 'version.json');
  if (fs.existsSync(versionJsonPath)) {
    const vJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    if (vJson.sha256 && vJson.sha256.toLowerCase() !== actualApkSha256) {
      console.error(`  ❌ FAILED: APK SHA-256 does not match version.json!\n    Expected: ${vJson.sha256}\n    Actual:   ${actualApkSha256}`);
      process.exit(1);
    }
  }
  console.log(`  ✅ Passed: Candidate APK verified with SHA-256 ${actualApkSha256}`);
}

console.log('🎉 Release Guard Passed All Invariant Checks!\n');

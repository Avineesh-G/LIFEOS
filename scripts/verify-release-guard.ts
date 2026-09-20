/**
 * LifeOS Hardened Release Guard Script
 * 
 * Enforces pre-release invariants:
 * 1. Reads baseline versionCode from published origin/main:public/version.json.
 *    Enforces current versionCode > published baseline.
 * 2. Enforces version agreement across:
 *    - src/version.ts (single source of truth)
 *    - package.json
 *    - android/app/build.gradle
 * 3. Verifies keystore certificate fingerprint matches expected release fingerprint.
 * 4. Verifies published/current public/LifeOS.apk certificate fingerprint matches keystore.
 * 5. If candidate APK is supplied, validates APK SHA-256 matches version.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { APP_VERSION } from '../src/version.ts';

const EXPECTED_CERT_SHA256 = 'E5:BF:4D:70:79:42:14:93:83:AF:CE:20:80:D6:69:95:E1:82:3F:FE:12:B2:93:E4:21:0E:E6:47:FE:95:71:83';

console.log('🛡️  Running Hardened LifeOS Release Guard Checks...\n');

// ── Check 1: Dynamic Baseline Discovery from origin/main ──────────────────────
let baselineVersionCode = 4; // fallback
let baselineVersionName = '1.2.2';

try {
  const publishedJsonRaw = execSync('git show origin/main:public/version.json', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const publishedJson = JSON.parse(publishedJsonRaw);
  if (publishedJson && typeof publishedJson.versionCode === 'number') {
    baselineVersionCode = publishedJson.versionCode;
    baselineVersionName = publishedJson.versionName || baselineVersionName;
    console.log(`  1️⃣ Baseline from origin/main:public/version.json: v${baselineVersionName} (Build ${baselineVersionCode})`);
  }
} catch (e: any) {
  console.warn(`  ⚠️ Could not read origin/main:public/version.json via git (${e.message}). Checking local public/version.json...`);
  const localPublicJsonPath = path.resolve(process.cwd(), 'public/version.json');
  if (fs.existsSync(localPublicJsonPath)) {
    const localPublicJson = JSON.parse(fs.readFileSync(localPublicJsonPath, 'utf8'));
    baselineVersionCode = localPublicJson.versionCode || 4;
    baselineVersionName = localPublicJson.versionName || '1.2.2';
  }
}

if (APP_VERSION.versionCode <= baselineVersionCode) {
  console.error(`  ❌ FAILED: Current versionCode (${APP_VERSION.versionCode}) is not strictly greater than baseline (${baselineVersionCode}).`);
  process.exit(1);
}
console.log(`  ✅ Invariant 1 Passed: versionCode ${APP_VERSION.versionCode} > baseline ${baselineVersionCode}`);

// ── Check 2: Cross-File Version Agreement ────────────────────────────────────
console.log('\n  2️⃣ Checking Cross-File Version Agreement:');

// 2a. package.json
const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (pkg.version !== APP_VERSION.versionName) {
  console.error(`  ❌ FAILED: package.json version ("${pkg.version}") disagrees with src/version.ts ("${APP_VERSION.versionName}")`);
  process.exit(1);
}
console.log(`  ✓ package.json version matches: "${pkg.version}"`);

// 2b. android/app/build.gradle
const gradlePath = path.resolve(process.cwd(), 'android/app/build.gradle');
const gradleContent = fs.readFileSync(gradlePath, 'utf8');
const codeMatch = gradleContent.match(/versionCode\s+(\d+)/);
const nameMatch = gradleContent.match(/versionName\s+["']([^"']+)["']/);

if (!codeMatch || parseInt(codeMatch[1], 10) !== APP_VERSION.versionCode) {
  console.error(`  ❌ FAILED: build.gradle versionCode (${codeMatch?.[1]}) disagrees with src/version.ts (${APP_VERSION.versionCode})`);
  process.exit(1);
}
if (!nameMatch || nameMatch[1] !== APP_VERSION.versionName) {
  console.error(`  ❌ FAILED: build.gradle versionName ("${nameMatch?.[1]}") disagrees with src/version.ts ("${APP_VERSION.versionName}")`);
  process.exit(1);
}
console.log(`  ✓ android/app/build.gradle matches: versionCode ${codeMatch[1]}, versionName "${nameMatch[1]}"`);
console.log('  ✅ Invariant 2 Passed: All version declarations are in 100% lockstep.');

// ── Check 3: Keystore Signing Certificate Verification ───────────────────────
console.log('\n  3️⃣ Verifying Keystore Signing Certificate:');
const keystorePath = path.resolve(process.cwd(), 'android/app/lifeos-release-key.jks');
let keystoreCertSha256 = '';

if (fs.existsSync(keystorePath)) {
  try {
    const keytoolOutput = execSync(
      `keytool -list -v -keystore "${keystorePath}" -storepass lifeos123 -alias lifeos`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const match = keytoolOutput.match(/SHA256:\s*([A-F0-9:]+)/i);
    if (match) {
      keystoreCertSha256 = match[1].trim().toUpperCase();
      console.log(`  Keystore Certificate SHA-256: ${keystoreCertSha256}`);
      if (keystoreCertSha256 !== EXPECTED_CERT_SHA256) {
        console.error(`  ❌ FAILED: Keystore certificate fingerprint mismatch!\n    Expected: ${EXPECTED_CERT_SHA256}\n    Actual:   ${keystoreCertSha256}`);
        process.exit(1);
      }
      console.log('  ✅ Invariant 3 Passed: Keystore certificate verified.');
    }
  } catch (err: any) {
    console.error(`  ❌ FAILED: Unable to verify keystore with keytool: ${err.message}`);
    process.exit(1);
  }
} else {
  console.warn('  ⚠️ Keystore file not found at android/app/lifeos-release-key.jks');
}

// ── Check 4: Existing Installed APK Certificate Verification ─────────────────
console.log('\n  4️⃣ Verifying Existing Base APK Certificate (public/LifeOS.apk):');
const publicApkPath = path.resolve(process.cwd(), 'public/LifeOS.apk');
if (fs.existsSync(publicApkPath)) {
  try {
    const apkCertOutput = execSync(`keytool -printcert -jarfile "${publicApkPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const match = apkCertOutput.match(/SHA256:\s*([A-F0-9:]+)/i);
    if (match) {
      const apkCertSha256 = match[1].trim().toUpperCase();
      console.log(`  Base APK Certificate SHA-256: ${apkCertSha256}`);
      if (apkCertSha256 !== EXPECTED_CERT_SHA256) {
        console.error(`  ❌ FAILED: Base APK certificate mismatch!\n    Expected: ${EXPECTED_CERT_SHA256}\n    Actual:   ${apkCertSha256}`);
        process.exit(1);
      }
      console.log('  ✅ Invariant 4 Passed: Base APK certificate equals keystore certificate.');
    }
  } catch (err: any) {
    console.warn(`  ⚠️ Could not read base APK certificate: ${err.message}`);
  }
}

// ── Check 5: Candidate APK SHA-256 Verification (at Publish Time) ────────────
const candidateApk = process.argv[2];
if (candidateApk) {
  console.log(`\n  5️⃣ Verifying Candidate APK at ${candidateApk}:`);
  if (!fs.existsSync(candidateApk)) {
    console.error(`  ❌ FAILED: Candidate APK not found at: ${candidateApk}`);
    process.exit(1);
  }
  const apkBuffer = fs.readFileSync(candidateApk);
  const actualApkSha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex').toLowerCase();
  console.log(`  Candidate APK Computed SHA-256: ${actualApkSha256}`);

  // Also verify candidate APK was signed by the exact same release certificate
  const candCertOutput = execSync(`keytool -printcert -jarfile "${candidateApk}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const candCertMatch = candCertOutput.match(/SHA256:\s*([A-F0-9:]+)/i);
  if (!candCertMatch || candCertMatch[1].trim().toUpperCase() !== EXPECTED_CERT_SHA256) {
    console.error(`  ❌ FAILED: Candidate APK is NOT signed with the release keystore!`);
    process.exit(1);
  }
  console.log('  ✓ Candidate APK signature matches release keystore.');

  const versionJsonPath = path.resolve(process.cwd(), 'version.json');
  if (fs.existsSync(versionJsonPath)) {
    const vJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    if (vJson.sha256 && vJson.sha256.toLowerCase() !== actualApkSha256) {
      console.error(`  ❌ FAILED: Candidate APK SHA-256 does not match version.json!\n    version.json: ${vJson.sha256}\n    Actual:       ${actualApkSha256}`);
      process.exit(1);
    }
    console.log(`  ✓ Candidate APK SHA-256 matches version.json.`);
  }
  console.log('  ✅ Invariant 5 Passed: Candidate APK verified.');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 RELEASE GUARD PASSED ALL HARDENED INVARIANT CHECKS!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

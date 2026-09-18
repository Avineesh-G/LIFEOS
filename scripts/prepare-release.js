#!/usr/bin/env node

/**
 * LifeOS Release Preparation Script
 * 
 * Synchronizes the APK release workflow:
 * 1. Locates compiled release APK or public/LifeOS.apk
 * 2. Computes the SHA-256 integrity checksum
 * 3. Updates public/version.json with the exact SHA-256 and Vercel static URL
 * 4. Verifies release asset readiness for both Vercel & GitHub Releases
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CANDIDATE_APKS = [
  path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
  path.join(rootDir, 'public', 'LifeOS.apk'),
  path.join(rootDir, 'LifeOS.apk')
];

const targetPublicApk = path.join(rootDir, 'public', 'LifeOS.apk');
const versionJsonPath = path.join(rootDir, 'public', 'version.json');

console.log('📦 [LifeOS Release] Preparing release manifest and checksums...\n');

// 1. Locate newest release APK
let sourceApk = null;
for (const apkPath of CANDIDATE_APKS) {
  if (fs.existsSync(apkPath)) {
    sourceApk = apkPath;
    break;
  }
}

if (!sourceApk) {
  console.error('❌ No APK found. Build one first using `npm run cap:build` or place LifeOS.apk in public/');
  process.exit(1);
}

console.log(`🔍 Using APK source: ${sourceApk}`);

// Copy to public/LifeOS.apk if source is from gradle output
if (sourceApk !== targetPublicApk) {
  fs.copyFileSync(sourceApk, targetPublicApk);
  console.log(`✅ Copied APK to ${targetPublicApk} for Vercel static hosting.`);
}

// 2. Compute SHA-256
const fileBuffer = fs.readFileSync(targetPublicApk);
const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

console.log(`🔐 Computed SHA-256: ${sha256Hash}`);
console.log(`📏 File Size: ${fileSizeMB} MB (${fileBuffer.length.toLocaleString()} bytes)`);

// 3. Update public/version.json
if (!fs.existsSync(versionJsonPath)) {
  console.error(`❌ Missing ${versionJsonPath}`);
  process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
versionData.sha256 = sha256Hash;
versionData.apkUrl = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk';

fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n');
console.log(`✅ Updated ${versionJsonPath} successfully.\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 LifeOS Release v${versionData.versionName} (Build ${versionData.versionCode}) Ready!`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Dual-Hosting Distribution Steps:');
console.log('1. Vercel Static Hosting (Primary):');
console.log('   - Deploy changes (`git push` triggers Vercel)');
console.log('   - Live URL: https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk');
console.log('\n2. GitHub Release Asset (Fallback):');
console.log(`   - Create tag & release matching v${versionData.versionName}:`);
console.log(`     gh release create v${versionData.versionName} public/LifeOS.apk --title "LifeOS v${versionData.versionName}" --notes "${versionData.releaseNotes}"`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

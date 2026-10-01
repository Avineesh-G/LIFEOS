import fs from 'fs';
import path from 'path';
import { APP_GUIDE_DATA } from '../src/ai/appGuide.ts';

console.log('🔍 Verifying App Guide completeness against application routes and destinations...');

const errors: string[] = [];

// Read hubDestinations.ts content
const hubDestPath = path.resolve('src/config/hubDestinations.ts');
const fileContent = fs.readFileSync(hubDestPath, 'utf8');

// Regex to extract destination id and route pairs
const destRegex = /id:\s*'([^']+)',[\s\S]*?route:\s*'([^']+)'/g;
let match: RegExpExecArray | null;

const foundDestinations: { id: string; route: string }[] = [];
while ((match = destRegex.exec(fileContent)) !== null) {
  foundDestinations.push({ id: match[1], route: match[2] });
}

if (!APP_GUIDE_DATA['home']) {
  errors.push('Missing appGuide entry for home');
}

foundDestinations.forEach(dest => {
  const entry = APP_GUIDE_DATA[dest.id];
  if (!entry) {
    errors.push(`Missing appGuide entry for destination id "${dest.id}"`);
  } else if (!entry.routes.includes(dest.route)) {
    errors.push(`appGuide entry for "${dest.id}" does not include route "${dest.route}"`);
  }
});

// Verify extra sub-interfaces
const extraRequiredRoutes = ['/settings/interface-colors'];
extraRequiredRoutes.forEach(route => {
  const found = Object.values(APP_GUIDE_DATA).some(g => g.routes.includes(route));
  if (!found) {
    errors.push(`Missing appGuide entry covering route "${route}"`);
  }
});

if (errors.length > 0) {
  console.error('❌ App Guide Verification FAILED with errors:');
  errors.forEach(err => console.error(` - ${err}`));
  process.exit(1);
} else {
  console.log(`✅ App Guide Verification PASSED! All ${foundDestinations.length + 1} application destinations are documented in appGuide.ts.`);
  process.exit(0);
}

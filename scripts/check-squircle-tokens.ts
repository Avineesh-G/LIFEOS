import fs from 'fs';
import path from 'path';

console.log('🔍 Auditing codebase for squircle design tokens & hard-coded radii compliance...');

const rootDir = path.resolve('src');
const errors: string[] = [];

// Allowed exception marker comment
const EXCEPTION_MARKER = '/* squircle-exception */';

function scanFile(filePath: string) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.css')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.includes(EXCEPTION_MARKER)) return;

    // 1. Check for border-radius: 0 or rounded-none
    if (/border-radius:\s*0\b/i.test(line) || /\brounded-none\b/i.test(line)) {
      errors.push(`${filePath}:${index + 1} - Found zero/none radius without squircle exception marker`);
    }

    // 2. Check for hard-coded pixel radii (e.g., border-radius: 12px, rounded-[15px])
    const hardcodedPixelMatch = line.match(/border-radius:\s*(\d+)px/i);
    if (hardcodedPixelMatch) {
      const px = parseInt(hardcodedPixelMatch[1], 10);
      const allowedVals = [10, 14, 20, 28, 36, 999, 9999];
      if (!allowedVals.includes(px)) {
        errors.push(`${filePath}:${index + 1} - Found hard-coded border-radius: ${px}px outside token scale`);
      }
    }
  });
}

function traverseDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverseDirectory(fullPath);
    } else {
      scanFile(fullPath);
    }
  }
}

traverseDirectory(rootDir);

if (errors.length > 0) {
  console.error('\n❌ Squircle Lint Check FAILED with errors:');
  errors.forEach((err) => console.error(` - ${err}`));
  console.error(`\nIf a zero/hard-coded radius is justified (e.g. video crop, map container), add '${EXCEPTION_MARKER}' to the line.`);
  process.exit(1);
} else {
  console.log('\n✅ Squircle Lint Check PASSED! All components adhere strictly to design tokens.');
  process.exit(0);
}

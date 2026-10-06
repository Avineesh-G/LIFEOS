import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

// Allowed patterns: --sep, divide-y, divide-white/[0.06], specular-rim border-box masks, 1px transparent for mask
const DISALLOWED_BORDER_PATTERNS = [
  /\bborder-(white|gray|slate|neutral|zinc|stone|red|blue|green|orange|yellow|amber|rose|purple|indigo|cyan|teal|emerald|fuchsia|pink)\b/i,
  /\bborder-(1|2|3|4|8)\b/,
  /\bborder\s+(?!none|transparent)/,
  /\bring-(white|gray|slate|neutral|1|2|3|4)\b/i,
];

let errorCount = 0;

function checkLine(fileRel: string, lineNum: number, line: string) {
  // Allow comments or allowed system files
  if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
  if (fileRel.includes('glassStyles.css') || fileRel.includes('specular-rim')) return;

  for (const pattern of DISALLOWED_BORDER_PATTERNS) {
    if (pattern.test(line)) {
      // Check if it's explicitly border-none or border: none
      if (/border-none|border:\s*none|border-transparent|border:\s*1px\s+solid\s+transparent/i.test(line)) {
        continue;
      }
      console.error(`[Border Lint] Found disallowed border utility in ${fileRel}:${lineNum} -> "${line.trim()}"`);
      errorCount++;
    }
  }
}

function scan(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (/\.(tsx|jsx|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const fileRel = path.relative(process.cwd(), fullPath);
      lines.forEach((line, idx) => checkLine(fileRel, idx + 1, line));
    }
  }
}

console.log('Running Border lint check across src/...');
scan(path.join(SRC_DIR, 'ui'));
scan(path.join(SRC_DIR, 'pages'));

if (errorCount > 0) {
  console.warn(`\n[Border Lint] Found ${errorCount} warning(s). Removing borders preserves Liquid Glass v2 fidelity.`);
} else {
  console.log('[Border Lint] Check passed: Zero hardcoded border outlines found in src/ui and src/pages.');
}

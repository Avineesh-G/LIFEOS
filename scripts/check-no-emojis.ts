import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

let hasEmoji = false;

function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx?|jsx?|css|json|md)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (EMOJI_REGEX.test(line)) {
          // Check if line contains emoji
          const match = line.match(EMOJI_REGEX);
          if (match) {
            console.error(`[Emoji Lint] Found emoji "${match[0]}" in ${path.relative(process.cwd(), fullPath)}:${i + 1}`);
            hasEmoji = true;
          }
        }
      }
    }
  }
}

console.log('Running Emoji lint check across src/...');
scanDir(SRC_DIR);

if (hasEmoji) {
  console.error('\nError: Unicode emojis found in src/. LifeOS design language mandates Phosphor icons only.');
  process.exit(1);
} else {
  console.log('Emoji lint check passed: Zero emojis found in src/.');
}

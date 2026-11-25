#!/usr/bin/env node

/**
 * LifeOS Widget Phase Colors Generator
 * 
 * Single source of truth: Reads `PIXEL_SKY_PALETTES` from `src/utils/pixelSkyPalettes.ts`
 * and exports Android color resources to `android/app/src/main/res/values/widget_phase_colors.xml`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetXmlPath = path.join(
  rootDir,
  'android',
  'app',
  'src',
  'main',
  'res',
  'values',
  'widget_phase_colors.xml'
);

function toAndroidHexColor(color) {
  if (typeof color !== 'string') return '#FFFFFF';
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) return trimmed;
  const match = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (!match) return trimmed;
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(Number(n))))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  const r = toHex(match[1]);
  const g = toHex(match[2]);
  const b = toHex(match[3]);
  if (match[4] !== undefined) {
    const a = toHex(Number(match[4]) * 255);
    return `#${a}${r}${g}${b}`;
  }
  return `#${r}${g}${b}`;
}

async function generate() {
  console.log('🎨 [LifeOS Widget] Generating native widget phase colors from phaseSeedColors.ts...');

  const { getM3ThemeForPhase } = await import('../src/theme/phaseSeedColors.ts');
  const phases = ['dawn', 'morning', 'afternoon', 'dusk', 'evening', 'night'];

  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<!-- Generated automatically from src/theme/phaseSeedColors.ts (Material 3). Do NOT edit directly. -->\n';
  xml += '<resources>\n';

  for (const phase of phases) {
    const isDark = phase === 'night';
    const m3Theme = getM3ThemeForPhase(phase, isDark);
    const { scheme } = m3Theme;

    xml += `    <!-- ${phase.toUpperCase()} PHASE (M3 Seed: ${m3Theme.seedHex}) -->\n`;
    xml += `    <color name="${phase}_card_surface">${toAndroidHexColor(scheme.surfaceContainerLow)}</color>\n`;
    xml += `    <color name="${phase}_card_border">${toAndroidHexColor(scheme.outlineVariant)}</color>\n`;
    xml += `    <color name="${phase}_text_primary">${toAndroidHexColor(scheme.onSurface)}</color>\n`;
    xml += `    <color name="${phase}_text_secondary">${toAndroidHexColor(scheme.onSurfaceVariant)}</color>\n`;
    xml += `    <color name="${phase}_text_muted">${toAndroidHexColor(scheme.outline)}</color>\n`;
    xml += `    <color name="${phase}_accent">${toAndroidHexColor(scheme.primary)}</color>\n`;
    xml += `    <color name="${phase}_accent_contrast">${toAndroidHexColor(scheme.onPrimary)}</color>\n\n`;
  }

  xml += '</resources>\n';

  const dir = path.dirname(targetXmlPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetXmlPath, xml, 'utf8');
  console.log(`✅ [LifeOS Widget] Successfully generated: ${targetXmlPath}\n`);
}

generate().catch(err => {
  console.error('❌ Failed to generate widget colors:', err);
  process.exit(1);
});

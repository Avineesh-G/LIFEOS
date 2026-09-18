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

async function generate() {
  console.log('🎨 [LifeOS Widget] Generating native widget phase colors from pixelSkyPalettes.ts...');

  const { PIXEL_SKY_PALETTES } = await import('../src/utils/pixelSkyPalettes.ts');
  const phases = ['dawn', 'morning', 'afternoon', 'dusk', 'evening', 'night'];

  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<!-- Generated automatically from src/utils/pixelSkyPalettes.ts. Do NOT edit directly. -->\n';
  xml += '<resources>\n';

  for (const phase of phases) {
    const config = PIXEL_SKY_PALETTES[phase];
    if (!config || !config.ui) {
      console.warn(`⚠️ Warning: Missing config for phase: ${phase}`);
      continue;
    }

    const { ui } = config;
    xml += `    <!-- ${phase.toUpperCase()} PHASE -->\n`;
    xml += `    <color name="${phase}_card_surface">${ui.cardSurface}</color>\n`;
    xml += `    <color name="${phase}_card_border">${ui.cardBorder}</color>\n`;
    xml += `    <color name="${phase}_text_primary">${ui.textPrimary}</color>\n`;
    xml += `    <color name="${phase}_text_secondary">${ui.textSecondary}</color>\n`;
    xml += `    <color name="${phase}_text_muted">${ui.textMuted}</color>\n`;
    xml += `    <color name="${phase}_accent">${ui.accent}</color>\n`;
    xml += `    <color name="${phase}_accent_contrast">${ui.accentContrast}</color>\n\n`;
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

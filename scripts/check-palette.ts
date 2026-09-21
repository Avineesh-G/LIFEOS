/**
 * LifeOS — Automated Palette Perceptual Distance & Contrast Checker
 * 
 * Runs in CI and via `npm run check:palette`.
 * Enforces the 8 strict perceptual and contrast rules from the LifeOS palette spec.
 */

import { PALETTE, deltaE, getContrast, MORE_BUTTON_TOKENS, type PaletteEntry } from '../src/theme/palette.ts';

const CANVAS_LIGHT = '#FDFDFD';
const CANVAS_DARK = '#121316';

function runPaletteCheck() {
  console.log('🎨 Starting LifeOS Palette Perceptual Distance & Contrast Guard...\n');

  let hasError = false;
  const entries = Object.values(PALETTE);

  // ── 1. Seeds ΔE ≥ 13.0 ──
  console.log('1️⃣ Checking Seed Perceptual Distances (Rule 1: ΔE ≥ 13.0)...');
  let minSeedDE = Infinity;
  let minSeedPair = '';
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const de = deltaE(entries[i].seed, entries[j].seed);
      if (de < minSeedDE) {
        minSeedDE = de;
        minSeedPair = `${entries[i].name} vs ${entries[j].name}`;
      }
      if (de < 13.0) {
        console.error(`❌ VIOLATION: Seed pair too close (< 13.0): ${entries[i].name} and ${entries[j].name} have ΔE = ${de.toFixed(2)}`);
        hasError = true;
      }
    }
  }
  console.log(`   ✅ Min Seed ΔE: ${minSeedDE.toFixed(1)} (${minSeedPair})`);

  // ── 2. Dark Strong Fills ΔE ≥ 10.0 ──
  console.log('2️⃣ Checking Dark Strong Fill Distances (Rule 2: ΔE ≥ 10.0)...');
  let minDarkStrongDE = Infinity;
  let minDarkStrongPair = '';
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const de = deltaE(entries[i].darkStrong, entries[j].darkStrong);
      if (de < minDarkStrongDE) {
        minDarkStrongDE = de;
        minDarkStrongPair = `${entries[i].name} vs ${entries[j].name}`;
      }
      if (de < 10.0) {
        console.error(`❌ VIOLATION: Dark Strong pair too close (< 10.0): ${entries[i].name} and ${entries[j].name} have ΔE = ${de.toFixed(2)}`);
        hasError = true;
      }
    }
  }
  console.log(`   ✅ Min Dark Strong ΔE: ${minDarkStrongDE.toFixed(1)} (${minDarkStrongPair})`);

  // ── 3. Dark Tints ΔE ≥ 7.5 ──
  console.log('3️⃣ Checking Dark Tint Distances (Rule 3: ΔE ≥ 7.5)...');
  let minDarkTintDE = Infinity;
  let minDarkTintPair = '';
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const de = deltaE(entries[i].darkTint, entries[j].darkTint);
      if (de < minDarkTintDE) {
        minDarkTintDE = de;
        minDarkTintPair = `${entries[i].name} vs ${entries[j].name}`;
      }
      if (de < 7.5) {
        console.error(`❌ VIOLATION: Dark Tint pair too close (< 7.5): ${entries[i].name} and ${entries[j].name} have ΔE = ${de.toFixed(2)}`);
        hasError = true;
      }
    }
  }
  console.log(`   ✅ Min Dark Tint ΔE: ${minDarkTintDE.toFixed(1)} (${minDarkTintPair})`);

  // ── 4. On-Accent Text Contrast ≥ 4.5:1 ──
  console.log('4️⃣ Checking On-Accent Text Contrast (Rule 4: ≥ 4.5:1 on Seed & Dark Strong)...');
  for (const entry of entries) {
    const cSeed = getContrast(entry.onAccent, entry.seed);
    const cDark = getContrast(entry.onAccent, entry.darkStrong);
    if (cSeed < 4.5) {
      console.error(`❌ VIOLATION: On-accent text on seed fails contrast: ${entry.name} (${cSeed.toFixed(2)}:1)`);
      hasError = true;
    }
    if (cDark < 4.5) {
      console.error(`❌ VIOLATION: On-accent text on dark strong fails contrast: ${entry.name} (${cDark.toFixed(2)}:1)`);
      hasError = true;
    }
  }
  console.log('   ✅ All on-accent text pairings ≥ 4.5:1');

  // ── 5. Light Text Accent Contrast on Canvas ≥ 4.5:1 ──
  console.log('5️⃣ Checking Text Accent Contrast on Light Canvas #FDFDFD (Rule 5: ≥ 4.5:1)...');
  for (const entry of entries) {
    const cText = getContrast(entry.textAccent, CANVAS_LIGHT);
    if (cText < 4.5) {
      console.error(`❌ VIOLATION: Text accent fails contrast on #FDFDFD: ${entry.name} (${cText.toFixed(2)}:1)`);
      hasError = true;
    }
  }
  console.log('   ✅ All text accents on #FDFDFD ≥ 4.5:1');

  // ── 6. Dark Tint Contrast ≥ 4.5:1 and Dark Strong Contrast ≥ 3.0:1 on #121316 ──
  console.log('6️⃣ Checking Dark Tint (≥ 4.5:1) & Dark Strong (≥ 3.0:1) on Canvas #121316 (Rule 6)...');
  for (const entry of entries) {
    const cTint = getContrast(entry.darkTint, CANVAS_DARK);
    const cStrong = getContrast(entry.darkStrong, CANVAS_DARK);
    if (cTint < 4.5) {
      console.error(`❌ VIOLATION: Dark tint fails contrast on #121316: ${entry.name} (${cTint.toFixed(2)}:1)`);
      hasError = true;
    }
    if (cStrong < 3.0) {
      console.error(`❌ VIOLATION: Dark strong fails contrast on #121316: ${entry.name} (${cStrong.toFixed(2)}:1)`);
      hasError = true;
    }
  }
  console.log('   ✅ All dark tints ≥ 4.5:1 and dark strong fills ≥ 3.0:1 on #121316');

  // ── 7. Role Hex Uniqueness (Rule 7) ──
  console.log('7️⃣ Checking Role Uniqueness across Interfaces (Rule 7)...');
  const seeds = entries.map(e => e.seed.toUpperCase());
  if (new Set(seeds).size !== seeds.length) {
    console.error('❌ VIOLATION: Duplicate seed hex found!');
    hasError = true;
  }
  const darkStrongs = entries.map(e => e.darkStrong.toUpperCase());
  if (new Set(darkStrongs).size !== darkStrongs.length) {
    console.error('❌ VIOLATION: Duplicate dark strong hex found!');
    hasError = true;
  }
  const darkTints = entries.map(e => e.darkTint.toUpperCase());
  if (new Set(darkTints).size !== darkTints.length) {
    console.error('❌ VIOLATION: Duplicate dark tint hex found!');
    hasError = true;
  }
  const textAccents = entries.map(e => e.textAccent.toUpperCase());
  if (new Set(textAccents).size !== textAccents.length) {
    console.error('❌ VIOLATION: Duplicate text accent hex found!');
    hasError = true;
  }
  console.log('   ✅ All role values are unique across all interfaces');

  // ── 8. More Button Fixed Tokens Verification (Rule 8) ──
  console.log('8️⃣ Checking More Button Fixed Tokens (Rule 8: icon ≥ 4.5:1, fill ≥ 3.0:1, seed ΔE ≥ 13.0)...');
  
  // Light mode check
  const lightIconContrast = getContrast(MORE_BUTTON_TOKENS.light.icon, MORE_BUTTON_TOKENS.light.fill);
  const lightFillCanvasContrast = getContrast(MORE_BUTTON_TOKENS.light.fill, CANVAS_LIGHT);
  if (lightIconContrast < 4.5) {
    console.error(`❌ VIOLATION: More button light icon contrast fails (< 4.5:1): ${lightIconContrast.toFixed(2)}:1`);
    hasError = true;
  }
  if (lightFillCanvasContrast < 3.0) {
    console.error(`❌ VIOLATION: More button light fill canvas contrast fails (< 3.0:1): ${lightFillCanvasContrast.toFixed(2)}:1`);
    hasError = true;
  }

  let minLightDE = Infinity;
  let minLightSeedName = '';
  for (const entry of entries) {
    const de = deltaE(MORE_BUTTON_TOKENS.light.fill, entry.seed);
    if (de < minLightDE) {
      minLightDE = de;
      minLightSeedName = entry.name;
    }
    if (de < 13.0) {
      console.error(`❌ VIOLATION: More button light fill too close to ${entry.name} (< 13.0): ΔE = ${de.toFixed(2)}`);
      hasError = true;
    }
  }

  // Dark mode check
  const darkIconContrast = getContrast(MORE_BUTTON_TOKENS.dark.icon, MORE_BUTTON_TOKENS.dark.fill);
  const darkFillCanvasContrast = getContrast(MORE_BUTTON_TOKENS.dark.fill, CANVAS_DARK);
  if (darkIconContrast < 4.5) {
    console.error(`❌ VIOLATION: More button dark icon contrast fails (< 4.5:1): ${darkIconContrast.toFixed(2)}:1`);
    hasError = true;
  }
  if (darkFillCanvasContrast < 3.0) {
    console.error(`❌ VIOLATION: More button dark fill canvas contrast fails (< 3.0:1): ${darkFillCanvasContrast.toFixed(2)}:1`);
    hasError = true;
  }

  let minDarkDE = Infinity;
  let minDarkSeedName = '';
  for (const entry of entries) {
    const de = deltaE(MORE_BUTTON_TOKENS.dark.fill, entry.seed);
    if (de < minDarkDE) {
      minDarkDE = de;
      minDarkSeedName = entry.name;
    }
    if (de < 13.0) {
      console.error(`❌ VIOLATION: More button dark fill too close to ${entry.name} (< 13.0): ΔE = ${de.toFixed(2)}`);
      hasError = true;
    }
  }

  console.log(`   ✅ Light More fill: icon contrast ${lightIconContrast.toFixed(1)}:1, canvas contrast ${lightFillCanvasContrast.toFixed(1)}:1, min seed ΔE ${minLightDE.toFixed(1)} (${minLightSeedName})`);
  console.log(`   ✅ Dark More fill: icon contrast ${darkIconContrast.toFixed(1)}:1, canvas contrast ${darkFillCanvasContrast.toFixed(1)}:1, min seed ΔE ${minDarkDE.toFixed(1)} (${minDarkSeedName})`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (hasError) {
    console.error('❌ PALETTE CHECK FAILED! Please fix the color violations above.');
    process.exit(1);
  } else {
    console.log('🎉 ALL 8 PALETTE RULES PASSED! Distinct color architecture verified.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

runPaletteCheck();

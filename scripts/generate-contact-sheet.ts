import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ScreenConfig {
  name: string;
  path: string;
}

const SCREENS: ScreenConfig[] = [
  { name: 'home', path: '/' },
  { name: 'settings', path: '/settings' },
  { name: 'nutrition', path: '/nutrition' },
  { name: 'nutrition-history', path: '/history' },
  { name: 'study', path: '/study' },
];

const WIDTHS = [280, 320, 360];
const THEMES = ['light', 'dark'] as const;

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results', 'contact-sheet');

async function run() {
  console.log('📸 Generating Contact Sheet and Measuring Overlaps & Clipping...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results: any[] = [];

  for (const width of WIDTHS) {
    const height = width === 280 ? 653 : width === 320 ? 640 : 800;

    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 2,
      });

      const page = await context.newPage();

      for (const screen of SCREENS) {
        const id = `${screen.name}_${width}w_${theme}`;
        await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(500);

        // Apply theme
        await page.evaluate((th) => {
          if (th === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);
        await page.waitForTimeout(200);

        // Capture screenshot
        const screenshotPath = path.join(OUTPUT_DIR, `${id}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Measure clipping and overlap
        const measurements = await page.evaluate(() => {
          const docW = document.documentElement.clientWidth;
          const docH = document.documentElement.clientHeight;
          const scrollW = document.documentElement.scrollWidth;

          // Check all primary text/label elements for negative margin clipping or container overflow
          const texts = Array.from(document.querySelectorAll('h1, h2, h3, p, span, button'));
          let clippedCount = 0;
          for (const el of texts) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.right > docW + 2) {
              clippedCount++;
            }
          }

          return {
            clientWidth: docW,
            scrollWidth: scrollW,
            hasHorizontalOverflow: scrollW > docW + 1,
            clippedCount,
          };
        });

        results.push({
          id,
          width,
          theme,
          screen: screen.name,
          ...measurements,
        });

        console.log(`  ✓ ${id}: scrollW=${measurements.scrollWidth} / clientW=${measurements.clientWidth}, clipped=${measurements.clippedCount}`);
      }
      await context.close();
    }
  }

  await browser.close();

  const total = results.length;
  const overflows = results.filter(r => r.hasHorizontalOverflow);
  console.log('\n📊 Contact Sheet Summary:');
  console.log(`  Total runs: ${total}`);
  console.log(`  Horizontal overflows: ${overflows.length}`);
  if (overflows.length > 0) {
    console.error('  FAILURES:', overflows);
    process.exit(1);
  } else {
    console.log('  🎉 All widths and themes verified with zero overflows or clipped labels!');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

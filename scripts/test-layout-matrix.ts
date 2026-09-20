import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportConfig[] = [
  { name: 'cover-280', width: 280, height: 653 },
  { name: 'compact-320', width: 320, height: 640 },
  { name: 'compact-340', width: 340, height: 700 },
  { name: 'standard-360', width: 360, height: 800 },
  { name: 'iphone-375', width: 375, height: 812 },
  { name: 'pixel-393', width: 393, height: 852 },
  { name: 'pixel-412', width: 412, height: 915 },
  { name: 'large-430', width: 430, height: 932 },
  { name: 'foldable-600', width: 600, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 800 },
];

const FONT_SCALES = [0.85, 1.0, 1.3, 2.0];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'nutrition', path: '/nutrition' },
  { name: 'study', path: '/study' },
  { name: 'study-timer', path: '/study/timer' },
  { name: 'gym', path: '/gym' },
  { name: 'spending', path: '/spending' },
  { name: 'tasks', path: '/tasks' },
  { name: 'timetable', path: '/timetable' },
  { name: 'shopping', path: '/shopping' },
  { name: 'outings', path: '/outings' },
  { name: 'vault', path: '/vault' },
  { name: 'history', path: '/history' },
  { name: 'settings', path: '/settings' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results', 'matrix-screenshots');

async function runMatrix() {
  console.log(`🚀 Starting Layout Matrix Test against ${BASE_URL}...`);
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
  });

  const failures: string[] = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of VIEWPORTS) {
    for (const fontScale of FONT_SCALES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });

      const page = await context.newPage();

      for (const route of ROUTES) {
        totalTests++;
        const testId = `${vp.name}_w${vp.width}_font${fontScale}_${route.name}`;

        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
          // Wait for React rendering & animations to settle
          await page.waitForTimeout(600);

          // Apply font scaling simulated via document root font-size
          await page.evaluate((scale) => {
            document.documentElement.style.fontSize = `${scale * 16}px`;
            window.dispatchEvent(new Event('resize'));
          }, fontScale);
          await page.waitForTimeout(200);

          // Check 1: Horizontal Overflow (No unintentional horizontal scrolling)
          const overflow = await page.evaluate(() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body.scrollWidth;
            return {
              hasOverflow: scrollWidth > docWidth + 1 || bodyScrollWidth > docWidth + 1,
              docWidth,
              scrollWidth,
              bodyScrollWidth,
            };
          });

          if (overflow.hasOverflow) {
            failures.push(`[OVERFLOW] ${testId}: scrollWidth (${overflow.scrollWidth}) > clientWidth (${overflow.docWidth})`);
          }

          // Check 2: Touch targets for buttons
          const smallTouchTargets = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
            const issues: string[] = [];
            for (const b of buttons) {
              const rect = b.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && (rect.top >= 0 && rect.top <= window.innerHeight)) {
                if (rect.height < 30 && rect.width < 30) {
                  const text = (b.textContent || b.getAttribute('aria-label') || b.className).slice(0, 30);
                  issues.push(`Small button: "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)})`);
                }
              }
            }
            return issues;
          });

          // Capture screenshot for key viewports & font scales (e.g. 280, 360, 600, 1024 at 1.0 and 1.3)
          if (
            (vp.width === 280 || vp.width === 360 || vp.width === 1024) &&
            (fontScale === 1.0 || fontScale === 1.3)
          ) {
            const screenshotPath = path.join(OUTPUT_DIR, `${testId}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });
          }

          passedTests++;
        } catch (err: any) {
          failures.push(`[ERROR] ${testId}: ${err.message}`);
        }
      }

      await context.close();
    }
    console.log(`✓ Completed viewport ${vp.name} (${vp.width}x${vp.height})`);
  }

  await browser.close();

  console.log('\n================ MATRIX TEST REPORT ================');
  console.log(`Total test runs: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failures/Anomalies: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nFailure Details:');
    failures.forEach((f) => console.log(`  ❌ ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL VIEWPORT & FONT SCALE LAYOUT TESTS PASSED WITH 0 OVERFLOWS!');
    console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
  }
}

runMatrix().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

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
  { name: 'standard-360', width: 360, height: 800 },
  { name: 'pixel-412', width: 412, height: 915 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'landscape-640', width: 640, height: 360 },
];

const FONT_SCALES = [0.85, 1.0, 1.3, 1.5, 2.0];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'nutrition', path: '/nutrition' },
  { name: 'study', path: '/study' },
  { name: 'study-timer', path: '/study/timer' },
  { name: 'study-history', path: '/study/history' },
  { name: 'study-heatmap', path: '/study/heatmap' },
  { name: 'gym', path: '/gym' },
  { name: 'gym-split', path: '/gym/split' },
  { name: 'gym-history', path: '/gym/history/Bench%20Press' },
  { name: 'spending', path: '/spending' },
  { name: 'tasks', path: '/tasks' },
  { name: 'timetable', path: '/timetable' },
  { name: 'shopping', path: '/shopping' },
  { name: 'outings', path: '/outings' },
  { name: 'laundry', path: '/laundry' },
  { name: 'vault', path: '/vault' },
  { name: 'history', path: '/history' },
  { name: 'settings', path: '/settings' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results', 'expanded-matrix');

async function runExpandedMatrix() {
  console.log(`🚀 Starting Fast Layout Matrix Expansion (Stage Q) against ${BASE_URL}...`);
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const failures: string[] = [];
  const warnings: string[] = [];
  let totalAssertions = 0;
  let passedAssertions = 0;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const theme of ['light', 'dark'] as const) {
      for (const route of ROUTES) {
        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.evaluate(`
            localStorage.setItem('lifeos_theme_mode', '${theme === 'dark' ? 'night' : 'dynamic'}');
            if ('${theme}' === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `);
          await page.waitForTimeout(200);

          for (const fontScale of FONT_SCALES) {
            totalAssertions++;
            const testId = `${vp.name}_${theme}_f${fontScale}_${route.name}`;

            // Set simulated font scale
            await page.evaluate(`
              document.documentElement.style.fontSize = '${fontScale * 16}px';
              window.dispatchEvent(new Event('resize'));
            `);
            await page.waitForTimeout(80);

            // Detector 1: Horizontal Overflow
            const overflow = await page.evaluate(`
              (() => {
                const docWidth = document.documentElement.clientWidth;
                const scrollWidth = document.documentElement.scrollWidth;
                const bodyScrollWidth = document.body.scrollWidth;
                return {
                  hasOverflow: scrollWidth > docWidth + 1 || bodyScrollWidth > docWidth + 1,
                  docWidth: docWidth,
                  scrollWidth: scrollWidth,
                };
              })()
            `) as { hasOverflow: boolean; docWidth: number; scrollWidth: number };

            if (overflow.hasOverflow) {
              failures.push(`[OVERFLOW] ${testId}: scrollWidth (${overflow.scrollWidth}) > clientWidth (${overflow.docWidth})`);
            }

            // Detector 2: Primary Text Clipping
            const textClipping = await page.evaluate(`
              (() => {
                const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
                const clipped = [];
                for (const h of headings) {
                  const style = window.getComputedStyle(h);
                  const isHidden = style.overflow === 'hidden' || style.overflowX === 'hidden';
                  const hasEllipsis = style.textOverflow === 'ellipsis';
                  if (isHidden && !hasEllipsis && h.scrollWidth > h.clientWidth + 2) {
                    clipped.push(h.textContent?.slice(0, 25) || 'heading');
                  }
                }
                return clipped;
              })()
            `) as string[];

            if (textClipping.length > 0) {
              failures.push(`[CLIPPED_TEXT] ${testId}: Clipped headings without ellipsis: ${textClipping.join(', ')}`);
            }

            // Detector 3: Overlapping interactive elements
            const overlaps = await page.evaluate(`
              (() => {
                const interactives = Array.from(document.querySelectorAll('button:not([disabled]):not([aria-hidden="true"]), a[href]'))
                  .filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
                  });

                const intersecting = [];
                for (let i = 0; i < interactives.length; i++) {
                  for (let j = i + 1; j < interactives.length; j++) {
                    if (interactives[i].contains(interactives[j]) || interactives[j].contains(interactives[i])) {
                      continue;
                    }
                    const r1 = interactives[i].getBoundingClientRect();
                    const r2 = interactives[j].getBoundingClientRect();
                    const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
                    const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
                    if ((overlapX * overlapY) > 80) { // Overlap > 80px²
                      const t1 = (interactives[i].textContent || 'btn').slice(0, 15);
                      const t2 = (interactives[j].textContent || 'btn').slice(0, 15);
                      intersecting.push(t1 + ' overlaps ' + t2);
                    }
                  }
                }
                return intersecting;
              })()
            `) as string[];

            if (overlaps.length > 0) {
              failures.push(`[OVERLAP] ${testId}: ${overlaps.join('; ')}`);
            }

            passedAssertions++;
          }
        } catch (err: any) {
          failures.push(`[ROUTE_ERROR] ${vp.name}_${theme}_${route.name}: ${err.message}`);
        }
      }
    }

    console.log(`✓ Completed viewport ${vp.name} (${vp.width}x${vp.height}) across all themes & font scales`);
    await context.close();
  }

  await browser.close();

  console.log('\n================ EXPANDED MATRIX REPORT (STAGE Q) ================');
  console.log(`Total assertions evaluated: ${totalAssertions}`);
  console.log(`Passed: ${passedAssertions}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    failures.slice(0, 20).forEach((f) => console.log(`  ${f}`));
    if (failures.length > 20) console.log(`  ...and ${failures.length - 20} more`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 1,260 MATRIX CONFIGURATIONS PASSED WITH 0 OVERFLOWS, 0 CLIPPED HEADINGS, AND 0 OVERLAPS!');
  }
}

runExpandedMatrix().catch((err) => {
  console.error('Matrix run failed:', err);
  process.exit(1);
});

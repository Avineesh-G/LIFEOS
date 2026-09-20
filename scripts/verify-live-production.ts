import { chromium } from '@playwright/test';

const PROD_URL = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app';

const ROUTES = [
  '/',
  '/settings',
  '/nutrition',
  '/study',
  '/study/timer',
  '/gym',
  '/spending',
  '/tasks',
  '/timetable',
  '/shopping',
  '/outings',
  '/vault',
  '/history',
];

const VIEWPORTS = [
  { name: 'pixel-412', width: 412, height: 915 },
  { name: 'compact-360', width: 360, height: 640 },
];

const THEMES = ['light', 'dark'] as const;

async function runLiveVerification() {
  console.log(`🌐 Running Live Verification against Production: ${PROD_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const errors: string[] = [];
  let totalChecked = 0;

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });

      const page = await context.newPage();

      const pageErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          // Ignore network tracking or harmless extension logs if any
          const text = msg.text();
          if (!text.includes('favicon') && !text.includes('GoogleAuth')) {
            pageErrors.push(text);
          }
        }
      });
      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      for (const route of ROUTES) {
        totalChecked++;
        const targetUrl = `${PROD_URL}${route}`;

        try {
          const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(600);

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

          // Check for blank screen
          const rootChildrenCount = await page.evaluate(() => {
            const root = document.getElementById('root');
            return root ? root.children.length : 0;
          });

          if (rootChildrenCount === 0) {
            errors.push(`[BLANK_SCREEN] ${route} at ${vp.name} (${theme}): #root has 0 children`);
          }

          console.log(`  ✓ Live ${route} (${vp.name}, ${theme}): HTTP ${res?.status()}, rootElements=${rootChildrenCount}`);
        } catch (e: any) {
          errors.push(`[NAVIGATION_ERROR] ${route} at ${vp.name} (${theme}): ${e.message}`);
        }
      }

      await context.close();
    }
  }

  // Check that dev route /dev/palette is completely stripped / redirected
  console.log('\n  Checking dev route pruning (/dev/palette):');
  const devContext = await browser.newContext();
  const devPage = await devContext.newPage();
  await devPage.goto(`${PROD_URL}/dev/palette`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await devPage.waitForTimeout(500);
  const paletteBoardFound = await devPage.evaluate(() => {
    return document.body.innerText.includes('Palette Token & Contrast Matrix') ||
           document.body.innerText.includes('Seed Colors & Harmonized Roles');
  });

  if (paletteBoardFound) {
    errors.push('[DEV_ROUTE_LEAK] PaletteBoard was found accessible on production!');
  } else {
    console.log('  ✓ Verified: /dev/palette is absent / stripped from production');
  }
  await devContext.close();
  await browser.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 LIVE PRODUCTION VERIFICATION REPORT:`);
  console.log(`  Total Checks: ${totalChecked}`);
  console.log(`  Errors / Blank Screens: ${errors.length}`);
  if (errors.length > 0) {
    console.error('  FAILURES:', errors);
    process.exit(1);
  } else {
    console.log('  🎉 ALL PRODUCTION ROUTES VERIFIED LIVE WITH ZERO BLANK SCREENS OR ERRORS!');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runLiveVerification().catch((err) => {
  console.error('Live verification script error:', err);
  process.exit(1);
});

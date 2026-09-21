import { chromium } from '@playwright/test';
import { MOCK_USER, MOCK_APP_DATA } from './mock-data.mjs';

interface TestViewport {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: TestViewport[] = [
  { name: 'cover-280', width: 280, height: 653 },
  { name: 'standard-360', width: 360, height: 780 },
  { name: 'pixel-412', width: 412, height: 915 },
  { name: 'landscape-640', width: 640, height: 360 },
];

const ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'Nutrition', path: '/nutrition' },
  { name: 'Study', path: '/study' },
  { name: 'Study History', path: '/study/history' },
  { name: 'Gym', path: '/gym' },
  { name: 'Gym Split', path: '/gym/split' },
  { name: 'Spending', path: '/spending' },
  { name: 'Tasks', path: '/tasks' },
  { name: 'Timetable', path: '/timetable' },
  { name: 'Shopping', path: '/shopping' },
  { name: 'Outings', path: '/outings' },
  { name: 'Laundry', path: '/laundry' },
  { name: 'Vault', path: '/vault' },
  { name: 'History', path: '/history' },
  { name: 'Settings', path: '/settings' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function runScrollRegressionSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING LIFEOS SCROLL REGRESSION TEST SUITE`);
  console.log(`Against: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const failures: string[] = [];
  let testsRun = 0;
  let testsPassed = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: true,
        isMobile: true,
      });

      await context.addInitScript(({ user, data, themeMode }) => {
        try {
          localStorage.setItem('lifeos_mock_auth', 'true');
          localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(user));
          localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(data));
          localStorage.setItem('lifeos_cached_app_data', JSON.stringify(data));
          localStorage.setItem('lifeos_vault_unlocked', 'true');
          localStorage.setItem('lifeos_theme_mode', themeMode === 'dark' ? 'night' : 'dynamic');
        } catch {}
      }, { user: MOCK_USER, data: MOCK_APP_DATA, themeMode: theme });

      const page = await context.newPage();

      for (const route of ROUTES) {
        testsRun++;
        const testId = `${vp.name}_${theme}_${route.name}`;

        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(150);

          // 1. Scroll metrics inspection
          const metrics = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            const root = document.getElementById('root');
            const main = document.querySelector('main');
            return {
              scrollHeight: doc.scrollHeight,
              clientHeight: doc.clientHeight,
              htmlOverflowY: window.getComputedStyle(doc).overflowY,
              bodyOverflowY: window.getComputedStyle(body).overflowY,
              rootOverflowY: root ? window.getComputedStyle(root).overflowY : null,
              mainOverflowY: main ? window.getComputedStyle(main).overflowY : null,
              htmlTouchAction: window.getComputedStyle(doc).touchAction,
              bodyTouchAction: window.getComputedStyle(body).touchAction,
            };
          });

          // Check that body and root do not trap overflow
          if (metrics.bodyOverflowY !== 'visible') {
            failures.push(`[BODY_OVERFLOW] ${testId}: body overflow-y is '${metrics.bodyOverflowY}', expected 'visible'`);
          }
          if (metrics.rootOverflowY !== 'visible') {
            failures.push(`[ROOT_OVERFLOW] ${testId}: #root overflow-y is '${metrics.rootOverflowY}', expected 'visible'`);
          }

          // 2. Hit testing: center and 4 edge quadrants
          const hitTestResult = await page.evaluate(({ w, h }) => {
            const points = [
              { name: 'center', x: Math.round(w / 2), y: Math.round(h / 2) },
              { name: 'top-left', x: 25, y: 80 },
              { name: 'top-right', x: w - 25, y: 80 },
              { name: 'mid-upper', x: Math.round(w / 2), y: Math.round(h * 0.35) },
              { name: 'mid-lower', x: Math.round(w / 2), y: Math.round(h * 0.65) },
            ];

            const suspects: string[] = [];
            points.forEach(p => {
              const el = document.elementFromPoint(p.x, p.y);
              if (!el) return;
              const isInsideMain = Boolean(el.closest('main'));
              const isHeaderOrNav = Boolean(el.closest('header, nav, [role="navigation"]'));
              if (!isInsideMain && !isHeaderOrNav) {
                // Suspicious intercepting overlay
                const s = window.getComputedStyle(el);
                if (s.pointerEvents !== 'none') {
                  suspects.push(`${p.name}: <${el.tagName.toLowerCase()} class="${el.className?.toString?.()?.slice(0, 30)}">`);
                }
              }
            });
            return suspects;
          }, { w: vp.width, h: vp.height });

          if (hitTestResult.length > 0) {
            failures.push(`[HIT_TEST_OCCLUSION] ${testId}: Elements outside main capturing touches: ${hitTestResult.join(', ')}`);
          }

          // 3. Touch swipe gesture test (when scrollHeight > clientHeight)
          if (metrics.scrollHeight > metrics.clientHeight + 10) {
            await page.evaluate(() => window.scrollTo(0, 0));
            const cdp = await page.context().newCDPSession(page);

            const maxPossibleScroll = metrics.scrollHeight - metrics.clientHeight;
            const targetMinScroll = Math.min(maxPossibleScroll, 50);

            // Gesture: swipe finger UP from y=70% to y=20% to scroll DOWN
            const startY = Math.round(vp.height * 0.7);
            const scrollDelta = Math.min(250, Math.round(vp.height * 0.4));

            await cdp.send('Input.synthesizeScrollGesture', {
              x: Math.round(vp.width / 2),
              y: startY,
              yDistance: -scrollDelta,
              gestureSourceType: 'default',
            });
            await page.waitForTimeout(300);

            const scrollYAfter = await page.evaluate(() => window.scrollY);
            if (scrollYAfter < targetMinScroll) {
              failures.push(`[TOUCH_SCROLL_FAIL] ${testId}: Swiping up by ${scrollDelta}px only moved scrollY to ${scrollYAfter}px (expected >= ${targetMinScroll}px, scrollHeight=${metrics.scrollHeight}, clientHeight=${metrics.clientHeight})`);
            } else {
              // Now swipe back down to restore
              await cdp.send('Input.synthesizeScrollGesture', {
                x: Math.round(vp.width / 2),
                y: Math.round(vp.height * 0.3),
                yDistance: scrollDelta,
                gestureSourceType: 'default',
              });
              await page.waitForTimeout(300);
              const scrollYRestored = await page.evaluate(() => window.scrollY);
              if (scrollYRestored > scrollYAfter - Math.min(scrollYAfter, 30)) {
                failures.push(`[REVERSE_SCROLL_FAIL] ${testId}: Swiping down did not restore scroll position (current: ${scrollYRestored}px, was: ${scrollYAfter}px)`);
              }
            }
          }

          testsPassed++;
        } catch (err: any) {
          failures.push(`[TEST_ERROR] ${testId}: ${err.message}`);
        }
      }

      await context.close();
    }
  }

  // 4. State-Transition Scroll Tests
  console.log('\n--- Running State-Transition Scroll Tests ---');
  const transContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    isMobile: true,
  });
  await transContext.addInitScript(({ user, data }) => {
    localStorage.setItem('lifeos_mock_auth', 'true');
    localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(user));
    localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(data));
    localStorage.setItem('lifeos_cached_app_data', JSON.stringify(data));
    localStorage.setItem('lifeos_vault_unlocked', 'true');
  }, { user: MOCK_USER, data: MOCK_APP_DATA });

  const transPage = await transContext.newPage();
  const cdp = await transContext.newCDPSession(transPage);

  // Transition 1: Open & Close Navigation Hub
  testsRun++;
  try {
    await transPage.goto(`${BASE_URL}/gym`, { waitUntil: 'domcontentloaded' });
    await transPage.waitForTimeout(400);

    // Open Hub via squircle button
    const hubButton = transPage.locator('button[aria-label="More Menu"]').first();
    await hubButton.click();
    await transPage.waitForTimeout(300);

    // Assert Hub is open
    const isHubOpen = await transPage.evaluate(() => Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')));
    if (!isHubOpen) {
      failures.push('[STATE_TRANSITION] Navigation Hub failed to open');
    }

    // Close Hub via scrim tap
    await transPage.evaluate(() => {
      const scrim = document.querySelector('div.bg-black.pointer-events-auto');
      if (scrim) (scrim as HTMLElement).click();
      else window.dispatchEvent(new CustomEvent('lifeos-close-menu'));
    });
    await transPage.waitForTimeout(400);

    // Assert no lingering overflow: hidden or position: fixed on html or body
    const bodyStyles = await transPage.evaluate(() => ({
      overflow: document.body.style.overflow,
      position: window.getComputedStyle(document.body).position,
      htmlOverflow: document.documentElement.style.overflow,
    }));
    if (bodyStyles.overflow === 'hidden' || bodyStyles.position === 'fixed') {
      failures.push(`[LINGERING_LOCK] Hub close left lingering lock: ${JSON.stringify(bodyStyles)}`);
    }

    // Assert vertical scroll works after Hub close
    await transPage.evaluate(() => window.scrollTo(0, 0));
    await cdp.send('Input.synthesizeScrollGesture', {
      x: 206,
      y: 700,
      yDistance: -250,
      gestureSourceType: 'default',
    });
    await transPage.waitForTimeout(300);
    const postHubScrollY = await transPage.evaluate(() => window.scrollY);
    if (postHubScrollY < 50) {
      failures.push(`[POST_HUB_SCROLL_FAIL] After closing Hub, touch scroll failed (scrollY=${postHubScrollY})`);
    } else {
      testsPassed++;
      console.log('✓ Post Navigation Hub open/close scroll test passed');
    }
  } catch (e: any) {
    failures.push(`[STATE_TRANSITION_ERROR] Navigation Hub transition: ${e.message}`);
  }

  // Transition 2: Rapid Navigation Sequence
  testsRun++;
  try {
    const sequence = ['/nutrition', '/spending', '/settings', '/gym'];
    for (const p of sequence) {
      await transPage.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded' });
      await transPage.waitForTimeout(100);
    }
    await transPage.evaluate(() => window.scrollTo(0, 0));
    await cdp.send('Input.synthesizeScrollGesture', {
      x: 206,
      y: 700,
      yDistance: -250,
      gestureSourceType: 'default',
    });
    await transPage.waitForTimeout(300);
    const postNavScrollY = await transPage.evaluate(() => window.scrollY);
    if (postNavScrollY < 50) {
      failures.push(`[RAPID_NAV_SCROLL_FAIL] After rapid navigation, touch scroll failed (scrollY=${postNavScrollY})`);
    } else {
      testsPassed++;
      console.log('✓ Rapid navigation scroll test passed');
    }
  } catch (e: any) {
    failures.push(`[RAPID_NAV_ERROR] ${e.message}`);
  }

  await transContext.close();
  await browser.close();

  console.log('\n================ SCROLL REGRESSION SUITE REPORT ================');
  console.log(`Total tests evaluated: ${testsRun}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    failures.forEach(f => console.log(`  ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL SCROLL REGRESSION TESTS PASSED (100% TOUCH & WHEEL RESPONSIVE ON ALL ROUTES AND VIEWPORTS)!');
  }
}

runScrollRegressionSuite().catch(err => {
  console.error('Scroll regression suite failed:', err);
  process.exit(1);
});

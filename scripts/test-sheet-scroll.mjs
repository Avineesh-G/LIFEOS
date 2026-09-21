import { chromium } from '@playwright/test';
import { MOCK_USER, MOCK_APP_DATA } from './mock-data.mjs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.addInitScript(({ user, data }) => {
    localStorage.setItem('lifeos_mock_auth', 'true');
    localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(user));
    localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(data));
    localStorage.setItem('lifeos_cached_app_data', JSON.stringify(data));
  }, { user: MOCK_USER, data: MOCK_APP_DATA });

  await page.goto('http://localhost:5173/outings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  // Click create outing button
  const btn = page.locator('button:has-text("New Outing"), button:has-text("Create Outing"), button:has-text("Create First Outing")').first();
  await btn.click();
  await page.waitForTimeout(400);

  const sheetInfo = await page.evaluate(() => {
    const sheet = document.querySelector('.liquid-glass.rounded-t-\\[32px\\]');
    const actionBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Create Outing'));
    const btnRect = actionBtn ? actionBtn.getBoundingClientRect() : null;
    return {
      scrollHeight: sheet ? sheet.scrollHeight : 0,
      clientHeight: sheet ? sheet.clientHeight : 0,
      scrollTop: sheet ? sheet.scrollTop : 0,
      btnVisible: btnRect ? (btnRect.top < window.innerHeight && btnRect.bottom > 0) : false,
      btnTop: btnRect?.top,
      windowHeight: window.innerHeight,
    };
  });
  console.log('Sheet Info:', sheetInfo);

  if (!sheetInfo.btnVisible) {
    console.error('FAIL: Action button is not visible on initial open!');
    process.exit(1);
  }

  // Perform touch swipe gesture (touch start at y=500, swipe to y=250)
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 195, y: 500, id: 1 }],
  });
  for (let y = 500; y >= 250; y -= 25) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y, id: 1 }],
    });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await page.waitForTimeout(400);

  const afterScroll = await page.evaluate(() => {
    const sheet = document.querySelector('.liquid-glass.rounded-t-\\[32px\\]');
    return sheet ? sheet.scrollTop : null;
  });
  console.log('After Touch Scroll scrollTop:', afterScroll);

  if (afterScroll === null || afterScroll <= 0) {
    console.error('FAIL: Sheet did not scroll with touch gesture!');
    process.exit(1);
  }

  console.log('PASS: BottomSheet touch scrolling and action button accessibility verified!');
  await browser.close();
}

run();

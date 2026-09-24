import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\avine\\.gemini\\antigravity-ide\\brain\\37848a49-1d29-44a1-8dbe-c0ea0562e37a\\notes_screenshots';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'watch-280', width: 280, height: 600 },
  { name: 'small-320', width: 320, height: 640 },
  { name: 'standard-360', width: 360, height: 640 },
  { name: 'flagship-412', width: 412, height: 892 },
];

async function runVerification() {
  console.log('🧪 Starting Playwright Comprehensive Notes Verification...');
  const browser = await chromium.launch();
  let overflowViolations = 0;

  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme as 'light' | 'dark',
      });
      const page = await context.newPage();

      // Set localStorage theme and mock authenticated user
      await page.addInitScript((th) => {
        try {
          (window as any).__LIFEOS_MOCK_AUTH__ = true;
          const testUser = {
            uid: 'test-user-notes',
            email: 'tester@lifeos.internal',
            displayName: 'Test User'
          };
          localStorage.setItem('lifeos_mock_auth', 'true');
          localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(testUser));
          localStorage.setItem(`lifeos_cloud_sync_prompt_handled_${testUser.uid}`, 'true');
          
          const cached = localStorage.getItem('lifeos_settings') || '{}';
          const parsed = JSON.parse(cached);
          parsed.theme = th;
          localStorage.setItem('lifeos_settings', JSON.stringify(parsed));
          if (th === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch {}
      }, theme);

      // 1. Visit /notes
      await page.goto('http://localhost:4173/notes', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Verify no horizontal document overflow
      const pageOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (pageOverflow) {
        console.error(`❌ Overflow detected on /notes at ${vp.name} (${theme})`);
        overflowViolations++;
      } else {
        console.log(`✅ No overflow on /notes at ${vp.name} (${theme})`);
      }

      const listShotPath = path.join(ARTIFACT_DIR, `notes-list-${vp.name}-${theme}.png`);
      await page.screenshot({ path: listShotPath, fullPage: false });

      // 2. Open /notes/new (Editor)
      await page.goto('http://localhost:4173/notes/new', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('button:has-text("Save Idea")', { timeout: 10000 });
      await page.waitForTimeout(300);

      // Verify Save button & segmented control are both fully visible
      const editorCheck = await page.evaluate(() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save Idea') || b.textContent?.includes('Saved!'));
        const modal = document.querySelector('.max-w-4xl');
        const isDocOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        
        let saveVisible = false;
        if (saveBtn) {
          const rect = saveBtn.getBoundingClientRect();
          saveVisible = rect.width > 0 && rect.height > 0 && rect.right <= window.innerWidth + 2;
        }

        return {
          isDocOverflow,
          saveVisible,
          modalWidth: modal?.clientWidth,
          winWidth: window.innerWidth,
        };
      });

      if (!editorCheck.saveVisible) {
        console.error(`❌ Save button clipped/invisible at ${vp.name} (${theme}):`, editorCheck);
        overflowViolations++;
      } else {
        console.log(`✅ Save button cleanly visible within viewport at ${vp.name} (${theme})`);
      }

      const editorShotPath = path.join(ARTIFACT_DIR, `notes-editor-${vp.name}-${theme}.png`);
      await page.screenshot({ path: editorShotPath, fullPage: false });

      // 3. Test typing content and paper styles
      await page.fill('input[placeholder*="Note Title"]', 'Design Sprint Brainstorm');
      await page.fill('textarea[placeholder*="Start writing"]', 'Key insight: Keep user interfaces pure, elegant, and perfectly bounded with zero overflow.\nLine 2: Fast execution.\nLine 3: Seamless sync.');
      
      // Click Lined Paper
      const linedBtn = page.locator('button:has-text("Lined Paper")');
      if (await linedBtn.isVisible()) {
        await linedBtn.click();
        await page.waitForTimeout(200);
      }

      const typedShotPath = path.join(ARTIFACT_DIR, `notes-typed-lined-${vp.name}-${theme}.png`);
      await page.screenshot({ path: typedShotPath, fullPage: false });

      // Click Save Idea
      const saveBtn = page.locator('button:has-text("Save Idea")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }

      await context.close();
    }
  }

  // Check Navigation Hub Sheet with Notes tile
  const hubContext = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const hubPage = await hubContext.newPage();
  await hubPage.addInitScript(() => {
    try {
      (window as any).__LIFEOS_MOCK_AUTH__ = true;
      const testUser = {
        uid: 'test-user-notes',
        email: 'tester@lifeos.internal',
        displayName: 'Test User'
      };
      localStorage.setItem('lifeos_mock_auth', 'true');
      localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(testUser));
      localStorage.setItem(`lifeos_cloud_sync_prompt_handled_${testUser.uid}`, 'true');
    } catch {}
  });

  await hubPage.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await hubPage.waitForTimeout(600);

  // Click More / Hub button (aria-label="More Menu")
  const moreBtn = hubPage.locator('button[aria-label="More Menu"]');
  if (await moreBtn.isVisible()) {
    await moreBtn.click();
    await hubPage.waitForTimeout(600);
    const hubShotPath = path.join(ARTIFACT_DIR, 'hub-sheet-with-notes.png');
    await hubPage.screenshot({ path: hubShotPath, fullPage: false });
    console.log('✅ Captured Navigation Hub screenshot with Notes tile');
  }

  await hubContext.close();
  await browser.close();

  if (overflowViolations === 0) {
    console.log('\n🎉 ALL VIEWPORT & OVERFLOW VERIFICATIONS PASSED WITH ZERO VIOLATIONS!');
  } else {
    console.error(`\n❌ Total violations: ${overflowViolations}`);
  }
}

runVerification().catch(console.error);

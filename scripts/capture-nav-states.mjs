import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { MOCK_USER, MOCK_APP_DATA } from './mock-data.mjs';

const WIDTHS = [280, 360, 412];
const HEIGHT = 720;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

const mode = process.argv.includes('--mode=post') ? 'post' : 'baseline';
const outDir = path.resolve(process.cwd(), 'test-results', `nav-${mode}`);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// All interfaces to test pinned
const INTERFACES_TO_PIN = [
  { id: 'study', route: '/study', label: 'Study' },
  { id: 'spending', route: '/spending', label: 'Spending' },
  { id: 'shopping', route: '/shopping', label: 'Shopping' },
  { id: 'outings', route: '/outings', label: 'Outings' },
  { id: 'history', route: '/history', label: 'History' },
  { id: 'settings', route: '/settings', label: 'Settings' },
  { id: 'vault', route: '/vault', label: 'Vault' },
  { id: 'tasks', route: '/tasks', label: 'Tasks' },
  { id: 'laundry', route: '/laundry', label: 'Laundry' },
];

async function main() {
  console.log(`📸 Starting Navigation Bar State Capture (Mode: ${mode}) across widths ${WIDTHS.join(', ')}...`);
  
  const browser = await chromium.launch({ headless: true });
  let totalCaptured = 0;

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: HEIGHT },
      deviceScaleFactor: 2,
    });

    // Seed mock data
    await context.addInitScript(({ user, data }) => {
      try {
        localStorage.setItem('lifeos_mock_auth', 'true');
        localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(user));
        localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(data));
        localStorage.setItem('lifeos_cached_app_data', JSON.stringify(data));
        localStorage.setItem('lifeos_vault_unlocked', 'true');
      } catch {}
    }, { user: MOCK_USER, data: MOCK_APP_DATA });

    const page = await context.newPage();

    for (const theme of ['light', 'dark']) {
      const isDark = theme === 'dark';

      const applyThemeAndData = async (customData = {}) => {
        await page.evaluate(({ dark, customData, user }) => {
          localStorage.setItem('lifeos_theme_mode', dark ? 'night' : 'dynamic');
          if (dark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          if (customData && Object.keys(customData).length > 0) {
            const raw = localStorage.getItem('lifeos_cached_app_data');
            const d = raw ? JSON.parse(raw) : {};
            const merged = { ...d, ...customData };
            localStorage.setItem('lifeos_cached_app_data', JSON.stringify(merged));
            localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(merged));
          }
        }, { dark: isDark, customData, user: MOCK_USER });
        await page.waitForTimeout(60);
      };

      // 1. Default pinned: Home, Gym, Nutrition
      for (const [tabName, route] of [['home', '/'], ['gym', '/gym'], ['nutrition', '/nutrition']]) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await applyThemeAndData({ pinnedNavSlots: ['gym', 'nutrition'] });
        await page.waitForTimeout(150);
        const shotName = `w${width}_${theme}_default_${tabName}.png`;
        await page.screenshot({ path: path.join(outDir, shotName), fullPage: false });
        totalCaptured++;
      }

      // 2. Unpinned page active: Shopping Lists (/shopping) when pinned is ['gym', 'nutrition']
      // Hub active indicator dot on More button
      await page.goto(`${BASE_URL}/shopping`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await applyThemeAndData({ pinnedNavSlots: ['gym', 'nutrition'] });
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(outDir, `w${width}_${theme}_unpinned_more_dot.png`), fullPage: false });
      totalCaptured++;

      // 3. Other interfaces pinned in pill and active
      for (const item of INTERFACES_TO_PIN) {
        await page.goto(`${BASE_URL}${item.route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await applyThemeAndData({ pinnedNavSlots: [item.id, 'nutrition'] });
        await page.waitForTimeout(150);
        const shotName = `w${width}_${theme}_pinned_${item.id}.png`;
        await page.screenshot({ path: path.join(outDir, shotName), fullPage: false });
        totalCaptured++;
      }

      // 4. Hub open (More button showing X)
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await applyThemeAndData({ pinnedNavSlots: ['gym', 'nutrition'] });
      await page.waitForTimeout(150);
      // Click the More button
      const moreBtn = page.locator('button[aria-label="More Menu"]');
      if (await moreBtn.count() > 0) {
        await moreBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(outDir, `w${width}_${theme}_hub_open.png`), fullPage: false });
        totalCaptured++;

        // 5. Hub in Edit navigation mode
        // Look for Edit button in the hub header
        const editPencil = page.locator('button[aria-label="Edit navigation slots"], button:has-text("Edit")').first();
        if (await editPencil.count() > 0) {
          await editPencil.click();
          await page.waitForTimeout(250);
          await page.screenshot({ path: path.join(outDir, `w${width}_${theme}_hub_edit_slot1.png`), fullPage: false });
          totalCaptured++;

          // Select Slot 2
          const slot2Btn = page.locator('button[aria-label^="Slot 2"]').first();
          if (await slot2Btn.count() > 0) {
            await slot2Btn.click();
            await page.waitForTimeout(150);
            await page.screenshot({ path: path.join(outDir, `w${width}_${theme}_hub_edit_slot2.png`), fullPage: false });
            totalCaptured++;
          }
        }

        // Close hub
        await moreBtn.click();
        await page.waitForTimeout(250);
      }

      // 6. Pressed and focused states on More button
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await applyThemeAndData({ pinnedNavSlots: ['gym', 'nutrition'] });
      await page.waitForTimeout(150);
      
      // Focus state
      await moreBtn.focus();
      await page.waitForTimeout(100);
      await page.screenshot({ path: path.join(outDir, `w${width}_${theme}_more_focused.png`), fullPage: false });
      totalCaptured++;
    }

    await context.close();
  }

  await browser.close();
  console.log(`✅ Completed navigation state capture: ${totalCaptured} screenshots saved to ${outDir}`);
}

main().catch(console.error);

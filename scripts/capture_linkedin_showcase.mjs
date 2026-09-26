import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { MOCK_USER, MOCK_APP_DATA } from './mock-data.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\avine\\.gemini\\antigravity-ide\\brain\\37848a49-1d29-44a1-8dbe-c0ea0562e37a\\linkedin_screenshots';
const LOCAL_DIR = path.resolve(process.cwd(), 'screenshots_linkedin');

for (const dir of [ARTIFACT_DIR, LOCAL_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 20 Core Showcase Screenshots for LinkedIn
const SHOWCASE_PAGES = [
  { id: '01_home_dashboard', route: '/', dark: true, desc: 'Home Dashboard & Daily Brief' },
  { id: '02_study_hub', route: '/study', dark: true, desc: 'Study Hub & Focus Timer' },
  { id: '03_gym_workout_tracker', route: '/gym', dark: true, desc: 'Gym & Split Routine Tracker' },
  { id: '04_nutrition_and_macros', route: '/nutrition', dark: true, desc: 'Nutrition & Macro Goals' },
  { id: '05_spending_and_budget', route: '/spending', dark: true, desc: 'Spending & Financial Ledger' },
  { id: '06_tasks_and_todo', route: '/tasks', dark: true, desc: 'Priority Tasks & To-Do List' },
  { id: '07_weekly_timetable', route: '/timetable', dark: true, desc: 'Weekly Timetable & Schedule' },
  { id: '08_notes_and_ideas', route: '/notes', dark: true, desc: 'Notes & Creative Ideas Board' },
  { id: '09_biometric_secure_vault', route: '/vault', dark: true, desc: 'Secure Biometric Vault' },
  { id: '10_shopping_lists', route: '/shopping', dark: true, desc: 'Categorized Shopping Lists' },
  { id: '11_outings_and_trips', route: '/outings', dark: true, desc: 'Outings & Trip Itinerary Planner' },
  { id: '12_laundry_cycle_timer', route: '/laundry', dark: true, desc: 'Laundry Cycle Countdown Tracker' },
  { id: '13_work_history_timeline', route: '/history', dark: true, desc: 'Career Timeline & Accomplishments' },
  { id: '14_interface_color_customizer', route: '/settings/interface-colors', dark: true, desc: 'M3 Interface Color Customizer' },
  { id: '15_app_settings_and_backup', route: '/settings', dark: true, desc: 'Settings & Cloud Backup' },
  { id: '16_more_hub_navigation', route: '/', dark: true, desc: 'Quick Hub Navigation Sheet', openHub: true },
  { id: '17_in_app_updater_modal', route: '/', dark: true, desc: 'OTA In-App Updater & Wavy Progress', openUpdater: true },
  { id: '18_home_light_mode', route: '/', dark: false, desc: 'Home Dashboard (Light Theme)' },
  { id: '19_study_light_mode', route: '/study', dark: false, desc: 'Study Hub (Light Theme)' },
  { id: '20_nutrition_light_mode', route: '/nutrition', dark: false, desc: 'Nutrition & Macros (Light Theme)' },
];

async function capture() {
  console.log('🚀 Starting LinkedIn Mobile Showcase Capture (412x915, 2x Retina)...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 890 }, // Flagship modern mobile display
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  });

  // Inject populated mock data and unlock all states
  await context.addInitScript(({ user, data }) => {
    try {
      localStorage.setItem('lifeos_mock_auth', 'true');
      localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(user));
      localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(data));
      localStorage.setItem('lifeos_cached_app_data', JSON.stringify(data));
      localStorage.setItem('lifeos_vault_unlocked', 'true');
      localStorage.setItem('lifeos_vault_passcode', '1234');
      localStorage.setItem('lifeos_last_startup_greeting_timestamp', String(Date.now()));
      localStorage.setItem('lifeos_cloud_sync_prompt_handled_mock_user_123', 'true');
      localStorage.setItem('lifeos_cloud_sync_prompt_handled_' + user.uid, 'true');
    } catch (e) {}
  }, { user: MOCK_USER, data: MOCK_APP_DATA });

  const page = await context.newPage();

  for (let i = 0; i < SHOWCASE_PAGES.length; i++) {
    const item = SHOWCASE_PAGES[i];
    console.log(`[${i + 1}/${SHOWCASE_PAGES.length}] Capturing ${item.desc}...`);

    await page.goto(`${BASE_URL}${item.route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Apply dark or light theme
    await page.evaluate(({ dark }) => {
      localStorage.setItem('lifeos_theme_mode', dark ? 'night' : 'dynamic');
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, { dark: item.dark });

    await page.waitForTimeout(400);

    // If opening Hub sheet
    if (item.openHub) {
      try {
        const moreBtn = page.locator('nav[role="navigation"] button').last();
        if (await moreBtn.isVisible()) {
          await moreBtn.click();
          await page.waitForTimeout(600);
        }
      } catch (e) {
        console.warn('Could not open hub:', e);
      }
    }

    // If opening Updater modal
    if (item.openUpdater) {
      try {
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('lifeos-open-updater'));
        });
        await page.waitForTimeout(600);
      } catch (e) {
        console.warn('Could not open updater:', e);
      }
    }

    const fileName = `${item.id}.png`;
    const artifactPath = path.join(ARTIFACT_DIR, fileName);
    const localPath = path.join(LOCAL_DIR, fileName);

    await page.screenshot({ path: artifactPath });
    fs.copyFileSync(artifactPath, localPath);
    console.log(`✅ Saved: ${fileName}`);
  }

  await browser.close();
  console.log(`\n🎉 Successfully captured all ${SHOWCASE_PAGES.length} screenshots!`);
  console.log(`Saved to:\n📁 ${LOCAL_DIR}\n📁 ${ARTIFACT_DIR}`);
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});

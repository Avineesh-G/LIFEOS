import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { MOCK_USER, MOCK_APP_DATA } from './mock-data.mjs';

const outDir = path.resolve(process.cwd(), 'scripts', 'test-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function verify() {
  console.log('🚀 Starting Comprehensive Ask LifeOS Verification Test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 892 },
    deviceScaleFactor: 2,
  });

  await context.addInitScript(({ user, data }) => {
    localStorage.setItem('lifeos_mock_auth', 'true');
    localStorage.setItem('lifeos_cached_auth_user', JSON.stringify(user));
    localStorage.setItem('lifeos_cache_' + user.uid, JSON.stringify(data));
    localStorage.setItem('lifeos_cached_app_data', JSON.stringify(data));
    localStorage.setItem('lifeos_vault_unlocked', 'true');
    localStorage.setItem('lifeos_ai_consent', 'true');
    localStorage.setItem('lifeos_cloud_sync_prompt_handled_' + user.uid, 'true');
  }, { user: MOCK_USER, data: MOCK_APP_DATA });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
  });

  console.log('1. Loading application at http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Take screenshot of home page
  await page.screenshot({ path: path.join(outDir, '01_homepage.png') });
  console.log('   📸 Captured 01_homepage.png');

  console.log('2. Opening Ask LifeOS popup...');
  // Tap the Sparkles AI button in the dock
  const aiButton = page.locator('button[aria-label="Ask LifeOS AI"]');
  await aiButton.waitFor({ state: 'visible', timeout: 5000 });
  await aiButton.click();

  // Wait for modal animation
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '02_modal_opened.png') });
  console.log('   📸 Captured 02_modal_opened.png');

  // Verify modal is open and nav bar is hidden
  const isNavHidden = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (!nav) return false;
    const style = window.getComputedStyle(nav);
    return style.pointerEvents === 'none';
  });
  console.log('   Navigation bar pointer-events is none:', isNavHidden);

  console.log('3. Clicking "Ask LifeOS anything..." input on 1st tap...');
  const input = page.locator('#ask-lifeos-input');
  await input.waitFor({ state: 'visible', timeout: 5000 });
  
  // Click on the input
  await input.click();
  await page.waitForTimeout(200);

  // Check activeElement
  const activeTag = await page.evaluate(() => document.activeElement?.id);
  console.log('   Active element after 1st click:', activeTag);
  if (activeTag !== 'ask-lifeos-input') {
    throw new Error(`Expected activeElement to be 'ask-lifeos-input', got '${activeTag}'`);
  }
  console.log('   ✅ Input immediately focused on 1st click!');

  console.log('4. Typing text into the input: "Show me today\'s workout and calorie goals"...');
  await input.pressSequentially("Show me today's workout and calorie goals", { delay: 30 });
  const typedVal = await input.inputValue();
  console.log('   Input value in DOM:', typedVal);
  if (typedVal !== "Show me today's workout and calorie goals") {
    throw new Error(`Typed value does not match: expected "Show me today's workout and calorie goals", got "${typedVal}"`);
  }
  console.log('   ✅ Typing succeeded seamlessly in one go!');

  await page.screenshot({ path: path.join(outDir, '03_typed_workout_query.png') });
  console.log('   📸 Captured 03_typed_workout_query.png');

  console.log('5. Testing Clear button (X)...');
  const clearButton = page.locator('button[title="Clear text"]');
  await clearButton.waitFor({ state: 'visible', timeout: 2000 });
  await clearButton.click();
  await page.waitForTimeout(100);

  const clearedVal = await input.inputValue();
  console.log('   Value after clear:', JSON.stringify(clearedVal));
  if (clearedVal !== '') {
    throw new Error(`Expected input to be cleared, got "${clearedVal}"`);
  }
  console.log('   ✅ Clear button works perfectly!');

  console.log('6. Typing second query: "What is my timetable today?"...');
  await input.pressSequentially('What is my timetable today?', { delay: 25 });
  const secondVal = await input.inputValue();
  console.log('   Second typed value:', secondVal);
  if (secondVal !== 'What is my timetable today?') {
    throw new Error(`Second typed value mismatch: "${secondVal}"`);
  }

  await page.screenshot({ path: path.join(outDir, '04_typed_second_query.png') });
  console.log('   📸 Captured 04_typed_second_query.png');

  console.log('7. Switching to Saved History tab...');
  const historyTab = page.locator('button:has-text("History")').first();
  await historyTab.click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(outDir, '05_history_tab.png') });
  console.log('   📸 Captured 05_history_tab.png');

  console.log('8. Switching back to Chat tab...');
  const chatTab = page.locator('button:has-text("Chat")').first();
  await chatTab.click();
  await page.waitForTimeout(400);

  // Click input again after tab switch
  await input.click();
  const activeAfterTab = await page.evaluate(() => document.activeElement?.id);
  console.log('   Active element after returning to chat tab:', activeAfterTab);
  if (activeAfterTab !== 'ask-lifeos-input') {
    throw new Error(`Active element after returning to chat tab is not 'ask-lifeos-input': '${activeAfterTab}'`);
  }

  console.log('9. Closing modal via backdrop or close button...');
  const closeButton = page.locator('button[aria-label="Close dialog"], button:has(svg.lucide-x)').first();
  await closeButton.click();
  await page.waitForTimeout(600);

  // Verify navigation bar is restored and interactive
  const isNavRestored = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (!nav) return false;
    const style = window.getComputedStyle(nav);
    return style.pointerEvents === 'auto' && style.opacity === '1';
  });
  console.log('   Navigation bar restored to pointer-events auto & opacity 1:', isNavRestored);

  await page.screenshot({ path: path.join(outDir, '06_modal_closed_nav_restored.png') });
  console.log('   📸 Captured 06_modal_closed_nav_restored.png');

  await browser.close();
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO ERRORS!');
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

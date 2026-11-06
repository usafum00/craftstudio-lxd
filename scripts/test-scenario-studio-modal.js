const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/Users/mike/.gemini/antigravity/brain/acd24b53-3c2a-4f18-b826-38732d82b72a';

async function run() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="password"]', 'lxd2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  console.log('2. Navigating to Social Engineering lesson...');
  await page.goto('http://localhost:3001/courses/course-social-eng/lessons/les-se-1');
  await page.waitForTimeout(2500);

  // Scroll down to scenario block
  console.log('3. Locating scenario stage on canvas...');
  const scenarioBlock = page.locator('[data-block-id="blk-1793605268322-3ujp"]').first();
  await scenarioBlock.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take screenshot of clean stage (no forehead badge, no chest box)
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'scenario-01-clean-stage.png'),
    fullPage: false
  });
  console.log('Captured scenario-01-clean-stage.png');

  // Hover over scenario block to reveal Edit button
  console.log('4. Hovering over Scenario block to open Scenario Studio Modal...');
  await scenarioBlock.hover();
  await page.waitForTimeout(500);

  // Click Edit button specifically inside this block
  const editBtn = scenarioBlock.locator('button:has-text("Edit")').first();
  await editBtn.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Full-Screen Scenario Studio Modal (Scene 1 Root selected)
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'scenario-02-studio-scene-view.png')
  });
  console.log('Captured scenario-02-studio-scene-view.png');

  // Click Step 1.2 in the left Content Order tree
  console.log('5. Clicking Step 1.2 in Content Order tree...');
  const stepRow = page.locator('text=1.2').first();
  await stepRow.click();
  await page.waitForTimeout(800);

  // Take screenshot of Step Editor View (Dialogue mode, responses 01, 02)
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'scenario-03-studio-step-view.png')
  });
  console.log('Captured scenario-03-studio-step-view.png');

  // Go back to Scene view and click Character "Edit" to test CharacterPickerModal
  console.log('6. Testing CharacterPickerModal...');
  const sceneRow = page.locator('text=1.0 Scene 1').first();
  await sceneRow.click();
  await page.waitForTimeout(600);

  // In the Scene Setup View, find the Character card and click its Edit button
  const charCard = page.locator('div:has(> div > h4:has-text("Character"))').first();
  const editCharBtn = charCard.locator('button:has-text("Edit")');
  await editCharBtn.click();
  await page.waitForTimeout(1000);

  // Capture Character Picker Modal with Framing checkmark filter and photographic characters
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'scenario-04-character-modal.png')
  });
  console.log('Captured scenario-04-character-modal.png');

  // Click Jet character card
  console.log('7. Selecting Jet to verify 6 distinct expressions and framing...');
  const jetCard = page.locator('text=Jet').first();
  await jetCard.click({ force: true });
  await page.waitForTimeout(1000);

  // Capture Step 2 of Character Modal (6 distinct expressions + framing toggle)
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'scenario-05-jet-expressions-step2.png')
  });
  console.log('Captured scenario-05-jet-expressions-step2.png');

  // Pick "Worried / Concerned"
  console.log('8. Selecting Worried / Concerned expression...');
  const worriedBtn = page.locator('button:has-text("Worried / Concerned")').first();
  await worriedBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // Now click Preview in Scenario Studio top bar
  console.log('9. Testing in-modal interactive Preview mode...');
  const studioHeader = page.locator('header:has-text("Scenario Studio")');
  const previewBtn = studioHeader.locator('button:has-text("Preview")');
  await previewBtn.click({ force: true });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'scenario-06-modal-preview-mode.png')
  });
  console.log('Captured scenario-06-modal-preview-mode.png');

  await browser.close();
  console.log('Test completed successfully!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

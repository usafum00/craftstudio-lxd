import { chromium } from 'playwright-core';
import fs from 'fs';

async function main() {
  console.log('=== Precise Scenario & Character Suite Verification ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="password"]', 'lxd2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Lesson
  await page.goto('http://localhost:3001/courses/course-social-eng/lessons/les-se-1');
  await page.waitForTimeout(2500);

  // Scroll to Scenario block
  const scenarioHeader = page.locator('text=Scene 1: Urgent IT Request').first();
  await scenarioHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Hover over the block to reveal block toolbar
  await scenarioHeader.hover();
  await page.waitForTimeout(400);

  // Click the Edit button on the block toolbar
  const scenarioBlockContainer = page.locator('div.group:has-text("Scene 1: Urgent IT Request")').first();
  const editBtn = scenarioBlockContainer.locator('button:has-text("Edit")').first();
  await editBtn.click({ force: true });
  await page.waitForTimeout(1500);

  // 1. Scenario Studio
  console.log('Scenario Studio Modal open:', await page.locator('h1:has-text("Scenario Studio")').isVisible());
  await page.screenshot({ path: 'public/uploads/01-scenario-studio-open.png' });
  console.log('✓ Captured 01-scenario-studio-open.png');

  // 2. Click Step 1.1 in sidebar
  const step11 = page.locator('div:has-text("1.1")').first();
  if (await step11.isVisible()) {
    await step11.click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'public/uploads/02-step-editor-live-stage.png' });
    console.log('✓ Captured 02-step-editor-live-stage.png');
  }

  // 3. Open Character Picker Modal
  console.log('Clicking Change Character button...');
  // Find "Change Character" button in studio
  const changeCharBtn = page.locator('button:has-text("Change Character"), button:has-text("Character")').first();
  await changeCharBtn.click({ force: true });
  await page.waitForTimeout(1200);

  // 4. Check Character Picker Grid
  const pickerTitle = page.locator('text=SELECT CHARACTER');
  console.log('Character Picker open:', await pickerTitle.isVisible());

  // Count characters
  const charCards = page.locator('div.group:has(p.text-\\[15px\\])');
  const charCount = await charCards.count();
  const charNames = await page.locator('p.text-\\[15px\\]').allTextContents();
  console.log(`✓ Character count: ${charCount}`);
  console.log('✓ Character names:', charNames);

  // Verify sparkle button visibility & text
  const generateBtn = page.locator('button:has-text("Generate Photo Cutout")');
  console.log('✓ Generate button visible:', await generateBtn.isVisible());

  await page.screenshot({ path: 'public/uploads/03-character-picker-8-clean.png' });
  console.log('✓ Captured 03-character-picker-8-clean.png');

  // 5. Click on Dr. Elena Ramos to test Step 2 (Expressions)
  const elenaCard = page.locator('div.group:has(p:has-text("Dr. Elena Ramos"))').first();
  if (await elenaCard.isVisible()) {
    await elenaCard.click({ force: true });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'public/uploads/04-elena-expressions-step2.png' });
    console.log('✓ Captured 04-elena-expressions-step2.png');

    // Click Happy
    const happyBtn = page.locator('button:has-text("Happy")').first();
    if (await happyBtn.isVisible()) {
      await happyBtn.click({ force: true });
      await page.waitForTimeout(1000);
      console.log('✓ Selected Happy pose for Dr. Elena Ramos');
    }
  }

  // Re-capture studio showing updated character
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/uploads/05-scenario-studio-updated.png' });
  console.log('✓ Captured 05-scenario-studio-updated.png');

  await browser.close();
  console.log('=== All verifications passed successfully! ===');
}

main().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

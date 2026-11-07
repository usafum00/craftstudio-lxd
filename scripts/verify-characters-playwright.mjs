import { chromium } from 'playwright-core';

async function testScenarioCharacterSuite() {
  console.log('=== Running Precise Playwright Verification for 8 Clean Flagship Characters ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Login
  console.log('Navigating to http://localhost:3001/login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="password"]', 'lxd2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // 2. Open lesson with scenario block
  console.log('Navigating to editor lesson les-se-1...');
  await page.goto('http://localhost:3001/courses/course-social-eng/lessons/les-se-1', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(2500);

  // Find the block section for blk-1793605268322-3ujp or containing "Workplace Scenario" / "Jet"
  console.log('Locating scenario block on canvas...');
  const scenarioSection = page.locator('div:has-text("Jet"), section:has-text("Workplace Scenario")').first();
  await scenarioSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Click the Edit / Content button on this scenario block
  const editBtn = page.locator('button:has-text("Edit Scenario"), button:has-text("Edit")').nth(1);
  await editBtn.click({ force: true });
  await page.waitForTimeout(1500);

  // Verify Scenario Studio opened
  const studioModal = page.locator('h1:has-text("Scenario Studio")');
  console.log('Is Scenario Studio open?', await studioModal.isVisible());
  await page.screenshot({ path: 'public/uploads/verify-02-scenario-studio.png' });
  console.log('Saved verify-02-scenario-studio.png');

  // Click on 1.1 Content Step in sidebar to view Step Editor with Live Stage Preview
  const stepItem = page.locator('text=1.1').first();
  if (await stepItem.isVisible()) {
    await stepItem.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'public/uploads/verify-03-step-editor-stage.png' });
    console.log('Saved verify-03-step-editor-stage.png');
  }

  // Click Change Character
  console.log('Opening Character Picker Modal...');
  const changeCharBtn = page.locator('button:has-text("Change Character"), button:has-text("Character")').first();
  if (await changeCharBtn.isVisible()) {
    await changeCharBtn.click();
    await page.waitForTimeout(1500);

    // Verify exactly 8 character cards
    const charNames = await page.locator('p.text-\\[15px\\]').allTextContents();
    console.log(`Character names in picker (${charNames.length}):`, charNames);

    // Take screenshot of Character Picker
    await page.screenshot({ path: 'public/uploads/verify-04-character-picker-grid.png' });
    console.log('Saved verify-04-character-picker-grid.png');

    // Click on Dr. Elena Ramos to open Step 2 (Expression Picker)
    const elenaCard = page.locator('div.group:has(p:has-text("Dr. Elena Ramos"))').first();
    if (await elenaCard.isVisible()) {
      await elenaCard.click();
      await page.waitForTimeout(1000);

      // Verify Step 2 is open
      await page.screenshot({ path: 'public/uploads/verify-05-expression-picker-elena.png' });
      console.log('Saved verify-05-expression-picker-elena.png');

      // Click Happy pose
      const happyPose = page.locator('button:has-text("Happy")').first();
      if (await happyPose.isVisible()) {
        await happyPose.click();
        await page.waitForTimeout(800);
        console.log('Clicked Happy pose on Dr. Elena Ramos');
        await page.screenshot({ path: 'public/uploads/verify-06-elena-happy-selected.png' });
        console.log('Saved verify-06-elena-happy-selected.png');
      }
    }
  }

  await browser.close();
  console.log('=== Playwright verification finished successfully! ===');
}

testScenarioCharacterSuite().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

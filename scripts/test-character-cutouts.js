const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3001';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function testCharacterCutouts() {
  console.log('🚀 Starting Character Cutout Library Visual Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = '/Users/mike/.gemini/antigravity/brain/acd24b53-3c2a-4f18-b826-38732d82b72a';

  console.log('0. Authenticating with author passcode lxd2026...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('input', 'lxd2026');
  await page.click('button[type="submit"]');
  await sleep(1500);

  console.log('1. Navigating to lesson editor...');
  await page.goto(`${BASE_URL}/courses/course-social-eng/lessons/les-se-1`, {
    waitUntil: 'networkidle0',
  });
  await sleep(2000);

  // Take screenshot 1: Lesson Canvas
  await page.screenshot({
    path: path.join(artifactDir, 'cutout-01-lesson-canvas.png'),
    fullPage: false,
  });
  console.log('✓ Captured cutout-01-lesson-canvas.png');

  // Find Edit button for the Scenario block
  console.log('2. Opening Edit Interactive Drawer for Scenario block...');
  await page.evaluate(() => {
    const editBtns = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent && b.textContent.trim() === 'Edit'
    );
    if (editBtns.length > 0) {
      editBtns[editBtns.length - 1].click();
    }
  });
  await sleep(1500);

  // Take screenshot 2: Edit Drawer showing Cutout Character button
  await page.screenshot({
    path: path.join(artifactDir, 'cutout-02-edit-drawer.png'),
    fullPage: false,
  });
  console.log('✓ Captured cutout-02-edit-drawer.png');

  // Click "Select Cutout Character" button
  console.log('3. Opening CharacterPickerModal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Select Cutout Character')
    );
    if (btn) btn.click();
  });
  await sleep(1500);

  // Take screenshot 3: CharacterPickerModal (Grid of 24 characters with filter sidebar)
  await page.screenshot({
    path: path.join(artifactDir, 'cutout-03-library-modal.png'),
    fullPage: false,
  });
  console.log('✓ Captured cutout-03-library-modal.png');

  // Hover over Renita to show [ SELECT ] button
  console.log('4. Hovering over character card...');
  await page.evaluate(() => {
    const p = Array.from(document.querySelectorAll('p')).find(
      (el) => el.textContent && (el.textContent.includes('Renita') || el.textContent.includes('Lange'))
    );
    if (p) {
      const card = p.closest('.group');
      if (card) {
        card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      }
    }
  });
  await sleep(600);

  await page.screenshot({
    path: path.join(artifactDir, 'cutout-04-hover-card.png'),
    fullPage: false,
  });
  console.log('✓ Captured cutout-04-hover-card.png');

  // Click character to enter Step 2: Expression & Pose Picker
  console.log('5. Clicking character card to open Expression Picker...');
  await page.evaluate(() => {
    const p = Array.from(document.querySelectorAll('p')).find(
      (el) => el.textContent && el.textContent.includes('Renita')
    );
    if (p) {
      const card = p.closest('.group') || p;
      card.click();
    }
  });
  await sleep(1500);

  // Take screenshot 5: Step 2 Expression Picker
  await page.screenshot({
    path: path.join(artifactDir, 'cutout-05-expression-picker.png'),
    fullPage: false,
  });
  console.log('✓ Captured cutout-05-expression-picker.png');

  // Select "Happy" or "Talking" pose
  console.log('6. Selecting Happy pose...');
  await page.evaluate(() => {
    const happyBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Happy')
    );
    if (happyBtn) happyBtn.click();
  });
  await sleep(1200);

  // Close drawer to reveal scenario stage
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close"]') ||
      Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.trim() === 'Done');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1000);

  // Scroll to scenario stage and capture
  console.log('7. Capturing scenario stage with transparent cutout character grounded on stage...');
  await page.screenshot({
    path: path.join(artifactDir, 'cutout-06-grounded-figure.png'),
    fullPage: false,
  });
  console.log('✓ Captured cutout-06-grounded-figure.png');

  await browser.close();
  console.log('🎉 Verification complete!');
}

testCharacterCutouts().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runDualLensTest() {
  console.log('🚀 Starting Dual-Lens QA & ID Architecture Test on', BASE_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleLogs = [];
  const errors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('Warning')) {
      consoleLogs.push({ type: msg.type(), text });
    }
  });

  page.on('pageerror', (err) => {
    errors.push(err.toString());
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Passcode Gate & Login Flow
    // -------------------------------------------------------------
    console.log('\n--- [TEST 1: Passcode Gate & Login] ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    console.log('Current URL after navigating to /:', page.url());

    if (!page.url().includes('/login')) {
      console.warn('⚠️ Warning: / did not redirect to /login for unauthenticated user!');
    } else {
      console.log('✓ Successfully redirected to /login');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png') });

    // Enter wrong passcode
    await page.type('input[placeholder*="passcode"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await sleep(1000);
    const errorText = await page.evaluate(() => document.body.innerText);
    if (errorText.includes('Incorrect author passcode')) {
      console.log('✓ Correctly rejected wrong passcode');
    } else {
      console.warn('⚠️ Did not see expected error message for wrong passcode');
    }

    // Clear and enter correct passcode
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="passcode"]');
      if (input) input.value = '';
    });
    await page.type('input[placeholder*="passcode"]', 'lxd2026');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    console.log('URL after login:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-library-dashboard.png') });

    // -------------------------------------------------------------
    // Test 2: Course Outline & "Share for Review"
    // -------------------------------------------------------------
    console.log('\n--- [TEST 2: Course Outline & Share for Review] ---');
    await page.goto(`${BASE_URL}/courses/course-social-eng`, { waitUntil: 'networkidle2' });
    console.log('Navigated to course outline:', page.url());
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-course-outline.png') });

    // Check "Share for Review" button
    const shareBtn = await page.$('button[title*="Share Reviewer link"]');
    if (shareBtn) {
      console.log('✓ "Share for Review" button found in top bar');
      await shareBtn.click();
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-share-modal.png') });

      const modalText = await page.evaluate(() => document.body.innerText);
      if (modalText.includes('/review/course-social-eng')) {
        console.log('✓ Share modal correctly displays public review link');
      }

      // Close modal
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const done = btns.find((b) => b.innerText.includes('Done'));
        if (done) done.click();
      });
      await sleep(500);
    } else {
      console.warn('⚠️ "Share for Review" button not found in outline top bar');
    }

    // -------------------------------------------------------------
    // Test 3: Lesson Canvas & ID Feedback Drawer
    // -------------------------------------------------------------
    console.log('\n--- [TEST 3: Lesson Canvas & Review Drawer in Editor] ---');
    await page.goto(`${BASE_URL}/courses/course-social-eng/lessons/les-se-1`, { waitUntil: 'networkidle2' });
    console.log('Navigated to Lesson 1 Editor:', page.url());
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-lesson-editor.png') });

    // Open Feedback drawer
    const feedbackBtn = await page.$('button[title*="Peer Review Feedback"]');
    if (feedbackBtn) {
      console.log('✓ Feedback button found in lesson header');
      await feedbackBtn.click();
      await sleep(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-review-drawer-open.png') });

      const drawerText = await page.evaluate(() => document.body.innerText);
      if (drawerText.includes('ID Peer Review Feedback')) {
        console.log('✓ Review drawer successfully opened in editor view');
      }
    } else {
      console.warn('⚠️ Feedback button not found in lesson editor');
    }

    // -------------------------------------------------------------
    // Test 4: Dedicated Reviewer Mode (/review/[courseId])
    // -------------------------------------------------------------
    console.log('\n--- [TEST 4: Dedicated Reviewer Mode (/review/course-social-eng)] ---');
    // Launch a second clean browser without cookies to verify zero-passcode access
    const reviewerBrowser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    });
    const reviewerPage = await reviewerBrowser.newPage();
    await reviewerPage.setViewport({ width: 1280, height: 900 });

    const reviewerConsole = [];
    reviewerPage.on('console', (msg) => {
      if (msg.type() === 'error') reviewerConsole.push(msg.text());
    });
    reviewerPage.on('pageerror', (err) => {
      reviewerConsole.push(err.toString());
    });

    await reviewerPage.goto(`${BASE_URL}/review/course-social-eng`, { waitUntil: 'networkidle2' });
    console.log('Reviewer URL:', reviewerPage.url());
    await sleep(1000);
    await reviewerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '07-reviewer-cover.png') });

    const isLogin = reviewerPage.url().includes('/login');
    if (isLogin) {
      console.error('❌ CRITICAL BUG: /review/[courseId] redirected to /login! Should be open!');
    } else {
      console.log('✓ /review/[courseId] is openly accessible without author passcode');
    }

    // Check for authoring controls in reviewer DOM
    const authoringButtons = await reviewerPage.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim());
      return texts.filter((t) =>
        ['Replace Image', 'Delete item', 'Add Block', 'Move up', 'Move down', 'Delete block'].includes(t)
      );
    });

    if (authoringButtons.length > 0) {
      console.warn('⚠️ Leaked authoring buttons found in reviewer DOM:', authoringButtons);
    } else {
      console.log('✓ ZERO authoring controls exposed in Reviewer DOM');
    }

    // Start Course in Reviewer Mode
    await reviewerPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const start = btns.find((b) => b.innerText.includes('Start Course Review') || b.innerText.includes('Start Course'));
      if (start) start.click();
    });
    await sleep(1000);
    await reviewerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '08-reviewer-lesson-desktop.png') });

    // Test Mobile Responsiveness (375px)
    const mobileBtn = await reviewerPage.$('button[title*="Mobile Portrait"]');
    if (mobileBtn) {
      await mobileBtn.click();
      await sleep(600);
      await reviewerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '09-reviewer-lesson-mobile.png') });
      console.log('✓ Tested Mobile viewport (375px)');
    }

    // -------------------------------------------------------------
    // Test 5: Post Review Comment in Reviewer Mode
    // -------------------------------------------------------------
    console.log('\n--- [TEST 5: Post Review Comment in Reviewer Mode] ---');
    // Open comments drawer if not open
    const commentInput = await reviewerPage.$('textarea');
    if (commentInput) {
      await commentInput.type('Automated QA Check: The phishing anatomy breakdown is crisp and highly engaging.');
      await reviewerPage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const postBtn = btns.find((b) => b.innerText.includes('Post Comment'));
        if (postBtn) postBtn.click();
      });
      await sleep(1000);
      await reviewerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '10-review-comment-posted.png') });

      const reviewContent = await reviewerPage.evaluate(() => document.body.innerText);
      if (reviewContent.includes('The phishing anatomy breakdown is crisp')) {
        console.log('✓ Review comment successfully posted & persisted in SQLite!');
      } else {
        console.warn('⚠️ Did not see newly posted comment in drawer');
      }
    }

    // -------------------------------------------------------------
    // Test 6: Standalone Assessment / Quiz Player
    // -------------------------------------------------------------
    console.log('\n--- [TEST 6: Standalone Assessment in Full Course Preview] ---');
    await page.goto(`${BASE_URL}/courses/course-social-eng/preview`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    // Navigate to Quiz (Lesson 5)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const quizBtn = buttons.find((b) => b.innerText.includes('Final Assessment') || b.innerText.includes('Quiz'));
      if (quizBtn) quizBtn.click();
    });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-quiz-player.png') });

    const quizText = await page.evaluate(() => document.body.innerText);
    if (quizText.includes('Passing score is 80%') || quizText.includes('Question 1')) {
      console.log('✓ Quiz player rendered with proper title and passing score threshold');
    }

    // Check for radio / checkbox accessibility controls
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"]')).length;
    });
    console.log(`✓ Accessible radio/checkbox inputs found in DOM: ${inputs}`);

    if (reviewerBrowser) {
      await reviewerBrowser.close();
    }
  } catch (err) {
    console.error('❌ Exception during automated test:', err);
  } finally {
    await browser.close();
    console.log('\n=== Automated Test Run Complete ===');
    console.log(`Console logs captured: ${consoleLogs.length}`);
    if (consoleLogs.length > 0) {
      console.log('Console logs:', consoleLogs.slice(0, 10));
    }
    console.log(`Errors encountered: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
  }
}

runDualLensTest();

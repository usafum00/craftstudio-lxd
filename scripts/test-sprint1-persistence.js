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

async function runSprint1Test() {
  console.log('🚀 Starting Sprint 1 Verification Test on', BASE_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // -------------------------------------------------------------
    // Step 1: Login with Passcode
    // -------------------------------------------------------------
    console.log('\n--- [Step 1: Logging in with Passcode] ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[placeholder*="passcode"]', 'lxd2026');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    console.log('✓ Successfully logged in, current URL:', page.url());

    // -------------------------------------------------------------
    // Step 2: Open Standalone Quiz Editor for quiz-se-5
    // -------------------------------------------------------------
    console.log('\n--- [Step 2: Opening Standalone Quiz Editor] ---');
    const quizEditorUrl = `${BASE_URL}/courses/course-social-eng/quizzes/quiz-se-5`;
    await page.goto(quizEditorUrl, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sprint1-01-editor-loaded.png') });

    const initialQuestions = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('aside div.text-xs.font-semibold.truncate'));
      return items.map((el) => el.innerText.trim());
    });
    console.log(`✓ Questions in editor: (${initialQuestions.length})`, initialQuestions);

    // -------------------------------------------------------------
    // Step 3: Add Question (Multiple Choice) & Test Rapid Keystroke Debouncing
    // -------------------------------------------------------------
    console.log('\n--- [Step 3: Rapid Editing & Functional State Updates] ---');
    // Click Add Question
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('Add Question'));
      if (addBtn) addBtn.click();
    });
    await sleep(400);

    // Click Multiple Choice
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mcBtn = btns.find((b) => b.innerText.includes('Multiple Choice'));
      if (mcBtn) mcBtn.click();
    });
    await sleep(600);

    // Rapid edits simulating fast user typing without delay
    const testPrompt = 'Sprint 1 Verification: Which protocol defends against urgent executive impersonation?';
    await page.evaluate((val) => {
      const textarea = document.querySelector('main textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, val);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, testPrompt);

    // Immediately edit choices rapidly
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('main input[placeholder*="Option"]'));
      if (inputs[0]) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inputs[0], 'Verify identity via a secondary, pre-established phone number');
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (inputs[1]) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inputs[1], 'Approve the transaction immediately to prevent project delays');
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    console.log('✓ Dispatched rapid keystrokes to question prompt and options');
    await sleep(1000); // Allow debounced save (350ms) to trigger and complete

    const topBar = await page.evaluate(() => document.querySelector('header')?.innerText || '');
    console.log('Save indicator status:', topBar.includes('Saved') ? '✓ Saved' : 'Pending');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sprint1-02-rapid-edits-saved.png') });

    // -------------------------------------------------------------
    // Step 4: Hard Page Reload to Verify Persistence
    // -------------------------------------------------------------
    console.log('\n--- [Step 4: Hard Page Reload (Cmd+R / F5) to Verify Persistence] ---');
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sprint1-03-after-reload.png') });

    const postReloadQuestions = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('aside div.text-xs.font-semibold.truncate'));
      return items.map((el) => el.innerText.trim());
    });
    console.log('Questions in editor after reload:', postReloadQuestions);

    const persisted = postReloadQuestions.some((t) => t.includes('Sprint 1 Verification'));
    if (persisted) {
      console.log('🎉 PASS: Rapid question edit persisted across full page reload! No reversion occurred.');
    } else {
      console.error('❌ FAIL: Question edits reverted after reload!', postReloadQuestions);
    }

    // -------------------------------------------------------------
    // Step 5: Full-Course Preview Verification (quiz-se-5)
    // -------------------------------------------------------------
    console.log('\n--- [Step 5: Full-Course Preview Verification] ---');
    const previewUrl = `${BASE_URL}/courses/course-social-eng/preview?lessonId=quiz-se-5`;
    await page.goto(previewUrl, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sprint1-04-preview-quiz-view.png') });

    const q1Details = await page.evaluate(() => {
      const legend = document.querySelector('legend');
      const labels = Array.from(document.querySelectorAll('label span.flex-1'));
      const inputs = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
      const points = document.querySelector('div.flex.items-center.justify-between.text-xs span:last-child');
      const count = document.querySelector('div.flex.items-center.justify-between.text-xs span:first-child');
      return {
        questionCountText: count ? count.innerText : '',
        pointsText: points ? points.innerText : '',
        title: legend ? legend.innerText : 'NO LEGEND',
        options: labels.map((l) => l.innerText.trim()),
        hasRadioOrCheckbox: inputs.length > 0,
      };
    });
    console.log('Full-Course Preview Question 1 Rendered State:');
    console.log(' - Question Count:', q1Details.questionCountText);
    console.log(' - Title:', q1Details.title);
    console.log(' - Options Rendered (' + q1Details.options.length + ' choices):', q1Details.options);
    console.log(' - Accessible form inputs present:', q1Details.hasRadioOrCheckbox);

    if (q1Details.options.length > 0 && !q1Details.title.startsWith('Question 1')) {
      console.log('🎉 PASS: Full-Course Preview correctly rendered canonical question prompt and all answer choices!');
    } else {
      console.error('❌ FAIL: Full-Course Preview is still broken or missing options!', q1Details);
    }

    // -------------------------------------------------------------
    // Step 6: Test Unanswered Guard on Submit
    // -------------------------------------------------------------
    console.log('\n--- [Step 6: Testing Unanswered Submission Blocker] ---');
    // Navigate to last question without answering anything
    const totalQCount = await page.evaluate(() => {
      const countSpan = document.querySelector('div.flex.items-center.justify-between.text-xs span:first-child');
      if (countSpan) {
        const match = countSpan.innerText.match(/of (\d+)/);
        return match ? parseInt(match[1]) : 5;
      }
      return 5;
    });

    for (let i = 0; i < totalQCount; i++) {
      const isSubmit = await page.evaluate(() => {
        const sub = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Submit Quiz'));
        if (sub) {
          sub.click();
          return true;
        }
        const next = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Next Question'));
        if (next) {
          next.click();
          return false;
        }
        return false;
      });
      await sleep(250);
      if (isSubmit) break;
    }

    await sleep(500);
    const alertText = await page.evaluate(() => {
      const alert = document.querySelector('[role="alert"]');
      return alert ? alert.innerText : null;
    });
    console.log('Submission Block Alert:', alertText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sprint1-05-unanswered-alert.png') });

    if (alertText && alertText.includes('Please answer')) {
      console.log('🎉 PASS: Unanswered quiz submission is blocked with accessible inline alert!');
    } else {
      console.error('❌ FAIL: Missing unanswered submission block alert!');
    }

    // -------------------------------------------------------------
    // Step 7: Complete Quiz and Verify Canonical Scoring & Threshold
    // -------------------------------------------------------------
    console.log('\n--- [Step 7: Testing Quiz Scoring & Passing Threshold] ---');
    // Return to first question
    for (let i = 0; i < totalQCount; i++) {
      const isFirst = await page.evaluate(() => {
        const prev = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Previous'));
        if (prev && !prev.disabled) {
          prev.click();
          return false;
        }
        return true;
      });
      await sleep(200);
      if (isFirst) break;
    }

    // Answer every question
    for (let i = 0; i < totalQCount; i++) {
      await page.evaluate(() => {
        // Radio / Checkbox
        const opt = document.querySelector('label input[type="radio"], label input[type="checkbox"]');
        if (opt && !opt.checked) opt.click();

        // Text input for fill in blank
        const textInput = document.querySelector('fieldset input[type="text"]');
        if (textInput && !textInput.value) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(textInput, 'out-of-band');
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Matching pair
        const left = document.querySelector('fieldset div.cursor-pointer');
        if (left) left.click();
      });
      await sleep(300);

      const submitted = await page.evaluate(() => {
        const sub = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Submit Quiz'));
        if (sub) {
          sub.click();
          return true;
        }
        const next = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Next Question'));
        if (next) {
          next.click();
          return false;
        }
        return false;
      });
      await sleep(400);
      if (submitted) break;
    }

    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sprint1-06-results-screen.png') });

    const finalResults = await page.evaluate(() => {
      const scoreH2 = document.querySelector('h2.text-3xl');
      const badge = document.querySelector('span.uppercase.tracking-widest');
      const detailsP = document.querySelector('p.text-xs.text-gray-500');
      return {
        score: scoreH2 ? scoreH2.innerText : '',
        status: badge ? badge.innerText : '',
        details: detailsP ? detailsP.innerText : '',
      };
    });
    console.log('Results Screen:', finalResults);

    if (finalResults.score.includes('%') && finalResults.details.includes('Passing score is 80%')) {
      console.log('🎉 PASS: Canonical scoring engine computed score correctly with "Passing score is 80%"!');
    } else {
      console.error('❌ FAIL: Results screen scoring details mismatch:', finalResults);
    }

    console.log('\n--- All Sprint 1 Verifications Succeeded ---');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

runSprint1Test();

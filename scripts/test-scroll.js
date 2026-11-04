const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:3001/login');
  await page.type('input[type="password"]', 'lxd2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  await page.goto('http://localhost:3001/courses/course-social-eng/preview');
  await new Promise(r => setTimeout(r, 1500));

  const styles = await page.evaluate(() => {
    const main = document.querySelector('main');
    const card = main ? main.firstElementChild : null;
    const parent = main ? main.parentElement : null;
    const grandParent = parent ? parent.parentElement : null;

    return {
      grandParent: grandParent ? {
        tag: grandParent.tagName,
        className: grandParent.className,
        height: window.getComputedStyle(grandParent).height,
        flex: window.getComputedStyle(grandParent).flex,
        overflow: window.getComputedStyle(grandParent).overflow,
      } : null,
      parent: parent ? {
        tag: parent.tagName,
        className: parent.className,
        height: window.getComputedStyle(parent).height,
        flex: window.getComputedStyle(parent).flex,
        overflow: window.getComputedStyle(parent).overflow,
      } : null,
      main: main ? {
        tag: main.tagName,
        className: main.className,
        height: window.getComputedStyle(main).height,
        flex: window.getComputedStyle(main).flex,
        display: window.getComputedStyle(main).display,
        alignItems: window.getComputedStyle(main).alignItems,
        overflow: window.getComputedStyle(main).overflow,
      } : null,
      card: card ? {
        tag: card.tagName,
        className: card.className,
        height: window.getComputedStyle(card).height,
        maxHeight: window.getComputedStyle(card).maxHeight,
        minHeight: window.getComputedStyle(card).minHeight,
        flex: window.getComputedStyle(card).flex,
        overflow: window.getComputedStyle(card).overflow,
      } : null
    };
  });
  console.log('COMPUTED STYLES:', JSON.stringify(styles, null, 2));

  // Click 'Start Course' to go to a lesson with blocks
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('START COURSE') || b.innerText.includes('RESUME COURSE'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const lessonScrollInfo = await page.evaluate(() => {
    const main = document.querySelector('main');
    const elementUnderCursor = document.elementFromPoint(700, 500);
    return {
      elementUnderCursor: elementUnderCursor ? elementUnderCursor.tagName + '.' + elementUnderCursor.className : null,
      main: main ? {
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
        scrollTop: main.scrollTop,
        overflowY: window.getComputedStyle(main).overflowY,
      } : null
    };
  });
  console.log('Scroll Info on Lesson:', JSON.stringify(lessonScrollInfo, null, 2));

  // Try scrolling via mouse wheel at (700, 500)
  await page.mouse.move(700, 500);
  await page.mouse.wheel({ deltaY: 500 });
  await new Promise(r => setTimeout(r, 800));

  const afterWheel = await page.evaluate(() => {
    const main = document.querySelector('main');
    return {
      scrollTop: main ? main.scrollTop : -1,
      windowScrollY: window.scrollY,
      htmlScrollTop: document.documentElement.scrollTop
    };
  });
  console.log('Scroll position after mouse wheel:', afterWheel);

  await browser.close();
})();

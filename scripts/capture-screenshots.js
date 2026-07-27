const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/preview/verification-readiness';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'vm0007', path: '/vm0007' },
  { name: 'sample-assessment', path: '/sample-assessment' },
  { name: 'how-it-works', path: '/how-it-works' },
  { name: 'about', path: '/about' },
  { name: 'request-assessment', path: '/request-assessment' },
];

async function run() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    for (const size of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: size.name === 'mobile' ? 2 : 1,
      });

      for (const page of PAGES) {
        const url = `${BASE_URL}${page.path}`;
        const p = await context.newPage();
        try {
          await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          const filename = `${page.name}-${size.name}.png`;
          await p.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
          console.log(`Captured: ${filename}`);
        } catch (err) {
          console.error(`Failed to capture ${url}: ${err.message}`);
        } finally {
          await p.close();
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\nScreenshots saved to ${SCREENSHOT_DIR}`);
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err.message);
  process.exit(1);
});

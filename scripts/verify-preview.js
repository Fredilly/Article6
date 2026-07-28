const { chromium } = require('@playwright/test');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const PREVIEW_BASE = `${BASE_URL}/preview/verification-readiness`;

const PREVIEW_PAGES = [
  { name: 'VM0007', path: '/vm0007' },
  { name: 'Sample Assessment', path: '/sample-assessment' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'About', path: '/about' },
  { name: 'Request Assessment', path: '/request-assessment' },
];

const EXISTING_PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about-us' },
  { name: 'Contact', path: '/contact' },
  { name: 'Country', path: '/country' },
  { name: 'Technology', path: '/technology' },
  { name: 'Projects', path: '/projects' },
  { name: 'States (niger)', path: '/states/niger' },
];

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  let passed = 0;
  let failed = 0;
  const failures = [];

  const context = await browser.newContext();

  try {
    // Test 1: All preview pages load successfully
    console.log('\n=== Test: Preview pages load ===');
    for (const page of PREVIEW_PAGES) {
      const url = `${PREVIEW_BASE}${page.path}`;
      const p = await context.newPage();
      try {
        const res = await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        if (!res || res.status() >= 400) {
          throw new Error(`HTTP ${res?.status()}`);
        }
        console.log(`  PASS: ${page.name} (${url})`);
        passed++;
      } catch (err) {
        console.log(`  FAIL: ${page.name} (${url}): ${err.message}`);
        failed++;
        failures.push(`Preview page ${page.name}: ${err.message}`);
      } finally {
        await p.close();
      }
    }

    // Test 2: Existing pages still load
    console.log('\n=== Test: Existing pages unchanged ===');
    for (const page of EXISTING_PAGES) {
      const url = `${BASE_URL}${page.path}`;
      const p = await context.newPage();
      try {
        const res = await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        if (!res || res.status() >= 400) {
          throw new Error(`HTTP ${res?.status()}`);
        }
        console.log(`  PASS: ${page.name} (${url})`);
        passed++;
      } catch (err) {
        console.log(`  FAIL: ${page.name} (${url}): ${err.message}`);
        failed++;
        failures.push(`Existing page ${page.name}: ${err.message}`);
      } finally {
        await p.close();
      }
    }

    // Test 3: Robots meta tag on preview pages
    console.log('\n=== Test: Preview pages have noindex,nofollow ===');
    for (const page of PREVIEW_PAGES) {
      const url = `${PREVIEW_BASE}${page.path}`;
      const p = await context.newPage();
      try {
        await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        const robots = await p.$eval('meta[name="robots"]', (el) => el.getAttribute('content'));
        if (robots === 'noindex,nofollow') {
          console.log(`  PASS: ${page.name} has noindex,nofollow`);
          passed++;
        } else {
          console.log(`  FAIL: ${page.name} robots meta: ${robots}`);
          failed++;
          failures.push(`Robots meta: ${page.name} => ${robots}`);
        }
      } catch (err) {
        console.log(`  FAIL: ${page.name} - ${err.message}`);
        failed++;
        failures.push(`Robots check ${page.name}: ${err.message}`);
      } finally {
        await p.close();
      }
    }

    // Test 4: Preview navigation stays within preview tree
    console.log('\n=== Test: Preview navigation URLs stay within preview ===');
    const navPage = await context.newPage();
    try {
      await navPage.goto(`${PREVIEW_BASE}/sample-assessment`, { waitUntil: 'networkidle', timeout: 30000 });
      const links = await navPage.$$eval('header a[href], nav a[href]', (els) =>
        els.map((el) => el.getAttribute('href'))
      );
      const outsideLinks = links.filter(
        (href) => href && !href.startsWith(PREVIEW_BASE) && !href.startsWith('#') && !href.startsWith('javascript')
      );
      if (outsideLinks.length === 0) {
        console.log('  PASS: All nav links stay within preview tree');
        passed++;
      } else {
        console.log(`  FAIL: External nav links found: ${outsideLinks.join(', ')}`);
        failed++;
        failures.push(`Nav links outside preview: ${outsideLinks.join(', ')}`);
      }
    } finally {
      await navPage.close();
    }

    // Test 5: Preview footer contains correct disclaimer
    console.log('\n=== Test: Preview footer disclaimer ===');
    const footerPage = await context.newPage();
    try {
      await footerPage.goto(`${PREVIEW_BASE}/about`, { waitUntil: 'networkidle', timeout: 30000 });
      const bodyText = await footerPage.$eval('body', (el) => el.textContent || '');
      const disclaimer = 'Independent pre-validation review. Article6 is not affiliated with Verra';
      if (bodyText.includes(disclaimer)) {
        console.log('  PASS: Footer disclaimer found');
        passed++;
      } else {
        console.log('  FAIL: Footer disclaimer not found');
        failed++;
        failures.push('Footer disclaimer missing');
      }
    } finally {
      await footerPage.close();
    }

    // Test 6: Form in preview mode doesn't submit
    console.log('\n=== Test: Assessment form preview behavior ===');
    const formPage = await context.newPage();
    try {
      await formPage.goto(`${PREVIEW_BASE}/request-assessment`, { waitUntil: 'networkidle', timeout: 30000 });
      await formPage.click('button[type="submit"]');
      await formPage.waitForTimeout(500);
      const submittedText = await formPage.textContent('body');
      if (submittedText && submittedText.includes('Request received (preview mode)')) {
        console.log('  PASS: Form shows preview confirmation');
        passed++;
      } else {
        console.log('  FAIL: Form did not show preview confirmation');
        failed++;
        failures.push('Form preview state missing');
      }
    } finally {
      await formPage.close();
    }

    // Test 7: Homepage now renders verification-readiness landing page
    console.log('\n=== Test: Homepage renders verification-readiness landing ===');
    const homePage = await context.newPage();
    try {
      await homePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      const bodyText = await homePage.$eval('body', (el) => el.textContent || '');
      if (bodyText.includes('Find the evidence gaps') && bodyText.includes('Send us your PDD')) {
        console.log('  PASS: Verification readiness landing page on /');
        passed++;
      } else {
        console.log('  FAIL: Verification readiness content missing on /');
        failed++;
        failures.push('Homepage does not render verification readiness landing');
      }
    } finally {
      await homePage.close();
    }

    // Test 8: Preview pages NOT linked from existing site
    console.log('\n=== Test: No preview links on existing pages ===');
    const aboutPage = await context.newPage();
    try {
      await aboutPage.goto(`${BASE_URL}/about-us`, { waitUntil: 'networkidle', timeout: 30000 });
      const pageText = await aboutPage.$eval('body', (el) => el.textContent || '');
      const links = await aboutPage.$$eval('a[href]', (els) =>
        els.map((el) => el.getAttribute('href'))
      );
      const previewLinks = links.filter((href) => href && href.includes('/preview/verification-readiness'));
      if (previewLinks.length === 0) {
        console.log('  PASS: No preview links on existing pages');
        passed++;
      } else {
        console.log(`  FAIL: Preview links found on existing site: ${previewLinks.join(', ')}`);
        failed++;
        failures.push('Preview links leaked to production');
      }
    } finally {
      await aboutPage.close();
    }

    // Test 9: No government positioning on the new homepage
    console.log('\n=== Test: No government positioning on homepage ===');
    const previewHome = await context.newPage();
    try {
      await previewHome.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      const previewText = await previewHome.$eval('body', (el) => el.textContent || '');
      const govtTerms = ['government program','nation-state','state engagement','country carbon stack','GEP','public-sector'];
      const foundTerms = govtTerms.filter((t) => previewText.toLowerCase().includes(t.toLowerCase()));
      if (foundTerms.length === 0) {
        console.log('  PASS: No government positioning on homepage');
        passed++;
      } else {
        console.log(`  FAIL: Government terms found: ${foundTerms.join(', ')}`);
        failed++;
        failures.push(`Government terms on homepage: ${foundTerms.join(', ')}`);
      }
    } finally {
      await previewHome.close();
    }

    // Test 10: Preview base route redirects to /
    console.log('\n=== Test: /preview/verification-readiness redirects to / ===');
    const redirectPage = await context.newPage();
    try {
      const res = await redirectPage.goto(PREVIEW_BASE, { waitUntil: 'networkidle', timeout: 30000 });
      const finalUrl = redirectPage.url();
      if (finalUrl === `${BASE_URL}/` || finalUrl.endsWith('/')) {
        console.log(`  PASS: Redirected to / (${finalUrl})`);
        passed++;
      } else {
        console.log(`  FAIL: Expected redirect to /, got ${finalUrl}`);
        failed++;
        failures.push(`Preview redirect failed: got ${finalUrl}`);
      }
    } catch (err) {
      console.log(`  FAIL: ${err.message}`);
      failed++;
      failures.push(`Redirect test: ${err.message}`);
    } finally {
      await redirectPage.close();
    }

    // Test 11: Upload form is present on /
    console.log('\n=== Test: Upload form present on / ===');
    const uploadPage = await context.newPage();
    try {
      await uploadPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      const hasUploadForm = await uploadPage.$('#pdd-fullName');
      const hasSubmitBtn = await uploadPage.$('button[type="submit"]');
      if (hasUploadForm && hasSubmitBtn) {
        console.log('  PASS: PDD upload form present on homepage');
        passed++;
      } else {
        console.log('  FAIL: Upload form fields not found on homepage');
        failed++;
        failures.push('Upload form missing on homepage');
      }
    } catch (err) {
      console.log(`  FAIL: ${err.message}`);
      failed++;
      failures.push(`Upload form test: ${err.message}`);
    } finally {
      await uploadPage.close();
    }
    } finally {
      await previewHome.close();
    }
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test run failed:', err.message);
  process.exit(1);
});

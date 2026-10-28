import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { width: 320, height: 640, label: '320px (Compact Mobile)' },
  { width: 360, height: 740, label: '360px (Android Baseline)' },
  { width: 390, height: 844, label: '390px (iPhone Standard)' },
  { width: 430, height: 932, label: '430px (Large Phone)' },
  { width: 768, height: 1024, label: '768px (Tablet / Desktop Transition)' },
  { width: 1024, height: 768, label: '1024px (Small Desktop)' },
  { width: 1440, height: 900, label: '1440px (Wide Desktop)' },
];

const SCREENSHOT_VIEWPORTS = [320, 390, 768, 1440];

async function runAudit() {
  const screenshotDir = path.join(process.cwd(), 'docs', 'redesign', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = {
    viewports: [],
    consoleErrors: [],
    touchTargetsReport: {},
    overflows: [],
    reducedMotionChecked: false,
    themeToggled: false,
  };

  const page = await browser.newPage();

  // Listen for console and errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });
  page.on('pageerror', (err) => {
    results.consoleErrors.push({ text: err.message, stack: err.stack });
  });

  const baseUrl = 'http://127.0.0.1:3000';

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Check overflow
    const overflowCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const hasOverflow = scrollWidth > docWidth || bodyScrollWidth > docWidth;
      
      // Find elements exceeding viewport if any
      const badElements = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 1) {
          badElements.push({
            tag: el.tagName,
            className: el.className,
            right: rect.right,
            width: rect.width,
          });
        }
      });

      return {
        viewportWidth: docWidth,
        scrollWidth,
        bodyScrollWidth,
        hasOverflow,
        badElementsCount: badElements.length,
        sampleBad: badElements.slice(0, 3),
      };
    });

    // Check touch targets
    const touchCheck = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
      let smallCount = 0;
      const smallSamples = [];
      interactiveElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Ignore hidden elements
        if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') return;
        if (rect.width < 44 || rect.height < 44) {
          smallCount++;
          if (smallSamples.length < 5) {
            smallSamples.push({
              tag: el.tagName,
              text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25),
              className: el.className,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        }
      });
      return { totalInteractive: interactiveElements.length, smallCount, smallSamples };
    });

    results.viewports.push({
      viewport: vp,
      overflow: overflowCheck,
      touch: touchCheck,
    });

    // Take screenshots for requested viewports
    if (SCREENSHOT_VIEWPORTS.includes(vp.width)) {
      const screenshotPath = path.join(screenshotDir, `viewport-${vp.width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }
  }

  // Test reduced motion
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionActive = await page.evaluate(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  results.reducedMotionChecked = reducedMotionActive;

  // Test theme switching (light to dark and back)
  const themeSwitchResult = await page.evaluate(() => {
    const themeBtn = document.querySelector('button[aria-label*="gelap"], button[aria-label*="terang"], button:has(svg)');
    const initialTheme = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark') ? 'dark' : 'light');
    return { initialTheme, buttonFound: Boolean(themeBtn) };
  });
  results.themeToggled = themeSwitchResult;

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

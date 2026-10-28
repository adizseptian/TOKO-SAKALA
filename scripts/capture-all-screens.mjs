import { chromium } from 'playwright';
import fs from 'node:fs';

const outDir = 'docs/redesign/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

  // Screen 1: Beranda
  await page.screenshot({ path: `${outDir}/mockup-screen-1-beranda.png`, fullPage: false });
  console.log('Saved mockup-screen-1-beranda.png');

  // Screen 2: Catat Belanja
  await page.locator('nav.bottom-nav button:has-text("Catat")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/mockup-screen-2-catat.png`, fullPage: false });
  console.log('Saved mockup-screen-2-catat.png');

  // Screen 3: Cek Sisa Stok
  await page.locator('nav.bottom-nav button:has-text("Stok")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/mockup-screen-3-stok.png`, fullPage: false });
  console.log('Saved mockup-screen-3-stok.png');

  // Screen 4: Setoran Karyawan
  await page.locator('nav.bottom-nav button:has-text("Setoran")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/mockup-screen-4-setoran.png`, fullPage: false });
  console.log('Saved mockup-screen-4-setoran.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

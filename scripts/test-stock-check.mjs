import { chromium } from 'playwright';

async function testStockCheckPage() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

  // Navigate to cek-sisa via bottom nav or quick tile
  await page.click('button.navbtn:has-text("Stok")');
  await page.waitForTimeout(150);

  // Check stock items, badges, and counters
  const report = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.stock-check-card')).map(c => {
      const title = c.querySelector('.stock-card-title span:first-child')?.textContent?.trim();
      const status = c.querySelector('.status-tag')?.textContent?.trim();
      const unit = c.querySelector('.stock-card-unit')?.textContent?.trim();
      const count = c.querySelector('.stepper-input')?.value?.trim();
      return { title, status, unit, count };
    });
    const summaryText = document.querySelector('.sticky-footer-bar')?.textContent?.trim() || '';
    const saveBtn = document.querySelector('.sticky-footer-bar button');
    return {
      cardsCount: cards.length,
      sampleCards: cards.slice(0, 3),
      summaryText,
      saveBtnText: saveBtn?.textContent?.trim()
    };
  });

  // Test stepper interaction (decrement Indomie)
  await page.click('.stock-check-card:first-child .stepper-btn:first-child');
  await page.waitForTimeout(100);

  const updatedIndomie = await page.evaluate(() => {
    return document.querySelector('.stock-check-card:first-child .stepper-input')?.value;
  });

  // Click Simpan preview button
  await page.click('.sticky-footer-bar button:has-text("Simpan")');
  await page.waitForTimeout(150);

  const toastText = await page.evaluate(() => {
    return document.querySelector('.toast-notice')?.textContent?.trim() || '';
  });

  await browser.close();
  console.log(JSON.stringify({ report, updatedIndomie, toastText, status: 'PASS' }, null, 2));
}

testStockCheckPage().catch((e) => {
  console.error(e);
  process.exit(1);
});

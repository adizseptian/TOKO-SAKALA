import { chromium } from 'playwright';

async function testStockCheckPage() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

  // Navigate to cek-sisa
  await page.click('button:has-text("Lihat alur stok")');
  await page.waitForTimeout(150);

  // In StockHub, click "Cek sisa fisik"
  await page.click('button:has-text("Cek sisa fisik")');
  await page.waitForTimeout(150);

  // Click "Lihat contoh tabel"
  await page.click('button:has-text("Lihat contoh tabel")');
  await page.waitForTimeout(200);

  // Check table footer and summary
  const report = await page.evaluate(() => {
    const tableFooterText = document.querySelector('.stock-sheet-table tfoot')?.textContent || '';
    const cards = Array.from(document.querySelectorAll('.stock-summary-card')).map(c => c.textContent);
    const reviewBtn = document.querySelector('.stock-review-actions button.button-primary');
    const saveBtn = document.querySelector('.stock-review-actions button.button-disabled');
    return {
      tableFooterText,
      cards,
      reviewBtnDisabled: reviewBtn?.hasAttribute('disabled'),
      saveBtnDisabled: saveBtn?.hasAttribute('disabled'),
      saveBtnText: saveBtn?.textContent?.trim(),
    };
  });

  // Now test review click
  await page.click('.stock-review-actions button.button-primary');
  await page.waitForTimeout(150);

  const reviewResult = await page.evaluate(() => {
    return document.querySelector('.stock-review-result')?.textContent || '';
  });

  // Now test an oversized number
  await page.evaluate(() => {
    const input = document.querySelector('input.sheet-number');
    if (input) {
      input.value = '99999999999999999999';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(150);

  const errorReport = await page.evaluate(() => {
    const errNotice = document.querySelector('.stock-inline-error')?.textContent || '';
    const reviewBtn = document.querySelector('.stock-review-actions button.button-primary');
    return {
      errNotice,
      reviewBtnDisabled: reviewBtn?.hasAttribute('disabled'),
    };
  });

  await browser.close();
  console.log(JSON.stringify({ report, reviewResultSummary: reviewResult.slice(0, 200), errorReport }, null, 2));
}

testStockCheckPage().catch((e) => {
  console.error(e);
  process.exit(1);
});

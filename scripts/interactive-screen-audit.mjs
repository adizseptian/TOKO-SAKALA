import { chromium } from 'playwright';

async function auditScreens() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

  const screenResults = [];
  const screens = ['beranda', 'catat', 'cek-sisa', 'setoran', 'biaya', 'laporan', 'riwayat', 'barang', 'asisten', 'pengaturan'];

  for (const s of screens) {
    // Navigate via clicking bottom nav or side rail
    const navBtn = await page.$(`button[data-screen="${s}"], button:has-text("${s}")`);
    // Or set state via evaluating
    await page.evaluate((targetScreen) => {
      // Find button that switches to screen or simulate click
      const btns = Array.from(document.querySelectorAll('button'));
      const match = btns.find((b) => b.getAttribute('data-screen') === targetScreen || b.textContent.toLowerCase().includes(targetScreen.toLowerCase()));
      if (match) match.click();
    }, s);

    await page.waitForTimeout(100);

    const check = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      return {
        clientWidth: docWidth,
        scrollWidth: scrollWidth,
        overflow: scrollWidth > docWidth,
      };
    });

    screenResults.push({ screen: s, check });
  }

  // Test Stock Check Page interactions:
  // 1. Click "Lihat contoh tabel"
  const contohBtn = await page.$('button:has-text("Lihat contoh tabel")');
  let contohLoaded = false;
  if (contohBtn) {
    await contohBtn.click();
    await page.waitForTimeout(200);
    contohLoaded = true;
  }

  // 2. Check stock summary calculation
  const stockSummary = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCompleteItems: text.includes('barang terisi') || text.includes('barang lengkap'),
      hasRetailValue: text.includes('Rp') || text.includes('524.000'),
    };
  });

  // 3. Test long product name in stock
  const longNameResult = await page.evaluate(() => {
    const firstInput = document.querySelector('input.sheet-name');
    if (firstInput) {
      firstInput.value = 'Keripik Singkong Balado Ekstra Pedas Gurih Renyah Kemasan Jumbo 500 Gram Khas Daerah';
      firstInput.dispatchEvent(new Event('input', { bubbles: true }));
      firstInput.dispatchEvent(new Event('change', { bubbles: true }));
      return { entered: true, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
    }
    return { entered: false };
  });

  // 4. Test large Rupiah nominal
  const largeRupiahResult = await page.evaluate(() => {
    const priceInput = document.querySelector('.sheet-price-cell input');
    if (priceInput) {
      priceInput.value = '999999999';
      priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      return { entered: true, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
    }
    return { entered: false };
  });

  // 5. Test theme toggle
  const themeResult = await page.evaluate(() => {
    const themeBtn = document.querySelector('button[aria-label*="gelap"], button[aria-label*="terang"]');
    if (themeBtn) {
      themeBtn.click();
      const current = document.querySelector('.app-frame')?.getAttribute('data-theme');
      return { toggled: true, newTheme: current };
    }
    return { toggled: false };
  });

  await browser.close();

  console.log(JSON.stringify({
    errors,
    screenResults,
    contohLoaded,
    stockSummary,
    longNameResult,
    largeRupiahResult,
    themeResult,
  }, null, 2));
}

auditScreens().catch((err) => {
  console.error(err);
  process.exit(1);
});

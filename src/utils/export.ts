import { jsPDF } from 'jspdf';
import type { Product, AppEvent } from '@/domain/event';
import type { EngineOutput, ProductCalculation } from '@/engine/contract';
import { formatRupiah, formatNumber, formatDateTime, formatDate } from '@/lib/utils';

/**
 * Escapes a cell value for RFC 4180 compliant CSV format.
 * Quotes are doubled and values with special characters are enclosed in double quotes.
 */
export function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === undefined || value === null) {
    return '""';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Formats integer Rupiah for CSV export (clean numeric representation without currency symbols
 * to allow direct spreadsheet math, with optional text formatting).
 */
export function formatCurrencyForCSV(amount: number): number {
  return Math.round(amount);
}

/**
 * Serializes product list and calculations to a CSV string.
 */
export function serializeProductsToCSV(
  products: Product[],
  calculations: ProductCalculation[]
): string {
  const headers = [
    'No',
    'ID Barang',
    'Nama Barang',
    'Harga Jual Satuan (IDR)',
    'Keuntungan Jual / Potensi Omzet (IDR)',
    'Sisa Stok Fisik (pcs)',
    'Total Terjual (pcs)',
    'Penjualan Terhitung (IDR)',
    'Nilai Sisa Harga Jual (IDR)',
    'HPP Modal Terjual (IDR)',
    'Nilai Modal Stok Sisa (IDR)',
    'Laba Kotor Barang (IDR)'
  ];

  const calcMap = new Map<string, ProductCalculation>();
  calculations.forEach((c) => calcMap.set(c.productId, c));

  const rows = products.map((prod, index) => {
    const calc = calcMap.get(prod.id);
    const potential = calc?.potentialSalesRevenue?.min ?? (prod.sellingPrice * (calc?.availableUnits ?? 0));
    const unitsSold = calc?.unitsSold ?? 0;
    const remainingUnits = calc?.availableUnits ?? 0;
    const salesRev = calc?.salesRevenue?.min ?? 0;
    const remainingSellVal = calc?.remainingAtSellingPrice?.min ?? (remainingUnits * prod.sellingPrice);
    const costSold = calc?.costOfSoldKnown ?? 0;
    const invCost = calc?.knownInventoryValue ?? 0;
    const grossProfit = calc?.grossProfit?.min ?? (salesRev - costSold);

    return [
      escapeCSV(index + 1),
      escapeCSV(prod.id),
      escapeCSV(prod.name),
      escapeCSV(prod.sellingPrice),
      escapeCSV(potential),
      escapeCSV(remainingUnits),
      escapeCSV(unitsSold),
      escapeCSV(salesRev),
      escapeCSV(remainingSellVal),
      escapeCSV(costSold),
      escapeCSV(invCost),
      escapeCSV(grossProfit)
    ].join(',');
  });

  return [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
}

/**
 * Serializes transaction history events to a CSV string.
 */
export function serializeTransactionsToCSV(
  events: AppEvent[],
  products: Product[]
): string {
  const headers = [
    'No Urut',
    'ID Transaksi',
    'Waktu Catat',
    'Jenis Transaksi',
    'Nama Barang / Keterangan',
    'Jumlah Kemasan',
    'Isi per Kemasan',
    'Total Unit (pcs)',
    'Nominal Transaksi (IDR)',
    'Sumber Dana',
    'Keterangan Rinci'
  ];

  const productMap = new Map<string, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  const rows = events.map((ev) => {
    let typeLabel = ev.type as string;
    let desc = '';
    let packs: string | number = '';
    let unitsPerPack: string | number = '';
    let totalUnits: string | number = '';
    let amount: string | number = '';
    let source = '';
    let extra = '';

    switch (ev.type) {
      case 'purchase': {
        const prod = productMap.get(ev.productId);
        typeLabel = 'Belanja Barang Masuk';
        desc = prod?.name || ev.productId;
        packs = ev.packs;
        unitsPerPack = ev.unitsPerPack;
        totalUnits = ev.packs * ev.unitsPerPack;
        amount = ev.totalCost;
        source = ev.sourceMoney === 'STORE' ? 'Kas Toko' : 'Uang Pribadi';
        const unitCost = Math.round(ev.totalCost / totalUnits);
        extra = `Kemasan: ${ev.packs} x ${ev.unitsPerPack} pcs @ Rp ${unitCost.toLocaleString('id-ID')}/pcs`;
        break;
      }
      case 'stock_check': {
        const prod = productMap.get(ev.productId);
        typeLabel = 'Cek Sisa Fisik';
        desc = prod?.name || ev.productId;
        totalUnits = ev.observedUnits;
        extra = `Sisa fisik rak: ${ev.observedUnits} pcs`;
        break;
      }
      case 'expense': {
        typeLabel = 'Pengeluaran Operasional';
        desc = ev.description;
        amount = ev.amount;
        source = ev.sourceMoney === 'STORE' ? 'Kas Toko' : 'Uang Pribadi';
        break;
      }
      case 'other_income': {
        typeLabel = 'Pendapatan Lain';
        desc = ev.description;
        amount = ev.amount;
        source = 'Kas Toko';
        break;
      }
      case 'deposit': {
        typeLabel = 'Setoran dari Karyawan';
        desc = ev.employeeName ? `Diserahkan oleh ${ev.employeeName}${ev.notes ? ` (${ev.notes})` : ''}` : (ev.notes || 'Serah terima uang usaha ke owner');
        amount = ev.amount;
        source = 'Kas Karyawan / Toko';
        break;
      }
      case 'price_change': {
        const prod = productMap.get(ev.productId);
        typeLabel = 'Perubahan Harga Jual';
        desc = prod?.name || ev.productId;
        amount = ev.sellingPrice;
        extra = `Harga baru: Rp ${ev.sellingPrice.toLocaleString('id-ID')}`;
        break;
      }
      case 'opening_stock': {
        const prod = productMap.get(ev.productId);
        typeLabel = 'Stok Awal Toko';
        desc = prod?.name || ev.productId;
        totalUnits = ev.units;
        amount = ev.unitCost ? ev.units * ev.unitCost : '';
        extra = ev.unitCost ? `Modal awal @ Rp ${ev.unitCost.toLocaleString('id-ID')}/pcs` : '';
        break;
      }
      case 'loss': {
        const prod = productMap.get(ev.productId);
        typeLabel = 'Barang Rusak / Dipakai';
        desc = prod?.name || ev.productId;
        totalUnits = ev.units;
        extra = `Alasan: ${ev.reason}`;
        break;
      }
      case 'cash_adjustment': {
        typeLabel = 'Penyesuaian Kas Laci';
        desc = ev.reason;
        amount = ev.amount;
        break;
      }
      case 'no_sales_statement': {
        const prod = productMap.get(ev.productId);
        typeLabel = 'Pernyataan Nihil Penjualan';
        desc = prod?.name || ev.productId;
        break;
      }
    }

    return [
      escapeCSV(ev.seq),
      escapeCSV(ev.id),
      escapeCSV(formatDateTime(ev.occurredAt)),
      escapeCSV(typeLabel),
      escapeCSV(desc),
      escapeCSV(packs),
      escapeCSV(unitsPerPack),
      escapeCSV(totalUnits),
      escapeCSV(amount),
      escapeCSV(source),
      escapeCSV(extra)
    ].join(',');
  });

  return [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
}

/**
 * Serializes the complete master report (financial summary + products) into a single CSV.
 */
export function serializeMasterReportToCSV(
  engineOutput: EngineOutput,
  products: Product[]
): string {
  const { totals, products: calculations } = engineOutput;
  const potential = totals.potentialSalesRevenue?.min ?? 0;
  const remainingAtSell = totals.remainingInventoryAtSellingPrice?.min ?? 0;
  const salesRev = totals.salesRevenue.min;
  const grossProfit = totals.grossProfit?.min ?? (salesRev + totals.otherIncome - totals.costOfGoodsSoldKnown);
  const netProfit = totals.netProfit ? totals.netProfit.min : (totals.profit ? totals.profit.min : grossProfit - totals.expenses);
  const storeCash = totals.storeCashAfterDeposits.min;

  const lines: string[] = [
    escapeCSV('TOKO SAKALA - LAPORAN KEUANGAN & STOK RITEL'),
    escapeCSV(`Tanggal Ekspor: ${formatDate(new Date().toISOString())}`),
    escapeCSV('Peringatan: Nilai total penjualan setelah dikurangi nilai sisa berdasarkan harga jual bukan otomatis laba kotor, karena belum mengurangi modal barang yang terjual.'),
    '',
    escapeCSV('=== RINGKASAN KEUANGAN KUNCI ==='),
    `${escapeCSV('Indikator')},${escapeCSV('Nilai (IDR)')},${escapeCSV('Keterangan')}`,
    `${escapeCSV('1. Keuntungan Jual (Potensi Omzet)')},${escapeCSV(potential)},${escapeCSV('Nilai jual jika semua barang terjual; belum dikurangi modal')}`,
    `${escapeCSV('2. Nilai Sisa Berdasarkan Harga Jual')},${escapeCSV(remainingAtSell)},${escapeCSV('Pengurang potensi nilai jual berdasarkan sisa fisik di rak')}`,
    `${escapeCSV('3. Penjualan setelah dikurangi sisa (Penjualan Terhitung)')},${escapeCSV(salesRev)},${escapeCSV('Hasil penjualan dari unit yang sudah keluar berdasarkan selisih sisa fisik')}`,
    `${escapeCSV('4. Pendapatan Lain-lain')},${escapeCSV(totals.otherIncome)},${escapeCSV('Pendapatan non-barang (jasa, titipan, dll)')}`,
    `${escapeCSV('5. Beban Pokok Penjualan (HPP Modal Terjual)')},${escapeCSV(totals.costOfGoodsSoldKnown)},${escapeCSV('Modal barang yang telah laku terjual')}`,
    `${escapeCSV('6. Laba Kotor Operasional')},${escapeCSV(grossProfit)},${escapeCSV('Penjualan barang terjual dikurangi modal barang terjual')}`,
    `${escapeCSV('7. Pengeluaran / Beban Operasional')},${escapeCSV(totals.expenses)},${escapeCSV('Biaya perlengkapan, listrik, operasional toko')}`,
    `${escapeCSV('8. Kerugian Barang (Rusak/Pakai Sendiri)')},${escapeCSV(totals.damageLossKnown + totals.usedLossKnown + totals.unknownLossKnown)},${escapeCSV('Beban modal akibat kerusakan/pemakaian barang')}`,
    `${escapeCSV('9. Estimasi Laba Bersih Final')},${escapeCSV(netProfit)},${escapeCSV('Keuntungan murni usaha toko setelah seluruh modal & biaya')}`,
    `${escapeCSV('10. Uang yang Seharusnya Tersedia di Laci')},${escapeCSV(storeCash)},${escapeCSV('Saldo kas fisik riil yang wajib ada di laci kasir')}`,
    `${escapeCSV('11. Setoran Aktual Pemilik')},${escapeCSV(totals.totalDeposits)},${escapeCSV('Total uang fisik yang telah disetor / diambil pemilik')}`,
    '',
    escapeCSV('=== RINCIAN KINERJA TIAP BARANG ==='),
    serializeProductsToCSV(products, calculations)
  ];

  return lines.join('\r\n');
}

/**
 * Downloads a string as a CSV file with UTF-8 Byte Order Mark (BOM)
 * for seamless compatibility with Microsoft Excel, LibreOffice, and Google Sheets.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, professional PDF document of the store report.
 */
export function generateReportPDF(options: {
  engineOutput: EngineOutput;
  products: Product[];
  events: AppEvent[];
  storeName?: string;
}): void {
  const { engineOutput, products, storeName = 'TOKO SAKALA' } = options;
  const { totals, products: calculations } = engineOutput;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 35, 35);
  doc.text(storeName, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 105, 105);
  y += 6;
  doc.text('Laporan Keuangan & Stok Ritel Terkunci v1.0', margin, y);

  const printDate = formatDateTime(new Date().toISOString());
  doc.setFontSize(8);
  doc.text(`Waktu Cetak: ${printDate} | Status: ${totals.certainty === 'PASTI' ? 'Pasti & Sah' : 'Sebagian Kisaran'}`, margin, y + 5);

  y += 12;

  // Thin separator
  doc.setDrawColor(200, 215, 215);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Mandatory Warning Callout Box
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);  // amber-500
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('Peringatan Rekonsiliasi Ritel:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'Nilai total penjualan setelah dikurangi nilai sisa berdasarkan harga jual bukan otomatis laba kotor, karena belum mengurangi modal barang yang terjual.',
    margin + 3,
    y + 9,
    { maxWidth: pageWidth - margin * 2 - 6 }
  );

  y += 20;

  // Section 1: 3 Kunci Angka Ritel (3 Columns)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 35, 35);
  doc.text('1. Tiga Indikator Utama Ritel', margin, y);
  y += 5;

  const colWidth = (pageWidth - margin * 2 - 8) / 3;

  // Card 1: Keuntungan Jual
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, colWidth, 22, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(3, 105, 161);
  doc.text('KEUNTUNGAN JUAL', margin + 3, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const potentialVal = totals.potentialSalesRevenue?.min ?? 0;
  doc.text(formatRupiah(potentialVal), margin + 3, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Nilai jual jika semua terjual (belum dikurangi modal)', margin + 3, y + 16, { maxWidth: colWidth - 6 });

  // Card 2: Penjualan Terhitung
  const col2X = margin + colWidth + 4;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(col2X, y, colWidth, 22, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87);
  doc.text('PENJUALAN TERHITUNG', col2X + 3, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(totals.salesRevenue.min), col2X + 3, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Penjualan dari unit yang keluar berdasarkan selisih sisa fisik', col2X + 3, y + 16, { maxWidth: colWidth - 6 });

  // Card 3: Laba Bersih
  const col3X = col2X + colWidth + 4;
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(col3X, y, colWidth, 22, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(13, 148, 136);
  doc.text('LABA BERSIH ESTIMASI', col3X + 3, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const netProfit = totals.netProfit ? totals.netProfit.min : (totals.profit ? totals.profit.min : 0);
  doc.text(formatRupiah(netProfit), col3X + 3, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Laba kotor setelah dikurangi seluruh biaya operasional', col3X + 3, y + 16, { maxWidth: colWidth - 6 });

  y += 28;

  // Section 2: Rekonsiliasi Laba Rugi Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 35, 35);
  doc.text('2. Rincian Laba Rugi Operasional', margin, y);
  y += 5;

  const grossProfit = totals.grossProfit?.min ?? (totals.salesRevenue.min + totals.otherIncome - totals.costOfGoodsSoldKnown);
  const incomeItems = [
    ['Potensi Nilai Jual Barang (Keuntungan Jual)', formatRupiah(potentialVal), 'normal'],
    ['Nilai Sisa Berdasarkan Harga Jual (Pengurang)', `-${formatRupiah(totals.remainingInventoryAtSellingPrice?.min ?? 0)}`, 'normal'],
    ['Penjualan setelah dikurangi sisa (Penjualan Terhitung)', formatRupiah(totals.salesRevenue.min), 'bold'],
    ['Pendapatan Lain-lain (Jasa / Titipan)', formatRupiah(totals.otherIncome), 'normal'],
    ['Beban Pokok Penjualan (HPP Modal Terjual)', `-${formatRupiah(totals.costOfGoodsSoldKnown)}`, 'normal'],
    ['Laba Kotor Operasional Toko', formatRupiah(grossProfit), 'bold'],
    ['Pengeluaran Operasional Toko', `-${formatRupiah(totals.expenses)}`, 'normal'],
    ['Kerugian Kerusakan / Pemakaian Sendiri', `-${formatRupiah(totals.damageLossKnown + totals.usedLossKnown + totals.unknownLossKnown)}`, 'normal'],
    ['Estimasi Laba Bersih Final', formatRupiah(netProfit), 'highlight'],
    ['Uang Seharusnya Diserahkan Karyawan', formatRupiah(totals.expectedEmployeeRemittance?.min ?? totals.salesRevenue.min), 'cash'],
    ['Setoran Aktual Diterima Owner', formatRupiah(totals.totalDeposits), 'cash'],
    ['Saldo Kas yang Masih Dipegang Karyawan', formatRupiah(totals.storeCashAfterDeposits.min), 'cash']
  ];

  incomeItems.forEach(([label, val, style]) => {
    if (style === 'highlight') {
      doc.setFillColor(220, 252, 231); // emerald-100
      doc.rect(margin, y - 3.5, pageWidth - margin * 2, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
    } else if (style === 'bold') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
    } else if (style === 'cash') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    }

    doc.setFontSize(8);
    doc.text(label, margin + 2, y);
    doc.text(val, pageWidth - margin - 2, y, { align: 'right' });
    y += 5.2;
  });

  y += 4;

  // Section 3: Tabel Kinerja Produk
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 35, 35);
  doc.text('3. Kinerja Tiap Barang', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 3, pageWidth - margin * 2, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const tCols = [
    { header: 'Barang', x: margin + 2, align: 'left' as const },
    { header: 'Harga Jual', x: margin + 55, align: 'right' as const },
    { header: 'Terjual', x: margin + 78, align: 'right' as const },
    { header: 'Sisa Stok', x: margin + 100, align: 'right' as const },
    { header: 'Penjualan', x: margin + 128, align: 'right' as const },
    { header: 'HPP Terjual', x: margin + 155, align: 'right' as const },
    { header: 'Laba Kotor', x: pageWidth - margin - 2, align: 'right' as const }
  ];

  tCols.forEach((col) => {
    doc.text(col.header, col.x, y + 1, { align: col.align });
  });

  y += 6;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  calculations.forEach((calc, idx) => {
    // Check page overflow
    if (y > 275) {
      doc.addPage();
      y = 16;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 35, 35);
      doc.text('3. Kinerja Tiap Barang (Lanjutan)', margin, y);
      y += 6;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, pageWidth - margin * 2, 5, 'F');
    }

    const prodInfo = products.find((p) => p.id === calc.productId);
    const itemGross = calc.grossProfit?.min ?? (calc.salesRevenue.min - calc.costOfSoldKnown);

    doc.setTextColor(30, 41, 59);
    // Truncate name if too long
    const name = calc.name.length > 28 ? calc.name.substring(0, 26) + '...' : calc.name;
    doc.text(name, margin + 2, y);

    doc.setTextColor(100, 116, 139);
    doc.text(formatRupiah(prodInfo?.sellingPrice || 0), margin + 55, y, { align: 'right' });

    doc.setTextColor(4, 120, 87);
    doc.text(`${formatNumber(calc.unitsSold)} pcs`, margin + 78, y, { align: 'right' });

    doc.setTextColor(30, 41, 59);
    doc.text(`${formatNumber(calc.availableUnits)} pcs`, margin + 100, y, { align: 'right' });

    doc.setTextColor(4, 120, 87);
    doc.text(formatRupiah(calc.salesRevenue.min), margin + 128, y, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text(formatRupiah(calc.costOfSoldKnown), margin + 155, y, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text(formatRupiah(itemGross), pageWidth - margin - 2, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 5;
  });

  // Footer note on last page
  y = Math.min(y + 8, 282);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('TOKO SAKALA — Pencatatan toko yang sederhana, modern, dan dapat dipercaya.', margin, y);

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`laporan-toko-sakala-${dateStr}.pdf`);
}

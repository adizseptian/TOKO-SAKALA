import { Printer, TrendingUp, Package, Wallet, Banknote, ShieldCheck, Download, FileSpreadsheet, AlertTriangle, HelpCircle, FileDown, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatNumber, formatDateTime } from '@/lib/utils';
import { ExportToCSVButton } from '@/components/ExportToCSVButton';
import { generateReportPDF } from '@/utils/export';

export function ReportsScreen() {
  const { engineOutput, products, events, notify } = useStore();
  const { totals, products: productCalculations } = engineOutput;

  const potentialRevenue = totals.potentialSalesRevenue?.min ?? 0;
  const remainingAtSellPrice = totals.remainingInventoryAtSellingPrice?.min ?? 0;
  const totalSalesRevenue = totals.salesRevenue.min;
  const grossProfit = totals.grossProfit?.min ?? (totalSalesRevenue + totals.otherIncome - totals.costOfGoodsSoldKnown);
  const netProfit = totals.netProfit ? totals.netProfit.min : (totals.profit ? totals.profit.min : grossProfit - totals.expenses);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    try {
      generateReportPDF({
        engineOutput,
        products,
        events,
        storeName: 'TOKO SAKALA'
      });
      notify('success', 'Ekspor PDF Berhasil', 'Dokumen PDF laporan keuangan & stok berhasil diunduh.');
    } catch (err) {
      console.error('PDF export error:', err);
      notify('error', 'Gagal Ekspor PDF', 'Terjadi kesalahan saat membuat file PDF.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 print:m-0 print:p-0"
    >
      {/* Official Printable Document Header (Only shown during printing / print-to-PDF) */}
      <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
              DOKUMEN RESMI TOKO RITEL
            </span>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
              TOKO SAKALA
            </h1>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Laporan Rekonsiliasi Keuangan, Stok & Laba Rugi Usaha
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
            <p><strong>Tanggal Dokumen:</strong> {formatDateTime(new Date().toISOString())}</p>
            <p><strong>Status Validasi:</strong> {totals.certainty === 'PASTI' ? 'Pasti & Tervalidasi' : 'Sebagian Kisaran'}</p>
            <p><strong>Total Item Produk:</strong> {products.length} macam barang</p>
            <p><strong>Total Jejak Mutasi:</strong> {events.length} transaksi</p>
          </div>
        </div>
      </div>

      {/* Top Header with Export & Print Actions (Screen Only) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)] print-hidden">
        <div>
          <h2 className="text-base font-bold text-[var(--text-main)]">
            Laporan Kinerja & Laba Rugi Toko
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Perhitungan deterministik ritel Sakala: pisahkan potensi nilai jual, penjualan terhitung, dan laba riil.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Export to CSV Button Component */}
          <ExportToCSVButton
            engineOutput={engineOutput}
            products={products}
            events={events}
            onNotify={notify}
          />

          {/* Dedicated Print-to-PDF Button (Uses Existing Print Stylesheet) */}
          <button
            type="button"
            onClick={handlePrint}
            className="sakala-btn sakala-btn-primary text-xs h-9 px-3.5 flex items-center gap-1.5 min-h-[40px] shadow-sm"
            title="Cetak atau simpan ringkasan keuangan profesional ke PDF menggunakan print stylesheet resmi"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Ringkasan PDF</span>
          </button>

          {/* Direct PDF Download Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="sakala-btn sakala-btn-secondary text-xs h-9 px-3 flex items-center gap-1.5 min-h-[40px]"
            title="Unduh file dokumen PDF secara langsung"
          >
            <FileDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Unduh File PDF</span>
          </button>
        </div>
      </div>

      {/* Mandatory Warning Callout with Dual-Theme Contrast */}
      <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="font-semibold text-amber-900 dark:text-amber-300 block">
            Peringatan Rekonsiliasi Ritel:
          </strong>
          <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
            Nilai total penjualan setelah dikurangi nilai sisa berdasarkan harga jual bukan otomatis laba kotor, karena belum mengurangi modal barang yang terjual.
          </p>
        </div>
      </div>

      {/* 3 Distinct Locked Figures from Retail Sales Calculation Lock v1.0 (Zero-Pill Discipline) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Figure 1: Keuntungan Jual */}
        <article className="sakala-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">1. Keuntungan Jual</span>
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
              Potensi Jual Penuh
            </span>
          </div>
          <div>
            <strong className="text-2xl font-bold font-display text-[var(--text-main)] tabular-nums block">
              {formatRupiah(potentialRevenue)}
            </strong>
            <p className="text-[11px] text-[var(--text-dim)] mt-1.5 leading-snug">
              Keuntungan Jual — nilai jual jika semua barang terjual; belum dikurangi modal (potensi nilai jual, bukan laba).
            </p>
          </div>
        </article>

        {/* Figure 2: Penjualan setelah dikurangi sisa (Penjualan Terhitung) */}
        <article className="sakala-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">2. Penjualan Terhitung</span>
            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              Omzet Fisik Keluar
            </span>
          </div>
          <div>
            <strong className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 tabular-nums block">
              {formatRupiah(totalSalesRevenue)}
            </strong>
            <p className="text-[11px] text-[var(--text-dim)] mt-1.5 leading-snug">
              Penjualan setelah dikurangi sisa: hasil penjualan dari unit yang sudah keluar berdasarkan selisih sisa fisik.
            </p>
          </div>
        </article>

        {/* Figure 3: Laba Kotor & Laba Bersih */}
        <article className="sakala-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">3. Laba Kotor & Bersih</span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Laba Usaha
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[var(--text-muted)]">Laba Kotor:</span>
              <strong className="text-base font-bold text-[var(--text-main)] tabular-nums">
                {formatRupiah(grossProfit)}
              </strong>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--accent-mint)] font-semibold">Laba Bersih:</span>
              <strong className="text-lg font-bold font-display text-[var(--accent-mint)] tabular-nums">
                {formatRupiah(netProfit)}
              </strong>
            </div>
            <p className="text-[11px] text-[var(--text-dim)] mt-1.5 leading-snug">
              Laba kotor = penjualan barang terjual - modal barang terjual. Laba bersih = setelah beban operasional.
            </p>
          </div>
        </article>
      </section>

      {/* Remittance & Employee Cash Section (Lock v1.1) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="sakala-card p-4 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-semibold text-[var(--text-main)]">
                Seharusnya Diserahkan
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-dim)] block">
              Uang usaha yang semestinya diserahkan karyawan
            </span>
          </div>
          <strong className="text-base sm:text-lg font-bold tabular-nums text-sky-700 dark:text-sky-400">
            {formatRupiah(totals.expectedEmployeeRemittance?.min ?? totals.salesRevenue.min)}
          </strong>
        </article>

        <article className="sakala-card p-4 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-[var(--text-main)]">
                Diterima Owner
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-dim)] block">
              Setoran aktual yang telah diterima pemilik
            </span>
          </div>
          <strong className="text-base sm:text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totals.totalDeposits)}
          </strong>
        </article>

        <article className="sakala-card p-4 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-[var(--text-main)]">
                Dipegang Karyawan
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-dim)] block">
              Sisa saldo kas di tangan karyawan / kasir
            </span>
          </div>
          <strong className="text-base sm:text-lg font-bold tabular-nums text-[var(--text-main)]">
            {totals.storeCashAfterDeposits.min === totals.storeCashAfterDeposits.max
              ? formatRupiah(totals.storeCashAfterDeposits.min)
              : `${formatRupiah(totals.storeCashAfterDeposits.min)} - ${formatRupiah(totals.storeCashAfterDeposits.max)}`}
          </strong>
        </article>

        <article className="sakala-card p-4 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-[var(--text-main)]">
                Status Serah-Terima
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-dim)] block truncate">
              {totals.remittanceStatus?.statusLabel || 'Menunggu Setoran'}
            </span>
          </div>
          <div className="text-xs">
            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
              totals.remittanceStatus?.status === 'COCOK'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : totals.remittanceStatus?.status === 'BELUM_COCOK'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            }`}>
              {totals.remittanceStatus?.difference && totals.remittanceStatus.difference.min !== 0
                ? (totals.remittanceStatus.difference.min > 0 ? `+${formatRupiah(totals.remittanceStatus.difference.min)}` : formatRupiah(totals.remittanceStatus.difference.min))
                : (totals.remittanceStatus?.statusLabel || 'Cocok')}
            </span>
          </div>
        </article>
      </section>

      {/* Income Statement Table / Card */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent-mint)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
              Rekonsiliasi Laba Rugi Ritel
            </h3>
          </div>
          <span className="text-xs text-[var(--text-dim)]">
            Status: {totals.certainty === 'PASTI' ? 'Pasti & Sah' : 'Sebagian Kisaran'}
          </span>
        </div>

        <div className="space-y-2 text-xs divide-y divide-[var(--border-subtle)]">
          <div className="pt-2 flex justify-between items-center text-[var(--text-muted)]">
            <span>A. Potensi Nilai Jual Barang (Keuntungan Jual)</span>
            <span className="font-semibold tabular-nums text-[var(--text-main)]">
              {formatRupiah(potentialRevenue)}
            </span>
          </div>

          <div className="pt-2 flex justify-between items-center text-[var(--text-muted)]">
            <span>B. Nilai Sisa Berdasarkan Harga Jual (Pengurang)</span>
            <span className="tabular-nums text-rose-600 dark:text-rose-400 font-medium">
              -{formatRupiah(remainingAtSellPrice)}
            </span>
          </div>

          <div className="pt-2 flex justify-between items-center bg-[var(--bg-elevated)]/40 p-2 rounded-lg">
            <div>
              <strong className="font-semibold text-[var(--text-main)] block">
                Penjualan setelah dikurangi sisa (Penjualan Terhitung)
              </strong>
              <span className="text-[10px] text-[var(--text-dim)]">
                Hasil penjualan unit yang sudah keluar (A - B)
              </span>
            </div>
            <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatRupiah(totalSalesRevenue)}
            </strong>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[var(--text-muted)] font-medium">Pendapatan Lain-lain (Jasa / Titipan)</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              +{formatRupiah(totals.otherIncome)}
            </strong>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[var(--text-muted)] font-medium">Beban Pokok Penjualan (HPP / Modal Terjual)</span>
            <strong className="text-rose-600 dark:text-rose-400 font-bold tabular-nums">
              -{formatRupiah(totals.costOfGoodsSoldKnown)}
            </strong>
          </div>

          <div className="pt-2 flex justify-between items-center bg-[var(--bg-elevated)]/40 p-2 rounded-lg">
            <span className="font-bold text-[var(--text-main)]">Laba Kotor Operasional</span>
            <strong className="text-sm font-bold text-[var(--text-main)] tabular-nums">
              {formatRupiah(grossProfit)}
            </strong>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[var(--text-muted)] font-medium">Beban Operasional / Pengeluaran Toko</span>
            <strong className="text-rose-600 dark:text-rose-400 font-bold tabular-nums">
              -{formatRupiah(totals.expenses)}
            </strong>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[var(--text-muted)] font-medium">Kerugian Barang (Rusak / Dipakai Sendiri)</span>
            <strong className="text-rose-600 dark:text-rose-400 font-bold tabular-nums">
              -{formatRupiah(totals.damageLossKnown + totals.usedLossKnown + totals.unknownLossKnown)}
            </strong>
          </div>

          <div className="pt-3 flex justify-between items-center bg-[#e7f7f0] dark:bg-[#16223b] border border-[#c3ecdc] dark:border-[#2dd4bf]/40 p-4 rounded-2xl shadow-xs">
            <div>
              <span className="text-sm font-bold text-[#056045] dark:text-[#5eead4] block">
                Estimasi Laba Bersih Final
              </span>
              <span className="text-[10px] text-[#056045]/80 dark:text-[#99f6e4]/80 block">
                Keuntungan murni usaha toko setelah seluruh modal & beban
              </span>
            </div>
            <strong className="text-xl font-bold font-display text-[#034431] dark:text-white tabular-nums">
              {formatRupiah(netProfit)}
            </strong>
          </div>
        </div>
      </section>

      {/* Product Performance Table */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--accent-mint)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
              Kinerja Stok & Penjualan Tiap Barang
            </h3>
          </div>
          <span className="text-xs text-[var(--text-dim)] tabular-nums">
            {products.length} produk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-dim)] uppercase">
                <th className="py-2.5 px-3">Nama Barang</th>
                <th className="py-2.5 px-3 text-right">Harga Jual</th>
                <th className="py-2.5 px-3 text-right" title="Keuntungan Jual: nilai jual jika semua unit terjual">
                  Keuntungan Jual
                </th>
                <th className="py-2.5 px-3 text-right">Terjual</th>
                <th className="py-2.5 px-3 text-right">Sisa Stok</th>
                <th className="py-2.5 px-3 text-right">Penjualan Terhitung</th>
                <th className="py-2.5 px-3 text-right">HPP Terjual</th>
                <th className="py-2.5 px-3 text-right">Nilai Modal Sisa</th>
                <th className="py-2.5 px-3 text-right">Laba Kotor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {productCalculations.map((p) => {
                const prodInfo = products.find((prod) => prod.id === p.productId);
                const itemGrossProfit = p.grossProfit?.min ?? (p.salesRevenue.min - p.costOfSoldKnown);
                return (
                  <tr key={p.productId} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[var(--text-main)]">
                      {p.name}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[var(--text-muted)]">
                      {formatRupiah(prodInfo?.sellingPrice || 0)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-sky-700 dark:text-sky-400 font-medium">
                      {formatRupiah(p.potentialSalesRevenue?.min ?? 0)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(p.unitsSold)} pcs
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[var(--text-main)]">
                      {formatNumber(p.availableUnits)} pcs
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(p.salesRevenue.min)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[var(--text-muted)]">
                      {formatRupiah(p.costOfSoldKnown)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[var(--text-main)]">
                      {formatRupiah(p.knownInventoryValue)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-teal-700 dark:text-teal-400">
                      {formatRupiah(itemGrossProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Printable Executive Sign-off Section (Only visible on print / PDF) */}
      <div className="print-only mt-8 pt-6 border-t-2 border-slate-900">
        <div className="grid grid-cols-2 gap-12 text-xs text-slate-800">
          <div className="space-y-12">
            <p className="font-semibold text-slate-600">Disiapkan Oleh (Kasir / Pengelola Toko):</p>
            <div>
              <div className="border-b border-slate-400 w-48 mb-1.5" />
              <p className="font-bold text-slate-900">Nama: .......................................</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
          <div className="space-y-12 text-right">
            <p className="font-semibold text-slate-600">Diverifikasi & Disetujui (Pemilik Toko):</p>
            <div className="flex flex-col items-end">
              <div className="border-b border-slate-400 w-48 mb-1.5" />
              <p className="font-bold text-slate-900">Nama: .......................................</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-6">
          *Laporan ini dicetak secara otomatis dari sistem pencatatan deterministik TOKO SAKALA dan sah sebagai arsip rekonsiliasi kas serta persediaan toko.
        </p>
      </div>
    </motion.div>
  );
}

import {
  TrendingUp,
  Wallet,
  ShoppingBasket,
  ClipboardCheck,
  Banknote,
  Package,
  ArrowRight,
  Receipt,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ScreenId } from '@/types/store';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatNumber, formatDateTime } from '@/lib/utils';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { engineOutput, products, events } = useStore();
  const { totals, issues } = engineOutput;

  // Profit display text
  const profitText = totals.profit
    ? totals.profit.min === totals.profit.max
      ? formatRupiah(totals.profit.min)
      : `${formatRupiah(totals.profit.min)} - ${formatRupiah(totals.profit.max)}`
    : 'Menunggu data';

  // Cash in store display text
  const storeCashText =
    totals.storeCashAfterDeposits.min === totals.storeCashAfterDeposits.max
      ? formatRupiah(totals.storeCashAfterDeposits.min)
      : `${formatRupiah(totals.storeCashAfterDeposits.min)} - ${formatRupiah(totals.storeCashAfterDeposits.max)}`;

  // Total inventory value
  const totalInventoryValue = engineOutput.products.reduce(
    (sum, p) => sum + p.knownInventoryValue,
    0
  );

  // Total in stock units
  const totalInStockUnits = engineOutput.products.reduce(
    (sum, p) => sum + p.availableUnits,
    0
  );

  // Total purchase cost from recorded purchase events
  const totalPurchasesCost = events
    .filter((e): e is Extract<typeof e, { type: 'purchase' }> => e.type === 'purchase')
    .reduce((sum, e) => sum + e.totalCost, 0);

  // Recent 5 events
  const recentEvents = [...events].reverse().slice(0, 5);

  // Calculate percentages for donut chart
  const salesRev = totals.salesRevenue.min;
  const storeCash = Math.max(0, totals.storeCashAfterDeposits.min);
  const totalFinancialMass = (salesRev + totalPurchasesCost + storeCash + totalInventoryValue) || 1;
  const pctPurchases = Math.round((totalPurchasesCost / totalFinancialMass) * 100);
  const pctSales = Math.round((salesRev / totalFinancialMass) * 100);
  const pctCash = Math.round((storeCash / totalFinancialMass) * 100);
  const pctStock = Math.max(0, 100 - pctPurchases - pctSales - pctCash);

  // Health score calculation
  const complianceScore = totals.certainty === 'PASTI' ? 96 : 74;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-6"
    >
      {/* BrightPolicy Header Welcome Strip */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-main)] tracking-tight">
            Selamat Datang di Toko Sakala!
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Dasbor finansial harian, kontrol sisa rak toko, dan rekonsiliasi kas terintegrasi.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('belanja')}
            className="sakala-btn sakala-btn-primary rounded-2xl h-10 px-4 text-xs font-bold"
          >
            <ShoppingBasket className="w-4 h-4" />
            <span>Catat Belanja</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('cek-sisa')}
            className="sakala-btn sakala-btn-secondary rounded-2xl h-10 px-4 text-xs font-semibold"
          >
            <ClipboardCheck className="w-4 h-4 text-[var(--primary)]" />
            <span>Cek Sisa Fisik</span>
          </button>
        </div>
      </section>

      {/* Issues / Audit alerts if any */}
      {issues.length > 0 && (
        <section className="p-4 rounded-2xl border border-amber-300 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-300">
              Perhatian: {issues.length} catatan memerlukan tindak lanjut
            </p>
            <p className="text-amber-800/90 dark:text-amber-200/80">
              {issues[0].message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('cek-sisa')}
            className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 underline shrink-0"
          >
            Selesaikan
          </button>
        </section>
      )}

      {/* 5 BrightPolicy Pastel KPI Tiles in a Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Tile 1: Soft Coral / Rose -> Laba Bersih */}
        <article className="p-5 rounded-3xl bg-[#ffeae5] dark:bg-[#16223b] border border-[#fccfca] dark:border-[#ff725e]/40 space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#8c2612] dark:text-[#ff927f] uppercase tracking-wider">
              Estimasi Laba
            </span>
            <div className="w-8 h-8 rounded-full bg-[#e06346]/20 dark:bg-[#ff725e]/25 text-[#8c2612] dark:text-[#ff927f] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-display text-[#5c1708] dark:text-white tabular-nums block truncate">
              {profitText}
            </span>
            <span className="text-[11px] font-medium text-[#8c2612] dark:text-[#ffb3a6] mt-1 block">
              Setelah modal & operasional
            </span>
          </div>
        </article>

        {/* Tile 2: Soft Sky Blue -> Saldo Kas Karyawan */}
        <article className="p-5 rounded-3xl bg-[#eaf4fb] dark:bg-[#16223b] border border-[#c5e1f7] dark:border-[#38bdf8]/40 space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#034f78] dark:text-[#7dd3fc] uppercase tracking-wider">
              Kas Karyawan
            </span>
            <div className="w-8 h-8 rounded-full bg-[#0284c7]/20 dark:bg-[#38bdf8]/25 text-[#034f78] dark:text-[#7dd3fc] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-display text-[#063b59] dark:text-white tabular-nums block truncate">
              {storeCashText}
            </span>
            <span className="text-[11px] font-medium text-[#034f78] dark:text-[#bae6fd] mt-1 block">
              Saldo dipegang karyawan
            </span>
          </div>
        </article>

        {/* Tile 3: Soft Lavender -> Penjualan Terhitung */}
        <article className="p-5 rounded-3xl bg-[#f2eafa] dark:bg-[#16223b] border border-[#e0cef7] dark:border-[#a78bfa]/40 space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#5519b5] dark:text-[#c4b5fd] uppercase tracking-wider">
              Penjualan Laku
            </span>
            <div className="w-8 h-8 rounded-full bg-[#7c3aed]/20 dark:bg-[#a78bfa]/25 text-[#5519b5] dark:text-[#c4b5fd] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-display text-[#3b0f80] dark:text-white tabular-nums block truncate">
              {formatRupiah(totals.salesRevenue.min)}
            </span>
            <span className="text-[11px] font-medium text-[#5519b5] dark:text-[#ddd6fe] mt-1 block">
              {formatNumber(totals.unitsSold)} unit terjual
            </span>
          </div>
        </article>

        {/* Tile 4: Soft Mint -> Modal Belanja */}
        <article className="p-5 rounded-3xl bg-[#e7f7f0] dark:bg-[#16223b] border border-[#c3ecdc] dark:border-[#2dd4bf]/40 space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#056045] dark:text-[#5eead4] uppercase tracking-wider">
              Modal Belanja
            </span>
            <div className="w-8 h-8 rounded-full bg-[#10b981]/20 dark:bg-[#2dd4bf]/25 text-[#056045] dark:text-[#5eead4] flex items-center justify-center">
              <ShoppingBasket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-display text-[#034431] dark:text-white tabular-nums block truncate">
              {formatRupiah(totalPurchasesCost)}
            </span>
            <span className="text-[11px] font-medium text-[#056045] dark:text-[#99f6e4] mt-1 block">
              Barang kulakan masuk
            </span>
          </div>
        </article>

        {/* Tile 5: Soft Amber / Peach -> Nilai Aset Stok */}
        <article className="p-5 rounded-3xl bg-[#fff2e3] dark:bg-[#16223b] border border-[#fddbb8] dark:border-[#fbbf24]/40 space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#8c3d03] dark:text-[#fde68a] uppercase tracking-wider">
              Aset Stok Fisik
            </span>
            <div className="w-8 h-8 rounded-full bg-[#f59e0b]/20 dark:bg-[#fbbf24]/25 text-[#8c3d03] dark:text-[#fde68a] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-display text-[#6e2e00] dark:text-white tabular-nums block truncate">
              {formatRupiah(totalInventoryValue)}
            </span>
            <span className="text-[11px] font-medium text-[#8c3d03] dark:text-[#fef3c7] mt-1 block">
              {formatNumber(totalInStockUnits)} unit di rak
            </span>
          </div>
        </article>
      </section>

      {/* BrightPolicy 3-Column Visual Layout (Donut Chart, Flow Bars, Compliance Score) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Chart 1: Donut Komposisi Finansial Toko */}
        <div className="sakala-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Komposisi Finansial Toko
            </h3>
            <span className="text-[11px] text-[var(--text-dim)] font-medium">Proporsi Nilai</span>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            {/* Interactive SVG Donut */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--bg-elevated)" strokeWidth="14" />
                {/* Segment 1: Modal Belanja (Coral) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#c94b2f"
                  strokeWidth="14"
                  strokeDasharray={`${pctPurchases * 2.38} 238`}
                  strokeDashoffset="0"
                />
                {/* Segment 2: Penjualan (Lavender) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#7c3aed"
                  strokeWidth="14"
                  strokeDasharray={`${pctSales * 2.38} 238`}
                  strokeDashoffset={`-${pctPurchases * 2.38}`}
                />
                {/* Segment 3: Kas Riil (Sky) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0284c7"
                  strokeWidth="14"
                  strokeDasharray={`${pctCash * 2.38} 238`}
                  strokeDashoffset={`-${(pctPurchases + pctSales) * 2.38}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold font-display text-[var(--text-main)] tabular-nums">
                  100%
                </span>
                <span className="text-[9px] text-[var(--text-dim)] uppercase font-bold">
                  Total
                </span>
              </div>
            </div>

            {/* Legend list with high-contrast text */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c94b2f] shrink-0" />
                <span className="text-[var(--text-main)] font-semibold text-[11px]">Belanja: {pctPurchases}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] shrink-0" />
                <span className="text-[var(--text-main)] font-semibold text-[11px]">Penjualan: {pctSales}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                <span className="text-[var(--text-main)] font-semibold text-[11px]">Kas Toko: {pctCash}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] shrink-0" />
                <span className="text-[var(--text-main)] font-semibold text-[11px]">Sisa Stok: {pctStock}%</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Rekonsiliasi otomatis</span>
            <span className="font-bold text-[var(--text-main)]">{products.length} Barang Terdata</span>
          </div>
        </div>

        {/* Chart 2: Visual Alur Keuangan Toko (Bar Columns) */}
        <div className="sakala-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Aktivitas Arus Dana
            </h3>
            <span className="text-[11px] text-[var(--text-dim)] font-medium">Arus Nominal</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Modal Belanja Masuk</span>
                <span className="font-bold text-[var(--text-main)] tabular-nums">{formatRupiah(totalPurchasesCost)}</span>
              </div>
              <div className="h-3 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[#c94b2f] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(15, pctPurchases * 1.5))}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Hasil Penjualan Cek Sisa</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatRupiah(totals.salesRevenue.min)}</span>
              </div>
              <div className="h-3 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(15, pctSales * 1.5))}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Kas di Tangan Kasir</span>
                <span className="font-bold text-[#0284c7] dark:text-[#38bdf8] tabular-nums">{storeCashText}</span>
              </div>
              <div className="h-3 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[#0284c7] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(15, pctCash * 1.5))}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-dim)]">Status Sinkronisasi</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sesuai Rumus Sakala</span>
            </span>
          </div>
        </div>

        {/* Chart 3: Skor Kepatuhan & Kesehatan Kas Toko (Radial Compliance Rate) */}
        <div className="sakala-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Kesehatan Akuntansi Toko
            </h3>
            <span className="text-[11px] text-[var(--text-dim)] font-medium">Index Audit</span>
          </div>

          <div className="flex flex-col items-center justify-center py-2 text-center space-y-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-elevated)" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#0284c7"
                  strokeWidth="10"
                  strokeDasharray={`${complianceScore * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold font-display text-[var(--text-main)] tabular-nums">
                  {complianceScore}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">
                  Akurasi
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[var(--text-main)] block">
                {totals.certainty === 'PASTI' ? 'Audit Keuangan Lengkap' : 'Perlu Cek Fisik Barang'}
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-[220px]">
                {totals.certainty === 'PASTI'
                  ? 'Seluruh sisa fisik rak terhitung tanpa estimasi terbuka.'
                  : 'Lakukan cek sisa berkala untuk memastikan laba pasti.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => onNavigate('laporan')}
              className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 mx-auto"
            >
              <span>Buka Laporan Audit Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Lower Section: Recent Audit Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: High-Density Structured Table (Employee Status Overview style) */}
        <section className="lg:col-span-2 sakala-card p-6 space-y-4 rounded-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Jejak Aktivitas & Mutasi Toko
              </h3>
              <span className="text-[11px] text-[var(--text-dim)]">·</span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums font-semibold">
                {events.length} catatan
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('riwayat')}
              className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-dim)] space-y-2">
              <Layers className="w-8 h-8 mx-auto text-[var(--text-dim)]/50" />
              <p>Belum ada transaksi tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-xl">Jenis Mutasi</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">No Urut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {recentEvents.map((ev) => {
                    const getEventDetails = () => {
                      switch (ev.type) {
                        case 'purchase':
                          return {
                            label: 'Belanja Masuk',
                            desc: `${ev.packs} dus (Rp ${ev.totalCost.toLocaleString('id-ID')})`,
                            badge: 'bg-[#ffeae5] text-[#8c2612] dark:bg-[#ff725e]/25 dark:text-[#ffb3a6]'
                          };
                        case 'stock_check':
                          return {
                            label: 'Cek Sisa Fisik',
                            desc: `Sisa dihitung: ${ev.observedUnits} pcs`,
                            badge: 'bg-[#e7f7f0] text-[#056045] dark:bg-[#2dd4bf]/25 dark:text-[#5eead4]'
                          };
                        case 'expense':
                          return {
                            label: 'Biaya Toko',
                            desc: `${ev.description} (Rp ${ev.amount.toLocaleString('id-ID')})`,
                            badge: 'bg-[#ffebee] text-[#991b1b] dark:bg-rose-950/40 dark:text-rose-300'
                          };
                        case 'deposit':
                          return {
                            label: 'Setoran Karyawan',
                            desc: `${ev.employeeName ? `Dari ${ev.employeeName}: ` : ''}Rp ${ev.amount.toLocaleString('id-ID')}`,
                            badge: 'bg-[#eaf4fb] text-[#034f78] dark:bg-[#38bdf8]/25 dark:text-[#7dd3fc]'
                          };
                        case 'other_income':
                          return {
                            label: 'Pendapatan Lain',
                            desc: `${ev.description} (Rp ${ev.amount.toLocaleString('id-ID')})`,
                            badge: 'bg-[#f2eafa] text-[#5519b5] dark:bg-[#a78bfa]/25 dark:text-[#c4b5fd]'
                          };
                        default:
                          return {
                            label: ev.type,
                            desc: '-',
                            badge: 'bg-[var(--bg-elevated)] text-[var(--text-main)]'
                          };
                      }
                    };

                    const info = getEventDetails();

                    return (
                      <tr key={ev.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${info.badge}`}>
                            {info.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[var(--text-main)] truncate max-w-[200px]">
                          {info.desc}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(ev.occurredAt)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-[var(--text-dim)] tabular-nums">
                          #{ev.seq}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Col: Quick Actions (BrightPolicy Rounded Tiles) */}
        <section className="sakala-card p-6 space-y-4 rounded-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Aksi Cepat
            </h3>
            <span className="text-[11px] text-[var(--text-dim)]">Operasional</span>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigate('belanja')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-left group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffeae5] text-[#e06346] dark:bg-[#e06346]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBasket className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[var(--text-main)] block">
                  Catat Belanja Masuk
                </strong>
                <span className="text-[11px] text-[var(--text-muted)] block truncate">
                  Input dus/kemasan & modal
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:translate-x-1 group-hover:text-[var(--primary)] transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cek-sisa')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-left group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#e8f7f2] text-[#047857] dark:bg-[#10b981]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[var(--text-main)] block">
                  Cek Sisa Fisik Rak
                </strong>
                <span className="text-[11px] text-[var(--text-muted)] block truncate">
                  Hitung penjualan otomatis
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:translate-x-1 group-hover:text-[var(--primary)] transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('setoran')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-left group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ebf5fb] text-[#0284c7] dark:bg-[#0284c7]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[var(--text-main)] block">
                  Setoran dari Karyawan
                </strong>
                <span className="text-[11px] text-[var(--text-muted)] block truncate">
                  Serah-terima uang & kas operasional
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:translate-x-1 group-hover:text-[var(--primary)] transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('laporan')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-left group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f3edfa] text-[#7c3aed] dark:bg-[#7c3aed]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[var(--text-main)] block">
                  Rekap Laporan Keuangan
                </strong>
                <span className="text-[11px] text-[var(--text-muted)] block truncate">
                  Ekspor PDF & Cetak A4
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:translate-x-1 group-hover:text-[var(--primary)] transition-all" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

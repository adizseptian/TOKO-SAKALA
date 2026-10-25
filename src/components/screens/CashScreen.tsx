import { useState } from 'react';
import {
  Wallet,
  Banknote,
  ArrowDownRight,
  Plus,
  Check,
  Receipt,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import type { MoneySource, RemittanceStatus } from '@/types/store';
import { Modal } from '@/components/ui/Modal';

export function CashScreen() {
  const { engineOutput, addEvent, notify } = useStore();
  const { totals, depositChecks } = engineOutput;

  // Active sub-tab: 'deposit' | 'expense' | 'income'
  const [activeTab, setActiveTab] = useState<'deposit' | 'expense' | 'income'>('deposit');

  // Form states: Setoran dari Karyawan
  const [depositAmount, setDepositAmount] = useState('');
  const [employeeName, setEmployeeName] = useState('Karyawan Toko');
  const [depositNotes, setDepositNotes] = useState('');

  // Form states: Pengeluaran Toko
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSource, setExpenseSource] = useState<MoneySource>('STORE');

  // Form states: Pendapatan Lain
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  // Modal explanation "Lihat Perhitungan / Kenapa?"
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [selectedDepositForWhy, setSelectedDepositForWhy] = useState<any | null>(null);

  // Cash and Remittance values
  const expectedRemittanceText =
    totals.expectedEmployeeRemittance.min === totals.expectedEmployeeRemittance.max
      ? formatRupiah(totals.expectedEmployeeRemittance.min)
      : `${formatRupiah(totals.expectedEmployeeRemittance.min)} - ${formatRupiah(totals.expectedEmployeeRemittance.max)}`;

  const employeeRemainingCashText =
    totals.storeCashAfterDeposits.min === totals.storeCashAfterDeposits.max
      ? formatRupiah(totals.storeCashAfterDeposits.min)
      : `${formatRupiah(totals.storeCashAfterDeposits.min)} - ${formatRupiah(totals.storeCashAfterDeposits.max)}`;

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(depositAmount.replace(/\D/g, ''), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      notify('error', 'Nominal tidak valid', 'Masukkan jumlah setoran yang valid.');
      return;
    }

    addEvent({
      type: 'deposit',
      amount: amountNum,
      employeeName: employeeName.trim() || 'Karyawan Toko',
      notes: depositNotes.trim() || undefined
    });

    notify(
      'success',
      'Setoran dari Karyawan Dicatat',
      `Uang aktual sebesar ${formatRupiah(amountNum)} dari ${employeeName.trim() || 'karyawan'} telah diterima owner.`
    );
    setDepositAmount('');
    setDepositNotes('');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(expenseAmount.replace(/\D/g, ''), 10);
    if (!expenseDesc.trim() || isNaN(amountNum) || amountNum <= 0) {
      notify('error', 'Form tidak valid', 'Masukkan deskripsi dan nominal pengeluaran.');
      return;
    }

    addEvent({
      type: 'expense',
      description: expenseDesc.trim(),
      amount: amountNum,
      sourceMoney: expenseSource
    });

    notify(
      'success',
      'Pengeluaran Dicatat',
      `Pengeluaran "${expenseDesc}" sebesar ${formatRupiah(amountNum)} tersimpan.`
    );
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(incomeAmount.replace(/\D/g, ''), 10);
    if (!incomeDesc.trim() || isNaN(amountNum) || amountNum <= 0) {
      notify('error', 'Form tidak valid', 'Masukkan deskripsi dan nominal pendapatan.');
      return;
    }

    addEvent({
      type: 'other_income',
      description: incomeDesc.trim(),
      amount: amountNum
    });

    notify(
      'success',
      'Pendapatan Dicatat',
      `Pendapatan "${incomeDesc}" sebesar ${formatRupiah(amountNum)} tersimpan.`
    );
    setIncomeDesc('');
    setIncomeAmount('');
  };

  const getStatusBadge = (status: RemittanceStatus) => {
    switch (status) {
      case 'COCOK':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
          icon: CheckCircle2,
          label: 'Cocok'
        };
      case 'BELUM_COCOK':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300',
          icon: AlertCircle,
          label: 'Belum cocok'
        };
      case 'PERLU_DIPERIKSA':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300',
          icon: AlertTriangle,
          label: 'Perlu diperiksa'
        };
      case 'MENUNGGU_SETORAN':
      default:
        return {
          bg: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]',
          icon: Clock,
          label: 'Menunggu setoran'
        };
    }
  };

  const latestRemittance = totals.remittanceStatus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* 4 Overview Metric Tiles for Cash & Remittance Lock v1.1 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Uang yang Seharusnya Diserahkan Karyawan */}
        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Uang Seharusnya Diserahkan</span>
            <Wallet className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <strong className="text-2xl font-bold font-display text-[var(--text-main)] tabular-nums block">
            {expectedRemittanceText}
          </strong>
          <span className="text-[11px] text-[var(--text-dim)] block">
            Hasil penjualan toko sebelum serah-terima
          </span>
        </article>

        {/* Tile 2: Setoran Diterima Owner */}
        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Setoran Diterima Owner</span>
            <Banknote className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          </div>
          <strong className="text-2xl font-bold font-display text-teal-700 dark:text-teal-400 tabular-nums block">
            {formatRupiah(totals.totalDeposits)}
          </strong>
          <span className="text-[11px] text-[var(--text-dim)] block">
            Uang riil yang diserahkan karyawan ke owner
          </span>
        </article>

        {/* Tile 3: Saldo yang Masih Dipegang Karyawan */}
        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Saldo Dipegang Karyawan</span>
            <Receipt className="w-4 h-4 text-[var(--accent-mint)]" />
          </div>
          <strong className="text-2xl font-bold font-display text-[var(--text-main)] tabular-nums block">
            {employeeRemainingCashText}
          </strong>
          <span className="text-[11px] text-[var(--text-dim)] block">
            Sisa uang kas toko yang belum diserahkan
          </span>
        </article>

        {/* Tile 4: Status Serah Terima Terakhir */}
        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Status Serah-Terima</span>
            <button
              type="button"
              onClick={() => {
                setSelectedDepositForWhy(depositChecks[depositChecks.length - 1] || null);
                setIsWhyModalOpen(true);
              }}
              className="text-[11px] font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
              title="Lihat rincian rumus hitungan setoran"
            >
              <span>Kenapa?</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                getStatusBadge(latestRemittance.status).bg
              }`}
            >
              {latestRemittance.statusLabel}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-dim)] line-clamp-2 leading-tight">
            {latestRemittance.explanation}
          </p>
        </article>
      </section>

      {/* Main Operations Tabs & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Panel (7 cols) */}
        <section className="lg:col-span-7 sakala-card p-6 space-y-6">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'deposit'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Setoran dari Karyawan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'expense'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Pengeluaran Toko
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'income'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Pendapatan Lain
            </button>
          </div>

          {/* Form 1: Setoran dari Karyawan ke Owner */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Jumlah Uang Aktual yang Diterima Owner dari Karyawan (Rp)
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 240000"
                  className="sakala-input tabular-nums font-bold text-base"
                />
                {depositAmount && (
                  <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1 tabular-nums">
                    Format: {formatRupiah(parseInt(depositAmount, 10) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Nama Karyawan yang Menyerahkan
                </label>
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Contoh: Budi (Kasir Shift Pagi)"
                  className="sakala-input"
                />
                <p className="text-[10px] text-[var(--text-dim)] mt-1">
                  *Catatan manual internal toko untuk keperluan arsip pemilik warung.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="Misal: Penyerahan omzet harian setelah cek rak toko"
                  className="sakala-input"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Uang yang seharusnya diserahkan saat ini:</span>
                  <strong className="text-[var(--text-main)] tabular-nums">{expectedRemittanceText}</strong>
                </div>
                <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                  Setoran adalah serah-terima uang hasil usaha dari karyawan ke owner. Ini bukan setoran ke bank dan tidak menambah/mengurangi laba toko.
                </p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full sakala-btn sakala-btn-primary h-11 text-sm justify-center">
                  <Check className="w-4 h-4" />
                  <span>Simpan Catatan Setoran dari Karyawan</span>
                </button>
              </div>
            </form>
          )}

          {/* Form 2: Pengeluaran Toko */}
          {activeTab === 'expense' && (
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Keterangan Pengeluaran
                </label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Contoh: Gas LPG 3kg, kantong kresek, es batu, token listrik"
                  className="sakala-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Jumlah Uang Keluar (Rp)
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 20000"
                  className="sakala-input tabular-nums"
                />
                {expenseAmount && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
                    Format: {formatRupiah(parseInt(expenseAmount, 10) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  Sumber Uang Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExpenseSource('STORE')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      expenseSource === 'STORE'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)] shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs block">Kas Toko / Karyawan</strong>
                      <span className="text-[10px] text-[var(--text-dim)]">
                        Mengurangi uang yang harus disetor karyawan
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseSource('PERSONAL')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      expenseSource === 'PERSONAL'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)] shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs block">Uang Pribadi / Owner</strong>
                      <span className="text-[10px] text-[var(--text-dim)]">
                        Kas yang dipegang karyawan tetap utuh
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full sakala-btn sakala-btn-primary h-11 text-sm justify-center">
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengeluaran</span>
                </button>
              </div>
            </form>
          )}

          {/* Form 3: Pendapatan Lain */}
          {activeTab === 'income' && (
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Keterangan Pendapatan
                </label>
                <input
                  type="text"
                  required
                  value={incomeDesc}
                  onChange={(e) => setIncomeDesc(e.target.value)}
                  placeholder="Contoh: Jasa seduh mi instan, cup es batu, fotokopi, parkir"
                  className="sakala-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Jumlah Uang Masuk (Rp)
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 15000"
                  className="sakala-input tabular-nums"
                />
                {incomeAmount && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
                    Format: {formatRupiah(parseInt(incomeAmount, 10) || 0)}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                Pendapatan lain ini terpisah dari penjualan stok barang dan akan menambah laba serta uang di laci kas toko.
              </p>

              <div className="pt-2">
                <button type="submit" className="w-full sakala-btn sakala-btn-primary h-11 text-sm justify-center">
                  <Check className="w-4 h-4" />
                  <span>Simpan Pendapatan</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Deposit Verification Audit (5 cols) */}
        <section className="lg:col-span-5 sakala-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                Rekonsiliasi Serah-Terima
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Pemeriksaan selisih setoran karyawan ke owner
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDepositForWhy(null);
                setIsWhyModalOpen(true);
              }}
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <span>Lihat Perhitungan</span>
            </button>
          </div>

          {depositChecks.length === 0 ? (
            <div className="text-xs text-[var(--text-dim)] py-8 text-center space-y-1">
              <p className="font-semibold text-[var(--text-muted)]">Belum ada serah-terima dicatat</p>
              <p>Masukkan catatan setoran aktual yang diterima owner dari karyawan pada formulir di sebelah kiri.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {depositChecks.map((dc, i) => {
                const badge = getStatusBadge(dc.status);
                const BadgeIcon = badge.icon;
                const isShortage = dc.difference.max < 0;
                const isOver = dc.difference.min > 0;
                const diffNominal = Math.abs(dc.difference.min);

                return (
                  <div
                    key={dc.eventId || i}
                    className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[var(--primary)]" />
                        <span className="font-bold text-[var(--text-main)]">
                          {dc.employeeName || `Setoran #${i + 1}`}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{dc.statusLabel}</span>
                      </span>
                    </div>

                    <div className="space-y-1 divide-y divide-[var(--border-subtle)]/60 text-[11px]">
                      <div className="pt-1 flex items-center justify-between text-[var(--text-muted)]">
                        <span>Setoran aktual diterima:</span>
                        <strong className="text-[var(--text-main)] tabular-nums font-bold">
                          {formatRupiah(dc.actualAmount)}
                        </strong>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[var(--text-dim)]">
                        <span>Uang yang seharusnya diserahkan:</span>
                        <span className="tabular-nums">
                          {formatRupiah(dc.expectedBeforeDeposit.min)}
                        </span>
                      </div>

                      <div className="pt-1 flex items-center justify-between font-semibold">
                        <span>Selisih serah-terima:</span>
                        <span
                          className={`tabular-nums ${
                            isShortage
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : isOver
                              ? 'text-amber-700 dark:text-amber-400 font-bold'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {dc.difference.min === 0 ? 'Rp 0 (Pas)' : formatRupiah(dc.difference.min)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1 border-t border-[var(--border-subtle)]">
                      {dc.explanation}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)] pt-0.5">
                      <span>Waktu: {formatDateTime(dc.occurredAt || new Date().toISOString())}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDepositForWhy(dc);
                          setIsWhyModalOpen(true);
                        }}
                        className="text-[var(--primary)] font-semibold hover:underline"
                      >
                        Kenapa?
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Penjelasan Rumus & Rincian Serah Terima (Kenapa?) */}
      <Modal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        title="Rincian Perhitungan Serah-Terima Uang"
        description="Transparansi rumus uang usaha yang semestinya berada dalam penguasaan karyawan sebelum diserahkan ke owner."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
            <h4 className="font-bold text-[var(--text-main)] uppercase tracking-wider text-[11px]">
              Rumus Penentu Kas Karyawan
            </h4>
            <div className="space-y-1.5 divide-y divide-[var(--border-subtle)] text-[11px]">
              <div className="pt-1 flex justify-between text-[var(--text-muted)]">
                <span>(+) Penerimaan penjualan terhitung:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  +{formatRupiah(totals.salesRevenue.min)}
                </span>
              </div>
              <div className="pt-1 flex justify-between text-[var(--text-muted)]">
                <span>(+) Pendapatan lain di kas toko:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  +{formatRupiah(totals.otherIncome)}
                </span>
              </div>
              <div className="pt-1 flex justify-between text-[var(--text-muted)]">
                <span>(-) Pengeluaran yang dibayar dari kas toko:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatRupiah(totals.expenses)}
                </span>
              </div>
              <div className="pt-1 flex justify-between text-[var(--text-muted)]">
                <span>(-) Setoran sebelumnya yang sudah diterima owner:</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                  -{formatRupiah(totals.totalDeposits)}
                </span>
              </div>
              <div className="pt-2 flex justify-between font-bold text-sm text-[var(--text-main)]">
                <span>(=) Saldo yang masih dipegang karyawan:</span>
                <span className="tabular-nums">{employeeRemainingCashText}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed space-y-1">
            <strong className="block text-amber-900 dark:text-amber-300 font-bold">
              Pedoman Sikap Netral Pemilik:
            </strong>
            <p>
              Selisih setoran adalah hal yang perlu diperiksa, <strong>bukan bukti otomatis bahwa uang hilang atau diambil</strong>. Periksa kemungkinan adanya belanja operasional mendadak, selisih hitung sisa barang, atau penerimaan yang belum sempat dicatat di sistem.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsWhyModalOpen(false)}
              className="sakala-btn sakala-btn-primary h-9 px-4 text-xs"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

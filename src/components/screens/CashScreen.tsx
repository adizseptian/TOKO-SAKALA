import { useState } from 'react';
import { Wallet, Banknote, ArrowUpRight, ArrowDownRight, Plus, Check, Receipt, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import type { MoneySource } from '@/types/store';

export function CashScreen() {
  const { engineOutput, addEvent, notify } = useStore();
  const { totals, depositChecks } = engineOutput;

  // Active sub-tab: 'expense' | 'income' | 'deposit'
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'deposit'>('expense');

  // Form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSource, setExpenseSource] = useState<MoneySource>('STORE');

  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  const [depositAmount, setDepositAmount] = useState('');

  // Cash in drawer
  const expectedCashText =
    totals.storeCashAfterDeposits.min === totals.storeCashAfterDeposits.max
      ? formatRupiah(totals.storeCashAfterDeposits.min)
      : `${formatRupiah(totals.storeCashAfterDeposits.min)} - ${formatRupiah(totals.storeCashAfterDeposits.max)}`;

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

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(depositAmount.replace(/\D/g, ''), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      notify('error', 'Nominal tidak valid', 'Masukkan jumlah setoran yang valid.');
      return;
    }

    addEvent({
      type: 'deposit',
      amount: amountNum
    });

    notify(
      'success',
      'Setoran Kas Tersimpan',
      `Setoran sebesar ${formatRupiah(amountNum)} berhasil dicatat.`
    );
    setDepositAmount('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Drawer Cash Summary Header */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Uang yang Seharusnya Tersedia</span>
            <Wallet className="w-4 h-4 text-[var(--accent-mint)]" />
          </div>
          <strong className="text-2xl font-bold font-display text-[var(--text-main)] tabular-nums block">
            {expectedCashText}
          </strong>
          <span className="text-[11px] text-[var(--text-dim)] block">
            Saldo kas di laci toko setelah belanja & setoran
          </span>
        </article>

        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Total Pengeluaran Toko</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <strong className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 tabular-nums block">
            {formatRupiah(totals.expenses)}
          </strong>
          <span className="text-[11px] text-[var(--text-dim)] block">
            Biaya operasional / perlengkapan toko
          </span>
        </article>

        <article className="sakala-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Setoran Aktual</span>
            <Banknote className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          </div>
          <strong className="text-2xl font-bold font-display text-teal-700 dark:text-teal-400 tabular-nums block">
            {formatRupiah(totals.totalDeposits)}
          </strong>
          <span className="text-[11px] text-[var(--text-dim)] block">
            Uang fisik yang diserahkan / ditarik pemilik
          </span>
        </article>
      </section>

      {/* Main Operations Tabs & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Panel (7 cols) */}
        <section className="lg:col-span-7 sakala-card p-6 space-y-6">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
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
            <button
              type="button"
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'deposit'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Setoran Pemilik
            </button>
          </div>

          {/* Form 1: Pengeluaran Toko */}
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
                  placeholder="Contoh: 22000"
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
                  Sumber Uang
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExpenseSource('STORE')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      expenseSource === 'STORE'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-[var(--primary)]" />
                    <div>
                      <strong className="text-xs block">Uang Kas Toko</strong>
                      <span className="text-[10px] text-[var(--text-dim)]">Kas toko berkurang</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseSource('PERSONAL')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      expenseSource === 'PERSONAL'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <div>
                      <strong className="text-xs block">Uang Pribadi</strong>
                      <span className="text-[10px] text-[var(--text-dim)]">Kas toko tidak berkurang</span>
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

          {/* Form 2: Pendapatan Lain */}
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
                Pendapatan lain ini terpisah dari penjualan stok barang dan akan menambah laba serta uang di laci kas.
              </p>

              <div className="pt-2">
                <button type="submit" className="w-full sakala-btn sakala-btn-primary h-11 text-sm justify-center">
                  <Check className="w-4 h-4" />
                  <span>Simpan Pendapatan</span>
                </button>
              </div>
            </form>
          )}

          {/* Form 3: Setoran Pemilik */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Jumlah Uang yang Disetor / Diambil (Rp)
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 200000"
                  className="sakala-input tabular-nums"
                />
                {depositAmount && (
                  <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1 tabular-nums">
                    Format: {formatRupiah(parseInt(depositAmount, 10) || 0)}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                <div className="flex justify-between">
                  <span>Uang di laci kasir saat ini:</span>
                  <strong className="text-[var(--text-main)] tabular-nums">{expectedCashText}</strong>
                </div>
                <p className="text-[11px] text-[var(--text-dim)]">
                  Catat saat Anda menarik uang hasil jualan untuk disetorkan ke rekening pribadi atau brankas rumah.
                </p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full sakala-btn sakala-btn-primary h-11 text-sm justify-center">
                  <Check className="w-4 h-4" />
                  <span>Simpan Setoran Kas</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Deposit Verification Audit (5 cols) */}
        <section className="lg:col-span-5 sakala-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
              Rekonsiliasi Setoran
            </h3>
            <span className="text-xs text-[var(--text-dim)]">Audit Otomatis</span>
          </div>

          {depositChecks.length === 0 ? (
            <div className="text-xs text-[var(--text-dim)] py-8 text-center">
              Belum ada setoran tercatat untuk diverifikasi.
            </div>
          ) : (
            <div className="space-y-3">
              {depositChecks.map((dc, i) => {
                const isMatch = dc.difference.min <= 0 && dc.difference.max >= 0;
                return (
                  <div
                    key={dc.eventId || i}
                    className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--text-main)]">
                        Setoran #{i + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isMatch ? 'Sesuai Kas' : 'Ada Selisih'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>Nominal disetor:</span>
                      <strong className="text-[var(--text-main)] tabular-nums">
                        {formatRupiah(dc.actualAmount)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                      <span>Kas sebelum setor:</span>
                      <span className="tabular-nums">
                        {formatRupiah(dc.expectedBeforeDeposit.min)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

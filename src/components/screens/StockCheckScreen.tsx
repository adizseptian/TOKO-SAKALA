import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Search,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Info,
  Package,
  History,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatNumber, formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import {
  type StockRow,
  type ExpenseRow,
  validateRow,
  calculateStockSheetSummary,
  PHOTO_EXAMPLE_ROWS
} from '@/engine/v1/stock-sheet';

const STOCK_CHECK_SESSION_KEY = 'toko-sakala:stock-check:session-draft:v1';

export function StockCheckScreen() {
  const { products, notify } = useStore();

  // Initialize draft rows from master products if available, or 3 starter rows
  const [rows, setRows] = useState<StockRow[]>(() => {
    if (products.length > 0) {
      return products.map((p) => ({
        id: `row-${p.id}`,
        name: p.name,
        category: 'Makanan',
        quantityStr: '',
        priceStr: p.sellingPrice.toString(),
        unit: 'pcs',
        productId: p.id
      }));
    }
    return [
      { id: 'row-1', name: '', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' },
      { id: 'row-2', name: '', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' },
      { id: 'row-3', name: '', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' }
    ];
  });

  // Separate draft expenses
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

  // Search filter and status filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'complete'>('all');

  // Session storage auto-save & restore states
  const [hasRestorableSession, setHasRestorableSession] = useState<{
    savedAt: string;
    rowCount: number;
    completedCount: number;
  } | null>(null);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);

  // Check if a restorable session draft exists in sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STOCK_CHECK_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
          const hasInput =
            parsed.rows.some((r: StockRow) => r.quantityStr && r.quantityStr.trim() !== '') ||
            (Array.isArray(parsed.expenses) && parsed.expenses.length > 0);
          if (hasInput) {
            const completed = parsed.rows.filter(
              (r: StockRow) => validateRow(r).status === 'valid'
            ).length;
            setHasRestorableSession({
              savedAt: parsed.savedAt || new Date().toISOString(),
              rowCount: parsed.rows.length,
              completedCount: completed
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Mode: is displaying example photo rows?
  const [isViewingExample, setIsViewingExample] = useState(false);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Auto-save draft rows and expenses to sessionStorage with debouncing
  useEffect(() => {
    if (isViewingExample) return;

    const hasAnyInput =
      rows.some((r) => r.quantityStr && r.quantityStr.trim() !== '') ||
      expenses.length > 0;

    if (!hasAnyInput) return;

    const timer = setTimeout(() => {
      try {
        const payload = {
          rows,
          expenses,
          savedAt: new Date().toISOString()
        };
        sessionStorage.setItem(STOCK_CHECK_SESSION_KEY, JSON.stringify(payload));
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setLastAutoSavedTime(timeStr);
      } catch (err) {
        console.warn('Failed to auto-save to sessionStorage:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [rows, expenses, isViewingExample]);

  // Real-time calculation of sheet summary
  const summary = useMemo(() => {
    return calculateStockSheetSummary(rows, expenses);
  }, [rows, expenses]);

  // Handle cell changes
  const updateRowField = (id: string, field: keyof StockRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        // If product name changes to one of master products, auto-fill price
        if (field === 'name') {
          const matched = products.find(
            (p) => p.name.toLowerCase() === value.trim().toLowerCase()
          );
          if (matched && !r.priceStr) {
            return {
              ...r,
              name: value,
              priceStr: matched.sellingPrice.toString(),
              productId: matched.id
            };
          }
        }

        // Sanitise quantity and price to digits only
        if (field === 'quantityStr' || field === 'priceStr') {
          const digits = value.replace(/\D/g, '');
          return { ...r, [field]: digits };
        }

        return { ...r, [field]: value };
      })
    );
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setRows((prev) => [
      ...prev,
      { id: newId, name: '', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRestoreSession = () => {
    try {
      const raw = sessionStorage.getItem(STOCK_CHECK_SESSION_KEY);
      if (!raw) {
        notify('info', 'Tidak Ada Sesi Tersimpan', 'Tidak ditemukan catatan sesi sebelumnya.');
        setHasRestorableSession(null);
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
        setIsViewingExample(false);
        setRows(parsed.rows);
        if (Array.isArray(parsed.expenses)) {
          setExpenses(parsed.expenses);
        }
        setHasRestorableSession(null);
        notify(
          'success',
          'Sesi Berhasil Dipulihkan',
          `Draf ${parsed.rows.length} baris barang dari sesi sebelumnya telah dipulihkan.`
        );
      }
    } catch {
      notify('error', 'Gagal Memulihkan', 'Format data sesi tersimpan tidak valid.');
    }
  };

  const handleDismissRestore = () => {
    setHasRestorableSession(null);
  };

  const handleResetForm = () => {
    setIsViewingExample(false);
    sessionStorage.removeItem(STOCK_CHECK_SESSION_KEY);
    setHasRestorableSession(null);
    setLastAutoSavedTime(null);
    if (products.length > 0) {
      setRows(
        products.map((p) => ({
          id: `row-${p.id}`,
          name: p.name,
          category: 'Makanan',
          quantityStr: '',
          priceStr: p.sellingPrice.toString(),
          unit: 'pcs',
          productId: p.id
        }))
      );
    } else {
      setRows([
        { id: 'row-1', name: '', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' },
        { id: 'row-2', name: '', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' }
      ]);
    }
    setExpenses([]);
    notify('info', 'Form Dikosongkan', 'Seluruh isian draf dan penyimpanan sesi sementara telah dikosongkan.');
  };

  const handleLoadExample = () => {
    setIsViewingExample(true);
    setRows(PHOTO_EXAMPLE_ROWS);
    setExpenses([
      { id: 'exp-demo-1', name: 'Kantong plastik kresek', amountStr: '15000' }
    ]);
  };

  // Expense operations
  const addExpenseRow = (defaultName = '') => {
    const newId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setExpenses((prev) => [...prev, { id: newId, name: defaultName, amountStr: '' }]);
  };

  const updateExpense = (id: string, field: 'name' | 'amountStr', value: string) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (field === 'amountStr') {
          return { ...e, amountStr: value.replace(/\D/g, '') };
        }
        return { ...e, [field]: value };
      })
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  // Progress calculation for current data entry session
  const totalRowsCount = rows.length;
  const completedRowsCount = summary.completeItemsCount;
  const remainingRowsCount = Math.max(0, totalRowsCount - completedRowsCount);
  const stockProgressPercent =
    totalRowsCount > 0 ? Math.round((completedRowsCount / totalRowsCount) * 100) : 0;

  // Filtered rows for viewing
  const visibleRows = rows.filter((r) => {
    const val = validateRow(r);
    if (statusFilter === 'incomplete' && val.status === 'valid') return false;
    if (statusFilter === 'complete' && val.status !== 'valid') return false;
    if (!search.trim()) return true;
    return (
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Printable Sheet Header (Only visible when printing) */}
      <div className="print-only mb-6 border-b border-black pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">
              TOKO SAKALA — Lembar Cek Sisa Barang
            </h1>
            <p className="text-xs text-gray-700 mt-1">
              Pencatatan sisa fisik rak toko sekaligus
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Tanggal Cetak: {formatDateTime(new Date().toISOString())}</p>
            <p>Status: Draf Pemeriksaan Fisik</p>
          </div>
        </div>
      </div>

      {/* Screen Header & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)] print-hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">
              Cek Sisa Barang Sekaligus
            </h2>
            <span className="text-[var(--text-dim)]">·</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Belum disimpan
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Lihat semua barang dalam satu tabel, masukkan jumlah sisa di rak, dan biarkan sistem merapikan hitungannya.
          </p>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            className={`sakala-btn ${
              isViewingExample ? 'sakala-btn-primary' : 'sakala-btn-secondary'
            } text-xs h-9 px-3`}
            title="Muat contoh tabel dari lembar foto kertas untuk uji coba hitungan"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Lihat contoh tabel</span>
          </button>

          <button
            type="button"
            onClick={handleAddRow}
            className="sakala-btn sakala-btn-secondary text-xs h-9 px-3"
            title="Tambah baris barang kosong baru"
          >
            <Plus className="w-4 h-4 text-[var(--accent-mint)]" />
            <span>Tambah baris</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="sakala-btn sakala-btn-secondary text-xs h-9 px-3"
            title="Buka dialog cetak browser atau simpan sebagai PDF A4"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak / Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreSession}
            className="sakala-btn sakala-btn-secondary text-xs h-9 px-3 text-[var(--text-main)]"
            title="Pulihkan draf sesi pemeriksaan stok terakhir dari penyimpanan sementara browser"
          >
            <History className="w-4 h-4 text-[var(--primary)]" />
            <span>Pulihkan sesi</span>
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="sakala-btn sakala-btn-ghost text-xs h-9 px-2 text-[var(--text-dim)] hover:text-rose-400"
            title="Hapus seluruh isian draf sementara di layar dan kosongkan sesi"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Kosongkan form</span>
          </button>
        </div>
      </div>

      {/* Restorable Session Alert Banner */}
      {hasRestorableSession && (
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/30 text-xs text-blue-950 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print-hidden shadow-sm">
          <div className="flex items-start gap-2.5">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-blue-900 dark:text-blue-300">
                Ditemukan Draf Sesi Sebelumnya
              </strong>
              <p className="text-blue-800/90 dark:text-blue-200/90 mt-0.5 leading-relaxed">
                Tersimpan {hasRestorableSession.rowCount} baris ({hasRestorableSession.completedCount} terisi lengkap). Anda dapat memulihkannya jika sebelumnya tidak sengaja berpindah halaman atau me-refresh browser.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDismissRestore}
              className="px-2.5 py-1.5 text-xs rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              Abaikan
            </button>
            <button
              type="button"
              onClick={handleRestoreSession}
              className="sakala-btn sakala-btn-primary h-8 px-3 text-xs"
            >
              <History className="w-3.5 h-3.5" />
              <span>Pulihkan Sesi</span>
            </button>
          </div>
        </div>
      )}

      {/* Example Banner Notice if active */}
      {isViewingExample && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-950 dark:text-amber-200 flex items-start justify-between gap-3 print-hidden shadow-sm">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <strong className="block text-amber-900 dark:text-amber-300">
                Mode Contoh Tabel (15 Baris Lengkap + 1 Baris Belum Lengkap)
              </strong>
              <p className="text-amber-900/90 dark:text-amber-200/90">
                Ini adalah contoh sementara dari lembar kertas catatan untuk mencoba hitungan tabel. Angka ini <strong>tidak disimpan</strong> sebagai catatan toko nyata dan tidak memengaruhi saldo uang Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors shrink-0"
          >
            Kembalikan ke data toko
          </button>
        </div>
      )}

      {/* Stock Check Session Progress Bar Card */}
      <div className="sakala-card p-4 space-y-3 print-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Kemajuan Sesi Cek Sisa Fisik
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)]">
              <strong className="text-[var(--primary)] tabular-nums font-bold">
                {completedRowsCount}
              </strong>{' '}
              dari <strong className="text-[var(--text-main)] tabular-nums">{totalRowsCount}</strong>{' '}
              barang selesai ({stockProgressPercent}%)
            </span>
            <span className="text-[var(--text-dim)]">·</span>
            <span
              className={`font-semibold tabular-nums ${
                remainingRowsCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {remainingRowsCount > 0 ? `${remainingRowsCount} barang tersisa` : 'Semua lengkap'}
            </span>
            {lastAutoSavedTime && (
              <>
                <span className="text-[var(--text-dim)]">·</span>
                <span className="text-[11px] text-[var(--text-dim)] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Tersimpan {lastAutoSavedTime}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="w-full bg-[var(--bg-app)] h-2.5 rounded-full overflow-hidden border border-[var(--border-subtle)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${stockProgressPercent}%` }}
          />
        </div>

        {/* Quick Filter Segmented Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-dim)]">Filter baris:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[var(--primary)] text-white font-semibold shadow-sm'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
              }`}
            >
              Semua ({totalRowsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('incomplete')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'incomplete'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'bg-[var(--bg-app)] text-amber-700 dark:text-amber-400 hover:text-amber-800 border border-[var(--border-subtle)]'
              }`}
            >
              Belum Diisi ({remainingRowsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('complete')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'complete'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-[var(--bg-app)] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 border border-[var(--border-subtle)]'
              }`}
            >
              Lengkap ({completedRowsCount})
            </button>
          </div>

          {remainingRowsCount === 0 && totalRowsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Semua barang di rak telah selesai dihitung!</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Input Bar (when catalog has multiple items) */}
      <div className="flex items-center justify-between gap-4 print-hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama barang di tabel..."
            className="sakala-input pl-10 h-9 text-xs"
          />
        </div>

        <div className="text-xs text-[var(--text-dim)]">
          Total baris: <strong className="text-[var(--text-main)] tabular-nums">{rows.length}</strong>
        </div>
      </div>

      {/* Main Single Responsive Table */}
      <div className="sakala-card overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)] border-b border-[var(--border-strong)] text-[var(--text-dim)] uppercase text-[11px] tracking-wider shadow-sm">
              <tr>
                <th className="py-3 px-3 w-12 text-center font-bold">No.</th>
                <th className="py-3 px-3 min-w-[200px] font-bold">Nama Barang</th>
                <th className="py-3 px-3 w-28 font-bold">Kategori</th>
                <th className="py-3 px-3 w-36 text-center font-bold text-[var(--text-main)]">
                  Sisa Sekarang
                </th>
                <th className="py-3 px-3 w-36 text-right font-bold">Harga Jual / Item</th>
                <th className="py-3 px-3 w-36 text-right font-bold text-[var(--accent-mint)]">
                  Nilai Sisa
                </th>
                <th className="py-3 px-3 w-12 text-center font-bold print-hidden">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-subtle)]">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-dim)]">
                    Tidak ada barang yang cocok dengan pencarian "{search}".
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, index) => {
                  const val = validateRow(row);
                  const isComplete = val.status === 'valid';
                  const isIncomplete = val.status === 'incomplete';
                  const isInvalid = val.status === 'invalid';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-[var(--bg-elevated)]/30 transition-colors ${
                        isIncomplete || isInvalid ? 'bg-amber-500/10 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* 1. No */}
                      <td className="py-2 px-3 text-center text-[var(--text-dim)] tabular-nums font-mono">
                        {index + 1}
                      </td>

                      {/* 2. Nama Barang */}
                      <td className="py-2 px-3 min-w-[200px]">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRowField(row.id, 'name', e.target.value)}
                          placeholder="Nama barang..."
                          className="w-full bg-transparent px-2 py-1.5 rounded-md border border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--primary)] focus:bg-[var(--bg-app)] text-[var(--text-main)] font-semibold outline-none transition-all"
                        />
                        {/* Validation helper text */}
                        {(isIncomplete || isInvalid) && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 block px-2 mt-0.5">
                            {val.errorMessage || 'Coba periksa jumlah atau harga pada baris ini'}
                          </span>
                        )}
                      </td>

                      {/* 3. Kategori (Opsional) */}
                      <td className="py-2 px-3 w-28">
                        <select
                          value={row.category || 'Makanan'}
                          onChange={(e) => updateRowField(row.id, 'category', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 rounded-md border border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--primary)] focus:bg-[var(--bg-app)] text-[var(--text-muted)] text-[11px] outline-none transition-all"
                        >
                          <option value="Makanan">Makanan</option>
                          <option value="Minuman">Minuman</option>
                          <option value="Kebutuhan toko">Kebutuhan toko</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </td>

                      {/* 4. Sisa Sekarang (Input Utama) */}
                      <td className="py-2 px-3 w-36">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.quantityStr}
                            onChange={(e) => updateRowField(row.id, 'quantityStr', e.target.value)}
                            placeholder="0"
                            className="w-full h-8 px-2 pr-9 text-center font-bold text-sm tabular-nums rounded-md bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-[var(--text-main)] outline-none transition-all"
                            aria-label={`Sisa sekarang untuk ${row.name || 'barang'}`}
                          />
                          <span className="absolute right-2 text-[10px] text-[var(--text-dim)] pointer-events-none uppercase">
                            {row.unit || 'pcs'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Harga Jual / Item */}
                      <td className="py-2 px-3 w-36 text-right">
                        <div className="relative flex items-center justify-end">
                          <span className="absolute left-2 text-[10px] text-[var(--text-dim)] pointer-events-none">
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.priceStr}
                            onChange={(e) => updateRowField(row.id, 'priceStr', e.target.value)}
                            placeholder="0"
                            className="w-full h-8 pl-8 pr-2 text-right font-medium text-xs tabular-nums rounded-md bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] text-[var(--text-muted)] outline-none transition-all"
                            aria-label={`Harga jual satuan untuk ${row.name || 'barang'}`}
                          />
                        </div>
                      </td>

                      {/* 6. Nilai Sisa (Otomatis: sisa × harga) */}
                      <td className="py-2 px-3 w-36 text-right">
                        {isComplete ? (
                          <strong className="text-xs font-bold text-[var(--accent-mint)] tabular-nums block">
                            {formatRupiah(val.subtotal)}
                          </strong>
                        ) : (
                          <span className="text-xs text-[var(--text-dim)] block">
                            —
                          </span>
                        )}
                      </td>

                      {/* 7. Aksi Hapus Baris Draf */}
                      <td className="py-2 px-3 w-12 text-center print-hidden">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 transition-colors"
                          title="Hapus baris draf ini"
                          aria-label="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom add row quick trigger */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]/40 flex items-center justify-between print-hidden">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-mint)] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah baris barang baru</span>
          </button>

          <span className="text-[11px] text-[var(--text-dim)]">
            Baris kosong otomatis diabaikan dari hitungan
          </span>
        </div>
      </div>

      {/* 2. Ringkasan Otomatis di Bawah Tabel */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
              Ringkasan Nilai Sisa Barang
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Dihitung otomatis dari seluruh baris yang telah lengkap diisi
            </p>
          </div>

          <div className="flex items-center gap-2 print-hidden">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="sakala-btn sakala-btn-primary text-xs h-9 px-4"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Tinjau ringkasan</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
            <span className="text-[11px] text-[var(--text-dim)] block">Barang Lengkap</span>
            <strong className="text-xl font-bold text-[var(--text-main)] tabular-nums block mt-1">
              {summary.completeItemsCount} jenis
            </strong>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
            <span className="text-[11px] text-[var(--text-dim)] block">Jumlah Unit Tersisa</span>
            <strong className="text-xl font-bold text-[var(--text-main)] tabular-nums block mt-1">
              {formatNumber(summary.totalQuantity)} pcs
            </strong>
          </div>

          <div className="p-4 rounded-xl bg-teal-500/10 dark:bg-[#16223b] border border-teal-500/30 dark:border-teal-400/40 col-span-2 sm:col-span-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                Nilai sisa menurut harga jual
              </span>
              <span className="text-[10px] text-teal-700/80 dark:text-teal-300/80 uppercase font-bold">
                Estimasi Ritel
              </span>
            </div>
            <strong className="text-2xl font-extrabold font-display text-teal-950 dark:text-teal-200 tabular-nums block mt-1">
              {formatRupiah(summary.totalRetailValue)}
            </strong>
          </div>
        </div>

        {/* Incomplete warning if any */}
        {summary.incompleteCount > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900 dark:text-amber-300 block">
                Masih ada {summary.incompleteCount} baris yang perlu dilengkapi
              </strong>
              <p className="text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                Baris yang belum memiliki nama, jumlah, atau harga jual belum dimasukkan ke dalam subtotal nilai sisa.
              </p>
            </div>
          </div>
        )}

        {/* Mandatory Explicit Disclaimer */}
        <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-main)]">
            <Info className="w-4 h-4 text-[var(--accent-mint)]" />
            <span>Penting: Arti angka nilai sisa</span>
          </div>
          <p>
            <strong>Nilai sisa menurut harga jual</strong> adalah perkiraan nilai jika semua sisa barang yang ada saat ini berhasil terjual habis. Angka ini <strong>bukan modal barang</strong> yang tersisa dan <strong>bukan keuntungan toko</strong>.
          </p>
          <p className="text-[11px] text-[var(--text-dim)]">
            Keuntungan toko hanya dapat dihitung oleh sistem melalui pencatatan pembelian modal, barang terjual terverifikasi, barang rusak/hilang, dan pengeluaran operasional.
          </p>
        </div>
      </section>

      {/* 4. Panel Pengeluaran Toko Terpisah */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[var(--text-main)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                Pengeluaran Toko (Terpisah)
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Catat biaya operasional seperti gas, plastik, atau es batu. Angka ini tidak dikurangkan dari nilai stok.
            </p>
          </div>

          <div className="text-xs text-right">
            <span className="text-[11px] text-[var(--text-dim)] block">Total Pengeluaran:</span>
            <strong className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatRupiah(summary.totalExpenses)}
            </strong>
          </div>
        </div>

        {/* Shortcut Quick Buttons */}
        <div className="space-y-2 print-hidden">
          <span className="text-[11px] text-[var(--text-dim)] block font-medium">
            Pintasan cepat (hanya membuat baris input, tidak langsung membuat transaksi):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Gas LPG 3kg', label: '+ Gas LPG' },
              { name: 'Kantong plastik kresek', label: '+ Kantong Plastik' },
              { name: 'Es batu kristal', label: '+ Es Batu' },
              { name: 'Sabun cuci toko', label: '+ Sabun Cuci' }
            ].map((shortcut) => (
              <button
                key={shortcut.name}
                type="button"
                onClick={() => addExpenseRow(shortcut.name)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all"
              >
                {shortcut.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => addExpenseRow()}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all"
            >
              + Baris Pengeluaran Baru
            </button>
          </div>
        </div>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-dim)] border border-dashed border-[var(--border-subtle)] rounded-xl">
            Belum ada pengeluaran tambahan yang dicatat pada lembar ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((exp, i) => (
              <div
                key={exp.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs"
              >
                <span className="text-[11px] text-[var(--text-dim)] w-6 text-center font-mono">
                  #{i + 1}
                </span>

                <input
                  type="text"
                  value={exp.name}
                  onChange={(e) => updateExpense(exp.id, 'name', e.target.value)}
                  placeholder="Nama pengeluaran (misal: kantong plastik)..."
                  className="sakala-input h-8 text-xs flex-1"
                />

                <div className="relative w-40">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-dim)] pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={exp.amountStr}
                    onChange={(e) => updateExpense(exp.id, 'amountStr', e.target.value)}
                    placeholder="0"
                    className="sakala-input h-8 pl-8 text-xs text-right tabular-nums font-semibold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => deleteExpense(exp.id)}
                  className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-400 print-hidden"
                  title="Hapus baris pengeluaran"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Modal Tinjau Ringkasan Sebelum Selesai */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Tinjauan Cek Sisa Barang"
        description="Periksa kembali rangkuman sebelum lembar dicetak atau ditutup"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Jumlah barang lengkap:</span>
              <strong className="text-[var(--text-main)] tabular-nums">
                {summary.completeItemsCount} macam
              </strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Total unit fisik tersisa:</span>
              <strong className="text-[var(--text-main)] tabular-nums">
                {formatNumber(summary.totalQuantity)} pcs
              </strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Nilai sisa menurut harga jual:</span>
              <strong className="text-base text-teal-700 dark:text-teal-300 tabular-nums font-bold">
                {formatRupiah(summary.totalRetailValue)}
              </strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Total pengeluaran operasional:</span>
              <strong className="text-rose-600 dark:text-rose-400 tabular-nums font-semibold">
                {formatRupiah(summary.totalExpenses)}
              </strong>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-muted)]">Baris belum lengkap:</span>
              <span className={summary.incompleteCount > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                {summary.incompleteCount > 0 ? `${summary.incompleteCount} baris` : 'Semua lengkap'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-950/30 text-[11px] text-teal-950 dark:text-teal-200 leading-relaxed">
            <strong className="text-teal-900 dark:text-teal-300">Status Penyimpanan:</strong> Data ini adalah draf di memori browser. Belum ada transaksi yang disimpan secara permanen ke server database. Anda dapat mencetak lembar ini untuk arsip fisik toko.
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handlePrint}
              className="sakala-btn sakala-btn-secondary text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="sakala-btn sakala-btn-primary text-xs"
            >
              Selesai Meninjau
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

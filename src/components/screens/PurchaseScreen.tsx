import { useState, useMemo, type ChangeEvent } from 'react';
import {
  ShoppingBasket,
  Wallet,
  Briefcase,
  Calculator,
  Check,
  ArrowDownRight,
  Package,
  Plus,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Product, MoneySource } from '@/types/store';
import { useStore } from '@/context/StoreContext';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { WorkflowStepBanner } from '@/components/WorkflowStepBanner';
import { WorkflowGuideModal } from '@/components/WorkflowGuideModal';

interface PurchaseScreenProps {
  initialProduct?: Product | null;
}

export function PurchaseScreen({ initialProduct }: PurchaseScreenProps) {
  const { products, addProduct, addEvent, notify } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );

  // Track products recorded in current entry session
  const [sessionRecordedProductIds, setSessionRecordedProductIds] = useState<string[]>([]);

  const [packUnit, setPackUnit] = useState('dus');
  const [packs, setPacks] = useState('2');
  const [unitsPerPack, setUnitsPerPack] = useState('24');
  const [packCost, setPackCost] = useState('96000');
  const [sourceMoney, setSourceMoney] = useState<MoneySource>('STORE');

  // Quick add product modal
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('5000');

  // Active product
  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const [sellingPrice, setSellingPrice] = useState<string>(
    activeProduct ? activeProduct.sellingPrice.toString() : '5000'
  );

  // Sync selling price when product selection changes
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSellingPrice(prod.sellingPrice.toString());
    }
  };

  const preview = useMemo(() => {
    const p = parseInt(packs, 10) || 0;
    const u = parseInt(unitsPerPack, 10) || 0;
    const c = parseInt(packCost, 10) || 0;
    const s = parseInt(sellingPrice, 10) || 0;
    return calculatePurchasePreview({
      packs: p,
      unitsPerPack: u,
      costPerPack: c,
      sellingPricePerUnit: s
    });
  }, [packs, unitsPerPack, packCost, sellingPrice]);

  const updateNumeric =
    (setter: (val: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value.replace(/\D/g, ''));
    };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !preview) {
      notify('error', 'Form belum lengkap', 'Silakan periksa kembali angka belanjaan Anda.');
      return;
    }

    const packsNum = parseInt(packs, 10);
    const unitsPerPackNum = parseInt(unitsPerPack, 10);

    if (packsNum <= 0 || unitsPerPackNum <= 0 || preview.totalCost <= 0) {
      notify('error', 'Angka tidak valid', 'Jumlah kemasan dan biaya modal harus lebih dari nol.');
      return;
    }

    // Record purchase event
    addEvent({
      type: 'purchase',
      productId: activeProduct.id,
      packs: packsNum,
      unitsPerPack: unitsPerPackNum,
      totalCost: preview.totalCost,
      sourceMoney
    });

    // Mark product as recorded in current entry session
    setSessionRecordedProductIds((prev) =>
      prev.includes(activeProduct.id) ? prev : [...prev, activeProduct.id]
    );

    // Auto-advance to the next unrecorded product if available
    const nextUnrecorded = products.find(
      (p) => p.id !== activeProduct.id && !sessionRecordedProductIds.includes(p.id)
    );
    if (nextUnrecorded) {
      handleSelectProduct(nextUnrecorded.id);
    }

    notify(
      'success',
      'Belanja Berhasil Dicatat',
      `${packsNum} ${packUnit} (${preview.totalUnits} pcs) ${activeProduct.name} telah ditambahkan ke stok.`
    );
  };

  const handleQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    const priceNum = parseInt(newProdSellingPrice.replace(/\D/g, ''), 10) || 0;
    const created = addProduct(newProdName.trim(), priceNum);
    setSelectedProductId(created.id);
    setSellingPrice(created.sellingPrice.toString());
    setIsNewProdModalOpen(false);
    setNewProdName('');
  };

  // Session progress calculation
  const totalSessionProducts = products.length;
  const completedSessionCount = sessionRecordedProductIds.filter((id) =>
    products.some((p) => p.id === id)
  ).length;
  const remainingSessionCount = Math.max(0, totalSessionProducts - completedSessionCount);
  const sessionProgressPercent =
    totalSessionProducts > 0
      ? Math.round((completedSessionCount / totalSessionProducts) * 100)
      : 0;

  const remainingProducts = products.filter(
    (p) => !sessionRecordedProductIds.includes(p.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Step 1 Workflow Banner */}
      <WorkflowStepBanner
        step={1}
        title="Catat Belanja Barang Masuk"
        subtitle="Input jumlah kemasan (dus/pak), isi per kemasan, dan harga beli modal. Sistem otomatis menghitung jumlah unit masuk dan potensi Keuntungan Jual."
        ruleTip="Keuntungan Jual = nilai jual jika semua barang terjual (belum dikurangi modal beli, bukan laba bersih)."
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Purchase Session Progress Bar Card */}
      <div className="sakala-card p-4 space-y-3 print-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Kemajuan Sesi Belanja Barang
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)]">
              <strong className="text-[var(--primary)] tabular-nums font-bold">
                {completedSessionCount}
              </strong>{' '}
              dari <strong className="text-[var(--text-main)] tabular-nums">{totalSessionProducts}</strong>{' '}
              barang tercatat ({sessionProgressPercent}%)
            </span>
            <span className="text-[var(--text-dim)]">·</span>
            <span
              className={`font-semibold tabular-nums ${
                remainingSessionCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {remainingSessionCount > 0
                ? `${remainingSessionCount} barang tersisa`
                : 'Semua tercatat'}
            </span>
            {completedSessionCount > 0 && (
              <>
                <span className="text-[var(--text-dim)]">·</span>
                <button
                  type="button"
                  onClick={() => setSessionRecordedProductIds([])}
                  className="text-[11px] text-[var(--text-dim)] hover:text-rose-500 transition-colors flex items-center gap-1"
                  title="Mulai sesi belanja baru dan kosongkan daftar tercentang"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset sesi</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="w-full bg-[var(--bg-app)] h-2.5 rounded-full overflow-hidden border border-[var(--border-subtle)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${sessionProgressPercent}%` }}
          />
        </div>

        {/* Quick Remaining Items Pills */}
        <div className="pt-0.5 text-xs">
          {remainingSessionCount > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[11px] text-[var(--text-dim)] block">
                Pilih barang yang belum dicatat berikutnya:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {remainingProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white font-semibold shadow-sm ring-2 ring-[var(--primary)]/30'
                          : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Hebat! Seluruh {totalSessionProducts} barang di katalog telah dicatat dalam sesi belanja ini.
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Purchase Form (7 cols) */}
        <div className="lg:col-span-7 sakala-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Formulir Belanja Barang
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Catat stok masuk dari agen, pasar, atau distributor
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewProdModalOpen(true)}
              className="sakala-btn sakala-btn-secondary h-8 px-2.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Barang Baru</span>
            </button>
          </div>

          <form onSubmit={handleSavePurchase} className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                Pilih Barang
              </label>
              {products.length === 0 ? (
                <div className="text-xs text-amber-950 dark:text-amber-200 p-3 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
                  Belum ada barang di katalog. Klik "Barang Baru" di atas terlebih dahulu.
                </div>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="sakala-input font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Harga jual: {formatRupiah(p.sellingPrice)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Packaging Unit & Quantity */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Satuan Beli
                </label>
                <select
                  value={packUnit}
                  onChange={(e) => setPackUnit(e.target.value)}
                  className="sakala-input"
                >
                  <option value="dus">Dus / Karton</option>
                  <option value="pak">Pak</option>
                  <option value="renceng">Renceng</option>
                  <option value="toples">Toples</option>
                  <option value="bal">Bal</option>
                  <option value="peti">Peti</option>
                  <option value="lusin">Lusin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Jumlah Kemasan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={packs}
                    onChange={updateNumeric(setPacks)}
                    className="sakala-input pr-10 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] pointer-events-none">
                    {packUnit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Isi per Kemasan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={unitsPerPack}
                    onChange={updateNumeric(setUnitsPerPack)}
                    className="sakala-input pr-10 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] pointer-events-none">
                    pcs
                  </span>
                </div>
              </div>
            </div>

            {/* Pack Cost & Selling Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Harga Beli Modal per Kemasan ({packUnit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={packCost}
                    onChange={updateNumeric(setPackCost)}
                    className="sakala-input pl-10 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Harga Jual Satuan (pcs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={sellingPrice}
                    onChange={updateNumeric(setSellingPrice)}
                    className="sakala-input pl-10 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Source of Funds */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                Sumber Uang Belanja
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceMoney('STORE')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    sourceMoney === 'STORE'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)] shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-semibold block">Uang Kas Toko</strong>
                    <span className="text-[11px] text-[var(--text-dim)] block">
                      Kas toko langsung berkurang
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMoney('PERSONAL')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    sourceMoney === 'PERSONAL'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)] shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Briefcase className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-semibold block">Uang Pribadi</strong>
                    <span className="text-[11px] text-[var(--text-dim)] block">
                      Kas toko tetap utuh (talangan)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="submit"
                disabled={!activeProduct || !preview}
                className="w-full sakala-btn sakala-btn-primary h-11 text-sm justify-center"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Catatan Belanja</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation Preview (5 cols) */}
        <div className="lg:col-span-5 sakala-card p-6 space-y-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                Hasil Hitungan Otomatis
              </h3>
            </div>
            <span className="text-[11px] text-[var(--accent-mint)] font-medium">
              Pratinjau Langsung
            </span>
          </div>

          {preview && activeProduct ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-[var(--text-main)] block truncate">
                    {activeProduct.name}
                  </strong>
                  <span className="text-[11px] text-[var(--text-dim)] block">
                    {packs} {packUnit} × {unitsPerPack} pcs = {preview.totalUnits} unit masuk
                  </span>
                </div>
              </div>

              {/* Keuntungan Jual / Potensi Nilai Jual Highlight Card */}
              <div className="p-4 rounded-2xl bg-[#ffeae5] dark:bg-[#16223b] border border-[#fccfca] dark:border-[#ff725e]/40 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8c2612] dark:text-[#ff927f]">
                    Keuntungan Jual (nilai jika semua terjual)
                  </span>
                  <span className="text-[10px] text-[#8c2612]/80 dark:text-[#ffb3a6]/80 uppercase font-bold">
                    Omzet Potensial
                  </span>
                </div>
                <strong className="text-xl font-extrabold font-display text-[#5c1708] dark:text-white tabular-nums block">
                  {formatRupiah(preview.potentialSalesRevenue)}
                </strong>
                <p className="text-[11px] text-[#8c2612]/90 dark:text-[#ffb3a6]/90 leading-tight">
                  *Potensi nilai jual, bukan laba: {preview.totalUnits} pcs × {formatRupiah(preview.sellingPricePerUnit)}. Belum dikurangi modal pembelian.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Total Barang Masuk</span>
                  <strong className="text-[var(--text-main)] tabular-nums">
                    {formatNumber(preview.totalUnits)} pcs
                  </strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Total Modal Belanja</span>
                  <strong className="text-[var(--text-main)] tabular-nums">
                    {formatRupiah(preview.totalCost)}
                  </strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Modal Rata-rata per pcs</span>
                  <strong className="text-[var(--text-main)] tabular-nums">
                    {formatRupiah(preview.unitCostRounded)}
                  </strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Selisih Margin Jual - Modal</span>
                  <strong
                    className={`tabular-nums ${
                      preview.unitPriceDifference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {preview.unitPriceDifference >= 0 ? '+' : ''}
                    {formatRupiah(preview.unitPriceDifference)} / pcs
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center gap-3">
                <ArrowDownRight className="w-4 h-4 text-[var(--accent-mint)] shrink-0" />
                <div className="text-xs">
                  <span className="text-[var(--text-dim)] block">Dampak Kas Toko:</span>
                  <strong className="text-[var(--text-main)]">
                    {sourceMoney === 'STORE'
                      ? `Keluar ${formatRupiah(preview.totalCost)}`
                      : 'Kas toko tidak berkurang (uang pribadi)'}
                  </strong>
                </div>
              </div>

              {/* Educational Collapsible */}
              <details className="text-xs text-[var(--text-dim)] border border-[var(--border-subtle)] rounded-xl p-3 bg-[var(--bg-app)]">
                <summary className="font-semibold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]">
                  Kenapa disebut "Keuntungan Jual" di buku toko?
                </summary>
                <p className="mt-2 text-[11px] leading-relaxed">
                  Di buku pencatatan warung, pemilik sering menggunakan istilah <em>"Keuntungan Jual"</em> untuk menggambarkan total uang yang akan didapat jika seluruh barang laku terjual sebelum modalnya dikurangi. Dalam istilah akuntansi yang tepat, ini adalah <strong>potensi nilai jual / omzet kotor</strong>. Laba bersih yang sesungguhnya baru dihitung setelah dikurangi modal barang yang benar-benar terjual dan pengeluaran toko.
                </p>
              </details>
            </div>
          ) : (
            <div className="text-xs text-[var(--text-dim)] py-8 text-center">
              Masukkan angka kemasan dan harga untuk melihat pratinjau.
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Product Modal */}
      <Modal
        isOpen={isNewProdModalOpen}
        onClose={() => setIsNewProdModalOpen(false)}
        title="Daftarkan Barang Baru"
        description="Tambahkan barang ke katalog agar dapat dipilih dalam belanja"
      >
        <form onSubmit={handleQuickAddProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              Nama Barang
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder="Contoh: Kopi Kapal Api"
              className="sakala-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              Harga Jual Satuan (Rp)
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              value={newProdSellingPrice}
              onChange={(e) =>
                setNewProdSellingPrice(e.target.value.replace(/\D/g, ''))
              }
              placeholder="Contoh: 3000"
              className="sakala-input tabular-nums"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsNewProdModalOpen(false)}
              className="sakala-btn sakala-btn-ghost"
            >
              Batal
            </button>
            <button type="submit" className="sakala-btn sakala-btn-primary">
              Simpan & Pilih
            </button>
          </div>
        </form>
      </Modal>

      <WorkflowGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </motion.div>
  );
}

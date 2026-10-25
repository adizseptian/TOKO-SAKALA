import { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  ShoppingBasket,
  ClipboardCheck,
  LayoutGrid,
  List,
  ArrowUpDown,
  AlertCircle,
  X,
  Layers,
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ScreenId, Product } from '@/types/store';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProductsScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectProductForPurchase?: (product: Product) => void;
}

type ViewMode = 'grid' | 'table';
type StockFilter = 'all' | 'in_stock' | 'out_of_stock';
type SortOption = 'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc' | 'sold_desc' | 'price_desc' | 'price_asc';

export function ProductsScreen({ onNavigate, onSelectProductForPurchase }: ProductsScreenProps) {
  const { products, engineOutput, addProduct, updateProductPrice } = useStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');

  // Edit price state
  const [editPriceValue, setEditPriceValue] = useState('');

  // Helper map for quick calculations lookup
  const calcMap = useMemo(() => {
    const map = new Map<string, { availableUnits: number; unitsSold: number; inventoryValue: number }>();
    for (const calc of engineOutput.products) {
      map.set(calc.productId, {
        availableUnits: calc.availableUnits,
        unitsSold: calc.unitsSold,
        inventoryValue: calc.knownInventoryValue
      });
    }
    return map;
  }, [engineOutput.products]);

  // Aggregate stats
  const { inStockCount, outOfStockCount, totalUnits, totalInventoryValue } = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    let units = 0;
    let invValue = 0;

    for (const p of products) {
      const c = calcMap.get(p.id);
      const stock = c ? c.availableUnits : 0;
      if (stock > 0) inStock++;
      else outOfStock++;
      units += stock;
      invValue += c ? c.inventoryValue : 0;
    }
    return {
      inStockCount: inStock,
      outOfStockCount: outOfStock,
      totalUnits: units,
      totalInventoryValue: invValue
    };
  }, [products, calcMap]);

  // Filtered and sorted products
  const displayedProducts = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return products
      .filter((p) => {
        // Text search
        if (searchLower && !p.name.toLowerCase().includes(searchLower)) {
          return false;
        }

        // Stock status filter
        const c = calcMap.get(p.id);
        const stock = c ? c.availableUnits : 0;
        if (stockFilter === 'in_stock') return stock > 0;
        if (stockFilter === 'out_of_stock') return stock <= 0;

        return true;
      })
      .sort((a, b) => {
        const calca = calcMap.get(a.id);
        const calcb = calcMap.get(b.id);
        const stockA = calca ? calca.availableUnits : 0;
        const stockB = calcb ? calcb.availableUnits : 0;
        const soldA = calca ? calca.unitsSold : 0;
        const soldB = calcb ? calcb.unitsSold : 0;

        switch (sortOption) {
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'stock_asc':
            return stockA - stockB;
          case 'stock_desc':
            return stockB - stockA;
          case 'sold_desc':
            return soldB - soldA;
          case 'price_desc':
            return b.sellingPrice - a.sellingPrice;
          case 'price_asc':
            return a.sellingPrice - b.sellingPrice;
          case 'name_asc':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, search, stockFilter, sortOption, calcMap]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSellingPrice) return;
    const priceNum = parseInt(newSellingPrice.replace(/\D/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) return;

    addProduct(newName.trim(), priceNum);
    setNewName('');
    setNewSellingPrice('');
    setIsAddModalOpen(false);
  };

  const handleEditPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editPriceValue) return;
    const priceNum = parseInt(editPriceValue.replace(/\D/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) return;

    updateProductPrice(selectedProduct.id, priceNum);
    setIsEditPriceModalOpen(false);
    setSelectedProduct(null);
  };

  const openEditPrice = (product: Product) => {
    setSelectedProduct(product);
    setEditPriceValue(product.sellingPrice.toString());
    setIsEditPriceModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* KPI Overview Strip (BrightPolicy Studio Pastel & Midnight Tiles) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-3xl bg-[#ffeae5] dark:bg-[#16223b] border border-[#fcd5cd] dark:border-[#ff725e]/40 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#8c2612] dark:text-[#ff927f]">Total Produk</span>
            <div className="w-8 h-8 rounded-full bg-[#e06346]/20 dark:bg-[#ff725e]/25 text-[#8c2612] dark:text-[#ff927f] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold font-display text-[#5c1708] dark:text-white tabular-nums block">
            {products.length} macam
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[#e7f7f0] dark:bg-[#16223b] border border-[#c3ecdc] dark:border-[#2dd4bf]/40 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#056045] dark:text-[#5eead4]">Stok Fisik Ada</span>
            <div className="w-8 h-8 rounded-full bg-[#10b981]/20 dark:bg-[#2dd4bf]/25 text-[#056045] dark:text-[#5eead4] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold font-display text-[#034431] dark:text-white tabular-nums block">
            {formatNumber(totalUnits)} pcs
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[#fff2e3] dark:bg-[#16223b] border border-[#fddbb8] dark:border-[#fbbf24]/40 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#8c3d03] dark:text-[#fde68a]">Habis / 0 pcs</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              outOfStockCount > 0 ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-[#8c3d03] dark:text-[#fbbf24]'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-xl font-extrabold font-display tabular-nums block ${
            outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#6e2e00] dark:text-white'
          }`}>
            {outOfStockCount} produk
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[#eaf4fb] dark:bg-[#16223b] border border-[#c5e1f7] dark:border-[#38bdf8]/40 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#034f78] dark:text-[#7dd3fc]">Nilai Aset Modal</span>
            <div className="w-8 h-8 rounded-full bg-[#0284c7]/20 dark:bg-[#38bdf8]/25 text-[#034f78] dark:text-[#7dd3fc] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold font-display text-[#063b59] dark:text-white tabular-nums block truncate">
            {formatRupiah(totalInventoryValue)}
          </span>
        </div>
      </section>

      {/* Top Search, Actions, View Mode & Filters */}
      <div className="space-y-4">
        {/* Row 1: Search & Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang..."
              className="sakala-input pl-10 pr-9 rounded-2xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-dim)] hover:text-[var(--text-main)] rounded-full"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="sakala-btn sakala-btn-primary shrink-0 min-h-[42px] rounded-2xl px-5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>

        {/* Row 2: Filter Segmented Controls, Sort Dropdown, and Grid/Table Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--border-subtle)]">
          {/* Stock Filters (Functional Segmented Buttons) */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                stockFilter === 'all'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Semua ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('in_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                stockFilter === 'in_stock'
                  ? 'bg-[var(--bg-card)] text-emerald-700 dark:text-emerald-400 shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Stok Ada ({inStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                stockFilter === 'out_of_stock'
                  ? 'bg-[var(--bg-card)] text-rose-600 dark:text-rose-400 shadow-xs border border-[var(--border-strong)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Habis / 0 pcs ({outOfStockCount})
            </button>
          </div>

          {/* Right Toolbar: Sort Dropdown + View Toggle */}
          <div className="flex items-center gap-2">
            {/* Sort Control */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-2.5 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="Urutkan daftar barang"
                className="sakala-input h-9 text-xs pl-8 pr-7 py-0 bg-[var(--bg-app)] border-[var(--border-subtle)] rounded-lg text-[var(--text-main)] font-medium cursor-pointer"
              >
                <option value="name_asc">Nama (A - Z)</option>
                <option value="name_desc">Nama (Z - A)</option>
                <option value="stock_asc">Stok: Menipis dulu</option>
                <option value="stock_desc">Stok: Terbanyak dulu</option>
                <option value="sold_desc">Terlaris (Unit Terjual)</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="price_asc">Harga Terendah</option>
              </select>
            </div>

            {/* View Mode Switcher (Grid vs Table) */}
            <div className="flex items-center p-1 bg-[var(--bg-app)] rounded-lg border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
                }`}
                title="Tampilan Grid Kartu"
                aria-label="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  viewMode === 'table'
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-strong)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
                }`}
                title="Tampilan Tabel Rinci"
                aria-label="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Content: Empty, Grid, or Table */}
      {displayedProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? 'Barang tidak ditemukan' : 'Tidak ada barang dalam filter ini'}
          description={
            search
              ? `Tidak ditemukan barang dengan kata kunci "${search}". Periksa ejaan atau tambahkan barang baru.`
              : stockFilter === 'out_of_stock'
              ? 'Kabar baik! Seluruh barang saat ini masih memiliki persediaan stok.'
              : 'Belum ada barang yang sesuai dengan kriteria yang dipilih.'
          }
          action={
            <div className="flex items-center gap-2">
              {(search || stockFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStockFilter('all');
                  }}
                  className="sakala-btn sakala-btn-secondary min-h-[40px]"
                >
                  Reset Filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="sakala-btn sakala-btn-primary min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Barang Baru</span>
              </button>
            </div>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProducts.map((product) => {
            const calc = calcMap.get(product.id);
            const stockUnits = calc ? calc.availableUnits : 0;
            const inventoryValue = calc ? calc.inventoryValue : 0;
            const unitsSold = calc ? calc.unitsSold : 0;
            const isOutOfStock = stockUnits <= 0;

            return (
              <div
                key={product.id}
                className={`sakala-card p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-[var(--border-strong)] transition-all ${
                  isOutOfStock ? 'opacity-95' : ''
                }`}
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ffeae5] text-[#e06346] dark:bg-[#e06346]/20 dark:text-[#ff8975] flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[var(--text-main)] line-clamp-2">
                        {product.name}
                      </h4>
                      {isOutOfStock ? (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Stok Habis (0 pcs)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-dim)] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Tersedia di rak</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditPrice(product)}
                      className="min-w-[40px] min-h-[40px] p-2 rounded-2xl text-[var(--text-dim)] hover:text-[#e06346] hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-center shrink-0"
                      title="Ubah harga jual"
                      aria-label={`Ubah harga jual untuk ${product.name}`}
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-3">
                    <span className="text-xs text-[var(--text-muted)]">Harga Jual</span>
                    <strong className="text-base font-extrabold text-[#e06346] dark:text-[#ff725e] tabular-nums">
                      {formatRupiah(product.sellingPrice)}
                    </strong>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2.5 rounded-2xl border ${
                      isOutOfStock
                        ? 'bg-rose-500/10 border-rose-300/40 dark:border-rose-900/40'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
                    }`}>
                      <span className="text-[11px] text-[var(--text-dim)] block font-medium">Stok Tersedia</span>
                      <strong className={`text-sm font-semibold tabular-nums block mt-0.5 ${
                        isOutOfStock
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-[var(--text-main)]'
                      }`}>
                        {formatNumber(stockUnits)} pcs
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                      <span className="text-[11px] text-[var(--text-dim)] block font-medium">Terjual</span>
                      <strong className="text-sm font-semibold text-[var(--text-main)] tabular-nums block mt-0.5">
                        {formatNumber(unitsSold)} pcs
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[11px] text-[var(--text-dim)] flex items-center justify-between px-1">
                    <span>Nilai Modal Stok</span>
                    <span className="tabular-nums font-medium text-[var(--text-muted)]">
                      {formatRupiah(inventoryValue)}
                    </span>
                  </div>
                </div>

                {/* Card Actions with >= 40px touch target */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectProductForPurchase) {
                        onSelectProductForPurchase(product);
                      }
                      onNavigate('belanja');
                    }}
                    className={`flex-1 sakala-btn min-h-[40px] text-xs py-0 rounded-2xl ${
                      isOutOfStock ? 'sakala-btn-primary' : 'sakala-btn-secondary'
                    }`}
                  >
                    <ShoppingBasket className="w-3.5 h-3.5" />
                    <span>Beli Lagi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('cek-sisa')}
                    className="sakala-btn sakala-btn-secondary min-h-[40px] px-3 text-xs rounded-2xl"
                    title="Cek Sisa Fisik Barang Ini"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span className="sr-only">Cek Sisa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="sakala-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-right">Stok Fisik</th>
                  <th className="py-3 px-4 text-right">Unit Terjual</th>
                  <th className="py-3 px-4 text-right">Nilai Modal</th>
                  <th className="py-3 px-4 text-center w-36">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {displayedProducts.map((product, idx) => {
                  const calc = calcMap.get(product.id);
                  const stockUnits = calc ? calc.availableUnits : 0;
                  const inventoryValue = calc ? calc.inventoryValue : 0;
                  const unitsSold = calc ? calc.unitsSold : 0;
                  const isOutOfStock = stockUnits <= 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-[var(--text-dim)]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-main)]">
                        <div>
                          <span className="block font-semibold">{product.name}</span>
                          {isOutOfStock && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
                              Stok Habis (0 pcs)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-[#c94b2f] dark:text-[#ff725e]">
                        {formatRupiah(product.sellingPrice)}
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums font-semibold ${
                        isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-main)]'
                      }`}>
                        {formatNumber(stockUnits)} pcs
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[var(--text-main)]">
                        {formatNumber(unitsSold)} pcs
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[var(--text-muted)]">
                        {formatRupiah(inventoryValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditPrice(product)}
                            className="p-2 rounded text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Ubah harga jual"
                            aria-label={`Ubah harga jual ${product.name}`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectProductForPurchase) {
                                onSelectProductForPurchase(product);
                              }
                              onNavigate('belanja');
                            }}
                            className="p-2 rounded text-[var(--accent-mint)] hover:bg-[var(--primary)]/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Catat belanja lagi"
                            aria-label={`Belanja lagi ${product.name}`}
                          >
                            <ShoppingBasket className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tambah Barang Baru */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Barang Baru"
        description="Masukkan nama produk dan harga jual per pcs/bungkus."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Nama Barang
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Indomie Goreng, Kopi Kapal Api..."
              className="sakala-input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Harga Jual Satuan (Rp)
            </label>
            <input
              type="text"
              required
              value={newSellingPrice}
              onChange={(e) => setNewSellingPrice(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 3500"
              className="sakala-input tabular-nums font-mono"
            />
            <span className="text-[11px] text-[var(--text-dim)] mt-1 block">
              Harga jual saat pelanggan membeli satuan di warung/toko.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="sakala-btn sakala-btn-ghost min-h-[40px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="sakala-btn sakala-btn-primary min-h-[40px]"
            >
              Simpan Barang
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ubah Harga Jual */}
      <Modal
        isOpen={isEditPriceModalOpen}
        onClose={() => {
          setIsEditPriceModalOpen(false);
          setSelectedProduct(null);
        }}
        title="Ubah Harga Jual"
        description={
          selectedProduct
            ? `Perbarui harga jual satuan untuk "${selectedProduct.name}".`
            : 'Perbarui harga jual satuan.'
        }
      >
        <form onSubmit={handleEditPriceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Harga Jual Baru (Rp)
            </label>
            <input
              type="text"
              required
              value={editPriceValue}
              onChange={(e) => setEditPriceValue(e.target.value.replace(/\D/g, ''))}
              placeholder="Masukkan nominal harga baru..."
              className="sakala-input tabular-nums font-mono"
              autoFocus
            />
            <span className="text-[11px] text-[var(--text-dim)] mt-1 block">
              Perubahan harga akan tercatat di riwayat jejak audit toko.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setIsEditPriceModalOpen(false);
                setSelectedProduct(null);
              }}
              className="sakala-btn sakala-btn-ghost min-h-[40px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="sakala-btn sakala-btn-primary min-h-[40px]"
            >
              Simpan Harga
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

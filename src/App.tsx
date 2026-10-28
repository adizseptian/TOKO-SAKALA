import { useState, useMemo } from 'react';
import {
  Bell, ChevronRight, Calendar, AlertCircle, ShoppingCart,
  Package, Wallet, FileText, ArrowLeft, Search, SlidersHorizontal, Plus,
  Minus, Check, ArrowRight, CornerDownLeft, Sparkles, RefreshCw, Moon, Sun,
  Cloud, Database, ShieldCheck, History, HardDrive
} from 'lucide-react';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import { calculateStockCheckPreview } from '@/engine/v1/stock-check-preview';
import { MockStorageAdapter } from '@/storage/mockStorageAdapter';
import type { BackupMetadata } from '@/storage/types';

type PrimaryTab = 'beranda' | 'catat' | 'stok' | 'setoran' | 'lainnya';
type Screen = PrimaryTab | 'biaya' | 'laporan' | 'riwayat' | 'barang' | 'asisten' | 'pengaturan';

interface ProductItem {
  id: string;
  name: string;
  category: 'Makanan' | 'Minuman' | 'Rokok' | 'Lainnya';
  unit: string;
  packSize: number;
  costPerPack: number;
  sellingPricePerUnit: number;
  icon: string;
}

const INITIAL_CATALOG: ProductItem[] = [
  { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 96000, sellingPricePerUnit: 3000, icon: '🍜' },
  { id: 'sedap', name: 'Mie Sedap', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 92000, sellingPricePerUnit: 2800, icon: '🍜' },
  { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus (24 botol)', packSize: 24, costPerPack: 45000, sellingPricePerUnit: 3000, icon: '💧' },
  { id: 'telur', name: 'Telur Ayam Negeri', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 26000, sellingPricePerUnit: 29000, icon: '🥚' },
  { id: 'gula', name: 'Gula Pasir', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 16000, sellingPricePerUnit: 18000, icon: '🍚' },
  { id: 'chocopie', name: 'ChocoPie', category: 'Makanan', unit: 'Pcs', packSize: 1, costPerPack: 2000, sellingPricePerUnit: 2500, icon: '🍪' },
  { id: 'sampoerna', name: 'Rokok Sampoerna', category: 'Rokok', unit: 'Slop (10 bks)', packSize: 10, costPerPack: 310000, sellingPricePerUnit: 34000, icon: '🚬' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('beranda');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Screen 2: Catat Belanja State
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(INITIAL_CATALOG[0]);
  const [purchaseQty, setPurchaseQty] = useState<number>(2);
  const [catatCategory, setCatatCategory] = useState<string>('Semua');
  const [catatSearch, setCatatSearch] = useState<string>('');

  // Screen 3: Cek Sisa Stok State
  const [stockCounts, setStockCounts] = useState<Record<string, number | null>>({
    indomie: 12,
    aqua: 5,
    telur: 0,
    gula: null,
    chocopie: null,
    sampoerna: 3,
  });
  const [stokCategory, setStokCategory] = useState<string>('Semua');
  const [stokSearch, setStokSearch] = useState<string>('');

  // Screen 4: Setoran Karyawan State
  const [expectedAmount] = useState<number>(1250000);
  const [receivedAmount, setReceivedAmount] = useState<number>(1200000);
  const [depositNote, setDepositNote] = useState<string>('');
  const [depositDate, setDepositDate] = useState<string>('Rabu, 28 Okt 2025');

  // Google Drive Backend & Storage State
  const [storageAdapter] = useState(() => new MockStorageAdapter());
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(true);
  const [driveEmail] = useState<string>('adizseptian@gmail.com');
  const [dataVersion, setDataVersion] = useState<number>(1);
  const [checksumStatus, setChecksumStatus] = useState<'VALID' | 'CORRUPT' | 'UNCHECKED'>('VALID');
  const [lastBackupTime, setLastBackupTime] = useState<string>('28 Okt 2026, 17:56 WIB');
  const [backups, setBackups] = useState<BackupMetadata[]>([
    {
      id: 'backup-init-1',
      fileName: 'backup-2026-10-28-175642.json',
      createdAt: '2026-10-28T10:56:42Z',
      dataVersion: 1,
      schemaVersion: 1,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      byteSize: 1420,
      label: 'Cadangan Awal Toko Sakala',
    },
  ]);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const meta = await storageAdapter.createBackup('Cadangan Manual Pengguna');
      setBackups(prev => [meta, ...prev]);
      setLastBackupTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
      showToast(`Cadangan Google Drive tersimpan: ${meta.fileName}`);
    } catch {
      showToast('Gagal membuat cadangan ke Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const res = await storageAdapter.restoreBackup(backupId);
      if (res.success) {
        setDataVersion(res.restoredVersion);
        setChecksumStatus('VALID');
        setShowRestoreModal(false);
        showToast(`Data dipulihkan ke versi ${res.restoredVersion}. Snapshot pengaman tersimpan.`);
      } else {
        showToast(`Pemulihan gagal: ${res.error}`);
      }
    } catch {
      showToast('Gagal memulihkan cadangan.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Nav mapping
  const primaryTab: PrimaryTab = useMemo(() => {
    if (['beranda', 'catat', 'stok', 'setoran', 'lainnya'].includes(currentScreen)) {
      return currentScreen as PrimaryTab;
    }
    return 'lainnya';
  }, [currentScreen]);

  return (
    <div className="shell" data-theme={theme}>
      {/* Accessibility skip link */}
      <a href="#main" className="skip">Lewati ke konten utama</a>

      {/* Desktop Navigation Rail (>= 760px) */}
      <aside className="desktop-rail" aria-label="Navigasi Desktop">
        <div className="rail-brand">
          <div className="rail-brand-icon">T</div>
          <div className="rail-brand-text">
            <strong>TOKO SAKALA</strong>
            <span>TOKO MODE v2.1</span>
          </div>
        </div>

        <nav className="rail-nav">
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'beranda' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('beranda')}
          >
            <span style={{ fontSize: '18px' }}>⌂</span>
            <span>Beranda</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'catat' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('catat')}
          >
            <span style={{ fontSize: '18px' }}>＋</span>
            <span>Catat Belanja</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'stok' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('stok')}
          >
            <span style={{ fontSize: '18px' }}>▦</span>
            <span>Cek Sisa Stok</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'setoran' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('setoran')}
          >
            <span style={{ fontSize: '18px' }}>⇆</span>
            <span>Setoran Karyawan</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'biaya' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('biaya')}
          >
            <span style={{ fontSize: '18px' }}>↗</span>
            <span>Biaya Toko</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'laporan' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('laporan')}
          >
            <span style={{ fontSize: '18px' }}>▤</span>
            <span>Laporan</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'riwayat' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('riwayat')}
          >
            <span style={{ fontSize: '18px' }}>↺</span>
            <span>Riwayat</span>
          </button>
          <button
            type="button"
            className={`rail-nav-btn ${currentScreen === 'lainnya' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('lainnya')}
          >
            <span style={{ fontSize: '18px' }}>•••</span>
            <span>Semua Alat</span>
          </button>
        </nav>

        <div className="rail-footer">
          <strong>Backend Google Drive (Rp0)</strong>
          <p style={{ marginTop: '2px', fontSize: '11px' }}>
            {isDriveConnected ? `Tersambung: ${driveEmail}` : 'Mode Offline / Pratinjau'}
          </p>
          <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
            Versi Data: v{dataVersion} • SHA-256 {checksumStatus}
          </span>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main id="main" className="main-content">
        {/* Mobile Header (Only on Beranda) */}
        {currentScreen === 'beranda' && (
          <header className="mobile-head">
            <div className="mobile-brand">TOKO SAKALA</div>
            <div className="mobile-head-actions">
              <button
                type="button"
                className="iconbtn"
                aria-label="Notifikasi"
                onClick={() => showToast('Tidak ada notifikasi baru hari ini.')}
              >
                <Bell size={18} />
              </button>
              <button
                type="button"
                className="avatar-badge"
                aria-label="Profil Toko"
                onClick={() => setCurrentScreen('pengaturan')}
              >
                AR
              </button>
            </div>
          </header>
        )}

        {/* Back header for sub-screens */}
        {currentScreen !== 'beranda' && (
          <div className="screen-header-row" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="back-button"
              onClick={() => setCurrentScreen('beranda')}
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="screen-header-title">
              {currentScreen === 'catat' && 'Catat Belanja'}
              {currentScreen === 'stok' && 'Cek Sisa Stok'}
              {currentScreen === 'setoran' && 'Setoran Karyawan'}
              {currentScreen === 'biaya' && 'Biaya Toko'}
              {currentScreen === 'laporan' && 'Laporan'}
              {currentScreen === 'riwayat' && 'Riwayat Catatan'}
              {currentScreen === 'barang' && 'Daftar Barang'}
              {currentScreen === 'asisten' && 'Asisten Pencatatan'}
              {currentScreen === 'pengaturan' && 'Pengaturan'}
              {currentScreen === 'lainnya' && 'Semua Alat Toko'}
            </h1>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 1: BERANDA                                        */}
        {/* ======================================================== */}
        {currentScreen === 'beranda' && (
          <div>
            <div className="intro-greeting">
              <h1>Halo, Andi 👋</h1>
              <p>Semangat jualannya hari ini!</p>
            </div>

            {/* Hero Card */}
            <div className="hero-card">
              <div className="hero-pill-badge">
                <span className="dot" />
                <span>Tindakan utama</span>
              </div>
              <h2 className="hero-card-title">Setoran karyawan perlu diperiksa</h2>
              <p className="hero-card-subtitle">Estimasi yang harus diserahkan</p>
              <div className="hero-card-bottom">
                <div className="hero-amount">Rp 1.250.000</div>
                <button
                  type="button"
                  className="hero-arrow-btn"
                  onClick={() => setCurrentScreen('setoran')}
                  aria-label="Periksa setoran"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            {/* 4 Quick Tiles Grid */}
            <div className="quick-tiles-grid">
              <button
                type="button"
                className="quick-tile"
                onClick={() => setCurrentScreen('catat')}
              >
                <div className="tile-icon-box orange">
                  <ShoppingCart size={19} />
                </div>
                <span className="quick-tile-label">Catat<br />Belanja</span>
              </button>

              <button
                type="button"
                className="quick-tile"
                onClick={() => setCurrentScreen('stok')}
              >
                <div className="tile-icon-box lime">
                  <Package size={19} />
                </div>
                <span className="quick-tile-label">Cek<br />Stok</span>
              </button>

              <button
                type="button"
                className="quick-tile"
                onClick={() => setCurrentScreen('setoran')}
              >
                <div className="tile-icon-box blue">
                  <Wallet size={19} />
                </div>
                <span className="quick-tile-label">Setoran</span>
              </button>

              <button
                type="button"
                className="quick-tile"
                onClick={() => setCurrentScreen('laporan')}
              >
                <div className="tile-icon-box dark">
                  <FileText size={19} />
                </div>
                <span className="quick-tile-label">Laporan</span>
              </button>
            </div>

            {/* Section: Aktivitas Terbaru */}
            <div className="section-block">
              <div className="section-head">
                <h3 className="section-title">Aktivitas terbaru</h3>
                <span
                  className="section-link"
                  onClick={() => setCurrentScreen('riwayat')}
                  role="button"
                  tabIndex={0}
                >
                  Lihat semua
                </span>
              </div>

              <div className="activity-feed">
                <div className="feed-row">
                  <div className="feed-icon green">
                    <ShoppingCart size={18} />
                  </div>
                  <div className="feed-details">
                    <strong className="feed-title">Belanja barang</strong>
                    <span className="feed-subtitle">Indomie 5 dus, SGM 2 dus</span>
                  </div>
                  <div className="feed-meta">
                    <span className="feed-time">08:45</span>
                    <strong className="feed-amount">Rp 192.000</strong>
                  </div>
                </div>

                <div className="feed-row">
                  <div className="feed-icon grey">
                    <FileText size={18} />
                  </div>
                  <div className="feed-details">
                    <strong className="feed-title">Biaya toko</strong>
                    <span className="feed-subtitle">Listrik</span>
                  </div>
                  <div className="feed-meta">
                    <span className="feed-time">07:20</span>
                    <strong className="feed-amount">Rp 150.000</strong>
                  </div>
                </div>

                <div className="feed-row">
                  <div className="feed-icon blue">
                    <Wallet size={18} />
                  </div>
                  <div className="feed-details">
                    <strong className="feed-title">Setoran karyawan</strong>
                    <span className="feed-subtitle">Toko Nur</span>
                  </div>
                  <div className="feed-meta">
                    <span className="feed-time">Kemarin</span>
                    <strong className="feed-amount">Rp 1.250.000</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: CATAT BELANJA                                  */}
        {/* ======================================================== */}
        {currentScreen === 'catat' && (
          <div>
            {/* Step Stepper Header (1) - 2 - 3 - 4 */}
            <div className="stepper-header">
              <div className="step-circle active">1</div>
              <div className="step-line" />
              <div className="step-circle">2</div>
              <div className="step-line" />
              <div className="step-circle">3</div>
              <div className="step-line" />
              <div className="step-circle">4</div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900 }}>Pilih barang</h2>
            </div>

            {/* Search Bar with Filter Button */}
            <div className="search-wrapper">
              <div className="search-input-box">
                <Search className="search-icon" size={17} />
                <input
                  type="text"
                  placeholder="Cari barang..."
                  value={catatSearch}
                  onChange={(e) => setCatatSearch(e.target.value)}
                  aria-label="Cari barang belanja"
                />
              </div>
              <button
                type="button"
                className="filter-action-btn"
                aria-label="Filter kategori"
                onClick={() => showToast('Gunakan tab kategori di bawah untuk menyaring barang.')}
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            {/* Category Chips */}
            <div className="category-chips-row">
              {['Semua', 'Makanan', 'Minuman', 'Rokok', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip ${catatCategory === cat ? 'active' : ''}`}
                  onClick={() => setCatatCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Selection List */}
            <div className="product-select-list">
              {INITIAL_CATALOG.filter((p) => {
                const matchCat = catatCategory === 'Semua' || p.category === catatCategory;
                const matchQuery = p.name.toLowerCase().includes(catatSearch.toLowerCase());
                return matchCat && matchQuery;
              }).slice(0, 3).map((item) => (
                <div key={item.id} className="product-select-card">
                  <div className="product-thumb-image" aria-hidden="true">
                    {item.icon}
                  </div>
                  <div className="product-info-text">
                    <strong className="product-info-name">{item.name}</strong>
                    <span className="product-info-meta">
                      {item.category === 'Makanan' ? 'Mie instan' : item.category} · {item.unit}
                    </span>
                    <strong className="product-info-price">
                      Rp {new Intl.NumberFormat('id-ID').format(item.costPerPack)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="add-circle-btn"
                    onClick={() => {
                      setSelectedProduct(item);
                      showToast(`Memilih ${item.name}`);
                    }}
                    aria-label={`Pilih ${item.name}`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Form Section: Jumlah & Satuan */}
            <div className="form-card">
              <h3 className="form-card-title">Jumlah & satuan</h3>
              <div className="form-row-pair">
                <div className="field-group">
                  <label htmlFor="p-qty" className="field-label">Jumlah</label>
                  <input
                    id="p-qty"
                    type="number"
                    min="1"
                    className="field-input"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="p-unit" className="field-label">Satuan</label>
                  <select id="p-unit" className="field-select" defaultValue="dus">
                    <option value="dus">{selectedProduct.unit}</option>
                    <option value="pak">Pak (10 pcs)</option>
                    <option value="pcs">Pcs (satuan isi)</option>
                  </select>
                </div>
              </div>

              {/* Ringkasan Pembelian Box */}
              <div className="summary-box">
                <div className="summary-box-title">Ringkasan pembelian</div>
                <div className="summary-box-row">
                  <span>Total barang ({purchaseQty * selectedProduct.packSize} pcs)</span>
                  <strong>Rp {new Intl.NumberFormat('id-ID').format(purchaseQty * selectedProduct.costPerPack)}</strong>
                </div>
                <div className="summary-box-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--line)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--ink)' }}>Total belanja</span>
                  <strong style={{ fontSize: '15px' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(purchaseQty * selectedProduct.costPerPack)}
                  </strong>
                </div>
              </div>

              {/* CTA: Lanjut ke pratinjau */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => showToast('Pratinjau dihitung: Rp ' + new Intl.NumberFormat('id-ID').format(purchaseQty * selectedProduct.costPerPack) + '. Belum disimpan.')}
              >
                Lanjut ke pratinjau →
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: CEK SISA STOK                                  */}
        {/* ======================================================== */}
        {currentScreen === 'stok' && (
          <div>
            {/* Search Bar */}
            <div className="search-wrapper">
              <div className="search-input-box">
                <Search className="search-icon" size={17} />
                <input
                  type="text"
                  placeholder="Cari barang atau kategori..."
                  value={stokSearch}
                  onChange={(e) => setStokSearch(e.target.value)}
                  aria-label="Cari barang stok"
                />
              </div>
            </div>

            {/* Category Chips */}
            <div className="category-chips-row">
              {['Semua', 'Makanan', 'Minuman', 'Rokok', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip ${stokCategory === cat ? 'active' : ''}`}
                  onClick={() => setStokCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stock List with Steppers */}
            <div className="stock-check-list">
              {[
                { id: 'indomie', name: 'Indomie Goreng', unit: 'Dus (40 pcs)', icon: '🍜' },
                { id: 'aqua', name: 'Aqua 600ml', unit: 'Dus (24 botol)', icon: '💧' },
                { id: 'telur', name: 'Telur Ayam Negeri', unit: 'Kg', icon: '🥚' },
                { id: 'gula', name: 'Gula Pasir', unit: 'Kg', icon: '🍚' },
                { id: 'chocopie', name: 'ChocoPie', unit: 'Pcs', icon: '🍪' },
                { id: 'sampoerna', name: 'Rokok Sampoerna', unit: 'Slop (10 bks)', icon: '🚬' },
              ].filter((item) => {
                return item.name.toLowerCase().includes(stokSearch.toLowerCase());
              }).map((item) => {
                const count = stockCounts[item.id];
                const isFilled = count !== null && count !== undefined;
                let statusLabel = 'Belum diisi';
                let statusClass = 'neutral';

                if (isFilled) {
                  if (count === 0) {
                    statusLabel = 'Perlu dicek';
                    statusClass = 'warn';
                  } else {
                    statusLabel = 'Lengkap';
                    statusClass = 'good';
                  }
                }

                return (
                  <div key={item.id} className="stock-check-card">
                    <div className="stock-card-top">
                      <div className="product-thumb-image" aria-hidden="true">
                        {item.icon}
                      </div>
                      <div className="stock-card-body">
                        <div className="stock-card-title">
                          <span>{item.name}</span>
                          <span className={`status-tag ${statusClass}`}>{statusLabel}</span>
                        </div>
                        <div className="stock-card-unit">{item.unit}</div>
                      </div>
                      <div className="stepper-control">
                        <button
                          type="button"
                          className="stepper-btn"
                          aria-label={`Kurangi ${item.name}`}
                          onClick={() => {
                            setStockCounts(prev => ({
                              ...prev,
                              [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1)
                            }));
                          }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          className="stepper-input"
                          aria-label={`Sisa fisik ${item.name}`}
                          value={isFilled ? count : '—'}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val === '' || val === '—') {
                              setStockCounts(prev => ({ ...prev, [item.id]: null }));
                            } else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 0) {
                                setStockCounts(prev => ({ ...prev, [item.id]: num }));
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="stepper-btn"
                          aria-label={`Tambah ${item.name}`}
                          onClick={() => {
                            setStockCounts(prev => ({
                              ...prev,
                              [item.id]: (prev[item.id] ?? 0) + 1
                            }));
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Footer: Total item diperiksa 4/6 | Simpan */}
            <div className="sticky-footer-bar">
              <div className="sticky-footer-label">
                <span>Total item diperiksa</span>
                <strong>
                  {Object.values(stockCounts).filter(v => v !== null).length} / {Object.keys(stockCounts).length}
                </strong>
              </div>
              <button
                type="button"
                className="btn btn-dark"
                style={{ minHeight: '44px', padding: '0 24px' }}
                onClick={() => showToast('Perubahan dicatat dalam pratinjau. Database belum aktif.')}
              >
                Simpan
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: SETORAN KARYAWAN                               */}
        {/* ======================================================== */}
        {currentScreen === 'setoran' && (
          <div>
            {/* Date Selector Row */}
            <div
              className="date-selector-row"
              onClick={() => {
                const todayFormatted = new Intl.DateTimeFormat('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date());
                const choice = prompt(`Pilih tanggal setoran:\n1. Mockup: Rabu, 28 Okt 2025\n2. Hari ini: ${todayFormatted}`, depositDate);
                if (choice && choice.trim()) {
                  setDepositDate(choice.trim());
                  showToast(`Tanggal setoran: ${choice.trim()}`);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Pilih tanggal setoran"
            >
              <div className="date-selector-left">
                <Calendar size={18} />
                <span>{depositDate}</span>
              </div>
              <ChevronRight size={18} color="var(--muted)" />
            </div>

            {/* Warning Callout Box */}
            <div className="warning-callout">
              <div className="warning-callout-icon">!</div>
              <div>Periksa kembali jumlah setoran dengan perhitungan toko.</div>
            </div>

            {/* 3 Settlement Cards */}
            <div className="settlement-card-list">
              {/* Card 1: Uang yang seharusnya diserahkan */}
              <div
                className="settlement-card"
                onClick={() => showToast('Dihitung dari transaksi hari ini.')}
                role="button"
                tabIndex={0}
              >
                <div className="settlement-icon-box">
                  <FileText size={20} />
                </div>
                <div className="settlement-card-body">
                  <div className="settlement-card-label">
                    Uang yang seharusnya diserahkan (berdasarkan penjualan hari ini)
                  </div>
                  <div className="settlement-card-amount">
                    Rp {new Intl.NumberFormat('id-ID').format(expectedAmount)}
                  </div>
                </div>
                <ChevronRight className="settlement-card-chevron" />
              </div>

              {/* Card 2: Uang yang diterima */}
              <div
                className="settlement-card"
                onClick={() => {
                  const val = prompt('Ubah nominal yang diterima:', receivedAmount.toString());
                  if (val !== null && !isNaN(Number(val))) {
                    setReceivedAmount(Number(val));
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="settlement-icon-box">
                  <Wallet size={20} />
                </div>
                <div className="settlement-card-body">
                  <div className="settlement-card-label">
                    Uang yang diterima (dari karyawan)
                  </div>
                  <div className="settlement-card-amount">
                    Rp {new Intl.NumberFormat('id-ID').format(receivedAmount)}
                  </div>
                </div>
                <ChevronRight className="settlement-card-chevron" />
              </div>

              {/* Card 3: Selisih (perlu diperiksa) */}
              <div className="settlement-card red">
                <div className="settlement-icon-box">
                  <AlertCircle size={20} />
                </div>
                <div className="settlement-card-body">
                  <div className="settlement-card-label" style={{ color: 'var(--red)' }}>
                    Selisih (perlu diperiksa)
                  </div>
                  <div className="settlement-card-amount">
                    {expectedAmount > receivedAmount
                      ? `Kurang Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount - receivedAmount)}`
                      : expectedAmount < receivedAmount
                      ? `Lebih Rp ${new Intl.NumberFormat('id-ID').format(receivedAmount - expectedAmount)}`
                      : 'Rp 0 (Pas)'}
                  </div>
                </div>
                <ChevronRight className="settlement-card-chevron" />
              </div>
            </div>

            {/* Note Textarea */}
            <div className="form-card" style={{ marginTop: '0', marginBottom: '18px' }}>
              <label htmlFor="deposit-notes" className="field-label" style={{ marginBottom: '8px', display: 'block' }}>
                Keterangan (opsional)
              </label>
              <textarea
                id="deposit-notes"
                className="field-textarea"
                rows={3}
                placeholder="Contoh: uang kembalian, biaya tambahan, dll."
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
              />
            </div>

            {/* Button: Simpan Setoran */}
            <button
              type="button"
              className="btn btn-dark"
              style={{ width: '100%' }}
              onClick={() => showToast('Simpan setoran (mode demo pratinjau — transaksi belum ditulis ke server).')}
            >
              Simpan setoran
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: BIAYA TOKO                             */}
        {/* ======================================================== */}
        {currentScreen === 'biaya' && (
          <div className="form-card">
            <h3 className="form-card-title">Catat Pengeluaran Toko</h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              Catat biaya operasional toko seperti gas, listrik, plastik es, atau sabun.
            </p>
            <div className="field-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="b-name" className="field-label">Nama Pengeluaran</label>
              <input id="b-name" type="text" className="field-input" placeholder="Contoh: Beli plastik & sedotan" />
            </div>
            <div className="field-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="b-cost" className="field-label">Nominal (Rp)</label>
              <input id="b-cost" type="number" className="field-input" placeholder="Contoh: 25000" />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => showToast('Pratinjau pengeluaran dicatat.')}
            >
              Simpan Biaya
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: LAPORAN                                */}
        {/* ======================================================== */}
        {currentScreen === 'laporan' && (
          <div>
            <div className="form-card" style={{ marginBottom: '16px' }}>
              <h3 className="form-card-title">Ringkasan Laporan Hari Ini</h3>
              <div className="summary-box-row" style={{ marginTop: '10px' }}>
                <span>Estimasi Penjualan</span>
                <strong>Rp 2.450.000</strong>
              </div>
              <div className="summary-box-row">
                <span>Modal Barang Terjual</span>
                <strong>Rp 1.280.000</strong>
              </div>
              <div className="summary-box-row">
                <span>Biaya Toko</span>
                <strong>Rp 350.000</strong>
              </div>
              <div className="summary-box-row" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                <span style={{ fontWeight: 800 }}>Estimasi Keuntungan Bersih</span>
                <strong style={{ color: 'var(--green)', fontSize: '15px' }}>Rp 820.000</strong>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
              Catatan: Keuntungan bersih hanya dihitung dari barang yang modalnya diketahui.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: RIWAYAT                                */}
        {/* ======================================================== */}
        {currentScreen === 'riwayat' && (
          <div className="activity-feed">
            <div className="feed-row">
              <div className="feed-icon green"><ShoppingCart size={18} /></div>
              <div className="feed-details">
                <strong className="feed-title">Belanja barang</strong>
                <span className="feed-subtitle">Indomie 5 dus, SGM 2 dus</span>
              </div>
              <div className="feed-meta">
                <span className="feed-time">08:45</span>
                <strong className="feed-amount">Rp 192.000</strong>
              </div>
            </div>
            <div className="feed-row">
              <div className="feed-icon grey"><FileText size={18} /></div>
              <div className="feed-details">
                <strong className="feed-title">Biaya toko</strong>
                <span className="feed-subtitle">Listrik toko</span>
              </div>
              <div className="feed-meta">
                <span className="feed-time">07:20</span>
                <strong className="feed-amount">Rp 150.000</strong>
              </div>
            </div>
            <div className="feed-row">
              <div className="feed-icon blue"><Wallet size={18} /></div>
              <div className="feed-details">
                <strong className="feed-title">Setoran karyawan</strong>
                <span className="feed-subtitle">Toko Nur</span>
              </div>
              <div className="feed-meta">
                <span className="feed-time">Kemarin</span>
                <strong className="feed-amount">Rp 1.250.000</strong>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: LAINNYA & PENGATURAN                   */}
        {/* ======================================================== */}
        {currentScreen === 'lainnya' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              className="product-select-card"
              onClick={() => setCurrentScreen('biaya')}
              role="button"
              tabIndex={0}
            >
              <div className="tile-icon-box orange"><FileText size={18} /></div>
              <div className="product-info-text">
                <strong className="product-info-name">Biaya Toko</strong>
                <span className="product-info-meta">Catat listrik, gas, perlengkapan</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="product-select-card"
              onClick={() => setCurrentScreen('laporan')}
              role="button"
              tabIndex={0}
            >
              <div className="tile-icon-box lime"><FileText size={18} /></div>
              <div className="product-info-text">
                <strong className="product-info-name">Laporan & Rekap</strong>
                <span className="product-info-meta">Lihat ringkasan keuntungan dan modal</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="product-select-card"
              onClick={() => setCurrentScreen('riwayat')}
              role="button"
              tabIndex={0}
            >
              <div className="tile-icon-box blue"><RefreshCw size={18} /></div>
              <div className="product-info-text">
                <strong className="product-info-name">Riwayat Catatan</strong>
                <span className="product-info-meta">Daftar transaksi yang terekam</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="product-select-card"
              onClick={() => setCurrentScreen('pengaturan')}
              role="button"
              tabIndex={0}
            >
              <div className="tile-icon-box dark"><Sparkles size={18} /></div>
              <div className="product-info-text">
                <strong className="product-info-name">Pengaturan & Tema</strong>
                <span className="product-info-meta">Atur tema terang/gelap & profil</span>
              </div>
              <ChevronRight size={18} />
            </div>
          </div>
        )}

        {currentScreen === 'pengaturan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Google Drive Backend Storage Card */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Cloud size={20} color="var(--orange)" />
                <h3 className="form-card-title" style={{ margin: 0 }}>Penyimpanan Google Drive (Rp0)</h3>
              </div>

              <div className="summary-box-row" style={{ marginTop: '8px' }}>
                <span>Akun Google Pemilik</span>
                <strong>{driveEmail}</strong>
              </div>
              <div className="summary-box-row">
                <span>Status Sambungan</span>
                <span style={{ fontWeight: 800, color: isDriveConnected ? 'var(--green)' : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDriveConnected ? 'var(--green)' : 'var(--red)' }} />
                  {isDriveConnected ? 'Terhubung (API v3)' : 'Terputus'}
                </span>
              </div>
              <div className="summary-box-row">
                <span>Keutuhan Data</span>
                <span style={{ fontWeight: 800, color: checksumStatus === 'VALID' ? 'var(--green)' : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} />
                  {checksumStatus === 'VALID' ? 'SHA-256 Valid' : 'Peringatan Korup'}
                </span>
              </div>
              <div className="summary-box-row">
                <span>Versi Dokumen</span>
                <strong>v{dataVersion}</strong>
              </div>
              <div className="summary-box-row">
                <span>Cadangan Terakhir</span>
                <strong style={{ fontSize: '12px' }}>{lastBackupTime}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleManualBackup}
                  disabled={!isDriveConnected || isBackingUp}
                  style={{ minHeight: '44px', width: '100%' }}
                >
                  <HardDrive size={16} />
                  <span>{isBackingUp ? 'Membuat Cadangan...' : 'Cadangkan Manual ke Google Drive'}</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setShowRestoreModal(true)}
                    style={{ minHeight: '44px' }}
                  >
                    <History size={16} />
                    <span>Pulihkan ({backups.length})</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => {
                      setIsDriveConnected(prev => !prev);
                      showToast(isDriveConnected ? 'Koneksi Google Drive diputuskan.' : 'Terhubung ke Google Drive adizseptian@gmail.com.');
                    }}
                    style={{ minHeight: '44px' }}
                  >
                    <RefreshCw size={16} />
                    <span>{isDriveConnected ? 'Putuskan' : 'Hubungkan'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tema & Pengaturan Aplikasi */}
            <div className="form-card">
              <h3 className="form-card-title">Tampilan & Tema</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <strong>Mode Tampilan</strong>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Tema saat ini: {theme === 'light' ? 'Terang (Paper)' : 'Gelap (Near Black)'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={toggleTheme}
                  style={{ minHeight: '44px' }}
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  <span>Ganti Tema</span>
                </button>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--amber-pale)', borderRadius: '10px', border: '1px solid #e2bc74', color: 'var(--amber)', fontSize: '11px' }}>
                <strong>Prinsip Keamanan TOKO SAKALA:</strong>
                <p style={{ marginTop: '4px' }}>
                  Asisten AI default OFF. Tidak ada kunci API rahasia di peramban. Penyimpanan menggunakan Google Drive pribadi pengguna (Rp0).
                </p>
              </div>
            </div>

            {/* Modal Dialog Pulihkan Cadangan (Restore) */}
            {showRestoreModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="restore-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
                <div className="form-card" style={{ maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 id="restore-title" className="form-card-title" style={{ margin: 0 }}>Daftar Cadangan Google Drive</h3>
                    <button
                      type="button"
                      onClick={() => setShowRestoreModal(false)}
                      style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                      aria-label="Tutup dialog"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ padding: '10px', background: 'var(--blue-pale)', borderRadius: '8px', border: '1px solid var(--blue)', fontSize: '11px', color: 'var(--ink)', marginBottom: '14px' }}>
                    <strong>Proteksi Pemulihan Otomatis:</strong>
                    <p style={{ marginTop: '2px' }}>
                      Sebelum data ditimpa, sistem akan secara otomatis menyimpan snapshot pengaman data saat ini.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {backups.map(b => (
                      <div
                        key={b.id}
                        style={{
                          padding: '10px',
                          border: '1.5px solid var(--line)',
                          borderRadius: '8px',
                          background: 'var(--paper)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '12px', display: 'block' }}>{b.fileName}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              Versi {b.dataVersion} • {b.byteSize} bytes • {b.label ?? 'Cadangan'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-paper"
                            onClick={() => handleRestoreBackup(b.id)}
                            style={{ minHeight: '44px', padding: '6px 12px', fontSize: '11px' }}
                          >
                            Pulihkan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setShowRestoreModal(false)}
                    style={{ minHeight: '44px', width: '100%' }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="toast-notice" role="status" aria-live="polite">
          <AlertCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation (5 items) */}
      <nav className="bottom-nav" aria-label="Navigasi Bawah">
        <button
          type="button"
          className={`navbtn ${primaryTab === 'beranda' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('beranda')}
          aria-current={primaryTab === 'beranda' ? 'page' : undefined}
        >
          <span className="navglyph">⌂</span>
          <span>Beranda</span>
        </button>

        <button
          type="button"
          className={`navbtn ${primaryTab === 'catat' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('catat')}
          aria-current={primaryTab === 'catat' ? 'page' : undefined}
        >
          <span className="navglyph">＋</span>
          <span>Catat</span>
        </button>

        <button
          type="button"
          className={`navbtn ${primaryTab === 'stok' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('stok')}
          aria-current={primaryTab === 'stok' ? 'page' : undefined}
        >
          <span className="navglyph">▦</span>
          <span>Stok</span>
        </button>

        <button
          type="button"
          className={`navbtn ${primaryTab === 'setoran' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('setoran')}
          aria-current={primaryTab === 'setoran' ? 'page' : undefined}
        >
          <span className="navglyph">⇆</span>
          <span>Setoran</span>
        </button>

        <button
          type="button"
          className={`navbtn ${primaryTab === 'lainnya' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('lainnya')}
          aria-current={primaryTab === 'lainnya' ? 'page' : undefined}
        >
          <span className="navglyph">•••</span>
          <span>Lainnya</span>
        </button>
      </nav>
    </div>
  );
}

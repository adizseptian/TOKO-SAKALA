import { useState, useMemo, useEffect } from 'react';
import {
  Bell, ChevronRight, Calendar, AlertCircle, ShoppingCart,
  Package, Wallet, FileText, ArrowLeft, Search, SlidersHorizontal, Plus,
  Minus, Check, ArrowRight, CornerDownLeft, Sparkles, RefreshCw, Moon, Sun,
  Cloud, Database, ShieldCheck, History, HardDrive, KeyRound, ExternalLink,
  CheckCircle2, XCircle, Download, Upload, Server, RotateCcw, HelpCircle, Undo2,
  Info, ArrowUpDown, Printer, Pencil, Coins, ReceiptText, Banknote, Scale,
  LayoutDashboard, Boxes, ArrowLeftRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { ModalForm } from '@/components/ModalForm';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import {
  runStoreFinancialEngine,
  calculatePeriodSummary,
  getProductLatestUnitCost,
  hasDayInInterval,
  type StoreFinancialSummary,
  type DateRangePeriodSummary,
} from '@/engine/v1/engineBridge';
import {
  googleAuth,
  GoogleDriveAdapter,
  IndexedDBAdapter,
  SupabaseAdapter,
  SyncEngine,
  createDefaultPayload,
  migrateLegacyPayload,
  seedSampleData,
  removeSampleData,
  SAMPLE_SEED_ID,
  type AuthState,
  type BackupMetadata,
  type TokoSakalaPayload,
  type PurchaseRecord,
  type ExpenseRecord,
  type DepositRecord,
  type OwnerWithdrawalRecord,
  type OtherIncomeRecord,
  type StockMovementRecord,
  type SyncEngineStatus,
} from '@/storage';
import {
  signInOwnerWithOtp,
  signOutOwner,
  getCurrentOwnerUser,
} from '@/auth/supabaseClient';

type PrimaryTab = 'beranda' | 'catat' | 'stok' | 'setoran' | 'lainnya';
type Screen = PrimaryTab | 'biaya' | 'laporan' | 'riwayat' | 'barang' | 'asisten' | 'pengaturan';

interface ProductItem {
  id: string;
  name: string;
  category: 'Makanan' | 'Minuman' | 'Rokok' | 'Lainnya';
  unit: string;
  packSize: number;
  costPerPack: number | null;
  sellingPricePerUnit: number;
  icon: string;
  active?: boolean;
  discountDay?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' | null;
  discountPerUnit?: number | null;
  isSample?: boolean;
}

const INITIAL_CATALOG: ProductItem[] = [
  { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 96000, sellingPricePerUnit: 3000, icon: '🍜', discountDay: 'Jumat', discountPerUnit: 1000 },
  { id: 'sedap', name: 'Mie Sedap', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 92000, sellingPricePerUnit: 2800, icon: '🍜' },
  { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus (24 botol)', packSize: 24, costPerPack: 45000, sellingPricePerUnit: 3000, icon: '💧' },
  { id: 'telur', name: 'Telur Ayam Negeri', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 26000, sellingPricePerUnit: 29000, icon: '🥚' },
  { id: 'gula', name: 'Gula Pasir', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 16000, sellingPricePerUnit: 18000, icon: '🍚' },
  { id: 'chocopie', name: 'ChocoPie', category: 'Makanan', unit: 'Pcs', packSize: 1, costPerPack: 2000, sellingPricePerUnit: 2500, icon: '🍪' },
  { id: 'sampoerna', name: 'Rokok Sampoerna', category: 'Rokok', unit: 'Slop (10 bks)', packSize: 10, costPerPack: 310000, sellingPricePerUnit: 34000, icon: '🚬' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('beranda');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('toko_sakala_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('toko_sakala_theme', theme);
    }
  }, [theme]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single validated business data payload from schema
  const [docPayload, setDocPayload] = useState<TokoSakalaPayload>(() => createDefaultPayload());

  // Dynamic Catalog: Merges default catalog and user-added custom products from docPayload
  const catalogList = useMemo<ProductItem[]>(() => {
    const custom = (docPayload.products || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category as 'Makanan' | 'Minuman' | 'Rokok' | 'Lainnya',
      unit: p.unit,
      packSize: p.packSize,
      costPerPack: p.costPerPack ?? null,
      sellingPricePerUnit: p.sellingPricePerUnit,
      icon: p.icon || '📦',
      active: p.active ?? true,
      discountDay: p.discountDay ?? null,
      discountPerUnit: p.discountPerUnit ?? null,
      isSample: p.isSample ?? false,
    }));
    const customIds = new Set(custom.map(c => c.id));
    const defaults = INITIAL_CATALOG.filter(d => !customIds.has(d.id));
    return [...defaults, ...custom];
  }, [docPayload.products]);

  // Pure Financial Engine: Menghitung modal bergerak, laba kotor, kas siap setor, dan sisa stok
  const storeSummary = useMemo<StoreFinancialSummary>(() => {
    return runStoreFinancialEngine(docPayload, catalogList);
  }, [docPayload, catalogList]);

function formatRupiahInput(val: string): string {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
}

function parseRupiahInput(val: string): number {
  return Number(val.replace(/\D/g, '')) || 0;
}

const InfoButton: React.FC<{ onClick: () => void; label?: string; size?: number }> = ({ onClick, label = 'Rincian perhitungan', size = 15 }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={label}
    style={{
      minWidth: '44px',
      minHeight: '44px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      margin: 0,
      color: 'var(--muted)',
    }}
  >
    <Info size={size} />
  </button>
);

  // Screen 2: Catat Belanja State & Keranjang
  interface PurchaseCartItem {
    productId: string;
    qty: number;
    unit: 'kemasan' | 'pcs';
    totalCost: number;
    sourceMoney: 'SETORAN' | 'PRIBADI';
  }

  const [openedCardId, setOpenedCardId] = useState<string | null>(null);
  const [purchaseCart, setPurchaseCart] = useState<PurchaseCartItem[]>([]);
  const [showCartSheet, setShowCartSheet] = useState<boolean>(false);
  const [cardDraftQty, setCardDraftQty] = useState<number>(1);
  const [cardDraftUnit, setCardDraftUnit] = useState<'kemasan' | 'pcs'>('kemasan');
  const [cardDraftCostStr, setCardDraftCostStr] = useState<string>('');
  const [cardDraftSourceMoney, setCardDraftSourceMoney] = useState<'SETORAN' | 'PRIBADI'>('SETORAN');
  const [cardValidationError, setCardValidationError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(INITIAL_CATALOG[0]);
  const [purchaseQty, setPurchaseQty] = useState<number>(2);
  const [purchaseUnit, setPurchaseUnit] = useState<string>('kemasan');
  const [customPurchaseCost, setCustomPurchaseCost] = useState<string>('');
  const [catatCategory, setCatatCategory] = useState<string>('Semua');
  const [catatSearch, setCatatSearch] = useState<string>('');
  const [purchaseSourceMoney, setPurchaseSourceMoney] = useState<'SETORAN' | 'PRIBADI'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('toko_sakala_belanja_source');
      if (saved === 'SETORAN' || saved === 'PRIBADI') return saved;
    }
    return 'SETORAN';
  });
  const [catatSort, setCatatSort] = useState<'terbaru' | 'alphabetical'>('terbaru');

  // Master Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdCategory, setNewProdCategory] = useState<'Makanan' | 'Minuman' | 'Rokok' | 'Lainnya'>('Makanan');
  const [newProdPreset, setNewProdPreset] = useState<string>('Dus (24 pcs)');
  const [newProdUnit, setNewProdUnit] = useState<string>('Dus (24 pcs)');
  const [newProdPackSize, setNewProdPackSize] = useState<number>(24);
  const [newProdCostPerPack, setNewProdCostPerPack] = useState<string>('');
  const [newProdIsCostUnknown, setNewProdIsCostUnknown] = useState<boolean>(false);
  const [newProdSellingPrice, setNewProdSellingPrice] = useState<string>(''); // Default kosong
  const [newProdIcon, setNewProdIcon] = useState<string>('🍜');

  // Screen 3: Cek Sisa Stok State (dimulai bersih, pengguna mengisi sisa fisik)
  const [stockCounts, setStockCounts] = useState<Record<string, number | null>>({});
  const [checkedTodayIds, setCheckedTodayIds] = useState<Set<string>>(new Set());
  const [stokCategory, setStokCategory] = useState<string>('Semua');
  const [stokSearch, setStokSearch] = useState<string>('');

  // Screen 4: Setoran Karyawan State — dihitung dinamis dari kas penjualan riil
  const expectedAmount = storeSummary.expectedDeposit;
  const [receivedAmountInput, setReceivedAmountInput] = useState<number | null>(null);
  const receivedAmount = receivedAmountInput ?? expectedAmount;
  const [depositNote, setDepositNote] = useState<string>('');
  const [showDepositNoteInput, setShowDepositNoteInput] = useState<boolean>(false);
  const [selectedDateTab, setSelectedDateTab] = useState<'HARI_INI' | 'KEMARIN' | 'PILIH_TANGGAL'>('HARI_INI');
  const [depositDateIso, setDepositDateIso] = useState<string>(() => new Date().toISOString());
  const [depositDate, setDepositDate] = useState<string>(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  });

  // Stepper Pecahan Uang Fisik Setoran
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });
  const [showDenominations, setShowDenominations] = useState<boolean>(false);

  // Secondary Screen: Biaya Toko State
  const [expenseName, setExpenseName] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseAmountStr, setExpenseAmountStr] = useState<string>('');
  const [expenseSourceMoney, setExpenseSourceMoney] = useState<'LACI' | 'PRIBADI'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('toko_sakala_expense_source');
      if (saved === 'LACI' || saved === 'PRIBADI') return saved;
    }
    return 'LACI';
  });

  // Tab switch in Screen Biaya (Pengeluaran vs Pemasukan Lain)
  const [biayaTab, setBiayaTab] = useState<'PENGELUARAN' | 'PEMASUKAN'>('PENGELUARAN');

  // Modal Cek Harga Jual saat modal naik
  const [showPriceCheckModal, setShowPriceCheckModal] = useState<boolean>(false);
  const [newSellingPriceInput, setNewSellingPriceInput] = useState<string>('');

  // Pemasukan Lain State (Jasa seduh, titip barang, dll)
  const [showOtherIncomeModal, setShowOtherIncomeModal] = useState<boolean>(false);
  const [otherIncomeName, setOtherIncomeName] = useState<string>('Jasa seduh mie');
  const [otherIncomeNominalStr, setOtherIncomeNominalStr] = useState<string>('2000');
  const [otherIncomeQty, setOtherIncomeQty] = useState<number>(3);
  const [otherIncomeNotes, setOtherIncomeNotes] = useState<string>('');

  // Barang Rusak State (Rusak, Cacat, Dimakan Tikus)
  const [showDamageModal, setShowDamageModal] = useState<boolean>(false);
  const [damageProductId, setDamageProductId] = useState<string>('indomie');
  const [damageQty, setDamageQty] = useState<number>(1);
  const [damageReason, setDamageReason] = useState<'rusak' | 'cacat' | 'dimakan tikus'>('rusak');

  // Diskon Cek Sisa Stok State: "Terjual saat diskon (pcs)"
  const [discountCounts, setDiscountCounts] = useState<Record<string, number | null>>({});

  // Helper cek apakah barang sudah punya rekaman pergerakan / pembelian stok
  const hasRecordedStock = (productId: string) => {
    return (docPayload.stockMovements || []).some(m => m.productId === productId) ||
           (docPayload.purchaseRecords || []).some(pr => pr.productId === productId);
  };

  // Modal Pengambilan Pribadi (Owner Withdrawal)
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmountStr, setWithdrawAmountStr] = useState<string>('');
  const [withdrawNote, setWithdrawNote] = useState<string>('');

  // Bottom Sheet Modal Rincian Hitungan (ikon ⓘ)
  const [detailModal, setDetailModal] = useState<{
    title: string;
    formula: string;
    rows: Array<{ label: string; value: string; isNegative?: boolean; isHighlight?: boolean }>;
    note?: string;
    showItemsLink?: boolean;
    itemsBreakdown?: Array<{ name: string; calculation: string; total: string }>;
    deleteAction?: () => void;
    deleteLabel?: string;
  } | null>(null);
  const [showItemsBreakdownModal, setShowItemsBreakdownModal] = useState<Array<{ name: string; calculation: string; total: string }> | null>(null);
  const [showDeleteSampleModal, setShowDeleteSampleModal] = useState<boolean>(false);

  // Internal Modals State
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [customDateInput, setCustomDateInput] = useState<string>('');
  const [showAmountModal, setShowAmountModal] = useState<boolean>(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState<boolean>(false);
  const [showCalculationWhyModal, setShowCalculationWhyModal] = useState<boolean>(false);

  // Beranda = Ringkasan State (Hari / Minggu / Bulan / Tahun + Anchor Date)
  const [ringkasanPeriod, setRingkasanPeriod] = useState<'HARI' | 'MINGGU' | 'BULAN' | 'TAHUN'>('HARI');
  const [ringkasanAnchorDate, setRingkasanAnchorDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showRingkasanDatePicker, setShowRingkasanDatePicker] = useState<boolean>(false);

  // Riwayat Catatan State (Urut, Filter Jenis, Tampilan Kartu / Tabel, Paginasi)
  const [riwayatSort, setRiwayatSort] = useState<'terbaru' | 'terlama' | 'nominal'>('terbaru');
  const [riwayatFilter, setRiwayatFilter] = useState<'semua' | 'belanja' | 'cek stok' | 'biaya' | 'jasa' | 'rusak' | 'setoran'>('semua');
  const [riwayatViewMode, setRiwayatViewMode] = useState<'kartu' | 'tabel'>('kartu');
  const [riwayatPageSize, setRiwayatPageSize] = useState<number>(20);

  // Periode Berjalan Bottom Sheet State
  const [showTimelineSheet, setShowTimelineSheet] = useState<boolean>(false);
  const [timelineFilter, setTimelineFilter] = useState<'semua' | 'belanja' | 'cek stok' | 'biaya' | 'jasa' | 'rusak'>('semua');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const formatRelativeTime = (isoString: string): string => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Baru saja';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay === 1) return 'Kemarin';
    if (diffDay < 7) return `${diffDay} hr lalu`;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
  };

  // Modal Hasil Simpan Transaksi dengan Fitur Undo (Urungkan)
  const [saveResultModal, setSaveResultModal] = useState<{
    isOpen: boolean;
    title: string;
    itemsChecked?: number;
    unitsSold?: number;
    salesRevenue?: number;
    cogsKnown?: number;
    grossProfit?: number | null;
    certainty?: 'PASTI' | 'PERLU_DIPERIKSA' | 'BELUM_DIKETAHUI';
    notes?: string;
    previousPayload?: TokoSakalaPayload;
  } | null>(null);

  // Storage Adapters: Offline-First (IndexedDB), Cloud Sync (Supabase), dan Cloud Backup (Google Drive)
  const [localIndexedDB] = useState(() => new IndexedDBAdapter());
  const [supabaseAdapter] = useState(() => new SupabaseAdapter());
  const [syncEngine] = useState(() => new SyncEngine(localIndexedDB, supabaseAdapter));
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(() => syncEngine.getStatus());

  const [driveAdapter] = useState(() => new GoogleDriveAdapter({
    getAccessToken: () => googleAuth.getValidAccessToken(),
    userEmail: googleAuth.getUserInfo()?.email || '',
  }));

  const [authState, setAuthState] = useState<AuthState>(googleAuth.getAuthState());
  const [authError, setAuthError] = useState<string | null>(googleAuth.getErrorMessage());
  const [userInfo, setUserInfo] = useState(googleAuth.getUserInfo());
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [checksumStatus, setChecksumStatus] = useState<'VALID' | 'CORRUPT' | 'UNCHECKED'>('UNCHECKED');
  const [lastBackupTime, setLastBackupTime] = useState<string>('Belum ada cadangan');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [clientIdInput, setClientIdInput] = useState<string>(googleAuth.getClientId() || '');
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => supabaseAdapter.getCredentials().url || 'https://dvznpniodskujfbdznnv.supabase.co');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(() => supabaseAdapter.getCredentials().anonKey || '');
  const [storageQuota, setStorageQuota] = useState<{ usageBytes: number; limitBytes?: number } | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<{ email?: string } | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  useEffect(() => {
    getCurrentOwnerUser().then(u => {
      if (u) setSupabaseUser({ email: u.email });
    }).catch(() => {});
  }, []);

  // Device ID stabil untuk mencegah duplikasi mutasi antar-perangkat
  const [deviceId] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      let id = localStorage.getItem('toko_sakala_device_id');
      if (!id) {
        id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('toko_sakala_device_id', id);
      }
      return id;
    }
    return 'device-primary';
  });

  // Inisialisasi awal dokumen toko secara Offline-First dari IndexedDB
  useEffect(() => {
    localIndexedDB.requestPersistentStorage().catch(() => {});

    localIndexedDB.loadData().then(doc => {
      const migrated = migrateLegacyPayload(doc.payload);
      setDocPayload(migrated);
      setDataVersion(doc.dataVersion);
      setChecksumStatus('VALID');
    }).catch(err => {
      console.warn('Inisialisasi IndexedDB lokal:', err);
    });

    const unsubSync = syncEngine.subscribe(status => {
      setSyncStatus(status);
    });
    syncEngine.start(30000);

    return () => {
      unsubSync();
      syncEngine.stop();
    };
  }, [localIndexedDB, syncEngine]);

  // Subscribe ke status otentikasi Google Identity Services
  useEffect(() => {
    const unsubscribe = googleAuth.subscribe((state, err) => {
      setAuthState(state);
      setAuthError(err || null);
      const user = googleAuth.getUserInfo();
      if (user) {
        setUserInfo(user);
      }
    });

    // Jika Google Drive terhubung, sinkronkan daftar cadangan dan status kuota
    if (googleAuth.getAuthState() === 'CONNECTED') {
      driveAdapter.loadData().then(doc => {
        // Jika data Drive lebih mutakhir daripada lokal, sinkronkan
        if (doc.dataVersion > dataVersion) {
          const migrated = migrateLegacyPayload(doc.payload);
          setDocPayload(migrated);
          setDataVersion(doc.dataVersion);
          setChecksumStatus('VALID');
        }
      }).catch(err => {
        console.warn('Gagal memuat dokumen Google Drive:', err);
      });

      driveAdapter.testConnection().then(conn => {
        if (conn.ok && conn.storageQuota) {
          setStorageQuota(conn.storageQuota);
        }
      }).catch(() => {});

      driveAdapter.listBackups().then(b => {
        if (b.length > 0) {
          setBackups(b);
          setLastBackupTime(new Date(b[0].createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
        }
      }).catch(() => {});
    }

    return () => unsubscribe();
  }, [driveAdapter, dataVersion]);

  const handleConnectGoogle = async () => {
    if (authState === 'UNCONFIGURED') {
      setShowConfigModal(true);
      return;
    }
    try {
      showToast('Membuka jendela otorisasi Google...');
      await googleAuth.requestAccessToken(false);
      showToast('Otorisasi Google Drive berhasil!');
      
      try {
        const doc = await driveAdapter.loadData();
        setDocPayload(doc.payload);
        setDataVersion(doc.dataVersion);
        setChecksumStatus('VALID');
      } catch (loadErr) {
        console.warn('Gagal memuat data setelah otorisasi:', loadErr);
      }

      const conn = await driveAdapter.testConnection();
      if (conn.ok && conn.storageQuota) {
        setStorageQuota(conn.storageQuota);
      }
      const driveBackups = await driveAdapter.listBackups();
      if (driveBackups.length > 0) {
        setBackups(driveBackups);
        setLastBackupTime(new Date(driveBackups[0].createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Otorisasi Google gagal.');
    }
  };

  const handleDisconnectGoogle = async () => {
    await googleAuth.disconnect();
    await driveAdapter.disconnect();
    setStorageQuota(null);
    showToast('Sesi Google Drive telah diputuskan.');
  };

  const handleTestConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const conn = await driveAdapter.testConnection();
      if (conn.ok) {
        const usageMb = conn.storageQuota ? (conn.storageQuota.usageBytes / (1024 * 1024)).toFixed(2) : '0';
        setStorageQuota(conn.storageQuota ?? null);
        showToast(`Koneksi aktif! (${conn.email} • Terpakai: ${usageMb} MB)`);
      } else {
        showToast(`Koneksi gagal: ${conn.error}`);
      }
    } catch (err) {
      showToast(`Kesalahan: ${err instanceof Error ? err.message : 'Koneksi gagal'}`);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleSyncCloudNow = async () => {
    showToast('Menjalankan sinkronisasi dua arah...');
    const res = await syncEngine.syncNow();
    if (res.success) {
      const freshDoc = await localIndexedDB.loadData();
      setDocPayload(freshDoc.payload);
      setDataVersion(freshDoc.dataVersion);
      showToast(`Sinkronisasi selesai! ${res.syncedCount} mutasi dikirim${res.pulledUpdate ? ', pembaruan cloud diterapkan' : ''}.`);
    } else {
      showToast(`Status sinkronisasi: ${res.error || 'Gagal tersinkron'}`);
    }
  };

  const handleSaveSupabaseConfig = () => {
    const url = supabaseUrlInput.trim();
    const key = supabaseKeyInput.trim();
    if (!url || !key) {
      showToast('URL dan Anon Key Supabase tidak boleh kosong.');
      return;
    }
    supabaseAdapter.setRuntimeCredentials(url, key);
    setShowSupabaseModal(false);
    showToast('Konfigurasi Supabase tersimpan! Mencoba sinkronisasi...');
    syncEngine.syncNow().catch(() => {});
  };

  const handleResetSupabaseConfig = () => {
    supabaseAdapter.clearRuntimeCredentials();
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setSupabaseUser(null);
    setShowSupabaseModal(false);
    showToast('Kredensial Supabase telah di-reset.');
  };

  const handleSendMagicLink = async () => {
    if (!supabaseAdapter.isConfigured()) {
      showToast('Konfigurasi URL dan Anon Key Supabase terlebih dahulu.');
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await signInOwnerWithOtp('adizseptian@gmail.com');
      if (res.success) {
        showToast('Tautan masuk (Magic Link) berhasil dikirim ke adizseptian@gmail.com! Silakan periksa email Anda.');
      } else {
        showToast(`Gagal: ${res.error}`);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSignOutSupabase = async () => {
    await signOutOwner();
    setSupabaseUser(null);
    showToast('Telah keluar dari sesi Supabase Auth.');
  };

  const handleExportJson = async () => {
    try {
      const jsonStr = await localIndexedDB.exportAsJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toko-sakala-data-v${dataVersion}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Cadangan file JSON berhasil diunduh!');
    } catch (err) {
      showToast(`Gagal mengekspor file: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Membaca file cadangan JSON...');
      const text = await file.text();
      const res = await localIndexedDB.importFromJson(text);
      if (res.success) {
        const freshDoc = await localIndexedDB.loadData();
        setDocPayload(freshDoc.payload);
        setDataVersion(freshDoc.dataVersion);
        setChecksumStatus('VALID');
        showToast(`Data berhasil dipulihkan dari file JSON (v${freshDoc.dataVersion})!`);
      } else {
        showToast(`Impor gagal: ${res.error}`);
      }
    } catch (err) {
      showToast(`Gagal membaca file: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const executeSaveTransaction = async (
    nextPayload: TokoSakalaPayload,
    successTitle: string
  ): Promise<boolean> => {
    try {
      // 1. Simpan ke IndexedDB lokal (offline-first menjamin persistensi langsung di browser)
      const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const localRes = await localIndexedDB.saveData(nextPayload, dataVersion > 0 ? dataVersion : undefined, {
        idempotencyKey,
        deviceId,
      });
      if (!localRes.success) {
        showToast(`Gagal menyimpan ke penyimpanan lokal: ${localRes.error}`);
        return false;
      }

      setDocPayload(nextPayload);
      setDataVersion(localRes.dataVersion);
      setChecksumStatus('VALID');

      // 2. Jika Supabase dikonfigurasi & perangkat online, sinkronkan otomatis
      if (supabaseAdapter.isConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
        syncEngine.syncNow().then(syncRes => {
          if (syncRes.success) {
            showToast(`${successTitle} tersimpan di IndexedDB & tersinkron ke Supabase (v${localRes.dataVersion})!`);
          } else {
            showToast(`${successTitle} tersimpan di IndexedDB lokal (v${localRes.dataVersion}). Menunggu jaringan/sinkronisasi.`);
          }
        }).catch(() => {
          showToast(`${successTitle} tersimpan di IndexedDB lokal (v${localRes.dataVersion})!`);
        });
      } else if (authState === 'CONNECTED') {
        // Jika Google Drive terhubung, kirim juga salinan ke Google Drive
        driveAdapter.saveData(nextPayload, localRes.dataVersion).catch(() => {});
        showToast(`${successTitle} tersimpan ke IndexedDB & Google Drive (v${localRes.dataVersion})!`);
      } else {
        showToast(`${successTitle} berhasil disimpan ke IndexedDB lokal (v${localRes.dataVersion})!`);
      }

      return true;
    } catch (err) {
      showToast(`Gagal: ${err instanceof Error ? err.message : 'Kesalahan jaringan'}`);
      return false;
    }
  };

  const sampleStats = useMemo(() => {
    const pCount = (docPayload.products || []).filter(p => p.isSample).length;
    const buyCount = (docPayload.purchaseRecords || []).filter(p => p.isSample).length;
    const smCount = (docPayload.stockMovements || []).filter(p => p.isSample).length;
    const expCount = (docPayload.expenses || []).filter(p => p.isSample).length;
    const incCount = (docPayload.otherIncomes || []).filter(p => p.isSample).length;
    const depCount = (docPayload.deposits || []).filter(p => p.isSample).length;
    const total = pCount + buyCount + smCount + expCount + incCount + depCount;
    return { count: total, products: pCount, transactions: total - pCount };
  }, [docPayload]);

  const handleLoadSampleData = async () => {
    const nextPayload = seedSampleData(docPayload);
    const ok = await executeSaveTransaction(nextPayload, 'Data contoh');
    if (ok) {
      showToast('Data contoh 1 minggu (25 barang) berhasil dimuat!');
    }
  };

  const handleConfirmDeleteSample = async () => {
    const nextPayload = removeSampleData(docPayload);
    setShowDeleteSampleModal(false);
    const ok = await executeSaveTransaction(nextPayload, 'Semua data contoh');
    if (ok) {
      showToast('Semua data contoh berhasil dihapus!');
    }
  };

  const handleDeleteRecord = async (
    recordType?: 'purchase' | 'stock' | 'expense' | 'otherIncome' | 'deposit',
    recordId?: string
  ) => {
    if (!recordType || !recordId) return;
    const nextPayload: TokoSakalaPayload = { ...docPayload };
    if (recordType === 'purchase') {
      nextPayload.purchaseRecords = (docPayload.purchaseRecords || []).filter(r => r.id !== recordId);
    } else if (recordType === 'stock') {
      nextPayload.stockMovements = (docPayload.stockMovements || []).filter(r => r.id !== recordId);
    } else if (recordType === 'expense') {
      nextPayload.expenses = (docPayload.expenses || []).filter(r => r.id !== recordId);
    } else if (recordType === 'otherIncome') {
      nextPayload.otherIncomes = (docPayload.otherIncomes || []).filter(r => r.id !== recordId);
    } else if (recordType === 'deposit') {
      nextPayload.deposits = (docPayload.deposits || []).filter(r => r.id !== recordId);
    }
    await executeSaveTransaction(nextPayload, 'Catatan');
  };

  const cartTotalCost = useMemo(() => {
    return purchaseCart.reduce((sum, c) => sum + (c.totalCost || 0), 0);
  }, [purchaseCart]);

  const handleOpenProductCard = (prod: ProductItem) => {
    if (openedCardId === prod.id) return;
    const existing = purchaseCart.find((c) => c.productId === prod.id);
    if (existing) {
      setCardDraftQty(existing.qty);
      setCardDraftUnit(existing.unit);
      setCardDraftCostStr(String(existing.totalCost));
      setCardDraftSourceMoney(existing.sourceMoney);
    } else {
      setCardDraftQty(1);
      setCardDraftUnit('kemasan');
      const oldModal = getProductLatestUnitCost(prod.id, docPayload, catalogList);
      const defaultPackCost = prod.costPerPack ?? (oldModal ? oldModal * prod.packSize : 0);
      setCardDraftCostStr(defaultPackCost > 0 ? String(defaultPackCost) : '');
      setCardDraftSourceMoney(purchaseSourceMoney);
    }
    setCardValidationError(null);
    setSelectedProduct(prod);
    setOpenedCardId(prod.id);
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById(`prod-card-${prod.id}`);
        if (el) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleCardQtyChange = (newQty: number, prod: ProductItem) => {
    const q = Math.max(1, newQty);
    setCardDraftQty(q);
    setCardValidationError(null);
    const oldModal = getProductLatestUnitCost(prod.id, docPayload, catalogList);
    const packCost = prod.costPerPack ?? (oldModal ? oldModal * prod.packSize : 0);
    if (packCost > 0) {
      const isKemasan = cardDraftUnit !== 'pcs';
      const calcCost = isKemasan ? q * packCost : Math.round((q * packCost) / prod.packSize);
      setCardDraftCostStr(String(calcCost));
    }
  };

  const handleCardUnitChange = (newUnit: 'kemasan' | 'pcs', prod: ProductItem) => {
    setCardDraftUnit(newUnit);
    const oldModal = getProductLatestUnitCost(prod.id, docPayload, catalogList);
    const packCost = prod.costPerPack ?? (oldModal ? oldModal * prod.packSize : 0);
    if (packCost > 0) {
      const isKemasan = newUnit !== 'pcs';
      const calcCost = isKemasan ? cardDraftQty * packCost : Math.round((cardDraftQty * packCost) / prod.packSize);
      setCardDraftCostStr(String(calcCost));
    }
  };

  const handleAddOrUpdateCart = (prod: ProductItem) => {
    if (cardDraftQty < 1) {
      setCardValidationError('Isi jumlah');
      return;
    }
    const cost = parseRupiahInput(cardDraftCostStr);
    if (cost <= 0) {
      setCardValidationError('Isi total nota');
      return;
    }
    setPurchaseCart((prev) => {
      const filtered = prev.filter((c) => c.productId !== prod.id);
      return [
        ...filtered,
        {
          productId: prod.id,
          qty: cardDraftQty,
          unit: cardDraftUnit,
          totalCost: cost,
          sourceMoney: cardDraftSourceMoney,
        },
      ];
    });
    setPurchaseSourceMoney(cardDraftSourceMoney);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('toko_sakala_belanja_source', cardDraftSourceMoney);
    }
    setCardValidationError(null);
    setOpenedCardId(null);
  };

  const handleRemoveFromCart = (prodId: string) => {
    setPurchaseCart((prev) => prev.filter((c) => c.productId !== prodId));
    setOpenedCardId(null);
  };

  const handleSaveAllCartPurchases = async () => {
    if (purchaseCart.length === 0) return;
    const hasZero = purchaseCart.some((c) => c.totalCost <= 0);
    if (hasZero) {
      showToast('Isi total nota');
      return;
    }

    const nowIso = new Date().toISOString();
    let totalPieces = 0;
    const newPurchases: PurchaseRecord[] = [];
    const newMovements: StockMovementRecord[] = [];

    purchaseCart.forEach((c, idx) => {
      const prod = catalogList.find((p) => p.id === c.productId);
      const isKemasan = c.unit !== 'pcs';
      const packSize = prod ? prod.packSize : 1;
      const pieces = isKemasan ? c.qty * packSize : c.qty;
      totalPieces += pieces;

      newPurchases.push({
        id: `purch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        occurredAt: nowIso,
        productId: c.productId,
        packs: c.qty,
        unitsPerPack: isKemasan ? packSize : 1,
        totalCost: c.totalCost,
        sourceMoney: c.sourceMoney,
      });

      newMovements.push({
        id: `mov-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        occurredAt: nowIso,
        productId: c.productId,
        type: 'IN_PURCHASE',
        quantity: pieces,
        unit: 'pcs',
        notes: `Belanja ${c.qty} ${isKemasan ? (prod?.unit || 'kemasan') : 'pcs'}`,
      });
    });

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      purchaseRecords: [...newPurchases, ...docPayload.purchaseRecords],
      stockMovements: [...newMovements, ...docPayload.stockMovements],
    };

    const ok = await executeSaveTransaction(nextPayload, `${purchaseCart.length} belanja tersimpan`);
    if (ok) {
      showToast(`${purchaseCart.length} belanja tersimpan · +${totalPieces} pcs`);
      setPurchaseCart([]);
      setOpenedCardId(null);
      setShowCartSheet(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleSavePurchase = async () => {
    const qty = Math.max(1, purchaseQty);
    const isKemasan = purchaseUnit !== 'pcs';
    const packSize = isKemasan ? selectedProduct.packSize : 1;
    const piecesToAdd = isKemasan ? qty * selectedProduct.packSize : qty;

    const oldModalPerPcs = getProductLatestUnitCost(selectedProduct.id, docPayload, catalogList);
    const defaultCostPerPack = selectedProduct.costPerPack ?? (oldModalPerPcs ? oldModalPerPcs * selectedProduct.packSize : 0);
    const defaultTotal = defaultCostPerPack > 0
      ? (isKemasan ? qty * defaultCostPerPack : Math.round((qty * defaultCostPerPack) / selectedProduct.packSize))
      : 0;

    const totalCost = customPurchaseCost !== ''
      ? Math.max(0, parseRupiahInput(customPurchaseCost))
      : defaultTotal;

    const nowIso = new Date().toISOString();

    const newPurchase: PurchaseRecord = {
      id: `purch-${Date.now()}`,
      occurredAt: nowIso,
      productId: selectedProduct.id,
      packs: qty,
      unitsPerPack: packSize,
      totalCost,
      sourceMoney: purchaseSourceMoney,
    };

    const newMovement = {
      id: `mov-${Date.now()}`,
      occurredAt: nowIso,
      productId: selectedProduct.id,
      type: 'IN_PURCHASE' as const,
      quantity: piecesToAdd,
      unit: 'pcs',
      notes: `Belanja ${qty} ${isKemasan ? selectedProduct.unit : 'pcs'}`,
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      purchaseRecords: [newPurchase, ...docPayload.purchaseRecords],
      stockMovements: [newMovement, ...docPayload.stockMovements],
    };

    const ok = await executeSaveTransaction(nextPayload, `Pembelian ${selectedProduct.name} (+${piecesToAdd} pcs)`);
    if (ok) {
      setPurchaseQty(1);
      setCustomPurchaseCost('');
    }
  };

  const handleUpdateSellingPrice = async (newPrice: number) => {
    if (newPrice <= 0) return;
    const existsInCustom = (docPayload.products || []).some(p => p.id === selectedProduct.id);
    let updatedProducts: typeof docPayload.products;
    if (existsInCustom) {
      updatedProducts = (docPayload.products || []).map(p =>
        p.id === selectedProduct.id ? { ...p, sellingPricePerUnit: newPrice } : p
      );
    } else {
      updatedProducts = [
        ...(docPayload.products || []),
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          category: selectedProduct.category,
          unit: selectedProduct.unit,
          packSize: selectedProduct.packSize,
          costPerPack: selectedProduct.costPerPack,
          sellingPricePerUnit: newPrice,
          icon: selectedProduct.icon,
          active: true,
        },
      ];
    }
    const nextPayload = { ...docPayload, products: updatedProducts };
    const ok = await executeSaveTransaction(
      nextPayload,
      `Harga jual ${selectedProduct.name} diubah menjadi Rp ${new Intl.NumberFormat('id-ID').format(newPrice)}`
    );
    if (ok) {
      setSelectedProduct(prev => ({ ...prev, sellingPricePerUnit: newPrice }));
      setShowPriceCheckModal(false);
    }
  };

  const handleAddProduct = async () => {
    const trimmedName = newProdName.trim();
    if (!trimmedName) {
      showToast('Nama produk tidak boleh kosong.');
      return;
    }
    const exists = catalogList.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      showToast('Produk dengan nama tersebut sudah ada.');
      return;
    }
    const packSize = Math.max(1, Number(newProdPackSize) || 1);
    const sellingPrice = Math.max(0, parseRupiahInput(newProdSellingPrice));
    const costPerPack = newProdIsCostUnknown || !newProdCostPerPack.trim()
      ? null
      : Math.max(0, parseRupiahInput(newProdCostPerPack));

    const newProduct = {
      id: `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      category: newProdCategory,
      unit: newProdUnit.trim() || 'pcs',
      packSize,
      costPerPack,
      sellingPricePerUnit: sellingPrice,
      icon: newProdIcon || '📦',
      active: true,
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      products: [...(docPayload.products || []), newProduct],
    };

    const ok = await executeSaveTransaction(nextPayload, `Produk ${trimmedName} berhasil didaftarkan`);
    if (ok) {
      setNewProdName('');
      setNewProdCostPerPack('');
      setNewProdSellingPrice('');
      setNewProdIsCostUnknown(false);
      setShowAddProductModal(false);
      setSelectedProduct(newProduct);
    }
  };

  const handleSaveStockCheck = async () => {
    const nowIso = new Date().toISOString();
    const entries = Object.entries(stockCounts).filter(
      ([_, count]) => count !== null && count !== undefined
    );

    if (entries.length === 0) {
      showToast('Belum ada item sisa fisik yang diisi untuk disimpan.');
      return;
    }

    const newMovements: typeof docPayload.stockMovements = [];
    const newSales: typeof docPayload.salesRecords = [];
    let totalPcsSold = 0;
    let totalSalesRevenue = 0;
    let totalCogs = 0;
    let itemsCounted = 0;
    let openingStockCount = 0;

    for (const [pId, count] of entries) {
      const prod = catalogList.find(c => c.id === pId);
      if (!prod) continue;
      itemsCounted++;
      const currentAvailable = storeSummary.stockByProduct.get(pId)?.availableUnits ?? 0;
      const physicalCount = Number(count);
      const isInitial = !hasRecordedStock(pId);

      if (isInitial) {
        openingStockCount++;
      }

      const discountSoldVal = discountCounts[pId] !== undefined && discountCounts[pId] !== null ? Number(discountCounts[pId]) : null;

      newMovements.push({
        id: `mov-stock-${pId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        occurredAt: nowIso,
        productId: pId,
        type: 'CHECK_ADJUSTMENT' as const,
        quantity: physicalCount,
        unit: 'pcs',
        discountSoldUnits: discountSoldVal,
        notes: isInitial
          ? `Stok awal fisik: ${physicalCount} pcs`
          : `Cek fisik sisa stok: ${physicalCount} pcs (catatan: ${currentAvailable} pcs)`,
      });

      // Penjualan HANYA dihitung jika barang BUKAN stok awal dan physicalCount < currentAvailable
      if (!isInitial && physicalCount < currentAvailable) {
        const soldUnits = currentAvailable - physicalCount;
        const totalSalesValue = soldUnits * prod.sellingPricePerUnit;
        const latestUnitCost = getProductLatestUnitCost(pId, docPayload, catalogList);

        totalPcsSold += soldUnits;
        totalSalesRevenue += totalSalesValue;
        if (latestUnitCost !== null) {
          totalCogs += soldUnits * latestUnitCost;
        }

        newSales.push({
          id: `sale-${pId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          occurredAt: nowIso,
          productId: pId,
          soldUnits,
          unitSellingPrice: prod.sellingPricePerUnit,
          totalSalesValue,
          isCalculatedFromStockCheck: true,
        });
      }
    }

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      stockMovements: [...newMovements, ...docPayload.stockMovements],
      salesRecords: [...newSales, ...docPayload.salesRecords],
    };

    const previousSnapshot = { ...docPayload };
    const ok = await executeSaveTransaction(
      nextPayload,
      `Pemeriksaan sisa stok (${itemsCounted} barang)`
    );
    if (ok) {
      let notes = '';
      if (openingStockCount > 0) {
        notes = `${openingStockCount} barang disimpan sebagai stok awal. Penjualan mulai dihitung pada cek berikutnya.${totalPcsSold > 0 ? ` ${totalPcsSold} pcs terjual dari barang lain.` : ''}`;
      } else if (totalPcsSold > 0) {
        notes = `${totalPcsSold} pcs terjual dihitung otomatis dari selisih catatan dan fisik.`;
      } else {
        notes = 'Sisa fisik sesuai atau lebih besar dari catatan. Tidak ada penjualan yang dihitung.';
      }

      setSaveResultModal({
        isOpen: true,
        title: 'Hasil Cek Sisa Stok Disimpan',
        itemsChecked: itemsCounted,
        unitsSold: totalPcsSold,
        salesRevenue: totalSalesRevenue,
        cogsKnown: totalCogs,
        grossProfit: totalSalesRevenue - totalCogs,
        certainty: storeSummary.certainty,
        notes,
        previousPayload: previousSnapshot,
      });

      // Tandai item yang sudah dicek hari ini, dan jangan reset hitungan kembali ke 0
      const newlyChecked = new Set(checkedTodayIds);
      entries.forEach(([pId]) => newlyChecked.add(pId));
      setCheckedTodayIds(newlyChecked);
    }
  };

  const handleSaveDeposit = async () => {
    const isCashCounted = receivedAmountInput !== null || Object.values(denominations).some(v => v > 0);
    if (!isCashCounted) {
      showToast('Harap hitung atau isi nominal uang fisik terlebih dahulu.');
      return;
    }

    const actualReceived = receivedAmount;
    const expected = storeSummary.expectedDeposit;
    const discrepancy = actualReceived - expected;
    const depositItem: DepositRecord = {
      id: `dep-${Date.now()}`,
      occurredAt: depositDateIso || new Date().toISOString(),
      expectedAmount: expected,
      receivedAmount: actualReceived,
      discrepancy,
      notes: depositNote.trim() ? `${depositDate} — ${depositNote.trim()}` : depositDate,
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      deposits: [depositItem, ...docPayload.deposits],
    };

    const previousSnapshot = { ...docPayload };
    const ok = await executeSaveTransaction(nextPayload, 'Setoran karyawan');
    if (ok) {
      setSaveResultModal({
        isOpen: true,
        title: 'Setoran Karyawan Berhasil Disimpan',
        salesRevenue: expected,
        notes: `Uang diterima: Rp ${new Intl.NumberFormat('id-ID').format(actualReceived)} · Selisih: ${
          discrepancy === 0
            ? 'Cocok (Rp 0)'
            : discrepancy < 0
            ? `Kurang Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(discrepancy))}`
            : `Lebih Rp ${new Intl.NumberFormat('id-ID').format(discrepancy)}`
        }`,
        previousPayload: previousSnapshot,
      });
      setDepositNote('');
      setShowDepositNoteInput(false);
      setReceivedAmountInput(null);
      setDenominations({ 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0 });
    }
  };

  const handleUndoSave = async () => {
    if (!saveResultModal?.previousPayload) return;
    showToast('Mengurungkan transaksi...');
    const ok = await executeSaveTransaction(
      saveResultModal.previousPayload,
      'Pembatalan transaksi (Undo)'
    );
    if (ok) {
      setSaveResultModal(null);
      showToast('Perubahan berhasil diurungkan!');
    }
  };

  const handleSaveExpense = async () => {
    const trimmed = expenseName.trim();
    if (!trimmed) {
      showToast('Nama pengeluaran tidak boleh kosong.');
      return;
    }
    const nominal = parseRupiahInput(expenseAmountStr) || expenseAmount;
    if (nominal <= 0) {
      showToast('Nominal pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      description: trimmed,
      amount: nominal,
      sourceMoney: expenseSourceMoney,
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      expenses: [newExpense, ...docPayload.expenses],
    };

    const ok = await executeSaveTransaction(nextPayload, `Biaya: ${trimmed}`);
    if (ok) {
      setExpenseName('');
      setExpenseAmount(0);
      setExpenseAmountStr('');
    }
  };

  const handleSaveOtherIncome = async () => {
    const trimmed = otherIncomeName.trim();
    if (!trimmed) {
      showToast('Nama pemasukan tidak boleh kosong.');
      return;
    }
    const nominal = parseRupiahInput(otherIncomeNominalStr);
    if (nominal <= 0) {
      showToast('Nominal per kali harus lebih besar dari Rp 0.');
      return;
    }
    const qty = Math.max(1, otherIncomeQty);
    const totalAmount = nominal * qty;
    const nowIso = new Date().toISOString();

    const newRecord: OtherIncomeRecord = {
      id: `inc-${Date.now()}`,
      occurredAt: nowIso,
      name: trimmed,
      nominal,
      quantity: qty,
      totalAmount,
      notes: otherIncomeNotes.trim() || undefined,
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      otherIncomes: [newRecord, ...(docPayload.otherIncomes || [])],
    };

    const ok = await executeSaveTransaction(
      nextPayload,
      `Pemasukan lain: ${trimmed} (${qty}x = Rp ${new Intl.NumberFormat('id-ID').format(totalAmount)})`
    );
    if (ok) {
      setShowOtherIncomeModal(false);
      setOtherIncomeName('Jasa seduh mie');
      setOtherIncomeNominalStr('2000');
      setOtherIncomeQty(3);
      setOtherIncomeNotes('');
    }
  };

  const handleSaveDamagedProduct = async () => {
    const prod = catalogList.find(p => p.id === damageProductId);
    if (!prod) {
      showToast('Pilih barang terlebih dahulu.');
      return;
    }
    const qty = Math.max(1, damageQty);
    const available = storeSummary.stockByProduct.get(damageProductId)?.availableUnits ?? 0;
    if (qty > available) {
      showToast(`Jumlah rusak (${qty} pcs) melebihi stok yang tersedia (${available} pcs).`);
      return;
    }

    const nowIso = new Date().toISOString();
    const newMovement = {
      id: `mov-loss-${Date.now()}`,
      occurredAt: nowIso,
      productId: damageProductId,
      type: 'LOSS_DAMAGE' as const,
      quantity: qty,
      unit: 'pcs',
      notes: `Barang rusak: ${damageReason}`,
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      stockMovements: [newMovement, ...(docPayload.stockMovements || [])],
    };

    const ok = await executeSaveTransaction(
      nextPayload,
      `Barang rusak: ${prod.name} (-${qty} pcs, ${damageReason})`
    );
    if (ok) {
      setShowDamageModal(false);
      setDamageQty(1);
      setDamageReason('rusak');
    }
  };

  const handleSaveWithdrawal = async () => {
    const nominal = parseRupiahInput(withdrawAmountStr);
    if (nominal <= 0) {
      showToast('Nominal pengambilan harus lebih besar dari Rp 0.');
      return;
    }

    const newWd: OwnerWithdrawalRecord = {
      id: `wd-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      amount: nominal,
      notes: withdrawNote.trim() || 'Pengambilan pemilik',
    };

    const nextPayload: TokoSakalaPayload = {
      ...docPayload,
      ownerWithdrawals: [newWd, ...(docPayload.ownerWithdrawals || [])],
    };

    const ok = await executeSaveTransaction(
      nextPayload,
      `Ambil Uang Pribadi: Rp ${new Intl.NumberFormat('id-ID').format(nominal)}`
    );
    if (ok) {
      setShowWithdrawModal(false);
      setWithdrawAmountStr('');
      setWithdrawNote('');
    }
  };

  const handleManualBackup = async () => {
    if (authState !== 'CONNECTED') {
      showToast('Hubungkan akun Google Drive terlebih dahulu.');
      return;
    }
    setIsBackingUp(true);
    try {
      const meta = await driveAdapter.createBackup('Cadangan Manual Pengguna');
      setBackups(prev => [meta, ...prev]);
      setLastBackupTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
      showToast(`Cadangan Google Drive tersimpan: ${meta.fileName}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat cadangan ke Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      showToast('Memulihkan cadangan & mengamankan snapshot...');
      const res = await driveAdapter.restoreBackup(backupId);
      if (res.success) {
        // Finding 8: Muat ulang dokumen ke seluruh state aplikasi
        const freshDoc = await driveAdapter.loadData();
        setDocPayload(freshDoc.payload);
        setDataVersion(freshDoc.dataVersion);
        setChecksumStatus('VALID');
        setShowRestoreModal(false);
        showToast(`Data berhasil dipulihkan ke versi v${freshDoc.dataVersion}! Seluruh state aplikasi telah dimuat ulang.`);
      } else {
        showToast(`Pemulihan gagal: ${res.error}`);
      }
    } catch (err) {
      showToast(`Gagal: ${err instanceof Error ? err.message : 'Kesalahan pemulihan'}`);
    }
  };

  const handleSaveClientId = () => {
    const val = clientIdInput.trim();
    if (!val) {
      showToast('Client ID tidak boleh kosong.');
      return;
    }
    googleAuth.setClientId(val);
    setShowConfigModal(false);
    showToast('OAuth Client ID tersimpan di sesi peramban.');
  };

  const handleResetClientId = () => {
    googleAuth.clearRuntimeClientId();
    setClientIdInput('');
    setShowConfigModal(false);
    showToast('Client ID di-reset ke nilai bawaan.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      amount: number;
      time: string;
      type: 'purchase' | 'expense' | 'deposit' | 'sale';
      occurredAt: string;
      isSample?: boolean;
    }> = [];

    (docPayload.purchaseRecords || []).forEach(p => {
      const prod = catalogList.find(i => i.id === p.productId);
      list.push({
        id: p.id,
        title: 'Belanja barang',
        subtitle: prod ? `${prod.name} (${p.packs} kemasan)` : `${p.packs} kemasan`,
        amount: p.totalCost,
        time: new Date(p.occurredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'purchase',
        occurredAt: p.occurredAt,
        isSample: p.isSample ?? false,
      });
    });

    (docPayload.expenses || []).forEach(e => {
      list.push({
        id: e.id,
        title: 'Biaya toko',
        subtitle: e.description,
        amount: e.amount,
        time: new Date(e.occurredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'expense',
        occurredAt: e.occurredAt,
        isSample: e.isSample ?? false,
      });
    });

    (docPayload.deposits || []).forEach(d => {
      list.push({
        id: d.id,
        title: 'Setoran karyawan',
        subtitle: d.notes || 'Setoran kas toko',
        amount: d.receivedAmount,
        time: new Date(d.occurredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'deposit',
        occurredAt: d.occurredAt,
        isSample: d.isSample ?? false,
      });
    });

    (docPayload.salesRecords || []).forEach(s => {
      const prod = catalogList.find(i => i.id === s.productId);
      list.push({
        id: s.id,
        title: 'Penjualan stok',
        subtitle: prod ? `${prod.name} (${s.soldUnits} pcs terjual)` : `${s.soldUnits} pcs terjual`,
        amount: s.totalSalesValue,
        time: new Date(s.occurredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'sale',
        occurredAt: s.occurredAt,
        isSample: s.isSample ?? false,
      });
    });

    (docPayload.ownerWithdrawals || []).forEach(w => {
      list.push({
        id: w.id,
        title: 'Ambil uang pribadi',
        subtitle: w.notes || 'Pengambilan pemilik',
        amount: w.amount,
        time: new Date(w.occurredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'expense',
        occurredAt: w.occurredAt,
        isSample: w.isSample ?? false,
      });
    });

    list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return list;
  }, [docPayload, catalogList]);

  // 1. Rentang waktu Ringkasan (Hari / Minggu / Bulan / Tahun)
  const ringkasanRange = useMemo(() => {
    const parts = ringkasanAnchorDate.split('-');
    const year = Number(parts[0]) || new Date().getFullYear();
    const month = (Number(parts[1]) || 1) - 1;
    const date = Number(parts[2]) || 1;

    if (ringkasanPeriod === 'HARI') {
      const start = new Date(year, month, date, 0, 0, 0, 0).toISOString();
      const end = new Date(year, month, date, 23, 59, 59, 999).toISOString();
      return { start, end };
    } else if (ringkasanPeriod === 'MINGGU') {
      const d = new Date(year, month, date);
      const day = d.getDay(); // 0 is Sunday
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(year, month, date - diffToMonday, 0, 0, 0, 0);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
      return { start: monday.toISOString(), end: sunday.toISOString() };
    } else if (ringkasanPeriod === 'BULAN') {
      const firstDay = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      return { start: firstDay, end: lastDay };
    } else {
      // TAHUN
      const firstDay = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
      const lastDay = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
      return { start: firstDay, end: lastDay };
    }
  }, [ringkasanPeriod, ringkasanAnchorDate]);

  const ringkasanData = useMemo<DateRangePeriodSummary>(() => {
    return calculatePeriodSummary(docPayload, catalogList, ringkasanRange.start, ringkasanRange.end);
  }, [docPayload, catalogList, ringkasanRange]);

  const formattedAnchorDate = useMemo(() => {
    const parts = ringkasanAnchorDate.split('-');
    const d = new Date(Number(parts[0]), (Number(parts[1]) || 1) - 1, Number(parts[2]) || 1);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }, [ringkasanAnchorDate]);

  // 2. Periode Berjalan (Sejak setoran terakhir disimpan hingga sekarang)
  const currentPeriodData = useMemo(() => {
    const sortedDeposits = [...(docPayload.deposits || [])].sort(
      (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
    );
    const lastDeposit = sortedDeposits.length > 0 ? sortedDeposits[sortedDeposits.length - 1] : null;
    const sinceTimeMs = lastDeposit ? Date.parse(lastDeposit.occurredAt) : 0;
    const depositNumber = sortedDeposits.length + 1;

    type PeriodEventItem = {
      id: string;
      time: string;
      timeMs: number;
      type: 'belanja' | 'cek stok' | 'biaya' | 'jasa' | 'rusak';
      title: string;
      desc: string;
      impactText?: string;
      amountText?: string;
      icon: string;
      color: string;
    };

    const items: PeriodEventItem[] = [];

    // Belanja di tengah periode
    (docPayload.purchaseRecords || []).forEach((p) => {
      const t = Date.parse(p.occurredAt);
      if (t > sinceTimeMs) {
        const prod = catalogList.find((c) => c.id === p.productId);
        const pcs = p.packs * p.unitsPerPack;
        items.push({
          id: p.id,
          time: p.occurredAt,
          timeMs: t,
          type: 'belanja',
          title: `Belanja ${prod?.name || 'Barang'}`,
          desc: `${p.packs} ${p.unitsPerPack > 1 ? `kemasan (@${p.unitsPerPack} pcs)` : 'pcs'} • Rp ${new Intl.NumberFormat('id-ID').format(p.totalCost)}`,
          impactText: `+${pcs} pcs stok tersedia`,
          amountText: `-Rp ${new Intl.NumberFormat('id-ID').format(p.totalCost)}`,
          icon: '🛒',
          color: 'var(--orange)',
        });
      }
    });

    // Cek Stok & Barang Rusak
    (docPayload.stockMovements || []).forEach((m) => {
      const t = Date.parse(m.occurredAt);
      if (t > sinceTimeMs) {
        const prod = catalogList.find((c) => c.id === m.productId);
        if (m.type === 'CHECK_ADJUSTMENT') {
          items.push({
            id: m.id,
            time: m.occurredAt,
            timeMs: t,
            type: 'cek stok',
            title: `Cek Sisa Stok ${prod?.name || 'Barang'}`,
            desc: m.notes || `Sisa fisik: ${m.quantity} pcs`,
            impactText: `Sisa ${m.quantity} pcs`,
            icon: '▦',
            color: 'var(--lime)',
          });
        } else if (m.type === 'LOSS_DAMAGE' || m.type === 'LOSS_UNKNOWN') {
          items.push({
            id: m.id,
            time: m.occurredAt,
            timeMs: t,
            type: 'rusak',
            title: `Barang Rusak ${prod?.name || 'Barang'}`,
            desc: `${m.quantity} pcs (${m.notes || 'rusak/cacat'})`,
            impactText: `-${m.quantity} pcs stok berkurang`,
            icon: '⚠',
            color: 'var(--red)',
          });
        }
      }
    });

    // Biaya
    (docPayload.expenses || []).forEach((e) => {
      const t = Date.parse(e.occurredAt);
      if (t > sinceTimeMs) {
        items.push({
          id: e.id,
          time: e.occurredAt,
          timeMs: t,
          type: 'biaya',
          title: `Biaya: ${e.description}`,
          desc: e.sourceMoney === 'LACI' ? 'Uang Laci Kasir' : 'Uang Pribadi',
          amountText: `-Rp ${new Intl.NumberFormat('id-ID').format(e.amount)}`,
          icon: '↗',
          color: 'var(--ink)',
        });
      }
    });

    // Pemasukan Lain
    (docPayload.otherIncomes || []).forEach((inc) => {
      const t = Date.parse(inc.occurredAt);
      if (t > sinceTimeMs) {
        items.push({
          id: inc.id,
          time: inc.occurredAt,
          timeMs: t,
          type: 'jasa',
          title: `Pemasukan: ${inc.name}`,
          desc: `${inc.quantity} kali @ Rp ${new Intl.NumberFormat('id-ID').format(inc.nominal)}`,
          amountText: `+Rp ${new Intl.NumberFormat('id-ID').format(inc.totalAmount)}`,
          icon: '✦',
          color: 'var(--green)',
        });
      }
    });

    items.sort((a, b) => a.timeMs - b.timeMs);

    return {
      lastDeposit,
      sinceTimeMs,
      depositNumber,
      items,
    };
  }, [docPayload, catalogList]);

  // 3. Riwayat Transaksi Lengkap
  type UnifiedHistoryItem = {
    id: string;
    rawId?: string;
    recordType?: 'purchase' | 'stock' | 'expense' | 'otherIncome' | 'deposit';
    isSample?: boolean;
    time: string;
    timeMs: number;
    type: 'belanja' | 'cek stok' | 'biaya' | 'jasa' | 'rusak' | 'setoran';
    typeLabel: string;
    summary: string;
    nominal: number;
    nominalText: string;
    detailTitle: string;
    detailFormula?: string;
    detailRows: Array<{ label: string; value: string; isNegative?: boolean; isHighlight?: boolean }>;
    detailNote?: string;
  };

  const allHistoryItems = useMemo<UnifiedHistoryItem[]>(() => {
    const list: UnifiedHistoryItem[] = [];

    // Belanja
    (docPayload.purchaseRecords || []).forEach((p) => {
      const prod = catalogList.find((c) => c.id === p.productId);
      const pcs = p.packs * p.unitsPerPack;
      list.push({
        id: p.id,
        rawId: p.id,
        recordType: 'purchase',
        isSample: p.isSample ?? false,
        time: p.occurredAt,
        timeMs: Date.parse(p.occurredAt),
        type: 'belanja',
        typeLabel: 'Belanja',
        summary: `${prod?.name || 'Barang'} (${p.packs} ${p.unitsPerPack > 1 ? 'kemasan' : 'pcs'})`,
        nominal: p.totalCost,
        nominalText: `-Rp ${new Intl.NumberFormat('id-ID').format(p.totalCost)}`,
        detailTitle: `Rincian Belanja: ${prod?.name || 'Barang'}`,
        detailFormula: 'Total nota = kemasan × harga beli',
        detailRows: [
          { label: 'Barang', value: prod?.name || p.productId },
          { label: 'Jumlah masuk', value: `${p.packs} kemasan (@${p.unitsPerPack} pcs) = ${pcs} pcs` },
          { label: 'Sumber dana', value: p.sourceMoney === 'SETORAN' ? 'Uang setoran toko' : 'Uang pribadi' },
          { label: 'Total nota', value: `Rp ${new Intl.NumberFormat('id-ID').format(p.totalCost)}`, isHighlight: true },
        ],
        detailNote: 'Belanja menambah stok tersedia di toko dan menetapkan modal per pcs terbaru.',
      });
    });

    // Cek Stok & Rusak
    (docPayload.stockMovements || []).forEach((m) => {
      const prod = catalogList.find((c) => c.id === m.productId);
      const t = Date.parse(m.occurredAt);
      if (m.type === 'CHECK_ADJUSTMENT') {
        list.push({
          id: m.id,
          rawId: m.id,
          recordType: 'stock',
          isSample: m.isSample ?? false,
          time: m.occurredAt,
          timeMs: t,
          type: 'cek stok',
          typeLabel: 'Cek Stok',
          summary: `${prod?.name || 'Barang'}: sisa ${m.quantity} pcs`,
          nominal: 0,
          nominalText: '—',
          detailTitle: `Rincian Cek Stok: ${prod?.name || 'Barang'}`,
          detailFormula: 'Terjual = stok tersedia − sisa fisik',
          detailRows: [
            { label: 'Barang', value: prod?.name || m.productId },
            { label: 'Sisa fisik', value: `${m.quantity} pcs`, isHighlight: true },
            { label: 'Terjual saat diskon', value: m.discountSoldUnits != null ? `${m.discountSoldUnits} pcs` : 'Tidak ada' },
            { label: 'Catatan', value: m.notes || 'Pemeriksaan sisa fisik berkala' },
          ],
          detailNote: 'Selisih dari stok catatan sebelumnya otomatis dihitung sebagai penjualan.',
        });
      } else {
        list.push({
          id: m.id,
          rawId: m.id,
          recordType: 'stock',
          isSample: m.isSample ?? false,
          time: m.occurredAt,
          timeMs: t,
          type: 'rusak',
          typeLabel: 'Rusak',
          summary: `${prod?.name || 'Barang'}: ${m.quantity} pcs (${m.notes || 'rusak'})`,
          nominal: 0,
          nominalText: '—',
          detailTitle: `Rincian Barang Rusak: ${prod?.name || 'Barang'}`,
          detailFormula: 'Stok tersedia berkurang, tidak dihitung penjualan',
          detailRows: [
            { label: 'Barang', value: prod?.name || m.productId },
            { label: 'Jumlah rusak', value: `${m.quantity} pcs`, isHighlight: true },
            { label: 'Alasan', value: m.notes || 'Rusak/cacat fisik' },
          ],
          detailNote: 'Mengurangi stok barang fisik dan dicatat sebagai Rugi Barang Rusak di Laporan.',
        });
      }
    });

    // Biaya
    (docPayload.expenses || []).forEach((e) => {
      list.push({
        id: e.id,
        rawId: e.id,
        recordType: 'expense',
        isSample: e.isSample ?? false,
        time: e.occurredAt,
        timeMs: Date.parse(e.occurredAt),
        type: 'biaya',
        typeLabel: 'Biaya',
        summary: e.description,
        nominal: e.amount,
        nominalText: `-Rp ${new Intl.NumberFormat('id-ID').format(e.amount)}`,
        detailTitle: `Rincian Biaya: ${e.description}`,
        detailRows: [
          { label: 'Deskripsi', value: e.description },
          { label: 'Sumber uang', value: e.sourceMoney === 'LACI' ? 'Laci kasir toko' : 'Uang pribadi' },
          { label: 'Nominal biaya', value: `Rp ${new Intl.NumberFormat('id-ID').format(e.amount)}`, isHighlight: true },
        ],
        detailNote: e.sourceMoney === 'LACI' ? 'Biaya dari laci kasir mengurangi kewajiban setoran karyawan.' : 'Biaya pribadi tidak mengurangi setoran kasir.',
      });
    });

    // Jasa / Pemasukan Lain
    (docPayload.otherIncomes || []).forEach((i) => {
      list.push({
        id: i.id,
        rawId: i.id,
        recordType: 'otherIncome',
        isSample: i.isSample ?? false,
        time: i.occurredAt,
        timeMs: Date.parse(i.occurredAt),
        type: 'jasa',
        typeLabel: 'Jasa',
        summary: `${i.name} (${i.quantity}x)`,
        nominal: i.totalAmount,
        nominalText: `+Rp ${new Intl.NumberFormat('id-ID').format(i.totalAmount)}`,
        detailTitle: `Rincian Pemasukan: ${i.name}`,
        detailFormula: 'Total = tarif × jumlah kali',
        detailRows: [
          { label: 'Nama jasa / pemasukan', value: i.name },
          { label: 'Tarif satuan', value: `Rp ${new Intl.NumberFormat('id-ID').format(i.nominal)}` },
          { label: 'Jumlah kali', value: `${i.quantity} kali` },
          { label: 'Total pemasukan', value: `Rp ${new Intl.NumberFormat('id-ID').format(i.totalAmount)}`, isHighlight: true },
        ],
        detailNote: 'Menambah Untung Bersih dan Setoran Seharusnya.',
      });
    });

    // Setoran
    (docPayload.deposits || []).forEach((d, idx) => {
      list.push({
        id: d.id,
        rawId: d.id,
        recordType: 'deposit',
        isSample: d.isSample ?? false,
        time: d.occurredAt,
        timeMs: Date.parse(d.occurredAt),
        type: 'setoran',
        typeLabel: 'Setoran',
        summary: `Setoran ke-${idx + 1} (${d.receivedAmount === d.expectedAmount ? 'Cocok' : d.discrepancy < 0 ? 'Kurang' : 'Lebih'})`,
        nominal: d.receivedAmount,
        nominalText: `Rp ${new Intl.NumberFormat('id-ID').format(d.receivedAmount)}`,
        detailTitle: `Rincian Setoran ke-${idx + 1}`,
        detailFormula: 'Selisih = Diterima − Seharusnya',
        detailRows: [
          { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(d.expectedAmount)}` },
          { label: 'Uang fisik diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(d.receivedAmount)}`, isHighlight: true },
          { label: 'Selisih penyerahan', value: `Rp ${new Intl.NumberFormat('id-ID').format(d.discrepancy)}`, isNegative: d.discrepancy < 0 },
        ],
        detailNote: 'Penyerahan uang tunai dari kasir ke pemilik toko.',
      });
    });

    return list;
  }, [docPayload, catalogList]);

  const filteredSortedHistory = useMemo(() => {
    let res = [...allHistoryItems];
    if (riwayatFilter !== 'semua') {
      res = res.filter((item) => item.type === riwayatFilter);
    }
    if (riwayatSort === 'terbaru') {
      res.sort((a, b) => b.timeMs - a.timeMs);
    } else if (riwayatSort === 'terlama') {
      res.sort((a, b) => a.timeMs - b.timeMs);
    } else if (riwayatSort === 'nominal') {
      res.sort((a, b) => b.nominal - a.nominal);
    }
    return res;
  }, [allHistoryItems, riwayatFilter, riwayatSort]);

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
          <strong>Penyimpanan Offline-First</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: syncStatus.lastError
                ? 'var(--red)'
                : syncStatus.isSyncing
                ? 'var(--orange)'
                : syncStatus.pendingCount > 0
                ? '#b8860b'
                : 'var(--green)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800 }}>
              {syncStatus.lastError
                ? 'Gagal'
                : syncStatus.isSyncing
                ? 'Menyinkronkan...'
                : syncStatus.pendingCount > 0
                ? 'Menunggu sinkronisasi'
                : supabaseAdapter.isConfigured()
                ? 'Tersinkronisasi'
                : 'Tersimpan (lokal)'}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
            Versi Data: {dataVersion === 0 ? '—' : `v${dataVersion}`} • SHA-256 {checksumStatus === 'VALID' ? 'Valid' : 'Belum Diperiksa'}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
            ID: {deviceId.substring(0, 16)}
          </span>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main id="main" className="main-content">
        {/* Mobile Header (Only on Beranda) */}
        {currentScreen === 'beranda' && (
          <header className="mobile-head" style={{ padding: '14px 0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="brand-insignia" aria-hidden="true">
                TS
              </div>
              <div>
                <div className="mobile-brand" style={{ fontSize: '16px', lineHeight: 1.1 }}>
                  TOKO SAKALA
                </div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  PRO MERCHANT
                </div>
              </div>
              <div
                className="live-pulse-beacon"
                title={syncStatus.lastError ? `Gagal: ${syncStatus.lastError}` : syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} antrean` : 'Tersinkron aman'}
              >
                <span className={`pulse-dot ${syncStatus.lastError ? 'rose' : syncStatus.isSyncing || syncStatus.pendingCount > 0 ? 'amber' : 'emerald'}`} />
                <span>
                  {syncStatus.lastError
                    ? 'Gagal'
                    : syncStatus.isSyncing
                    ? 'Sinkron...'
                    : syncStatus.pendingCount > 0
                    ? 'Menunggu'
                    : supabaseAdapter.isConfigured()
                    ? 'Tersinkron'
                    : 'Lokal'}
                </span>
              </div>
            </div>
            <div className="mobile-head-actions">
              <button
                type="button"
                className="iconbtn"
                aria-label="Notifikasi"
                onClick={() => showToast('Tidak ada notifikasi baru hari ini.')}
              >
                <Bell size={17} />
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

        {/* Back header for sub-screens (Single Unified Native Mobile Top Bar) */}
        {currentScreen !== 'beranda' && (() => {
          const isSecondaryTool = ['biaya', 'laporan', 'riwayat', 'barang', 'pengaturan'].includes(currentScreen);
          return (
            <div className="screen-header-row" style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setCurrentScreen(isSecondaryTool ? 'lainnya' : 'beranda')}
                  aria-label={isSecondaryTool ? 'Kembali ke Semua Alat Toko' : 'Kembali ke Beranda'}
                >
                  <ArrowLeft size={18} />
                </button>
                <h1
                  className="screen-header-title"
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentScreen === 'catat' && 'Catat Belanja'}
                  {currentScreen === 'stok' && 'Cek Sisa Stok'}
                  {currentScreen === 'setoran' && `Setoran ke-${(docPayload.deposits?.length || 0) + 1}`}
                  {currentScreen === 'biaya' && 'Biaya & Pemasukan'}
                  {currentScreen === 'laporan' && 'Laporan Keuangan'}
                  {currentScreen === 'riwayat' && 'Riwayat Catatan'}
                  {currentScreen === 'barang' && `Katalog Produk (${catalogList.length})`}
                  {currentScreen === 'asisten' && 'Asisten Pencatatan'}
                  {currentScreen === 'pengaturan' && 'Pengaturan'}
                  {currentScreen === 'lainnya' && 'Semua Alat Toko'}
                </h1>
              </div>

              {currentScreen === 'stok' && (
                <button
                  type="button"
                  className="btn-damage-quick"
                  onClick={() => setShowDamageModal(true)}
                  aria-label="Catat barang rusak"
                >
                  <span className="damage-icon-plate">
                    <Package size={13} />
                  </span>
                  <span>Catat Rusak</span>
                </button>
              )}

              {currentScreen === 'laporan' && (
                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={() => window.print()}
                  style={{
                    minHeight: '38px',
                    fontSize: '11.5px',
                    padding: '4px 11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                  title="Cetak atau simpan laporan sebagai PDF"
                >
                  <Printer size={14} />
                  <span>Cetak / PDF</span>
                </button>
              )}

              {currentScreen === 'riwayat' && (
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(32,33,31,0.06)', padding: '3px', borderRadius: '10px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setRiwayatViewMode('kartu')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 850,
                      borderRadius: '7px',
                      border: 'none',
                      cursor: 'pointer',
                      background: riwayatViewMode === 'kartu' ? '#fff' : 'transparent',
                      color: 'var(--ink)',
                      boxShadow: riwayatViewMode === 'kartu' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    Kartu
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiwayatViewMode('tabel')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 850,
                      borderRadius: '7px',
                      border: 'none',
                      cursor: 'pointer',
                      background: riwayatViewMode === 'tabel' ? '#fff' : 'transparent',
                      color: 'var(--ink)',
                      boxShadow: riwayatViewMode === 'tabel' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    Tabel
                  </button>
                </div>
              )}

              {currentScreen === 'barang' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddProductModal(true)}
                  style={{
                    minHeight: '38px',
                    fontSize: '11.5px',
                    padding: '4px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 850,
                    flexShrink: 0,
                  }}
                >
                  <Plus size={14} />
                  <span>Produk Baru</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* SCREEN 1: BERANDA (STREAMLINED TOKO MODE)                */}
        {/* ======================================================== */}
        {currentScreen === 'beranda' && (() => {
          const recordedCount = catalogList.filter(p => hasRecordedStock(p.id)).length;
          const totalCount = catalogList.length;

          return (
            <div>
              {/* Sapaan Header + Chronometer Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: 950, margin: '0 0 2px 0', letterSpacing: '-0.02em' }}>Halo, Juragan 👋</h1>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Posisi kas & performa operasional toko</span>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '8px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}>
                  <Calendar size={12} color="var(--orange)" />
                  <span>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span>
                </div>
              </div>

              {/* Executive Vault Hero Card (Black Metal Luxury) */}
              {storeSummary.remainingDeposit > 0 ? (
                <div
                  className="executive-card"
                  style={{ marginBottom: '10px' }}
                  onClick={() => setCurrentScreen('setoran')}
                  role="button"
                  tabIndex={0}
                >
                  {/* Guilloche Watermark */}
                  <svg className="executive-card-guilloche" viewBox="0 0 100 100" fill="none" stroke="#ffffff">
                    <circle cx="50" cy="50" r="48" strokeWidth="0.8" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="38" strokeWidth="0.6" />
                    <circle cx="50" cy="50" r="28" strokeWidth="0.8" strokeDasharray="2 2" />
                    <circle cx="50" cy="50" r="18" strokeWidth="0.6" />
                    <circle cx="50" cy="50" r="8" strokeWidth="0.8" />
                    <path d="M 0 50 Q 50 0 100 50 Q 50 100 0 50" strokeWidth="0.5" />
                    <path d="M 50 0 Q 100 50 50 100 Q 0 50 50 0" strokeWidth="0.5" />
                  </svg>

                  {/* Top Header Row with EMV Chip & Insignia */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Gold EMV Card Smart Chip */}
                      <svg width="26" height="20" viewBox="0 0 28 22" fill="none" style={{ borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                        <rect width="28" height="22" rx="3" fill="#E5B947" stroke="#b89332" strokeWidth="0.8" />
                        <path d="M 0 7 L 10 7 M 0 15 L 10 15 M 18 7 L 28 7 M 18 15 L 28 15 M 10 0 L 10 22 M 18 0 L 18 22" stroke="#94741e" strokeWidth="0.8" />
                        <circle cx="14" cy="11" r="2.5" fill="#f8e79b" stroke="#94741e" strokeWidth="0.8" />
                      </svg>
                      {/* Contactless NFC wave ornament */}
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
                        <path d="M 2 2 C 5 4.5 5 9.5 2 12" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M 6 4 C 8 5.8 8 8.2 6 10" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M 10 6 C 10.8 6.8 10.8 7.2 10 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            color: '#ffffff',
                            textTransform: 'uppercase',
                          }}>
                            KAS TOKO
                          </span>
                          <InfoButton
                            size={12}
                            onClick={() => {
                              setDetailModal({
                                title: 'Sisa Disetor',
                                formula: 'Setoran seharusnya − Setoran diterima sebelumnya',
                                rows: [
                                  { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}` },
                                  { label: 'Setoran diterima', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}`, isNegative: true },
                                  { label: 'Sisa disetor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}`, isHighlight: true },
                                ],
                                note: 'Uang penjualan dikurangi biaya laci kasir yang belum disetor ke pemilik.',
                              });
                            }}
                            label="Rincian sisa disetor"
                          />
                        </div>
                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>
                          NO. 8820 · SAKALA REGISTER
                        </span>
                      </div>
                    </div>

                    {storeSummary.certainty !== 'PASTI' && storeSummary.reviewReason ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: 'rgba(255, 106, 40, 0.2)',
                        border: '1px solid rgba(255, 106, 40, 0.4)',
                        color: '#ff9d66',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)' }} />
                        <span>{storeSummary.reviewReason}</span>
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#D7FA4A',
                        background: 'rgba(215, 250, 74, 0.12)',
                        border: '1px solid rgba(215, 250, 74, 0.28)',
                        padding: '2px 8px',
                        borderRadius: '20px',
                      }}>
                        <ShieldCheck size={12} color="#D7FA4A" />
                        <span>Audit Siap</span>
                      </span>
                    )}
                  </div>

                  {/* Vertical Security Thread Filament */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: '68px',
                    width: '1px',
                    background: 'repeating-linear-gradient(180deg, rgba(215, 250, 74, 0.35) 0px, rgba(215, 250, 74, 0.35) 4px, transparent 4px, transparent 8px)',
                    pointerEvents: 'none',
                    opacity: 0.4,
                  }} />

                  {/* Middle Row: Amount */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '2px' }}>
                      Sisa Kewajiban Setoran
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 950,
                      letterSpacing: '-0.03em',
                      color: '#ffffff',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                    }}>
                      {storeSummary.certainty !== 'PASTI' && storeSummary.grossSales.min !== storeSummary.grossSales.max ? '≈ ' : ''}
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                      Wajib disetor ke kasir/pemilik
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#FF6A28',
                      background: 'rgba(255, 106, 40, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 106, 40, 0.3)',
                    }}>
                      Setor Sekarang →
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="executive-card"
                  style={{ marginBottom: '10px' }}
                  onClick={() => setCurrentScreen('setoran')}
                  role="button"
                  tabIndex={0}
                >
                  <svg className="executive-card-guilloche" viewBox="0 0 100 100" fill="none" stroke="#D7FA4A">
                    <circle cx="50" cy="50" r="48" strokeWidth="0.8" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="38" strokeWidth="0.6" />
                    <circle cx="50" cy="50" r="28" strokeWidth="0.8" strokeDasharray="2 2" />
                    <circle cx="50" cy="50" r="18" strokeWidth="0.6" />
                    <path d="M 0 50 Q 50 0 100 50 Q 50 100 0 50" strokeWidth="0.5" />
                    <path d="M 50 0 Q 100 50 50 100 Q 0 50 50 0" strokeWidth="0.5" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="26" height="20" viewBox="0 0 28 22" fill="none" style={{ borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                        <rect width="28" height="22" rx="3" fill="#D7FA4A" stroke="#a3c428" strokeWidth="0.8" />
                        <path d="M 0 7 L 10 7 M 0 15 L 10 15 M 18 7 L 28 7 M 18 15 L 28 15 M 10 0 L 10 22 M 18 0 L 18 22" stroke="#7a9616" strokeWidth="0.8" />
                        <circle cx="14" cy="11" r="2.5" fill="#f4ff9e" stroke="#7a9616" strokeWidth="0.8" />
                      </svg>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
                        <path d="M 2 2 C 5 4.5 5 9.5 2 12" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M 6 4 C 8 5.8 8 8.2 6 10" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M 10 6 C 10.8 6.8 10.8 7.2 10 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        color: 'rgba(255, 255, 255, 0.72)',
                        textTransform: 'uppercase',
                      }}>
                        KAS TOKO
                      </span>
                      <InfoButton
                        size={13}
                        onClick={() => {
                          setDetailModal({
                            title: 'Setoran Lengkap',
                            formula: 'Setoran seharusnya − Setoran diterima = Rp 0',
                            rows: [
                              { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}` },
                              { label: 'Setoran diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                              { label: 'Sisa disetor', value: 'Rp 0', isHighlight: true },
                            ],
                            note: 'Semua kewajiban uang setoran telah diterima lengkap.',
                          });
                        }}
                        label="Rincian setoran lengkap"
                      />
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#D7FA4A',
                      background: 'rgba(215, 250, 74, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      border: '1px solid rgba(215, 250, 74, 0.3)',
                    }}>
                      <ShieldCheck size={12} color="#D7FA4A" />
                      <span>Terverifikasi Lengkap</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <CheckCircle2 size={24} color="#D7FA4A" />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>Setoran Lengkap</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Semua uang toko sudah diserahkan.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#D7FA4A' }}>Lihat Riwayat →</span>
                  </div>
                </div>
              )}

              {/* Single Small Chip jika belum isi stok awal */}
              {recordedCount < totalCount && (
                <div style={{ marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('stok')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'var(--amber-pale)',
                      border: '1.5px solid var(--ink)',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    <Package size={14} color="var(--orange)" />
                    <span>Belum isi stok awal ({recordedCount}/{totalCount} barang) →</span>
                  </button>
                </div>
              )}

              {/* Metrik Utama 2x2 Grid (Jeweled Frosted Plates dengan Ornamen Watermark) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px',
              }}>
                {/* Kiri Atas: Untung Kotor */}
                <div className="form-card" style={{ padding: '12px', minHeight: '86px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0, position: 'relative', overflow: 'hidden' }}>
                  {/* Subtle Sparkline Watermark */}
                  <svg width="44" height="22" viewBox="0 0 44 22" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.16, pointerEvents: 'none' }}>
                    <path d="M 2 18 L 14 12 L 26 14 L 40 4" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="40" cy="4" r="2" fill="#d97706" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="jewel-plate amber">
                        <TrendingUp size={15} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)' }}>Untung Kotor</span>
                    </div>
                    <InfoButton
                      size={13}
                      onClick={() => setDetailModal({
                        title: 'Untung Kotor',
                        formula: 'Σ (terjual × harga jual) − Diskon',
                        rows: [
                          { label: 'Penjualan', value: `+Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.grossSales.min)}` },
                          { label: 'Diskon', value: `-Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.discountTotal.max)}`, isNegative: true },
                          { label: 'Untung kotor', value: `Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.untungKotor.min)}`, isHighlight: true },
                        ],
                        note: 'Sudah termasuk modal barang.',
                      })}
                      label="Rincian Untung Kotor"
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <strong style={{ fontSize: '15px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      Rp {new Intl.NumberFormat('id-ID').format(ringkasanData.untungKotor.min)}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      Penjualan bersih
                    </span>
                  </div>
                </div>

                {/* Kanan Atas: Setoran Masuk */}
                <div className="form-card" style={{ padding: '12px', minHeight: '86px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0, position: 'relative', overflow: 'hidden' }}>
                  {/* Subtle Chevron Deposit Watermark */}
                  <svg width="36" height="22" viewBox="0 0 36 22" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.16, pointerEvents: 'none' }}>
                    <path d="M 6 5 L 18 15 L 30 5" stroke="#2958e8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="jewel-plate cobalt">
                        <ArrowDownRight size={15} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)' }}>Setoran</span>
                    </div>
                    <InfoButton
                      size={13}
                      onClick={() => setDetailModal({
                        title: 'Setoran',
                        formula: 'Σ Uang setoran diterima pada periode ini',
                        rows: [
                          { label: 'Frekuensi', value: `${ringkasanData.depositsCount} kali` },
                          { label: 'Total diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.depositsTotal)}`, isHighlight: true },
                        ],
                        note: 'Akumulasi uang setoran kas toko yang sudah diterima pemilik.',
                      })}
                      label="Rincian Setoran"
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <strong style={{ fontSize: '15px', fontWeight: 900, color: 'var(--blue)', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      Rp {new Intl.NumberFormat('id-ID').format(ringkasanData.depositsTotal)}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      {ringkasanData.depositsCount} kali setor
                    </span>
                  </div>
                </div>

                {/* Kiri Bawah: Pengeluaran */}
                <div className="form-card" style={{ padding: '12px', minHeight: '86px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0, position: 'relative', overflow: 'hidden' }}>
                  {/* Subtle Expense Wave Watermark */}
                  <svg width="40" height="20" viewBox="0 0 40 20" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.15, pointerEvents: 'none' }}>
                    <path d="M 4 14 L 15 8 L 26 12 L 36 5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="jewel-plate ruby">
                        <ArrowUpRight size={15} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)' }}>Pengeluaran</span>
                    </div>
                    <InfoButton
                      size={13}
                      onClick={() => setDetailModal({
                        title: 'Pengeluaran Toko',
                        formula: 'Total biaya operasional toko dalam periode ini',
                        rows: [
                          { label: 'Total biaya', value: `Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.expensesTotal)}`, isHighlight: true },
                        ],
                        note: 'Biaya operasional toko yang dicatat.',
                      })}
                      label="Rincian Pengeluaran"
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <strong style={{ fontSize: '15px', fontWeight: 900, color: 'var(--red)', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      -Rp {new Intl.NumberFormat('id-ID').format(ringkasanData.expensesTotal)}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      Operasional toko
                    </span>
                  </div>
                </div>

                {/* Kanan Bawah: Pemasukan Lain */}
                <div className="form-card" style={{ padding: '12px', minHeight: '86px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0, position: 'relative', overflow: 'hidden' }}>
                  {/* Subtle Shimmer Starburst Watermark */}
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ position: 'absolute', right: '10px', bottom: '6px', opacity: 0.16, pointerEvents: 'none' }}>
                    <path d="M 14 2 L 17 11 L 26 14 L 17 17 L 14 26 L 11 17 L 2 14 L 11 11 Z" fill="#059669" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="jewel-plate emerald">
                        <Sparkles size={15} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)' }}>Pemasukan Lain</span>
                    </div>
                    <InfoButton
                      size={13}
                      onClick={() => setDetailModal({
                        title: 'Pemasukan Lain',
                        formula: 'Σ (nominal × jumlah kali)',
                        rows: [
                          { label: 'Total pemasukan lain', value: `Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.otherIncomeTotal)}`, isHighlight: true },
                        ],
                        note: 'Pemasukan tambahan seperti jasa seduh mie atau titipan barang.',
                      })}
                      label="Rincian Pemasukan Lain"
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <strong style={{ fontSize: '15px', fontWeight: 900, color: 'var(--green)', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      +Rp {new Intl.NumberFormat('id-ID').format(ringkasanData.otherIncomeTotal)}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      Jasa & komisi
                    </span>
                  </div>
                </div>
              </div>

              {/* Untung Bersih: Net Yield Vault Bar */}
              <div
                className="form-card"
                style={{
                  minHeight: '68px',
                  margin: '0 0 10px 0',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '2px solid var(--ink)',
                  background: ringkasanData.untungBersih.min >= 0 ? '#eafbe3' : '#fff5f5',
                  boxShadow: '0 3px 0 var(--ink)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle Diamond Geometric Watermark */}
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ position: 'absolute', right: '12px', top: '8px', opacity: 0.08, pointerEvents: 'none' }}>
                  <polygon points="26,2 50,26 26,50 2,26" stroke="currentColor" strokeWidth="2" />
                  <polygon points="26,8 44,26 26,44 8,26" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9px',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color: ringkasanData.untungBersih.min >= 0 ? '#166534' : '#991b1b',
                    marginBottom: '2px',
                    textTransform: 'uppercase',
                  }}>
                    ✦ NET YIELD TOKO
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '14px', fontWeight: 900 }}>Untung Bersih</strong>
                    <InfoButton
                      size={14}
                      onClick={() => setDetailModal({
                        title: 'Untung Bersih',
                        formula: 'Untung kotor − pengeluaran + pemasukan lain',
                        rows: [
                          { label: 'Untung kotor', value: `+Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.untungKotor.min)}` },
                          { label: 'Pengeluaran', value: `-Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.expensesTotal)}`, isNegative: true },
                          { label: 'Pemasukan lain', value: `+Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.otherIncomeTotal)}` },
                          { label: 'Untung bersih', value: `Rp ${new Intl.NumberFormat('id-ID').format(ringkasanData.untungBersih.min)}`, isHighlight: true },
                        ],
                        note: 'Sudah termasuk modal barang.',
                      })}
                      label="Rincian Untung Bersih"
                    />
                  </div>
                </div>
                <strong style={{
                  fontSize: '18px',
                  fontWeight: 950,
                  fontVariantNumeric: 'tabular-nums',
                  color: ringkasanData.untungBersih.min >= 0 ? '#15803d' : 'var(--red)',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  Rp {new Intl.NumberFormat('id-ID').format(ringkasanData.untungBersih.min)}
                </strong>
              </div>

              {/* Executive Quick Actions Hub (4 Pilar Kasir) */}
              <div className="executive-quick-actions">
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setCurrentScreen('catat')}
                  title="Catat Belanja Barang"
                >
                  <div className="jewel-plate amber" style={{ width: '34px', height: '34px', borderRadius: '11px' }}>
                    <ShoppingCart size={17} />
                  </div>
                  <span>+ Belanja</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setCurrentScreen('stok')}
                  title="Cek Sisa Stok Barang"
                >
                  <div className="jewel-plate emerald" style={{ width: '34px', height: '34px', borderRadius: '11px' }}>
                    <Boxes size={17} />
                  </div>
                  <span>Cek Stok</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setCurrentScreen('setoran')}
                  title="Setoran Kasir ke Pemilik"
                >
                  <div className="jewel-plate cobalt" style={{ width: '34px', height: '34px', borderRadius: '11px' }}>
                    <ArrowLeftRight size={17} />
                  </div>
                  <span>Setoran</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setCurrentScreen('biaya')}
                  title="Catat Biaya Operasional Toko"
                >
                  <div className="jewel-plate ruby" style={{ width: '34px', height: '34px', borderRadius: '11px' }}>
                    <Wallet size={17} />
                  </div>
                  <span>Biaya Toko</span>
                </button>
              </div>

              {/* Horology Chronometer Capsule (Periode Berjalan) */}
              <div
                className="chronometer-capsule"
                role="button"
                tabIndex={0}
                onClick={() => setShowTimelineSheet(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Bespoke Horology Timepiece Dial */}
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="17" cy="17" r="15" fill="#20211F" stroke="#373936" strokeWidth="1.5" />
                    <circle cx="17" cy="17" r="12" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" strokeDasharray="1.5 2" />
                    <line x1="17" y1="5" x2="17" y2="7" stroke="#D7FA4A" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="17" y1="27" x2="17" y2="29" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
                    <line x1="5" y1="17" x2="7" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
                    <line x1="27" y1="17" x2="29" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
                    <line x1="17" y1="17" x2="17" y2="9" stroke="#FF5A1F" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="17" y1="17" x2="22" y2="17" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="17" cy="17" r="2" fill="#D7FA4A" />
                  </svg>
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block', fontWeight: 900 }}>
                      Sesi Kasir: {currentPeriodData.items.length} aktivitas
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      Sejak {currentPeriodData.lastDeposit ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(currentPeriodData.lastDeposit.occurredAt)) : 'awal buka toko'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--blue)' }}>
                  Garis waktu audit →
                </span>
              </div>

              {/* Aktivitas Kasir Terbaru (Executive Ledger Feed) */}
              <div className="form-card" style={{ margin: 0, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '14px', borderRadius: '2px', background: 'var(--orange)' }} />
                    <strong style={{ fontSize: '13px', fontWeight: 900 }}>Aktivitas Kasir Terbaru</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setCurrentScreen('riwayat')}
                    style={{ minHeight: '28px', padding: '2px 8px', fontSize: '11px', fontWeight: 800 }}
                  >
                    Lihat semua ({allHistoryItems.length}) →
                  </button>
                </div>

                {allHistoryItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 8px', opacity: 0.35 }}>
                      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                      <rect x="12" y="14" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="20" cy="20" r="2" fill="currentColor" />
                    </svg>
                    <div style={{ fontSize: '12px', fontWeight: 800 }}>Belum ada aktivitas kasir</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>Aktivitas belanja, stok, dan setoran akan tampil di sini.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {allHistoryItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="ledger-row-luxury"
                        onClick={() => setDetailModal({
                          title: item.detailTitle,
                          formula: item.detailFormula || '',
                          rows: item.detailRows,
                          note: item.detailNote,
                          deleteAction: item.recordType && item.rawId ? () => handleDeleteRecord(item.recordType, item.rawId) : undefined,
                          deleteLabel: 'Hapus Catatan Ini',
                        })}
                        role="button"
                        tabIndex={0}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, marginRight: '8px' }}>
                          <div className={`jewel-plate ${
                            item.type === 'belanja' ? 'amber' :
                            item.type === 'cek stok' ? 'emerald' :
                            item.type === 'setoran' ? 'cobalt' :
                            item.type === 'jasa' ? 'purple' :
                            item.type === 'biaya' ? 'ruby' : 'cobalt'
                          }`} style={{ width: '34px', height: '34px', borderRadius: '10px' }}>
                            {item.type === 'belanja' && <ShoppingCart size={16} />}
                            {item.type === 'cek stok' && <Boxes size={16} />}
                            {item.type === 'setoran' && <ArrowLeftRight size={16} />}
                            {item.type === 'jasa' && <Sparkles size={16} />}
                            {item.type === 'biaya' && <Wallet size={16} />}
                            {item.type !== 'belanja' && item.type !== 'cek stok' && item.type !== 'setoran' && item.type !== 'jasa' && item.type !== 'biaya' && <FileText size={16} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: item.type === 'belanja' ? '#ffebe6' : item.type === 'cek stok' ? '#eafbe3' : item.type === 'setoran' ? '#e8f0fe' : item.type === 'jasa' ? '#f3e8ff' : item.type === 'rusak' ? '#ffebe6' : '#f4f4f5',
                                color: 'var(--ink)',
                              }}>
                                {item.typeLabel}
                              </span>
                              {item.isSample && (
                                <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: '#fef3c7', color: '#b45309' }}>
                                  Contoh
                                </span>
                              )}
                              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                {formatRelativeTime(item.time)}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              {item.summary}
                            </div>
                          </div>
                        </div>
                        <strong style={{
                          fontSize: '13px',
                          fontWeight: 950,
                          fontVariantNumeric: 'tabular-nums',
                          color: item.nominalText.startsWith('+') ? 'var(--green)' : item.nominalText.startsWith('-') ? 'var(--red)' : 'var(--ink)',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.nominalText}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* SCREEN 2: CATAT BELANJA                                  */}
        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* SCREEN 2: CATAT BELANJA (INLINE CARD FORM + KERANJANG)   */}
        {/* ======================================================== */}
        {currentScreen === 'catat' && (
          <div style={{ paddingBottom: purchaseCart.length > 0 ? '72px' : '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>Pilih barang ({catalogList.length})</h2>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowAddProductModal(true)}
                style={{ minHeight: '34px', fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Produk Baru</span>
              </button>
            </div>

            {/* Search Bar with Sort Button */}
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
                aria-label="Urutkan barang"
                onClick={() => setCatatSort(prev => prev === 'terbaru' ? 'alphabetical' : 'terbaru')}
                title={catatSort === 'terbaru' ? 'Urutkan A–Z' : 'Urutkan Terbaru'}
                style={{ background: catatSort === 'alphabetical' ? 'var(--amber-pale)' : undefined }}
              >
                <ArrowUpDown size={18} />
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

            {/* Product Selection List with Inline Card Expansion */}
            <div className="product-select-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {catalogList
                .filter((p) => {
                  const matchCat = catatCategory === 'Semua' || p.category === catatCategory;
                  const matchQuery = p.name.toLowerCase().includes(catatSearch.toLowerCase());
                  return matchCat && matchQuery;
                })
                .sort((a, b) => {
                  if (catatSort === 'alphabetical') return a.name.localeCompare(b.name);
                  return 0;
                })
                .map((item) => {
                  const isOpened = openedCardId === item.id;
                  const cartItem = purchaseCart.find((c) => c.productId === item.id);
                  const isKemasan = isOpened ? cardDraftUnit !== 'pcs' : true;
                  const packUnitName = item.unit.split(' ')[0] || item.unit;
                  const piecesToAdd = isKemasan ? cardDraftQty * item.packSize : cardDraftQty;
                  const oldModalPerPcs = getProductLatestUnitCost(item.id, docPayload, catalogList);
                  const totalCost = parseRupiahInput(cardDraftCostStr);
                  const newModalPerPcs = piecesToAdd > 0 && totalCost > 0 ? Math.round(totalCost / piecesToAdd) : (oldModalPerPcs || 0);
                  const isModalNaik = oldModalPerPcs !== null && totalCost > 0 && newModalPerPcs > oldModalPerPcs;
                  const modalDiff = isModalNaik ? newModalPerPcs - oldModalPerPcs : 0;
                  const grossPotential = piecesToAdd * item.sellingPricePerUnit;
                  const netPotential = totalCost > 0 ? (grossPotential - totalCost) : null;

                  if (!isOpened) {
                    // KEADAAN TERTUTUP (Tinggi 64px)
                    return (
                      <div
                        id={`prod-card-${item.id}`}
                        key={item.id}
                        className="product-select-card"
                        onClick={() => handleOpenProductCard(item)}
                        role="button"
                        tabIndex={0}
                        style={{
                          minHeight: '64px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          border: cartItem ? '2px solid var(--ink)' : '1.5px solid var(--line)',
                          borderRadius: '12px',
                          background: cartItem ? '#fff' : 'var(--paper)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <div className="product-thumb-image" style={{ width: '38px', height: '38px', fontSize: '20px' }} aria-hidden="true">
                            {item.icon}
                          </div>
                          <div className="product-info-text" style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong className="product-info-name" style={{ fontSize: '13px' }}>{item.name}</strong>
                              {item.isSample && (
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                                  Contoh
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                {item.unit} · Rp{new Intl.NumberFormat('id-ID').format(item.costPerPack || (oldModalPerPcs ? oldModalPerPcs * item.packSize : 0))}
                              </span>
                              {cartItem && (
                                <span style={{ fontSize: '10px', fontWeight: 800, background: '#eafbe3', color: '#1a7f37', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                                  ×{cartItem.qty} {cartItem.unit === 'pcs' ? 'Pcs' : packUnitName} · Rp{new Intl.NumberFormat('id-ID').format(cartItem.totalCost)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Ubah ${item.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProductCard(item);
                          }}
                          style={{
                            width: '44px',
                            height: '44px',
                            display: 'grid',
                            placeItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    );
                  }

                  // KEADAAN TERBUKA (Tinggi menyesuaikan, border oranye 2px)
                  return (
                    <div
                      id={`prod-card-${item.id}`}
                      key={item.id}
                      style={{
                        border: '2px solid var(--orange)',
                        borderRadius: '12px',
                        background: '#fff',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(255, 90, 31, 0.12)',
                      }}
                    >
                      {/* Header Kartu Terbuka */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '22px' }}>{item.icon}</span>
                          <div>
                            <strong style={{ fontSize: '14px', display: 'block' }}>{item.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              Jual: Rp{new Intl.NumberFormat('id-ID').format(item.sellingPricePerUnit)}/pcs
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenedCardId(null)}
                          aria-label="Tutup kartu"
                          style={{
                            width: '44px',
                            height: '44px',
                            display: 'grid',
                            placeItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 900,
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* 1. Baris Jumlah: label "Jumlah", stepper [-] [input 72px] [+] */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800 }}>Jumlah</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => handleCardQtyChange(cardDraftQty - 1, item)}
                            aria-label="Kurangi jumlah"
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardDraftQty}
                            onChange={(e) => {
                              const val = Number(e.target.value.replace(/\D/g, '')) || 1;
                              handleCardQtyChange(val, item);
                            }}
                            style={{
                              width: '72px',
                              height: '44px',
                              border: '1.5px solid var(--ink)',
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontSize: '15px',
                              fontWeight: 900,
                              background: '#fff',
                            }}
                          />
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => handleCardQtyChange(cardDraftQty + 1, item)}
                            aria-label="Tambah jumlah"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {cardValidationError === 'Isi jumlah' && (
                        <span style={{ color: 'var(--red)', fontSize: '11px', fontWeight: 800, marginTop: '-6px' }}>
                          Isi jumlah
                        </span>
                      )}

                      {/* 2. Baris Satuan: label "Satuan", chip kemasan & chip "Pcs" */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800 }}>Satuan</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className={`filter-chip ${cardDraftUnit === 'kemasan' ? 'active' : ''}`}
                            onClick={() => handleCardUnitChange('kemasan', item)}
                            style={{ minHeight: '38px', minWidth: '44px', padding: '4px 12px' }}
                          >
                            {packUnitName}
                          </button>
                          <button
                            type="button"
                            className={`filter-chip ${cardDraftUnit === 'pcs' ? 'active' : ''}`}
                            onClick={() => handleCardUnitChange('pcs', item)}
                            style={{ minHeight: '38px', minWidth: '44px', padding: '4px 12px' }}
                          >
                            Pcs
                          </button>
                        </div>
                      </div>

                      {/* 3. Baris Total nota: label "Total nota", input rupiah */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 800 }}>Total nota</label>
                          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Awalan Rp</span>
                        </div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '12px', fontWeight: 900, fontSize: '13px', color: 'var(--ink)' }}>
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="field-input"
                            style={{ width: '100%', paddingLeft: '38px', fontSize: '14px', fontWeight: 800 }}
                            placeholder="Contoh: 240.000"
                            value={formatRupiahInput(cardDraftCostStr)}
                            onChange={(e) => {
                              setCardDraftCostStr(e.target.value);
                              setCardValidationError(null);
                            }}
                          />
                        </div>
                        {cardValidationError === 'Isi total nota' && (
                          <span style={{ color: 'var(--red)', fontSize: '11px', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                            Isi total nota
                          </span>
                        )}
                      </div>

                      {/* 4. Baris Sumber uang: chip "Untung toko" dan "Uang pribadi" */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800 }}>Sumber uang</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className={`filter-chip ${cardDraftSourceMoney === 'SETORAN' ? 'active' : ''}`}
                            onClick={() => setCardDraftSourceMoney('SETORAN')}
                            style={{ minHeight: '38px', padding: '4px 10px', fontSize: '11px' }}
                          >
                            Untung toko
                          </button>
                          <button
                            type="button"
                            className={`filter-chip ${cardDraftSourceMoney === 'PRIBADI' ? 'active' : ''}`}
                            onClick={() => setCardDraftSourceMoney('PRIBADI')}
                            style={{ minHeight: '38px', padding: '4px 10px', fontSize: '11px' }}
                          >
                            Uang pribadi
                          </button>
                        </div>
                      </div>

                      {/* 5. Baris Hasil: "+48 pcs · modal Rp5.000/pcs" + chip merah naik jika ada + ⓘ */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f4f4f5',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--ink)' }}>
                            +{piecesToAdd} pcs · modal Rp{new Intl.NumberFormat('id-ID').format(newModalPerPcs)}/pcs
                          </strong>
                          {isModalNaik && (
                            <span style={{
                              background: '#ffebe6',
                              color: 'var(--red)',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #ffd0c4',
                            }}>
                              Naik Rp{new Intl.NumberFormat('id-ID').format(modalDiff)}/pcs
                            </span>
                          )}
                        </div>
                        <InfoButton
                          size={15}
                          onClick={() => setDetailModal({
                            title: `Rincian Belanja: ${item.name}`,
                            formula: 'Modal per pcs = Total nota ÷ pcs masuk',
                            rows: [
                              { label: 'Jumlah masuk', value: `${cardDraftQty} ${isKemasan ? packUnitName : 'pcs'} (+${piecesToAdd} pcs)` },
                              { label: 'Total nota', value: `Rp ${new Intl.NumberFormat('id-ID').format(totalCost)}`, isHighlight: true },
                              { label: 'Modal baru per pcs', value: `Rp ${new Intl.NumberFormat('id-ID').format(newModalPerPcs)}/pcs` },
                              { label: 'Jika habis terjual', value: `Rp ${new Intl.NumberFormat('id-ID').format(grossPotential)}` },
                              { label: 'Potensi untung', value: netPotential !== null ? `Rp ${new Intl.NumberFormat('id-ID').format(netPotential)}` : '—', isHighlight: true },
                            ],
                            note: 'Modal per pcs terbaru ini akan langsung menggantikan modal lama untuk perhitungan modal barang terjual.',
                          })}
                          label="Rincian belanja barang"
                        />
                      </div>

                      {/* 6. Tombol Aksi: Tambah ke keranjang ATAU Ubah + Hapus */}
                      {cartItem ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleAddOrUpdateCart(item)}
                            style={{ height: '48px', fontWeight: 900 }}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            className="btn btn-paper"
                            onClick={() => handleRemoveFromCart(item.id)}
                            style={{ height: '48px', fontWeight: 900, color: 'var(--red)', borderColor: '#ffd0c4' }}
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleAddOrUpdateCart(item)}
                          style={{ height: '48px', width: '100%', fontWeight: 900, marginTop: '2px' }}
                        >
                          Tambah ke keranjang
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: CEK SISA STOK                                  */}
        {/* ======================================================== */}
        {currentScreen === 'stok' && (
          <div>
            {/* Search Bar (Fluted Luxury Capsule) */}
            <div className="search-wrapper" style={{ marginTop: '4px' }}>
              <div className="search-input-box" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.96)', border: '1.5px solid var(--ink)', boxShadow: '0 2px 0 var(--ink)' }}>
                <Search className="search-icon" size={17} style={{ color: 'var(--ink)' }} />
                <input
                  type="text"
                  placeholder="Cari barang atau kategori..."
                  value={stokSearch}
                  onChange={(e) => setStokSearch(e.target.value)}
                  aria-label="Cari barang stok"
                  style={{ fontSize: '13px', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Category Chips (Jeweled Rail) */}
            <div className="category-chips-row" style={{ marginTop: '10px', marginBottom: '12px' }}>
              {['Semua', 'Makanan', 'Minuman', 'Rokok', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip ${stokCategory === cat ? 'active' : ''}`}
                  onClick={() => setStokCategory(cat)}
                  style={{ minHeight: '34px', fontSize: '12px', fontWeight: 750, padding: '4px 12px' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Pro Merchant Audit Header & Progress Strip (Item 1) */}
            {(() => {
              const checkedCount = Object.values(stockCounts).filter(v => v !== null).length;
              const totalCount = catalogList.length;
              const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

              return (
                <div className="audit-status-strip">
                  <div className="audit-strip-header">
                    <div className="audit-strip-badge">
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pct === 100 ? '#059669' : '#FF5A1F' }} />
                      <span>Audit Fisik Toko · Sakala Register</span>
                    </div>
                    <div className="audit-strip-metric">
                      <strong>{checkedCount}</strong>
                      <span style={{ opacity: 0.5, fontSize: '11px' }}> / {totalCount} item ({pct}%)</span>
                    </div>
                  </div>
                  <div className="audit-laser-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Kemajuan audit ${pct}%`}>
                    <div className="audit-laser-bar" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* Stock List with Machined Cards or Minimalist Empty State (Item 4) */}
            {(() => {
              const filteredCatalog = catalogList.filter((item) => {
                const matchCat = stokCategory === 'Semua' || item.category === stokCategory;
                const matchSearch = item.name.toLowerCase().includes(stokSearch.toLowerCase());
                return matchCat && matchSearch;
              });

              if (filteredCatalog.length === 0) {
                return (
                  <div className="stock-empty-state">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                      <rect x="8" y="10" width="32" height="30" rx="4" />
                      <line x1="16" y1="18" x2="32" y2="18" />
                      <line x1="16" y1="24" x2="26" y2="24" />
                      <circle cx="28" cy="30" r="4" stroke="#FF5A1F" strokeWidth="1.8" />
                      <line x1="31" y1="33" x2="35" y2="37" stroke="#FF5A1F" strokeWidth="1.8" />
                    </svg>
                    <div style={{ fontSize: '13px', fontWeight: 850, color: 'var(--ink)' }}>Barang Tidak Ditemukan</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', maxWidth: '240px', lineHeight: 1.4 }}>
                      Tidak ada barang yang cocok dengan kata kunci atau filter terpilih.
                    </div>
                    <button
                      type="button"
                      className="btn btn-paper"
                      onClick={() => { setStokSearch(''); setStokCategory('Semua'); }}
                      style={{ minHeight: '34px', fontSize: '11px', fontWeight: 800, padding: '4px 12px', marginTop: '4px' }}
                    >
                      Reset Filter Pencarian
                    </button>
                  </div>
                );
              }

              return (
                <div className="stock-check-list">
                  {filteredCatalog.map((item) => {
                    const currentAvailable = storeSummary.stockByProduct.get(item.id)?.availableUnits ?? 0;
                    const count = stockCounts[item.id];
                    const isFilled = count !== null && count !== undefined;
                    let previewSold = 0;
                    let previewRevenue = 0;
                    let previewGrossProfit: number | null = null;

                    if (isFilled) {
                      const numCount = Number(count);
                      if (numCount < currentAvailable) {
                        previewSold = currentAvailable - numCount;
                        previewRevenue = previewSold * item.sellingPricePerUnit;
                        const unitCost = item.costPerPack !== null && item.packSize > 0
                          ? Math.floor(item.costPerPack / item.packSize)
                          : null;
                        if (unitCost !== null) {
                          previewGrossProfit = previewRevenue - (previewSold * unitCost);
                        }
                      }
                    }

                    const hasStock = hasRecordedStock(item.id);
                    const isStokAwal = !hasStock;
                    const isCheckedToday = checkedTodayIds.has(item.id);
                    const physicalVal = isFilled ? Number(count) : (isStokAwal ? 0 : currentAvailable);
                    const soldVal = isStokAwal ? 0 : Math.max(0, currentAvailable - physicalVal);

                    return (
                      <div key={item.id} className="stock-check-card">
                        {/* TIER 1: Header Row (Identitas Produk) */}
                        <div className="stock-card-header">
                          <div className="stock-card-identity">
                            <div className="product-medallion product-thumb-image" aria-hidden="true">
                              {item.icon}
                            </div>
                            <div className="stock-card-meta">
                              <div className="stock-card-title-row">
                                <span className="stock-product-name">{item.name}</span>
                                {isCheckedToday && (
                                  <span className="verified-seal" title="Sudah dicek hari ini" aria-label="Sudah dicek hari ini">
                                    <Check size={10} strokeWidth={3} />
                                    <span>Dicek</span>
                                  </span>
                                )}
                              </div>
                              <div className="stock-product-specs">
                                <span>{item.category || 'Toko'}</span>
                                <span style={{ opacity: 0.4 }}>·</span>
                                <span className="stock-unit-price">
                                  Rp {new Intl.NumberFormat('id-ID').format(item.sellingPricePerUnit)} / pcs
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hairline Ledger Divider */}
                        <div className="stock-card-divider" />

                        {/* TIER 2: Audit Control Deck (Hasil Ledger di Kiri & Stepper di Kanan) */}
                        <div className="stock-card-deck">
                          {/* Left Zone: Live Yield & Audit Status (Lega & Bebas Bentrok) */}
                          <div className="stock-yield-zone">
                            {isStokAwal ? (
                              <div>
                                <div className="yield-kicker-row">
                                  <span className="yield-kicker">Stok Awal Fisik</span>
                                </div>
                                <div className="yield-readout">
                                  <span className="yield-val muted">Baseline pertama</span>
                                  <InfoButton
                                    size={12}
                                    onClick={() => setDetailModal({
                                      title: `Stok Awal — ${item.name}`,
                                      formula: 'Stok awal baseline (penjualan dihitung pada cek berikutnya)',
                                      rows: [
                                        { label: 'Status barang', value: 'Stok awal fisik' },
                                        { label: 'Sisa fisik diinput', value: `${isFilled ? count : 0} pcs`, isHighlight: true },
                                        { label: 'Terjual dihitung', value: '0 pcs (mulai cek berikutnya)' },
                                      ],
                                      note: 'Pencatatan fisik pertama ini menjadi baseline stok awal. Tidak ada penjualan yang dihitung sekarang.',
                                    })}
                                    label={`Rincian stok ${item.name}`}
                                  />
                                </div>
                              </div>
                            ) : isFilled && previewSold > 0 ? (
                              <div>
                                <div className="yield-kicker-row">
                                  <span className="yield-pulse-indicator" />
                                  <span className="yield-kicker sold">Terjual Dihitung</span>
                                </div>
                                <div className="yield-readout">
                                  <strong className="yield-val sold tabular-nums">{previewSold} pcs</strong>
                                  <span style={{ opacity: 0.4, fontSize: '11px' }}>·</span>
                                  <span className="yield-money tabular-nums">
                                    Rp {new Intl.NumberFormat('id-ID').format(previewRevenue)}
                                  </span>
                                  <InfoButton
                                    size={12}
                                    onClick={() => setDetailModal({
                                      title: `Cek Sisa — ${item.name}`,
                                      formula: 'Terjual = Catatan − Sisa fisik',
                                      rows: [
                                        { label: 'Catatan stok', value: `${currentAvailable} pcs` },
                                        { label: 'Sisa fisik diinput', value: `${physicalVal} pcs` },
                                        { label: 'Terjual', value: `${soldVal} pcs`, isHighlight: true },
                                        { label: 'Penjualan', value: `Rp ${new Intl.NumberFormat('id-ID').format(soldVal * item.sellingPricePerUnit)}` },
                                      ],
                                      note: `Menghasilkan estimasi penjualan Rp ${new Intl.NumberFormat('id-ID').format(soldVal * item.sellingPricePerUnit)}.`,
                                    })}
                                    label={`Rincian stok ${item.name}`}
                                  />
                                </div>
                              </div>
                            ) : isFilled && Number(count) > currentAvailable ? (
                              <div>
                                <div className="yield-kicker-row">
                                  <span className="yield-kicker warn">Stok Fisik Lebih</span>
                                </div>
                                <div className="yield-readout">
                                  <strong className="yield-val warn tabular-nums">
                                    +{Number(count) - currentAvailable} pcs
                                  </strong>
                                  <InfoButton
                                    size={12}
                                    onClick={() => setDetailModal({
                                      title: `Stok Lebih — ${item.name}`,
                                      formula: 'Fisik > Catatan sistem (barang masuk belum tercatat / salah hitung)',
                                      rows: [
                                        { label: 'Catatan stok', value: `${currentAvailable} pcs` },
                                        { label: 'Sisa fisik diinput', value: `${physicalVal} pcs` },
                                        { label: 'Selisih lebih', value: `+${Number(count) - currentAvailable} pcs`, isHighlight: true },
                                      ],
                                      note: 'Stok fisik melebihi catatan. Tidak ada penjualan yang dihitung.',
                                    })}
                                    label={`Rincian stok ${item.name}`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="yield-kicker-row">
                                  <span className="yield-kicker">Catatan Stok</span>
                                </div>
                                <div className="yield-readout">
                                  <span className="yield-val base tabular-nums">{currentAvailable} pcs</span>
                                  <InfoButton
                                    size={12}
                                    onClick={() => setDetailModal({
                                      title: `Catatan Stok — ${item.name}`,
                                      formula: 'Belum ada perubahan sisa fisik',
                                      rows: [
                                        { label: 'Catatan stok', value: `${currentAvailable} pcs`, isHighlight: true },
                                        { label: 'Harga jual satuan', value: `Rp ${new Intl.NumberFormat('id-ID').format(item.sellingPricePerUnit)}` },
                                      ],
                                      note: 'Tekan tombol minus atau isi sisa fisik jika ada barang yang laku terjual.',
                                    })}
                                    label={`Rincian stok ${item.name}`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Zone: Machined Stepper Capsule */}
                          <div className="stepper-capsule stepper-control">
                            <button
                              type="button"
                              className="stepper-capsule-btn minus stepper-btn"
                              aria-label={`Kurangi ${item.name}`}
                              onClick={() => {
                                setStockCounts(prev => ({
                                  ...prev,
                                  [item.id]: Math.max(0, (prev[item.id] ?? (isStokAwal ? 0 : currentAvailable)) - 1)
                                }));
                              }}
                            >
                              −
                            </button>
                            <input
                              type="text"
                              className="stepper-capsule-input stepper-input"
                              aria-label={`Sisa fisik ${item.name}`}
                              value={isFilled ? count : (isStokAwal ? '' : currentAvailable)}
                              placeholder={isStokAwal ? '0' : String(currentAvailable)}
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                if (val === '') {
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
                              className="stepper-capsule-btn plus stepper-btn"
                              aria-label={`Tambah ${item.name}`}
                              onClick={() => {
                                setStockCounts(prev => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] ?? (isStokAwal ? 0 : currentAvailable)) + 1
                                }));
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Input Terjual saat diskon dengan Perforated Ticket Dash (Item 2) */}
                        {(() => {
                          if (!item.discountDay || !item.discountPerUnit) return null;
                          const prodChecks = (docPayload.stockMovements || [])
                            .filter(m => m.productId === item.id && m.type === 'CHECK_ADJUSTMENT')
                            .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
                          const prevCheckTime = prodChecks[0]?.occurredAt || (docPayload.purchaseRecords || []).filter(pr => pr.productId === item.id)[0]?.occurredAt || new Date(Date.now() - 86400000).toISOString();
                          const crossedDiscountDay = hasDayInInterval(prevCheckTime, new Date().toISOString(), item.discountDay);

                          if (!crossedDiscountDay) return null;

                          return (
                            <div className="perforated-ticket-row">
                              <span style={{ fontSize: '11px', color: 'var(--ink)', fontWeight: 650 }}>
                                Terjual saat diskon Hari {item.discountDay} <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(−Rp {new Intl.NumberFormat('id-ID').format(item.discountPerUnit)}/pcs)</span>
                              </span>
                              <input
                                type="number"
                                min="0"
                                className="stepper-input"
                                style={{ width: '64px', height: '34px', textAlign: 'center', fontSize: '13px', borderRadius: '10px', border: '1.5px solid var(--ink)' }}
                                placeholder="0"
                                aria-label={`Terjual saat diskon ${item.name}`}
                                value={discountCounts[item.id] !== undefined && discountCounts[item.id] !== null ? discountCounts[item.id]! : ''}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  setDiscountCounts(prev => ({
                                    ...prev,
                                    [item.id]: val === '' ? null : Math.max(0, parseInt(val, 10) || 0)
                                  }));
                                }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Extended Floating Action Button (Opsi 1 - Tren 2026 Pro Merchant) */}
            {(() => {
              const checkedCount = Object.values(stockCounts).filter(v => v !== null).length;
              const totalCount = catalogList.length;
              const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
              const radius = 13;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (pct / 100) * circumference;

              return (
                <div className="stock-fab-container">
                  <button
                    type="button"
                    className="stock-extended-fab"
                    onClick={handleSaveStockCheck}
                    aria-label={`Hitung Penjualan. ${checkedCount} dari ${totalCount} item telah diperiksa.`}
                  >
                    <div className="fab-gauge-disc">
                      <svg className="fab-gauge-svg" viewBox="0 0 36 36">
                        <circle
                          className="fab-gauge-bg"
                          cx="18"
                          cy="18"
                          r={radius}
                          fill="none"
                          strokeWidth="2.8"
                        />
                        <circle
                          className="fab-gauge-indicator"
                          cx="18"
                          cy="18"
                          r={radius}
                          fill="none"
                          strokeWidth="2.8"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        />
                      </svg>
                      <span className="fab-gauge-pct">{pct}%</span>
                    </div>

                    <div className="fab-text-wrap">
                      <span className="fab-text-title">Hitung Penjualan</span>
                      <span className="fab-text-sub">{checkedCount} / {totalCount} TERDATA</span>
                    </div>

                    <div className="fab-arrow-plate">
                      <ArrowRight size={13} strokeWidth={2.6} />
                    </div>
                  </button>
                </div>
              );
            })()}

            {/* Fallback Sticky Bar for Accessibility & Compatibility */}
            <div className="sticky-footer-bar" aria-hidden="true" style={{ display: 'none' }}>
              <div className="sticky-footer-label">
                <span>Total item diperiksa</span>
                <strong>
                  {Object.values(stockCounts).filter(v => v !== null).length} / {catalogList.length}
                </strong>
              </div>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleSaveStockCheck}
              >
                <span>Simpan & Hitung Penjualan →</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* SCREEN 4: SETORAN KARYAWAN                               */}
        {/* ======================================================== */}
        {currentScreen === 'setoran' && (() => {
          const isCashCounted = receivedAmountInput !== null || Object.values(denominations).some(v => v > 0);
          const actualReceived = receivedAmountInput ?? 0;
          const discrepancy = actualReceived - expectedAmount;

          let statusTag = 'Menunggu hitung';
          let statusColor = 'var(--muted)';
          let statusBg = '#f4f4f5';

          if (isCashCounted) {
            if (storeSummary.certainty !== 'PASTI') {
              statusTag = `Perlu diperiksa · ${storeSummary.reviewReason || 'Periksa data'}`;
              statusColor = 'var(--orange)';
              statusBg = 'var(--amber-pale)';
            } else if (actualReceived === expectedAmount) {
              statusTag = 'Cocok';
              statusColor = 'var(--green)';
              statusBg = '#eafbe3';
            } else if (actualReceived < expectedAmount) {
              statusTag = `Kurang Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount - actualReceived)}`;
              statusColor = 'var(--red)';
              statusBg = '#ffebe6';
            } else {
              statusTag = `Lebih Rp ${new Intl.NumberFormat('id-ID').format(actualReceived - expectedAmount)}`;
              statusColor = 'var(--blue)';
              statusBg = '#e8f0fe';
            }
          }

          const totalLembar = Object.values(denominations).reduce((acc, c) => acc + c, 0);

          return (
            <div>
              {/* Warning Callout only if data has accounting uncertainty */}
              {isCashCounted && storeSummary.certainty !== 'PASTI' && (
                <div className="warning-callout" style={{ marginBottom: '12px' }}>
                  <div className="warning-callout-icon">!</div>
                  <div style={{ fontSize: '11px', lineHeight: 1.4 }}>
                    Perhatian: {storeSummary.reviewReason || 'Angka penjualan belum final'}. Cek modal/cek sisa terlebih dahulu.
                  </div>
                </div>
              )}

              {/* SINGLE MASTER SETTLEMENT SLIP (THE PRO VAULT DOCKET) */}
              <div className="master-settlement-slip">
                {/* Header bar: Clean Docket Title & Integrated Watchface Calendar Trigger */}
                <div className="slip-header-bar">
                  <div className="slip-docket-title">
                    <span className="slip-docket-dot" />
                    <span>Setoran ke-{(docPayload.deposits?.length || 0) + 1}</span>
                  </div>

                  <button
                    type="button"
                    className="slip-date-trigger"
                    onClick={() => {
                      setCustomDateInput(depositDateIso.split('T')[0] || new Date().toISOString().split('T')[0]);
                      setShowDateModal(true);
                    }}
                    title="Ubah Tanggal Setoran"
                  >
                    <Calendar size={13} color="var(--orange)" />
                    <span>{depositDate}</span>
                    {selectedDateTab !== 'HARI_INI' && <span className="slip-date-badge-modified">Kustom</span>}
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>▾</span>
                  </button>
                </div>

                {/* Dual Metric Cards Grid: Target Buku vs Hitung Fisik */}
                <div className="slip-body-grid">
                  {/* Column 1: Setoran Seharusnya */}
                  <div className="slip-metric-card">
                    <div className="slip-metric-label">
                      <span>Target Buku</span>
                      <InfoButton
                        size={11}
                        onClick={() => {
                          const breakdown = catalogList.map(item => {
                            const sold = storeSummary.stockByProduct.get(item.id)?.unitsSold || 0;
                            return {
                              name: item.name,
                              calculation: `${sold} pcs × Rp ${new Intl.NumberFormat('id-ID').format(item.sellingPricePerUnit)}`,
                              total: `Rp ${new Intl.NumberFormat('id-ID').format(sold * item.sellingPricePerUnit)}`,
                            };
                          }).filter(i => !i.total.includes('Rp 0'));

                          setDetailModal({
                            title: 'Setoran Seharusnya',
                            formula: 'Penjualan riil − Biaya dari laci',
                            rows: [
                              { label: 'Penjualan riil', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}` },
                              { label: 'Biaya laci toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}`, isNegative: true },
                              { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount)}`, isHighlight: true },
                            ],
                            note: 'Biaya dari laci kasir mengurangi uang yang wajib diserahkan karyawan.',
                            showItemsLink: breakdown.length > 0,
                            itemsBreakdown: breakdown,
                          });
                        }}
                        label="Rincian Setoran Seharusnya"
                      />
                    </div>
                    <div className="slip-target-amount tabular-nums">
                      Rp {new Intl.NumberFormat('id-ID').format(expectedAmount)}
                    </div>
                  </div>

                  {/* Column 2: Uang Fisik Diterima with Direct Tactile Input */}
                  <div className="slip-metric-card">
                    <div className="slip-metric-label">
                      <span>Hitung Fisik</span>
                    </div>
                    <div className="slip-inline-input-box">
                      <span className="slip-inline-prefix">Rp</span>
                      <input
                        id="dep-received-amount"
                        type="text"
                        inputMode="numeric"
                        className="slip-inline-input"
                        placeholder="0"
                        value={receivedAmountInput !== null ? formatRupiahInput(receivedAmountInput.toString()) : ''}
                        onChange={(e) => {
                          const val = parseRupiahInput(e.target.value);
                          setReceivedAmountInput(val);
                        }}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      />
                      {receivedAmountInput !== null && receivedAmountInput > 0 && (
                        <button
                          type="button"
                          className="slip-inline-clear"
                          onClick={() => {
                            setReceivedAmountInput(null);
                            setDenominations({ 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0 });
                          }}
                          aria-label="Hapus nominal"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Consolidated Pro Utility Deck: 3 Integrated Tools */}
                <div className="slip-utility-deck">
                  <button
                    type="button"
                    className={`slip-utility-btn ${showDenominations ? 'active' : ''}`}
                    onClick={() => {
                      setShowDenominations(!showDenominations);
                      if (!showDenominations) setShowDepositNoteInput(false);
                    }}
                  >
                    <Banknote size={14} color={showDenominations ? 'var(--orange)' : 'var(--ink)'} />
                    <span>Hitung Lembar</span>
                    {totalLembar > 0 && <span className="slip-utility-count-badge">{totalLembar}</span>}
                  </button>

                  <button
                    type="button"
                    className={`slip-utility-btn ${showDepositNoteInput || depositNote ? 'active' : ''}`}
                    onClick={() => {
                      setShowDepositNoteInput(!showDepositNoteInput);
                      if (!showDepositNoteInput) setShowDenominations(false);
                    }}
                  >
                    <Pencil size={13} color={(showDepositNoteInput || depositNote) ? 'var(--orange)' : 'var(--ink)'} />
                    <span>Catatan</span>
                    {depositNote ? <span className="slip-utility-dot" /> : null}
                  </button>

                  <button
                    type="button"
                    className="slip-utility-btn"
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <Wallet size={13} color="var(--ink)" />
                    <span>Ambil Prive</span>
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>↗</span>
                  </button>
                </div>

                {/* EMBEDDED INSET DRAWER 1: Banknote Sorter */}
                {showDenominations && (
                  <div className="slip-inline-drawer">
                    <div className="cash-strap-band">
                      <div className="cash-strap-title">
                        <Banknote size={14} color="var(--ink)" />
                        <span>Pecahan Lembaran Kasir</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="cash-strap-value">
                          {totalLembar} Lbr • Rp {new Intl.NumberFormat('id-ID').format(receivedAmountInput || 0)}
                        </span>
                        {totalLembar > 0 && (
                          <button
                            type="button"
                            className="drawer-btn-close"
                            style={{ color: '#dc2626' }}
                            onClick={() => {
                              setDenominations({ 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0 });
                              setReceivedAmountInput(null);
                            }}
                          >
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          className="drawer-btn-close"
                          onClick={() => setShowDenominations(false)}
                        >
                          Tutup
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map(denom => {
                        const count = denominations[denom] || 0;
                        const subtotal = denom * count;
                        const colorClass = denom === 100000 ? 'denom-color-100k' :
                          denom === 50000 ? 'denom-color-50k' :
                          denom === 20000 ? 'denom-color-20k' :
                          denom === 10000 ? 'denom-color-10k' :
                          denom === 5000 ? 'denom-color-5k' :
                          denom === 2000 ? 'denom-color-2k' : 'denom-color-1k';

                        return (
                          <div key={denom} className="banknote-card-emisi">
                            <div className="denom-meta">
                              <span className={`denom-color-pill ${colorClass}`} />
                              <div>
                                <div className="denom-label tabular-nums">
                                  Rp {new Intl.NumberFormat('id-ID').format(denom)}
                                </div>
                                {count > 0 && (
                                  <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>
                                    {count} lbr = Rp {new Intl.NumberFormat('id-ID').format(subtotal)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="stepper-capsule stepper-control" style={{ height: '34px', zIndex: 1 }}>
                              <button
                                type="button"
                                className="stepper-capsule-btn minus stepper-btn"
                                aria-label={`Kurangi pecahan ${denom}`}
                                style={{ width: '32px', height: '34px', fontSize: '15px' }}
                                onClick={() => {
                                  const next = { ...denominations, [denom]: Math.max(0, (denominations[denom] || 0) - 1) };
                                  setDenominations(next);
                                  const total = Object.entries(next).reduce((s, [v, c]) => s + Number(v) * c, 0);
                                  setReceivedAmountInput(total);
                                }}
                              >
                                −
                              </button>
                              <span className="stepper-capsule-input" style={{ width: '36px', height: '34px', lineHeight: '34px', fontSize: '12.5px', fontWeight: 900 }}>
                                {count}
                              </span>
                              <button
                                type="button"
                                className="stepper-capsule-btn plus stepper-btn"
                                aria-label={`Tambah pecahan ${denom}`}
                                style={{ width: '32px', height: '34px', fontSize: '15px' }}
                                onClick={() => {
                                  const next = { ...denominations, [denom]: (denominations[denom] || 0) + 1 };
                                  setDenominations(next);
                                  const total = Object.entries(next).reduce((s, [v, c]) => s + Number(v) * c, 0);
                                  setReceivedAmountInput(total);
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EMBEDDED INSET DRAWER 2: Notes / Keterangan Penyerahan */}
                {(showDepositNoteInput || depositNote !== '') && (
                  <div className="slip-inline-drawer">
                    <div className="slip-drawer-header" style={{ marginBottom: '8px' }}>
                      <div className="drawer-header-left">
                        <ReceiptText size={14} color="var(--orange)" />
                        <span className="drawer-header-title">Catatan Penyerahan Kasir</span>
                      </div>
                      <button
                        type="button"
                        className="drawer-btn-close"
                        onClick={() => setShowDepositNoteInput(false)}
                      >
                        Tutup
                      </button>
                    </div>

                    {/* One-Tap Quick Chips */}
                    <div className="quick-chips-row">
                      {[
                        { label: 'Uang Pas', text: 'Uang fisik pas sesuai buku' },
                        { label: 'Nota Darurat', text: 'Ada nota darurat di laci' },
                        { label: 'Kembalian Modal', text: 'Sudah dipisah uang modal kembalian' },
                        { label: 'Selisih Tercatat', text: 'Selisih sudah dicek ulang dan disetujui' },
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          className={`quick-chip-btn ${depositNote.includes(chip.text) ? 'active' : ''}`}
                          onClick={() => {
                            if (depositNote.includes(chip.text)) {
                              setDepositNote(depositNote.replace(chip.text, '').trim());
                            } else {
                              setDepositNote(depositNote ? `${depositNote}, ${chip.text}` : chip.text);
                            }
                          }}
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      id="deposit-notes"
                      className="field-textarea"
                      rows={2}
                      placeholder="Contoh: uang kembalian kasir, ada nota darurat, dll."
                      value={depositNote}
                      onChange={(e) => setDepositNote(e.target.value)}
                      style={{ borderRadius: '10px', border: '1.25px solid var(--ink)', fontSize: '12.5px', padding: '9px 11px' }}
                    />
                  </div>
                )}

                {/* Single Consolidated Reconciliation Card */}
                <div className={`slip-reconcile-card ${!isCashCounted ? 'neutral' : actualReceived === expectedAmount ? 'match' : actualReceived < expectedAmount ? 'short' : 'over'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isCashCounted ? (
                      <span style={{ fontSize: '12px', opacity: 0.6 }}>⚪</span>
                    ) : actualReceived === expectedAmount ? (
                      <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: '#059669' }} />
                    ) : actualReceived < expectedAmount ? (
                      <AlertCircle size={16} strokeWidth={2.5} style={{ color: '#dc2626' }} />
                    ) : (
                      <Plus size={16} strokeWidth={2.5} style={{ color: '#2563eb' }} />
                    )}
                    <span>
                      {!isCashCounted
                        ? 'Masukkan nominal uang fisik kasir di atas'
                        : actualReceived === expectedAmount
                        ? 'Uang fisik Cocok Sempurna (Rp 0 selisih)'
                        : actualReceived < expectedAmount
                        ? `Selisih Kurang: Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount - actualReceived)}`
                        : `Selisih Lebih: +Rp ${new Intl.NumberFormat('id-ID').format(actualReceived - expectedAmount)}`}
                    </span>
                  </div>

                  {isCashCounted && (
                    <InfoButton
                      size={11}
                      onClick={() => setDetailModal({
                        title: 'Selisih Setoran',
                        formula: 'Uang diterima − Setoran seharusnya',
                        rows: [
                          { label: 'Uang diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(actualReceived)}` },
                          { label: 'Setoran seharusnya', value: `-Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount)}`, isNegative: true },
                          {
                            label: 'Selisih penyerahan',
                            value: `${discrepancy < 0 ? 'Kurang' : discrepancy > 0 ? 'Lebih' : 'Cocok'} Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(discrepancy))}`,
                            isHighlight: true,
                            isNegative: discrepancy < 0,
                          },
                        ],
                        note: 'Selisih disimpan apa adanya dan tidak mengubah catatan penjualan barang.',
                      })}
                      label="Rincian Selisih"
                    />
                  )}
                </div>
              </div>

              {/* PRIMARY ACTION BUTTON: Single Dominant Pro Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    fontSize: '14.5px',
                    fontWeight: 900,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(255, 90, 31, 0.35), 0 2px 0 var(--ink)',
                  }}
                  onClick={handleSaveDeposit}
                >
                  <ShieldCheck size={18} strokeWidth={2.5} />
                  <span>Simpan Setoran ke-{(docPayload.deposits?.length || 0) + 1}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: BIAYA & PEMASUKAN                      */}
        {/* ======================================================== */}
        {currentScreen === 'biaya' && (
          <div className="screen-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Segmented Switch: Biaya vs Pemasukan Lain */}
            <div className="segmented-tabs-bar" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`segmented-tab-btn ${biayaTab === 'PENGELUARAN' ? 'active' : ''}`}
                onClick={() => setBiayaTab('PENGELUARAN')}
              >
                <ReceiptText size={14} />
                <span>Biaya Operasional</span>
              </button>
              <button
                type="button"
                className={`segmented-tab-btn ${biayaTab === 'PEMASUKAN' ? 'active' : ''}`}
                onClick={() => setBiayaTab('PEMASUKAN')}
              >
                <Plus size={14} />
                <span>Pemasukan Lain</span>
              </button>
            </div>

            {biayaTab === 'PENGELUARAN' ? (
              <>
                {/* Summary Ledger Strip */}
                <div className="biaya-hero-summary" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>
                      Total Biaya Periode Ini
                    </span>
                    <strong style={{ fontSize: '18px', fontWeight: 950, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: 'var(--muted)', paddingTop: '8px', borderTop: '1px dashed rgba(32,33,31,0.12)' }}>
                    <span>Laci: <strong style={{ color: 'var(--ink)' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Pribadi: <strong style={{ color: 'var(--ink)' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal - storeSummary.expensesLaci)}</strong></span>
                  </div>
                </div>

                {/* Entry Form */}
                <div className="form-card" style={{ padding: '16px' }}>
                  <div className="field-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="b-name" className="field-label" style={{ fontWeight: 800 }}>Nama Pengeluaran</label>
                    <input
                      id="b-name"
                      type="text"
                      className="field-input"
                      placeholder="Contoh: Listrik, gas, kantong kresek"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    />
                  </div>

                  <div className="field-group" style={{ marginBottom: '14px' }}>
                    <label htmlFor="b-cost" className="field-label" style={{ fontWeight: 800 }}>Nominal (Rp)</label>
                    <input
                      id="b-cost"
                      type="text"
                      inputMode="numeric"
                      className="field-input"
                      placeholder="Rp 0"
                      value={expenseAmountStr ? `Rp ${formatRupiahInput(expenseAmountStr)}` : ''}
                      onChange={(e) => setExpenseAmountStr(formatRupiahInput(e.target.value))}
                      onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 800 }}>
                      Sumber Dana
                    </label>
                    <div className="biaya-source-grid">
                      <button
                        type="button"
                        className={`biaya-source-btn ${expenseSourceMoney === 'LACI' ? 'active' : ''}`}
                        onClick={() => setExpenseSourceMoney('LACI')}
                      >
                        <span className="biaya-source-title">
                          <span>Uang Laci Kasir</span>
                          {expenseSourceMoney === 'LACI' && <CheckCircle2 size={14} color="var(--orange)" />}
                        </span>
                        <span className="biaya-source-sub">Potong target setoran</span>
                      </button>
                      <button
                        type="button"
                        className={`biaya-source-btn ${expenseSourceMoney === 'PRIBADI' ? 'active' : ''}`}
                        onClick={() => setExpenseSourceMoney('PRIBADI')}
                      >
                        <span className="biaya-source-title">
                          <span>Uang Pribadi / Lain</span>
                          {expenseSourceMoney === 'PRIBADI' && <CheckCircle2 size={14} color="var(--orange)" />}
                        </span>
                        <span className="biaya-source-sub">Tanpa potong setoran</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveExpense}
                    style={{ minHeight: '46px', width: '100%', fontSize: '13px', fontWeight: 900 }}
                  >
                    Simpan Biaya
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Section Pemasukan Lain */}
                <div className="biaya-hero-summary">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>
                      Akumulasi Pemasukan Lain
                    </span>
                    <strong style={{ fontSize: '18px', fontWeight: 900, color: 'var(--green)' }}>
                      +Rp {new Intl.NumberFormat('id-ID').format(storeSummary.otherIncomeTotal)}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.4 }}>
                    Jasa seduh mie, titipan barang, atau komisi sampingan yang menambah Untung Bersih dan Setoran Kasir.
                  </p>
                </div>

                <div className="form-card" style={{ padding: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowOtherIncomeModal(true)}
                    style={{ minHeight: '46px', width: '100%', fontSize: '13px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Plus size={16} />
                    <span>Catat Pemasukan Baru</span>
                  </button>

                  {(docPayload.otherIncomes || []).length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(32,33,31,0.08)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 850, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                        Daftar Pemasukan Tercatat:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(docPayload.otherIncomes || []).map((inc, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fafaf8', borderRadius: '8px', border: '1px solid rgba(32,33,31,0.06)' }}>
                            <div>
                              <strong style={{ fontSize: '12px', display: 'block' }}>{inc.name}</strong>
                              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{inc.quantity} kali</span>
                            </div>
                            <strong style={{ fontSize: '12px', color: 'var(--green)' }}>
                              +Rp {new Intl.NumberFormat('id-ID').format(inc.totalAmount)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: LAPORAN KEUANGAN SEJATI                */}
        {/* ======================================================== */}
        {currentScreen === 'laporan' && (() => {
          return (
            <div className="screen-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Periode Analisis: Hari / Minggu / Bulan / Tahun */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>
                    Rentang Waktu
                  </span>
                  <button
                    type="button"
                    className="btn btn-paper"
                    style={{ minHeight: '32px', fontSize: '11.5px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 750 }}
                    onClick={() => setShowRingkasanDatePicker(true)}
                    aria-label="Pilih tanggal acuan ringkasan"
                  >
                    <Calendar size={13} color="var(--orange)" />
                    <span>{formattedAnchorDate}</span>
                  </button>
                </div>
                <div className="segmented-tabs-bar" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
                  {(['HARI', 'MINGGU', 'BULAN', 'TAHUN'] as const).map((p) => {
                    const label = p === 'HARI' ? 'Hari' : p === 'MINGGU' ? 'Minggu' : p === 'BULAN' ? 'Bulan' : 'Tahun';
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`segmented-tab-btn ${ringkasanPeriod === p ? 'active' : ''}`}
                        onClick={() => setRingkasanPeriod(p)}
                        style={{ padding: '6px 4px', fontSize: '11.5px', minHeight: '34px' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HERO DECK: 2 Executive Anchor Cards */}
              <div className="laporan-hero-deck" style={{ marginBottom: 0 }}>
                {/* Hero 1: Untung Bersih */}
                <div
                  className="laporan-hero-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailModal({
                    title: 'Untung Bersih',
                    formula: 'Untung kotor − semua pengeluaran toko + pemasukan lain',
                    rows: [
                      { label: 'Untung kotor', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}` },
                      { label: 'Biaya toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isNegative: true },
                      { label: 'Pemasukan lain', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.otherIncomeTotal)}` },
                      { label: 'Untung bersih', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih?.min ?? 0)}`, isHighlight: true },
                    ],
                  })}
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="laporan-hero-ornament" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">
                    <circle cx="65" cy="35" r="42" strokeWidth="1.2" strokeDasharray="3 3" />
                    <circle cx="65" cy="35" r="28" strokeWidth="1" />
                    <path d="M20 75 L45 50 L60 62 L85 32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="laporan-hero-top">
                    <span className="laporan-hero-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <TrendingUp size={13} color="#15803d" />
                      <span>Untung Bersih Toko</span>
                    </span>
                    <span className={`laporan-hero-badge ${storeSummary.certainty === 'PASTI' ? 'success' : 'warning'}`}>
                      {storeSummary.certainty === 'PASTI' ? 'Pasti' : 'Perlu diperiksa'}
                    </span>
                  </div>
                  <div className={`laporan-hero-val ${(storeSummary.untungBersih?.min ?? 0) >= 0 ? 'green' : ''}`}>
                    {storeSummary.untungBersih ? (
                      <>
                        {storeSummary.untungBersih.min !== storeSummary.untungBersih.max ? '≈ ' : ''}
                        Rp {new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih.min)}
                      </>
                    ) : (
                      'Belum pasti'
                    )}
                  </div>
                  <div className="laporan-hero-meta">
                    <span>Kotor: <strong>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Biaya: <strong>-Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}</strong></span>
                  </div>
                </div>

                {/* Hero 2: Uang di Tangan */}
                <div
                  className="laporan-hero-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailModal({
                    title: 'Uang di Tangan',
                    formula: 'Setoran diterima − Belanja dari setoran − Pengambilan pribadi',
                    rows: [
                      { label: 'Setoran diterima', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                      { label: 'Belanja dari setoran', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}`, isNegative: true },
                      { label: 'Pengambilan pribadi', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.ownerWithdrawalsTotal)}`, isNegative: true },
                      { label: 'Uang di tangan', value: storeSummary.isCashInHandCalculable ? `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}` : 'Belum bisa dihitung', isHighlight: true },
                    ],
                    note: storeSummary.isCashInHandCalculable ? undefined : 'Belum ada setoran kas yang diterima dari karyawan.',
                  })}
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="laporan-hero-ornament" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">
                    <rect x="25" y="25" width="58" height="42" rx="10" strokeWidth="1.5" />
                    <circle cx="62" cy="46" r="10" strokeWidth="1.5" strokeDasharray="2 2" />
                  </svg>
                  <div className="laporan-hero-top">
                    <span className="laporan-hero-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Wallet size={13} color="var(--orange)" />
                      <span>Uang Kas di Tangan</span>
                    </span>
                    <span className="laporan-hero-badge">
                      {storeSummary.depositDiscrepancy === 0 ? 'Cocok' : storeSummary.depositDiscrepancy < 0 ? 'Kurang' : 'Lebih'}
                    </span>
                  </div>
                  <div className="laporan-hero-val">
                    {storeSummary.isCashInHandCalculable ? `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}` : 'Belum dihitung'}
                  </div>
                  <div className="laporan-hero-meta">
                    <span>Setoran: <strong>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Selisih: <strong>{storeSummary.depositDiscrepancy === 0 ? 'Rp 0' : `Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(storeSummary.depositDiscrepancy))}`}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pro-hint-bar" style={{ justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Info size={12} color="var(--orange)" />
                  <span>Ketuk kartu atau baris mana saja untuk rincian rumus</span>
                </span>
              </div>

              {/* SLAB 1: Penjualan & Keuntungan */}
              <div className="laporan-group-slab">
                <div className="laporan-group-head">
                  <h3 className="laporan-group-title">1. Penjualan & Keuntungan</h3>
                  <span className="laporan-group-tag">Omzet & Biaya</span>
                </div>

                {/* Penjualan */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => {
                    const breakdown = catalogList.map(item => {
                      const prodStock = storeSummary.stockByProduct.get(item.id);
                      const sold = prodStock?.unitsSold || 0;
                      const checkCount = prodStock?.checkCount || 0;
                      const hasStock = hasRecordedStock(item.id);

                      let calculation = 'Belum dicek';
                      let total = 'Belum dicek';

                      if (!hasStock || checkCount === 0) {
                        calculation = 'Belum dicek';
                        total = 'Belum dicek';
                      } else if (checkCount === 1 && sold === 0) {
                        calculation = 'Stok awal, belum ada pembanding';
                        total = 'Stok awal';
                      } else {
                        calculation = `terjual ${sold} pcs × Rp ${new Intl.NumberFormat('id-ID').format(item.sellingPricePerUnit)}`;
                        total = `Rp ${new Intl.NumberFormat('id-ID').format(sold * item.sellingPricePerUnit)}`;
                      }

                      return {
                        name: item.name,
                        calculation,
                        total,
                      };
                    });

                    setDetailModal({
                      title: 'Penjualan',
                      formula: 'Σ (terjual × harga jual)',
                      rows: [
                        { label: 'Penjualan terhitung', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}`, isHighlight: true },
                      ],
                      note: 'Dihitung dari selisih cek sisa fisik barang.',
                      showItemsLink: breakdown.length > 0,
                      itemsBreakdown: breakdown,
                    });
                  }}
                >
                  <span className="laporan-row-name">Penjualan Kotor</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num">
                      {storeSummary.grossSales.min !== storeSummary.grossSales.max ? '≈ ' : ''}
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Diskon */}
                {storeSummary.discountTotal.max > 0 && (
                  <button
                    type="button"
                    className="laporan-row-btn"
                    onClick={() => setDetailModal({
                      title: 'Diskon Hari Tertentu',
                      formula: 'Σ (pcs terjual saat diskon × potongan)',
                      rows: [
                        {
                          label: 'Total potongan diskon',
                          value: storeSummary.discountTotal.min !== storeSummary.discountTotal.max
                            ? `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.discountTotal.min)} – Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.discountTotal.max)}`
                            : `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.discountTotal.min)}`,
                          isHighlight: true,
                        },
                      ],
                      note: storeSummary.hasDiscountReview
                        ? 'Kolom terjual saat diskon belum diisi pada saat cek sisa; diskon dihitung sebagai kisaran dengan status Perlu diperiksa.'
                        : 'Potongan harga khusus hari promosi toko.',
                    })}
                  >
                    <span className="laporan-row-name">Diskon Promosi</span>
                    <div className="laporan-row-value-group">
                      <span className="laporan-row-num red">
                        -Rp {new Intl.NumberFormat('id-ID').format(storeSummary.discountTotal.min)}
                      </span>
                      <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                    </div>
                  </button>
                )}

                {/* Untung Kotor */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Untung Kotor',
                    formula: 'Σ (terjual × harga jual) − Diskon',
                    rows: [
                      { label: 'Penjualan', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}` },
                      { label: 'Diskon', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.discountTotal.max)}`, isNegative: true },
                      { label: 'Untung kotor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name bold">Untung Kotor</span>
                  <div className="laporan-row-value-group">
                    <span className={`laporan-row-num ${storeSummary.untungKotor.min >= 0 ? 'green' : 'red'}`}>
                      {storeSummary.untungKotor.min !== storeSummary.untungKotor.max ? '≈ ' : ''}
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Biaya Toko */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Biaya Toko',
                    formula: 'Total biaya operasional toko',
                    rows: [
                      { label: 'Biaya dari laci kasir', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}` },
                      { label: 'Biaya lain / pribadi', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal - storeSummary.expensesLaci)}` },
                      { label: 'Total biaya toko', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Biaya Operasional</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num muted">
                      -Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Pemasukan Lain */}
                {storeSummary.otherIncomeTotal > 0 && (
                  <button
                    type="button"
                    className="laporan-row-btn"
                    onClick={() => setDetailModal({
                      title: 'Pemasukan Lain',
                      formula: 'Σ (nominal × jumlah kali)',
                      rows: (docPayload.otherIncomes || []).map(inc => ({
                        label: `${inc.name} (${inc.quantity}x)`,
                        value: `+Rp ${new Intl.NumberFormat('id-ID').format(inc.totalAmount)}`,
                      })),
                      note: 'Pemasukan tambahan seperti jasa seduh mie, titipan, dll yang masuk ke kas toko.',
                    })}
                  >
                    <span className="laporan-row-name">Pemasukan Sampingan</span>
                    <div className="laporan-row-value-group">
                      <span className="laporan-row-num green">
                        +Rp {new Intl.NumberFormat('id-ID').format(storeSummary.otherIncomeTotal)}
                      </span>
                      <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                    </div>
                  </button>
                )}

                {/* Untung Bersih Row */}
                <button
                  type="button"
                  className="laporan-row-btn highlight-row"
                  onClick={() => setDetailModal({
                    title: 'Untung Bersih',
                    formula: 'Untung kotor − semua pengeluaran toko + pemasukan lain',
                    rows: [
                      { label: 'Untung kotor', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}` },
                      { label: 'Biaya toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isNegative: true },
                      { label: 'Pemasukan lain', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.otherIncomeTotal)}` },
                      { label: 'Untung bersih', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih?.min ?? 0)}`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name bold" style={{ fontSize: '13px' }}>Untung Bersih</span>
                  <div className="laporan-row-value-group">
                    <strong className={`laporan-row-num ${(storeSummary.untungBersih?.min ?? 0) >= 0 ? 'green' : 'red'}`} style={{ fontSize: '13.5px' }}>
                      {storeSummary.untungBersih ? (
                        <>
                          {storeSummary.untungBersih.min !== storeSummary.untungBersih.max ? '≈ ' : ''}
                          Rp {new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih.min)}
                        </>
                      ) : (
                        'Belum pasti'
                      )}
                    </strong>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Laba Setelah Modal */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Laba Setelah Modal',
                    formula: 'Untung Bersih − modal barang terjual',
                    rows: [
                      { label: 'Untung bersih', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih?.min ?? 0)}` },
                      { label: 'Modal barang terjual', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cogsKnown)}`, isNegative: true },
                      { label: 'Laba setelah modal', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.labaSetelahModal?.min ?? 0)}`, isHighlight: true },
                    ],
                    note: 'Laba bersih toko setelah memperhitungkan pengembalian modal barang yang laku terjual.',
                  })}
                >
                  <span className="laporan-row-name">Laba Setelah Modal</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num">
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.labaSetelahModal?.min ?? 0)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Rugi Barang Rusak */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Rugi Barang Rusak',
                    formula: 'Nilai modal barang rusak/cacat/dimakan tikus',
                    rows: [
                      { label: 'Nilai modal rugi barang rusak', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.damageLossTotal)}`, isHighlight: true },
                    ],
                    note: 'Mengurangi stok fisik barang toko. Nilai modalnya ditampilkan di laporan dan tidak mengurangi Untung Bersih.',
                  })}
                >
                  <span className="laporan-row-name">Rugi Barang Rusak</span>
                  <div className="laporan-row-value-group">
                    <span className={`laporan-row-num ${storeSummary.damageLossTotal > 0 ? 'red' : 'muted'}`}>
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.damageLossTotal)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>
              </div>

              {/* SLAB 2: Kasir & Setoran */}
              <div className="laporan-group-slab">
                <div className="laporan-group-head">
                  <h3 className="laporan-group-title">2. Rekonsiliasi Kasir & Setoran</h3>
                  <span className="laporan-group-tag">Arus Kas</span>
                </div>

                {/* Setoran Seharusnya */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Setoran Seharusnya',
                    formula: 'Untung Kotor + pemasukan lain − pengeluaran uang laci',
                    rows: [
                      { label: 'Untung kotor', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}` },
                      { label: 'Pemasukan lain', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.otherIncomeTotal)}` },
                      { label: 'Pengeluaran uang laci', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}`, isNegative: true },
                      { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Setoran Seharusnya</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num">
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Setoran Diterima */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Setoran Diterima',
                    formula: 'Total uang setoran yang telah diserahkan',
                    rows: [
                      { label: 'Setoran diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}`, isHighlight: true },
                      { label: 'Sisa belum disetor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}` },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Setoran Diterima</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num">
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Selisih */}
                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Selisih Setoran',
                    formula: 'Diterima − Seharusnya',
                    rows: [
                      { label: 'Setoran diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                      { label: 'Setoran seharusnya', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}`, isNegative: true },
                      {
                        label: 'Selisih',
                        value: `${storeSummary.depositDiscrepancy < 0 ? 'Kurang' : storeSummary.depositDiscrepancy > 0 ? 'Lebih' : 'Cocok'} Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(storeSummary.depositDiscrepancy))}`,
                        isHighlight: true,
                        isNegative: storeSummary.depositDiscrepancy < 0,
                      },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Selisih Kasir</span>
                  <div className="laporan-row-value-group">
                    <span className={`laporan-row-num ${storeSummary.depositDiscrepancy < 0 ? 'red' : storeSummary.depositDiscrepancy > 0 ? 'blue' : 'green'}`}>
                      {storeSummary.depositDiscrepancy < 0
                        ? `Kurang Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(storeSummary.depositDiscrepancy))}`
                        : storeSummary.depositDiscrepancy > 0
                        ? `Lebih Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.depositDiscrepancy)}`
                        : 'Rp 0 (Cocok)'}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                {/* Uang di Tangan Row */}
                <button
                  type="button"
                  className="laporan-row-btn highlight-row"
                  onClick={() => setDetailModal({
                    title: 'Uang di Tangan',
                    formula: 'Setoran diterima − Belanja dari setoran − Pengambilan pribadi',
                    rows: [
                      { label: 'Setoran diterima', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                      { label: 'Belanja dari setoran', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}`, isNegative: true },
                      { label: 'Pengambilan pribadi', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.ownerWithdrawalsTotal)}`, isNegative: true },
                      { label: 'Uang di tangan', value: storeSummary.isCashInHandCalculable ? `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}` : 'Belum bisa dihitung', isHighlight: true },
                    ],
                    note: storeSummary.isCashInHandCalculable ? undefined : 'Belum ada setoran kas yang diterima dari karyawan.',
                  })}
                >
                  <span className="laporan-row-name bold" style={{ fontSize: '13px' }}>Uang di Tangan Pemilik</span>
                  <div className="laporan-row-value-group">
                    <strong className="laporan-row-num" style={{ fontSize: '13.5px' }}>
                      {storeSummary.isCashInHandCalculable ? `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}` : 'Belum dihitung'}
                    </strong>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>
              </div>

              {/* SLAB 3: Fisik & Persediaan */}
              <div className="laporan-group-slab">
                <div className="laporan-group-head">
                  <h3 className="laporan-group-title">3. Nilai Persediaan Barang</h3>
                  <span className="laporan-group-tag">Aset Gudang</span>
                </div>

                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Total Fisik Tersedia',
                    formula: 'Akumulasi sisa stok seluruh barang toko',
                    rows: [
                      { label: 'Total stok barang', value: `${storeSummary.totalAvailableUnits} pcs`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Total Fisik Tersedia</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num">{storeSummary.totalAvailableUnits} pcs</span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Modal Persediaan Barang',
                    formula: 'Σ stok tersedia × modal rata-rata per barang',
                    rows: [
                      { label: 'Nilai modal persediaan', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.knownInventoryValue)}`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Nilai Modal Persediaan</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num">Rp {new Intl.NumberFormat('id-ID').format(storeSummary.knownInventoryValue)}</span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>
              </div>

              {/* SLAB 4: Perputaran Modal */}
              <div className="laporan-group-slab">
                <div className="laporan-group-head">
                  <h3 className="laporan-group-title">4. Perputaran Modal Toko</h3>
                  <span className="laporan-group-tag">Sirkulasi Kas</span>
                </div>

                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Untung Bersih',
                    formula: 'Untung kotor − semua pengeluaran toko + pemasukan lain',
                    rows: [
                      { label: 'Untung kotor', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungKotor.min)}` },
                      { label: 'Biaya toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isNegative: true },
                      { label: 'Pemasukan lain', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.otherIncomeTotal)}` },
                      { label: 'Untung bersih', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih?.min ?? 0)}`, isHighlight: true },
                    ],
                    note: 'Sudah termasuk modal barang.',
                  })}
                >
                  <span className="laporan-row-name">Untung Bersih Toko</span>
                  <div className="laporan-row-value-group">
                    <span className={`laporan-row-num ${(storeSummary.untungBersih?.min ?? 0) >= 0 ? 'green' : 'red'}`}>
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih?.min ?? 0)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Belanja dari Untung Toko',
                    formula: 'Σ Belanja dengan sumber dana Untung bersih toko',
                    rows: [
                      { label: 'Total belanja untung toko', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}`, isHighlight: true },
                    ],
                  })}
                >
                  <span className="laporan-row-name">Belanja dari Untung Toko</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num muted">
                      -Rp {new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                <button
                  type="button"
                  className="laporan-row-btn highlight-row"
                  onClick={() => setDetailModal({
                    title: 'Sisa Dana Belanja',
                    formula: 'Untung Bersih − Belanja bersumber "Untung bersih toko"',
                    rows: [
                      { label: 'Untung bersih', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.untungBersih?.min ?? 0)}` },
                      { label: 'Belanja dari untung toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}`, isNegative: true },
                      { label: 'Sisa dana', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.sisaDanaBelanjaUntung)}`, isHighlight: true, isNegative: storeSummary.sisaDanaBelanjaUntung < 0 },
                    ],
                    note: storeSummary.sisaDanaBelanjaUntung < 0 ? 'Belanja melebihi modal yang kembali. Dana diambil dari untung.' : undefined,
                  })}
                >
                  <span className="laporan-row-name bold">Sisa Kapasitas Belanja</span>
                  <div className="laporan-row-value-group">
                    <span className={`laporan-row-num ${storeSummary.sisaDanaBelanjaUntung < 0 ? 'red' : ''}`}>
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.sisaDanaBelanjaUntung)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>

                <button
                  type="button"
                  className="laporan-row-btn"
                  onClick={() => setDetailModal({
                    title: 'Belanja dari Uang Pribadi',
                    formula: 'Total belanja − Belanja dari uang toko',
                    rows: [
                      { label: 'Belanja uang pribadi', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalPurchases - storeSummary.purchasesFromSetoran)}`, isHighlight: true },
                    ],
                    note: 'Belanja yang ditalangi uang pribadi pemilik toko.',
                  })}
                >
                  <span className="laporan-row-name" style={{ color: 'var(--muted)' }}>Belanja Uang Pribadi (Info)</span>
                  <div className="laporan-row-value-group">
                    <span className="laporan-row-num muted">
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.totalPurchases - storeSummary.purchasesFromSetoran)}
                    </span>
                    <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                  </div>
                </button>
              </div>

              {/* SLAB 5: Integritas Keuangan */}
              <button
                type="button"
                className="laporan-row-btn"
                onClick={() => setDetailModal({
                  title: 'Prinsip Integritas Keuangan',
                  formula: 'Pemisahan omzet, laba sejati, dan fisik uang kas',
                  rows: [
                    { label: 'Penjualan kotor', value: 'Omzet barang riil terjual' },
                    { label: 'Laba bersih', value: 'Omzet − Modal barang − Biaya toko' },
                    { label: 'Uang siap setor', value: 'Omzet − Biaya laci kasir' },
                    { label: 'Uang di tangan', value: 'Setoran diterima − Belanja − Ambil pribadi' },
                  ],
                  note: 'Belanja toko tidak dipotong dari setoran karyawan; modal barang terjual diputar ulang secara terpisah.',
                })}
                style={{
                  background: 'var(--paper)',
                  borderRadius: '16px',
                  border: '1.5px solid var(--ink)',
                  boxShadow: '0 2px 0 var(--ink)',
                  padding: '14px 16px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--orange)" />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: 'var(--ink)' }}>Prinsip Integritas Keuangan</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Pemisahan modal, omzet, dan kas laci</span>
                  </div>
                </div>
                <div className="laporan-row-value-group">
                  <span className="laporan-row-info-hint" aria-hidden="true"><Info size={12} strokeWidth={2.5} /></span>
                </div>
              </button>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: RIWAYAT CATATAN LENGKAP                */}
        {/* ======================================================== */}
        {currentScreen === 'riwayat' && (() => {
          const paginatedItems = filteredSortedHistory.slice(0, riwayatPageSize);
          const hasMore = filteredSortedHistory.length > riwayatPageSize;

          return (
            <div className="screen-reveal">
              {/* Filter & Sort Controls (Hidden Native Scrollbars) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 750 }}>
                    {filteredSortedHistory.length} catatan terekam
                  </span>
                </div>

                {/* Jenis Chips */}
                <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {(['semua', 'belanja', 'cek stok', 'biaya', 'jasa', 'rusak', 'setoran'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`filter-chip ${riwayatFilter === f ? 'active' : ''}`}
                      onClick={() => {
                        setRiwayatFilter(f);
                        setRiwayatPageSize(20);
                      }}
                      style={{ fontSize: '11px', padding: '5px 12px', minHeight: '34px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {f === 'semua' ? 'Semua' : f === 'belanja' ? 'Belanja' : f === 'cek stok' ? 'Cek Stok' : f === 'biaya' ? 'Biaya' : f === 'jasa' ? 'Jasa' : f === 'rusak' ? 'Rusak' : 'Setoran'}
                    </button>
                  ))}
                </div>

                {/* Sort Chips */}
                <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 800, whiteSpace: 'nowrap' }}>Urut:</span>
                  {(['terbaru', 'terlama', 'nominal'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`filter-chip ${riwayatSort === s ? 'active' : ''}`}
                      onClick={() => setRiwayatSort(s)}
                      style={{ fontSize: '10.5px', padding: '4px 10px', minHeight: '30px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {s === 'terbaru' ? 'Terbaru' : s === 'terlama' ? 'Terlama' : 'Nominal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content: Kartu vs Tabel */}
              {filteredSortedHistory.length === 0 ? (
                <div className="form-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <History size={28} color="var(--muted)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 4px 0' }}>Belum ada catatan</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Tidak ada transaksi pada filter kategori ini.
                  </p>
                </div>
              ) : riwayatViewMode === 'kartu' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="ledger-row-luxury"
                      onClick={() => setDetailModal({
                        title: item.detailTitle,
                        formula: item.detailFormula || '',
                        rows: item.detailRows,
                        note: item.detailNote,
                        deleteAction: item.recordType && item.rawId ? () => handleDeleteRecord(item.recordType, item.rawId) : undefined,
                        deleteLabel: 'Hapus Catatan Ini',
                      })}
                      role="button"
                      tabIndex={0}
                      style={{
                        background: '#fff',
                        border: '1.5px solid rgba(32,33,31,0.14)',
                        borderRadius: '14px',
                        padding: '11px 13px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 850,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: item.type === 'belanja' ? '#ffebe6' : item.type === 'cek stok' ? '#eafbe3' : item.type === 'setoran' ? '#e8f0fe' : item.type === 'jasa' ? '#eafbe3' : item.type === 'rusak' ? '#ffebe6' : '#f4f4f5',
                            color: 'var(--ink)',
                          }}>
                            {item.typeLabel}
                          </span>
                          {item.isSample && (
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a'
                            }}>
                              Contoh
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.time))}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3 }}>
                          {item.summary}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 900,
                          fontVariantNumeric: 'tabular-nums',
                          color: item.nominalText.startsWith('+') ? 'var(--green)' : item.nominalText.startsWith('-') ? 'var(--red)' : 'var(--ink)'
                        }}>
                          {item.nominalText}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>Rincian →</span>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <button
                      type="button"
                      className="btn btn-paper"
                      onClick={() => setRiwayatPageSize((prev) => prev + 20)}
                      style={{ width: '100%', height: '44px', fontWeight: 800, marginTop: '8px' }}
                    >
                      Muat 20 lagi ({filteredSortedHistory.length - riwayatPageSize} tersisa)
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ overflowX: 'auto', maxHeight: '480px', border: '1.5px solid var(--ink)', borderRadius: '8px', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ position: 'sticky', top: 0, background: 'var(--paper)', borderBottom: '2px solid var(--ink)', zIndex: 2 }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 900 }}>Waktu</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 900 }}>Jenis</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 900 }}>Ringkas</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900 }}>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setDetailModal({
                              title: item.detailTitle,
                              formula: item.detailFormula || '',
                              rows: item.detailRows,
                              note: item.detailNote,
                              deleteAction: item.recordType && item.rawId ? () => handleDeleteRecord(item.recordType, item.rawId) : undefined,
                              deleteLabel: 'Hapus Catatan Ini',
                            })}
                            style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                          >
                            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                              {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.time))}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: item.type === 'belanja' ? '#ffebe6' : item.type === 'cek stok' ? '#eafbe3' : item.type === 'setoran' ? '#e8f0fe' : item.type === 'jasa' ? '#eafbe3' : item.type === 'rusak' ? '#ffebe6' : '#f4f4f5',
                                }}>
                                  {item.typeLabel}
                                </span>
                                {item.isSample && (
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '1px 4px',
                                    borderRadius: '4px',
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fde68a'
                                  }}>
                                    Contoh
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.summary}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: item.nominalText.startsWith('+') ? 'var(--green)' : item.nominalText.startsWith('-') ? 'var(--red)' : 'var(--ink)' }}>
                              {item.nominalText}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hasMore && (
                    <button
                      type="button"
                      className="btn btn-paper"
                      onClick={() => setRiwayatPageSize((prev) => prev + 20)}
                      style={{ width: '100%', height: '44px', fontWeight: 800, marginTop: '8px' }}
                    >
                      Muat 20 lagi ({filteredSortedHistory.length - riwayatPageSize} tersisa)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: LAINNYA & PENGATURAN                   */}
        {/* ======================================================== */}
        {currentScreen === 'lainnya' && (
          <div className="screen-reveal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 2px' }}>
              <div className="pro-hint-bar">
                <span className={`settings-status-dot ${syncStatus.isOnline ? 'ok' : 'idle'}`} />
                <span>
                  {catalogList.length} produk · {syncStatus.isOnline ? 'Online' : 'Offline'}
                  {sampleStats.count > 0 ? ` · ${sampleStats.count} contoh aktif` : ''}
                </span>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 750, color: 'var(--muted)' }}>
                Operasional & Arsip
              </span>
            </div>

            <div className="menu-inset-group">
              <button
                type="button"
                className="menu-inset-row"
                onClick={() => setCurrentScreen('biaya')}
              >
                <div className="menu-inset-icon orange"><ReceiptText size={18} /></div>
                <div className="menu-inset-text">
                  <span className="menu-inset-title">Biaya & Pemasukan Toko</span>
                  <span className="menu-inset-meta">Listrik, gas, perlengkapan, dan jasa seduh</span>
                </div>
                <ChevronRight size={18} className="menu-inset-chevron" />
              </button>

              <button
                type="button"
                className="menu-inset-row"
                onClick={() => setCurrentScreen('laporan')}
              >
                <div className="menu-inset-icon lime"><TrendingUp size={18} /></div>
                <div className="menu-inset-text">
                  <span className="menu-inset-title">Laporan Keuangan</span>
                  <span className="menu-inset-meta">Untung bersih, perputaran modal, dan fisik kas</span>
                </div>
                <ChevronRight size={18} className="menu-inset-chevron" />
              </button>

              <button
                type="button"
                className="menu-inset-row"
                onClick={() => setCurrentScreen('riwayat')}
              >
                <div className="menu-inset-icon blue"><History size={18} /></div>
                <div className="menu-inset-text">
                  <span className="menu-inset-title">Riwayat Catatan</span>
                  <span className="menu-inset-meta">Arsip belanja, stok, biaya & setoran terekam</span>
                </div>
                <ChevronRight size={18} className="menu-inset-chevron" />
              </button>

              <button
                type="button"
                className="menu-inset-row"
                onClick={() => setCurrentScreen('barang')}
              >
                <div className="menu-inset-icon dark"><Package size={18} /></div>
                <div className="menu-inset-text">
                  <span className="menu-inset-title">Katalog Produk</span>
                  <span className="menu-inset-meta">{catalogList.length} produk · kemasan, modal & harga jual</span>
                </div>
                <ChevronRight size={18} className="menu-inset-chevron" />
              </button>

              <button
                type="button"
                className="menu-inset-row"
                onClick={() => setCurrentScreen('pengaturan')}
              >
                <div className="menu-inset-icon dark"><SlidersHorizontal size={18} /></div>
                <div className="menu-inset-text">
                  <span className="menu-inset-title">Pengaturan & Cadangan</span>
                  <span className="menu-inset-meta">Tema, cadangan JSON, cloud & data contoh</span>
                </div>
                <ChevronRight size={18} className="menu-inset-chevron" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: KATALOG PRODUK                         */}
        {/* ======================================================== */}
        {currentScreen === 'barang' && (
          <div className="screen-reveal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {catalogList.map((prod) => {
                const unitClean = prod.unit.includes('(') ? prod.unit : `${prod.unit} (${prod.packSize} pcs)`;
                return (
                  <div
                    key={prod.id}
                    className="ledger-row-luxury"
                    style={{ cursor: 'default', padding: '12px 14px', alignItems: 'center', gap: '12px' }}
                  >
                    <div className="product-thumb-image" aria-hidden="true" style={{ flexShrink: 0 }}>
                      {prod.icon}
                    </div>
                    <div className="product-info-text" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong className="product-info-name" style={{ fontSize: '13.5px', fontWeight: 850 }}>{prod.name}</strong>
                        {prod.isSample && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '5px',
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            flexShrink: 0,
                          }}>
                            Contoh
                          </span>
                        )}
                      </div>
                      <span className="product-info-meta" style={{ display: 'block', marginTop: '2px' }}>
                        {prod.category} · {unitClean}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 850, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                          Jual Rp {new Intl.NumberFormat('id-ID').format(prod.sellingPricePerUnit)}/pcs
                        </span>
                        {prod.costPerPack !== null && prod.costPerPack !== undefined ? (
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                            · Modal Rp {new Intl.NumberFormat('id-ID').format(prod.costPerPack)}/{prod.unit.split(' ')[0]}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Modal belum diisi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentScreen === 'pengaturan' && (
          <div className="screen-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* SEKSI 1: TAMPILAN */}
            <div>
              <div className="settings-section-label">
                <span>Tampilan</span>
              </div>
              <div className="menu-inset-group" style={{ marginBottom: 0 }}>
                <div className="settings-row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div className="menu-inset-icon dark">
                      {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <div className="menu-inset-text">
                      <span className="menu-inset-title">Mode Tampilan</span>
                      <span className="menu-inset-meta">
                        {theme === 'light' ? 'Terang (Paper)' : 'Gelap (Near Black)'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={toggleTheme}
                    style={{ minHeight: '44px', fontSize: '12px', padding: '6px 12px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                    <span>Ganti Tema</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SEKSI 2: CADANGAN & SINKRONISASI */}
            <div>
              <div className="settings-section-label">
                <span>Cadangan & Sinkronisasi</span>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="menu-inset-group" style={{ marginBottom: 0 }}>
                {/* Sub-blok A: Penyimpanan Perangkat */}
                <div className="settings-row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div className="menu-inset-icon orange">
                      <Database size={18} />
                    </div>
                    <div className="menu-inset-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="settings-status-dot ok" />
                        <span className="menu-inset-title">Penyimpanan Perangkat</span>
                      </div>
                      <span className="menu-inset-meta">
                        {checksumStatus === 'VALID' ? 'Data terverifikasi' : 'Tersimpan lokal'}
                        {dataVersion > 0 ? ` · v${dataVersion}` : ''}
                        {syncStatus.pendingCount > 0 ? ` · ${syncStatus.pendingCount} tertunda` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="settings-action-strip">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExportJson}
                    style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={15} />
                    <span>Unduh JSON</span>
                  </button>
                  <label
                    className="btn btn-paper"
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '6px'
                    }}
                  >
                    <Upload size={15} />
                    <span>Pulihkan JSON</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportJsonFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Sub-blok B: Cloud Supabase */}
                <div className="settings-row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div className="menu-inset-icon blue">
                      <Server size={18} />
                    </div>
                    <div className="menu-inset-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`settings-status-dot ${supabaseAdapter.isConfigured() ? (syncStatus.lastError ? 'err' : 'ok') : 'idle'}`} />
                        <span className="menu-inset-title">Cloud Supabase</span>
                      </div>
                      <span className="menu-inset-meta">
                        {supabaseAdapter.isConfigured()
                          ? (syncStatus.lastSyncedAt
                              ? `Tersinkron ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                              : 'Terkonfigurasi · Siap sinkron')
                          : 'Belum dikonfigurasi'}
                      </span>
                    </div>
                  </div>
                </div>
                {syncStatus.lastError && (
                  <div style={{ padding: '8px 16px', background: '#ffebe6', color: '#900', fontSize: '11px', borderBottom: '1px solid rgba(32, 33, 31, 0.08)' }}>
                    <strong>Catatan Sinkronisasi:</strong> {syncStatus.lastError}
                  </div>
                )}
                <div className="settings-action-strip">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSyncCloudNow}
                    disabled={syncStatus.isSyncing}
                    style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={15} className={syncStatus.isSyncing ? 'spin' : ''} />
                    <span>{syncStatus.isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setShowSupabaseModal(true)}
                    style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <KeyRound size={15} />
                    <span>Kredensial Cloud</span>
                  </button>
                </div>

                {/* Sub-blok C: Google Drive */}
                <div className="settings-row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div className="menu-inset-icon orange">
                      <Cloud size={18} />
                    </div>
                    <div className="menu-inset-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`settings-status-dot ${
                          authState === 'CONNECTED'
                            ? 'ok'
                            : authState === 'ERROR'
                            ? 'err'
                            : (authState === 'UNCONFIGURED' || authState === 'EXPIRED')
                            ? 'warn'
                            : 'idle'
                        }`} />
                        <span className="menu-inset-title">Google Drive</span>
                      </div>
                      <span className="menu-inset-meta">
                        {userInfo?.email
                          ? userInfo.email
                          : authState === 'CONNECTED'
                          ? 'Terhubung'
                          : authState === 'UNCONFIGURED'
                          ? 'Perlu Client ID'
                          : authState === 'EXPIRED'
                          ? 'Sesi kedaluwarsa'
                          : 'Belum terhubung'}
                        {lastBackupTime && lastBackupTime !== 'Belum pernah' ? ` · ${lastBackupTime}` : ''}
                        {storageQuota ? ` · ${(storageQuota.usageBytes / (1024 * 1024)).toFixed(1)} MB` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                {authState === 'ERROR' && authError && (
                  <div style={{ padding: '8px 16px', background: '#ffebe6', color: '#900', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(32, 33, 31, 0.08)' }}>
                    <XCircle size={14} style={{ flexShrink: 0 }} />
                    <span><strong>Gagal Otorisasi:</strong> {authError}</span>
                  </div>
                )}
                {authState === 'EXPIRED' && (
                  <div style={{ padding: '8px 16px', background: 'var(--amber-pale)', color: 'var(--ink)', fontSize: '11px', borderBottom: '1px solid rgba(32, 33, 31, 0.08)' }}>
                    Sesi Google kedaluwarsa. Hubungkan ulang untuk melanjutkan cadangan Drive.
                  </div>
                )}
                <div className="settings-action-strip">
                  {authState === 'CONNECTED' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleManualBackup}
                        disabled={isBackingUp}
                        style={{ flex: '1 1 100%', minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <HardDrive size={15} />
                        <span>{isBackingUp ? 'Membuat Cadangan...' : 'Cadangkan ke Drive'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => setShowRestoreModal(true)}
                        style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <History size={15} />
                        <span>Pulihkan ({backups.length})</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={handleTestConnection}
                        disabled={isCheckingConnection}
                        style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <RefreshCw size={15} className={isCheckingConnection ? 'spin' : ''} />
                        <span>{isCheckingConnection ? 'Menguji...' : 'Tes Sambungan'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={handleDisconnectGoogle}
                        style={{ flex: '1 1 100%', minHeight: '44px', fontSize: '12px', color: 'var(--red)', borderColor: '#ffd0c4' }}
                      >
                        Putuskan Sesi Google Drive
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleConnectGoogle}
                        disabled={authState === 'CONNECTING'}
                        style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Cloud size={15} />
                        <span>
                          {authState === 'CONNECTING'
                            ? 'Membuka...'
                            : authState === 'UNCONFIGURED'
                            ? 'Konfigurasi Google Client ID'
                            : authState === 'EXPIRED'
                            ? 'Otorisasi Ulang Akun'
                            : 'Hubungkan Google Drive'}
                        </span>
                      </button>
                      {authState !== 'UNCONFIGURED' && (
                        <button
                          type="button"
                          className="btn btn-paper"
                          onClick={() => setShowConfigModal(true)}
                          style={{ minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '0 12px' }}
                        >
                          <KeyRound size={14} />
                          <span>Ubah Client ID</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* SEKSI 3: DATA CONTOH & PRIVASI */}
            <div>
              <div className="settings-section-label">
                <span>Data Contoh Simulasi</span>
              </div>
              <div className="menu-inset-group" style={{ marginBottom: 0 }}>
                <div className="settings-row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div className="menu-inset-icon dark">
                      <Package size={18} />
                    </div>
                    <div className="menu-inset-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`settings-status-dot ${sampleStats.count > 0 ? 'warn' : 'idle'}`} />
                        <span className="menu-inset-title">Simulasi Toko 1 Minggu</span>
                      </div>
                      <span className="menu-inset-meta">
                        {sampleStats.count > 0
                          ? `${sampleStats.count} rekaman (${sampleStats.products} barang · ${sampleStats.transactions} transaksi)`
                          : 'Belum dimuat · aman dicoba kapan saja'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="settings-action-strip">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLoadSampleData}
                    style={{ flex: 1, minHeight: '44px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Sparkles size={15} />
                    <span>Muat data contoh</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setShowDeleteSampleModal(true)}
                    disabled={sampleStats.count === 0}
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      fontSize: '12px',
                      color: sampleStats.count > 0 ? 'var(--red)' : 'var(--muted)',
                      borderColor: sampleStats.count > 0 ? '#ffd0c4' : 'var(--line)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Undo2 size={15} />
                    <span>Hapus semua contoh</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pro-hint-bar" style={{ justifyContent: 'center', padding: '2px 8px 4px' }}>
              <ShieldCheck size={14} color="var(--orange)" />
              <span>Data tersimpan lokal di perangkat · Asisten AI nonaktif default</span>
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

            {/* Modal Dialog Konfigurasi OAuth Client ID & Origins */}
            {showConfigModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="oauth-config-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
                <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <KeyRound size={20} color="var(--orange)" />
                      <h3 id="oauth-config-title" className="form-card-title" style={{ margin: 0 }}>Konfigurasi Google OAuth 2.0</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                      aria-label="Tutup dialog konfigurasi"
                    >
                      ✕
                    </button>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                    Aplikasi ini menggunakan Google Identity Services (GIS) sisi peramban untuk mengakses Google Drive tanpa server perantara berbayar (Anggaran <strong>Rp0</strong>).
                  </p>

                  {/* Authorized JavaScript Origin Card */}
                  <div style={{ padding: '10px 12px', background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', display: 'block' }}>
                      1. Authorized JavaScript Origin Anda:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <code style={{ fontSize: '11px', background: 'var(--cream)', padding: '6px 8px', borderRadius: '4px', flex: 1, overflowX: 'auto', border: '1px solid var(--line)' }}>
                        {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                      </code>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.origin);
                            showToast('Origin disalin ke clipboard!');
                          }
                        }}
                        style={{ minHeight: '36px', padding: '0 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                      >
                        Salin
                      </button>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                      Tempelkan URL ini di Google Cloud Console pada kolom <em>Authorized JavaScript origins</em>.
                    </span>
                  </div>

                  {/* Input Client ID */}
                  <div style={{ marginBottom: '14px' }}>
                    <label htmlFor="cfg-client-id" style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                      2. OAuth 2.0 Web Client ID:
                    </label>
                    <input
                      id="cfg-client-id"
                      type="text"
                      className="field-input"
                      placeholder="Contoh: 123456789-xxx.apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      style={{ fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                      Client ID bersifat publik dan aman disimpan di frontend. Jangan pernah membagikan atau memasukkan Client Secret.
                    </span>
                  </div>

                  {/* Info Scope */}
                  <div style={{ padding: '8px 10px', background: 'var(--blue-pale)', border: '1px solid var(--blue)', borderRadius: '6px', fontSize: '10px', color: 'var(--ink)', marginBottom: '16px' }}>
                    <strong>Scope Minimum:</strong> <code>https://www.googleapis.com/auth/drive.file</code> (Aplikasi hanya membaca dan menulis file data miliknya sendiri).
                  </div>

                  {/* Modal Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveClientId}
                      style={{ minHeight: '44px', width: '100%' }}
                    >
                      Simpan Client ID
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={handleResetClientId}
                        style={{ minHeight: '40px', fontSize: '11px' }}
                      >
                        Hapus / Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => setShowConfigModal(false)}
                        style={{ minHeight: '40px', fontSize: '11px' }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Dialog: Konfigurasi Supabase Cloud */}
            {showSupabaseModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="supabase-modal-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
                <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={20} color="var(--blue)" />
                      <h3 id="supabase-modal-title" className="form-card-title" style={{ margin: 0 }}>Konfigurasi Supabase Cloud</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSupabaseModal(false)}
                      style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                      aria-label="Tutup dialog Supabase"
                    >
                      ✕
                    </button>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                    Gunakan tier gratis Supabase (PostgreSQL Rp0) untuk sinkronisasi data antar-perangkat secara otomatis. Data tetap tersimpan secara aman di browser (Offline-First) dan diselaraskan ke basis data cloud Anda.
                  </p>

                  <div style={{ marginBottom: '12px' }}>
                    <label htmlFor="cfg-sb-url" style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                      1. Project URL Supabase:
                    </label>
                    <input
                      id="cfg-sb-url"
                      type="url"
                      className="field-input"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      style={{ fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label htmlFor="cfg-sb-key" style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                      2. Public Anon Key:
                    </label>
                    <input
                      id="cfg-sb-key"
                      type="text"
                      className="field-input"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      style={{ fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                      Kunci publik anon aman digunakan di sisi peramban dengan Row Level Security.
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveSupabaseConfig}
                      style={{ minHeight: '44px', width: '100%' }}
                    >
                      Simpan Kredensial Supabase
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={handleResetSupabaseConfig}
                        style={{ minHeight: '40px', fontSize: '11px' }}
                      >
                        Hapus / Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => setShowSupabaseModal(false)}
                        style={{ minHeight: '40px', fontSize: '11px' }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', padding: '10px 12px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)' }}>
                        Otorisasi Pemilik (Supabase Auth):
                      </span>
                      {supabaseUser ? (
                        <span style={{ fontSize: '10px', background: '#eafbe7', color: '#1a7f37', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ✓ Aktif
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                          Sesi Kunci Anon
                        </span>
                      )}
                    </div>
                    {supabaseUser ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--ink)', fontWeight: 700 }}>{supabaseUser.email}</span>
                        <button
                          type="button"
                          className="btn btn-paper"
                          onClick={handleSignOutSupabase}
                          style={{ minHeight: '32px', fontSize: '10px', padding: '2px 8px' }}
                        >
                          Keluar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--muted)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                          Kirim tautan masuk Magic Link (tanpa sandi) ke akun <strong>adizseptian@gmail.com</strong> untuk sinkronisasi terotorisasi RLS.
                        </p>
                        <button
                          type="button"
                          className="btn btn-paper"
                          disabled={isSendingOtp}
                          onClick={handleSendMagicLink}
                          style={{ minHeight: '36px', fontSize: '11px', width: '100%', padding: '4px 8px' }}
                        >
                          {isSendingOtp ? 'Mengirim...' : '✉️ Kirim Magic Link Masuk ke adizseptian@gmail.com'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--line)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      Skrip SQL Migrasi Database Supabase:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => {
                          const sql001 = `-- TOKO SAKALA: Skrip Migrasi 001 (Tabel Dokumen & Cadangan)
CREATE TABLE IF NOT EXISTS public.toko_documents (
  id text PRIMARY KEY,
  data_version bigint NOT NULL DEFAULT 1,
  checksum text NOT NULL,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.toko_documents ADD COLUMN IF NOT EXISTS data_version bigint DEFAULT 1;
ALTER TABLE public.toko_documents ADD COLUMN IF NOT EXISTS version bigint DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.toko_backups (
  id text PRIMARY KEY,
  file_name text NOT NULL,
  data_version bigint NOT NULL DEFAULT 1,
  version bigint NOT NULL DEFAULT 1,
  checksum text NOT NULL,
  content text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.toko_backups ADD COLUMN IF NOT EXISTS data_version bigint DEFAULT 1;
ALTER TABLE public.toko_backups ADD COLUMN IF NOT EXISTS version bigint DEFAULT 1;

ALTER TABLE public.toko_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toko_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow owner read and write toko_documents" ON public.toko_documents;
CREATE POLICY "Allow owner read and write toko_documents" ON public.toko_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow owner read and write toko_backups" ON public.toko_backups;
CREATE POLICY "Allow owner read and write toko_backups" ON public.toko_backups FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.toko_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.toko_backups TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';`;
                          navigator.clipboard.writeText(sql001);
                          showToast('Skrip Migrasi 001 (toko_documents) berhasil disalin!');
                        }}
                        style={{ minHeight: '36px', fontSize: '10px', padding: '4px 6px' }}
                      >
                        📋 Salin SQL 001 (Dokumen)
                      </button>

                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => {
                          const sql002 = `-- TOKO SAKALA: Skrip Migrasi 002 (Tabel Domain: Produk, Stok, Belanja, Penjualan, Biaya, Setoran, Sync)
CREATE TABLE IF NOT EXISTS public.products (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Makanan',
  unit text NOT NULL DEFAULT 'pcs',
  pack_size integer NOT NULL DEFAULT 1,
  cost_per_pack numeric NOT NULL DEFAULT 0,
  selling_price_per_unit numeric NOT NULL DEFAULT 0,
  icon text DEFAULT '📦',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(product_id) ON DELETE CASCADE,
  change integer NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  movement_type text NOT NULL DEFAULT 'MANUAL',
  note text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(product_id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  units_per_pack integer NOT NULL DEFAULT 1,
  total numeric NOT NULL,
  source_money text NOT NULL DEFAULT 'STORE',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(product_id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  source_payment text NOT NULL DEFAULT 'CASH',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id text PRIMARY KEY,
  description text NOT NULL,
  amount numeric NOT NULL,
  source_money text NOT NULL DEFAULT 'STORE',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deposits (
  id text PRIMARY KEY,
  expected_amount numeric NOT NULL,
  received_amount numeric NOT NULL,
  discrepancy numeric NOT NULL DEFAULT 0,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.periods (
  id text PRIMARY KEY,
  start_date date NOT NULL,
  end_date date,
  is_closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_events (
  id text PRIMARY KEY,
  item_type text NOT NULL,
  item_id text NOT NULL,
  action text NOT NULL,
  idempotency_key text UNIQUE,
  device_id text,
  synced boolean NOT NULL DEFAULT true,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backup_registry (
  id text PRIMARY KEY,
  file_name text NOT NULL,
  data_version integer NOT NULL DEFAULT 1,
  byte_size bigint NOT NULL DEFAULT 0,
  checksum text NOT NULL,
  description text,
  storage_path text,
  user_id uuid REFERENCES auth.users(id),
  backup_time timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Stock movements access" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Purchases access" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Sales access" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Expenses access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Deposits access" ON public.deposits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Periods access" ON public.periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Sync events access" ON public.sync_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Backup registry access" ON public.backup_registry FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.stock_movements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.purchases TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sales TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.deposits TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.periods TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sync_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.backup_registry TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';`;
                          navigator.clipboard.writeText(sql002);
                          showToast('Skrip Migrasi 002 (Domain Tables) berhasil disalin!');
                        }}
                        style={{ minHeight: '36px', fontSize: '10px', padding: '4px 6px' }}
                      >
                        📋 Salin SQL 002 (Domain)
                      </button>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>
                      Jalankan skrip di atas (klik Run) di menu <strong>SQL Editor</strong> dashboard Supabase Anda (<code>dvznpniodskujfbdznnv.supabase.co</code>) untuk mengaktifkan seluruh tabel dan RLS.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Dialog: Pilih Tanggal Setoran (Executive Calendar Sheet) */}
      {showDateModal && (
        <div className="modal-backdrop modal-backdrop-frosted" role="dialog" aria-modal="true" aria-labelledby="date-modal-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="executive-modal-box" style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(32, 33, 31, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--orange)" />
                <h3 id="date-modal-title" className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>Pilih Tanggal Setoran</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                aria-label="Tutup dialog tanggal"
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
              Pilih tanggal laporan serah-terima uang fisik kasir:
            </div>

            <div className="date-preset-grid">
              <button
                type="button"
                className={`date-preset-card ${selectedDateTab === 'HARI_INI' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDateTab('HARI_INI');
                  const today = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date());
                  setDepositDate(today);
                  setDepositDateIso(new Date().toISOString());
                  setShowDateModal(false);
                  showToast(`Tanggal diatur: ${today}`);
                }}
              >
                <div className="date-preset-title">
                  <span>Hari ini</span>
                  {selectedDateTab === 'HARI_INI' && <Check size={14} strokeWidth={3} color="var(--ink)" />}
                </div>
                <div className="date-preset-desc">
                  {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
                </div>
              </button>

              <button
                type="button"
                className={`date-preset-card ${selectedDateTab === 'KEMARIN' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDateTab('KEMARIN');
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  const yesterday = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(d);
                  setDepositDate(yesterday);
                  setDepositDateIso(d.toISOString());
                  setShowDateModal(false);
                  showToast(`Tanggal diatur: ${yesterday}`);
                }}
              >
                <div className="date-preset-title">
                  <span>Kemarin</span>
                  {selectedDateTab === 'KEMARIN' && <Check size={14} strokeWidth={3} color="var(--ink)" />}
                </div>
                <div className="date-preset-desc">
                  {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
                  })()}
                </div>
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: '#fff', padding: '10px 12px', borderRadius: '12px', border: '1.25px solid rgba(32, 33, 31, 0.15)' }}>
              <label htmlFor="custom-date" className="field-label" style={{ marginBottom: '6px', display: 'block', fontSize: '11px', fontWeight: 800 }}>
                Atau pilih tanggal kalender kustom:
              </label>
              <input
                id="custom-date"
                type="date"
                className="field-input"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', height: '40px', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (customDateInput) {
                    const parsed = new Date(customDateInput);
                    if (!isNaN(parsed.getTime())) {
                      setSelectedDateTab('PILIH_TANGGAL');
                      const formatted = new Intl.DateTimeFormat('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }).format(parsed);
                      setDepositDate(formatted);
                      setDepositDateIso(parsed.toISOString());
                    }
                  }
                  setShowDateModal(false);
                }}
                style={{ minHeight: '44px', fontWeight: 850 }}
              >
                Terapkan
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowDateModal(false)}
                style={{ minHeight: '44px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Ubah Nominal Diterima (Menggantikan window.prompt) */}
      {showAmountModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="amount-modal-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 id="amount-modal-title" className="form-card-title" style={{ margin: 0 }}>Ubah Uang Diterima</h3>
              <button
                type="button"
                onClick={() => setShowAmountModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog nominal"
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="custom-amount" className="field-label" style={{ marginBottom: '4px', display: 'block' }}>
                Nominal Uang Fisik dari Karyawan (Rp)
              </label>
              <input
                id="custom-amount"
                type="number"
                min="0"
                step="1000"
                className="field-input"
                value={customAmountInput}
                onChange={(e) => setCustomAmountInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', fontSize: '16px', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '16px' }}>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setCustomAmountInput(String((Number(customAmountInput) || 0) + 10000))}
                style={{ minHeight: '40px', fontSize: '11px', padding: '4px 6px' }}
              >
                +10.000
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setCustomAmountInput(String((Number(customAmountInput) || 0) + 50000))}
                style={{ minHeight: '40px', fontSize: '11px', padding: '4px 6px' }}
              >
                +50.000
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setCustomAmountInput(String(expectedAmount))}
                style={{ minHeight: '40px', fontSize: '11px', padding: '4px 6px' }}
              >
                Setel Pas
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const val = Number(customAmountInput);
                  if (!isNaN(val) && val >= 0) {
                    setReceivedAmountInput(val);
                    showToast(`Uang diterima diubah menjadi Rp ${new Intl.NumberFormat('id-ID').format(val)}`);
                  }
                  setShowAmountModal(false);
                }}
                style={{ minHeight: '44px' }}
              >
                Simpan Nominal
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowAmountModal(false)}
                style={{ minHeight: '44px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Penjelasan Selisih Setoran (Interactivity untuk Finding 5) */}
      {showDiscrepancyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="discrepancy-modal-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color="var(--red)" />
                <h3 id="discrepancy-modal-title" className="form-card-title" style={{ margin: 0 }}>Penjelasan Selisih Setoran</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscrepancyModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog selisih"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div className="summary-box-row">
                <span>Uang Seharusnya Diserahkan:</span>
                <strong>Rp {new Intl.NumberFormat('id-ID').format(expectedAmount)}</strong>
              </div>
              <div className="summary-box-row">
                <span>Uang Fisik yang Diterima:</span>
                <strong>Rp {new Intl.NumberFormat('id-ID').format(receivedAmount)}</strong>
              </div>
              <div className="summary-box-row" style={{ paddingTop: '8px', borderTop: '1px dashed var(--line)' }}>
                <span style={{ fontWeight: 800 }}>Status Selisih:</span>
                <strong style={{ color: receivedAmount < expectedAmount ? 'var(--red)' : receivedAmount > expectedAmount ? 'var(--blue)' : 'var(--green)', fontSize: '14px' }}>
                  {receivedAmount < expectedAmount
                    ? `Kurang Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount - receivedAmount)}`
                    : receivedAmount > expectedAmount
                    ? `Lebih Rp ${new Intl.NumberFormat('id-ID').format(receivedAmount - expectedAmount)}`
                    : 'Rp 0 (Pas)'}
                </strong>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--amber-pale)', borderRadius: '8px', border: '1px solid #e2bc74', fontSize: '11px', color: 'var(--ink)', marginBottom: '16px' }}>
              <strong>Langkah Pemeriksaan Pemilik:</strong>
              <p style={{ marginTop: '4px' }}>
                Jika ada selisih kurang, tanyakan kepada karyawan apakah terdapat nota belanja darurat, uang kembalian pelanggan di laci kasir, atau transaksi piutang. Catat alasan tersebut di kolom <em>Keterangan</em> sebelum menekan Simpan.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowDiscrepancyModal(false)}
              style={{ minHeight: '44px', width: '100%' }}
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog: Tambah Produk Baru ke Master Katalog */}
      {showAddProductModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-product-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--orange)" />
                <h3 id="add-product-title" className="form-card-title" style={{ margin: 0 }}>Tambah Produk Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog tambah produk"
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="np-name" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                Nama Produk *
              </label>
              <input
                id="np-name"
                type="text"
                className="field-input"
                placeholder="Contoh: Teh Botol Sosro 450ml"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Kategori Produk</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['Makanan', 'Minuman', 'Rokok', 'Lainnya'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-chip ${newProdCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      setNewProdCategory(cat);
                      if (cat === 'Makanan') setNewProdIcon('🍜');
                      else if (cat === 'Minuman') setNewProdIcon('💧');
                      else if (cat === 'Rokok') setNewProdIcon('🚬');
                      else setNewProdIcon('📦');
                    }}
                    style={{ minHeight: '36px', padding: '5px 13px', fontSize: '12px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Pilih Ikon</label>
              <div className="no-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {['📦', '🍜', '💧', '🧃', '🥚', '🍚', '🍪', '🚬', '🧼', '🧴', '🍞', '☕'].map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewProdIcon(ic)}
                    style={{
                      width: '38px',
                      height: '38px',
                      flexShrink: 0,
                      borderRadius: '10px',
                      border: newProdIcon === ic ? '2px solid var(--orange)' : '1.5px solid var(--line)',
                      background: newProdIcon === ic ? 'var(--amber-pale)' : 'var(--paper)',
                      fontSize: '18px',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Pilihan Kemasan & Satuan</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  { label: 'Eceran (1 pcs)', unit: 'Pcs', packSize: 1 },
                  { label: 'Dus (24 pcs)', unit: 'Dus (24 pcs)', packSize: 24 },
                  { label: 'Dus (40 pcs)', unit: 'Dus (40 pcs)', packSize: 40 },
                  { label: 'Slop (10 bks)', unit: 'Slop (10 bks)', packSize: 10 },
                  { label: '1 Kg', unit: 'Kg', packSize: 1 },
                  { label: 'Kustom', unit: newProdUnit, packSize: newProdPackSize },
                ].map(pre => (
                  <button
                    key={pre.label}
                    type="button"
                    className={`filter-chip ${newProdPreset === pre.label ? 'active' : ''}`}
                    onClick={() => {
                      setNewProdPreset(pre.label);
                      if (pre.label !== 'Kustom') {
                        setNewProdUnit(pre.unit);
                        setNewProdPackSize(pre.packSize);
                      }
                    }}
                    style={{ minHeight: '34px', padding: '4px 10px', fontSize: '11px' }}
                  >
                    {pre.label}
                  </button>
                ))}
              </div>

              <div className="form-row-pair">
                <div className="field-group">
                  <label htmlFor="np-unit" className="field-label" style={{ fontSize: '10px' }}>Teks Satuan {newProdPreset !== 'Kustom' && '(Terkunci)'}</label>
                  <input
                    id="np-unit"
                    type="text"
                    disabled={newProdPreset !== 'Kustom'}
                    className="field-input"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    style={{ opacity: newProdPreset !== 'Kustom' ? 0.7 : 1 }}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="np-packsize" className="field-label" style={{ fontSize: '10px' }}>Isi per Kemasan (pcs)</label>
                  <input
                    id="np-packsize"
                    type="number"
                    min="1"
                    disabled={newProdPreset !== 'Kustom'}
                    className="field-input"
                    value={newProdPackSize}
                    onChange={(e) => setNewProdPackSize(Math.max(1, Number(e.target.value) || 1))}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    style={{ opacity: newProdPreset !== 'Kustom' ? 0.7 : 1 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="np-sell" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                Harga Jual Satuan (Rp / pcs) *
              </label>
              <input
                id="np-sell"
                type="number"
                min="0"
                step="500"
                className="field-input"
                placeholder="Contoh: 3500"
                value={newProdSellingPrice}
                onChange={(e) => setNewProdSellingPrice(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="np-cost" style={{ fontSize: '11px', fontWeight: 800 }}>
                  Modal Kemasan Pembelian (Rp) (Opsional):
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newProdIsCostUnknown}
                    onChange={(e) => setNewProdIsCostUnknown(e.target.checked)}
                  />
                  <span>Modal belum diketahui</span>
                </label>
              </div>
              {!newProdIsCostUnknown ? (
                <input
                  id="np-cost"
                  type="number"
                  min="0"
                  step="1000"
                  className="field-input"
                  placeholder="Contoh: 96.000 (Opsional)"
                  value={newProdCostPerPack}
                  onChange={(e) => setNewProdCostPerPack(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ padding: '6px 8px', background: '#fef3c7', borderRadius: '4px', fontSize: '11px', color: '#b45309' }}>
                  Modal disimpan sebagai <strong>null</strong>. Keuntungan tidak akan difiktifkan.
                </div>
              )}
            </div>

            {/* 1-Line Preview: Untung per pcs dengan ⓘ */}
            {(() => {
              const sellNum = Number(newProdSellingPrice) || 0;
              const costNum = !newProdIsCostUnknown && Number(newProdCostPerPack) > 0 ? Number(newProdCostPerPack) : null;
              const costPerUnit = costNum !== null ? Math.round(costNum / (newProdPackSize || 1)) : null;
              const unitProfit = sellNum > 0 && costPerUnit !== null ? sellNum - costPerUnit : null;

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--line)', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Untung per pcs:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {unitProfit !== null ? (
                      <>
                        <strong style={{ fontSize: '12px', color: unitProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          Rp {new Intl.NumberFormat('id-ID').format(unitProfit)}
                        </strong>
                        <InfoButton
                          size={12}
                          onClick={() => setDetailModal({
                            title: 'Estimasi Untung per Pcs',
                            formula: 'Harga jual per pcs − Modal beli per pcs',
                            rows: [
                              { label: 'Harga jual satuan', value: `+Rp ${new Intl.NumberFormat('id-ID').format(sellNum)}` },
                              { label: `Modal beli per pcs (${newProdCostPerPack ? `Rp ${new Intl.NumberFormat('id-ID').format(costNum || 0)} / ${newProdPackSize}` : 'Belum diketahui'})`, value: `-Rp ${new Intl.NumberFormat('id-ID').format(costPerUnit || 0)}`, isNegative: true },
                              { label: 'Untung per pcs', value: `Rp ${new Intl.NumberFormat('id-ID').format(unitProfit)}`, isHighlight: true },
                            ],
                            note: 'Modal per pcs didapat dari harga kemasan dibagi isi per kemasan.',
                          })}
                          label="Rincian untung produk baru"
                        />
                      </>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {sellNum > 0 ? 'Modal belum diisi' : 'Masukkan harga jual'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddProduct}
                style={{ minHeight: '44px', width: '100%' }}
              >
                Daftarkan Produk Baru →
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowAddProductModal(false)}
                style={{ minHeight: '40px', fontSize: '11px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Rincian Hitungan Kas Toko & Setoran ("Kenapa angka ini?") */}
      {showCalculationWhyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="why-calc-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="var(--blue)" />
                <h3 id="why-calc-title" className="form-card-title" style={{ margin: 0 }}>Rincian Hitungan Kas Toko</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculationWhyModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog rincian"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 14px 0' }}>
              Perhitungan transparan kas yang seharusnya ada di laci kasir dan siap disetorkan karyawan:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div className="summary-box-row">
                <span>1. Penjualan dari selisih cek stok:</span>
                <strong style={{ color: 'var(--green)' }}>
                  +Rp {new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}
                </strong>
              </div>
              <div className="summary-box-row">
                <span>2. Biaya operasional toko (uang laci):</span>
                <strong style={{ color: 'var(--red)' }}>
                  -Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}
                </strong>
              </div>
              <div className="summary-box-row">
                <span>3. Belanja barang (diputar dari setoran):</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  Tidak memotong setoran karyawan
                </span>
              </div>
              <div className="summary-box-row" style={{ paddingTop: '8px', borderTop: '1.5px solid var(--ink)' }}>
                <span style={{ fontWeight: 900 }}>Uang Kas Siap Setor Saat Ini:</span>
                <strong style={{ fontSize: '15px', color: 'var(--blue)' }}>
                  = Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}
                </strong>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '11px', color: 'var(--ink)', marginBottom: '16px' }}>
              <strong>Prinsip:</strong>
              <p style={{ marginTop: '2px', color: 'var(--muted)' }}>
                Jika karyawan menyerahkan nominal yang berbeda dengan angka di atas, selisihnya akan dicatat secara jujur sebagai Kurang atau Lebih tanpa mengubah catatan penjualan riil.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCalculationWhyModal(false)}
              style={{ minHeight: '44px', width: '100%' }}
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog: Hasil Transaksi Disimpan & Tombol Urungkan (Undo) */}
      {saveResultModal?.isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="save-result-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} color="var(--green)" />
                <h3 id="save-result-title" className="form-card-title" style={{ margin: 0 }}>{saveResultModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSaveResultModal(null)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog hasil"
              >
                ✕
              </button>
            </div>

            {saveResultModal.notes && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 14px 0' }}>
                {saveResultModal.notes}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {saveResultModal.itemsChecked !== undefined && (
                <div className="summary-box-row">
                  <span>Barang diperiksa:</span>
                  <strong>{saveResultModal.itemsChecked} item</strong>
                </div>
              )}
              {saveResultModal.unitsSold !== undefined && (
                <div className="summary-box-row">
                  <span>Total terjual:</span>
                  <strong style={{ color: 'var(--green)' }}>{saveResultModal.unitsSold} pcs</strong>
                </div>
              )}
              {saveResultModal.salesRevenue !== undefined && (
                <div className="summary-box-row">
                  <span>Nilai penjualan terhitung:</span>
                  <strong>Rp {new Intl.NumberFormat('id-ID').format(saveResultModal.salesRevenue)}</strong>
                </div>
              )}
              {saveResultModal.cogsKnown !== undefined && saveResultModal.cogsKnown > 0 && (
                <div className="summary-box-row">
                  <span>Modal barang terjual:</span>
                  <strong style={{ color: 'var(--muted)' }}>Rp {new Intl.NumberFormat('id-ID').format(saveResultModal.cogsKnown)}</strong>
                </div>
              )}
              {saveResultModal.grossProfit !== undefined && saveResultModal.grossProfit !== null && saveResultModal.grossProfit > 0 && (
                <div className="summary-box-row" style={{ paddingTop: '6px', borderTop: '1px dashed var(--line)' }}>
                  <span style={{ fontWeight: 800 }}>Estimasi laba kotor:</span>
                  <strong style={{ color: 'var(--green)', fontSize: '14px' }}>
                    +Rp {new Intl.NumberFormat('id-ID').format(saveResultModal.grossProfit)}
                  </strong>
                </div>
              )}
              {saveResultModal.certainty && (
                <div className="summary-box-row">
                  <span>Tingkat kepastian:</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: saveResultModal.certainty === 'PASTI' ? '#eafbe3' : 'var(--amber-pale)',
                    color: 'var(--ink)'
                  }}>
                    {saveResultModal.certainty === 'PASTI' ? '✓ Pasti' : 'Perlu Diperiksa'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSaveResultModal(null)}
                style={{ minHeight: '44px' }}
              >
                Selesai
              </button>
              {saveResultModal.previousPayload && (
                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={handleUndoSave}
                  style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--red)' }}
                >
                  <RotateCcw size={15} />
                  <span>Urungkan (Undo)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Rincian Angka Keuangan (Bottom Sheet / ModalForm style) */}
      {detailModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} color="var(--blue)" />
                <h3 className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>{detailModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog rincian"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--line)', marginBottom: '12px', fontSize: '11px', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--ink)' }}>Rumus: </strong>
              <span>{detailModal.formula}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {detailModal.rows.map((row, idx) => (
                <div
                  key={idx}
                  className="summary-box-row"
                  style={{
                    paddingTop: row.isHighlight ? '8px' : '4px',
                    borderTop: row.isHighlight ? '1.5px solid var(--ink)' : 'none',
                    fontWeight: row.isHighlight ? 800 : 500,
                  }}
                >
                  <span>{row.label}</span>
                  <strong style={{ color: row.isNegative ? 'var(--red)' : row.isHighlight ? 'var(--ink)' : undefined }}>
                    {row.value}
                  </strong>
                </div>
              ))}
            </div>

            {detailModal.note && (
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                {detailModal.note}
              </p>
            )}

            {detailModal.showItemsLink && detailModal.itemsBreakdown && detailModal.itemsBreakdown.length > 0 && (
              <button
                type="button"
                className="btn btn-paper"
                style={{ width: '100%', minHeight: '38px', fontSize: '11px', marginBottom: '10px' }}
                onClick={() => {
                  setShowItemsBreakdownModal(detailModal.itemsBreakdown || []);
                }}
              >
                Lihat rincian barang ({detailModal.itemsBreakdown.length} item) →
              </button>
            )}

            {detailModal.deleteAction && (
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => {
                  detailModal.deleteAction?.();
                  setDetailModal(null);
                }}
                style={{ width: '100%', minHeight: '38px', fontSize: '11px', marginBottom: '10px', color: 'var(--red)', borderColor: '#ffd0c4' }}
              >
                🗑️ {detailModal.deleteLabel || 'Hapus Catatan Ini'}
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setDetailModal(null)}
              style={{ minHeight: '44px', width: '100%' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog: Rincian Penjualan per Barang */}
      {showItemsBreakdownModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 10000, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="form-card-title" style={{ margin: 0, fontSize: '14px' }}>Rincian Penjualan Barang</h3>
              <button
                type="button"
                onClick={() => setShowItemsBreakdownModal(null)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup rincian barang"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {showItemsBreakdownModal.map((item, idx) => (
                <div key={idx} className="summary-box-row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{item.calculation}</div>
                  </div>
                  <strong style={{ fontSize: '12px' }}>{item.total}</strong>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowItemsBreakdownModal(null)}
              style={{ minHeight: '44px', width: '100%' }}
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog: Cek & Ubah Harga Jual saat Modal Naik */}
      {showPriceCheckModal && (() => {
        const oldModalPerPcs = getProductLatestUnitCost(selectedProduct.id, docPayload, catalogList);
        const isKemasan = purchaseUnit !== 'pcs';
        const piecesToAdd = isKemasan ? purchaseQty * selectedProduct.packSize : purchaseQty;
        const defaultCostPerPack = selectedProduct.costPerPack ?? (oldModalPerPcs ? oldModalPerPcs * selectedProduct.packSize : 0);
        const defaultTotal = defaultCostPerPack > 0
          ? (isKemasan ? purchaseQty * defaultCostPerPack : Math.round((purchaseQty * defaultCostPerPack) / selectedProduct.packSize))
          : 0;
        const totalCost = customPurchaseCost !== '' ? parseRupiahInput(customPurchaseCost) : defaultTotal;
        const newModalPerPcs = piecesToAdd > 0 ? Math.round(totalCost / piecesToAdd) : 0;
        const newSellPrice = Math.max(0, parseRupiahInput(newSellingPriceInput));
        const currentMargin = selectedProduct.sellingPricePerUnit - newModalPerPcs;
        const newMargin = newSellPrice - newModalPerPcs;

        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 10000, padding: '16px' }}>
            <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{selectedProduct.icon}</span>
                  <h3 className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>Cek Harga Jual — {selectedProduct.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPriceCheckModal(false)}
                  style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                  aria-label="Tutup"
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', background: '#f4f4f5', padding: '10px 12px', borderRadius: '8px' }}>
                <div className="summary-box-row">
                  <span>Modal lama:</span>
                  <strong style={{ color: 'var(--muted)' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(oldModalPerPcs ?? 0)} / pcs
                  </strong>
                </div>
                <div className="summary-box-row">
                  <span>Modal baru belanja:</span>
                  <strong style={{ color: 'var(--orange)' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(newModalPerPcs)} / pcs
                  </strong>
                </div>
                <div className="summary-box-row">
                  <span>Harga jual saat ini:</span>
                  <strong>Rp {new Intl.NumberFormat('id-ID').format(selectedProduct.sellingPricePerUnit)} / pcs</strong>
                </div>
                <div className="summary-box-row" style={{ paddingTop: '6px', borderTop: '1px dashed var(--line)' }}>
                  <span>Untung kotor saat ini:</span>
                  <strong style={{ color: currentMargin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(currentMargin)} / pcs
                  </strong>
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: '14px' }}>
                <label className="field-label" htmlFor="new-sell-price">
                  Perbarui Harga Jual (Rp / pcs)
                </label>
                <input
                  id="new-sell-price"
                  type="text"
                  inputMode="numeric"
                  className="field-input"
                  placeholder={`Contoh: ${selectedProduct.sellingPricePerUnit}`}
                  value={newSellingPriceInput ? formatRupiahInput(newSellingPriceInput) : ''}
                  onChange={(e) => setNewSellingPriceInput(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
                {newSellPrice > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Untung baru: <strong style={{ color: newMargin >= 0 ? 'var(--green)' : 'var(--red)' }}>Rp {new Intl.NumberFormat('id-ID').format(newMargin)} / pcs</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleUpdateSellingPrice(newSellPrice)}
                  disabled={newSellPrice <= 0}
                  style={{ minHeight: '44px' }}
                >
                  Simpan Harga
                </button>
                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={() => setShowPriceCheckModal(false)}
                  style={{ minHeight: '44px' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Dialog: Catat Ambil Uang Pribadi (Private Vault Withdrawal) */}
      {showWithdrawModal && (
        <div className="modal-backdrop modal-backdrop-frosted" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="executive-modal-box" style={{ maxWidth: '440px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(32, 33, 31, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={19} color="var(--orange)" />
                <h3 className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>Ambil Uang Toko (Pribadi)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="prive-intro-banner">
              <div className="prive-intro-title">
                <Wallet size={15} color="var(--orange)" />
                <span>Pengambilan Pribadi (Prive)</span>
              </div>
              <p className="prive-intro-desc">
                Dicatat terpisah dari modal dan operasional toko agar laba harian tetap akurat.
              </p>
            </div>

            {/* Quick Amount Chips */}
            <div style={{ marginBottom: '6px', fontSize: '10.5px', fontWeight: 850, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
              Pilih / Tambah Nominal Cepat:
            </div>
            <div className="quick-amount-grid">
              {[50000, 100000, 200000, 500000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  className="quick-amount-chip"
                  onClick={() => {
                    const curr = parseRupiahInput(withdrawAmountStr) || 0;
                    const nextVal = curr + amt;
                    setWithdrawAmountStr(formatRupiahInput(String(nextVal)));
                  }}
                >
                  +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                </button>
              ))}
            </div>

            <div className="field-group" style={{ marginBottom: '14px' }}>
              <label className="field-label" htmlFor="with-amount" style={{ fontSize: '11px', fontWeight: 800 }}>
                Nominal Ambil Uang (Rp)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', fontSize: '14px', fontWeight: 900, color: 'var(--muted)' }}>Rp</span>
                <input
                  id="with-amount"
                  type="text"
                  inputMode="numeric"
                  className="field-input"
                  placeholder="0"
                  value={withdrawAmountStr ? formatRupiahInput(withdrawAmountStr) : ''}
                  onChange={(e) => setWithdrawAmountStr(formatRupiahInput(e.target.value))}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  style={{ paddingLeft: '38px', height: '44px', fontSize: '16px', fontWeight: 900, borderRadius: '12px' }}
                />
                {withdrawAmountStr && (
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountStr('')}
                    style={{ position: 'absolute', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(32, 33, 31, 0.08)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 900 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Reason Chips */}
            <div style={{ marginBottom: '6px', fontSize: '10.5px', fontWeight: 850, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
              Keperluan Cepat:
            </div>
            <div className="quick-chips-row" style={{ marginBottom: '10px' }}>
              {['Rumah Tangga', 'Gaji Pemilik', 'Keperluan Darurat', 'Belanja Pribadi'].map(reason => (
                <button
                  key={reason}
                  type="button"
                  className={`quick-chip-btn ${withdrawNote === reason ? 'active' : ''}`}
                  onClick={() => setWithdrawNote(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="field-group" style={{ marginBottom: '18px' }}>
              <label className="field-label" htmlFor="with-note" style={{ fontSize: '11px', fontWeight: 800 }}>
                Catatan / Keterangan Tambahan
              </label>
              <input
                id="with-note"
                type="text"
                className="field-input"
                placeholder="Contoh: Belanja dapur bulanan"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                style={{ height: '42px', borderRadius: '12px', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveWithdrawal}
                style={{ minHeight: '48px', width: '100%', fontSize: '13.5px', fontWeight: 900, borderRadius: '14px' }}
              >
                Simpan Pengambilan Uang
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowWithdrawModal(false)}
                style={{ minHeight: '42px', fontSize: '12px', borderRadius: '12px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Catat Pemasukan Lain */}
      {showOtherIncomeModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--green)" />
                <h3 className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>Catat Pemasukan Lain</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOtherIncomeModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px 0' }}>
              Pemasukan sampingan toko (jasa seduh, titipan, dll). Masuk ke Untung Bersih dan Setoran Seharusnya.
            </p>

            <div className="field-group" style={{ marginBottom: '12px' }}>
              <label className="field-label" htmlFor="inc-name">Nama Pemasukan</label>
              <input
                id="inc-name"
                type="text"
                className="field-input"
                placeholder="Contoh: Jasa seduh mie"
                value={otherIncomeName}
                onChange={(e) => setOtherIncomeName(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
            </div>

            <div className="form-row-pair" style={{ marginBottom: '12px' }}>
              <div className="field-group">
                <label className="field-label" htmlFor="inc-nominal">Nominal (Rp / kali)</label>
                <input
                  id="inc-nominal"
                  type="text"
                  inputMode="numeric"
                  className="field-input"
                  placeholder="2.000"
                  value={otherIncomeNominalStr ? formatRupiahInput(otherIncomeNominalStr) : ''}
                  onChange={(e) => setOtherIncomeNominalStr(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="inc-qty">Jumlah kali</label>
                <input
                  id="inc-qty"
                  type="number"
                  min="1"
                  className="field-input"
                  value={otherIncomeQty}
                  onChange={(e) => setOtherIncomeQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
              </div>
            </div>

            {/* Total Ringkasan */}
            {(() => {
              const nom = parseRupiahInput(otherIncomeNominalStr);
              const total = nom * Math.max(1, otherIncomeQty);
              return (
                <div style={{ padding: '8px 10px', background: '#f4f4f5', borderRadius: '6px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Total pemasukan:</span>
                  <strong style={{ fontSize: '13px', color: 'var(--green)' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(total)}
                  </strong>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveOtherIncome}
                style={{ minHeight: '44px', width: '100%' }}
              >
                Simpan Pemasukan
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowOtherIncomeModal(false)}
                style={{ minHeight: '40px', fontSize: '11px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Catat Barang Rusak (Executive Stock Adjustment Docket) */}
      {showDamageModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDamageModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.68)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            className="form-card"
            style={{
              maxWidth: '430px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '22px',
              border: '2px solid var(--ink)',
              boxShadow: '0 24px 64px -12px rgba(0,0,0,0.45)',
              padding: '18px 20px'
            }}
          >
            {/* Header with Luxury Docket Guilloché & Monoline Security Stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)', border: '1.5px solid rgba(239, 68, 68, 0.3)', display: 'grid', placeItems: 'center', color: '#dc2626', flexShrink: 0, boxShadow: '0 2px 0 rgba(239, 68, 68, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                    <line x1="8.5" y1="14" x2="15.5" y2="18" stroke="#ef4444" strokeWidth="2.4" />
                    <circle cx="12" cy="7" r="1.5" fill="#dc2626" />
                  </svg>
                </div>
                <div>
                  <h3 className="form-card-title" style={{ margin: 0, fontSize: '16.5px', fontWeight: 900, letterSpacing: '-0.01em' }}>
                    Catat Barang Rusak
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span>DOKET PENYESUAIAN STOK</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: '#dc2626' }}>NO. ADJ-8820</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDamageModal(false)}
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '11px',
                  border: '1.5px solid var(--ink)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '15px',
                  fontWeight: 950,
                  cursor: 'pointer',
                  boxShadow: '0 2px 0 var(--ink)'
                }}
                aria-label="Tutup dialog"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '0 0 14px 0', lineHeight: 1.45 }}>
              Formulir penyesuaian inventaris fisik. Memotong stok tercatat tanpa omzet penjualan dan dibukukan sebagai beban rugi operasional di Laporan.
            </p>

            {/* Product Selector */}
            <div className="field-group" style={{ marginBottom: '12px' }}>
              <label className="field-label" htmlFor="dmg-prod" style={{ fontSize: '10px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pilih Barang yang Rusak
              </label>
              <select
                id="dmg-prod"
                className="field-select"
                value={damageProductId}
                onChange={(e) => setDamageProductId(e.target.value)}
                style={{ borderRadius: '12px', border: '1.5px solid var(--ink)', height: '44px', fontWeight: 750, fontSize: '13.5px' }}
              >
                {catalogList.map((p) => {
                  const avail = storeSummary.stockByProduct.get(p.id)?.availableUnits ?? 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} (stok tersedia: {avail} pcs)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Live Specimen Preview & Stock Transition Meter */}
            {(() => {
              const selProd = catalogList.find(p => p.id === damageProductId) || catalogList[0];
              const avail = selProd ? (storeSummary.stockByProduct.get(selProd.id)?.availableUnits ?? 0) : 0;
              const unitCost = selProd && selProd.costPerPack !== null && selProd.packSize > 0
                ? Math.floor(selProd.costPerPack / selProd.packSize)
                : null;
              const estLoss = unitCost !== null ? damageQty * unitCost : null;
              const nextAvail = Math.max(0, avail - damageQty);

              return (
                <div className="damage-specimen-box" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div className="product-medallion" style={{ width: '40px', height: '40px', fontSize: '20px', borderRadius: '11px' }}>
                        {selProd?.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 850, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink)' }}>
                          {selProd?.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                          {selProd?.category || 'Toko'} {unitCost !== null && `· Modal Rp ${new Intl.NumberFormat('id-ID').format(unitCost)}/pcs`}
                        </div>
                      </div>
                    </div>
                    {estLoss !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '9px', fontWeight: 850, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Estimasi Rugi Modal
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                          -Rp {new Intl.NumberFormat('id-ID').format(estLoss)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stock Transition Flow */}
                  <div className="damage-transition-bar">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 750, textTransform: 'uppercase' }}>Tercatat</span>
                      <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>{avail} pcs</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#dc2626', fontWeight: 900, fontSize: '12px' }}>
                      <span>-{damageQty} rusak</span>
                      <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 750, textTransform: 'uppercase' }}>Sisa Baru</span>
                      <strong style={{ fontSize: '12px', color: nextAvail === 0 ? '#dc2626' : 'var(--ink)' }}>
                        {nextAvail} pcs
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quantity Input with Tactile Steppers & Quick Chips */}
            <div className="field-group" style={{ marginBottom: '14px' }}>
              <label className="field-label" htmlFor="dmg-qty" style={{ fontSize: '10px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Jumlah Barang Rusak (pcs)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="stepper-capsule stepper-control" style={{ width: '136px', flexShrink: 0, height: '44px' }}>
                  <button
                    type="button"
                    className="stepper-capsule-btn minus stepper-btn"
                    onClick={() => setDamageQty(Math.max(1, damageQty - 1))}
                    aria-label="Kurangi jumlah rusak"
                    style={{ height: '44px', width: '40px' }}
                  >
                    −
                  </button>
                  <input
                    id="dmg-qty"
                    type="number"
                    min="1"
                    className="stepper-capsule-input stepper-input"
                    value={damageQty}
                    onChange={(e) => setDamageQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    style={{ height: '44px' }}
                  />
                  <button
                    type="button"
                    className="stepper-capsule-btn plus stepper-btn"
                    onClick={() => setDamageQty(damageQty + 1)}
                    aria-label="Tambah jumlah rusak"
                    style={{ height: '44px', width: '40px' }}
                  >
                    +
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                  {[1, 5, 10].map(addVal => (
                    <button
                      key={addVal}
                      type="button"
                      onClick={() => setDamageQty(damageQty + addVal)}
                      style={{
                        height: '44px',
                        flex: 1,
                        borderRadius: '12px',
                        border: '1.5px solid var(--ink)',
                        background: 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 2px 0 var(--ink)',
                        whiteSpace: 'nowrap',
                        color: 'var(--ink)'
                      }}
                    >
                      +{addVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Reasons Selector (3 Segmented Pro Merchant Cards) */}
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label" style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kategori Alasan Kerusakan
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  {
                    key: 'rusak',
                    label: 'Pecah / Rusak',
                    caption: 'Jebol fisik',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <polyline points="3.29 7 12 12 20.71 7" />
                        <line x1="12" y1="22" x2="12" y2="12" />
                        <line x1="9" y1="13" x2="15" y2="17" stroke="#dc2626" strokeWidth="2" />
                      </svg>
                    )
                  },
                  {
                    key: 'cacat',
                    label: 'Cacat Pabrik',
                    caption: 'Bocor / expired',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )
                  },
                  {
                    key: 'dimakan tikus',
                    label: 'Dimakan Hama',
                    caption: 'Gigitan tikus',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    )
                  }
                ] as const).map((r) => {
                  const isSel = damageReason === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      className={`damage-reason-button ${isSel ? 'active' : ''}`}
                      onClick={() => setDamageReason(r.key)}
                    >
                      <div style={{ color: isSel ? '#dc2626' : 'var(--ink)' }}>{r.icon}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 850, lineHeight: 1.2, color: isSel ? '#dc2626' : 'var(--ink)' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--muted)', fontWeight: 600 }}>
                        {r.caption}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Perforated Tear Line */}
            <div className="damage-perforated-tear" />

            {/* Actions CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveDamagedProduct}
                style={{
                  minHeight: '48px',
                  width: '100%',
                  fontWeight: 900,
                  fontSize: '14px',
                  borderRadius: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(255, 90, 31, 0.35)'
                }}
              >
                <ShieldCheck size={18} />
                <span>Simpan Penyesuaian Rusak</span>
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowDamageModal(false)}
                style={{ minHeight: '40px', fontSize: '12px', fontWeight: 750, borderRadius: '12px' }}
              >
                Batal & Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Pilih Tanggal Acuan Ringkasan */}
      {showRingkasanDatePicker && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '380px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--blue)" />
                <h3 className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>Pilih Tanggal Acuan</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRingkasanDatePicker(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup pemilih tanggal"
              >
                ✕
              </button>
            </div>

            <div className="field-group" style={{ marginBottom: '14px' }}>
              <label className="field-label" htmlFor="ringkasan-date-input">Tanggal Acuan</label>
              <input
                id="ringkasan-date-input"
                type="date"
                className="field-input"
                value={ringkasanAnchorDate}
                onChange={(e) => {
                  if (e.target.value) setRingkasanAnchorDate(e.target.value);
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <button
                type="button"
                className="filter-chip"
                onClick={() => setRingkasanAnchorDate(new Date().toISOString().split('T')[0])}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                Hari Ini
              </button>
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  const d = new Date(Date.now() - 86400000);
                  setRingkasanAnchorDate(d.toISOString().split('T')[0]);
                }}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                Kemarin
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowRingkasanDatePicker(false)}
              style={{ minHeight: '44px', width: '100%' }}
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog: Konfirmasi Hapus Semua Data Contoh */}
      {showDeleteSampleModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '400px', width: '100%' }}>
            <h3 className="form-card-title" style={{ color: 'var(--red)', marginBottom: '8px' }}>Hapus Semua Data Contoh?</h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Tindakan ini hanya akan menghapus rekaman bertanda contoh (isSample). Seluruh data asli toko Anda tetap aman dan tidak akan terhapus.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowDeleteSampleModal(false)}
                style={{ minHeight: '44px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDeleteSample}
                style={{ minHeight: '44px', background: 'var(--red)', borderColor: 'var(--red)' }}
              >
                Ya, Hapus Contoh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastMessage && (() => {
        const isPositiveToast = /tersimpan|berhasil|dimuat|dipulihkan|tersinkron|cocok|disalin|terhubung/i.test(toastMessage);
        return (
          <div className="toast-notice" role="status" aria-live="polite">
            {isPositiveToast ? (
              <CheckCircle2 size={16} style={{ color: 'var(--lime)', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} style={{ color: '#ff9d66', flexShrink: 0 }} />
            )}
            <span>{toastMessage}</span>
          </div>
        );
      })()}

      {/* Cart Bottom Sheet Modal */}
      {showCartSheet && (
        <div
          className="detail-modal-overlay"
          onClick={() => setShowCartSheet(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keranjang Belanja"
        >
          <div
            className="detail-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>Keranjang ({purchaseCart.length})</h3>
              <button
                type="button"
                onClick={() => setShowCartSheet(false)}
                aria-label="Tutup keranjang"
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {purchaseCart.map((c) => {
                const prod = catalogList.find((p) => p.id === c.productId);
                const packUnit = prod?.unit.split(' ')[0] || prod?.unit || 'kemasan';
                return (
                  <div
                    key={c.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1.5px solid var(--line)',
                      borderRadius: '8px',
                      background: '#fff',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{prod?.name || c.productId}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        ×{c.qty} {c.unit === 'pcs' ? 'Pcs' : packUnit} · {c.sourceMoney === 'SETORAN' ? 'Untung toko' : 'Uang pribadi'}
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>
                        Rp{new Intl.NumberFormat('id-ID').format(c.totalCost)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => {
                          setShowCartSheet(false);
                          if (prod) handleOpenProductCard(prod);
                        }}
                        style={{ minHeight: '36px', padding: '4px 8px', fontSize: '11px', fontWeight: 800 }}
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => handleRemoveFromCart(c.productId)}
                        style={{ minHeight: '36px', padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: 'var(--red)', borderColor: '#ffd0c4' }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '2px solid var(--line)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>Total nota</span>
                <span style={{ fontSize: '16px', fontWeight: 900 }}>Rp{new Intl.NumberFormat('id-ID').format(cartTotalCost)}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAllCartPurchases}
                style={{ width: '100%', height: '48px', fontSize: '14px', fontWeight: 900, background: 'var(--orange)', color: '#fff' }}
              >
                Simpan semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Periode Berjalan Bottom Sheet Modal */}
      {showTimelineSheet && (() => {
        const filteredTimelineItems = currentPeriodData.items.filter(
          (it) => timelineFilter === 'semua' || it.type === timelineFilter
        );

        // Group by day (YYYY-MM-DD)
        const groupsMap = new Map<string, { dateKey: string; dateTitle: string; items: typeof currentPeriodData.items }>();
        filteredTimelineItems.forEach((it) => {
          const d = new Date(it.time);
          const dateKey = d.toISOString().split('T')[0];
          const dateTitle = new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }).format(d);

          if (!groupsMap.has(dateKey)) {
            groupsMap.set(dateKey, { dateKey, dateTitle, items: [] });
          }
          groupsMap.get(dateKey)!.items.push(it);
        });

        const dayGroups = Array.from(groupsMap.values());

        return (
          <div
            className="detail-modal-overlay"
            onClick={() => setShowTimelineSheet(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Garis Waktu Periode Berjalan"
          >
            <div
              className="detail-modal-sheet"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="sheet-handle" />

              {/* Sheet Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 2px 0' }}>
                    Periode Berjalan (Setoran ke-{currentPeriodData.depositNumber})
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Sejak {currentPeriodData.lastDeposit ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(currentPeriodData.lastDeposit.occurredAt)) : 'awal buka toko'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimelineSheet(false)}
                  aria-label="Tutup garis waktu"
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Filter Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
                {(['semua', 'belanja', 'cek stok', 'biaya', 'jasa', 'rusak'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-chip ${timelineFilter === f ? 'active' : ''}`}
                    onClick={() => setTimelineFilter(f)}
                    style={{ fontSize: '11px', padding: '4px 10px', minHeight: '30px', whiteSpace: 'nowrap' }}
                  >
                    {f === 'semua' ? 'Semua' : f === 'belanja' ? 'Belanja' : f === 'cek stok' ? 'Cek Stok' : f === 'biaya' ? 'Biaya' : f === 'jasa' ? 'Jasa' : 'Rusak'}
                  </button>
                ))}
              </div>

              {/* Timeline Items grouped by day */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '2px', marginBottom: '14px' }}>
                {dayGroups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: 'var(--muted)' }}>
                    Tidak ada aktivitas pada filter ini di periode berjalan.
                  </div>
                ) : (
                  dayGroups.map((group, gIdx) => {
                    const isExpanded = expandedDays[group.dateKey] !== undefined ? expandedDays[group.dateKey] : gIdx === dayGroups.length - 1;

                    return (
                      <div key={group.dateKey} style={{ border: '1.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                        {/* Day Group Accordion Header */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedDays((prev) => ({ ...prev, [group.dateKey]: !isExpanded }))}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--paper)',
                            borderBottom: isExpanded ? '1px solid var(--line)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <strong style={{ fontSize: '12px' }}>{group.dateTitle}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 800 }}>
                            {group.items.length} aktivitas {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>

                        {/* Day Items */}
                        {isExpanded && (
                          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: '#fafafa',
                                  border: '1px solid #f0f0f0',
                                }}
                              >
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: 'var(--muted)',
                                  marginTop: '2px',
                                  minWidth: '42px',
                                }}>
                                  {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.time))}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong style={{ fontSize: '12px' }}>{item.title}</strong>
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      background: item.type === 'belanja' ? '#ffebe6' : item.type === 'cek stok' ? '#eafbe3' : item.type === 'jasa' ? '#eafbe3' : item.type === 'rusak' ? '#ffebe6' : '#f4f4f5',
                                      color: 'var(--ink)',
                                    }}>
                                      {item.type}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--ink)', marginTop: '2px' }}>
                                    {item.desc}
                                  </div>
                                  {item.impactText && (
                                    <div style={{ fontSize: '10px', color: item.type === 'belanja' ? 'var(--orange)' : item.type === 'rusak' ? 'var(--red)' : 'var(--muted)', fontWeight: 700, marginTop: '2px' }}>
                                      {item.impactText}
                                    </div>
                                  )}
                                  {item.amountText && (
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: item.amountText.startsWith('+') ? 'var(--green)' : 'var(--red)', marginTop: '2px' }}>
                                      {item.amountText}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Node: Setoran ke-n */}
              <div style={{
                borderTop: '2px solid var(--line)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Setoran ke-{currentPeriodData.depositNumber}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {storeSummary.remainingDeposit > 0
                      ? `Sisa disetor: Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}`
                      : 'Setoran lengkap'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTimelineSheet(false);
                    setCurrentScreen('setoran');
                  }}
                  style={{ minHeight: '40px', padding: '0 14px', fontSize: '12px', fontWeight: 900 }}
                >
                  Setor Sekarang →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cart Sticky Bar (above floating dock) */}
      {currentScreen === 'catat' && purchaseCart.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(82px + env(safe-area-inset-bottom, 0px))',
            width: 'calc(100% - 24px)',
            maxWidth: '420px',
            height: '56px',
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            zIndex: 90,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowCartSheet(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800 }}>
              {purchaseCart.length} barang
            </span>
            <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--ink)' }}>
              Rp{new Intl.NumberFormat('id-ID').format(cartTotalCost)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAllCartPurchases}
            style={{
              height: '40px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: 900,
              background: 'var(--orange)',
              color: '#fff',
              borderRadius: '10px',
            }}
          >
            Simpan semua
          </button>
        </div>
      )}

      {/* 2026 Floating Glass Dock (Mobile Bottom Navigation) */}
      <nav className="dock-wrapper" aria-label="Navigasi Bawah">
        <div className="floating-dock">
          <button
            type="button"
            className={`dock-item ${primaryTab === 'beranda' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('beranda')}
            aria-current={primaryTab === 'beranda' ? 'page' : undefined}
          >
            <LayoutDashboard size={19} />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            className={`dock-item ${primaryTab === 'stok' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('stok')}
            aria-current={primaryTab === 'stok' ? 'page' : undefined}
          >
            <Boxes size={19} />
            <span>Stok</span>
          </button>

          <div className="dock-center-slot">
            <button
              type="button"
              className="dock-center-action"
              onClick={() => setCurrentScreen('catat')}
              aria-label="Catat Belanja"
            >
              <Plus size={24} strokeWidth={2.6} />
            </button>
          </div>

          <button
            type="button"
            className={`dock-item ${primaryTab === 'setoran' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('setoran')}
            aria-current={primaryTab === 'setoran' ? 'page' : undefined}
          >
            <ArrowLeftRight size={19} />
            <span>Setoran</span>
          </button>

          <button
            type="button"
            className={`dock-item ${primaryTab === 'lainnya' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('lainnya')}
            aria-current={primaryTab === 'lainnya' ? 'page' : undefined}
          >
            <SlidersHorizontal size={19} />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

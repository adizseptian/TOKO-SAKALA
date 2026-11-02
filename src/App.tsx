import { useState, useMemo, useEffect } from 'react';
import {
  Bell, ChevronRight, Calendar, AlertCircle, ShoppingCart,
  Package, Wallet, FileText, ArrowLeft, Search, SlidersHorizontal, Plus,
  Minus, Check, ArrowRight, CornerDownLeft, Sparkles, RefreshCw, Moon, Sun,
  Cloud, Database, ShieldCheck, History, HardDrive, KeyRound, ExternalLink,
  CheckCircle2, XCircle, Download, Upload, Server, RotateCcw, HelpCircle, Undo2,
  Info, ArrowUpDown
} from 'lucide-react';
import { ModalForm } from '@/components/ModalForm';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import { calculateStockCheckPreview } from '@/engine/v1/stock-check-preview';
import { runStoreFinancialEngine, type StoreFinancialSummary } from '@/engine/v1/engineBridge';
import {
  googleAuth,
  GoogleDriveAdapter,
  IndexedDBAdapter,
  SupabaseAdapter,
  SyncEngine,
  createDefaultPayload,
  migrateLegacyPayload,
  type AuthState,
  type BackupMetadata,
  type TokoSakalaPayload,
  type PurchaseRecord,
  type ExpenseRecord,
  type DepositRecord,
  type OwnerWithdrawalRecord,
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

  // Screen 2: Catat Belanja State
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
  const [expenseSourceMoney, setExpenseSourceMoney] = useState<'LACI' | 'PRIBADI'>('LACI');

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
  } | null>(null);
  const [showItemsBreakdownModal, setShowItemsBreakdownModal] = useState<Array<{ name: string; calculation: string; total: string }> | null>(null);

  // Internal Modals State
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [customDateInput, setCustomDateInput] = useState<string>('');
  const [showAmountModal, setShowAmountModal] = useState<boolean>(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState<boolean>(false);
  const [showCalculationWhyModal, setShowCalculationWhyModal] = useState<boolean>(false);

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

  const handleSavePurchase = async () => {
    const qty = Math.max(1, purchaseQty);
    const isKemasan = purchaseUnit !== 'pcs';
    const packSize = isKemasan ? selectedProduct.packSize : 1;
    const piecesToAdd = isKemasan ? qty * selectedProduct.packSize : qty;

    const computedCost = selectedProduct.costPerPack !== null
      ? (isKemasan
          ? qty * selectedProduct.costPerPack
          : Math.round((qty * selectedProduct.costPerPack) / selectedProduct.packSize))
      : Math.max(0, parseRupiahInput(customPurchaseCost));

    const totalCost = computedCost;
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

    for (const [pId, count] of entries) {
      const prod = catalogList.find(c => c.id === pId);
      if (!prod) continue;
      itemsCounted++;
      const currentAvailable = storeSummary.stockByProduct.get(pId)?.availableUnits ?? 0;
      const physicalCount = Number(count);

      newMovements.push({
        id: `mov-stock-${pId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        occurredAt: nowIso,
        productId: pId,
        type: 'CHECK_ADJUSTMENT' as const,
        quantity: physicalCount,
        unit: 'pcs',
        notes: `Cek fisik sisa stok: ${physicalCount} pcs (catatan: ${currentAvailable} pcs)`,
      });

      if (physicalCount < currentAvailable) {
        const soldUnits = currentAvailable - physicalCount;
        const totalSalesValue = soldUnits * prod.sellingPricePerUnit;
        const unitCost = prod.costPerPack !== null && prod.packSize > 0
          ? Math.floor(prod.costPerPack / prod.packSize)
          : null;

        totalPcsSold += soldUnits;
        totalSalesRevenue += totalSalesValue;
        if (unitCost !== null) {
          totalCogs += soldUnits * unitCost;
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
      setSaveResultModal({
        isOpen: true,
        title: 'Hasil Cek Sisa Stok Disimpan',
        itemsChecked: itemsCounted,
        unitsSold: totalPcsSold,
        salesRevenue: totalSalesRevenue,
        cogsKnown: totalCogs,
        grossProfit: totalSalesRevenue - totalCogs,
        certainty: storeSummary.certainty,
        notes: totalPcsSold > 0
          ? `${totalPcsSold} pcs terjual dihitung otomatis dari selisih catatan dan fisik.`
          : 'Sisa fisik sesuai atau lebih besar dari catatan. Tidak ada penjualan yang dihitung.',
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
      });
    });

    list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return list;
  }, [docPayload, catalogList]);

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
          <header className="mobile-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="mobile-brand">TOKO SAKALA</div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: syncStatus.lastError
                    ? '#ffebe6'
                    : syncStatus.pendingCount > 0
                    ? 'var(--amber-pale)'
                    : '#eafbe3',
                  color: 'var(--ink)',
                }}
              >
                {syncStatus.lastError
                  ? 'Gagal'
                  : syncStatus.isSyncing
                  ? 'Sinkron...'
                  : syncStatus.pendingCount > 0
                  ? 'Menunggu'
                  : supabaseAdapter.isConfigured()
                  ? 'Tersinkron'
                  : 'Tersimpan (lokal)'}
              </span>
            </div>
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
        {/* ======================================================== */}
        {/* SCREEN 1: BERANDA                                        */}
        {/* ======================================================== */}
        {currentScreen === 'beranda' && (
          <div>
            <div className="intro-greeting" style={{ marginBottom: '12px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 2px 0' }}>Halo, Juragan 👋</h1>
            </div>

            {/* Hero Card: Sisa disetor or Setoran lengkap */}
            {storeSummary.remainingDeposit > 0 ? (
              <div className="hero-card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Sisa disetor</span>
                    <InfoButton
                      onClick={() => setDetailModal({
                        title: 'Sisa Disetor',
                        formula: 'Setoran seharusnya − Setoran diterima sebelumnya',
                        rows: [
                          { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}` },
                          { label: 'Setoran diterima', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}`, isNegative: true },
                          { label: 'Sisa disetor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}`, isHighlight: true },
                        ],
                        note: 'Uang penjualan dikurangi biaya laci kasir yang belum disetor ke pemilik.',
                      })}
                      label="Rincian sisa disetor"
                    />
                  </div>

                  {storeSummary.certainty !== 'PASTI' && storeSummary.reviewReason && (
                    <span className="hero-pill-badge" style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--ink)' }}>
                      <span className="dot" style={{ background: 'var(--orange)' }} />
                      <span>{storeSummary.reviewReason}</span>
                    </span>
                  )}
                </div>

                <div className="hero-card-bottom">
                  <div className="hero-amount" style={{ color: '#fff' }}>
                    {storeSummary.certainty !== 'PASTI' && storeSummary.grossSales.min !== storeSummary.grossSales.max ? '≈ ' : ''}
                    Rp {new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}
                  </div>
                  <button
                    type="button"
                    className="hero-arrow-btn"
                    onClick={() => setCurrentScreen('setoran')}
                    aria-label="Buka setoran kasir"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-card" style={{ marginBottom: '12px', background: 'var(--paper)', border: '2px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} color="var(--green)" />
                    <strong style={{ fontSize: '15px' }}>Setoran lengkap</strong>
                    <InfoButton
                      onClick={() => setDetailModal({
                        title: 'Setoran Lengkap',
                        formula: 'Setoran seharusnya − Setoran diterima = Rp 0',
                        rows: [
                          { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}` },
                          { label: 'Setoran diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                          { label: 'Sisa disetor', value: 'Rp 0', isHighlight: true },
                        ],
                        note: 'Semua kewajiban uang setoran telah diterima lengkap.',
                      })}
                      label="Rincian setoran lengkap"
                    />
                  </div>

                  {storeSummary.certainty !== 'PASTI' && storeSummary.reviewReason && (
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: 'var(--amber-pale)', color: 'var(--ink)' }}>
                      {storeSummary.reviewReason}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Semua setoran kas toko sudah diterima pemilik.
                </div>
              </div>
            )}

            {/* Tiga Kartu Kecil: Penjualan, Untung, Uang di tangan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div className="form-card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>Penjualan</span>
                  <InfoButton
                    size={13}
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
                        title: 'Penjualan',
                        formula: 'Σ (terjual × harga jual)',
                        rows: [
                          { label: 'Total Penjualan', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}`, isHighlight: true },
                        ],
                        note: 'Dihitung dari selisih cek sisa stok fisik toko.',
                        showItemsLink: breakdown.length > 0,
                        itemsBreakdown: breakdown,
                      });
                    }}
                    label="Rincian Penjualan"
                  />
                </div>
                <strong style={{ fontSize: '12px', marginTop: '4px', wordBreak: 'break-word' }}>
                  {storeSummary.grossSales.min !== storeSummary.grossSales.max ? '≈ ' : ''}
                  Rp {new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}
                </strong>
              </div>

              <div className="form-card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>Untung</span>
                  <InfoButton
                    size={13}
                    onClick={() => setDetailModal({
                      title: 'Untung Bersih',
                      formula: 'Untung kotor − Seluruh biaya toko',
                      rows: [
                        { label: 'Penjualan', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}` },
                        { label: 'Modal terjual', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cogsKnown)}`, isNegative: true },
                        { label: 'Untung kotor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossProfit ? storeSummary.grossProfit.min : 0)}` },
                        { label: 'Biaya toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isNegative: true },
                        { label: 'Untung bersih', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.netProfit ? storeSummary.netProfit.min : 0)}`, isHighlight: true },
                      ],
                      note: storeSummary.cogsKnown === 0 && storeSummary.grossSales.min > 0 ? 'Sebagian modal barang belum diketahui.' : undefined,
                    })}
                    label="Rincian Untung"
                  />
                </div>
                <strong style={{ fontSize: '12px', marginTop: '4px', wordBreak: 'break-word', color: (storeSummary.netProfit?.min ?? 0) >= 0 ? 'var(--ink)' : 'var(--red)' }}>
                  {storeSummary.netProfit ? (
                    <>
                      {storeSummary.netProfit.min !== storeSummary.netProfit.max ? '≈ ' : ''}
                      Rp {new Intl.NumberFormat('id-ID').format(storeSummary.netProfit.min)}
                    </>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Belum pasti</span>
                  )}
                </strong>
              </div>

              <div className="form-card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>Uang di tangan</span>
                  <InfoButton
                    size={13}
                    onClick={() => setDetailModal({
                      title: 'Uang di Tangan Pemilik',
                      formula: 'Setoran diterima − Belanja dari setoran − Pengambilan pribadi',
                      rows: [
                        { label: 'Setoran diterima', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                        { label: 'Belanja dari setoran', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}`, isNegative: true },
                        { label: 'Pengambilan pribadi', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.ownerWithdrawalsTotal)}`, isNegative: true },
                        { label: 'Uang di tangan', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}`, isHighlight: true },
                      ],
                      note: 'Arus uang tunai riil yang saat ini dipegang pemilik toko.',
                    })}
                    label="Rincian Uang di tangan"
                  />
                </div>
                <strong style={{ fontSize: '12px', marginTop: '4px', wordBreak: 'break-word', color: storeSummary.cashInHand >= 0 ? 'var(--ink)' : 'var(--red)' }}>
                  Rp {new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}
                </strong>
              </div>
            </div>

            {/* Satu Kartu: Perputaran Modal */}
            <div className="form-card" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 className="form-card-title" style={{ margin: 0, fontSize: '12px' }}>Perputaran Modal</h3>
                <InfoButton
                  size={14}
                  onClick={() => setDetailModal({
                    title: 'Perputaran Modal',
                    formula: 'Modal kembali − Total belanja',
                    rows: [
                      { label: 'Modal kembali (HPP terjual)', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.modalKembali)}` },
                      { label: 'Dipakai belanja', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalPurchases)}`, isNegative: true },
                      {
                        label: 'Sisa dana belanja',
                        value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.remainingShoppingBudget)}`,
                        isHighlight: true,
                        isNegative: storeSummary.remainingShoppingBudget < 0,
                      },
                    ],
                    note: storeSummary.remainingShoppingBudget < 0
                      ? 'Belanja melebihi modal yang kembali. Dana belanja diambil dari untung.'
                      : 'Dana modal kembali masih cukup untuk perputaran belanja berikutnya.',
                  })}
                  label="Rincian Perputaran Modal"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px' }}>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: '10px' }}>Modal kembali</span>
                  <strong style={{ fontSize: '12px' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.modalKembali)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: '10px' }}>Dipakai belanja</span>
                  <strong style={{ fontSize: '12px' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.totalPurchases)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: '10px' }}>Sisa dana</span>
                  <strong style={{ fontSize: '12px', color: storeSummary.remainingShoppingBudget < 0 ? 'var(--red)' : 'var(--ink)' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(storeSummary.remainingShoppingBudget)}
                  </strong>
                  {storeSummary.remainingShoppingBudget < 0 && (
                    <span style={{ fontSize: '9px', color: 'var(--red)', display: 'block' }}>(diambil dari untung)</span>
                  )}
                </div>
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
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 3).map((act) => (
                    <div key={act.id} className="feed-row">
                      <div className={`feed-icon ${act.type === 'purchase' ? 'green' : act.type === 'deposit' ? 'blue' : 'grey'}`}>
                        {act.type === 'purchase' ? <ShoppingCart size={18} /> : act.type === 'deposit' ? <Wallet size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="feed-details">
                        <strong className="feed-title">{act.title}</strong>
                        <span className="feed-subtitle">{act.subtitle}</span>
                      </div>
                      <div className="feed-meta">
                        <span className="feed-time">{act.time}</span>
                        <strong className="feed-amount">Rp {new Intl.NumberFormat('id-ID').format(act.amount)}</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="feed-row">
                      <div className="feed-icon green">
                        <ShoppingCart size={18} />
                      </div>
                      <div className="feed-details">
                        <strong className="feed-title">Belanja barang</strong>
                        <span className="feed-subtitle">Indomie 5 dus (Contoh panduan)</span>
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
                        <span className="feed-subtitle">Listrik (Contoh panduan)</span>
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
                        <span className="feed-subtitle">Toko Nur (Contoh panduan)</span>
                      </div>
                      <div className="feed-meta">
                        <span className="feed-time">Kemarin</span>
                        <strong className="feed-amount">Rp 1.250.000</strong>
                      </div>
                    </div>
                  </>
                )}
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
                  placeholder="Cari barang di katalog..."
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

            {/* Product Selection List */}
            <div className="product-select-list">
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
                .slice(0, 8)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`product-select-card ${selectedProduct.id === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProduct(item);
                      showToast(`Memilih ${item.name}`);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedProduct(item);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      outline: selectedProduct.id === item.id ? '2px solid var(--orange)' : undefined,
                    }}
                    aria-label={`Pilih ${item.name}`}
                  >
                    <div className="product-thumb-image" aria-hidden="true">
                      {item.icon}
                    </div>
                    <div className="product-info-text">
                      <strong className="product-info-name">{item.name}</strong>
                      <span className="product-info-meta">
                        {item.category} · {item.unit}
                      </span>
                      {item.costPerPack !== null ? (
                        <strong className="product-info-price">
                          Rp {new Intl.NumberFormat('id-ID').format(item.costPerPack)}
                        </strong>
                      ) : (
                        <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-block', width: 'fit-content' }}>
                          Modal: Belum diketahui
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="add-circle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
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
            {/* Form Section: Jumlah & Satuan */}
            {(() => {
              const isKemasan = purchaseUnit !== 'pcs';
              const piecesToAdd = isKemasan ? purchaseQty * selectedProduct.packSize : purchaseQty;
              const totalCost = selectedProduct.costPerPack !== null
                ? (isKemasan
                    ? purchaseQty * selectedProduct.costPerPack
                    : Math.round((purchaseQty * selectedProduct.costPerPack) / selectedProduct.packSize))
                : parseRupiahInput(customPurchaseCost);

              return (
                <div className="form-card">
                  <h3 className="form-card-title">Jumlah & Satuan</h3>
                  <div className="form-row-pair" style={{ marginBottom: '12px' }}>
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
                      <select
                        id="p-unit"
                        className="field-select"
                        value={purchaseUnit}
                        onChange={(e) => setPurchaseUnit(e.target.value)}
                      >
                        <option value="kemasan">{selectedProduct.unit}</option>
                        <option value="pcs">Pcs (satuan isi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Sumber Uang Belanja */}
                  <div style={{ marginBottom: '14px' }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Sumber Uang</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className={`filter-chip ${purchaseSourceMoney === 'SETORAN' ? 'active' : ''}`}
                        onClick={() => {
                          setPurchaseSourceMoney('SETORAN');
                          if (typeof localStorage !== 'undefined') localStorage.setItem('toko_sakala_belanja_source', 'SETORAN');
                        }}
                      >
                        Dari setoran (diputar)
                      </button>
                      <button
                        type="button"
                        className={`filter-chip ${purchaseSourceMoney === 'PRIBADI' ? 'active' : ''}`}
                        onClick={() => {
                          setPurchaseSourceMoney('PRIBADI');
                          if (typeof localStorage !== 'undefined') localStorage.setItem('toko_sakala_belanja_source', 'PRIBADI');
                        }}
                      >
                        Uang lain (pribadi)
                      </button>
                    </div>
                  </div>

                  {/* Jika modal kemasan belum ada di master katalog */}
                  {selectedProduct.costPerPack === null && (
                    <div style={{ marginBottom: '12px' }}>
                      <label htmlFor="p-custom-cost" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Nominal Belanja Nota (Rp)
                      </label>
                      <input
                        id="p-custom-cost"
                        type="text"
                        className="field-input"
                        placeholder="Contoh: 150.000"
                        value={customPurchaseCost ? formatRupiahInput(customPurchaseCost) : ''}
                        onChange={(e) => setCustomPurchaseCost(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {/* Ringkasan Satu Baris dengan ⓘ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f4f4f5', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                        +{piecesToAdd} pcs · Rp {new Intl.NumberFormat('id-ID').format(totalCost)}
                      </span>
                    </div>
                    <InfoButton
                      onClick={() => setDetailModal({
                        title: 'Ringkasan Belanja',
                        formula: isKemasan ? 'jumlah × harga kemasan' : 'jumlah × (harga kemasan ÷ isi per kemasan)',
                        rows: [
                          { label: 'Jumlah barang', value: `${purchaseQty} ${isKemasan ? selectedProduct.unit : 'pcs'}` },
                          { label: 'Konversi fisik masuk', value: `+${piecesToAdd} pcs` },
                          { label: 'Harga per satuan', value: `Rp ${new Intl.NumberFormat('id-ID').format(isKemasan ? (selectedProduct.costPerPack ?? 0) : Math.round((selectedProduct.costPerPack ?? 0) / selectedProduct.packSize))}` },
                          { label: 'Total belanja', value: `Rp ${new Intl.NumberFormat('id-ID').format(totalCost)}`, isHighlight: true },
                          { label: 'Sumber dana', value: purchaseSourceMoney === 'SETORAN' ? 'Uang setoran diputar' : 'Uang lain/pribadi' },
                        ],
                        note: 'Belanja dari uang setoran tidak memotong kewajiban setoran karyawan di laci toko.',
                      })}
                      label="Rincian ringkasan belanja"
                    />
                  </div>

                  {/* CTA: Simpan Pembelian ke Penyimpanan */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSavePurchase}
                    style={{ width: '100%', minHeight: '44px' }}
                  >
                    Simpan Belanja (+{piecesToAdd} pcs) →
                  </button>
                </div>
              );
            })()}
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
              {catalogList.filter((item) => {
                const matchCat = stokCategory === 'Semua' || item.category === stokCategory;
                const matchSearch = item.name.toLowerCase().includes(stokSearch.toLowerCase());
                return matchCat && matchSearch;
              }).map((item) => {
                const currentAvailable = storeSummary.stockByProduct.get(item.id)?.availableUnits ?? 0;
                const count = stockCounts[item.id];
                const isFilled = count !== null && count !== undefined;
                let statusLabel = 'Belum diisi';
                let statusClass = 'neutral';
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
                    statusLabel = `Terjual ${previewSold} pcs`;
                    statusClass = 'good';
                  } else if (numCount > currentAvailable) {
                    statusLabel = `Lebih ${numCount - currentAvailable} pcs`;
                    statusClass = 'warn';
                  } else {
                    statusLabel = 'Sama (0 terjual)';
                    statusClass = 'neutral';
                  }
                }

                const packHelper = item.packSize > 1
                  ? `${Math.floor(currentAvailable / item.packSize)} ${item.unit.split(' ')[0]}${currentAvailable % item.packSize > 0 ? ` + ${currentAvailable % item.packSize} pcs` : ''}`
                  : null;

                const isCheckedToday = checkedTodayIds.has(item.id);
                const physicalVal = isFilled ? Number(count) : currentAvailable;
                const soldVal = Math.max(0, currentAvailable - physicalVal);

                return (
                  <div key={item.id} className="stock-check-card" style={{ padding: '10px 12px' }}>
                    <div className="stock-card-top" style={{ alignItems: 'center' }}>
                      <div className="product-thumb-image" aria-hidden="true">
                        {item.icon}
                      </div>
                      <div className="stock-card-body">
                        <div className="stock-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 900 }}>{item.name}</span>
                          {isCheckedToday && (
                            <span className="status-tag good" style={{ fontSize: '10px', padding: '1px 6px' }}>
                              ✓ Dicek hari ini
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Catatan: {currentAvailable} pcs</span>
                          <InfoButton
                            size={13}
                            onClick={() => setDetailModal({
                              title: `Cek Sisa — ${item.name}`,
                              formula: 'Terjual = Catatan − Sisa fisik',
                              rows: [
                                { label: 'Catatan stok', value: `${currentAvailable} pcs` },
                                { label: 'Sisa fisik diinput', value: `${physicalVal} pcs` },
                                { label: 'Terjual', value: `${soldVal} pcs`, isHighlight: true },
                                { label: 'Penjualan', value: `Rp ${new Intl.NumberFormat('id-ID').format(soldVal * item.sellingPricePerUnit)}` },
                              ],
                              note: soldVal > 0
                                ? `Menghasilkan estimasi penjualan Rp ${new Intl.NumberFormat('id-ID').format(soldVal * item.sellingPricePerUnit)}.`
                                : 'Tidak ada penjualan baru yang dihitung.',
                            })}
                            label={`Rincian stok ${item.name}`}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <div className="stepper-control">
                          <button
                            type="button"
                            className="stepper-btn"
                            aria-label={`Kurangi ${item.name}`}
                            onClick={() => {
                              setStockCounts(prev => ({
                                ...prev,
                                [item.id]: Math.max(0, (prev[item.id] ?? currentAvailable) - 1)
                              }));
                            }}
                          >
                            −
                          </button>
                          <input
                            type="text"
                            className="stepper-input"
                            aria-label={`Sisa fisik ${item.name}`}
                            value={isFilled ? count : currentAvailable}
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
                            className="stepper-btn"
                            aria-label={`Tambah ${item.name}`}
                            onClick={() => {
                              setStockCounts(prev => ({
                                ...prev,
                                [item.id]: (prev[item.id] ?? currentAvailable) + 1
                              }));
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Footer: Total item diperiksa & Simpan */}
            <div className="sticky-footer-bar">
              <div className="sticky-footer-label">
                <span>Total item diperiksa</span>
                <strong>
                  {Object.values(stockCounts).filter(v => v !== null).length} / {catalogList.length}
                </strong>
              </div>
              <button
                type="button"
                className="btn btn-dark"
                style={{ minHeight: '44px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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

          return (
            <div>
              {/* Date Chip Selector: Hari ini / Kemarin / Pilih tanggal */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`filter-chip ${selectedDateTab === 'HARI_INI' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDateTab('HARI_INI');
                    setDepositDate(new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()));
                    setDepositDateIso(new Date().toISOString());
                  }}
                >
                  Hari ini
                </button>
                <button
                  type="button"
                  className={`filter-chip ${selectedDateTab === 'KEMARIN' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDateTab('KEMARIN');
                    const yest = new Date(Date.now() - 86400000);
                    setDepositDate(new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(yest));
                    setDepositDateIso(yest.toISOString());
                  }}
                >
                  Kemarin
                </button>
                <button
                  type="button"
                  className={`filter-chip ${selectedDateTab === 'PILIH_TANGGAL' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDateTab('PILIH_TANGGAL');
                    setCustomDateInput(new Date().toISOString().split('T')[0]);
                    setShowDateModal(true);
                  }}
                >
                  Pilih tanggal
                </button>
              </div>

              {/* Status Header Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Status Penyerahan</span>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: statusBg, color: statusColor }}>
                  {statusTag}
                </span>
              </div>

              {/* Banner hanya muncul jika ada selisih nyata atau masalah kepastian setelah uang dihitung */}
              {isCashCounted && (discrepancy !== 0 || storeSummary.certainty !== 'PASTI') && (
                <div className="warning-callout" style={{ marginBottom: '12px' }}>
                  <div className="warning-callout-icon">!</div>
                  <div style={{ fontSize: '11px' }}>
                    {storeSummary.certainty !== 'PASTI'
                      ? `Perhatian: ${storeSummary.reviewReason || 'Angka penjualan belum final'}. Cek modal/cek sisa terlebih dahulu.`
                      : discrepancy < 0
                      ? `Uang fisik kurang Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(discrepancy))}. Tanyakan nota darurat atau uang di kasir.`
                      : `Uang fisik lebih Rp ${new Intl.NumberFormat('id-ID').format(discrepancy)} dari perhitungan.`}
                  </div>
                </div>
              )}

              {/* Hitung Uang Fisik Terlebih Dahulu */}
              <div className="form-card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 className="form-card-title" style={{ margin: 0, fontSize: '13px' }}>Hitung Uang Fisik</h3>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setShowDenominations(!showDenominations)}
                    style={{ fontSize: '11px', padding: '4px 8px', minHeight: '32px' }}
                  >
                    {showDenominations ? 'Tutup Pecahan' : 'Buka Stepper Pecahan'}
                  </button>
                </div>

                <div className="field-group" style={{ marginBottom: showDenominations ? '12px' : '0' }}>
                  <label htmlFor="dep-received-amount" className="field-label" style={{ fontSize: '11px' }}>
                    Total Uang Fisik Diterima (Rp)
                  </label>
                  <input
                    id="dep-received-amount"
                    type="text"
                    className="field-input"
                    placeholder="0"
                    value={receivedAmountInput !== null ? formatRupiahInput(receivedAmountInput.toString()) : ''}
                    onChange={(e) => {
                      const val = parseRupiahInput(e.target.value);
                      setReceivedAmountInput(val);
                    }}
                  />
                </div>

                {showDenominations && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                    {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map(denom => (
                      <div key={denom} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>
                          Rp {new Intl.NumberFormat('id-ID').format(denom)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="stepper-btn"
                            aria-label={`Kurangi pecahan ${denom}`}
                            onClick={() => {
                              const next = { ...denominations, [denom]: Math.max(0, (denominations[denom] || 0) - 1) };
                              setDenominations(next);
                              const total = Object.entries(next).reduce((s, [v, c]) => s + Number(v) * c, 0);
                              setReceivedAmountInput(total);
                            }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>
                            {denominations[denom] || 0}
                          </span>
                          <button
                            type="button"
                            className="stepper-btn"
                            aria-label={`Tambah pecahan ${denom}`}
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
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Settlement Cards */}
              <div className="settlement-card-list" style={{ marginBottom: '14px' }}>
                {/* Card 1: Seharusnya (ⓘ) */}
                <div className="settlement-card">
                  <div className="settlement-icon-box">
                    <FileText size={20} />
                  </div>
                  <div className="settlement-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="settlement-card-label">Setoran Seharusnya</div>
                      <InfoButton
                        size={13}
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
                            formula: 'Penjualan − Biaya dari laci',
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
                    <div className="settlement-card-amount">
                      Rp {new Intl.NumberFormat('id-ID').format(expectedAmount)}
                    </div>
                  </div>
                </div>

                {/* Card 2: Diterima */}
                <div className="settlement-card">
                  <div className="settlement-icon-box">
                    <Wallet size={20} />
                  </div>
                  <div className="settlement-card-body">
                    <div className="settlement-card-label">Uang Diterima</div>
                    <div className="settlement-card-amount">
                      {isCashCounted ? `Rp ${new Intl.NumberFormat('id-ID').format(actualReceived)}` : 'Menunggu hitung'}
                    </div>
                  </div>
                </div>

                {/* Card 3: Selisih (ⓘ) */}
                <div className={`settlement-card ${!isCashCounted ? '' : actualReceived === expectedAmount ? 'green' : 'red'}`}>
                  <div className="settlement-icon-box">
                    {!isCashCounted ? (
                      <HelpCircle size={20} color="var(--muted)" />
                    ) : actualReceived === expectedAmount ? (
                      <CheckCircle2 size={20} color="var(--green)" />
                    ) : (
                      <AlertCircle size={20} color="var(--red)" />
                    )}
                  </div>
                  <div className="settlement-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="settlement-card-label">Selisih Setoran</div>
                      <InfoButton
                        size={13}
                        onClick={() => setDetailModal({
                          title: 'Selisih Setoran',
                          formula: 'Uang diterima − Setoran seharusnya',
                          rows: [
                            { label: 'Uang diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(actualReceived)}` },
                            { label: 'Setoran seharusnya', value: `-Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount)}`, isNegative: true },
                            {
                              label: 'Selisih',
                              value: isCashCounted
                                ? `${discrepancy < 0 ? 'Kurang' : discrepancy > 0 ? 'Lebih' : 'Cocok'} Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(discrepancy))}`
                                : 'Menunggu hitung',
                              isHighlight: true,
                              isNegative: discrepancy < 0,
                            },
                          ],
                          note: 'Selisih disimpan apa adanya dan tidak mengubah catatan penjualan barang.',
                        })}
                        label="Rincian Selisih"
                      />
                    </div>
                    <div className="settlement-card-amount" style={{ color: !isCashCounted ? 'var(--muted)' : actualReceived === expectedAmount ? 'var(--green)' : 'var(--red)' }}>
                      {!isCashCounted
                        ? 'Menunggu hitung'
                        : actualReceived === expectedAmount
                        ? 'Rp 0 (Cocok)'
                        : actualReceived < expectedAmount
                        ? `Kurang Rp ${new Intl.NumberFormat('id-ID').format(expectedAmount - actualReceived)}`
                        : `Lebih Rp ${new Intl.NumberFormat('id-ID').format(actualReceived - expectedAmount)}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Note Textarea */}
              <div className="form-card" style={{ marginTop: '0', marginBottom: '14px' }}>
                <label htmlFor="deposit-notes" className="field-label" style={{ marginBottom: '6px', display: 'block' }}>
                  Keterangan (opsional)
                </label>
                <textarea
                  id="deposit-notes"
                  className="field-textarea"
                  rows={2}
                  placeholder="Contoh: uang kembalian kasir, ada nota darurat, dll."
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                />
              </div>

              {/* Buttons: Simpan Setoran & Catat Ambil Uang Pribadi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-dark"
                  style={{ width: '100%', minHeight: '44px' }}
                  onClick={handleSaveDeposit}
                >
                  Simpan Setoran
                </button>

                <button
                  type="button"
                  className="btn btn-paper"
                  style={{ width: '100%', minHeight: '38px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setShowWithdrawModal(true)}
                >
                  <Wallet size={14} />
                  <span>Catat Ambil Uang (Pengambilan Pribadi)</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: BIAYA TOKO                             */}
        {/* ======================================================== */}
        {currentScreen === 'biaya' && (
          <div className="form-card">
            <h3 className="form-card-title">Catat Pengeluaran Toko</h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              Catat biaya operasional toko seperti gas, listrik, plastik, atau kebersihan.
            </p>

            <div className="field-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="b-name" className="field-label">Nama Pengeluaran</label>
              <input
                id="b-name"
                type="text"
                className="field-input"
                placeholder="Contoh: Beli plastik & sedotan"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
            </div>

            <div className="field-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="b-cost" className="field-label">Nominal (Rp)</label>
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
              <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Sumber Dana</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`filter-chip ${expenseSourceMoney === 'LACI' ? 'active' : ''}`}
                  onClick={() => setExpenseSourceMoney('LACI')}
                  style={{ minHeight: '38px', padding: '6px 14px', fontSize: '12px' }}
                >
                  Uang laci (default)
                </button>
                <button
                  type="button"
                  className={`filter-chip ${expenseSourceMoney === 'PRIBADI' ? 'active' : ''}`}
                  onClick={() => setExpenseSourceMoney('PRIBADI')}
                  style={{ minHeight: '38px', padding: '6px 14px', fontSize: '12px' }}
                >
                  Uang lain
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveExpense}
              style={{ minHeight: '44px', width: '100%' }}
            >
              Simpan Biaya
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: LAPORAN KEUANGAN SEJATI                */}
        {/* ======================================================== */}
        {currentScreen === 'laporan' && (() => {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Blok 1: Untung */}
              <div className="form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 className="form-card-title" style={{ margin: 0, fontSize: '13px' }}>1. Untung</h3>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: storeSummary.certainty === 'PASTI' ? '#eafbe3' : 'var(--amber-pale)',
                    color: 'var(--ink)'
                  }}>
                    {storeSummary.certainty === 'PASTI' ? 'Pasti' : 'Perlu diperiksa'}
                  </span>
                </div>

                <div className="summary-box-row" style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Penjualan</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Penjualan',
                        formula: 'Σ terjual × harga jual satuan',
                        rows: [
                          { label: 'Penjualan terhitung', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}`, isHighlight: true },
                        ],
                        note: 'Dihitung dari selisih cek sisa fisik barang.',
                      })}
                      label="Rincian Penjualan"
                    />
                  </div>
                  <strong style={{ fontSize: '12px' }}>
                    {storeSummary.grossSales.min !== storeSummary.grossSales.max ? '≈ ' : ''}
                    Rp {new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}
                  </strong>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Modal terjual</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Modal Terjual (HPP)',
                        formula: 'Σ terjual × modal rata-rata',
                        rows: [
                          { label: 'Modal barang terjual', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cogsKnown)}`, isHighlight: true },
                        ],
                        note: 'Modal asli dari barang-barang yang telah laku terjual.',
                      })}
                      label="Rincian Modal Terjual"
                    />
                  </div>
                  <strong style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    -Rp {new Intl.NumberFormat('id-ID').format(storeSummary.cogsKnown)}
                  </strong>
                </div>

                <div className="summary-box-row" style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 800 }}>Untung kotor</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Untung Kotor',
                        formula: 'Penjualan − Modal terjual',
                        rows: [
                          { label: 'Penjualan', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}` },
                          { label: 'Modal terjual', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cogsKnown)}`, isNegative: true },
                          { label: 'Untung kotor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossProfit ? storeSummary.grossProfit.min : 0)}`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Untung Kotor"
                    />
                  </div>
                  <strong style={{
                    fontSize: '13px',
                    color: (storeSummary.grossProfit?.min ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'
                  }}>
                    Rp {new Intl.NumberFormat('id-ID').format(storeSummary.grossProfit?.min ?? 0)}
                  </strong>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Biaya toko</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Biaya Toko',
                        formula: 'Total biaya operasional toko',
                        rows: [
                          { label: 'Biaya dari laci kasir', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}` },
                          { label: 'Biaya lain / pribadi', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal - storeSummary.expensesLaci)}` },
                          { label: 'Total biaya toko', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Biaya Toko"
                    />
                  </div>
                  <strong style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    -Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}
                  </strong>
                </div>

                <div className="summary-box-row" style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1.5px solid var(--ink)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 900, fontSize: '12px' }}>Untung bersih</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Untung Bersih',
                        formula: 'Untung kotor − Biaya toko',
                        rows: [
                          { label: 'Untung kotor', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossProfit ? storeSummary.grossProfit.min : 0)}` },
                          { label: 'Biaya toko', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesTotal)}`, isNegative: true },
                          { label: 'Untung bersih', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.netProfit ? storeSummary.netProfit.min : 0)}`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Untung Bersih"
                    />
                  </div>
                  <strong style={{
                    fontSize: '14px',
                    color: (storeSummary.netProfit?.min ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'
                  }}>
                    {storeSummary.netProfit ? (
                      <>
                        {storeSummary.netProfit.min !== storeSummary.netProfit.max ? '≈ ' : ''}
                        Rp {new Intl.NumberFormat('id-ID').format(storeSummary.netProfit.min)}
                      </>
                    ) : (
                      'Belum pasti'
                    )}
                  </strong>
                </div>
              </div>

              {/* Blok 2: Uang */}
              <div className="form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 className="form-card-title" style={{ margin: 0, fontSize: '13px' }}>2. Uang</h3>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Setoran seharusnya</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Setoran Seharusnya',
                        formula: 'Penjualan − Biaya dari laci',
                        rows: [
                          { label: 'Penjualan barang', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.grossSales.min)}` },
                          { label: 'Biaya dari laci', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expensesLaci)}`, isNegative: true },
                          { label: 'Setoran seharusnya', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Setoran Seharusnya"
                    />
                  </div>
                  <strong style={{ fontSize: '12px' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.expectedDeposit)}</strong>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Setoran diterima</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Setoran Diterima',
                        formula: 'Total uang setoran yang telah diserahkan',
                        rows: [
                          { label: 'Setoran diterima', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}`, isHighlight: true },
                          { label: 'Sisa belum disetor', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.remainingDeposit)}` },
                        ],
                      })}
                      label="Rincian Setoran Diterima"
                    />
                  </div>
                  <strong style={{ fontSize: '12px' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}</strong>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Selisih</span>
                    <InfoButton
                      size={12}
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
                      label="Rincian Selisih"
                    />
                  </div>
                  <strong style={{
                    fontSize: '12px',
                    color: storeSummary.depositDiscrepancy < 0 ? 'var(--red)' : storeSummary.depositDiscrepancy > 0 ? 'var(--blue)' : 'var(--green)'
                  }}>
                    {storeSummary.depositDiscrepancy < 0
                      ? `Kurang Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(storeSummary.depositDiscrepancy))}`
                      : storeSummary.depositDiscrepancy > 0
                      ? `Lebih Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.depositDiscrepancy)}`
                      : 'Rp 0 (Cocok)'}
                  </strong>
                </div>

                <div className="summary-box-row" style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 800 }}>Uang di tangan</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Uang di Tangan',
                        formula: 'Setoran diterima − Belanja dari setoran − Pengambilan pribadi',
                        rows: [
                          { label: 'Setoran diterima', value: `+Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.totalDeposits)}` },
                          { label: 'Belanja dari setoran', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.purchasesFromSetoran)}`, isNegative: true },
                          { label: 'Pengambilan pribadi', value: `-Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.ownerWithdrawalsTotal)}`, isNegative: true },
                          { label: 'Uang di tangan', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Uang di Tangan"
                    />
                  </div>
                  <strong style={{ fontSize: '13px', color: storeSummary.cashInHand >= 0 ? 'var(--ink)' : 'var(--red)' }}>
                    Rp {new Intl.NumberFormat('id-ID').format(storeSummary.cashInHand)}
                  </strong>
                </div>
              </div>

              {/* Blok 3: Barang */}
              <div className="form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 className="form-card-title" style={{ margin: 0, fontSize: '13px' }}>3. Barang</h3>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Total fisik (pcs)</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Total Fisik Tersedia',
                        formula: 'Akumulasi sisa stok seluruh barang toko',
                        rows: [
                          { label: 'Total stok barang', value: `${storeSummary.totalAvailableUnits} pcs`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Total Fisik"
                    />
                  </div>
                  <strong style={{ fontSize: '12px' }}>{storeSummary.totalAvailableUnits} pcs</strong>
                </div>

                <div className="summary-box-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Modal persediaan</span>
                    <InfoButton
                      size={12}
                      onClick={() => setDetailModal({
                        title: 'Modal Persediaan Barang',
                        formula: 'Σ stok tersedia × modal rata-rata per barang',
                        rows: [
                          { label: 'Nilai modal persediaan', value: `Rp ${new Intl.NumberFormat('id-ID').format(storeSummary.knownInventoryValue)}`, isHighlight: true },
                        ],
                      })}
                      label="Rincian Modal Persediaan"
                    />
                  </div>
                  <strong style={{ fontSize: '12px' }}>Rp {new Intl.NumberFormat('id-ID').format(storeSummary.knownInventoryValue)}</strong>
                </div>
              </div>

              {/* Single InfoButton Card for Integritas Keuangan */}
              <div style={{ padding: '10px 12px', background: 'var(--paper)', borderRadius: '10px', border: '1.5px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>Prinsip Integritas Keuangan</span>
                <InfoButton
                  size={14}
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
                  label="Rincian Prinsip Integritas Keuangan"
                />
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: RIWAYAT                                */}
        {/* ======================================================== */}
        {currentScreen === 'riwayat' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>Riwayat Transaksi</h2>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{recentActivities.length} transaksi terekam</span>
            </div>

            {recentActivities.length > 0 ? (
              <div className="activity-feed">
                {recentActivities.map((act) => (
                  <div key={act.id} className="feed-row">
                    <div className={`feed-icon ${act.type === 'purchase' ? 'green' : act.type === 'deposit' ? 'blue' : 'grey'}`}>
                      {act.type === 'purchase' ? <ShoppingCart size={18} /> : act.type === 'deposit' ? <Wallet size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="feed-details">
                      <strong className="feed-title">{act.title}</strong>
                      <span className="feed-subtitle">{act.subtitle}</span>
                    </div>
                    <div className="feed-meta">
                      <span className="feed-time">{act.time}</span>
                      <strong className="feed-amount">Rp {new Intl.NumberFormat('id-ID').format(act.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="form-card" style={{ textAlign: 'center', padding: '30px 16px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0' }}>Belum ada transaksi terekam</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px 0' }}>
                  Catat belanja, periksa stok, simpan setoran, atau catat pengeluaran toko untuk melihat riwayat aktivitas di sini.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentScreen('catat')}
                  style={{ display: 'inline-flex', width: 'auto', margin: '0 auto' }}
                >
                  Mulai Catat Belanja →
                </button>
              </div>
            )}
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
              onClick={() => setCurrentScreen('barang')}
              role="button"
              tabIndex={0}
            >
              <div className="tile-icon-box dark"><Package size={18} /></div>
              <div className="product-info-text">
                <strong className="product-info-name">Katalog Produk</strong>
                <span className="product-info-meta">Daftar produk, satuan kemasan, dan modal</span>
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

        {/* ======================================================== */}
        {/* SECONDARY SCREEN: KATALOG PRODUK                         */}
        {/* ======================================================== */}
        {currentScreen === 'barang' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={() => setCurrentScreen('lainnya')}
                  style={{ minHeight: '36px', minWidth: '36px', padding: '4px 8px' }}
                  aria-label="Kembali ke menu Lainnya"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>Katalog Produk ({catalogList.length})</h2>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddProductModal(true)}
                style={{ minHeight: '36px', fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>+ Produk Baru</span>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 14px 0' }}>
              Daftar master produk toko. Mendaftarkan produk baru tidak otomatis menambah stok maupun mencatat belanja.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {catalogList.map((prod) => (
                <div key={prod.id} className="product-select-card" style={{ cursor: 'default' }}>
                  <div className="product-thumb-image" aria-hidden="true">
                    {prod.icon}
                  </div>
                  <div className="product-info-text">
                    <strong className="product-info-name">{prod.name}</strong>
                    <span className="product-info-meta">
                      {prod.category} · Kemasan: {prod.unit} ({prod.packSize} pcs)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>
                        Jual: Rp {new Intl.NumberFormat('id-ID').format(prod.sellingPricePerUnit)}/pcs
                      </span>
                      {prod.costPerPack !== null && prod.costPerPack !== undefined ? (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          • Modal: Rp {new Intl.NumberFormat('id-ID').format(prod.costPerPack)}/{prod.unit.split(' ')[0]}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Modal: Belum diketahui
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentScreen === 'pengaturan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Kartu 1: Penyimpanan Lokal Offline-First (IndexedDB) */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} color="var(--orange)" />
                  <h3 className="form-card-title" style={{ margin: 0 }}>Penyimpanan Lokal Offline-First</h3>
                </div>
                <span className="status-tag good">IndexedDB Aktif</span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 12px 0' }}>
                Data toko Anda disimpan langsung di browser perangkat ini secara instan dan dapat digunakan 100% tanpa jaringan internet.
              </p>

              <div className="summary-box-row">
                <span>Versi Dokumen Lokal</span>
                <strong>{dataVersion === 0 ? 'Belum dimuat' : `v${dataVersion}`}</strong>
              </div>

              <div className="summary-box-row">
                <span>Keutuhan Integritas</span>
                <span style={{
                  fontWeight: 800,
                  color: checksumStatus === 'VALID' ? 'var(--green)' : 'var(--muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={14} />
                  {checksumStatus === 'VALID' ? 'SHA-256 Valid' : 'Belum diperiksa'}
                </span>
              </div>

              <div className="summary-box-row">
                <span>Status Jaringan Perangkat</span>
                <strong style={{ color: syncStatus.isOnline ? 'var(--green)' : 'var(--muted)' }}>
                  {syncStatus.isOnline ? 'Online (Terhubung)' : 'Offline (Luar Jaringan)'}
                </strong>
              </div>

              <div className="summary-box-row">
                <span>Antrean Mutasi Belum Tersinkron</span>
                <strong style={{ color: syncStatus.pendingCount > 0 ? 'var(--orange)' : 'var(--ink)' }}>
                  {syncStatus.pendingCount} perubahan tertunda
                </strong>
              </div>

              {/* Action Buttons: Ekspor & Impor File JSON */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportJson}
                  style={{ minHeight: '44px', fontSize: '12px' }}
                >
                  <Download size={15} />
                  <span>Unduh JSON</span>
                </button>

                <label
                  className="btn btn-paper"
                  style={{
                    minHeight: '44px',
                    fontSize: '12px',
                    display: 'flex',
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
            </div>

            {/* Kartu 2: Sinkronisasi Cloud Supabase (PostgreSQL Rp0) */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={20} color="var(--blue)" />
                  <h3 className="form-card-title" style={{ margin: 0 }}>Sinkronisasi Cloud Supabase</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                  title="Atur Kredensial Supabase"
                  aria-label="Atur Kredensial Supabase"
                >
                  <KeyRound size={14} />
                  <span>Atur Supabase</span>
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 12px 0' }}>
                Sinkronisasi otomatis antar-perangkat menggunakan basis data cloud PostgreSQL gratis (Supabase Free Tier Rp0).
              </p>

              <div className="summary-box-row">
                <span>Status Basis Data</span>
                <span style={{
                  fontWeight: 800,
                  color: supabaseAdapter.isConfigured() ? 'var(--green)' : 'var(--muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: supabaseAdapter.isConfigured() ? 'var(--green)' : '#999'
                  }} />
                  {supabaseAdapter.isConfigured() ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                </span>
              </div>

              <div className="summary-box-row">
                <span>URL Proyek</span>
                <strong style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                  {supabaseAdapter.isConfigured() ? supabaseAdapter.getCredentials().url : '—'}
                </strong>
              </div>

              <div className="summary-box-row">
                <span>Sinkronisasi Terakhir</span>
                <strong style={{ fontSize: '12px' }}>
                  {syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Belum tersinkron'}
                </strong>
              </div>

              {syncStatus.lastError && (
                <div style={{ marginTop: '8px', padding: '8px 10px', background: '#ffebe6', border: '1px solid #ff8f73', borderRadius: '6px', fontSize: '11px', color: '#900' }}>
                  <strong>Catatan Sinkronisasi:</strong> {syncStatus.lastError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSyncCloudNow}
                  disabled={syncStatus.isSyncing}
                  style={{ minHeight: '44px', fontSize: '12px' }}
                >
                  <RefreshCw size={15} className={syncStatus.isSyncing ? 'spin' : ''} />
                  <span>{syncStatus.isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={() => setShowSupabaseModal(true)}
                  style={{ minHeight: '44px', fontSize: '12px' }}
                >
                  <KeyRound size={15} />
                  <span>Kredensial Cloud</span>
                </button>
              </div>
            </div>

            {/* Google Drive Backend Storage Card */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cloud size={20} color="var(--orange)" />
                  <h3 className="form-card-title" style={{ margin: 0 }}>Penyimpanan Google Drive (Rp0)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                  title="Konfigurasi Client ID & Origins"
                  aria-label="Konfigurasi Client ID"
                >
                  <KeyRound size={14} />
                  <span>Atur Client ID</span>
                </button>
              </div>

              {/* Status Alert jika ada error / unconfigured */}
              {authState === 'UNCONFIGURED' && (
                <div style={{ padding: '10px 12px', background: 'var(--amber-pale)', border: '1px solid #e2bc74', borderRadius: '8px', fontSize: '11px', color: 'var(--ink)', marginBottom: '12px' }}>
                  <strong>Client ID Diperlukan:</strong>
                  <p style={{ marginTop: '2px', color: 'var(--muted)' }}>
                    Masukkan Google OAuth 2.0 Web Client ID Anda untuk mengotorisasi akses Google Drive tanpa backend berbayar (Rp0).
                  </p>
                  <button
                    type="button"
                    className="btn btn-paper"
                    onClick={() => setShowConfigModal(true)}
                    style={{ minHeight: '36px', marginTop: '8px', fontSize: '11px', width: '100%' }}
                  >
                    Buka Panduan & Pengaturan Client ID →
                  </button>
                </div>
              )}

              {authState === 'ERROR' && authError && (
                <div style={{ padding: '10px 12px', background: '#ffebe6', border: '1px solid #ff8f73', borderRadius: '8px', fontSize: '11px', color: '#900', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={15} />
                    <strong>Gagal Otorisasi:</strong>
                  </div>
                  <p style={{ marginTop: '4px' }}>{authError}</p>
                </div>
              )}

              {authState === 'EXPIRED' && (
                <div style={{ padding: '10px 12px', background: 'var(--amber-pale)', border: '1px solid #e2bc74', borderRadius: '8px', fontSize: '11px', color: 'var(--ink)', marginBottom: '12px' }}>
                  <strong>Sesi Otorisasi Kedaluwarsa:</strong>
                  <p style={{ marginTop: '2px' }}>Token keamanan telah habis masa berlakunya. Silakan hubungkan ulang akun Google Anda.</p>
                </div>
              )}

              <div className="summary-box-row" style={{ marginTop: '4px' }}>
                <span>Akun Google Terhubung</span>
                <strong>{userInfo?.email || (authState === 'CONNECTED' ? 'Google Drive Aktif' : 'Belum terhubung')}</strong>
              </div>

              <div className="summary-box-row">
                <span>Status Sambungan</span>
                <span style={{
                  fontWeight: 800,
                  color: authState === 'CONNECTED' ? 'var(--green)' : (authState === 'UNCONFIGURED' || authState === 'EXPIRED') ? '#b8860b' : 'var(--red)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: authState === 'CONNECTED' ? 'var(--green)' : (authState === 'UNCONFIGURED' || authState === 'EXPIRED') ? '#b8860b' : 'var(--red)'
                  }} />
                  {authState === 'CONNECTED'
                    ? 'Terhubung (API v3)'
                    : authState === 'UNCONFIGURED'
                    ? 'Perlu Client ID'
                    : authState === 'CONNECTING'
                    ? 'Membuka Pop-up...'
                    : authState === 'EXPIRED'
                    ? 'Sesi Kedaluwarsa'
                    : 'Belum Terhubung'}
                </span>
              </div>

              <div className="summary-box-row">
                <span>Keutuhan Data</span>
                <span style={{
                  fontWeight: 800,
                  color: checksumStatus === 'VALID' ? 'var(--green)' : checksumStatus === 'UNCHECKED' ? 'var(--muted)' : 'var(--red)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={14} />
                  {checksumStatus === 'VALID' ? 'SHA-256 Valid' : checksumStatus === 'UNCHECKED' ? 'Belum diperiksa' : 'Peringatan Korup'}
                </span>
              </div>

              <div className="summary-box-row">
                <span>Versi Dokumen</span>
                <strong>{dataVersion === 0 ? 'Belum dimuat' : `v${dataVersion}`}</strong>
              </div>

              <div className="summary-box-row">
                <span>Cadangan Terakhir</span>
                <strong style={{ fontSize: '12px' }}>{lastBackupTime}</strong>
              </div>

              {storageQuota && (
                <div className="summary-box-row">
                  <span>Ruang Drive Terpakai</span>
                  <strong style={{ fontSize: '11px' }}>
                    {(storageQuota.usageBytes / (1024 * 1024)).toFixed(1)} MB
                    {storageQuota.limitBytes ? ` / ${(storageQuota.limitBytes / (1024 * 1024 * 1024)).toFixed(0)} GB` : ''}
                  </strong>
                </div>
              )}

              {/* Action Buttons Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                {authState === 'CONNECTED' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleManualBackup}
                      disabled={isBackingUp}
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
                        onClick={handleTestConnection}
                        disabled={isCheckingConnection}
                        style={{ minHeight: '44px' }}
                      >
                        <RefreshCw size={16} className={isCheckingConnection ? 'spin' : ''} />
                        <span>{isCheckingConnection ? 'Menguji...' : 'Tes Sambungan'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-paper"
                      onClick={handleDisconnectGoogle}
                      style={{ minHeight: '40px', fontSize: '12px', color: 'var(--red)', borderColor: '#ffd0c4' }}
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
                      style={{ minHeight: '44px', width: '100%' }}
                    >
                      <Cloud size={16} />
                      <span>
                        {authState === 'CONNECTING'
                          ? 'Membuka Jendela Otorisasi...'
                          : authState === 'UNCONFIGURED'
                          ? 'Konfigurasi Google Client ID'
                          : authState === 'EXPIRED'
                          ? 'Otorisasi Ulang Akun Google'
                          : 'Hubungkan Akun Google (Login)'}
                      </span>
                    </button>

                    {authState !== 'UNCONFIGURED' && (
                      <button
                        type="button"
                        className="btn btn-paper"
                        onClick={() => setShowConfigModal(true)}
                        style={{ minHeight: '40px', fontSize: '12px' }}
                      >
                        <KeyRound size={14} />
                        <span>Ubah OAuth Client ID</span>
                      </button>
                    )}
                  </>
                )}
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

      {/* Modal Dialog: Pilih Tanggal Setoran (Menggantikan window.prompt) */}
      {showDateModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="date-modal-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 id="date-modal-title" className="form-card-title" style={{ margin: 0 }}>Pilih Tanggal Setoran</h3>
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup dialog tanggal"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => {
                  const today = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date());
                  setDepositDate(today);
                  setShowDateModal(false);
                  showToast(`Tanggal diatur: ${today}`);
                }}
                style={{ minHeight: '44px', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                📅 Hari ini ({new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())})
              </button>

              <button
                type="button"
                className="btn btn-paper"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  const yesterday = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(d);
                  setDepositDate(yesterday);
                  setShowDateModal(false);
                  showToast(`Tanggal diatur: ${yesterday}`);
                }}
                style={{ minHeight: '44px', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                ⏪ Kemarin
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="custom-date" className="field-label" style={{ marginBottom: '4px', display: 'block' }}>
                Atau pilih tanggal kalender:
              </label>
              <input
                id="custom-date"
                type="date"
                className="field-input"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
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
                      const formatted = new Intl.DateTimeFormat('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }).format(parsed);
                      setDepositDate(formatted);
                    }
                  }
                  setShowDateModal(false);
                }}
                style={{ minHeight: '44px' }}
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

            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px 0' }}>
              Menambah master produk baru ke katalog toko. Produk baru tidak otomatis menambah stok awal maupun membuat transaksi pembelian.
            </p>

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

            <div style={{ marginBottom: '12px' }}>
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
                    style={{ minHeight: '38px', padding: '6px 14px', fontSize: '12px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Pilih Ikon</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['📦', '🍜', '💧', '🧃', '🥚', '🍚', '🍪', '🚬', '🧼', '🧴', '🍞', '☕'].map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewProdIcon(ic)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      border: newProdIcon === ic ? '2.5px solid var(--orange)' : '1.5px solid var(--line)',
                      background: newProdIcon === ic ? 'var(--amber-pale)' : 'var(--paper)',
                      fontSize: '20px',
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
                  Modal Kemasan Pembelian (Rp):
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
                  placeholder="Contoh: 96000"
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

      {/* Modal Dialog: Catat Ambil Uang Pribadi */}
      {showWithdrawModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="var(--orange)" />
                <h3 className="form-card-title" style={{ margin: 0, fontSize: '15px' }}>Catat Ambil Uang (Pribadi)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                style={{ padding: '6px 10px', minHeight: '44px', minWidth: '44px', fontWeight: 900 }}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px 0' }}>
              Catat uang setoran toko yang diambil pemilik untuk keperluan pribadi. Uang di tangan akan berkurang.
            </p>

            <div className="field-group" style={{ marginBottom: '12px' }}>
              <label className="field-label" htmlFor="with-amount">Nominal Ambil Uang (Rp)</label>
              <input
                id="with-amount"
                type="text"
                inputMode="numeric"
                className="field-input"
                placeholder="Rp 0"
                value={withdrawAmountStr ? `Rp ${formatRupiahInput(withdrawAmountStr)}` : ''}
                onChange={(e) => setWithdrawAmountStr(formatRupiahInput(e.target.value))}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
            </div>

            <div className="field-group" style={{ marginBottom: '16px' }}>
              <label className="field-label" htmlFor="with-note">Keperluan / Catatan</label>
              <input
                id="with-note"
                type="text"
                className="field-input"
                placeholder="Contoh: Keperluan rumah tangga"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveWithdrawal}
                style={{ minHeight: '44px', width: '100%' }}
              >
                Simpan Pengambilan Uang
              </button>
              <button
                type="button"
                className="btn btn-paper"
                onClick={() => setShowWithdrawModal(false)}
                style={{ minHeight: '40px', fontSize: '11px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

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

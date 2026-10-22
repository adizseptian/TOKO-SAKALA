import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, BadgeCheck, Banknote, BookOpenText, Calculator,
  Boxes, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp,
  ClipboardCheck, Clock3, FileChartColumn, History, Home, Info, Lightbulb,
  Menu, Package, Plus, ReceiptText, Settings2, ShieldCheck, ShoppingBasket,
  Sparkles, Store, Wallet, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import { AI_INTEGRATION_CONNECTED, readAssistantPreference, writeAssistantPreference } from '@/ai-feature';

 type Screen = 'beranda' | 'barang' | 'belanja' | 'cek-sisa' | 'setoran' | 'laporan' | 'asisten' | 'riwayat' | 'pengaturan';
 type NavItem = { id: Screen; label: string; icon: LucideIcon; group: 'utama' | 'lainnya' };

const navigation: NavItem[] = [
  { id: 'beranda', label: 'Beranda', icon: Home, group: 'utama' },
  { id: 'barang', label: 'Barang', icon: Package, group: 'utama' },
  { id: 'belanja', label: 'Belanja', icon: ShoppingBasket, group: 'utama' },
  { id: 'cek-sisa', label: 'Cek sisa', icon: ClipboardCheck, group: 'utama' },
  { id: 'setoran', label: 'Uang & setoran', icon: Banknote, group: 'utama' },
  { id: 'laporan', label: 'Laporan', icon: FileChartColumn, group: 'utama' },
  { id: 'asisten', label: 'Asisten', icon: Sparkles, group: 'lainnya' },
  { id: 'riwayat', label: 'Riwayat', icon: History, group: 'lainnya' },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings2, group: 'lainnya' }
];

const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const currentTitle = (id: Screen) => navigation.find((item) => item.id === id)?.label ?? 'TOKO SAKALA';
const browserStorage = (): Storage | null => { try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; } };

function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'off' }) {
  return <span className={`status-pill status-${tone}`}><span className="status-dot" />{children}</span>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-title-row"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action ? <div className="page-title-action">{action}</div> : null}</div>;
}

function Note({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'success'; title: string; children: ReactNode }) {
  const Icon = tone === 'warning' ? ShieldCheck : tone === 'success' ? BadgeCheck : Info;
  return <div className={`note note-${tone}`}><Icon size={18} aria-hidden="true" /><div><strong>{title}</strong><p>{children}</p></div></div>;
}

function EmptyPanel({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-panel"><div className="empty-icon"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p>{action ? <div className="empty-action">{action}</div> : null}</div>;
}

function AiToggle({ enabled, onChange }: { enabled: boolean; onChange: (next: boolean) => void }) {
  return <button type="button" className={`switch ${enabled ? 'switch-on' : ''}`} role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)} aria-label={`Asisten AI ${enabled ? 'ON' : 'OFF'}`}><span className="switch-thumb" /></button>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('beranda');
  const [mobileNav, setMobileNav] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(() => readAssistantPreference(browserStorage()));

  const changeAiPreference = (enabled: boolean) => {
    setAiEnabled(enabled);
    writeAssistantPreference(enabled, browserStorage());
  };
  const navigate = (next: Screen) => { setScreen(next); setMobileNav(false); };
  const mainItems = navigation.filter((item) => item.group === 'utama');
  const otherItems = navigation.filter((item) => item.group === 'lainnya');

  return <div className="app-frame">
    {mobileNav ? <button className="mobile-scrim" aria-label="Tutup menu" onClick={() => setMobileNav(false)} /> : null}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark">S</div><div className="brand-word"><strong>TOKO SAKALA</strong><span>RINGKAS · TERPERCAYA</span></div><button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Tutup menu"><X size={18} /></button></div>
      <div className="side-section"><p className="side-label">MENU UTAMA</p><nav aria-label="Menu utama">{mainItems.map((item) => <NavButton key={item.id} item={item} active={screen === item.id} aiEnabled={aiEnabled} onClick={() => navigate(item.id)} />)}</nav></div>
      <div className="side-section side-section-other"><p className="side-label">LAINNYA</p><nav aria-label="Menu lainnya">{otherItems.map((item) => <NavButton key={item.id} item={item} active={screen === item.id} aiEnabled={aiEnabled} onClick={() => navigate(item.id)} />)}</nav></div>
      <div className="sidebar-bottom"><div className="project-state"><div className="project-state-heading"><Activity size={15} /><span>Mode pengembangan</span></div><p>Data toko nyata belum boleh dimasukkan.</p><button className="text-button" onClick={() => navigate('pengaturan')}>Lihat status proyek <ArrowRight size={13} /></button></div><div className="sidebar-foot"><span>Build v0.2.0 · AI Studio</span><span className="foot-dot" /> <span>Core tanpa AI</span></div></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Buka menu"><Menu size={19} /></button><div><p className="breadcrumb">Workspace toko <span>/</span> {currentTitle(screen)}</p><div className="topbar-title">{currentTitle(screen)}</div></div></div><div className="topbar-actions"><StatusPill tone={aiEnabled ? 'warn' : 'neutral'}>{aiEnabled ? 'AI UI ON · belum tersambung' : 'AI OFF'}</StatusPill><div className="quick-add-wrap"><button type="button" className="button button-primary button-small" onClick={() => navigate('belanja')}><Plus size={16} /> <span>Tambah catatan</span><ChevronDown size={14} /></button></div></div></header>
      <main className="page-content">
        <div className="global-banner"><div className="banner-icon"><BookOpenText size={17} /></div><div><strong>Fondasi aplikasi — penyimpanan belum aktif</strong><p>Ini versi awal untuk Google AI Studio. Belum ada transaksi yang disimpan. Jangan masukkan data toko sungguhan.</p></div><span className="banner-tag">PREVIEW</span></div>
        {screen === 'beranda' ? <Dashboard onNavigate={navigate} aiEnabled={aiEnabled} /> : null}
        {screen === 'barang' ? <ProductsPage onNavigate={navigate} /> : null}
        {screen === 'belanja' ? <PurchasePage /> : null}
        {screen === 'cek-sisa' ? <StockCheckPage /> : null}
        {screen === 'setoran' ? <CashPage /> : null}
        {screen === 'laporan' ? <ReportsPage /> : null}
        {screen === 'asisten' ? <AssistantPage enabled={aiEnabled} onToggle={changeAiPreference} onSettings={() => navigate('pengaturan')} /> : null}
        {screen === 'riwayat' ? <HistoryPage /> : null}
        {screen === 'pengaturan' ? <SettingsPage enabled={aiEnabled} onToggle={changeAiPreference} /> : null}
        <footer className="main-footer"><span>TOKO SAKALA <span className="footer-sep">·</span> Sederhana di depan, akurat di belakang.</span><span>Starter UI · belum untuk transaksi nyata</span></footer>
      </main>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Navigasi cepat">{[navigation[0], navigation[1], navigation[2], navigation[4], navigation[8]].map((item) => <button key={item.id} className={screen === item.id ? 'mobile-nav-active' : ''} onClick={() => navigate(item.id)}><item.icon size={18} /><span>{item.id === 'setoran' ? 'Uang' : item.id === 'pengaturan' ? 'Atur' : item.label}</span></button>)}</nav>
  </div>;
}

function NavButton({ item, active, aiEnabled, onClick }: { item: NavItem; active: boolean; aiEnabled: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`nav-link ${active ? 'nav-link-active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} /><span>{item.label}</span>{item.id === 'asisten' ? <span className="nav-tag">{aiEnabled ? 'ON' : 'OFF'}</span> : null}</button>;
}

function Dashboard({ onNavigate, aiEnabled }: { onNavigate: (screen: Screen) => void; aiEnabled: boolean }) {
  const metrics = [
    { label: 'Untung', value: '—', help: 'Menunggu catatan yang dapat dihitung', icon: Wallet },
    { label: 'Uang seharusnya', value: '—', help: 'Belum ada data uang', icon: Banknote },
    { label: 'Status setoran', value: 'Belum ada', help: 'Belum ada setoran yang dicatat', icon: ClipboardCheck },
    { label: 'Jenis barang', value: '0', help: 'Barang belum ditambahkan', icon: Package }
  ];
  return <div className="content-stack"><PageTitle eyebrow="RINGKASAN TOKO" title="Selamat datang di TOKO SAKALA" description="Catat kejadian toko. Biar sistem yang merapikan hitungan." action={<button className="button button-primary" onClick={() => onNavigate('belanja')}><Plus size={17} /> Mulai mencatat</button>} />
    <section className="welcome-card"><div className="welcome-grid" /><div className="welcome-copy"><StatusPill tone="good">Fondasi siap dikembangkan</StatusPill><h2>Yang terlihat mudah.<br /><em>Yang sulit dikerjakan sistem.</em></h2><p>TOKO SAKALA dirancang agar kamu cukup mencatat apa yang terjadi di toko. Perhitungan, pemeriksaan, dan penjelasan dikerjakan di belakang layar.</p><div className="welcome-actions"><button className="button button-light" onClick={() => onNavigate('belanja')}><ShoppingBasket size={16} /> Coba pratinjau belanja</button><button className="button button-ghost" onClick={() => onNavigate('pengaturan')}>Pengaturan aplikasi <ArrowRight size={15} /></button></div></div><div className="welcome-orb"><Store size={42} strokeWidth={1.2} /><span className="orb-small orb-one" /><span className="orb-small orb-two" /><span className="orb-line" /></div></section>
    <div className="section-heading"><div><p className="eyebrow">GAMBARAN TOKO</p><h2>Ringkasan hari ini</h2></div><span className="section-caption"><CalendarDays size={14} /> Belum ada periode data</span></div>
    <section className="metric-grid">{metrics.map(({ label, value, help, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} /></span></div><strong className="metric-value">{value}</strong><p>{help}</p></article>)}</section>
    <div className="two-column-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">AKSI CEPAT</p><h2>Catat aktivitas toko</h2></div><span className="panel-heading-icon"><Plus size={17} /></span></div><div className="action-list"><QuickAction icon={ShoppingBasket} title="Belanja barang" description="Catat jumlah kemasan dan harga." onClick={() => onNavigate('belanja')} /><QuickAction icon={ClipboardCheck} title="Cek sisa barang" description="Masukkan jumlah yang benar-benar tersisa." onClick={() => onNavigate('cek-sisa')} /><QuickAction icon={Banknote} title="Uang & setoran" description="Kelola catatan uang tanpa mencampur untung." onClick={() => onNavigate('setoran')} /></div></section>
      <section className="panel attention-panel"><div className="panel-heading"><div><p className="eyebrow">YANG PERLU DIKETAHUI</p><h2>Status aplikasi</h2></div><ShieldCheck size={19} className="quiet-icon" /></div><div className="status-summary"><span className="summary-bullet bullet-amber" /><div><strong>Penyimpanan belum disambungkan</strong><p>Belum ada transaksi tersimpan. Tombol simpan uang belum aktif.</p></div></div><div className="status-summary"><span className={`summary-bullet ${aiEnabled ? 'bullet-amber' : 'bullet-muted'}`} /><div><strong>Asisten AI {aiEnabled ? 'ON (belum tersambung)' : 'OFF'}</strong><p>{aiEnabled ? 'Panel asisten terlihat, tetapi tidak melakukan panggilan AI.' : 'Aplikasi inti tetap dirancang berjalan tanpa AI.'}</p></div></div><button className="button button-secondary full-width" onClick={() => onNavigate('pengaturan')}>Periksa pengaturan <ArrowRight size={15} /></button></section></div>
    <Note tone="info" title="Tidak ada angka yang dibuat-buat">Angka keuangan baru akan muncul setelah alur pencatatan, engine, dan penyimpanan tervalidasi. Pratinjau belanja hanyalah simulasi dan tidak disimpan.</Note>
  </div>;
}

function QuickAction({ icon: Icon, title, description, onClick }: { icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><span className="quick-action-icon"><Icon size={18} /></span><span className="quick-action-copy"><strong>{title}</strong><span>{description}</span></span><ArrowRight className="quick-arrow" size={16} /></button>;
}

function ProductsPage({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return <div className="content-stack"><PageTitle eyebrow="PENGELOLAAN BARANG" title="Barang" description="Daftar barang, satuan belanja, harga modal, harga jual, dan stok." action={<button className="button button-primary" onClick={() => onNavigate('belanja')}><Plus size={17} /> Catat belanja</button>} /><Note tone="warning" title="Daftar barang belum tersambung">Halaman ini belum membaca atau menyimpan data barang dari database.</Note><EmptyPanel icon={Boxes} title="Belum ada barang" description="Saat backend aktif, barang yang kamu tambahkan akan muncul di sini. Data awal tidak dibuat secara otomatis." action={<button className="button button-secondary" onClick={() => onNavigate('belanja')}>Lihat contoh hitungan belanja <ArrowRight size={15} /></button>} /></div>;
}

function PurchasePage() {
  const [productName, setProductName] = useState('Mie Suksess');
  const [packs, setPacks] = useState('3');
  const [unitsPerPack, setUnitsPerPack] = useState('24');
  const [packCost, setPackCost] = useState('96000');
  const [sellingPrice, setSellingPrice] = useState('7000');
  const [source, setSource] = useState<'STORE' | 'PERSONAL' | 'UNKNOWN'>('UNKNOWN');
  const preview = useMemo(() => calculatePurchasePreview({ packs: Number(packs), unitsPerPack: Number(unitsPerPack), costPerPack: Number(packCost), sellingPricePerUnit: Number(sellingPrice) }), [packs, unitsPerPack, packCost, sellingPrice]);
  const updateNumeric = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => setter(event.target.value.replace(/[^\d]/g, ''));
  return <div className="content-stack"><PageTitle eyebrow="BARANG MASUK" title="Catat belanja" description="Masukkan jumlah kemasan dan harga. Sistem menghitung isi satuan serta modalnya." /><Note title="Ini pratinjau, bukan transaksi nyata">Form ini hanya menghitung di layar. Belum ada tombol penyimpanan yang aktif sampai backend aman tersedia.</Note><div className="purchase-layout"><section className="panel form-panel"><div className="panel-heading"><div><p className="eyebrow">INFORMASI BELANJA</p><h2>Barang yang dibeli</h2></div><span className="panel-heading-icon"><ReceiptText size={17} /></span></div><div className="form-body"><label className="field-label" htmlFor="productName">Nama barang</label><input id="productName" className="text-field" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Contoh: Mie Suksess" maxLength={120} /><div className="field-grid"><div><label className="field-label" htmlFor="packs">Jumlah kemasan</label><div className="input-with-suffix"><input id="packs" className="text-field" inputMode="numeric" value={packs} onChange={updateNumeric(setPacks)} /><span>dus</span></div></div><div><label className="field-label" htmlFor="unitsPerPack">Isi per kemasan</label><div className="input-with-suffix"><input id="unitsPerPack" className="text-field" inputMode="numeric" value={unitsPerPack} onChange={updateNumeric(setUnitsPerPack)} /><span>pcs</span></div></div></div><div className="field-grid"><div><label className="field-label" htmlFor="packCost">Harga per kemasan</label><div className="input-with-prefix"><span>Rp</span><input id="packCost" className="text-field" inputMode="numeric" value={packCost} onChange={updateNumeric(setPackCost)} /></div></div><div><label className="field-label" htmlFor="sellingPrice">Harga jual per pcs</label><div className="input-with-prefix"><span>Rp</span><input id="sellingPrice" className="text-field" inputMode="numeric" value={sellingPrice} onChange={updateNumeric(setSellingPrice)} /></div></div></div><div className="field-divider" /><div><label className="field-label">Sumber uang belanja</label><p className="field-help">Pilih sesuai kejadian. Ini tidak disimpan pada pratinjau.</p><div className="choice-grid"><button type="button" className={`choice-card ${source === 'STORE' ? 'choice-selected' : ''}`} onClick={() => setSource('STORE')}><Wallet size={17} /><strong>Uang toko</strong><span>Uang toko berkurang</span></button><button type="button" className={`choice-card ${source === 'PERSONAL' ? 'choice-selected' : ''}`} onClick={() => setSource('PERSONAL')}><BriefcaseBusiness size={17} /><strong>Uang pribadi</strong><span>Kas toko tidak berkurang</span></button><button type="button" className={`choice-card ${source === 'UNKNOWN' ? 'choice-selected' : ''}`} onClick={() => setSource('UNKNOWN')}><CircleHelp size={17} /><strong>Belum tahu</strong><span>Hasil uang belum pasti</span></button></div></div><div className="form-footer"><button className="button button-disabled" disabled title="Penyimpanan belum diaktifkan"><Check size={16} /> Simpan belanja (belum aktif)</button><span><ShieldCheck size={14} /> Tidak ada data yang disimpan</span></div></div></section>
      <aside className="panel preview-panel"><div className="panel-heading"><div><p className="eyebrow">HASIL OTOMATIS</p><h2>Pratinjau belanja</h2></div><StatusPill tone="warn">Belum disimpan</StatusPill></div>{preview ? <><div className="preview-product"><span className="preview-box-icon"><Package size={20} /></span><div><strong>{productName.trim() || 'Nama barang belum diisi'}</strong><span>Hitungan dari angka yang kamu masukkan</span></div></div><div className="preview-stat"><span>Barang masuk</span><strong>{preview.totalUnits.toLocaleString('id-ID')} pcs</strong></div><div className="preview-stat"><span>Total modal</span><strong>{money(preview.totalCost)}</strong></div><div className="preview-stat"><span>Modal rata-rata per pcs</span><strong>{money(preview.unitCostRounded)}</strong></div><div className="preview-stat"><span>Selisih harga jual dan modal per pcs</span><strong className={preview.unitPriceDifference >= 0 ? 'value-positive' : 'value-negative'}>{money(preview.unitPriceDifference)}</strong></div><div className="preview-callout"><Lightbulb size={16} /><p>Nilai ini adalah pratinjau belanja. Bukan keuntungan final dan tidak termasuk pengeluaran toko.</p></div><div className="preview-cash"><div className="preview-cash-icon"><ArrowDownRight size={17} /></div><div><span>Dampak pada uang toko</span><strong>{source === 'STORE' ? `Keluar ${money(preview.totalCost)}` : source === 'PERSONAL' ? 'Tidak mengurangi uang toko' : 'Belum dapat dipastikan'}</strong></div></div></> : <EmptyPanel icon={Calculator} title="Periksa angka" description="Masukkan jumlah dan nominal bulat yang valid untuk melihat pratinjau." />}</aside></div><p className="footnote"><Info size={14} /> Nilai uang dibulatkan ke rupiah. Perhitungan final harus divalidasi lagi oleh server sebelum implementasi penyimpanan.</p></div>;
}


function StockCheckPage() {
  const [items, setItems] = useState([{ name: 'Mie Suksess', value: '' }, { name: 'Saltchees', value: '' }, { name: 'Malkist', value: '' }]);
  return <div className="content-stack"><PageTitle eyebrow="STOK FISIK" title="Cek sisa barang" description="Masukkan jumlah barang yang benar-benar kamu hitung. Barang terjual akan diturunkan oleh sistem jika acuannya lengkap." /><Note tone="warning" title="Data barang belum tersedia">Daftar berikut hanya contoh kolom untuk menunjukkan alur. Angka yang diketik tidak disimpan dan tidak memengaruhi perhitungan toko.</Note><section className="panel"><div className="panel-heading"><div><p className="eyebrow">CONTOH FORM</p><h2>Berapa sisa barang sekarang?</h2></div><span className="panel-heading-icon"><ClipboardCheck size={17} /></span></div><div className="stock-entry-list">{items.map((item, index) => <div className="stock-entry" key={item.name}><div className="stock-product-avatar">{item.name.slice(0, 1)}</div><div className="stock-product-label"><strong>{item.name}</strong><span>Contoh tampilan, bukan barang tersimpan</span></div><label className="stock-number-wrap"><span className="sr-only">Jumlah sisa {item.name}</span><input inputMode="numeric" className="text-field" value={item.value} onChange={(e) => setItems((old) => old.map((row, i) => i === index ? { ...row, value: e.target.value.replace(/[^\d]/g, '') } : row))} placeholder="0" /><span>pcs</span></label></div>)}</div><div className="panel-bottom-note"><Info size={15} /> Jika stok fisik lebih banyak dari stok yang dapat dijelaskan, sistem perlu meminta pemeriksaan — bukan membuat penjualan negatif.</div><div className="form-footer"><button className="button button-disabled" disabled><Check size={16} /> Simpan cek sisa (belum aktif)</button></div></section></div>;
}

function CashPage() {
  return <div className="content-stack"><PageTitle eyebrow="UANG TOKO" title="Uang & setoran" description="Pisahkan uang yang seharusnya tersedia, uang yang benar-benar disetorkan, serta biaya dan pendapatan tambahan." /><Note tone="warning" title="Belum ada catatan uang">Angka uang sengaja tidak dihitung ketika tidak ada transaksi terverifikasi.</Note><section className="metric-grid metric-grid-three">{[{ label: 'Uang toko seharusnya', value: '—', icon: Wallet }, { label: 'Total setoran aktual', value: '—', icon: Banknote }, { label: 'Selisih', value: '—', icon: ArrowDownRight }].map(({ label, value, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} /></span></div><strong className="metric-value">{value}</strong><p>Menunggu catatan yang sah</p></article>)}</section><div className="two-column-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">UANG KELUAR</p><h2>Pengeluaran toko</h2></div></div><EmptyPanel icon={ReceiptText} title="Belum ada pengeluaran" description="Contohnya gas, plastik, es batu, atau sabun. Pencatatan belum diaktifkan." /></section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">UANG MASUK</p><h2>Pendapatan lain</h2></div></div><EmptyPanel icon={Banknote} title="Belum ada pendapatan lain" description="Contohnya jasa seduh mi. Ini terpisah dari penjualan barang." /></section></div></div>;
}

function ReportsPage() {
  return <div className="content-stack"><PageTitle eyebrow="RINGKASAN USAHA" title="Laporan" description="Lihat penjualan, keuntungan, stok, pengeluaran, dan setoran per periode." /><Note title="Laporan mengikuti data yang dapat dipastikan">Bagian yang belum diketahui akan ditandai, bukan diam-diam dianggap nol atau dihitung seolah-olah pasti.</Note><EmptyPanel icon={FileChartColumn} title="Laporan belum tersedia" description="Laporan akan diaktifkan setelah pencatatan dan penyimpanan telah dibuat serta diuji." /></div>;
}

function AssistantPage({ enabled, onToggle, onSettings }: { enabled: boolean; onToggle: (next: boolean) => void; onSettings: () => void }) {
  return <div className="content-stack"><PageTitle eyebrow="FITUR OPSIONAL" title="Asisten" description="Direncanakan untuk menerima catatan dengan bahasa sehari-hari, dengan persetujuan sebelum data disimpan." /><section className="assistant-hero"><div className="assistant-icon"><Sparkles size={25} /></div><div className="assistant-copy"><StatusPill tone={enabled ? 'warn' : 'neutral'}>{enabled ? 'UI Asisten ON' : 'Asisten OFF'}</StatusPill><h2>{enabled ? 'Tampilan asisten aktif, koneksi AI belum ada.' : 'Aplikasi tetap berjalan tanpa AI.'}</h2><p>{enabled ? 'Sakelar ini hanya menampilkan panel asisten. Belum ada model AI yang dipanggil, tidak ada API key, dan tidak ada teks yang dikirim ke layanan luar.' : 'Sesuai rencana, pencatatan inti dapat dibangun dan diuji tanpa AI. Aktifkan tampilan asisten hanya saat kamu ingin meninjau rancangan fitur tersebut.'}</p><button className="button button-secondary" onClick={() => enabled ? onToggle(false) : onToggle(true)}>{enabled ? 'Matikan Asisten UI' : 'Aktifkan tampilan Asisten'} <ArrowRight size={15} /></button></div><div className="assistant-sparkline"><Sparkles size={68} strokeWidth={0.8} /></div></section>{enabled ? <section className="panel assistant-panel"><div className="panel-heading"><div><p className="eyebrow">PRATINJAU FITUR</p><h2>Catatan dengan bahasa sehari-hari</h2></div><StatusPill tone="off">Belum tersambung</StatusPill></div><div className="assistant-message"><span className="assistant-avatar"><Sparkles size={17} /></span><p><strong>Asisten TOKO SAKALA</strong><br />Koneksi AI belum diimplementasikan. Untuk sekarang, gunakan halaman Belanja dan Cek sisa untuk melihat rancangan alur yang tidak memerlukan AI.</p></div><div className="disabled-compose"><input disabled placeholder="AI belum terhubung — kolom ini belum aktif" /><button disabled className="button button-disabled" aria-label="Kirim pesan"><ArrowRight size={16} /></button></div><p className="field-help">Tidak ada API key atau integrasi Gemini di paket ini. ON/OFF di sini hanya mengatur preferensi UI.</p></section> : <EmptyPanel icon={Sparkles} title="Asisten sedang OFF" description="Fitur AI sengaja nonaktif secara default. Aktifkan tampilannya melalui Pengaturan kapan pun diperlukan." action={<button className="button button-secondary" onClick={onSettings}>Buka pengaturan <ArrowRight size={15} /></button>} />}<Note title="Prinsip keamanan AI">Saat fitur ini kelak terhubung, AI hanya boleh mengusulkan transaksi. Engine deterministik tetap menghitung, pengguna meninjau, dan server memvalidasi sebelum menyimpan.</Note></div>;
}

function HistoryPage() {
  return <div className="content-stack"><PageTitle eyebrow="JEJAK PERUBAHAN" title="Riwayat" description="Riwayat membantu melacak catatan yang dibuat, direvisi, dibatalkan, atau dikoreksi." /><Note tone="warning" title="Riwayat transaksi belum tersedia">Tidak ada catatan yang tersimpan. Setelah backend aktif, perubahan harus dapat dilacak dan tidak boleh mengubah sejarah secara diam-diam.</Note><EmptyPanel icon={Clock3} title="Belum ada riwayat" description="Riwayat akan muncul setelah ada data yang benar-benar berhasil disimpan." /></div>;
}

function SettingsPage({ enabled, onToggle }: { enabled: boolean; onToggle: (next: boolean) => void }) {
  return <div className="content-stack"><PageTitle eyebrow="PREFERENSI APLIKASI" title="Pengaturan" description="Atur pengalaman aplikasi. Preferensi asisten hanya disimpan di browser ini; data keuangan belum disimpan." /><section className="panel settings-panel"><div className="panel-heading"><div><p className="eyebrow">FITUR OPSIONAL</p><h2>Asisten AI</h2></div><span className="panel-heading-icon"><Sparkles size={17} /></span></div><div className="setting-row"><div className="setting-copy"><div className="setting-title"><strong>Asisten AI</strong><StatusPill tone={enabled ? 'warn' : 'neutral'}>{enabled ? 'ON' : 'OFF'}</StatusPill></div><p>{enabled ? 'Tampilan asisten diaktifkan. Integrasi model masih belum dibuat.' : 'Nonaktif. Aplikasi inti tidak memerlukan AI untuk menjalankan alur dasar.'}</p></div><AiToggle enabled={enabled} onChange={onToggle} /></div><div className="setting-explainer"><Info size={17} /><div><strong>Yang berubah saat sakelar digeser</strong><p>Hanya tampilan panel asisten. Sakelar ON belum menghubungkan Gemini, tidak mengirim data ke luar aplikasi, dan tidak mengaktifkan API. Saat integrasi AI dibuat pada tahap berikutnya, perilaku ini harus ditinjau ulang dengan persetujuanmu.</p></div></div></section><section className="panel settings-panel"><div className="panel-heading"><div><p className="eyebrow">STATUS PROYEK</p><h2>Fondasi aplikasi</h2></div><span className="panel-heading-icon"><ShieldCheck size={17} /></span></div><div className="project-check-list"><ProjectCheck label="Antarmuka React responsif" state="Ada di starter" good /><ProjectCheck label="Engine pratinjau belanja awal" state="Ada; cakupan terbatas" good /><ProjectCheck label="Asisten AI" state={AI_INTEGRATION_CONNECTED ? 'Tersambung' : 'Belum tersambung'} /><ProjectCheck label="Simpan transaksi ke database" state="Belum aktif" /><ProjectCheck label="Backup dan pemulihan data toko" state="Belum diuji" /></div></section><Note tone="warning" title="Jangan masukkan data toko sebenarnya dulu">Sebelum pencatatan nyata, backend perlu menyimpan transaksi secara atomik, melakukan validasi server, menjaga riwayat append-only, serta lulus uji backup/pemulihan dan keamanan akses.</Note></div>;
}

function ProjectCheck({ label, state, good = false }: { label: string; state: string; good?: boolean }) {
  return <div className="project-check-row"><span className={`check-mark ${good ? 'check-mark-good' : ''}`}>{good ? <Check size={14} /> : <Clock3 size={14} />}</span><span>{label}</span><span className="project-check-state">{state}</span></div>;
}

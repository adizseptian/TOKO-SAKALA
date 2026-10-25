import {
  ShoppingBasket,
  ClipboardCheck,
  Receipt,
  Banknote,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  Sparkles
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah } from '@/lib/utils';
import type { ScreenId } from '@/types/store';

interface WorkflowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export function WorkflowGuideModal({
  isOpen,
  onClose,
  onNavigate
}: WorkflowGuideModalProps) {
  const handleGo = (screen: ScreenId) => {
    onClose();
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Panduan Alur Kerja Toko Sakala"
      description="4 langkah harian mudah untuk mengontrol penjualan otomatis dan serah-terima kas"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-xs text-[var(--text-main)] max-h-[75vh] overflow-y-auto pr-1">
        {/* Section 1: 2 Aturan Kunci */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
            <h4 className="font-bold text-sm text-[var(--text-main)] uppercase tracking-wide">
              1. Dua Aturan Kunci yang Wajib Dipahami
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Rule 1 */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Keuntungan Jual BUKAN Laba</span>
              </div>
              <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                Ini adalah total uang yang akan didapat jika <strong>semua barang habis terjual</strong> sebelum dikurangi modal beli. Angka ini merupakan potensi nilai jual, bukan uang keuntungan murni Anda.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 space-y-2">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold">
                <Banknote className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>Setoran BUKAN Setor ke Bank</span>
              </div>
              <p className="text-[11px] text-sky-900/90 dark:text-sky-200/90 leading-relaxed">
                Setoran adalah <strong>serah-terima uang hasil usaha dari karyawan ke tangan pemilik (owner)</strong>. Ini memindahkan penguasaan uang fisik, bukan menambah pendapatan baru dan bukan biaya toko.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: 4 Langkah Harian */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-mint)] shrink-0" />
            <h4 className="font-bold text-sm text-[var(--text-main)] uppercase tracking-wide">
              2. Alur 4 Langkah Kerja Harian
            </h4>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3.5 hover:border-[var(--primary)] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#ffeae5] dark:bg-[#e06346]/20 text-[#8c2612] dark:text-[#ff927f] font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[var(--text-main)]">
                    Catat Belanja (Barang Masuk)
                  </strong>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleGo('belanja')}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Buka Form <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Masukkan jumlah dus/pak, isi per kemasan, harga modal beli, dan harga jual satuan. Sistem otomatis menghitung total unit masuk dan potensi nilai jualnya.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3.5 hover:border-[var(--primary)] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#e7f7f0] dark:bg-[#2dd4bf]/20 text-[#056045] dark:text-[#5eead4] font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[var(--text-main)]">
                    Cek Sisa Fisik Rak
                  </strong>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleGo('cek-sisa')}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Buka Form <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Cukup hitung sisa barang yang ada di rak toko dan masukkan dalam tabel bersama. Sistem otomatis mendeteksi penjualan: <code className="bg-[var(--bg-card)] px-1.5 py-0.5 rounded text-[10px] font-semibold text-[var(--text-main)]">Unit Terjual = Stok Ada − Sisa Rak</code>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3.5 hover:border-[var(--primary)] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#f2eafa] dark:bg-[#a78bfa]/20 text-[#5519b5] dark:text-[#c4b5fd] font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[var(--text-main)]">
                    Catat Biaya Toko & Operasional
                  </strong>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleGo('setoran')}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Buka Form <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Bila ada pengeluaran (plastik, bensin, token listrik), pilih sumber uangnya dengan teliti:
                  <br />• <strong>Kas Toko</strong>: Mengurangi kewajiban uang yang harus diserahkan karyawan.
                  <br />• <strong>Uang Pribadi</strong>: Tidak mengurangi uang kas di tangan karyawan.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3.5 hover:border-[var(--primary)] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#eaf4fb] dark:bg-[#38bdf8]/20 text-[#034f78] dark:text-[#7dd3fc] font-bold flex items-center justify-center shrink-0">
                4
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[var(--text-main)]">
                    Terima Setoran dari Karyawan
                  </strong>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleGo('setoran')}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Buka Form <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Saat karyawan menyerahkan uang jualan ke owner, masukkan nominal uang nyata yang diterima dan nama karyawan. Sistem otomatis membandingkan dengan uang yang seharusnya diserahkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Status Serah-Terima */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
            <h4 className="font-bold text-sm text-[var(--text-main)] uppercase tracking-wide">
              3. Arti Status Serah-Terima Uang
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">
                ✓ Cocok
              </span>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 mt-0.5">
                Jumlah uang yang diterima owner pas persis dengan hitungan sistem, seluruh data persediaan pasti.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
              <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">
                ⚠ Perlu Diperiksa
              </span>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 mt-0.5">
                Ada selisih nominal atau ada data harga/stok yang masih belum pasti dihitung.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30">
              <span className="font-bold text-rose-800 dark:text-rose-300 block text-xs">
                ✕ Belum Cocok
              </span>
              <p className="text-[11px] text-rose-900/80 dark:text-rose-200/80 mt-0.5">
                Semua data sudah pasti, tetapi uang nyata yang diserahkan kurang atau berlebih dari hitungan.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-300 block text-xs">
                ⏳ Menunggu Setoran
              </span>
              <p className="text-[11px] text-slate-700/80 dark:text-slate-300/80 mt-0.5">
                Penjualan sudah terhitung dari sisa rak, tetapi serah-terima uang belum dicatat oleh owner.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Contoh Nyata 1 Siklus */}
        <section className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-slate-900 dark:to-slate-800/80 border border-indigo-200/80 dark:border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Contoh Nyata (Satu Siklus Toko)</span>
          </div>
          <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <p>1. Beli <strong>48 mie</strong> @ modal Rp4.000, jual Rp7.000 ➔ Potensi nilai jual = <strong>Rp336.000</strong>.</p>
            <p>2. Cek rak sore hari: sisa <strong>10 mie</strong> ➔ Berarti <strong>38 mie laku</strong> = omzet penjualan <strong>Rp266.000</strong>.</p>
            <p>3. Karyawan bayar sampah <strong>Rp20.000</strong> dari uang toko ➔ Saldo wajib diserahkan = <strong>Rp246.000</strong>.</p>
            <p>4. Karyawan menyerahkan uang ke owner:</p>
            <div className="pl-4 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
              <p>• Bila diserahkan <strong>Rp246.000</strong> ➔ Status: <span className="font-bold text-emerald-600">Cocok</span>.</p>
              <p>• Bila diserahkan <strong>Rp240.000</strong> ➔ Status: <span className="font-bold text-amber-600">Perlu Diperiksa (Kurang Rp6.000)</span> untuk ditelusuri bersama tanpa prasangka.</p>
            </div>
          </div>
        </section>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="sakala-btn sakala-btn-primary px-5 py-2 text-xs font-bold"
          >
            Mengerti & Tutup Panduan
          </button>
        </div>
      </div>
    </Modal>
  );
}

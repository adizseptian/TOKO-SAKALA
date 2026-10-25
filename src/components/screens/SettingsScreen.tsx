import { useState, useRef } from 'react';
import { Settings2, Moon, Sun, Download, Upload, RefreshCw, Trash2, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { Modal } from '@/components/ui/Modal';

export function SettingsScreen() {
  const {
    theme,
    setTheme,
    aiEnabled,
    setAiEnabled,
    loadSeedData,
    clearAllData,
    exportData,
    importData,
    notify
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleDownloadBackup = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `toko-sakala-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('success', 'Cadangan Diunduh', 'File JSON cadangan data toko berhasil disimpan.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importData(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-4xl"
    >
      {/* 1. Tampilan & Tema */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
            Tema Antarmuka
          </h3>
          <span className="text-xs text-[var(--text-dim)]">Mode Visual</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              theme === 'dark'
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)] shadow-sm'
                : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
            }`}
          >
            <Moon className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-xs font-semibold block">Mode Gelap (Velvet Midnight Indigo)</strong>
              <span className="text-[11px] text-[var(--text-dim)] block">
                Nuansa malam indigo pekat dan aksen terracotta coral yang ramah di mata
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              theme === 'light'
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)] shadow-sm'
                : 'border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-xs font-semibold block">Mode Terang (Warm Alabaster Ivory)</strong>
              <span className="text-[11px] text-[var(--text-dim)] block">
                Kanvas ivory hangat dengan kontras kartu bersih dan tipografi tajam
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Asisten AI Opsional */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-mint)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
              Asisten Pencatatan
            </h3>
          </div>
          <span className="text-xs text-[var(--text-dim)]">Fitur Tambahan</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 max-w-lg">
            <strong className="text-xs font-semibold text-[var(--text-main)] block">
              Aktifkan Panel Asisten
            </strong>
            <p className="text-xs text-[var(--text-muted)]">
              Membantu merapikan catatan bebas menjadi format draft transaksi. Berjalan 100% lokal tanpa biaya.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`sakala-btn ${aiEnabled ? 'sakala-btn-primary' : 'sakala-btn-secondary'} text-xs h-9`}
          >
            {aiEnabled ? 'Aktif (ON)' : 'Mati (OFF)'}
          </button>
        </div>
      </section>

      {/* 3. Manajemen & Cadangan Data */}
      <section className="sakala-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
            Cadangan & Pemulihan Data
          </h3>
          <span className="text-xs text-[var(--text-dim)]">Penyimpanan Lokal</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="sakala-btn sakala-btn-secondary justify-start h-auto p-3 text-xs"
          >
            <Download className="w-4 h-4 text-[var(--accent-mint)] shrink-0" />
            <div className="text-left">
              <strong className="block text-[var(--text-main)]">Unduh Cadangan (Export JSON)</strong>
              <span className="text-[11px] text-[var(--text-dim)]">Simpan semua barang dan riwayat ke komputer</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="sakala-btn sakala-btn-secondary justify-start h-auto p-3 text-xs"
          >
            <Upload className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="text-left">
              <strong className="block text-[var(--text-main)]">Pulihkan Data (Import JSON)</strong>
              <span className="text-[11px] text-[var(--text-dim)]">Muat kembali file cadangan yang pernah diunduh</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={loadSeedData}
            className="sakala-btn sakala-btn-secondary justify-start h-auto p-3 text-xs"
          >
            <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left">
              <strong className="block text-[var(--text-main)]">Muat Data Simulasi Warung</strong>
              <span className="text-[11px] text-[var(--text-dim)]">Isi ulang contoh data barang & transaksi warung</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="sakala-btn sakala-btn-danger justify-start h-auto p-3 text-xs"
          >
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-left">
              <strong className="block text-rose-400">Kosongkan Semua Data</strong>
              <span className="text-[11px] text-rose-400/80">Hapus seluruh barang dan transaksi untuk mulai dari nol</span>
            </div>
          </button>
        </div>
      </section>

      {/* Confirmation Modal for Clear Data */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Kosongkan Semua Data Toko?"
        description="Tindakan ini akan menghapus semua barang terdaftar dan seluruh riwayat catatan toko."
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Pastikan Anda telah mengunduh cadangan jika ingin menyimpan data sebelumnya. Anda juga dapat memuat kembali data contoh simulasi kapan saja.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="sakala-btn sakala-btn-ghost text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllData();
                setIsClearModalOpen(false);
              }}
              className="sakala-btn sakala-btn-danger text-xs"
            >
              Ya, Kosongkan
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

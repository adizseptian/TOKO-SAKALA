import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, ChevronDown, Check, FileText } from 'lucide-react';
import { serializeMasterReportToCSV, serializeTransactionsToCSV, serializeProductsToCSV, downloadCSV } from '@/utils/export';
import type { EngineOutput } from '@/engine/contract';
import type { Product, AppEvent } from '@/domain/event';

export interface ExportToCSVButtonProps {
  engineOutput: EngineOutput;
  products: Product[];
  events: AppEvent[];
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => void;
  className?: string;
}

export function ExportToCSVButton({
  engineOutput,
  products,
  events,
  onNotify,
  className = ''
}: ExportToCSVButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportMaster = () => {
    const csvContent = serializeMasterReportToCSV(engineOutput, products);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csvContent, `laporan-lengkap-toko-sakala-${dateStr}.csv`);
    setIsOpen(false);
    onNotify?.(
      'success',
      'Ekspor CSV Berhasil',
      'Laporan lengkap keuangan & stok berhasil diunduh dalam format CSV.'
    );
  };

  const handleExportTransactions = () => {
    if (events.length === 0) {
      onNotify?.('warning', 'Tidak Ada Transaksi', 'Belum ada data transaksi yang tersimpan.');
      setIsOpen(false);
      return;
    }
    const csvContent = serializeTransactionsToCSV(events, products);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csvContent, `transaksi-toko-sakala-${dateStr}.csv`);
    setIsOpen(false);
    onNotify?.(
      'success',
      'Ekspor CSV Transaksi Berhasil',
      `${events.length} catatan transaksi berhasil diunduh.`
    );
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      onNotify?.('warning', 'Tidak Ada Barang', 'Belum ada data barang di katalog toko.');
      setIsOpen(false);
      return;
    }
    const csvContent = serializeProductsToCSV(products, engineOutput.products);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csvContent, `stok-barang-toko-sakala-${dateStr}.csv`);
    setIsOpen(false);
    onNotify?.(
      'success',
      'Ekspor CSV Barang Berhasil',
      `Data kinerja ${products.length} barang berhasil diunduh.`
    );
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div className="inline-flex rounded-lg shadow-sm">
        <button
          type="button"
          onClick={handleExportMaster}
          className="sakala-btn sakala-btn-primary text-xs h-9 px-3.5 rounded-r-none border-r border-blue-700 focus:z-10 flex items-center gap-2"
          title="Unduh laporan lengkap keuangan & stok saat ini dalam format CSV"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV</span>
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="sakala-btn sakala-btn-primary text-xs h-9 px-2 rounded-l-none border-l-0 focus:z-10"
          aria-label="Pilih jenis ekspor CSV"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-[var(--border-subtle)]">
            <span className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider block">
              Pilihan Format CSV
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportMaster}
            className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] flex items-start gap-2.5 transition-colors group"
          >
            <FileSpreadsheet className="w-4 h-4 text-[var(--accent-mint)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-main)] block font-medium group-hover:text-[var(--accent-mint)]">
                Laporan Lengkap Toko
              </strong>
              <span className="text-[11px] text-[var(--text-dim)] block">
                Ringkasan Laba Rugi + Rincian Semua Barang
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportTransactions}
            className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] flex items-start gap-2.5 transition-colors group"
          >
            <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-main)] block font-medium group-hover:text-sky-300">
                Riwayat Transaksi ({events.length})
              </strong>
              <span className="text-[11px] text-[var(--text-dim)] block">
                Belanja masuk, sisa fisik, pengeluaran & setoran
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportProducts}
            className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] flex items-start gap-2.5 transition-colors group"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-main)] block font-medium group-hover:text-emerald-300">
                Kinerja Stok Barang ({products.length})
              </strong>
              <span className="text-[11px] text-[var(--text-dim)] block">
                Sisa stok, terjual, HPP modal, & laba kotor barang
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

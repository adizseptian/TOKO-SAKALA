import { useState } from 'react';
import { History, Trash2, Filter, Eye, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import type { AppEvent } from '@/types/store';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export function HistoryScreen() {
  const { events, products, deleteEvent } = useStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<AppEvent | null>(null);

  const filteredEvents = [...events].reverse().filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  const getEventBadge = (type: AppEvent['type']) => {
    switch (type) {
      case 'purchase':
        return { label: 'Belanja Masuk', color: 'text-amber-700 dark:text-amber-400' };
      case 'stock_check':
        return { label: 'Cek Sisa', color: 'text-emerald-700 dark:text-emerald-400' };
      case 'expense':
        return { label: 'Pengeluaran', color: 'text-rose-700 dark:text-rose-400' };
      case 'other_income':
        return { label: 'Pendapatan Lain', color: 'text-emerald-700 dark:text-emerald-400' };
      case 'deposit':
        return { label: 'Setoran Kas', color: 'text-teal-700 dark:text-teal-400' };
      case 'price_change':
        return { label: 'Ubah Harga', color: 'text-sky-700 dark:text-sky-400' };
      default:
        return { label: type, color: 'text-[var(--text-muted)]' };
    }
  };

  const getEventDescription = (ev: AppEvent) => {
    switch (ev.type) {
      case 'purchase': {
        const prod = products.find((p) => p.id === ev.productId);
        return `${prod?.name || 'Barang'}: ${ev.packs} dus (${ev.packs * ev.unitsPerPack} pcs) seharga ${formatRupiah(ev.totalCost)} via ${ev.sourceMoney === 'STORE' ? 'Uang Toko' : 'Uang Pribadi'}`;
      }
      case 'stock_check': {
        const prod = products.find((p) => p.id === ev.productId);
        return `${prod?.name || 'Barang'}: Sisa fisik dihitung ${ev.observedUnits} pcs`;
      }
      case 'expense':
        return `${ev.description}: ${formatRupiah(ev.amount)} via ${ev.sourceMoney === 'STORE' ? 'Uang Toko' : 'Uang Pribadi'}`;
      case 'other_income':
        return `${ev.description}: +${formatRupiah(ev.amount)}`;
      case 'deposit':
        return `Setoran kas diserahkan: ${formatRupiah(ev.amount)}`;
      case 'price_change': {
        const prod = products.find((p) => p.id === ev.productId);
        return `${prod?.name || 'Barang'}: Harga jual diubah menjadi ${formatRupiah(ev.sellingPrice)}`;
      }
      default:
        return 'Catatan transaksi toko';
    }
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-base font-bold text-[var(--text-main)]">
            Jejak Riwayat Aktivitas
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Log kronologis append-only dari seluruh kejadian yang memengaruhi stok dan uang toko
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'purchase', label: 'Belanja' },
            { id: 'stock_check', label: 'Cek Sisa' },
            { id: 'expense', label: 'Pengeluaran' },
            { id: 'deposit', label: 'Setoran' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tidak ada riwayat"
          description="Belum ada transaksi pada kategori yang dipilih."
        />
      ) : (
        <div className="sakala-card overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredEvents.map((ev) => {
              const badge = getEventBadge(ev.type);
              const desc = getEventDescription(ev);

              return (
                <div
                  key={ev.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-elevated)]/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-center font-mono text-[11px] text-[var(--text-dim)] shrink-0 tabular-nums">
                      #{ev.seq}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[var(--text-dim)] text-xs">·</span>
                        <span className="text-[11px] text-[var(--text-dim)]">
                          {formatDateTime(ev.occurredAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(ev)}
                      className="p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                      title="Lihat detail metadata"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEventToDelete(ev)}
                      className="p-2 rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Hapus transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Detail Catatan Transaksi"
        description={selectedEvent ? `Urutan #${selectedEvent.seq} · ${selectedEvent.type}` : ''}
      >
        {selectedEvent && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-muted)] overflow-x-auto">
              <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="sakala-btn sakala-btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={eventToDelete !== null}
        onClose={() => setEventToDelete(null)}
        title="Hapus Catatan Ini?"
        description="Menghapus transaksi akan memicu perhitungan ulang pada stok dan laba toko."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              Tindakan ini tidak dapat dibatalkan. Pastikan Anda hanya menghapus catatan yang memang salah ketik.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEventToDelete(null)}
              className="sakala-btn sakala-btn-ghost"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="sakala-btn sakala-btn-danger"
            >
              Hapus Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

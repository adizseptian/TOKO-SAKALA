import { useState } from 'react';
import { Sparkles, ArrowRight, Check, Send, AlertCircle, ShoppingBasket, Receipt, Banknote } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/context/StoreContext';
import { formatRupiah } from '@/lib/utils';
import type { AppEvent } from '@/types/store';

export function AssistantScreen() {
  const { aiEnabled, setAiEnabled, products, addEvent, notify } = useStore();
  const [inputText, setInputText] = useState('');
  const [parsedDraft, setParsedDraft] = useState<{
    summary: string;
    type: 'purchase' | 'expense' | 'deposit' | 'other_income';
    data: any;
  } | null>(null);

  // Deterministic smart local parser for everyday Indonesian warung phrases
  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const lower = inputText.toLowerCase();

    // 1. Belanja detection: "beli mie 2 dus isi 24 harga 192000"
    if (lower.includes('beli') || lower.includes('kulak') || lower.includes('belanja')) {
      const numbers = lower.match(/\d+/g) || [];
      const packs = numbers[0] ? parseInt(numbers[0], 10) : 1;
      const unitsPerPack = numbers[1] ? parseInt(numbers[1], 10) : 24;
      const totalCost = numbers[2] ? parseInt(numbers[2], 10) : 50000;

      // Find matching product or first
      const matchedProd =
        products.find((p) => lower.includes(p.name.toLowerCase().split(' ')[0])) || products[0];

      if (matchedProd) {
        setParsedDraft({
          summary: `Belanja ${matchedProd.name} sebanyak ${packs} kemasan (@${unitsPerPack} pcs) seharga ${formatRupiah(totalCost)}`,
          type: 'purchase',
          data: {
            type: 'purchase',
            productId: matchedProd.id,
            packs,
            unitsPerPack,
            totalCost,
            sourceMoney: lower.includes('pribadi') ? 'PERSONAL' : 'STORE'
          }
        });
        return;
      }
    }

    // 2. Pengeluaran: "pengeluaran beli kresek 15000" or "biaya gas 22000"
    if (lower.includes('pengeluaran') || lower.includes('biaya') || lower.includes('bayar')) {
      const numbers = lower.match(/\d+/g) || [];
      const amount = numbers[0] ? parseInt(numbers[0], 10) : 10000;
      const cleanDesc = inputText
        .replace(/pengeluaran|biaya|bayar|\d+/gi, '')
        .trim() || 'Biaya operasional warung';

      setParsedDraft({
        summary: `Pengeluaran "${cleanDesc}" sebesar ${formatRupiah(amount)}`,
        type: 'expense',
        data: {
          type: 'expense',
          description: cleanDesc,
          amount,
          sourceMoney: 'STORE'
        }
      });
      return;
    }

    // 3. Setoran: "setor uang 200000" or "setoran 500000"
    if (lower.includes('setor') || lower.includes('setoran')) {
      const numbers = lower.match(/\d+/g) || [];
      const amount = numbers[0] ? parseInt(numbers[0], 10) : 100000;

      setParsedDraft({
        summary: `Setoran kas pemilik sebesar ${formatRupiah(amount)}`,
        type: 'deposit',
        data: {
          type: 'deposit',
          amount
        }
      });
      return;
    }

    // 4. Pendapatan Lain: "pendapatan seduh mi 20000" or "jasa es 15000"
    if (lower.includes('pendapatan') || lower.includes('jasa') || lower.includes('masuk')) {
      const numbers = lower.match(/\d+/g) || [];
      const amount = numbers[0] ? parseInt(numbers[0], 10) : 10000;
      const cleanDesc = inputText
        .replace(/pendapatan|jasa|masuk|\d+/gi, '')
        .trim() || 'Pendapatan jasa seduh / es';

      setParsedDraft({
        summary: `Pendapatan lain "${cleanDesc}" sebesar ${formatRupiah(amount)}`,
        type: 'other_income',
        data: {
          type: 'other_income',
          description: cleanDesc,
          amount
        }
      });
      return;
    }

    notify(
      'info',
      'Belum Dikenali',
      'Coba contoh kalimat seperti: "Beli mie 2 dus isi 24 harga 192000" atau "Biaya listrik 50000"'
    );
  };

  const handleConfirmDraft = () => {
    if (!parsedDraft) return;
    addEvent(parsedDraft.data);
    notify('success', 'Transaksi Disimpan', parsedDraft.summary);
    setParsedDraft(null);
    setInputText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <section className="sakala-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Asisten Pencatatan Pintar
              </h2>
              <span className="text-xs text-[var(--text-dim)]">
                Status: {aiEnabled ? 'Fitur Aktif' : 'Nonaktif (Default)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`sakala-btn ${
              aiEnabled ? 'sakala-btn-secondary' : 'sakala-btn-primary'
            } text-xs`}
          >
            {aiEnabled ? 'Matikan Asisten' : 'Aktifkan Asisten'}
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-2xl">
          {aiEnabled
            ? 'Asisten siap membantu menerjemahkan catatan kalimat sehari-hari Anda menjadi transaksi toko terstruktur. Anda selalu memegang kendali penuh untuk menyetujui usulan transaksi sebelum disimpan.'
            : 'Sesuai arsitektur inti TOKO SAKALA, fitur asisten bersifat opsional dan nonaktif secara default. Seluruh operasional toko dapat berjalan 100% tanpa memerlukan AI.'}
        </p>
      </section>

      {/* Interactive smart parser when enabled */}
      {aiEnabled && (
        <section className="sakala-card p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              Ketik Kejadian Toko dalam Bahasa Sehari-hari
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Contoh: "Beli mie 2 dus isi 24 harga 192000" atau "Bayar kantong kresek 15000"
            </p>
          </div>

          <form onSubmit={handleParse} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik catatan di sini..."
              className="sakala-input flex-1"
            />
            <button type="submit" className="sakala-btn sakala-btn-primary shrink-0">
              <Send className="w-4 h-4" />
              <span>Analisis</span>
            </button>
          </form>

          {/* Parsed proposal draft card */}
          {parsedDraft && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/10 space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
                <Check className="w-4 h-4" />
                <span>Usulan Transaksi Terdeteksi</span>
              </div>

              <p className="text-xs text-[var(--text-main)] font-medium">
                {parsedDraft.summary}
              </p>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setParsedDraft(null)}
                  className="sakala-btn sakala-btn-ghost text-xs"
                >
                  Abaikan
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDraft}
                  className="sakala-btn sakala-btn-primary text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui & Simpan ke Toko</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick example tags */}
          <div className="pt-2 text-xs space-y-2">
            <span className="text-[11px] text-[var(--text-dim)] block">Contoh cepat yang dapat dicoba:</span>
            <div className="flex flex-wrap gap-2">
              {[
                'Beli mie 3 dus isi 24 harga 288000 uang toko',
                'Bayar token listrik warung 50000',
                'Setor uang ke bank 250000',
                'Pendapatan jasa seduh mi 25000'
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInputText(example)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}

import { describe, expect, it } from 'vitest';
import {
  calculateStockSheetSummary,
  validateRow,
  PHOTO_EXAMPLE_ROWS,
  type StockRow,
  type ExpenseRow
} from '@/engine/v1/stock-sheet';

describe('TOKO SAKALA — Alur Cek Sisa Sekaligus (Stock Sheet Engine)', () => {
  it('1. 15 baris contoh lengkap menghasilkan tepat 318 unit dan Rp524.000', () => {
    const summary = calculateStockSheetSummary(PHOTO_EXAMPLE_ROWS);
    expect(summary.completeItemsCount).toBe(15);
    expect(summary.totalQuantity).toBe(318);
    expect(summary.totalRetailValue).toBe(524000);
  });

  it('2. Baris tidak lengkap (ChocoPie) tidak ikut subtotal dan terhitung di incompleteCount', () => {
    const summary = calculateStockSheetSummary(PHOTO_EXAMPLE_ROWS);
    // ChocoPie is row 16, incomplete
    expect(summary.incompleteCount).toBe(1);

    const chocoRow = PHOTO_EXAMPLE_ROWS.find((r) => r.name === 'ChocoPie')!;
    const val = validateRow(chocoRow);
    expect(val.status).toBe('incomplete');
    expect(val.subtotal).toBe(0);
    expect(val.errorMessage).toBe('Coba periksa jumlah atau harga pada baris ini');
  });

  it('3. Baris kosong diabaikan dari perhitungan dan subtotal', () => {
    const rowsWithEmpty: StockRow[] = [
      ...PHOTO_EXAMPLE_ROWS,
      { id: 'empty-1', name: '', quantityStr: '', priceStr: '' },
      { id: 'empty-2', name: '   ', quantityStr: '', priceStr: '  ' }
    ];
    const summary = calculateStockSheetSummary(rowsWithEmpty);
    expect(summary.completeItemsCount).toBe(15);
    expect(summary.emptyCount).toBe(2);
    expect(summary.totalQuantity).toBe(318);
    expect(summary.totalRetailValue).toBe(524000);
  });

  it('4. Sisa nol (0) adalah nilai yang sah untuk barang habis jika nama dan harga tersedia', () => {
    const zeroRow: StockRow = {
      id: 'z1',
      name: 'Teh Botol Kotak',
      quantityStr: '0',
      priceStr: '3500'
    };
    const val = validateRow(zeroRow);
    expect(val.status).toBe('valid');
    expect(val.quantity).toBe(0);
    expect(val.price).toBe(3500);
    expect(val.subtotal).toBe(0);

    const summary = calculateStockSheetSummary([zeroRow]);
    expect(summary.completeItemsCount).toBe(1);
    expect(summary.totalQuantity).toBe(0);
    expect(summary.totalRetailValue).toBe(0);
    expect(summary.incompleteCount).toBe(0);
  });

  it('5. Nilai negatif, pecahan kuantitas, dan nilai invalid ditolak', () => {
    const negativeRow: StockRow = { id: 'n1', name: 'Barang Negatif', quantityStr: '-5', priceStr: '2000' };
    expect(validateRow(negativeRow).status).toBe('invalid');

    const decimalRow: StockRow = { id: 'd1', name: 'Barang Desimal', quantityStr: '3.5', priceStr: '2000' };
    expect(validateRow(decimalRow).status).toBe('invalid');

    const lettersRow: StockRow = { id: 'l1', name: 'Barang Huruf', quantityStr: 'lima', priceStr: '2000' };
    expect(validateRow(lettersRow).status).toBe('invalid');
  });

  it('6. Mengubah kuantitas atau harga memperbarui subtotal baris dan ringkasan secara reaktif', () => {
    const baseRows: StockRow[] = [
      { id: '1', name: 'Kopi Hitam', quantityStr: '10', priceStr: '2000' } // 20.000
    ];
    let summary = calculateStockSheetSummary(baseRows);
    expect(summary.totalQuantity).toBe(10);
    expect(summary.totalRetailValue).toBe(20000);

    // Update quantity from 10 to 15
    const updatedQtyRows: StockRow[] = [
      { ...baseRows[0], quantityStr: '15' } // 30.000
    ];
    summary = calculateStockSheetSummary(updatedQtyRows);
    expect(summary.totalQuantity).toBe(15);
    expect(summary.totalRetailValue).toBe(30000);

    // Update price from 2000 to 2500
    const updatedPriceRows: StockRow[] = [
      { ...updatedQtyRows[0], priceStr: '2500' } // 37.500
    ];
    summary = calculateStockSheetSummary(updatedPriceRows);
    expect(summary.totalQuantity).toBe(15);
    expect(summary.totalRetailValue).toBe(37500);
  });

  it('7. Pengeluaran toko terpisah dari nilai sisa stok', () => {
    const rows: StockRow[] = [
      { id: '1', name: 'Biskuit', quantityStr: '10', priceStr: '5000' } // 50.000
    ];
    const expenses: ExpenseRow[] = [
      { id: 'exp-1', name: 'Gas LPG 3kg', amountStr: '22000' },
      { id: 'exp-2', name: 'Plastik Kresek', amountStr: '15000' }
    ];

    const summary = calculateStockSheetSummary(rows, expenses);
    expect(summary.totalRetailValue).toBe(50000);
    expect(summary.totalExpenses).toBe(37000);
    // Verified: totalRetailValue does NOT subtract expenses
    expect(summary.totalRetailValue - summary.totalExpenses).toBe(13000);
    expect(summary.totalRetailValue).toBe(50000);
  });
});

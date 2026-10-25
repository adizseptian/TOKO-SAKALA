export interface StockRow {
  id: string;
  name: string;
  category?: string;
  quantityStr: string; // raw user input
  priceStr: string;    // raw user input
  unit?: string;       // e.g. "pcs", "bks", "btl"
  productId?: string;  // if linked to master catalog
}

export interface ExpenseRow {
  id: string;
  name: string;
  amountStr: string;
}

export interface ValidatedStockRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  subtotal: number;
  unit: string;
  productId?: string;
  status: 'valid' | 'empty' | 'incomplete' | 'invalid';
  errorMessage?: string;
}

export interface StockSheetSummary {
  completeItemsCount: number;
  totalQuantity: number;
  totalRetailValue: number;
  incompleteCount: number;
  emptyCount: number;
  totalExpenses: number;
  isOverflow: boolean;
}

/** Check if row is entirely empty */
export function isRowEmpty(row: StockRow): boolean {
  return !row.name.trim() && !row.quantityStr.trim() && !row.priceStr.trim();
}

/** Validate an individual row */
export function validateRow(row: StockRow): ValidatedStockRow {
  const name = row.name.trim();
  const rawQty = row.quantityStr.trim();
  const rawPrice = row.priceStr.trim();
  const category = (row.category || '').trim();
  const unit = row.unit || 'pcs';

  if (!name && !rawQty && !rawPrice) {
    return {
      id: row.id,
      name: '',
      category: '',
      quantity: 0,
      price: 0,
      subtotal: 0,
      unit,
      productId: row.productId,
      status: 'empty'
    };
  }

  // If one of name, qty, or price is missing
  if (!name || rawQty === '' || rawPrice === '') {
    return {
      id: row.id,
      name,
      category,
      quantity: 0,
      price: 0,
      subtotal: 0,
      unit,
      productId: row.productId,
      status: 'incomplete',
      errorMessage: 'Coba periksa jumlah atau harga pada baris ini'
    };
  }

  // Must be non-negative integers (no decimals, no negative)
  if (!/^\d+$/.test(rawQty) || !/^\d+$/.test(rawPrice)) {
    return {
      id: row.id,
      name,
      category,
      quantity: 0,
      price: 0,
      subtotal: 0,
      unit,
      productId: row.productId,
      status: 'invalid',
      errorMessage: 'Jumlah dan harga harus berupa bilangan bulat positif atau 0'
    };
  }

  const quantity = Number(rawQty);
  const price = Number(rawPrice);

  if (!Number.isSafeInteger(quantity) || !Number.isSafeInteger(price)) {
    return {
      id: row.id,
      name,
      category,
      quantity: 0,
      price: 0,
      subtotal: 0,
      unit,
      productId: row.productId,
      status: 'invalid',
      errorMessage: 'Angka terlalu besar untuk dihitung dengan aman'
    };
  }

  if (quantity < 0 || price < 0) {
    return {
      id: row.id,
      name,
      category,
      quantity: 0,
      price: 0,
      subtotal: 0,
      unit,
      productId: row.productId,
      status: 'invalid',
      errorMessage: 'Nilai tidak boleh negatif'
    };
  }

  const subtotal = quantity * price;
  if (!Number.isSafeInteger(subtotal)) {
    return {
      id: row.id,
      name,
      category,
      quantity,
      price,
      subtotal: 0,
      unit,
      productId: row.productId,
      status: 'invalid',
      errorMessage: 'Hasil kali melebihi batas hitungan aman'
    };
  }

  return {
    id: row.id,
    name,
    category,
    quantity,
    price,
    subtotal,
    unit,
    productId: row.productId,
    status: 'valid'
  };
}

/** Calculate summary of the sheet */
export function calculateStockSheetSummary(
  rows: StockRow[],
  expenses: ExpenseRow[] = []
): StockSheetSummary {
  let completeItemsCount = 0;
  let totalQuantity = 0;
  let totalRetailValue = 0;
  let incompleteCount = 0;
  let emptyCount = 0;
  let isOverflow = false;

  for (const row of rows) {
    const val = validateRow(row);
    if (val.status === 'valid') {
      completeItemsCount += 1;
      totalQuantity += val.quantity;
      totalRetailValue += val.subtotal;

      if (!Number.isSafeInteger(totalQuantity) || !Number.isSafeInteger(totalRetailValue)) {
        isOverflow = true;
      }
    } else if (val.status === 'empty') {
      emptyCount += 1;
    } else {
      incompleteCount += 1;
    }
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    const cleanAmount = exp.amountStr.replace(/\D/g, '');
    if (cleanAmount && /^\d+$/.test(cleanAmount)) {
      const amt = Number(cleanAmount);
      if (Number.isSafeInteger(amt)) {
        totalExpenses += amt;
      }
    }
  }

  return {
    completeItemsCount,
    totalQuantity,
    totalRetailValue,
    incompleteCount,
    emptyCount,
    totalExpenses,
    isOverflow
  };
}

/** 15 complete rows + 1 incomplete ChocoPie row from the handwriting sample photo */
export const PHOTO_EXAMPLE_ROWS: StockRow[] = [
  { id: 'ex-1', name: 'Chocolatos', category: 'Makanan', quantityStr: '24', priceStr: '1000', unit: 'pcs' },
  { id: 'ex-2', name: 'Beng-Beng', category: 'Makanan', quantityStr: '20', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-3', name: 'Better Sandwich', category: 'Makanan', quantityStr: '18', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-4', name: 'Malkist Abon', category: 'Makanan', quantityStr: '15', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-5', name: 'Roma Kelapa', category: 'Makanan', quantityStr: '10', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-6', name: 'Slai O Lai', category: 'Makanan', quantityStr: '22', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-7', name: 'Oreo Vanilla', category: 'Makanan', quantityStr: '16', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-8', name: 'Nabati Wafer Keju', category: 'Makanan', quantityStr: '25', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-9', name: 'Goriorio', category: 'Makanan', quantityStr: '30', priceStr: '1000', unit: 'pcs' },
  { id: 'ex-10', name: 'Momogi Jagung Bakar', category: 'Makanan', quantityStr: '28', priceStr: '1000', unit: 'pcs' },
  { id: 'ex-11', name: 'Gery Salut Malkist', category: 'Makanan', quantityStr: '20', priceStr: '1500', unit: 'pcs' },
  { id: 'ex-12', name: 'Tango Wafer Cokelat', category: 'Makanan', quantityStr: '15', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-13', name: 'Richeese Roll', category: 'Makanan', quantityStr: '25', priceStr: '2000', unit: 'pcs' },
  { id: 'ex-14', name: 'Good Time Cookies', category: 'Makanan', quantityStr: '20', priceStr: '2500', unit: 'pcs' },
  { id: 'ex-15', name: 'Deka Wafer Roll', category: 'Makanan', quantityStr: '30', priceStr: '1000', unit: 'pcs' },
  // Row 16: ChocoPie with incomplete information as specified in the test instructions
  { id: 'ex-16', name: 'ChocoPie', category: 'Makanan', quantityStr: '', priceStr: '', unit: 'pcs' }
];

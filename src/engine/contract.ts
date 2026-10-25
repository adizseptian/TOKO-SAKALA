import type { AppEvent, Product } from "@/domain/event";

export interface AmountRange {
  min: number;
  max: number;
}

export interface ProductCalculation {
  productId: string;
  name: string;
  availableUnits: number;
  knownCostUnits: number;
  unknownCostUnits: number;
  knownInventoryValue: number;
  lastObservedUnits: number | null;
  unitsSold: number;
  salesRevenue: AmountRange;
  costOfSoldKnown: number;
  damageLossKnown: number;
  usedLossKnown: number;
  unknownLossKnown: number;
  certainty: "PASTI" | "PERLU_DIPERIKSA" | "BELUM_DIKETAHUI";
  notes: string[];
  potentialSalesRevenue: AmountRange;
  remainingAtSellingPrice: AmountRange;
  grossProfit: AmountRange;
}

export type RemittanceStatus = "COCOK" | "PERLU_DIPERIKSA" | "BELUM_COCOK" | "MENUNGGU_SETORAN";

export interface DepositCheck {
  eventId: string;
  actualAmount: number;
  expectedBeforeDeposit: AmountRange;
  difference: AmountRange;
  certainty: "PASTI" | "PERLU_DIPERIKSA" | "BELUM_DIKETAHUI";
  status: RemittanceStatus;
  statusLabel: string;
  explanation: string;
  employeeName?: string;
  notes?: string;
  periodId?: string;
  occurredAt?: string;
}

export interface EngineOutput {
  products: ProductCalculation[];
  totals: {
    unitsSold: number;
    salesRevenue: AmountRange;
    costOfGoodsSoldKnown: number;
    otherIncome: number;
    expenses: number;
    damageLossKnown: number;
    usedLossKnown: number;
    unknownLossKnown: number;
    profit: AmountRange | null;
    certainty: "PASTI" | "PERLU_DIPERIKSA" | "BELUM_DIKETAHUI";
    storeCashAfterDeposits: AmountRange; // Saldo uang usaha yang masih dipegang karyawan
    totalDeposits: number; // Setoran aktual kumulatif yang diterima owner
    expectedEmployeeRemittance: AmountRange; // Uang yang semestinya diserahkan karyawan
    potentialSalesRevenue: AmountRange; // Keuntungan Jual — nilai jual jika semua terjual
    remainingInventoryAtSellingPrice: AmountRange; // Nilai sisa pada harga jual
    grossProfit: AmountRange;
    netProfit: AmountRange | null;
    remittanceStatus: {
      status: RemittanceStatus;
      statusLabel: string;
      explanation: string;
      difference: AmountRange;
    };
  };
  depositChecks: DepositCheck[];
  issues: { code: string; message: string; productId?: string; eventId?: string }[];
}

export interface EngineInput {
  products: Product[];
  events: AppEvent[];
  asOf: string;
}

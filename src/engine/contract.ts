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

export interface DepositCheck {
  eventId: string;
  actualAmount: number;
  expectedBeforeDeposit: AmountRange;
  difference: AmountRange;
  certainty: "PASTI" | "PERLU_DIPERIKSA" | "BELUM_DIKETAHUI";
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
    storeCashAfterDeposits: AmountRange;
    totalDeposits: number;
    potentialSalesRevenue: AmountRange;
    remainingInventoryAtSellingPrice: AmountRange;
    grossProfit: AmountRange;
    netProfit: AmountRange | null;
  };
  depositChecks: DepositCheck[];
  issues: { code: string; message: string; productId?: string; eventId?: string }[];
}

export interface EngineInput {
  products: Product[];
  events: AppEvent[];
  asOf: string;
}

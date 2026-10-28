import { z } from "zod";

export const RupiahSchema = z.number().int().nonnegative().safe();
export const QuantitySchema = z.number().int().nonnegative().safe();
export const MoneySourceSchema = z.enum(["STORE", "PERSONAL"]);
export const CertaintySchema = z.enum(["PASTI", "PERLU_DIPERIKSA", "BELUM_DIKETAHUI"]);

const EventBase = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  seq: z.number().int().nonnegative().safe()
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  sellingPrice: RupiahSchema,
  active: z.boolean().default(true)
});

export const AppEventSchema = z.discriminatedUnion("type", [
  EventBase.extend({ type: z.literal("opening_stock"), productId: z.string().min(1), units: QuantitySchema, unitCost: RupiahSchema.optional() }),
  EventBase.extend({ type: z.literal("purchase"), productId: z.string().min(1), packs: QuantitySchema.refine(v => v > 0), unitsPerPack: QuantitySchema.refine(v => v > 0), totalCost: RupiahSchema, sourceMoney: MoneySourceSchema }),
  EventBase.extend({ type: z.literal("stock_check"), productId: z.string().min(1), observedUnits: QuantitySchema }),
  EventBase.extend({ type: z.literal("loss"), productId: z.string().min(1), reason: z.enum(["DAMAGE", "USED", "UNKNOWN"]), units: QuantitySchema.refine(v => v > 0) }),
  EventBase.extend({ type: z.literal("expense"), description: z.string().trim().min(1).max(160), amount: RupiahSchema.refine(v => v > 0), sourceMoney: MoneySourceSchema }),
  EventBase.extend({ type: z.literal("other_income"), description: z.string().trim().min(1).max(160), amount: RupiahSchema.refine(v => v > 0) }),
  EventBase.extend({ type: z.literal("deposit"), amount: RupiahSchema.refine(v => v > 0) }),
  EventBase.extend({ type: z.literal("cash_adjustment"), amount: z.number().int().safe(), reason: z.string().trim().min(1).max(240) }),
  EventBase.extend({ type: z.literal("price_change"), productId: z.string().min(1), sellingPrice: RupiahSchema }),
  EventBase.extend({ type: z.literal("no_sales_statement"), productId: z.string().min(1), noSales: z.literal(true) })
]);

export type Product = z.infer<typeof ProductSchema>;
export type AppEvent = z.infer<typeof AppEventSchema>;
export type MoneySource = z.infer<typeof MoneySourceSchema>;
export type Certainty = z.infer<typeof CertaintySchema>;

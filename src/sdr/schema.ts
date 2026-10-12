import z from "zod";

/** "[x]" is the SDR's "not available" marker; every other count is a whole number. */
const sdrCountSchema = z.union([z.literal("[x]"), z.string().regex(/^\d+$/)]);

/**
 * SDR 2025 File 04 (`SDR25_STOCK_INFORMATION_BY_LA`) count columns, as published.
 * Per-year config: check against the next release's headers before reusing it.
 */
export const SDR_STOCK_BY_LA_COUNT_HEADERS = [
  "General needs - Self-contained - Owned low cost rental accommodation by Local Authority area",
  "General needs - Bedspace - Owned low cost rental accommodation by Local Authority area",
  "Supported housing - Owned low cost rental accommodation by Local Authority area",
  "Housing for older people - Owned low cost rental accommodation by Local Authority area",
  "Total number of units which fail the DHS by local authority area",
  "General needs - Self-contained - Managed low cost rental accommodation by Local Authority area",
  "General needs - Bedspace - Managed low cost rental accommodation by Local Authority area",
  "Supported housing - Managed low cost rental accommodation by Local Authority area",
  "Housing for older people - Managed low cost rental accommodation by Local Authority area",
  "Owned - where the purchaser has not acquired 100% of the equity",
  "Of the owned - where the purchaser has not acquired 100% of the equity, the number of units where the maximum share that can be bought has been bought by the tenant (where the maximum share is less than 100% of the equity)",
  "Managed only - where the purchaser has not acquired 100% of the equity",
  "Of the managed only - where the purchaser has not acquired 100% of the equity, the number of units where the maximum share that can be bought has been bought by the tenant (where the maximum share is less than 100% of the equity)",
  "First tranche low cost home ownership sales in year ending 31 March",
  "100% staircased low cost home ownership sales in year ending 31 March",
  "General needs self-contained units vacant and available for letting",
  "General needs self-contained units vacant and temporarily unavailable for letting",
  "General needs self-contained units vacant and permanently unavailable for letting",
  "Total general needs self-contained units vacant",
  "Total sales to registered providers",
  "Sales to tenants - Right to Buy (including Preserved Right to Buy but excluding Voluntary Right to Buy)",
  "Sales to tenants - Right to Acquire",
  "Sales to tenants - Other sales to tenants",
  "Total sales to tenants",
  "Total sales to other",
  "Total demolitions",
  "Other Losses",
] as const;

export type SdrStockByLaCountHeader =
  (typeof SDR_STOCK_BY_LA_COUNT_HEADERS)[number];

const sdrStockByLaCountShape = Object.fromEntries(
  SDR_STOCK_BY_LA_COUNT_HEADERS.map((header) => [header, sdrCountSchema]),
) as Record<SdrStockByLaCountHeader, typeof sdrCountSchema>;

/**
 * One row of SDR File 04, as parsed. Strict, so a column added or renamed
 * in a later release fails the run instead of being silently dropped.
 */
export const sdrStockByLaRowSchema = z.strictObject({
  "PRP name": z.string().min(1),
  "PRP registration number": z.string().min(1),
  "Size of organisation": z.enum(["Large", "Small"]),
  "Local Authority name": z.string().min(1),
  "LA code": z.string().min(1),
  ...sdrStockByLaCountShape,
});

export const sdrStockByLaArraySchema = z.array(sdrStockByLaRowSchema);

export type SdrStockByLaRow = z.infer<typeof sdrStockByLaRowSchema>;

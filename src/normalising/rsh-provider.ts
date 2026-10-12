import type { RshDesignation, RshProviderRow, SavedRshProvider } from "../rsh/schema.ts";

/**
 * RSH numbers mix letter prefixes and plain digits (`L4240`, `LH0391`, `4758`).
 * Kept as strings so plain-digit numbers never become numeric.
 */
export const normaliseRshNumber = (raw: string): string =>
  raw.trim().toUpperCase();

const DESIGNATIONS = {
  "Non-profit": "non-profit",
  Profit: "for-profit",
  "Local authority": "local-authority",
} as const satisfies Record<RshProviderRow["Designation"], RshDesignation>;

export const normaliseDesignation = (
  raw: RshProviderRow["Designation"],
): RshDesignation => DESIGNATIONS[raw];

/**
 * Maps a validated spreadsheet row to the saved shape. Text fields arrive
 * trimmed and dates arrive as ISO from `parseXlsxFile`; the corporate form
 * and names are kept exactly as RSH publishes them.
 */
export const normaliseRshProvider = (row: RshProviderRow): SavedRshProvider => ({
  orgName: row["Organisation name"],
  registrationNumber: normaliseRshNumber(row["Registration number"]),
  registrationDate: row["Registration date"],
  designation: normaliseDesignation(row.Designation),
  corporateForm: row["Corporate form"],
  notes: row.Notes,
});

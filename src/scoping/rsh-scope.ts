import type { SavedRshProvider, ScopedRshProvider } from "../schema.ts";

/**
 * Applies plan 01, step 5. Local authorities are out of scope; for-profit
 * providers stay in scope but are flagged, so final inclusion can be decided later.
 */
export const scopeRshProvider = (
  provider: SavedRshProvider,
): ScopedRshProvider => ({
  ...provider,
  inScope: provider.designation !== "local-authority",
  isForProfit: provider.designation === "for-profit",
});

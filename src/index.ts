import { parseArgs } from "node:util";

import {
  downloadAndSaveRshRegister,
  loadSavedRshRegister,
  saveModifiedRshRegister,
} from "./rsh-register.ts";
import { scopeRshProvider } from "./scoping/rsh-scope.ts";

const { values } = parseArgs({
  options: {
    refresh: { type: "boolean", default: false },
    "as-at": { type: "string" },
  },
});

const { asAt, providers } = values.refresh
  ? await downloadAndSaveRshRegister()
  : await loadSavedRshRegister(values["as-at"]);

const scopedProviders = providers.map((provider) => scopeRshProvider(provider));
const outPath = await saveModifiedRshRegister(asAt, scopedProviders);

const inScopeCount = scopedProviders.filter((p) => p.inScope).length;
const forProfitCount = scopedProviders.filter((p) => p.isForProfit).length;

console.log(
  `Register ${asAt}: ${providers.length} providers, ${inScopeCount} in scope (${forProfitCount} for-profit) → ${outPath}`,
);

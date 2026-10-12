import { parseArgs } from "node:util";

import {
  downloadAndSaveRshRegister,
  loadSavedRshRegister,
  saveScopedRshRegister,
} from "./rsh-register.ts";
import { scopeRshProvider } from "./scoping/rsh-scope.ts";
import { parseCsvFile } from "./parsing/csv_parser.ts";
import { LA_CODES, type SdrFilePath } from "./sdr/types.ts";
import { sdrStockByLaArraySchema, type SdrStockByLaRow } from "./sdr/schema.ts";

const { values } = parseArgs({
  options: {
    refresh: { type: "boolean", default: false },
    "as-at": { type: "string" },
  },
});

/* Have we pulled data from the RSH registry? */
const { asAt, providers } = values.refresh
  ? await downloadAndSaveRshRegister()
  : await loadSavedRshRegister(values["as-at"]);

/* Scope and normalsie RSH data */
const scopedProviders = providers.map((provider) => scopeRshProvider(provider));
const outPath = await saveScopedRshRegister(asAt, scopedProviders);

const inScopeCount = scopedProviders.filter((p) => p.inScope).length;
const forProfitCount = scopedProviders.filter((p) => p.isForProfit).length;

/* Bring in SDR data to compare with RSH */
const sdrFilePath: SdrFilePath =
  "data/sdr/SDR_Data_Release_2025/File 04 - Stock by LA.csv";
const sdrStockByLa = await parseCsvFile(sdrFilePath);

const parsedSdrStock = sdrStockByLaArraySchema.parse(sdrStockByLa);

const londonSdrStock = parsedSdrStock.filter((stock) =>
  LA_CODES.includes(stock["LA code"]),
);

const londonProviderCount = new Set(
  londonSdrStock.map((stock) => stock["PRP registration number"]),
).size;

console.log(
  `Out of ${parsedSdrStock.length}, we have ${londonProviderCount} in London`,
);

console.log(
  `Register ${asAt}: ${providers.length} providers, ${inScopeCount} in scope (${forProfitCount} for-profit) → ${outPath}`,
);

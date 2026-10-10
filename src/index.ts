import { parseArgs } from "node:util";

import {
  downloadAndSaveRshRegister,
  loadSavedRshRegister,
} from "./rsh-register.ts";

const { values } = parseArgs({
  options: {
    refresh: { type: "boolean", default: false },
    "as-at": { type: "string" },
  },
});

const providers = values.refresh
  ? await downloadAndSaveRshRegister()
  : await loadSavedRshRegister(values["as-at"]);

console.log(`Loaded ${providers.length} registered providers`);

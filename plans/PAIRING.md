# Pairing log
Plan: `plans/01-rsh-register.md` (conventions from `plans/00-overview.md`) · Forces: `~/.dev-workflow/rules/developer-forces.md` · Started 2026-10-10 16:40

---
### ✅ Handed back · `src/index.ts`
Added `import { z } from "zod"` and, inside the `if (result)` block, `govUKAttachmentSchema` and `govUKPublicationSchema`, which parse `details.attachments` into `{ title, url, attachment_type, content_type? }`. `content_type` is nullish because the HTML attachments don't have one. The typecheck is clean, and `pnpm start` prints all 13 attachments. I didn't do attachment selection or the `result.ok` check.

---
### ✅ Handed back · `src/fetching/as-at.ts`, `src/fetching/as-at.test.ts`
`parseAsAtFromTitle(title)` returns ISO `YYYY-MM-DD` from the title's trailing date. It builds the string by hand, so BST can't shift it a day, and it throws when there's no date or the month isn't recognised. 4 tests pass. I didn't wire it into `fetchGovUKURL`; `asAt` is still undefined there.

---
### ✅ Handed back · `fetchGovUKURL`, its call site in `src/index.ts`
`fetchGovUKURL` now takes the attachment (`url`, `title`), throws when `!response.ok`, works out `asAt` with `parseAsAtFromTitle`, and writes to `data/raw/rsh/<as_at>/` using `node:fs/promises` with a recursive `mkdir`. The call in index is now awaited. A live run wrote the xlsx and the manifest to `data/raw/rsh/2026-09-17/`. Still open: selecting by `attachments[1]`, and what to do on a re-run with an existing `as_at`.

---
### ✅ Handed back · `src/parsing/csv_parser.ts`, `csv-parse@7.0.3`
`parseCsvFile(path, { headerLine })` streams a CSV into `Record<string,string>[]`, and `writeRecordsToJson(records, outPath)` writes it out. I smoke-tested it on SDR File 04 with `headerLine: 4`: 10,263 rows. Note this is Phase 02 tooling. The Phase 01 register is xlsx, so it still needs a spreadsheet parser.

---
### ✅ Handed back · `src/parsing/xlsx_parser.ts`, `exceljs@4.4.0`
`parseXlsxFile(path, { sheetName, headerLine })` turns a worksheet into `Record<string,string>[]`, the same shape as `parseCsvFile`. It reads the first visible sheet by default, which skips the RSH file's `veryHidden` sheet, and turns dates into ISO strings. On the 17 Sep 2026 register it returns 1,577 rows. JSON output reuses `writeRecordsToJson` from `csv_parser.ts`.

---
### ✅ Handed back · `saveXlsxAsJson` in `src/parsing/xlsx_parser.ts`
`saveXlsxAsJson(filePath, outPath, options)` parses the sheet, writes JSON through `writeRecordsToJson`, and returns the records. Tested on the RSH register: 1,577 rows.

---
### ✅ Handed back · `rshProviderRowSchema` in `src/schema.ts`
It validates raw spreadsheet rows: name and number non-empty, the date in ISO format, and `Designation` limited to the three raw values (`Non-profit`, `Profit`, `Local authority`). All 1,577 live rows pass, and all registration numbers are unique. It doesn't normalise anything; that's still plan step 3.

---
### ✅ Handed back · registry check in `src/index.ts`
The check now calls `rshProviderRowsSchema.safeParse(...)`, the array schema from `schema.ts`, instead of the single-row schema, and the import is updated to match.

---
### ✅ Handed back · `src/index.ts`, `src/rsh-register.ts`, `src/schema.ts`
The fetch, parse, map and save pipeline moved to `downloadAndSaveRshRegister()`. `loadSavedRshRegister(asAt?)` reads `data/json/rsh_providers_<as_at>.json`, picking the newest when no date is given, and validates it against the new `savedRshProviderArraySchema`. `index.ts` loads from disk by default, fetches with `--refresh`, and takes a date with `--as-at`. I tested all three, and the `writeRecordsToJson` call is now awaited. Still open: `data/json/` vs the plan's `data/interim/` and CSV output, and the leftover `src/helpers.ts`.

---
### ✅ Handed back · `src/normalising/rsh-provider.ts`, `src/schema.ts`, `src/rsh-register.ts`
Plan step 3. `normaliseRshNumber` trims and uppercases, and the result is always a string. `normaliseDesignation` maps `Non-profit`/`Profit`/`Local authority` to `non-profit`/`for-profit`/`local-authority` through a `satisfies Record<…>` table, so adding a new raw value fails the typecheck. `normaliseRshProvider` replaces the inline map in `downloadAndSaveRshRegister`. `savedRshProviderSchema.designation` now uses the new `rshDesignationSchema`. I regenerated `rsh_providers_2026-09-17.json` from the raw xlsx, and the only change is designation (1253/232/92). 4 new tests pass. Names and corporate form are left exactly as RSH publishes them, and two names contain double spaces. Still open: `src/lib/ids.ts` from the overview conventions, and there's no command that re-parses from raw without hitting the network.

---
### ✅ Handed back · duplicates, scope, modified output
`findDuplicateRegistrationNumbers` / `assertUniqueRegistrationNumbers` (`src/validating/`) run on both the refresh and the load paths. `scopeRshProvider` (`src/scoping/`) adds `inScope` and `isForProfit`. Both loaders now return `{ asAt, providers }`. `saveModifiedRshRegister` writes `data/json/rsh_providers_<as_at>_modified.json`. Result: 1,577 providers, 1,345 in scope, 92 of them for-profit, 232 local authorities out. 14/14 tests pass.

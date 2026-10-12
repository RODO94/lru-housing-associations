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

---
### ✅ Handed back · `_modified` → `_scoped`
Renamed the output file to `rsh_providers_<as_at>_scoped.json`, with `toScopedRegisterPath` and `saveScopedRshRegister` to match. Removed the old `_modified.json`, which was tracked, so it shows as a deletion.

---
### 18:10 · `src/types.ts`

**Force** — *Co-location and Domain Structure*: "Files should be co-located by domain, not separated by type… Structure is not neutral." `types.ts` is named for a file type, and it holds a runtime SDR config (`SDR_FILE_SUFFIXES`) as well as types. The same pattern already runs through `schema.ts`, `parsing/`, `fetching/`, `validating/` and `scoping/`, so this is now how the repo is organised, not a one-off.

```ts
export const SDR_FILE_SUFFIXES = [ … ] as const; // SDR domain, filed under "types"
```
The question is whether the force still holds for this repo or the layout should follow it (e.g. `rsh/`, `sdr/`). That is worth settling before Phase 02 adds a second domain to every folder.

---
### ✅ Handed back · header check in `parseCsvFile`
`assertUsableHeaders` runs inside csv-parse's `columns` callback and throws on empty or repeated header names. The error names the line, the file and the bad columns, and suggests checking `headerLine`. On the real File 04, the default `headerLine` now throws, and `headerLine: 4` gives 10,263 rows. There are 5 new tests and 19/19 pass.

---
### ✅ Handed back · `sdrStockByLaRowSchema` in `src/schema.ts`
Added `SDR_STOCK_BY_LA_COUNT_HEADERS` (27 raw count headers, 2025 config) and `sdrStockByLaRowSchema`, a `strictObject` where counts must be `[x]` or whole numbers and `Size of organisation` is `Large`/`Small`, plus the array schema and row type. The camelCase helper was dropped at your request. All 10,263 rows of File 04 pass, and an extra column is rejected. Your File 04 copy now has the header on line 1, so the preamble has been stripped from the raw file.

---
### ✅ Handed back · schema split
`src/schema.ts` is split into `src/rsh/schema.ts`, `src/sdr/schema.ts` and `src/fetching/gov-uk-schema.ts`. `src/types.ts` moved to `src/sdr/types.ts`. Imports are updated, 19/19 tests pass, and the run is unchanged. The only typecheck error is your unused `parsedSdrStock` (`index.ts:34`).

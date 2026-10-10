# London housing associations: plan overview

## Goal

Build a reproducible, dated list of housing associations with stock or registered land in London. Link each entity to its identifiers and record the evidence for its London presence. This list is the input to the next stage: mapping properties via HMLR titles, INSPIRE polygons and OS/gazetteer data.

## Phases

| # | Phase | Question it answers | Main source | Plan |
|---|-------|---------------------|-------------|------|
| 01 | Register spine | Who are the registered providers? | RSH list of registered providers | `01-rsh-register.md` |
| 02 | London filter | Which of them own stock in London? | RSH Statistical Data Return (SDR) | `02-sdr-london-filter.md` |
| 03 | Land ownership | Where do they hold registered land in London, and who is missing? | HMLR "UK companies that own property" (CCOD) | `03-hmlr-ccod-ownership.md` |
| 04 | SIC cross-check | Are there housing associations outside the register-based list? | Companies House + FCA Mutuals Public Register | `04-sic-cross-check.md` |
| 05 | GLA verification | (deferred) | GLA data | not yet planned |

**Dependency to note:** Phase 03 needs a crosswalk from RSH number to company or society number, because RSH doesn't publish company numbers. That crosswalk is built from the Companies House and FCA data that Phase 04 also uses. Download those sources during Phase 03 and reuse them in Phase 04.

## Tracer slice first

Before scaling to all 33 London authorities, run Phases 01–04 end to end for **one borough**. Choose an inner borough with a mix of large and small providers.

The tracer is done when there is:
- one output table for that borough, with every entity carrying a tier and its evidence;
- a reconciliation report covering SDR units vs CCOD titles, unmatched rows, and the review queue;
- a measured manual-review rate, used to estimate the effort of scaling up.

Only then widen to all 33. The national-level steps (the Phase 01 register and the Phase 04 SIC sweep) can run in full from the start because they're cheap.

## What counts as a "housing association" here

| Tier | Definition | Evidence |
|------|------------|----------|
| A | RSH-registered provider (non-profit, or for-profit flagged) with owned SDR stock in a London LA | SDR |
| B | RSH-registered provider with no London SDR stock (or no SDR return) but with London titles in CCOD | CCOD |
| C | Not RSH-registered, but a housing society or company holding London titles | CCOD + Companies House/FCA |
| candidate | Found via SIC/FCA, London presence not confirmed | Companies House/FCA only |

Local authorities are excluded.

## Conventions

- **Identifiers are strings.** RSH numbers mix letter prefixes and plain digits (`L4240`, `LH1722`, `SL4293`, `C3455`, `A3909`, `5234`). Company and society numbers have leading zeros and prefixes. All normalisation lives in one module (`src/lib/ids.ts`) with unit tests built from real examples.
- **Join on identifiers, never names.** Name matching is only for proposing candidates, and anything fuzzy goes to a manual review queue.
- **Names drift.** Keep a `name_aliases` table (entity → historical names), because mergers leave old names on titles and in older datasets.
- **Raw data is immutable.** Store it under `data/raw/<source>/<as_at>/` with a `manifest.json` holding source URL, retrieved_at, as_at, sha256 and licence.
- **Everything is dated.** Every derived row carries the `as_at` of its source. The sources have different timings: the SDR is a 31 March snapshot, while RSH and CCOD are monthly.
- **London** means the 33 local authorities `E09000001`–`E09000033` (32 boroughs plus the City of London). Keep one lookup mapping LA code to the name variants each source uses: the SDR uses codes, CCOD uses district names.

## Suggested repo layout

```
<project>/
  plans/
  data/
    raw/{rsh,sdr,ccod,companies-house,fca-mutuals}/<as_at>/
    interim/
    output/
  src/
    sources/{rsh,sdr,ccod,companiesHouse,fcaMutuals}.ts
    lib/{ids,london,manifest,match,schema}.ts
    pipeline.ts
  test/
```

Tooling options for Node/TypeScript:
- native `fetch` (Node 18+);
- `xlsx` (SheetJS) or `exceljs` for spreadsheets;
- `csv-parse` (stream API) for CSV;
- `yauzl` or `unzipper` for zips;
- optionally DuckDB (`@duckdb/node-api`) to query the large CCOD CSV with SQL without loading it into Node memory.

## Shared data model

```ts
type Source = 'rsh' | 'sdr' | 'ccod' | 'companies_house' | 'fca_mutuals';
type Tier = 'A' | 'B' | 'C' | 'candidate';

interface Entity {
  entityId: string;          // internal, stable
  name: string;              // current registered name
  rshNumber?: string;
  companyNumber?: string;    // Companies House
  societyNumber?: string;    // FCA Mutuals Public Register
  charityNumber?: string;
  designation?: 'non-profit' | 'for-profit' | 'local-authority' | 'unregistered';
  corporateForm?: string;    // as published by RSH
  groupParentRsh?: string;
  tier?: Tier;
}

interface NameAlias {
  entityId: string;
  alias: string;
  source: Source;
  firstSeenAsAt?: string;
}

interface LondonEvidence {
  entityId: string;
  laCode: string;            // E09...
  source: Source;
  metric: 'owned_units' | 'titles_freehold' | 'titles_leasehold' | 'registered_office';
  value: number;
  asAt: string;
}

interface CrosswalkRow {
  entityId: string;
  scheme: 'rsh' | 'companies_house' | 'fca_mutuals' | 'charity_commission';
  identifier: string;
  method: 'published' | 'exact_name' | 'manual_review';
  confidence: 'high' | 'medium' | 'low';
}
```

## Risk register

| ID | Risk | Impact | Mitigation | Owner phase | Status |
|----|------|--------|------------|-------------|--------|
| R1 | SDR geography may not cover providers owning fewer than 1,000 units | Small housing associations missed or unplaced | Verify first (Phase 02, step 0); use CCOD as the backstop | 02 | Open |
| R2 | Name drift from mergers and renames | False negatives in matching | Join on identifiers; alias table; group parents | 01–03 | Open |
| R3 | CCOD proprietorship categories and registration numbers are unreliable | Missed housing associations or false positives | Match on known identifiers as well as category; review queue | 03 | Open |
| R4 | Sources have different "as at" dates | Discrepancies that aren't real | Record as_at everywhere; reconcile against the RSH change log | 01–03 | Open |
| R5 | Scope creep (charities/almshouses, temporary-accommodation leasing, GLA, LA stock) | Delay | Explicit out-of-scope list below; park items in a backlog | All | Open |
| R6 | Licence terms for CCOD and Companies House reuse | Can't publish derived outputs | Check licence terms before publishing anything | 03–04 | Open |
| R7 | Stock not visible in CCOD (leases of 7 years or less, unregistered land, managed-only stock, charity-held land) | Undercount at the property stage | Document as a known limitation; reconcile SDR units vs titles per provider | 03 | Open |
| R8 | Source formats change (column renames, new SDR year) | Pipeline breaks silently | Schema checks on load; year/as_at parameters; fail loudly | All | Open |
| R9 | Manual review volume is higher than expected | Scaling stalls | Measure the review rate on the tracer before committing to all 33 boroughs | 03–04 | Open |

## Out of scope for now

- Phase 05: GLA verification (deferred).
- Charity Commission sweep for almshouses and charitable landlords not on the RSH register (a possible Phase 04b).
- Local authority stock.
- Property-level mapping (the next stage, which consumes the Phase 03 title outputs).

## Open questions

- Include for-profit registered providers in the final list? Suggest including them, flagged.
- Include tier C (non-registered) entities in the deliverable, or keep them as a side list?
- Which borough for the tracer?

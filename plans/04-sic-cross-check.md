# Phase 04: SIC / registry cross-check

## Goal

Use registry classification codes to find housing associations that Phases 01–03 missed. Then confirm or reject each one's London presence using the Phase 03 London titles. Also measure how reliable SIC codes are as a signal, so the result can be interpreted.

## Inputs

| Source | Detail |
|--------|--------|
| Companies House | Monthly bulk company data snapshot (CSV: up to four SIC codes, status, company category, registered address), and/or the Public Data API (free key). The bulk file is simpler for a one-off sweep. |
| FCA Mutuals Public Register | Downloadable register extract. Each society is mapped to a SIC code, and there is a "Housing" registration type (2,179 housing societies at 31 March 2025). Most traditional housing associations are registered societies, which register with the FCA, not Companies House. |
| Target code | SIC 2007 `68201`, "Renting and operating of Housing Association real estate" |

Both downloads should already exist from the Phase 03 crosswalk step; reuse them.

## How to treat SIC codes

- **SIC is for discovery, not membership.** Codes are self-declared, so expect:
  - dormant subsidiaries;
  - development vehicles;
  - for-profit companies;
  - housing associations that chose `68209` or a care/support code instead.
- **Registered office is not where the stock is.** Never include or exclude on registered address; use it only as a hint. London presence is decided by CCOD titles (Phase 03) or SDR stock (Phase 02).

## Tracer slice

Run the national SIC sweep in full, since it's cheap. Do London confirmation against the tracer borough's CCOD subset first.

## Steps

1. **Companies House:**
   - filter companies with `68201` in any SIC slot. SIC fields hold text like `68201 - …`, so parse the leading 5 digits;
   - keep company number, name, status, category, incorporation date, registered postcode and all SIC codes;
   - keep dissolved companies in a separate file, because pre-merger owners may still appear on titles.
2. **FCA Mutuals:**
   - filter registration type = Housing OR SIC `68201`;
   - keep society number, name, status, registration date and registered address.
3. **Union and normalise** the identifiers with the shared `src/lib/ids.ts`.
4. **Match against known entities** via `crosswalk.csv`:
   - known → enrich the entity with any missing identifiers;
   - unknown → candidate.
5. **Test London presence** by looking up each candidate's normalised number (then exact name) in `ccod_london_proprietors`:
   - London titles found, not RSH-registered → **tier C**;
   - London titles found, RSH-registered under another number or name → investigate (likely a crosswalk gap) and fix the crosswalk;
   - no London titles → stays `candidate`, with the reason `no_london_titles`.
6. **Measure SIC recall:** what share of known tier A/B entities with a company or society number carry `68201` (Companies House) or Housing/`68201` (FCA)? Record it. A low recall means the SIC sweep can't be used as a completeness check.
7. **Review queue** for name-only matches, as in Phase 03.

## Outputs

- `data/interim/sic_candidates_<as_at>.csv`, with columns `source, identifier, name, status, sic_codes, registered_postcode, matched_entity_id, london_title_count, outcome`.
- `data/interim/sic_metrics_<as_at>.md`, covering:
  - recall against the known list;
  - the number of new entities found by tier;
  - the outcome breakdown.

## Done when

- Every SIC/FCA housing candidate has an outcome: `known` | `new_tier_c` | `crosswalk_fix` | `no_london_titles` | `dissolved`.
- The recall metric is recorded and interpreted.
- Any new entities have flowed back into the entity table with their tier and evidence.

## Risks

| Risk | Mitigation |
|------|------------|
| SIC noise (subsidiaries, vehicles, for-profits) | Discovery only; London presence comes from titles |
| Housing associations without `68201` are missed | Measure recall (step 6); the FCA Housing registration type adds a second net |
| A housing association with only leases of 7 years or less, or only managed stock, is invisible in CCOD | Accept and document; it would surface only through the SDR or the deferred sources |
| Society number formats differ between FCA, CCOD and other sources | Shared normalisation module with tests from real data |

## Open questions

- Add a Charity Commission sweep (classification, area of operation, other regulators) as Phase 04b, to catch almshouses and charitable landlords? It's out of scope for now; see the overview.

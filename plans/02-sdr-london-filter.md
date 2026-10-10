# Phase 02: London filter (RSH Statistical Data Return)

## Goal

For each in-scope provider from Phase 01, find out whether it owns social housing stock in any London local authority at the latest SDR snapshot, and how many units it owns per borough. Also attach group parents and record why any provider has no answer.

## Inputs

Release: **Private registered provider social housing stock and rents in England 2024 to 2025**. Published 28 Oct 2025; data as at 31 March 2025.

| File | URL |
|------|-----|
| Full data release (CSV zip) | https://assets.publishing.service.gov.uk/media/69049e3a823bdda9488b24f3/PRP_Data_Release_2025_Full_Data_FINAL_V1.1.zip |
| Full data release (xlsx) | https://assets.publishing.service.gov.uk/media/69049c39ef26c341988b24e2/PRP_Data_Release_2025_Full_Data_FINAL_V1.1.xlsx |
| Group look-up tool | https://assets.publishing.service.gov.uk/media/68f8a635190c6607448bb721/GROUP_PRP_TOOL_2025_FINAL_V1.0.xlsx |
| Geographic look-up tool | https://assets.publishing.service.gov.uk/media/68f8a6560794bb80118bb71f/GEO_PRP_TOOL_2025_FINAL_V1.0.xlsx |
| PRP look-up tool | https://assets.publishing.service.gov.uk/media/69849b5f468d351e1406b504/PRP_TOOL_2025_FINAL_V1.1.xlsx |
| Docs | Technical notes and definitions; data quality and methodology note; SDR non-submitter list (2025), all on the release page |

Notes:
- Use **V1.1** of the full data release. It corrected transposed columns in table `SDR25_LCRR_PRP_LEVEL` on 31 Oct 2025.
- The 31 March 2026 release is expected this autumn. Make `sdrYear` a parameter, and don't hard-code table names beyond a per-year config.
- Licence: OGL v3.

Key definitions, from the technical notes:
- **Owned stock:** the provider holds the freehold or a leasehold interest of any length, *and* is the body with the direct legal relationship with occupants.
- **Managed stock** is reported separately. It can include stock owned by councils or other providers.
- **Large providers** own 1,000+ units and complete the long form. **Small providers** complete a shorter return.

## Step 0: verify geographic coverage

Do this before writing any loader, because the answer decides the design.

1. Open the full data release and list every table with its columns.
2. Find the table(s) that carry provider ID × LA code × units.
3. Check whether providers owning fewer than 1,000 units appear in them.

| Finding | Consequence |
|---------|-------------|
| Small providers are present at LA level | The SDR gives near-complete geography. The remaining gaps are non-submitters and timing. |
| Small providers are absent at LA level | Small providers get status `unknown_geography`, and Phase 03 (CCOD) becomes their primary evidence. |

Record the finding and the table names here before moving on.

> Finding: _TBD_

## Tracer slice

Filter to the tracer borough's LA code only. Produce its provider list and sanity-check it against local knowledge before running all 33.

## Steps

1. **Download** the CSV zip (easier to parse than the xlsx), the group tool and the non-submitter list. Write a manifest.
2. **Inventory** every table (name, columns, row count) to `data/interim/sdr_inventory_<year>.json`. Commit it, so a later schema check can detect format changes.
3. **Identify the provider ID column** and confirm it uses RSH registration numbers.
   - Join to Phase 01 and report the match rate.
   - List unmatched rows in both directions: SDR-only providers have usually been de-registered or merged; RSH-only providers are new registrations or non-submitters.
4. **Filter** LA-level rows to `E09000001`–`E09000033`.
5. **Aggregate** per provider × LA:
   - owned units by the categories available (e.g. general needs, supported, older people, LCHO);
   - a `total_owned` column;
   - managed stock kept separately where published.
6. **Group parents:** join the group look-up tool and set `groupParentRsh` on each entity.
7. **Non-submitters:** load the list and mark those providers `no_return`, so a missing return is not read as "no London stock".
8. **Timing reconciliation** against the Phase 01 change log:
   - registered after 31 March → `not_yet_in_sdr`;
   - de-registered since → keep with a flag, and note the likely recipient of the stock if known (via group or merger).
9. **Emit evidence:** `LondonEvidence` rows (`metric = owned_units`), and a provisional tier A for providers with `total_owned > 0` in any London LA.

## Outputs

- `data/interim/sdr_london_stock_<year>.csv`, with columns `rsh_number, la_code, la_name, <unit columns...>, total_owned, as_at`.
- `data/interim/sdr_status_<year>.csv`, with columns `rsh_number, size_band, submitted, london_owned_total, group_parent_rsh, status`. Status is one of `london_stock` | `no_london_stock` | `no_return` | `not_yet_in_sdr` | `unknown_geography`.
- `data/interim/sdr_reconciliation_<year>.md`: match rates, unmatched lists and the borough totals check.

## Done when

- Every in-scope provider from Phase 01 has exactly one status.
- London borough totals from your aggregation reconcile with the published geographic look-up tool, or the difference is explained. Published figures can involve adjustments for non-response, so read the methodology note before assuming a parsing bug.

## Risks

| Risk | Mitigation |
|------|------------|
| R1: small-provider geography missing | Step 0 decides; CCOD is the backstop in Phase 03 |
| Table and column names change between years | Per-year config; schema check against the committed inventory |
| SDR "owned" units won't map 1:1 to titles (leases, shared ownership, estates on one title) | Expected. Reconcile at provider × borough level in Phase 03, not unit level |
| Stock held by a subsidiary, so the parent shows no London stock | Report at both entity and group-parent level |

## Open questions

- Report evidence at entity level, group level, or both? Suggest both, with entity as the primary key.

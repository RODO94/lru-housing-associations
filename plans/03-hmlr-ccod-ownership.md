# Phase 03: Land ownership cross-reference (HMLR CCOD)

## Goal

1. Find every London title where a housing association is a registered proprietor.
2. Link those titles to Phase 01/02 entities.
3. Surface housing associations missing from the register-based list (tiers B and C).
4. Produce the title set that seeds the property-mapping stage.

## Inputs

**HM Land Registry: "UK companies that own property in England and Wales"** (formerly CCOD).

| Item | Detail |
|------|--------|
| Access | Free account on the Use land and property data service. Check the account area for API access, and for the licence terms before publishing anything derived. |
| Cadence | Monthly, from the 2nd working day. A full file plus a change-only update (COU) file. |
| Files | `CCOD_FULL_YYYY_MM.csv`, `CCOD_COU_YYYY_MM.csv`. UTF-8, every field double-quoted, dates `DD-MM-YYYY`, header row. |
| Fields used | Title Number, Tenure, Property Address, District, County, Region, Postcode, Multiple Address Indicator, Proprietor Name (1–4), Company Registration No. (1–4), Proprietorship Category (1–4), Proprietor address (1–3) per slot, Date Proprietor Added, Additional Proprietor Indicator |

Proprietorship categories that indicate a housing association:
- Housing Association Community Benefit Society
- Housing Association Co-operative Society
- Housing Association Registered Society
- Housing Association/Society (Company)
- Housing Association/Society (Corporate Body)

Categories where housing associations often appear *without* the label:
- Registered Society
- Industrial and Provident Society
- Community Benefit Society
- Co-operative Society
- Limited Company or Public Limited Company
- Community Interest Company

Match categories case-insensitively on the prefix `housing association`, not on exact strings. Values in the data may carry suffixes such as "(Company)" or "(Corporate Body)".

Also needed for the identifier crosswalk, and reused in Phase 04:
- **Companies House** bulk company data;
- the **FCA Mutuals Public Register** extract.

## Known limits (design around these)

- **Excluded owners:** private individuals, overseas companies, and charities including CIOs. Where they share a title with an included owner, they are stripped out and the Additional Proprietor Indicator is set.
- **Short leases:** only leases of more than 7 years must be registered, so shorter leases are absent.
- **Unregistered land** is absent. About 11% of England and Wales is still unregistered; London's share is likely lower.
- **One title can cover many addresses.** The Multiple Address Indicator points to a property schedule that isn't in the file.
- **Shared ownership and right-to-buy flats:** the occupiers' leases belong to individuals and are excluded. Only the association's freehold or head-lease title appears.
- **Managed-only stock** has no association title at all.
- **Registration numbers** aren't validated by HMLR and contain typos. They may be blank for registrations before 1997, and the name beside a number may be pre-merger.
- **Categories** are sometimes wrong.

## Tracer slice

Tracer borough only, through every step, before running all 33.

## Steps

1. **Download** the full file and write a manifest. Keep the COU files for later change tracking.
2. **London subset (streaming).**
   - Don't load the national file into memory. Use `csv-parse` stream mode, or DuckDB `read_csv`.
   - Inspect the actual values in County, Region and District first.
   - Build `district name → LA code` for the 33 London authorities in `src/lib/london.ts`. Watch the naming variants, e.g. "City of Westminster" and "City of London".
   - Write the London rows to `data/interim/ccod_london_<yyyy_mm>.csv`.
3. **Unpivot proprietors** into one row per (title, slot 1–4): name, raw registration number, category, address lines.
4. **Normalise registration numbers** in `src/lib/ids.ts`:
   - uppercase and strip whitespace;
   - Companies House numbers → 8 characters with leading zeros (keep any prefix, e.g. `SC`);
   - society numbers → keep the raw value plus a normalised form. Derive the prefix and suffix rules from what actually appears in the data and the FCA extract; don't guess them.
   - Unit-test with real examples.
5. **Build the RSH crosswalk** (RSH number ↔ company/society number). RSH doesn't publish these numbers, so:
   - **exact normalised name match** of RSH names (and aliases) against the FCA extract and Companies House → `method = exact_name`, `confidence = high` when the name is unique;
   - **anything else** goes to the review queue → `method = manual_review`;
   - optional helper: Find that Charity already links RSH records (identifier scheme `GB-SHPE`) to other registers, but its copy of the RSH list can be old. Use it to suggest links, never as the source of truth;
   - for the tracer, hand-checking the providers in one borough is acceptable.
6. **Classify proprietor rows:**
   - `ha_by_category`: the category starts with "housing association";
   - `ha_by_identifier`: the normalised registration number is in the crosswalk;
   - `other`.
7. **Link to entities**, in order:
   1. exact normalised registration number;
   2. exact normalised name against current names and `name_aliases`;
   3. fuzzy name → `review_queue.csv` only. Never auto-accept a fuzzy match.
8. **New entities:**
   - housing-association proprietors that stay unlinked and are not on the RSH register → tier C candidates;
   - RSH entities with London titles but no London SDR stock → tier B.
9. **Reconcile SDR against CCOD** per provider × borough: SDR owned units vs CCOD title counts, split freehold/leasehold.
   - Providers with SDR London stock but zero London titles: check name drift, a subsidiary holding the title, leases of 7 years or less, managed-only stock, or unregistered land.
   - Providers with titles but no SDR stock: check for non-social holdings, a non-submitter, or a de-registered or merged entity.
10. **Emit** the title-level output for the mapping stage.

## Outputs

- `data/interim/ccod_london_titles_<yyyy_mm>.csv`, with columns `title_number, tenure, district, la_code, postcode, multiple_address, property_address, date_proprietor_added`.
- `data/interim/ccod_london_proprietors_<yyyy_mm>.csv`, with columns `title_number, slot, name, reg_no_raw, reg_no_norm, category, ha_flag, entity_id, link_method`.
- `data/interim/crosswalk.csv`, made of `CrosswalkRow` records.
- `data/interim/review_queue.csv`
- `data/interim/reconciliation_sdr_vs_ccod_<yyyy_mm>.csv`
- `LondonEvidence` rows with `metric = titles_freehold | titles_leasehold`.

## Done when (tracer borough)

- Every housing-association proprietor row is either linked to an entity or sitting in the review queue.
- Every tier A provider has London titles or a recorded reason for having none.
- The normalisation functions pass unit tests built from real rows.
- The manual-review rate is measured and written into the overview's risk R9.

## Risks

| Risk | Mitigation |
|------|------------|
| File size and memory | Stream, or use DuckDB; filter to London first |
| R3: category and registration number unreliability | Use both category and identifier signals; review queue |
| Crosswalk effort is larger than expected | Tracer first; measure; prioritise providers by SDR London units |
| R6: licence terms | Check before publishing any derived dataset |
| R7: invisible stock | Record a reason per provider in the reconciliation; carry it into the mapping stage as a known gap |

## Open questions

- Treat proprietor rows from non-social holdings (e.g. commercial units owned by an association) as evidence of London presence, or require SDR stock too? Suggest keeping them, with the tier showing which evidence applies.

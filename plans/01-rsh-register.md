# Phase 01: Registered provider spine (RSH list)

## Goal

Produce a clean, dated table of every provider on the Regulator of Social Housing (RSH) register, keyed on RSH registration number, with an `in_scope` flag. Also produce a change log between runs.

## Inputs

| Item | Detail |
|------|--------|
| Publication | "Registered providers of social housing" on GOV.UK (RSH). The list is updated monthly, around mid-month. |
| Files | A monthly "List of registered providers – <date>" spreadsheet, plus an accessible HTML version |
| Change pages | Annual "Registrations and de-registrations <year>" pages |
| Fields | Provider name, registration number, registration date, designation (non-profit / for-profit / local authority), corporate form (e.g. registered society, company) |
| Not included | Addresses, contact details, company or society numbers (RSH doesn't publish these) |
| Licence | Open Government Licence v3 |

## Tracer slice

The register is national and small, so load it in full from the start. The borough-level slicing begins in Phase 02.

## Steps

1. **Discover the latest file.**
   - Request `https://www.gov.uk/api/content/government/publications/registered-providers-of-social-housing` (GOV.UK Content API) and read the attachment metadata: title, URL and content type. Confirm the path first; older lists sat under `current-registered-providers-of-social-housing`, which may redirect.
   - Select the most recent "List of registered providers" spreadsheet by the date in its title.
   - If the spreadsheet format changes, fall back to the accessible HTML version.
2. **Download** to `data/raw/rsh/<as_at>/` and write `manifest.json` (url, retrieved_at, as_at, sha256, licence).
3. **Parse and normalise:**
   - trim whitespace;
   - registration number → uppercase string, never numeric;
   - registration date `DD/MM/YYYY` → ISO;
   - designation → enum (`non-profit` | `for-profit` | `local-authority`);
   - keep the corporate form as the raw text.
4. **Validate** (fail the run on any error):
   - registration numbers are unique and non-empty;
   - names are non-empty;
   - designation is in the known set;
   - the row count is within ±5% of the previous run (warn above that, rather than fail).
5. **Scope:**
   - `in_scope = designation !== 'local-authority'`;
   - keep for-profits with `is_for_profit = true`.
6. **Change log:** diff against the previous `as_at` run.
   - Number present now but absent before → `added`.
   - Number absent now but present before → `removed`.
   - Same number with a different name → `renamed`; write the old name to `name_aliases`.
   - Cross-check additions and removals against the registrations/de-registrations page for the same months.
7. **Seed entities:** create one `Entity` per in-scope provider, with `entityId` derived from the RSH number (e.g. `rsh:L4240`).

## Outputs

- `data/interim/rsh_providers_<as_at>.csv`, with columns `rsh_number, name, registration_date, designation, corporate_form, in_scope, is_for_profit, as_at`.
- `data/interim/rsh_changes_<as_at>.csv`, with columns `rsh_number, change_type, old_name, new_name, from_as_at, to_as_at`.
- `data/interim/name_aliases.csv`, appended to each run.

## Done when

- One command reproduces identical output for the same `as_at` from a clean checkout.
- Counts by designation and corporate form are printed in a run summary.
- A spot-check of ~10 London housing associations you already know, large and small, finds them all present.

## Risks

| Risk | Mitigation |
|------|------------|
| Attachment titles or formats change month to month | Select by title pattern and content type; schema check on columns; fall back to HTML |
| A rename breaks name-based joins later | Treat the RSH number as identity; keep the aliases table |
| Group subsidiaries are listed as separate providers | Keep them all; attach group parents in Phase 02 |
| The register lists some for-profit and lease-based providers that aren't "housing associations" in the everyday sense | Keep them flagged; decide final inclusion at the end |

## Open questions

- Final treatment of for-profit providers in the deliverable.

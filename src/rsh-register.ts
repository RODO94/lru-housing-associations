import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { fetchGovUKTest, fetchGovUKURL } from "./fetching/gov-uk-content.ts";
import { writeRecordsToJson } from "./parsing/csv_parser.ts";
import { parseXlsxFile } from "./parsing/xlsx_parser.ts";
import {
  govUKPublicationSchema,
  rshProviderArraySchema,
  savedRshProviderArraySchema,
  type SavedRshProvider,
} from "./schema.ts";

const SAVED_REGISTER_DIR = path.join("data", "json");
const SAVED_REGISTER_FILE = /^rsh_providers_(\d{4}-\d{2}-\d{2})\.json$/;

const toSavedRegisterPath = (asAt: string) =>
  path.join(SAVED_REGISTER_DIR, `rsh_providers_${asAt}.json`);

/**
 * Fetches the latest register from GOV.UK, saves the raw xlsx under
 * `data/raw/rsh/<as_at>/`, and writes the mapped providers to `data/json/`.
 * Network and disk side effects; run only when you want a fresh copy.
 */
export const downloadAndSaveRshRegister = async (): Promise<
  SavedRshProvider[]
> => {
  const response = await fetchGovUKTest("registered");
  if (!response) {
    throw new Error("No response from the GOV.UK content API");
  }

  const publication = govUKPublicationSchema.parse(await response.json());

  const [file] = publication.details.attachments.filter(
    (attachment) => attachment.attachment_type === "file",
  );
  if (!file) {
    throw new Error("No file found in the GOV.UK publication");
  }

  const { directory, fileName, asAt } = await fetchGovUKURL(file);
  const rows = rshProviderArraySchema.parse(
    await parseXlsxFile(path.join(directory, fileName)),
  );

  const providers: SavedRshProvider[] = rows.map((row) => ({
    orgName: row["Organisation name"],
    registrationNumber: row["Registration number"],
    registrationDate: row["Registration date"],
    designation: row.Designation,
    corporateForm: row["Corporate form"],
    notes: row.Notes,
  }));

  await writeRecordsToJson(providers, toSavedRegisterPath(asAt));
  return providers;
};

/** Finds the newest `rsh_providers_<as_at>.json` in `data/json/`. */
const findLatestSavedAsAt = async (): Promise<string> => {
  const fileNames = await readdir(SAVED_REGISTER_DIR).catch(() => []);
  const asAts = fileNames
    .map((fileName) => SAVED_REGISTER_FILE.exec(fileName)?.[1])
    .filter((asAt) => asAt !== undefined)
    .sort();

  const latest = asAts.at(-1);
  if (!latest) {
    throw new Error(
      `No saved register in ${SAVED_REGISTER_DIR}/. Run with --refresh first.`,
    );
  }
  return latest;
};

/**
 * Reads a saved register from disk, without touching the network.
 * Defaults to the newest saved `as_at`.
 */
export const loadSavedRshRegister = async (
  asAt?: string,
): Promise<SavedRshProvider[]> => {
  const filePath = toSavedRegisterPath(asAt ?? (await findLatestSavedAsAt()));
  const json: unknown = JSON.parse(await readFile(filePath, "utf8"));
  return savedRshProviderArraySchema.parse(json);
};

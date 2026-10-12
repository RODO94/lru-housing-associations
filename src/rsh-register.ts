import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { fetchGovUKTest, fetchGovUKURL } from "./fetching/gov-uk-content.ts";
import { govUKPublicationSchema } from "./fetching/gov-uk-schema.ts";
import { normaliseRshProvider } from "./normalising/rsh-provider.ts";
import { writeRecordsToJson } from "./parsing/csv_parser.ts";
import { parseXlsxFile } from "./parsing/xlsx_parser.ts";
import {
  rshProviderArraySchema,
  savedRshProviderArraySchema,
  type SavedRshProvider,
  type ScopedRshProvider,
} from "./rsh/schema.ts";
import { assertUniqueRegistrationNumbers } from "./validating/rsh-duplicates.ts";

const SAVED_REGISTER_DIR = path.join("data", "json");
const SAVED_REGISTER_FILE = /^rsh_providers_(\d{4}-\d{2}-\d{2})\.json$/;

const toSavedRegisterPath = (asAt: string) =>
  path.join(SAVED_REGISTER_DIR, `rsh_providers_${asAt}.json`);

const toScopedRegisterPath = (asAt: string) =>
  path.join(SAVED_REGISTER_DIR, `rsh_providers_${asAt}_scoped.json`);

export type LoadedRshRegister = {
  asAt: string;
  providers: SavedRshProvider[];
};

/**
 * Fetches the latest register from GOV.UK, saves the raw xlsx under
 * `data/raw/rsh/<as_at>/`, and writes the mapped providers to `data/json/`.
 * Network and disk side effects; run only when you want a fresh copy.
 */
export const downloadAndSaveRshRegister =
  async (): Promise<LoadedRshRegister> => {
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

  const providers = rows.map((row) => normaliseRshProvider(row));
  assertUniqueRegistrationNumbers(providers);

  await writeRecordsToJson(providers, toSavedRegisterPath(asAt));
  return { asAt, providers };
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
  requestedAsAt?: string,
): Promise<LoadedRshRegister> => {
  const asAt = requestedAsAt ?? (await findLatestSavedAsAt());
  const json: unknown = JSON.parse(
    await readFile(toSavedRegisterPath(asAt), "utf8"),
  );
  const providers = savedRshProviderArraySchema.parse(json);
  assertUniqueRegistrationNumbers(providers);
  return { asAt, providers };
};

/** Writes scoped providers to `data/json/rsh_providers_<as_at>_scoped.json`. */
export const saveScopedRshRegister = async (
  asAt: string,
  providers: ScopedRshProvider[],
): Promise<string> => {
  const outPath = toScopedRegisterPath(asAt);
  await writeRecordsToJson(providers, outPath);
  return outPath;
};

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";

import type { govUKAttachmentSchema } from "./gov-uk-schema.ts";
import { parseAsAtFromTitle } from "./as-at.ts";

type GovUKAttachment = z.infer<typeof govUKAttachmentSchema>;

const GOV_UK_URL = "https://www.gov.uk/api/content/government/publications/";

const PUBLICATIONS_SUFFIX = "registered-providers-of-social-housing";
const CURRENT_PROVIDER_SUFFIX =
  "current-registered-providers-of-social-housing";

const govUKRoutes: Record<GovUKProviders, string> = {
  registered: PUBLICATIONS_SUFFIX,
  current: CURRENT_PROVIDER_SUFFIX,
};

type GovUKProviders = "registered" | "current";

export const fetchGovUKTest = async (route: GovUKProviders) => {
  try {
    const result = await fetch(GOV_UK_URL + govUKRoutes[route]);

    if (result) {
      console.log("***************");
      console.log("Result returned successfully");
      console.log("***************");
      return result;
    } else {
      console.log("//////////////////////////////");
      console.log("Result returned nothing");
      console.log("//////////////////////////////");

      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      throw error;
    }
  }
};

export const fetchGovUKURL = async ({ url, title }: GovUKAttachment) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${url} from gov uk: ${response.status} ${response.statusText}`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  const asAt = parseAsAtFromTitle(title);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const rawDir = path.join("data", "raw", "rsh", asAt);
  const fileName = path.basename(new URL(url).pathname);

  console.log("As At", asAt);

  await mkdir(rawDir, { recursive: true });
  await writeFile(path.join(rawDir, fileName), bytes);
  await writeFile(
    path.join(rawDir, "manifest.json"),
    JSON.stringify(
      {
        url: url,
        retrieved_at: new Date().toISOString(),
        as_at: asAt,
        sha256,
        licence: "OGL-UK-3.0",
      },
      null,
      2,
    ),
  );
  return { directory: rawDir, fileName: fileName, asAt };
};

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse";

export type CsvRecord = Record<string, string>;

type ParseCsvOptions = {
  /**
   * 1-based line the header row sits on. SDR files open with a title,
   * a description and a "Go back to contents" row, so their header is on line 4.
   */
  headerLine?: number;
};

/**
 * Throws if a header row can't key records: an empty or repeated name would
 * make columns overwrite each other in every record. Usually means
 * `headerLine` points at a title row rather than the real header.
 */
export const assertUsableHeaders = (
  headers: string[],
  { filePath, headerLine }: { filePath: string; headerLine: number },
): void => {
  const emptyColumns = headers
    .map((header, index) => (header === "" ? index + 1 : undefined))
    .filter((column) => column !== undefined);
  const repeatedHeaders = [
    ...new Set(headers.filter((header, index) => header !== "" && headers.indexOf(header) !== index)),
  ];

  if (emptyColumns.length > 0 || repeatedHeaders.length > 0) {
    throw new Error(
      [
        `Unusable header on line ${headerLine} of ${filePath}.`,
        emptyColumns.length > 0 ? `Empty names in columns: ${emptyColumns.join(", ")}.` : "",
        repeatedHeaders.length > 0 ? `Repeated names: ${repeatedHeaders.join(", ")}.` : "",
        "Check headerLine points at the real header row.",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
};

/**
 * Reads a CSV file into one object per row, keyed by the header row.
 * Values are kept as raw trimmed strings; typing them is the caller's job.
 */
export const parseCsvFile = async (
  filePath: string,
  { headerLine = 1 }: ParseCsvOptions = {},
): Promise<CsvRecord[]> => {
  const parser = createReadStream(filePath).pipe(
    parse({
      bom: true,
      columns: (headers: string[]) => {
        assertUsableHeaders(headers, { filePath, headerLine });
        return headers;
      },
      from_line: headerLine,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  const records: CsvRecord[] = [];
  for await (const record of parser) {
    records.push(record);
  }
  return records;
};

/** Writes records to `outPath` as pretty-printed JSON, creating folders as needed. */
export const writeRecordsToJson = async (
  records: object[],
  outPath: string,
): Promise<void> => {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(records, null, 2));
};

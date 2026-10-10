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
      columns: true,
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

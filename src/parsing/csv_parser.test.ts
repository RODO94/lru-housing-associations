import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { assertUsableHeaders, parseCsvFile } from "./csv_parser.ts";

const writeTempCsv = async (contents: string): Promise<string> => {
  const directory = await mkdtemp(path.join(tmpdir(), "csv-parser-"));
  const filePath = path.join(directory, "fixture.csv");
  await writeFile(filePath, contents);
  return filePath;
};

const location = { filePath: "fixture.csv", headerLine: 1 };

test("accepts a header with unique, non-empty names", () => {
  assert.doesNotThrow(() =>
    assertUsableHeaders(["PRP name", "LA code"], location),
  );
});

test("rejects empty header names, naming the columns", () => {
  assert.throws(
    () => assertUsableHeaders(["SDR25_STOCK_INFORMATION_BY_LA", "", ""], location),
    /Empty names in columns: 2, 3/,
  );
});

test("rejects repeated header names", () => {
  assert.throws(
    () => assertUsableHeaders(["LA code", "Units", "LA code"], location),
    /Repeated names: LA code/,
  );
});

test("parseCsvFile fails when headerLine lands on an SDR title row", async () => {
  const filePath = await writeTempCsv(
    "SDR25_STOCK_INFORMATION_BY_LA,,\nGo back to contents,,\nPRP name,PRP registration number,LA code\nA2Dominion Homes Limited,LH0391,E09000009\n",
  );
  await assert.rejects(parseCsvFile(filePath), /Unusable header on line 1/);
});

test("parseCsvFile keys rows by the real header row", async () => {
  const filePath = await writeTempCsv(
    "SDR25_STOCK_INFORMATION_BY_LA,,\nGo back to contents,,\nPRP name,PRP registration number,LA code\nA2Dominion Homes Limited,LH0391,E09000009\n",
  );
  assert.deepEqual(await parseCsvFile(filePath, { headerLine: 3 }), [
    {
      "PRP name": "A2Dominion Homes Limited",
      "PRP registration number": "LH0391",
      "LA code": "E09000009",
    },
  ]);
});

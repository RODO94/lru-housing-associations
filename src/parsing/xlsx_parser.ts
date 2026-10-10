import ExcelJS from "exceljs";

import { writeRecordsToJson } from "./csv_parser.ts";

export type SheetRecord = Record<string, string>;

type ParseXlsxOptions = {
  /** Worksheet to read. Defaults to the first visible sheet. */
  sheetName?: string;
  /** 1-based row the header sits on. */
  headerLine?: number;
};

/**
 * Converts a cell to the string the CSV parser would have produced.
 * Dates become ISO `YYYY-MM-DD`; Excel dates carry no timezone and
 * exceljs reads them as UTC midnight, so slicing the ISO string is safe.
 */
const readCellAsString = (cell: ExcelJS.Cell): string => {
  if (cell.value instanceof Date) {
    return cell.value.toISOString().slice(0, 10);
  }
  return cell.text.trim();
};

const findWorksheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string | undefined,
): ExcelJS.Worksheet => {
  const worksheet =
    sheetName === undefined
      ? workbook.worksheets.find((sheet) => sheet.state === "visible")
      : workbook.getWorksheet(sheetName);

  if (!worksheet) {
    throw new Error(`Worksheet not found: ${sheetName ?? "(first visible)"}`);
  }
  return worksheet;
};

/**
 * Reads one worksheet of an xlsx file into one object per row, keyed by
 * the header row. Values are kept as trimmed strings, matching `parseCsvFile`.
 */
export const parseXlsxFile = async (
  filePath: string,
  { sheetName, headerLine = 1 }: ParseXlsxOptions = {},
): Promise<SheetRecord[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = findWorksheet(workbook, sheetName);

  const headers: string[] = [];
  worksheet.getRow(headerLine).eachCell((cell, column) => {
    headers[column] = readCellAsString(cell);
  });

  const records: SheetRecord[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerLine) return;

    const record: SheetRecord = {};
    headers.forEach((header, column) => {
      record[header] = readCellAsString(row.getCell(column));
    });
    records.push(record);
  });
  return records;
};

/**
 * Parses a worksheet and writes its records to `outPath` as JSON.
 * Returns the records so the caller can keep working with them.
 */
export const saveXlsxAsJson = async (
  filePath: string,
  outPath: string,
  options: ParseXlsxOptions = {},
): Promise<SheetRecord[]> => {
  const records = await parseXlsxFile(filePath, options);
  await writeRecordsToJson(records, outPath);
  return records;
};

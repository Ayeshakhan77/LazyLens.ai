import Papa from "papaparse";
import type { ParsedCsv } from "../types";
import { formatBytes } from "../lib/format";
import { normalizeHeaders } from "./normalizeHeaders";

/** Upload ceiling. Rejected before parsing so a huge file never hits memory. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Rows held in memory. Beyond this we keep the first MAX_ROWS and flag `sampled`. */
export const MAX_ROWS = 50_000;

export type CsvErrorCode =
  | "extension"
  | "empty"
  | "header-only"
  | "malformed"
  | "oversized"
  | "read";

export class CsvError extends Error {
  code: CsvErrorCode;
  row?: number;

  constructor(code: CsvErrorCode, message: string, row?: number) {
    super(message);
    this.name = "CsvError";
    this.code = code;
    this.row = row;
  }
}

/** Read a File, validate it, and parse it. Throws CsvError with a user-ready message. */
export async function readCsvFile(file: File): Promise<ParsedCsv> {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new CsvError(
      "extension",
      "Only .csv files are supported. Export your spreadsheet as CSV and try again.",
    );
  }

  if (file.size === 0) {
    throw new CsvError("empty", "That file is empty. Choose a CSV with at least one data row.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new CsvError(
      "oversized",
      `That file is ${formatBytes(file.size)} — over the ${formatBytes(MAX_FILE_BYTES)} limit. ` +
        "Try trimming it to the rows and columns you need.",
    );
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new CsvError("read", "We couldn't read that file. Try again, or re-export it as CSV.");
  }

  return parseCsvText(text, file.name);
}

/** Parse CSV text. Exported separately so the sample dataset uses the identical path. */
export function parseCsvText(text: string, fileName: string): ParsedCsv {
  if (text.trim() === "") {
    throw new CsvError("empty", "That file has no content — it looks empty.");
  }

  const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });

  const quoteError = result.errors.find(
    (error) => error.type === "Quotes" || error.code === "MissingQuotes",
  );
  if (quoteError) {
    const row = typeof quoteError.row === "number" ? quoteError.row + 1 : undefined;
    throw new CsvError(
      "malformed",
      row
        ? `Row ${row} has an unterminated quote, so the file couldn't be read. Fix the quoting and re-upload.`
        : "The CSV has an unterminated quote, so it couldn't be read. Fix the quoting and re-upload.",
      row,
    );
  }

  const rows = (result.data ?? []).filter(Array.isArray) as string[][];
  if (rows.length === 0) {
    throw new CsvError("empty", "That CSV has no rows at all.");
  }

  const rawHeaders = rows[0].map((cell) => (cell ?? "").toString());
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    throw new CsvError("header-only", "This file has no data rows — it only contains a header.");
  }

  const raggedIndex = dataRows.findIndex((row) => row.length !== rawHeaders.length);
  if (raggedIndex !== -1) {
    const rowNumber = raggedIndex + 2; // +1 for the header, +1 to make it 1-based
    const found = dataRows[raggedIndex].length;
    throw new CsvError(
      "malformed",
      `Row ${rowNumber} has ${found} value${found === 1 ? "" : "s"} but the header defines ` +
        `${rawHeaders.length} columns. Every row needs the same number of columns.`,
      rowNumber,
    );
  }

  const normalized = normalizeHeaders(rawHeaders);
  const totalRowCount = dataRows.length;
  const sampled = totalRowCount > MAX_ROWS;
  const kept = sampled ? dataRows.slice(0, MAX_ROWS) : dataRows;

  const rowsOut = kept.map((row) => rawHeaders.map((_, index) => (row[index] ?? "").toString()));

  return {
    fileName,
    rawHeaders,
    headers: normalized.headers,
    rows: rowsOut,
    rowCount: kept.length,
    totalRowCount,
    sampled,
    repairs: normalized.repairs,
  };
}

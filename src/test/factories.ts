import type { HeaderRepair, ParsedCsv } from "../types";

/** Build a ParsedCsv from plain headers + string rows, the way the parser would. */
export function makeDataset(
  headers: string[],
  rows: string[][],
  repairs: HeaderRepair[] = [],
): ParsedCsv {
  return {
    fileName: "fixture.csv",
    rawHeaders: headers,
    headers,
    rows,
    rowCount: rows.length,
    totalRowCount: rows.length,
    sampled: false,
    repairs,
  };
}

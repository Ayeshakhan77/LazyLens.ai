import type { ParsedCsv } from "../types";
import { CsvError, parseCsvText } from "./parseCsv";

export const SAMPLE_DATASET_FILE = "sales-sample.csv";
export const SAMPLE_DATASET_LABEL = "Retail sales (sample)";

const SAMPLE_DATASET_URL = `${import.meta.env.BASE_URL}sample-data/sales-sample.csv`;

/**
 * Load the bundled sample dataset. Deliberately routed through `parseCsvText` so the
 * sample exercises the exact same validation, header repair and profiling path as a
 * real upload — there is no separate "sample mode".
 */
export async function loadSampleDataset(): Promise<ParsedCsv> {
  let response: Response;
  try {
    response = await fetch(SAMPLE_DATASET_URL);
  } catch {
    throw new CsvError(
      "read",
      "We couldn't reach the bundled sample dataset. Check your connection, or upload your own CSV.",
    );
  }

  if (!response.ok) {
    throw new CsvError(
      "read",
      "We couldn't load the bundled sample dataset. Upload your own CSV instead.",
    );
  }

  const text = await response.text();
  return parseCsvText(text, SAMPLE_DATASET_FILE);
}

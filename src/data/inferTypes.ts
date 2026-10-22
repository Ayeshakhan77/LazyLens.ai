import type { ColumnType } from "../types";
import { isMissing, parseDate, toNumber } from "./cell";

export interface TypeInference {
  type: ColumnType;
  nonMissing: number;
  numericCount: number;
  dateCount: number;
  numericRatio: number;
  dateRatio: number;
}

/** A column is only "numeric"/"date" when this share of its values agree. */
export const TYPE_THRESHOLD = 0.9;
/** Between this and the threshold, a column is reported as mixed-type. */
export const MIXED_FLOOR = 0.5;

/**
 * Classify a column as numeric, date-like, categorical or empty.
 *
 * Ambiguity is expected: a column of mostly-numbers with a few text entries stays
 * "numeric" but reports a `numericRatio` below 1, which the quality step flags as
 * mixed-type. All-text datasets fall through to "categorical".
 */
export function inferType(values: Array<string | null | undefined>): TypeInference {
  let nonMissing = 0;
  let numericCount = 0;
  let dateCount = 0;

  for (const raw of values) {
    if (isMissing(raw)) continue;
    nonMissing++;
    if (toNumber(raw) !== null) {
      numericCount++;
    } else if (parseDate(raw) !== null) {
      dateCount++;
    }
  }

  const numericRatio = nonMissing === 0 ? 0 : numericCount / nonMissing;
  const dateRatio = nonMissing === 0 ? 0 : dateCount / nonMissing;

  let type: ColumnType;
  if (nonMissing === 0) {
    type = "empty";
  } else if (numericRatio >= TYPE_THRESHOLD) {
    type = "numeric";
  } else if (dateRatio >= TYPE_THRESHOLD) {
    type = "date";
  } else {
    type = "categorical";
  }

  return { type, nonMissing, numericCount, dateCount, numericRatio, dateRatio };
}

/** True when a column is a genuine mixture (part numeric, part something else). */
export function isMixedType(inference: TypeInference): boolean {
  if (inference.nonMissing < 8) return false;
  const { numericRatio, dateRatio } = inference;
  const numericMixed = numericRatio >= MIXED_FLOOR && numericRatio < TYPE_THRESHOLD;
  const dateMixed = dateRatio >= MIXED_FLOOR && dateRatio < TYPE_THRESHOLD;
  return numericMixed || dateMixed;
}

import type { ColumnProfile, ParsedCsv } from "../types";
import { isMissing, toNumber } from "./cell";
import { inferType } from "./inferTypes";

/** Build a per-column profile: detected type, missing/distinct counts, numeric values. */
export function profileColumns(parsed: ParsedCsv): ColumnProfile[] {
  return parsed.headers.map((name, index) => {
    const values = parsed.rows.map((row) => row[index] ?? "");
    const inference = inferType(values);

    const counts = new Map<string, number>();
    const numericValues: number[] = [];
    let missing = 0;

    for (const raw of values) {
      if (isMissing(raw)) {
        missing++;
        continue;
      }
      const key = String(raw).trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      const numeric = toNumber(raw);
      if (numeric !== null) numericValues.push(numeric);
    }

    const topValues = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([value, count]) => ({ value, count }));

    return {
      name,
      index,
      type: inference.type,
      total: values.length,
      missing,
      distinct: counts.size,
      numericRatio: inference.numericRatio,
      dateRatio: inference.dateRatio,
      numericValues,
      topValues,
    };
  });
}

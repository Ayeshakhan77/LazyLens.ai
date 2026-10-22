import type { HeaderRepair } from "../types";

export interface NormalizedHeaders {
  headers: string[];
  repairs: HeaderRepair[];
}

/**
 * Repair blank and duplicate headers.
 *
 * Blank headers become `col`; duplicates get a numeric suffix (`col_2`, `col_3`, …).
 * Every rewrite is reported so the quality report can raise it. Whitespace-only
 * differences are trimmed silently — that is not worth flagging.
 */
export function normalizeHeaders(rawHeaders: string[]): NormalizedHeaders {
  const repairs: HeaderRepair[] = [];
  const used = new Set<string>();
  const headers: string[] = [];

  rawHeaders.forEach((raw, index) => {
    const original = raw ?? "";
    const trimmed = original.trim();

    let base = trimmed;
    let reason: HeaderRepair["reason"] | null = null;

    if (trimmed === "") {
      base = "col";
      reason = "blank";
    }

    let candidate = base;
    if (used.has(candidate.toLowerCase())) {
      if (!reason) reason = "duplicate";
      let suffix = 2;
      while (used.has(`${base}_${suffix}`.toLowerCase())) suffix++;
      candidate = `${base}_${suffix}`;
    }

    used.add(candidate.toLowerCase());
    headers.push(candidate);

    if (reason) {
      repairs.push({ index, original, normalized: candidate, reason });
    }
  });

  return { headers, repairs };
}

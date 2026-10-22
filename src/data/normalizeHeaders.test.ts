import { describe, expect, it } from "vitest";
import { normalizeHeaders } from "./normalizeHeaders";

describe("normalizeHeaders", () => {
  it("leaves clean headers untouched and reports no repairs", () => {
    const result = normalizeHeaders(["id", "name", "score"]);
    expect(result.headers).toEqual(["id", "name", "score"]);
    expect(result.repairs).toEqual([]);
  });

  it("names blank headers `col` and flags them", () => {
    const result = normalizeHeaders(["id", "", "score"]);
    expect(result.headers).toEqual(["id", "col", "score"]);
    expect(result.repairs).toEqual([
      { index: 1, original: "", normalized: "col", reason: "blank" },
    ]);
  });

  it("suffixes duplicate headers and flags them", () => {
    const result = normalizeHeaders(["total", "total", "total"]);
    expect(result.headers).toEqual(["total", "total_2", "total_3"]);
    expect(result.repairs.map((repair) => repair.reason)).toEqual(["duplicate", "duplicate"]);
  });

  it("de-duplicates several blank headers", () => {
    const result = normalizeHeaders(["", "", "x"]);
    expect(result.headers).toEqual(["col", "col_2", "x"]);
    expect(result.repairs).toHaveLength(2);
  });

  it("treats headers differing only by case as duplicates", () => {
    const result = normalizeHeaders(["Total", "total"]);
    expect(result.headers).toEqual(["Total", "total_2"]);
  });

  it("trims surrounding whitespace without raising a repair", () => {
    const result = normalizeHeaders(["  amount  "]);
    expect(result.headers).toEqual(["amount"]);
    expect(result.repairs).toEqual([]);
  });
});

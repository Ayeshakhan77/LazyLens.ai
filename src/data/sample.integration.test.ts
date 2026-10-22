import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { runAnalysis } from "../analysis";
import { parseCsvText } from "./parseCsv";

/**
 * End-to-end check on the real bundled sample: the same file the app serves from
 * `public/sample-data/`. Guards against the sample and the analysis drifting apart.
 */
const csv = readFileSync(
  resolve(process.cwd(), "public/sample-data/sales-sample.csv"),
  "utf8",
);

describe("bundled sample dataset", () => {
  const parsed = parseCsvText(csv, "sales-sample.csv");
  const analysis = runAnalysis(parsed);

  it("parses into the expected shape", () => {
    expect(parsed.headers).toEqual([
      "order_id",
      "order_date",
      "region",
      "channel",
      "category",
      "product",
      "units_sold",
      "unit_price",
      "revenue",
      "customer_rating",
      "warehouse",
    ]);
    expect(parsed.rowCount).toBeGreaterThan(200);
    expect(parsed.repairs).toEqual([]);
  });

  it("detects numeric, date and categorical columns", () => {
    expect(analysis.numericColumns).toContain("revenue");
    expect(analysis.numericColumns).toContain("units_sold");
    expect(analysis.dateColumns).toContain("order_date");
    expect(analysis.categoricalColumns).toContain("region");
  });

  it("finds the planted data-quality issues", () => {
    const categories = analysis.quality.map((issue) => issue.category);
    expect(categories).toContain("duplicate-rows");
    // `warehouse` is constant by construction
    expect(
      analysis.quality.some(
        (issue) => issue.category === "constant" && issue.column === "warehouse",
      ),
    ).toBe(true);
    // customer_rating / channel / unit_price carry planted gaps
    expect(
      analysis.quality.some(
        (issue) => issue.category === "missing" && issue.column === "revenue",
      ),
    ).toBe(false);
    expect(analysis.quality.some((issue) => issue.category === "missing")).toBe(true);
  });

  it("detects outliers in revenue", () => {
    const revenue = analysis.outliers.find((result) => result.column === "revenue");
    expect(revenue).toBeDefined();
    expect(revenue!.count).toBeGreaterThan(0);
    expect(revenue!.upperBound).toBeGreaterThan(0);
  });

  it("produces a monthly trend line", () => {
    expect(analysis.trend).not.toBeNull();
    expect(["day", "month", "year"]).toContain(analysis.trend!.granularity);
    expect(analysis.trend!.points.length).toBeGreaterThanOrEqual(2);
  });

  it("produces category rankings", () => {
    expect(analysis.rankings.length).toBeGreaterThan(0);
    const region = analysis.rankings.find((ranking) => ranking.column === "region");
    expect(region).toBeDefined();
    expect(region!.entries.length).toBe(4);
  });

  it("produces a correlation matrix", () => {
    expect(analysis.correlation).not.toBeNull();
    expect(analysis.correlation!.columns.length).toBeGreaterThanOrEqual(2);
  });

  it("reports headline counts", () => {
    expect(analysis.rowCount).toBe(parsed.rowCount);
    expect(analysis.missingCellCount).toBeGreaterThan(0);
    expect(analysis.duplicateRowCount).toBeGreaterThan(0);
    expect(analysis.missingPct).toBeGreaterThan(0);
  });
});

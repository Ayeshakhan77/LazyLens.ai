import { describe, expect, it } from "vitest";
import { analyzeQuality } from "./quality";
import { profileColumns } from "../data/profile";
import { makeDataset } from "../test/factories";
import type { QualityCategory, QualityIssue } from "../types";

const HEADERS = ["name", "age", "country", "city", "score", "notes", "mixed"];

const ROWS: string[][] = [
  ["a", "30", "US", "NY", "10", "", "1"],
  ["b", "", "US", "NY", "", "", "2"],
  ["c", "25", "US", "NY", "12", "", "3"],
  ["d", "40", "US", "NY", "11", "", "4"],
  ["e", "35", "US", "NY", "13", "", "5"],
  ["f", "28", "US", "NY", "9", "", "6"],
  ["g", "", "US", "NY", "15", "", "7"],
  ["h", "31", "US", "NY", "14", "", "oops"],
  ["i", "29", "US", "   ", "16", "", "n/a"],
  // exact duplicate of row index 4 ("e")
  ["e", "35", "US", "NY", "13", "", "5"],
];

function buildIssues(): { issues: QualityIssue[]; snapshot: string } {
  const parsed = makeDataset(HEADERS, ROWS, [
    { index: 0, original: "name", normalized: "name_2", reason: "duplicate" },
  ]);
  const snapshot = JSON.stringify(parsed.rows);
  const columns = profileColumns(parsed);
  const issues = analyzeQuality({
    rowCount: parsed.rowCount,
    repairs: parsed.repairs,
    columns,
    rows: parsed.rows,
  });
  return { issues, snapshot };
}

const find = (issues: QualityIssue[], category: QualityCategory, column?: string) =>
  issues.find(
    (issue) => issue.category === category && (column === undefined || issue.column === column),
  );

describe("analyzeQuality", () => {
  it("reports duplicate rows", () => {
    const { issues } = buildIssues();
    const duplicate = find(issues, "duplicate-rows");
    expect(duplicate).toBeDefined();
    expect(duplicate!.observed).toContain("1 of 10");
  });

  it("reports missing values with the exact count", () => {
    const { issues } = buildIssues();
    const missing = find(issues, "missing", "age");
    expect(missing).toBeDefined();
    expect(missing!.observed).toContain("2 of 10");
    expect(missing!.severity).toBe("warning");
  });

  it("flags constant columns", () => {
    const { issues } = buildIssues();
    const constant = find(issues, "constant", "country");
    expect(constant).toBeDefined();
    expect(constant!.severity).toBe("info");
  });

  it("flags empty columns as critical", () => {
    const { issues } = buildIssues();
    const empty = find(issues, "empty-column", "notes");
    expect(empty).toBeDefined();
    expect(empty!.severity).toBe("critical");
  });

  it("flags mixed-type columns", () => {
    const { issues } = buildIssues();
    const mixed = find(issues, "mixed-type", "mixed");
    expect(mixed).toBeDefined();
    expect(mixed!.severity).toBe("warning");
  });

  it("raises an issue for repaired headers", () => {
    const { issues } = buildIssues();
    expect(find(issues, "header-repair")).toBeDefined();
  });

  it("sorts critical findings first", () => {
    const { issues } = buildIssues();
    expect(issues[0].severity).toBe("critical");
  });

  it("never mutates the input dataset", () => {
    const first = buildIssues().snapshot;
    const second = buildIssues().snapshot;
    expect(second).toEqual(first);
  });

  it("returns no issues for a clean dataset", () => {
    const clean = makeDataset(
      ["id", "value"],
      [
        ["1", "10"],
        ["2", "20"],
        ["3", "30"],
      ],
    );
    const issues = analyzeQuality({
      rowCount: clean.rowCount,
      repairs: [],
      columns: profileColumns(clean),
      rows: clean.rows,
    });
    expect(issues).toEqual([]);
  });
});

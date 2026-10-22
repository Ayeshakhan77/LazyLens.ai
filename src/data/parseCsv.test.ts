import { describe, expect, it } from "vitest";
import { CsvError, parseCsvText } from "./parseCsv";

describe("parseCsvText", () => {
  it("parses headers and rows", () => {
    const parsed = parseCsvText("a,b\n1,2\n3,4\n", "t.csv");
    expect(parsed.headers).toEqual(["a", "b"]);
    expect(parsed.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
    expect(parsed.rowCount).toBe(2);
    expect(parsed.totalRowCount).toBe(2);
    expect(parsed.sampled).toBe(false);
  });

  it("keeps quoted values containing commas and quotes intact", () => {
    const parsed = parseCsvText('name,note\n"Doe, Jane","She said ""hi"""\n', "t.csv");
    expect(parsed.rows[0]).toEqual(["Doe, Jane", 'She said "hi"']);
  });

  it("repairs blank and duplicate headers", () => {
    const parsed = parseCsvText("id,,id\n1,2,3\n", "t.csv");
    expect(parsed.headers).toEqual(["id", "col", "id_2"]);
    expect(parsed.rawHeaders).toEqual(["id", "", "id"]);
    expect(parsed.repairs).toHaveLength(2);
  });

  it("throws on an empty file", () => {
    expect(() => parseCsvText("   \n", "t.csv")).toThrow(CsvError);
    try {
      parseCsvText("   \n", "t.csv");
    } catch (error) {
      expect((error as CsvError).code).toBe("empty");
    }
  });

  it("throws a header-only error when there are no data rows", () => {
    try {
      parseCsvText("a,b\n", "t.csv");
      throw new Error("expected a CsvError");
    } catch (error) {
      expect(error).toBeInstanceOf(CsvError);
      expect((error as CsvError).code).toBe("header-only");
    }
  });

  it("reports the row number for a ragged row", () => {
    try {
      parseCsvText("a,b\n1,2\n3\n", "t.csv");
      throw new Error("expected a CsvError");
    } catch (error) {
      expect(error).toBeInstanceOf(CsvError);
      const csvError = error as CsvError;
      expect(csvError.code).toBe("malformed");
      expect(csvError.row).toBe(3);
      expect(csvError.message).toContain("Row 3");
    }
  });

  it("ignores blank lines between rows", () => {
    const parsed = parseCsvText("a,b\n1,2\n\n3,4\n\n", "t.csv");
    expect(parsed.rowCount).toBe(2);
  });
});

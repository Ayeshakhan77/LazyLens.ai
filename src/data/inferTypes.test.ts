import { describe, expect, it } from "vitest";
import { inferType, isMixedType } from "./inferTypes";

describe("inferType", () => {
  it("detects numeric columns", () => {
    const result = inferType(["1", "2", "3.5", "42", "0.25"]);
    expect(result.type).toBe("numeric");
    expect(result.numericRatio).toBe(1);
  });

  it("tolerates thousands separators and currency symbols as numeric", () => {
    expect(inferType(["$1,200.50", "$980", "$3,400"]).type).toBe("numeric");
  });

  it("detects ISO date columns", () => {
    const result = inferType(["2025-01-06", "2025-02-11", "2025-03-02", "2025-04-19"]);
    expect(result.type).toBe("date");
    expect(result.dateRatio).toBe(1);
  });

  it("detects slash dates and month-name dates", () => {
    expect(inferType(["01/06/2025", "02/11/2025", "03/02/2025"]).type).toBe("date");
    expect(inferType(["Jan 6, 2025", "Feb 11, 2025", "Mar 2, 2025"]).type).toBe("date");
  });

  it("treats a column of bare years as numeric, not dates", () => {
    const result = inferType(["2020", "2021", "2022", "2023"]);
    expect(result.type).toBe("numeric");
    expect(result.dateCount).toBe(0);
  });

  it("detects categorical columns", () => {
    const result = inferType(["North", "South", "East", "West"]);
    expect(result.type).toBe("categorical");
    expect(result.numericRatio).toBe(0);
  });

  it("classifies a mostly-text column as categorical", () => {
    const result = inferType(["red", "green", "blue", "amber"]);
    expect(result.type).toBe("categorical");
  });

  it("reports empty when every value is missing", () => {
    const result = inferType(["", "NA", "n/a", "   "]);
    expect(result.type).toBe("empty");
    expect(result.nonMissing).toBe(0);
  });

  it("keeps an ambiguous column categorical but exposes the mixture", () => {
    const values = ["1", "2", "3", "4", "5", "6", "7", "8", "oops", "also text"];
    const result = inferType(values);
    expect(result.type).toBe("categorical");
    expect(result.numericRatio).toBeCloseTo(0.8, 5);
    expect(isMixedType(result)).toBe(true);
  });

  it("does not call a clean numeric column mixed", () => {
    const result = inferType(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(result.type).toBe("numeric");
    expect(isMixedType(result)).toBe(false);
  });

  it("handles an all-text dataset without crashing", () => {
    const values = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"];
    const result = inferType(values);
    expect(result.type).toBe("categorical");
    expect(result.numericRatio).toBe(0);
    expect(result.dateRatio).toBe(0);
  });
});

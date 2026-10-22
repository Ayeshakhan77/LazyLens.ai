import { describe, expect, it } from "vitest";
import { findOutliers } from "./outliers";

describe("findOutliers", () => {
  it("finds a high outlier and reports the IQR fence", () => {
    const result = findOutliers("amount", [10, 11, 12, 12, 13, 13, 14, 15, 100]);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
    expect(result!.lowerBound).toBeCloseTo(9, 6);
    expect(result!.upperBound).toBeCloseTo(17, 6);
    expect(result!.values).toEqual([100]);
  });

  it("finds a low outlier", () => {
    const result = findOutliers("amount", [-50, 10, 11, 12, 12, 13, 13, 14, 15]);
    expect(result!.count).toBe(1);
    expect(result!.values).toEqual([-50]);
  });

  it("returns null when there are too few values", () => {
    expect(findOutliers("x", [1, 2, 3, 100])).toBeNull();
  });

  it("returns null when the column has no spread", () => {
    expect(findOutliers("x", [5, 5, 5, 5, 5, 5, 5, 5, 5])).toBeNull();
  });

  it("reports zero outliers when all values sit inside the fence", () => {
    const result = findOutliers("x", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(0);
  });
});

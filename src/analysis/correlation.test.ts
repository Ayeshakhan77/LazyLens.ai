import { describe, expect, it } from "vitest";
import { correlationMatrix, pearson, pearsonAligned } from "./correlation";

describe("pearson", () => {
  it("is 1 for a perfect positive relationship", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
  });

  it("is −1 for a perfect negative relationship", () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
  });

  it("matches a hand-computed coefficient", () => {
    // mean 3 for both; covariance 8; each variance 10 -> r = 8 / 10 = 0.8
    expect(pearson([1, 2, 3, 4, 5], [2, 1, 4, 3, 5])).toBeCloseTo(0.8, 10);
  });

  it("returns 0 when a series has no variance", () => {
    expect(pearson([1, 2, 3, 4], [5, 5, 5, 5])).toBe(0);
  });

  it("returns NaN with fewer than three points", () => {
    expect(Number.isNaN(pearson([1, 2], [2, 4]))).toBe(true);
  });
});

describe("pearsonAligned", () => {
  it("uses only rows where both values are present", () => {
    const a = [1, null, 3, 4, 5];
    const b = [2, 5, null, 8, 10];
    // complete pairs: (1,2), (4,8), (5,10) -> perfectly linear
    expect(pearsonAligned(a, b)).toBeCloseTo(1, 10);
  });
});

describe("correlationMatrix", () => {
  it("builds a symmetric matrix with a unit diagonal", () => {
    const result = correlationMatrix([
      { name: "a", values: [1, 2, 3, 4, 5] },
      { name: "b", values: [2, 4, 6, 8, 10] },
      { name: "c", values: [5, 4, 3, 2, 1] },
    ]);
    expect(result).not.toBeNull();
    expect(result!.columns).toEqual(["a", "b", "c"]);
    expect(result!.matrix[0][0]).toBe(1);
    expect(result!.matrix[0][1]).toBeCloseTo(1, 10);
    expect(result!.matrix[0][2]).toBeCloseTo(-1, 10);
    expect(result!.matrix[1][2]).toBeCloseTo(result!.matrix[2][1], 10);
  });

  it("returns null with fewer than two usable columns", () => {
    expect(correlationMatrix([{ name: "a", values: [1, 2, 3] }])).toBeNull();
  });

  it("sorts the strongest pairs by absolute r", () => {
    const result = correlationMatrix([
      { name: "a", values: [1, 2, 3, 4, 5] },
      { name: "b", values: [1, 1.2, 2.9, 4.1, 4.8] },
      { name: "c", values: [5, 4, 3, 2, 1] },
    ]);
    expect(result!.strongest.length).toBe(3);
    expect(Math.abs(result!.strongest[0].r)).toBeGreaterThanOrEqual(
      Math.abs(result!.strongest[1].r),
    );
  });
});

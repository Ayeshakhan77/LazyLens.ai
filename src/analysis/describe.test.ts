import { describe, expect, it } from "vitest";
import { describeColumn, quantile } from "./describe";

describe("quantile", () => {
  it("interpolates between points (type 7)", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4], 0)).toBe(1);
    expect(quantile([1, 2, 3, 4], 1)).toBe(4);
  });
});

describe("describeColumn", () => {
  const values = [2, 4, 4, 4, 5, 5, 7, 9];

  it("computes count, sum and mean", () => {
    const summary = describeColumn("x", values);
    expect(summary.count).toBe(8);
    expect(summary.sum).toBe(40);
    expect(summary.mean).toBe(5);
  });

  it("computes min, max and quartiles", () => {
    const summary = describeColumn("x", values);
    expect(summary.min).toBe(2);
    expect(summary.max).toBe(9);
    expect(summary.q1).toBe(4);
    expect(summary.median).toBe(4.5);
    expect(summary.q3).toBe(5.5);
  });

  it("uses the sample standard deviation (n−1)", () => {
    expect(describeColumn("x", values).std).toBeCloseTo(2.1381, 3);
  });

  it("carries the missing count through untouched", () => {
    expect(describeColumn("x", values, 3).missing).toBe(3);
  });

  it("handles a single value", () => {
    const summary = describeColumn("x", [7]);
    expect(summary.std).toBe(0);
    expect(summary.median).toBe(7);
    expect(summary.q1).toBe(7);
  });

  it("handles an empty column without throwing", () => {
    const summary = describeColumn("x", []);
    expect(summary.count).toBe(0);
    expect(Number.isNaN(summary.mean)).toBe(true);
  });

  it("does not mutate the input array", () => {
    const input = [5, 1, 4, 2];
    describeColumn("x", input);
    expect(input).toEqual([5, 1, 4, 2]);
  });
});

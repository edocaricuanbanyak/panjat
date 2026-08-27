import { describe, expect, it } from "vitest";
import { computeRanks } from "../ranking";

const at = (iso: string) => new Date(iso);

describe("computeRanks", () => {
  it("orders by grip descending with contiguous 1-based ranks", () => {
    const ranked = computeRanks([
      { id: "a", peganganCached: 5000, createdAt: at("2026-01-01T00:00:00Z") },
      { id: "b", peganganCached: 100_000, createdAt: at("2026-01-01T00:00:00Z") },
      { id: "c", peganganCached: 20_000, createdAt: at("2026-01-01T00:00:00Z") },
    ]);
    expect(ranked.map((r) => [r.rank, r.listing.id])).toEqual([
      [1, "b"],
      [2, "c"],
      [3, "a"],
    ]);
  });

  it("breaks grip ties by earlier createdAt", () => {
    const ranked = computeRanks([
      { id: "late", peganganCached: 1000, createdAt: at("2026-01-02T00:00:00Z") },
      { id: "early", peganganCached: 1000, createdAt: at("2026-01-01T00:00:00Z") },
    ]);
    expect(ranked.map((r) => r.listing.id)).toEqual(["early", "late"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      { id: "a", peganganCached: 1, createdAt: at("2026-01-01T00:00:00Z") },
      { id: "b", peganganCached: 2, createdAt: at("2026-01-01T00:00:00Z") },
    ];
    const snapshot = input.map((l) => l.id);
    computeRanks(input);
    expect(input.map((l) => l.id)).toEqual(snapshot);
  });
});

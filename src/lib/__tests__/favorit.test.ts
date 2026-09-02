import { describe, expect, it } from "vitest";
import { weekBucket, weekStartWIB } from "../favorit";

describe("weekStartWIB", () => {
  it("anchors the week to the Wednesday 17:00 WIB (10:00 UTC) cut-off", () => {
    // Just before the cut-off → the previous Wednesday.
    expect(weekStartWIB(new Date("2026-08-26T09:59:00Z"))).toBe("2026-08-19");
    // Just after the cut-off → that Wednesday.
    expect(weekStartWIB(new Date("2026-08-26T10:01:00Z"))).toBe("2026-08-26");
    // Anywhere inside the week (up to the next cut-off) → the same Wednesday.
    expect(weekStartWIB(new Date("2026-09-02T09:59:00Z"))).toBe("2026-08-26");
    expect(weekStartWIB(new Date("2026-08-31T05:00:00Z"))).toBe("2026-08-26");
  });
});

describe("weekBucket (vote-lock seam)", () => {
  // The daily vote-lock key embeds weekBucket, so the lock must flip exactly at
  // the Wednesday 17:00 WIB cut-off — letting a Wednesday-morning voter cast a
  // fresh vote into the newly-opened week instead of being stuck until midnight.
  it("increments across the Wednesday 17:00 WIB cut-off", () => {
    const before = weekBucket(new Date("2026-08-26T09:59:00Z")); // Wed morning WIB
    const after = weekBucket(new Date("2026-08-26T10:01:00Z")); // just past cut-off
    expect(after).toBe(before + 1);
  });

  it("stays constant within a normal day (lock unchanged)", () => {
    const morning = weekBucket(new Date("2026-08-31T00:10:00Z"));
    const evening = weekBucket(new Date("2026-08-31T16:00:00Z"));
    expect(evening).toBe(morning);
  });
});

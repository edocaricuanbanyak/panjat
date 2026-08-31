import { describe, expect, it } from "vitest";
import { weekStartWIB } from "../favorit";

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

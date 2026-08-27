import { describe, expect, it } from "vitest";
import { computeStreak, cutoffPassed, todayWIB } from "../tebakan";
import { signAnon, verifyAnon } from "@/lib/anon";

describe("todayWIB / cutoffPassed", () => {
  it("uses the Jakarta calendar date", () => {
    // 2026-08-26T17:30Z = 2026-08-27 00:30 WIB → next day in WIB
    expect(todayWIB(new Date("2026-08-26T17:30:00Z"))).toBe("2026-08-27");
    expect(todayWIB(new Date("2026-08-27T05:00:00Z"))).toBe("2026-08-27");
  });

  it("closes guessing from 21:00 WIB", () => {
    expect(cutoffPassed(new Date("2026-08-27T13:59:00Z"))).toBe(false); // 20:59 WIB
    expect(cutoffPassed(new Date("2026-08-27T14:00:00Z"))).toBe(true); // 21:00 WIB
    expect(cutoffPassed(new Date("2026-08-27T16:00:00Z"))).toBe(true); // 23:00 WIB
  });
});

describe("computeStreak", () => {
  const champs = new Map([
    ["2026-08-25", "A"],
    ["2026-08-26", "A"],
    ["2026-08-27", "B"],
  ]);

  it("counts consecutive correct guesses ending at the latest resolved day", () => {
    const guesses = new Map([
      ["2026-08-25", "A"],
      ["2026-08-26", "A"],
      ["2026-08-27", "B"],
    ]);
    expect(computeStreak(champs, guesses, "2026-08-27")).toBe(3);
  });

  it("breaks on a miss at the latest day", () => {
    const guesses = new Map([["2026-08-27", "A"]]); // wrong (champ was B)
    expect(computeStreak(champs, guesses, "2026-08-27")).toBe(0);
  });

  it("breaks on a gap / missing guess", () => {
    const guesses = new Map([
      ["2026-08-25", "A"],
      ["2026-08-27", "B"], // no guess on the 26th
    ]);
    expect(computeStreak(champs, guesses, "2026-08-27")).toBe(1);
  });

  it("is 0 when nothing is resolved", () => {
    expect(computeStreak(champs, new Map(), null)).toBe(0);
  });
});

describe("anon cookie", () => {
  it("round-trips a signed id and rejects tampering", () => {
    const prev = process.env.ANON_SECRET;
    process.env.ANON_SECRET = "t";
    try {
      const t = signAnon("visitor-1");
      expect(verifyAnon(t)).toBe("visitor-1");
      expect(verifyAnon("visitor-2." + t.split(".")[1])).toBeNull();
      expect(verifyAnon(undefined)).toBeNull();
    } finally {
      process.env.ANON_SECRET = prev;
    }
  });
});

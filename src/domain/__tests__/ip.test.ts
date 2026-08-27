import { describe, expect, it } from "vitest";
import { dailySalt, hashWith, utcDateKey } from "@/lib/ip";

const KEY = "test-secret";
const day1 = new Date("2026-08-27T10:00:00Z");
const day2 = new Date("2026-08-28T10:00:00Z");

describe("dailySalt / hashWith", () => {
  it("derives the same salt within a UTC day, different across days", () => {
    expect(utcDateKey(day1)).toBe("2026-08-27");
    expect(dailySalt(new Date("2026-08-27T23:59:00Z"), KEY)).toBe(dailySalt(day1, KEY));
    expect(dailySalt(day2, KEY)).not.toBe(dailySalt(day1, KEY));
  });

  it("hashes the same IP to a stable value within a day", () => {
    const salt = dailySalt(day1, KEY);
    expect(hashWith("203.0.113.7", salt)).toBe(hashWith("203.0.113.7", salt));
  });

  it("makes the same IP unlinkable across days (salt rotation)", () => {
    const h1 = hashWith("203.0.113.7", dailySalt(day1, KEY));
    const h2 = hashWith("203.0.113.7", dailySalt(day2, KEY));
    expect(h1).not.toBe(h2);
  });

  it("distinguishes different IPs and never returns the raw value", () => {
    const salt = dailySalt(day1, KEY);
    const h = hashWith("203.0.113.7", salt);
    expect(h).not.toContain("203.0.113.7");
    expect(h).not.toBe(hashWith("203.0.113.8", salt));
  });

  it("returns empty hash for empty input", () => {
    expect(hashWith("", dailySalt(day1, KEY))).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { formatCount, formatMoney, formatRupiah, formatWIB, formatWIBTime } from "@/lib/format";

// These assert BYTE-IDENTICAL output under the default (Indonesian) MARKET
// config — the guard that internationalization did not change panjat.id money
// rendering. A global (USD) deployment is verified separately with MARKET env set.
describe("formatRupiah (default MARKET = IDR)", () => {
  it("formats integer rupiah, no space after symbol, no decimals", () => {
    expect(formatRupiah(30_000)).toBe("Rp30.000");
    expect(formatRupiah(1000)).toBe("Rp1.000");
    expect(formatRupiah(0)).toBe("Rp0");
  });

  it("formatMoney is the same function (alias)", () => {
    expect(formatMoney).toBe(formatRupiah);
    expect(formatMoney(95_000)).toBe("Rp95.000");
  });
});

describe("formatCount (default MARKET = id-ID grouping)", () => {
  it("groups thousands with a dot", () => {
    expect(formatCount(12_345)).toBe("12.345");
    expect(formatCount(0)).toBe("0");
  });
});

describe("formatWIB", () => {
  it("renders a UTC instant in Jakarta time (+7)", () => {
    // 02:00 UTC = 09.00 WIB
    const t = new Date("2026-08-27T02:00:00Z");
    expect(formatWIBTime(t)).toBe("09.00");
    expect(formatWIB(t)).toContain("2026");
    expect(formatWIB(t)).toContain("09.00");
  });
});

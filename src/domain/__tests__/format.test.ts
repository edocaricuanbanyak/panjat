import { describe, expect, it } from "vitest";
import { formatRupiah, formatWIB, formatWIBTime } from "@/lib/format";

describe("formatRupiah", () => {
  it("formats integer rupiah with thousands separators, no decimals", () => {
    expect(formatRupiah(30_000)).toMatch(/^Rp\s?30\.000$/);
    expect(formatRupiah(1000)).toMatch(/^Rp\s?1\.000$/);
    expect(formatRupiah(0)).toMatch(/^Rp\s?0$/);
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

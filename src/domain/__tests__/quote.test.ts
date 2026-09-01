import { describe, expect, it } from "vitest";
import { type BoardEntry, nominalForTarget, projectQuote } from "../manjat";
import type { RosotConfig } from "../rosot";

const board = [100_000, 70_000, 60_000, 40_000, 35_000]; // grips desc
const MIN = 5000;

describe("nominalForTarget", () => {
  it("prices #1 as one rupiah over the current summit", () => {
    expect(nominalForTarget("#1", board, MIN)).toBe(100_001);
  });

  it("prices top3 / top10 off the grip at that rank (Rp1 local increment)", () => {
    expect(nominalForTarget("top3", board, MIN)).toBe(60_001);
    // Fewer than 10 listings → grip at rank 10 is 0 → clamped to the minimum.
    expect(nominalForTarget("top10", board, MIN)).toBe(MIN);
  });

  it("clamps to the first-climb minimum on an empty board", () => {
    expect(nominalForTarget("#1", [], MIN)).toBe(MIN);
    expect(nominalForTarget("top3", [], MIN)).toBe(MIN);
  });
});

// Zero-decay config keeps the projection math deterministic and decay-agnostic.
const ROSOT: RosotConfig = {
  lajuRosot: { r1: 0, r2_3: 0, r4_10: 0, r11_30: 0, r31plus: 0 },
  ambang: { top1: 1, top3: 3, top10: 10, top30: 30 },
  kakiTiang: 1000,
  lantaiRasio: 0,
  lantaiMaks: 0,
  masaTenangJam: 0,
};

const entry = (id: string, pegangan: number): BoardEntry => ({ id, nama: id, pegangan });

describe("projectQuote", () => {
  const paidBoard = [entry("a", 100_000), entry("b", 70_000), entry("c", 40_000)];

  it("naik: ranks a fresh climb by its own nominal", () => {
    const q = projectQuote({ board: paidBoard, existing: null, nominal: 50_000, minimum: MIN, rosotCfg: ROSOT });
    expect(q.mode).toBe("naik");
    expect(q.peganganSaatIni).toBe(0);
    expect(q.peganganProyeksi).toBe(50_000);
    // Sits below 100k and 70k, above 40k → rank 3.
    expect(q.rank).toBe(3);
    expect(q.totalPapan).toBe(3);
  });

  it("manjat lagi: accumulates existing grip + nominal and drops its own row", () => {
    // Listing "b" (70k) tops up by 40k → 110k, above the 100k summit → rank 1.
    const q = projectQuote({
      board: paidBoard,
      existing: { id: "b", pegangan: 70_000 },
      nominal: 40_000,
      minimum: MIN,
      rosotCfg: ROSOT,
    });
    expect(q.mode).toBe("manjat_lagi");
    expect(q.peganganSaatIni).toBe(70_000);
    expect(q.peganganProyeksi).toBe(110_000);
    expect(q.rank).toBe(1);
    // Its own old row is excluded from the board it's compared against.
    expect(q.totalPapan).toBe(2);
    expect(q.bawah.some((n) => n.nama === "b")).toBe(false);
  });

  it("Kaki Tiang (grip 0) rows never enter the paid projection", () => {
    const withFree = [...paidBoard, entry("free1", 0), entry("free2", 0)];
    const q = projectQuote({ board: withFree, existing: null, nominal: 10_000, minimum: MIN, rosotCfg: ROSOT });
    // Only the 3 paid rows count; the grip-0 rows are filtered out.
    expect(q.totalPapan).toBe(3);
    expect(q.rank).toBe(4);
    expect(q.bawah.some((n) => n.pegangan === 0)).toBe(false);
  });
});

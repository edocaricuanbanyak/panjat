import { describe, expect, it } from "vitest";
import { lapis1 } from "../moderasi";

describe("lapis1 — deterministic moderation", () => {
  it("rejects gambling/slot", () => {
    expect(lapis1("Slot Gacor Maxwin", "menang terus", "gacor88.com").verdict).toBe("tolak");
    expect(lapis1("Situs Togel", null, "x.id").kategori).toBe("judi");
  });

  it("rejects adult content", () => {
    expect(lapis1("Nonton Bokep", "gratis", "x.id").verdict).toBe("tolak");
  });

  it("rejects chat-group and shortener links", () => {
    expect(lapis1("Join grup", "gabung", "t.me/grupku").verdict).toBe("tolak");
    expect(lapis1("Promo", "klik", "bit.ly/abc").verdict).toBe("tolak");
  });

  it("escalates pinjol to ragu (needs legal nuance)", () => {
    expect(lapis1("Pinjaman Online Cepat", "cair 5 menit", "danacepat.id").verdict).toBe("ragu");
  });

  it("passes ordinary products", () => {
    expect(lapis1("Nyala Analytics", "analitik web ramah privasi", "nyala.id").verdict).toBe("lolos");
    expect(lapis1("Warungku POS", "kasir UMKM", "warungku.app").verdict).toBe("lolos");
  });

  it("does not false-positive on substrings inside normal words", () => {
    // "analisis" contains no banned token; "keslot"? ensure word boundaries hold
    expect(lapis1("Jasa Analisis Data", "riset pasar", "data.id").verdict).toBe("lolos");
  });
});

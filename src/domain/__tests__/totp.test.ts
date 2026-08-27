import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, verifyTotp } from "@/lib/totp";

// RFC 6238 test vector: secret ASCII "12345678901234567890" (SHA1), 6 digits.
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("verifyTotp (RFC 6238)", () => {
  it("accepts the known code at T=59s", () => {
    expect(verifyTotp(SECRET, "287082", { now: 59_000, window: 0 })).toBe(true);
  });
  it("accepts within the skew window (previous step)", () => {
    // code 287082 is for step at T=59; still valid at T≈75 with window 1
    expect(verifyTotp(SECRET, "287082", { now: 75_000, window: 1 })).toBe(true);
  });
  it("rejects a wrong code and outside the window", () => {
    expect(verifyTotp(SECRET, "000000", { now: 59_000 })).toBe(false);
    expect(verifyTotp(SECRET, "287082", { now: 300_000, window: 1 })).toBe(false);
  });
});

describe("base32 round-trip", () => {
  it("encodes and decodes back", () => {
    const buf = Buffer.from("12345678901234567890");
    expect(base32Encode(buf)).toBe(SECRET);
    expect(base32Decode(SECRET).toString()).toBe("12345678901234567890");
  });
});

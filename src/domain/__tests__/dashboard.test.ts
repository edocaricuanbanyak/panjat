import { describe, expect, it } from "vitest";
import { cpc } from "../dashboard";
import { signSession, verifySession } from "@/lib/session";

describe("cpc", () => {
  it("is daily decay cost per click", () => {
    expect(cpc(25_000, 400)).toBe(63); // ~Rp62–63/klik
    expect(cpc(3000, 10)).toBe(300);
  });
  it("is null with no clicks", () => {
    expect(cpc(5000, 0)).toBeNull();
  });
});

describe("session token", () => {
  const SECRET = "test-secret";
  const withSecret = <T>(fn: () => T): T => {
    const prev = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = SECRET;
    try {
      return fn();
    } finally {
      process.env.SESSION_SECRET = prev;
    }
  };

  it("round-trips a kontak id", () => {
    withSecret(() => {
      const token = signSession("kontak-123");
      expect(verifySession(token)).toBe("kontak-123");
    });
  });

  it("rejects a tampered payload", () => {
    withSecret(() => {
      const token = signSession("kontak-123");
      const [, sig] = token.split(".");
      const forged = `${Buffer.from(JSON.stringify({ k: "attacker", exp: Date.now() + 1e6 })).toString("base64url")}.${sig}`;
      expect(verifySession(forged)).toBeNull();
    });
  });

  it("rejects an expired token", () => {
    withSecret(() => {
      const token = signSession("kontak-123", Date.now() - 40 * 24 * 3600_000);
      expect(verifySession(token)).toBeNull();
    });
  });

  it("rejects junk and undefined", () => {
    withSecret(() => {
      expect(verifySession(undefined)).toBeNull();
      expect(verifySession("not.a.token")).toBeNull();
    });
  });
});

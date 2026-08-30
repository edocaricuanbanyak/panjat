import { describe, expect, it } from "vitest";
import { normalizeUrl } from "../url";

describe("normalizeUrl", () => {
  it("lowercases host, strips www and trailing slash", () => {
    expect(normalizeUrl("https://WWW.Nyala.ID/")).toBe("nyala.id");
    expect(normalizeUrl("nyala.id")).toBe("nyala.id");
  });

  it("collapses www-typo variants to the same host (no duplicate listings)", () => {
    expect(normalizeUrl("wwww.psikorealis.id")).toBe("psikorealis.id");
    expect(normalizeUrl("https://wwww.psikorealis.id/p/tes")).toBe("psikorealis.id/p/tes");
    // A normal subdomain that merely starts with letters is untouched.
    expect(normalizeUrl("web.example.com")).toBe("web.example.com");
  });

  it("drops tracking params but keeps real ones (sorted)", () => {
    expect(normalizeUrl("https://nyala.id/?utm_source=x&ref=1&fbclid=y&igsh=z")).toBe(
      "nyala.id?ref=1",
    );
    expect(normalizeUrl("https://nyala.id/app?b=2&a=1")).toBe("nyala.id/app?a=1&b=2");
  });

  it("drops the fragment", () => {
    expect(normalizeUrl("https://nyala.id/docs#install")).toBe("nyala.id/docs");
  });

  it("treats @handle, twitter.com and x.com as one listing", () => {
    const canonical = "x.com/budi";
    expect(normalizeUrl("@budi")).toBe(canonical);
    expect(normalizeUrl("x.com/budi")).toBe(canonical);
    expect(normalizeUrl("https://twitter.com/budi")).toBe(canonical);
    expect(normalizeUrl("https://www.twitter.com/budi/")).toBe(canonical);
  });

  it("rejects unsupported/dangerous schemes", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeUrl("data:text/html,x")).toThrow();
    expect(() => normalizeUrl("ftp://example.com")).toThrow();
  });

  it("rejects panjat.id and its subdomains (no self-listing)", () => {
    expect(() => normalizeUrl("panjat.id")).toThrow();
    expect(() => normalizeUrl("https://www.panjat.id/manjat")).toThrow();
    expect(() => normalizeUrl("adm.panjat.id")).toThrow();
    // A look-alike host that merely ends in "panjat.id" text is still fine.
    expect(normalizeUrl("bukanpanjat.id")).toBe("bukanpanjat.id");
  });
});

import { describe, expect, it } from "vitest";
import { isBot, withUtm } from "../klik";

describe("isBot", () => {
  it("flags empty and known bot user-agents", () => {
    expect(isBot("")).toBe(true);
    expect(isBot("   ")).toBe(true);
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("curl/8.4.0")).toBe(true);
    expect(isBot("HeadlessChrome/120")).toBe(true);
  });

  it("passes normal browser user-agents", () => {
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605")).toBe(false);
  });
});

describe("withUtm", () => {
  it("appends leaderboard UTM params", () => {
    const out = new URL(withUtm("nyala.id"));
    expect(out.origin + out.pathname).toBe("https://nyala.id/");
    expect(out.searchParams.get("utm_source")).toBe("panjat");
    expect(out.searchParams.get("utm_medium")).toBe("leaderboard");
  });

  it("preserves an existing path and query", () => {
    const out = new URL(withUtm("x.com/budi?ref=1"));
    expect(out.hostname).toBe("x.com");
    expect(out.pathname).toBe("/budi");
    expect(out.searchParams.get("ref")).toBe("1");
    expect(out.searchParams.get("utm_source")).toBe("panjat");
  });
});

import { describe, expect, it } from "vitest";
import { parseOg } from "../preview";

const base = "https://nyala.id/";

describe("parseOg", () => {
  it("prefers og tags", () => {
    const html = `
      <meta property="og:title" content="Nyala Analytics" />
      <meta property="og:description" content="Analitik ramah privasi" />
      <meta property="og:image" content="/card.png" />
      <title>ignored</title>`;
    const og = parseOg(html, base);
    expect(og.title).toBe("Nyala Analytics");
    expect(og.description).toBe("Analitik ramah privasi");
    expect(og.logo).toBe("https://nyala.id/card.png"); // resolved absolute
  });

  it("falls back to <title> and meta description", () => {
    const html = `<title>Warungku POS</title><meta name="description" content="Kasir UMKM">`;
    const og = parseOg(html, base);
    expect(og.title).toBe("Warungku POS");
    expect(og.description).toBe("Kasir UMKM");
  });

  it("prefers apple-touch-icon for the logo", () => {
    const html = `<link rel="apple-touch-icon" href="https://cdn.x/icon.png"><meta property="og:image" content="/banner.png">`;
    expect(parseOg(html, base).logo).toBe("https://cdn.x/icon.png");
  });

  it("decodes entities and handles missing tags", () => {
    expect(parseOg(`<title>A &amp; B</title>`, base).title).toBe("A & B");
    const empty = parseOg(`<p>no meta here</p>`, base);
    expect(empty.title).toBeNull();
    expect(empty.logo).toBeNull();
  });
});

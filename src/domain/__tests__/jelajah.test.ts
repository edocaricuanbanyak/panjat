import { describe, expect, it } from "vitest";
import { parseAsal, parseSort } from "../jelajah";

describe("parseSort", () => {
  it("accepts known sorts, defaults to terbaru", () => {
    expect(parseSort("klik")).toBe("klik");
    expect(parseSort("sorak")).toBe("sorak");
    expect(parseSort("terbaru")).toBe("terbaru");
    expect(parseSort(undefined)).toBe("terbaru");
    expect(parseSort("pegangan")).toBe("terbaru"); // money-sort not offered here
  });
});

describe("parseAsal", () => {
  it("accepts known origins, else null", () => {
    expect(parseAsal("papan")).toBe("papan");
    expect(parseAsal("jelajah")).toBe("jelajah");
    expect(parseAsal("pencarian")).toBe("pencarian");
    expect(parseAsal("evil")).toBeNull();
    expect(parseAsal(null)).toBeNull();
    expect(parseAsal(undefined)).toBeNull();
  });
});

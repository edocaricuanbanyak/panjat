import { describe, expect, it } from "vitest";
import { isPrivateIp } from "@/lib/ssrf";

describe("isPrivateIp", () => {
  it("flags loopback / private / link-local / metadata", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "0.0.0.0",
      "100.64.0.1", // CGNAT
      "::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1", // mapped loopback
    ]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "104.26.10.5", "2606:4700::1111"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });

  it("rejects malformed input", () => {
    expect(isPrivateIp("999.1.1.1")).toBe(true);
    expect(isPrivateIp("not-an-ip")).toBe(true);
  });
});

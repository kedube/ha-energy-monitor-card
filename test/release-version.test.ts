import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compareVersions, latestVersion, nextVersion, parseVersion } from "../scripts/release/version.mjs";

describe("release versions", () => {
  it("package.json holds a MAJOR.MM version", () => {
    const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(parseVersion(version)).not.toBeNull();
  });

  it("accepts only MAJOR.MM", () => {
    expect(parseVersion("1.00")).toEqual({ major: 1, minor: 0 });
    expect(parseVersion("12.34")).toEqual({ major: 12, minor: 34 });
    for (const bad of ["v1.00", "1.0", "1.000", "1.0.0", "01.00", "1.1", ""]) {
      expect(parseVersion(bad), bad).toBeNull();
    }
  });

  it("steps the minor by one and rolls 99 over to the next major", () => {
    expect(nextVersion("1.00")).toBe("1.01");
    expect(nextVersion("1.09")).toBe("1.10");
    expect(nextVersion("1.98")).toBe("1.99");
    expect(nextVersion("1.99")).toBe("2.00");
    expect(() => nextVersion("1.0.0")).toThrow(/MAJOR\.MM/);
  });

  it("orders versions numerically", () => {
    expect(compareVersions("1.10", "1.09")).toBeGreaterThan(0);
    expect(compareVersions("2.00", "1.99")).toBeGreaterThan(0);
    expect(compareVersions("1.05", "1.05")).toBe(0);
    expect(compareVersions("1.01", "1.10")).toBeLessThan(0);
  });

  it("finds the latest release among tags, ignoring other tag styles", () => {
    expect(latestVersion([])).toBeNull();
    expect(latestVersion(["1.00", "1.10", "1.09", "v9.00", "3.0.0"])).toBe("1.10");
    expect(latestVersion(["1.99", "2.00", "1.100"])).toBe("2.00");
  });
});

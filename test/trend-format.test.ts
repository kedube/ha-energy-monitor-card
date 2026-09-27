import { describe, expect, it } from "vitest";
import { formatDuration, formatPower, formatVoltage } from "../src/format";
import { Trend, replayHistory } from "../src/trend";
import { states } from "./helpers";

describe("Trend", () => {
  it("averages samples per bucket and keeps the dominant source", () => {
    const t = new Trend(60_000, 6); // 10 s buckets
    t.add(0, 1000, "grid");
    t.add(5000, 3000, "grid");
    t.add(9000, 2000, "generator");
    const pts = t.points(9000);
    const last = pts[pts.length - 1]!;
    expect(last.avg).toBe(2000);
    expect(last.max).toBe(3000);
    expect(last.source).toBe("grid");
    expect(pts.slice(0, -1).every((p) => p === null)).toBe(true);
  });

  it("reports time on generator and outage over the window", () => {
    const t = new Trend(60_000, 6);
    t.add(1000, 4000, "generator");
    t.add(11000, 4000, "generator");
    t.add(21000, null, "none");
    const s = t.stats(25000);
    expect(s.generatorMs).toBe(20_000);
    expect(s.outageMs).toBe(10_000);
    expect(s.peak).toBe(4000);
  });

  it("prunes old buckets and back-fills only gaps", () => {
    const live = new Trend(60_000, 6);
    live.add(55_000, 500, "grid");
    const hist = new Trend(60_000, 6);
    hist.add(15_000, 100, "grid");
    hist.add(55_000, 9999, "grid");
    live.fillFrom(hist);
    const pts = live.points(59_000);
    expect(pts[pts.length - 1]!.avg).toBe(500);
    expect(pts[1]!.avg).toBe(100);
    live.prune(200_000);
    expect(live.size).toBe(0);
  });
});

describe("replayHistory", () => {
  it("answers each moment with the state recorded at that time", () => {
    const live = states({ "sensor.p": ["999", { unit_of_measurement: "W" }], "sensor.untracked": "live" });
    const history = {
      "sensor.p": [
        { s: "100", lu: 10 },
        { s: "200", lu: 20 },
      ],
    };
    const seen: [number, string | undefined, string | undefined, unknown][] = [];
    replayHistory(history, live, 5_000, 25_000, 10_000, (t, get) =>
      seen.push([t, get("sensor.p")?.state, get("sensor.untracked")?.state, get("sensor.p")?.attributes.unit_of_measurement]),
    );
    expect(seen).toEqual([
      [5_000, "unavailable", "live", "W"],
      [15_000, "100", "live", "W"],
      [25_000, "200", "live", "W"],
    ]);
  });
});

describe("formatting", () => {
  it("formats power with automatic units", () => {
    expect(formatPower(845, "auto", 1, "en-US")).toEqual({ value: "845", unit: "W" });
    expect(formatPower(12345, "auto", 1, "en-US")).toEqual({ value: "12.3", unit: "kW" });
    expect(formatPower(-40, "kW", 1, "en-US")).toEqual({ value: "0.0", unit: "kW" });
    expect(formatPower(2500, "W", 1, "en-US")).toEqual({ value: "2,500", unit: "W" });
    expect(formatPower(1500, "auto", 2, "de-DE")).toEqual({ value: "1,50", unit: "kW" });
    expect(formatPower(null)).toEqual({ value: "—", unit: "" });
  });

  it("formats voltage and durations", () => {
    expect(formatVoltage(240.4, "en-US")).toBe("240 V");
    expect(formatVoltage(12.34, "en-US")).toBe("12.3 V");
    expect(formatDuration(42_000)).toBe("42s");
    expect(formatDuration(125_000)).toBe("2m 05s");
    expect(formatDuration(3_900_000)).toBe("1h 05m");
    expect(formatDuration(90_000_000)).toBe("1d 1h");
  });
});

import { describe, expect, it } from "vitest";
import { computeSnapshot, historyEntityIds, inferAts, readPower } from "../src/model";
import type { CardConfig } from "../src/types";
import { KW, W, states } from "./helpers";

const base: CardConfig = {
  type: "custom:energy-monitor-card",
  grid: { entity: "sensor.grid", status: "binary_sensor.utility", voltage: "sensor.grid_v" },
  generator: { entity: "sensor.gen", running: "sensor.gen_status", voltage: "sensor.gen_v", rated_power: 20000 },
};

describe("unit handling", () => {
  it("converts power units to watts, respecting mW vs MW", () => {
    const get = states({
      "sensor.a": [1.5, KW],
      "sensor.b": [800, W],
      "sensor.c": [2500, { unit_of_measurement: "mW" }],
      "sensor.d": [0.002, { unit_of_measurement: "MW" }],
    });
    expect(readPower(get, "sensor.a")).toBe(1500);
    expect(readPower(get, "sensor.b")).toBe(800);
    expect(readPower(get, "sensor.c")).toBeCloseTo(2.5);
    expect(readPower(get, "sensor.d")).toBe(2000);
  });

  it("treats unavailable, unknown and non-numeric states as missing", () => {
    const get = states({ "sensor.a": "unavailable", "sensor.b": "unknown", "sensor.c": "abc" });
    expect(readPower(get, "sensor.a")).toBeNull();
    expect(readPower(get, "sensor.b")).toBeNull();
    expect(readPower(get, "sensor.c")).toBeNull();
    expect(readPower(get, "sensor.missing")).toBeNull();
  });
});

it("requests only source and load sensors for trend history", () => {
  const cfg: CardConfig = {
    ...base,
    home: { entity: "sensor.home", current: "sensor.home_current" },
    devices: [{ entity: "sensor.ev", current: "sensor.ev_current", switch_entity: "switch.ev" }],
  };
  expect(historyEntityIds(cfg)).toEqual([
    "sensor.grid", "sensor.grid_v", "binary_sensor.utility",
    "sensor.gen", "sensor.gen_v", "sensor.gen_status", "sensor.home",
  ]);
});

describe("utility availability", () => {
  it("prefers the status entity over voltage", () => {
    const snap = computeSnapshot(base, states({ "binary_sensor.utility": "off", "sensor.grid_v": 240, "sensor.grid": [0, W] }));
    expect(snap.grid?.available).toBe(false);
  });

  it("falls back to voltage against outage_voltage", () => {
    const cfg: CardConfig = { ...base, grid: { entity: "sensor.grid", voltage: "sensor.grid_v", outage_voltage: 100 } };
    expect(computeSnapshot(cfg, states({ "sensor.grid_v": 60 })).grid?.available).toBe(false);
    expect(computeSnapshot(cfg, states({ "sensor.grid_v": 121 })).grid?.available).toBe(true);
  });

  it("infers availability from power flow when nothing else is known", () => {
    const cfg: CardConfig = { type: "x", grid: { entity: "sensor.grid" } };
    expect(computeSnapshot(cfg, states({ "sensor.grid": [1200, W] })).grid?.available).toBe(true);
    expect(computeSnapshot(cfg, states({ "sensor.grid": [0, W] })).grid?.available).toBeNull();
  });

  it("supports separate import/export entities and invert", () => {
    const cfg: CardConfig = { type: "x", grid: { import_entity: "sensor.imp", export_entity: "sensor.exp" } };
    expect(computeSnapshot(cfg, states({ "sensor.imp": [0, W], "sensor.exp": [900, W] })).grid?.power).toBe(-900);
    const inverted: CardConfig = { type: "x", grid: { entity: "sensor.g", invert: true } };
    expect(computeSnapshot(inverted, states({ "sensor.g": [500, W] })).grid?.power).toBe(-500);
  });

  it("does not count a stale utility meter reading during an outage", () => {
    const cfg: CardConfig = { type: "x", grid: { entity: "sensor.grid", status: "binary_sensor.utility" } };
    const snap = computeSnapshot(cfg, states({ "binary_sensor.utility": "off", "sensor.grid": [3000, W] }));
    expect(snap.grid?.power).toBe(3000);
    expect(snap.flows.grid).toBe(0);
    expect(snap.supply.grid).toBe(0);
    expect(snap.home.power).toBe(0);
  });
});

describe("transfer switch", () => {
  const grid = { power: 0, voltage: 0, current: null, currentEstimated: false, legs: [], frequency: null };

  it("treats a loaded generator as transferred", () => {
    expect(inferAts({ ...grid, available: false }, { power: 5000, running: true, starting: false }, 20)).toBe("generator");
  });

  it("keeps a cranking generator on the utility side", () => {
    expect(inferAts({ ...grid, available: false }, { power: 0, running: true, starting: true }, 20)).toBe("utility");
  });

  it("assumes transfer when the grid is down and a generator without a power sensor runs", () => {
    expect(inferAts({ ...grid, available: false }, { power: null, running: true, starting: false }, 20)).toBe("generator");
    expect(inferAts({ ...grid, available: true }, { power: null, running: true, starting: false }, 20)).toBe("utility");
  });

  it("maps explicit ATS states, case-insensitively", () => {
    const cfg: CardConfig = { ...base, transfer_switch: { entity: "sensor.ats" } };
    expect(computeSnapshot(cfg, states({ "sensor.ats": "Emergency" })).ats).toBe("generator");
    expect(computeSnapshot(cfg, states({ "sensor.ats": "Normal" })).ats).toBe("utility");
    expect(computeSnapshot(cfg, states({ "sensor.ats": "neutral" })).ats).toBe("open");
    const custom: CardConfig = { ...base, transfer_switch: { entity: "sensor.ats", generator_states: ["source_b"] } };
    expect(computeSnapshot(custom, states({ "sensor.ats": "SOURCE_B" })).ats).toBe("generator");
  });

  it("recognises Generac-style status text", () => {
    const snap = computeSnapshot(base, states({ "sensor.gen_status": "Cranking" }));
    expect(snap.generator?.running).toBe(true);
    expect(snap.generator?.starting).toBe(true);
    expect(computeSnapshot(base, states({ "sensor.gen_status": "Ready" })).generator?.running).toBe(false);
  });
});

describe("power accounting", () => {
  it("computes home load from utility, solar and battery", () => {
    const cfg: CardConfig = {
      ...base,
      solar: { entity: "sensor.solar" },
      battery: { entity: "sensor.batt", soc: "sensor.soc" },
    };
    const snap = computeSnapshot(
      cfg,
      states({
        "binary_sensor.utility": "on",
        "sensor.grid": [3000, W],
        "sensor.solar": [2000, W],
        "sensor.batt": [-1000, W],
        "sensor.gen_status": "Ready",
      }),
    );
    expect(snap.ats).toBe("utility");
    expect(snap.home.power).toBe(4000);
    expect(snap.supply).toEqual({ grid: 3000, generator: 0, solar: 2000, battery: 0 });
    expect(snap.flows.battery).toBe(-1000);
  });

  it("ignores a panel-side mains reading while on generator (no double counting)", () => {
    const snap = computeSnapshot(
      base,
      states({
        "binary_sensor.utility": "off",
        "sensor.grid": [6000, W], // meter after the ATS still sees the load
        "sensor.gen": [6.0, KW],
        "sensor.gen_status": "Running",
      }),
    );
    expect(snap.ats).toBe("generator");
    expect(snap.home.power).toBe(6000);
    expect(snap.flows.grid).toBe(0);
    expect(snap.flows.feed).toBe(6000);
    expect(snap.generator?.loadPct).toBeCloseTo(30);
  });

  it("derives generator output from the home sensor when the generator has no power sensor", () => {
    const cfg: CardConfig = {
      type: "x",
      grid: { entity: "sensor.grid", status: "binary_sensor.utility" },
      generator: { running: "binary_sensor.gen" },
      home: { entity: "sensor.home" },
      solar: { entity: "sensor.solar" },
    };
    const snap = computeSnapshot(
      cfg,
      states({ "binary_sensor.utility": "off", "binary_sensor.gen": "on", "sensor.home": [5000, W], "sensor.solar": [1000, W] }),
    );
    expect(snap.ats).toBe("generator");
    expect(snap.generator?.supplying).toBe(4000);
  });

  it("does not credit an exercising generator with the home load", () => {
    const snap = computeSnapshot(
      base,
      states({ "binary_sensor.utility": "on", "sensor.grid": [2500, W], "sensor.gen": [0, W], "sensor.gen_status": "Exercising" }),
    );
    expect(snap.ats).toBe("utility");
    expect(snap.generator?.running).toBe(true);
    expect(snap.generator?.supplying).toBe(0);
    expect(snap.home.power).toBe(2500);
  });

  it("marks estimated current and uses the active source voltage", () => {
    const snap = computeSnapshot(
      base,
      states({ "binary_sensor.utility": "on", "sensor.grid": [4800, W], "sensor.grid_v": 240, "sensor.gen_status": "Ready" }),
    );
    expect(snap.grid?.current).toBeCloseTo(20);
    expect(snap.grid?.currentEstimated).toBe(true);
    expect(snap.home.current).toBeCloseTo(20);
    expect(snap.home.currentEstimated).toBe(true);
  });

  it("reports device activity, share, heavy load and the unmeasured remainder", () => {
    const cfg: CardConfig = {
      type: "x",
      home: { entity: "sensor.home" },
      show_other: true,
      devices: [
        { entity: "sensor.ev", high_load: 5000 },
        { entity: "sensor.dryer", threshold: 50 },
        { entity: "sensor.gone" },
      ],
    };
    const snap = computeSnapshot(cfg, states({ "sensor.home": [10000, W], "sensor.ev": [7000, W], "sensor.dryer": [30, W] }));
    const [ev, dryer, gone] = snap.devices;
    expect(ev).toMatchObject({ active: true, high: true, share: 0.7 });
    expect(dryer).toMatchObject({ active: false, share: 0 });
    expect(gone.missing).toBe(true);
    expect(snap.other).toBe(10000 - 7030);
    expect(snap.missing).toEqual(["sensor.gone"]);
  });
});

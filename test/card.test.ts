// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import {
  $,
  $$,
  FakeResizeObserver,
  HOUR_AGO,
  T0,
  W,
  hassFactory,
  mount,
  push,
  settle,
  text,
  useCardEnvironment,
  type StateSpec,
} from "./dom";
import { EnergyMonitorCard, normalizeConfig } from "../src/energy-monitor-card";
import { configForm } from "../src/editor";
import type { CardConfig } from "../src/types";

useCardEnvironment();

const CFG: CardConfig = {
  type: "custom:energy-monitor-card",
  grid: { entity: "sensor.grid_power", status: "binary_sensor.utility", voltage: "sensor.grid_voltage" },
  generator: { entity: "sensor.generator_power", running: "sensor.generator_status", rated_power: 20000 },
  transfer_switch: { entity: "sensor.transfer_switch" },
};

const BATTERY_CFG: CardConfig = { ...CFG, battery: { entity: "sensor.battery_power", soc: "sensor.battery_soc" } };

interface Scene {
  utility?: "on" | "off";
  grid?: number;
  gen?: number;
  status?: string;
  ats?: string;
  battery?: number;
}

function scene(s: Scene = {}): Record<string, StateSpec> {
  const up = (s.utility ?? "on") === "on";
  return {
    "binary_sensor.utility": s.utility ?? "on",
    "sensor.grid_power": [s.grid ?? (up ? 3000 : 0), W],
    "sensor.grid_voltage": [up ? 240 : 0, { unit_of_measurement: "V" }],
    "sensor.generator_power": [s.gen ?? 0, W],
    "sensor.generator_status": s.status ?? "Ready",
    "sensor.transfer_switch": s.ats ?? "utility",
    ...(s.battery !== undefined
      ? { "sensor.battery_power": [s.battery, W], "sensor.battery_soc": [80, { unit_of_measurement: "%" }] }
      : {}),
  };
}

const UTILITY = scene();
const OUTAGE = scene({ utility: "off" });
const STARTING = scene({ utility: "off", status: "Cranking" });
const ON_GENERATOR = scene({ utility: "off", gen: 4200, status: "Running", ats: "generator" });
const RESTORED = scene({ utility: "on", grid: 0, gen: 4200, status: "Running", ats: "generator" });
const COOLDOWN = scene({ status: "Running" });
const EXERCISE = scene({ status: "Exercising" });

/** Status pill label (without its running duration) and duration text. */
function pill(card: EnergyMonitorCard) {
  const el = $(card, ".pill");
  if (!el) return null;
  const copy = el.cloneNode(true) as Element;
  const dur = copy.querySelector(".dur");
  dur?.remove();
  return { label: text(copy), dur: dur ? text(dur) : null, cls: el.getAttribute("class") ?? "" };
}

function labelByName(card: EnergyMonitorCard, name: string): Element | undefined {
  return $$(card, ".overlay .label").find((l) => text(l.querySelector(".name")).startsWith(name));
}

const homeValue = (card: EnergyMonitorCard) => text($(card, "text.home-value"));

function bladeAngle(card: EnergyMonitorCard): number {
  const style = $(card, "g.ats g.blade")?.getAttribute("style") ?? "";
  const m = /rotate\((-?[\d.e-]+)deg\)/.exec(style);
  if (!m) throw new Error(`no rotation in "${style}"`);
  return Number(m[1]);
}

const flowIds = (card: EnergyMonitorCard) =>
  $$(card, "g.particles g[data-flow]")
    .map((g) => g.getAttribute("data-flow"))
    .sort();

// ── Card API ─────────────────────────────────────────────────

describe("setConfig", () => {
  it("rejects a missing or non-object config", () => {
    const card = document.createElement("energy-monitor-card");
    expect(() => card.setConfig(undefined as unknown as CardConfig)).toThrow(/Invalid configuration/);
    expect(() => card.setConfig(null as unknown as CardConfig)).toThrow(/Invalid configuration/);
    expect(() => card.setConfig("grid" as unknown as CardConfig)).toThrow(/Invalid configuration/);
  });

  it("requires at least one section with an entity", () => {
    const card = document.createElement("energy-monitor-card");
    expect(() => card.setConfig({ type: "custom:energy-monitor-card" })).toThrow(/Add at least one of/);
    expect(() => card.setConfig({} as CardConfig)).toThrow(/Add at least one of/);
    // Half-filled sections from the visual editor don't count.
    expect(() =>
      card.setConfig({ type: "x", grid: { name: "Utility" }, generator: {}, solar: { entity: "" }, home: {} }),
    ).toThrow(/Add at least one of/);
  });

  it("rejects devices that are not a list", () => {
    const card = document.createElement("energy-monitor-card");
    const bad = { ...CFG, devices: { entity: "sensor.ev" } } as unknown as CardConfig;
    expect(() => card.setConfig(bad)).toThrow("`devices` must be a list");
  });

  it("accepts a single section", () => {
    const card = document.createElement("energy-monitor-card");
    expect(() => card.setConfig({ type: "x", home: { entity: "sensor.home" } })).not.toThrow();
    expect(() => card.setConfig({ type: "x", generator: { running: "binary_sensor.gen" } })).not.toThrow();
  });

  it("drops sections and devices without entities", () => {
    const input: CardConfig = {
      type: "x",
      title: "Power",
      grid: { name: "Mains", current_legs: [] },
      generator: { entity: "sensor.gen" },
      transfer_switch: {},
      home: { name: "House" },
      solar: { entity: "" },
      battery: { soc: "sensor.soc" },
      devices: [{ entity: "" }, { entity: "sensor.ev" }, null as unknown as { entity: string }],
    };
    const out = normalizeConfig(input);
    expect(Object.keys(out).sort()).toEqual(["battery", "devices", "generator", "title", "type"]);
    expect(out.devices).toEqual([{ entity: "sensor.ev" }]);
    expect(out.generator).toBe(input.generator);
    // The caller's object is left alone (HA freezes it).
    expect(input.grid).toEqual({ name: "Mains", current_legs: [] });
    expect(input.devices).toHaveLength(3);
  });

  it("does not render a section that has no entity yet", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, generator: { name: "Genny" }, transfer_switch: { entity: "" } }, f.make(UTILITY));
    expect($(card, "g.node.grid")).not.toBeNull();
    expect($(card, "g.node.generator")).toBeNull();
    expect($(card, "g.ats")).toBeNull();
    expect(labelByName(card, "Genny")).toBeUndefined();
  });
});

describe("getGridOptions / getCardSize", () => {
  const sized = (cfg: Partial<CardConfig>) => {
    const card = document.createElement("energy-monitor-card");
    card.setConfig({ type: "x", grid: { entity: "sensor.grid" }, ...cfg });
    return card;
  };

  it("adds a row for devices and one for the trend strip", () => {
    expect(sized({}).getGridOptions()).toEqual({ columns: 12, rows: 5, min_columns: 6, min_rows: 3 });
    expect(sized({ devices: [{ entity: "sensor.ev" }] }).getGridOptions()).toEqual({
      columns: 12,
      rows: 6,
      min_columns: 6,
      min_rows: 4,
    });
    expect(sized({ show_other: true }).getGridOptions().rows).toBe(6);
    expect(sized({ trend_window: 0 }).getGridOptions()).toEqual({ columns: 12, rows: 4, min_columns: 6, min_rows: 3 });
    expect(sized({ trend_window: 0, devices: [{ entity: "sensor.ev" }] }).getGridOptions().rows).toBe(5);
  });

  it("reports a masonry card size that grows the same way", () => {
    expect(sized({}).getCardSize()).toBe(7);
    expect(sized({ trend_window: 0 }).getCardSize()).toBe(5);
    expect(sized({ devices: [{ entity: "sensor.ev" }] }).getCardSize()).toBe(8);
  });
});

describe("getStubConfig", () => {
  it("discovers utility and generator entities by device class and id", () => {
    const f = hassFactory();
    const hass = f.make({
      "sensor.grid_energy": [12, { device_class: "energy", unit_of_measurement: "kWh" }],
      "sensor.mains_power": [900, W],
      "sensor.utility_voltage": [240, { device_class: "voltage", unit_of_measurement: "V" }],
      "sensor.generator_power": [0, W],
      "binary_sensor.generator_running": "off",
      "sensor.dryer_power": [0, W],
    });
    expect(EnergyMonitorCard.getStubConfig(hass)).toEqual({
      type: "custom:energy-monitor-card",
      grid: { entity: "sensor.mains_power", voltage: "sensor.utility_voltage" },
      generator: { entity: "sensor.generator_power", running: "binary_sensor.generator_running" },
    });
  });

  it("falls back to a generator status sensor for the running entity", () => {
    const f = hassFactory();
    const stub = EnergyMonitorCard.getStubConfig(
      f.make({ "sensor.grid_power": [1, W], "sensor.generator_status": "Ready", "sensor.genset_power": [0, W] }),
    );
    expect(stub.generator).toEqual({ entity: "sensor.genset_power", running: "sensor.generator_status" });
  });

  it("uses placeholders when nothing matches and still yields a valid config", () => {
    const stub = EnergyMonitorCard.getStubConfig();
    expect(stub).toEqual({
      type: "custom:energy-monitor-card",
      grid: { entity: "sensor.grid_power" },
      generator: { entity: "sensor.generator_power" },
    });
    expect("voltage" in stub.grid!).toBe(false);
    expect("running" in stub.generator!).toBe(false);
    const card = document.createElement("energy-monitor-card");
    expect(() => card.setConfig(stub)).not.toThrow();
  });
});

describe("registration", () => {
  it("defines the element and lists itself in the card picker", () => {
    expect(customElements.get("energy-monitor-card")).toBe(EnergyMonitorCard);
    const entries = (window.customCards ?? []).filter((c) => c.type === "energy-monitor-card");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ name: "Energy Monitor Card", preview: true });
  });

  it("exposes the visual editor schema", () => {
    const form = EnergyMonitorCard.getConfigForm();
    expect(form.schema.map((s) => s.name)).toEqual(configForm().schema.map((s) => s.name));
    expect(typeof form.computeLabel).toBe("function");
  });
});

// ── Rendering ────────────────────────────────────────────────

describe("layout", () => {
  it("waits for a measured stage before drawing, then follows resizes", async () => {
    FakeResizeObserver.size = { width: 0, height: 0 };
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    expect($(card, ".stage")).not.toBeNull();
    expect($(card, "svg.diagram")).toBeNull();
    // The header still reports the phase before layout.
    expect(pill(card)?.label).toBe("Utility power");

    FakeResizeObserver.resize(460, 278);
    await settle(card);
    expect($(card, "svg.diagram")?.getAttribute("width")).toBe("460");

    FakeResizeObserver.resize(320, 194);
    await settle(card);
    expect($(card, "svg.diagram")?.getAttribute("viewBox")).toBe("0 0 320 194");
  });

  it("renders only the configured sources", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    expect($$(card, "g.node").map((g) => g.classList[1])).toEqual(["grid", "generator", "home"]);
    expect($(card, "g.ats")).not.toBeNull();

    const solo = await mount({ type: "x", grid: { entity: "sensor.grid_power" } }, f.make(UTILITY));
    expect($$(solo, "g.node").map((g) => g.classList[1])).toEqual(["grid", "home"]);
    expect($(solo, "g.ats")).toBeNull();
  });

  it("works when hass arrives before the config", async () => {
    const f = hassFactory();
    const card = document.createElement("energy-monitor-card");
    card.hass = f.make(UTILITY);
    card.setConfig(CFG);
    document.body.appendChild(card);
    await settle(card);
    expect(pill(card)?.label).toBe("Utility power");
    expect(homeValue(card)).toBe("3.0kW");
  });

  it("shows the title and hides the background on request", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, title: "Backup power", hide_background: true }, f.make(UTILITY));
    expect(text($(card, ".header .title"))).toBe("Backup power");
    expect($(card, "ha-card")?.classList.contains("transparent")).toBe(true);
  });
});

describe("status by phase", () => {
  const cases: [string, CardConfig, Record<string, StateSpec>, string, string][] = [
    ["utility", CFG, UTILITY, "Utility power", "tone-grid"],
    ["outage", CFG, OUTAGE, "Power outage", "tone-outage"],
    ["outage with battery", BATTERY_CFG, scene({ utility: "off", battery: 2500 }), "Outage · on battery", "tone-battery"],
    ["starting", CFG, STARTING, "Generator starting", "tone-generator"],
    ["generator", CFG, ON_GENERATOR, "On generator", "tone-generator"],
    ["restored", CFG, RESTORED, "Utility restored", "tone-grid"],
    ["exercise", CFG, EXERCISE, "Generator exercise", "tone-generator"],
  ];

  it.each(cases)("%s", async (name, cfg, states, label, tone) => {
    const f = hassFactory();
    const card = await mount(cfg, f.make(states));
    const p = pill(card)!;
    expect(p.label).toBe(label);
    expect(p.cls).toContain(tone);
    // Outage and cranking pulse to draw the eye.
    expect(p.cls.includes("alert")).toBe(name.startsWith("outage") || name === "starting");
    expect($(card, ".pill")?.getAttribute("role")).toBe("status");
  });

  it("cooldown: a generator still running after retransfer", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(ON_GENERATOR));
    vi.advanceTimersByTime(60_000);
    await push(card, f.make(COOLDOWN));
    expect(pill(card)).toMatchObject({ label: "Generator cooldown", dur: "0s" });
    expect(pill(card)!.cls).toContain("tone-grid");
  });

  it("standby: generator-only install with the generator stopped", async () => {
    const f = hassFactory();
    const cfg: CardConfig = { type: "x", generator: { entity: "sensor.generator_power", running: "sensor.generator_status" } };
    const card = await mount(cfg, f.make(UTILITY));
    expect(pill(card)).toMatchObject({ label: "Generator standby", dur: null });
    expect(pill(card)!.cls).toContain("tone-neutral");
  });

  it("times an outage already in progress from the status entity's last change", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(OUTAGE, HOUR_AGO));
    expect(pill(card)).toMatchObject({ label: "Power outage", dur: "1h 00m" });
    expect(pill(card)?.dur).not.toBeNull();
    // Utility shows no timer at all.
    const ok = await mount(CFG, f.make(UTILITY));
    expect(pill(ok)?.dur).toBeNull();
  });

  it("ticks the phase timer every second", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    await push(card, f.make(OUTAGE));
    expect(pill(card)?.dur).toBe("0s");
    vi.advanceTimersByTime(3000);
    await settle(card);
    expect(pill(card)?.dur).toBe("3s");
  });

  it("goes dark with no source supplying the home", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(OUTAGE));
    expect(homeValue(card)).toBe("No power");
    expect($(card, "g.node.home")?.classList.contains("dark")).toBe(true);
    expect($(card, "g.node.grid")?.classList.contains("down")).toBe(true);
    expect($(card, "g.fault")).not.toBeNull();
  });

  it("stays lit on battery during an outage", async () => {
    const f = hassFactory();
    const card = await mount(BATTERY_CFG, f.make(scene({ utility: "off", battery: 2500 })));
    expect(homeValue(card)).toBe("2.5kW");
    expect($(card, "g.node.home")?.classList.contains("dark")).toBe(false);
    expect(text(labelByName(card, "Battery")?.querySelector(".detail"))).toBe("Discharging 2.5 kW");
  });

  it("labels the utility by availability and transfer position", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    const grid = () => labelByName(card, "Utility")!;
    const detail = () => [...grid().querySelectorAll(".detail span")].map(text);
    expect(text(grid().querySelector(".value"))).toBe("3.0kW");
    expect(detail()).toEqual(["240 V", "≈12.5 A"]);

    await push(card, f.make(OUTAGE));
    expect(grid().querySelector(".value")?.classList.contains("alarm")).toBe(true);
    expect(text(grid().querySelector(".value"))).toBe("Outage");
    // Amps are meaningless on a dead line.
    expect(detail()).toEqual(["0 V"]);

    await push(card, f.make(RESTORED));
    expect(text(grid().querySelector(".value"))).toBe("Available");
  });

  it("shows generator output, load and status", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    const gen = () => labelByName(card, "Generator")!;
    expect(text(gen().querySelector(".value"))).toBe("Standby");
    await push(card, f.make(STARTING));
    expect(text(gen().querySelector(".value"))).toBe("Starting…");
    await push(card, f.make(ON_GENERATOR));
    expect(text(gen().querySelector(".value"))).toBe("4.2kW21% load");
    expect($(card, "g.node.generator circle.gauge")).not.toBeNull();
  });

  it("lists entities that are not found", async () => {
    const f = hassFactory();
    const cfg: CardConfig = { ...CFG, home: { entity: "sensor.nope" }, devices: [{ entity: "sensor.gone" }] };
    const card = await mount(cfg, f.make(UTILITY));
    const warn = $(card, ".warn");
    expect(text(warn)).toBe("⚠ Entity not found: sensor.nope, sensor.gone");
    expect(warn?.getAttribute("title")).toBe("sensor.nope, sensor.gone");
    expect(text($(card, ".device .dev-value"))).toBe("⚠");

    const ok = await mount(CFG, f.make(UTILITY));
    expect($(ok, ".warn")).toBeNull();
  });

  it("names devices from their friendly names", async () => {
    const f = hassFactory();
    const cfg: CardConfig = {
      ...CFG,
      home: { entity: "sensor.home_power" },
      show_other: true,
      devices: [{ entity: "sensor.ev_power", high_load: 5000 }, { entity: "sensor.dryer_power", name: "Dryer" }],
    };
    const card = await mount(
      cfg,
      f.make({
        ...UTILITY,
        "sensor.home_power": [10000, W],
        "sensor.ev_power": [7200, { ...W, friendly_name: "EV charger power" }],
        "sensor.dryer_power": [0, W],
      }),
    );
    const devices = $$(card, ".device");
    expect(devices.map((d) => text(d.querySelector(".dev-name")))).toEqual(["EV charger", "Dryer", "Other"]);
    expect(devices[0].classList.contains("high")).toBe(true);
    expect(devices[0].getAttribute("title")).toBe("EV charger: 7.2 kW · 72% of home");
    expect(devices[1].classList.contains("active")).toBe(false);
    expect(text(devices[2].querySelector(".dev-value"))).toBe("2.8kW");
  });
});

// ── Transitions ──────────────────────────────────────────────

describe("transitions", () => {
  it("shows no banner for the state found on first render", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(OUTAGE));
    expect(pill(card)?.label).toBe("Power outage");
    expect($(card, ".banner")).toBeNull();
  });

  it("announces a live loss of utility power, then clears the banner", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    await push(card, f.make(OUTAGE));
    const banner = $(card, ".banner");
    expect(text(banner?.querySelector(".what"))).toBe("Utility power lost");
    expect(banner?.classList.contains("tone-outage")).toBe(true);
    expect(text(banner?.querySelector(".when"))).toMatch(/\d{1,2}:\d{2}/);

    vi.advanceTimersByTime(9000);
    await settle(card);
    expect($(card, ".banner")).toBeNull();
  });

  it("walks the whole outage cycle", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    const steps: [Record<string, StateSpec>, string, string][] = [
      [OUTAGE, "Power outage", "Utility power lost"],
      [STARTING, "Generator starting", "Generator starting"],
      [ON_GENERATOR, "On generator", "Transferred to generator"],
      [RESTORED, "Utility restored", "Utility restored, retransfer pending"],
      [COOLDOWN, "Generator cooldown", "Back on utility, generator cooling down"],
    ];
    for (const [states, label, banner] of steps) {
      vi.advanceTimersByTime(5000);
      await push(card, f.make(states));
      expect(pill(card)?.label).toBe(label);
      expect(text($(card, ".banner .what"))).toBe(banner);
    }
    // The cooldown banner times out, and the generator stopping afterwards is not announced.
    vi.advanceTimersByTime(10_000);
    await settle(card);
    expect($(card, ".banner")).toBeNull();
    await push(card, f.make(UTILITY));
    expect(pill(card)?.label).toBe("Utility power");
    expect($(card, ".banner")).toBeNull();
  });

  it("swings the transfer-switch blade toward the connected source", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    const onUtility = bladeAngle(card);
    expect(onUtility).toBeGreaterThan(0);
    expect($(card, "g.ats")?.getAttribute("aria-label")).toBe("Transfer switch: utility");

    await push(card, f.make(ON_GENERATOR));
    expect(bladeAngle(card)).toBeCloseTo(-onUtility, 6);
    expect($(card, "g.ats")?.getAttribute("aria-label")).toBe("Transfer switch: generator");

    await push(card, f.make(scene({ utility: "off", ats: "neutral" })));
    expect(bladeAngle(card)).toBe(0);
  });

  it("sparks at the contact only after a cut-over", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    expect($(card, "circle.spark")).toBeNull();
    await push(card, f.make(OUTAGE));
    expect($(card, "circle.spark")).toBeNull();

    await push(card, f.make(ON_GENERATOR));
    const spark = $(card, "circle.spark");
    expect(spark).not.toBeNull();
    const genContact = $$(card, "g.ats circle.contact")[1];
    expect(spark?.getAttribute("cx")).toBe(genContact.getAttribute("cx"));
    expect(spark?.getAttribute("cy")).toBe(genContact.getAttribute("cy"));
    expect(genContact.classList.contains("on")).toBe(true);
  });

  it("does not spark when the first reading is already on generator", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(ON_GENERATOR));
    expect($(card, "circle.spark")).toBeNull();
  });

  it("switches the animated feed from utility to generator colour", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    expect(flowIds(card)).toEqual(["feed", "grid"]);
    const feedFill = () => [...new Set($$(card, 'g[data-flow="feed"] circle').map((c) => c.getAttribute("fill")))];
    expect(feedFill()).toEqual(["#4c9aff"]);

    await push(card, f.make(ON_GENERATOR));
    expect(flowIds(card)).toEqual(["feed", "generator"]);
    expect(feedFill()).toEqual(["#ff8a1f"]);
  });

  it("honours custom colours and animation: false", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, colors: { generator: "#00ff00" } }, f.make(ON_GENERATOR));
    const fills = new Set($$(card, 'g[data-flow="generator"] circle').map((c) => c.getAttribute("fill")));
    expect([...fills]).toEqual(["#00ff00"]);
    expect($(card, "ha-card")?.getAttribute("style")).toContain("--emc-generator:#00ff00");

    const still = await mount({ ...CFG, animation: false }, f.make(ON_GENERATOR));
    expect($(still, "g.particles")).not.toBeNull();
    expect(flowIds(still)).toEqual([]);
  });
});

// ── Refresh throttling ───────────────────────────────────────

describe("update_interval", () => {
  it("holds numeric readouts until the interval elapses", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, update_interval: 2 }, f.make(scene({ grid: 3000 })));
    expect(homeValue(card)).toBe("3.0kW");

    vi.advanceTimersByTime(500);
    await push(card, f.make(scene({ grid: 3600 })));
    expect(homeValue(card)).toBe("3.0kW");

    vi.advanceTimersByTime(1000);
    await push(card, f.make(scene({ grid: 3700 })));
    expect(homeValue(card)).toBe("3.0kW");

    // The refresh timer picks up the latest state at the 2 s mark.
    vi.advanceTimersByTime(500);
    await settle(card);
    expect(homeValue(card)).toBe("3.7kW");
  });

  it("applies a pushed state once the interval has passed, even if the timer lags", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, update_interval: 30 }, f.make(scene({ grid: 3000 })));
    vi.advanceTimersByTime(10_000);
    await push(card, f.make(scene({ grid: 1200 })));
    expect(homeValue(card)).toBe("3.0kW");
    // Background tabs throttle timers; the clock moves on without the refresh firing.
    vi.setSystemTime(T0 + 31_000);
    await push(card, f.make(scene({ grid: 1500 })));
    expect(homeValue(card)).toBe("1.5kW");
  });

  it("renders a change of phase immediately", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, update_interval: 60 }, f.make(UTILITY));
    vi.advanceTimersByTime(300);
    await push(card, f.make(OUTAGE));
    expect(pill(card)?.label).toBe("Power outage");
    expect(homeValue(card)).toBe("No power");
    expect(text($(card, ".banner .what"))).toBe("Utility power lost");
  });

  it("renders every change when set to 0 (live)", async () => {
    const f = hassFactory();
    const card = await mount({ ...CFG, update_interval: 0 }, f.make(scene({ grid: 3000 })));
    await push(card, f.make(scene({ grid: 3100 })));
    expect(homeValue(card)).toBe("3.1kW");
    await push(card, f.make(scene({ grid: 850 })));
    expect(homeValue(card)).toBe("850W");
    expect(text($(card, ".trend-head"))).toContain("live");
  });
});

// ── Persistence and lifecycle ────────────────────────────────

describe("persistence", () => {
  it("remembers a cooldown across a reload instead of calling it an exercise", async () => {
    const f = hassFactory();
    const first = await mount(CFG, f.make(ON_GENERATOR));
    vi.advanceTimersByTime(60_000);
    await push(first, f.make(COOLDOWN));
    expect(pill(first)?.label).toBe("Generator cooldown");
    first.remove();

    vi.advanceTimersByTime(30_000);
    const reloaded = await mount(CFG, f.make(COOLDOWN));
    expect(pill(reloaded)).toMatchObject({ label: "Generator cooldown", dur: "30s" });

    // Without the saved state the same readings look like a scheduled exercise.
    localStorage.clear();
    const fresh = await mount(CFG, f.make(COOLDOWN));
    expect(pill(fresh)?.label).toBe("Generator exercise");
  });

  it("still renders when storage throws", async () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    vi.stubGlobal("localStorage", throwing);
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    await push(card, f.make(OUTAGE));
    expect(pill(card)?.label).toBe("Power outage");
  });
});

describe("lifecycle", () => {
  it("stops every timer and animation frame when removed", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    await push(card, f.make(OUTAGE)); // arms the banner timeout too
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    card.remove();
    expect(vi.getTimerCount()).toBe(0);
    expect(flowIds(card)).toEqual([]);
  });

  it("restarts the particle engine after a view switch", async () => {
    const f = hassFactory();
    const card = await mount(CFG, f.make(UTILITY));
    expect(flowIds(card)).toEqual(["feed", "grid"]);
    card.remove();
    expect(flowIds(card)).toEqual([]);
    document.body.appendChild(card);
    await settle(card);
    expect(flowIds(card)).toEqual(["feed", "grid"]);
  });
});

import type {
  AtsPosition,
  BatteryConfig,
  CardConfig,
  DeviceConfig,
  GeneratorConfig,
  GridConfig,
  HassEntity,
  SourceKey,
  StateGetter,
  TransferSwitchConfig,
} from "./types";
import type { PhaseInputs } from "./phase";

const INVALID_STATES = new Set(["unavailable", "unknown", "none", "", "nan"]);

export const DEFAULT_OUTAGE_VOLTAGE = 80;
export const DEFAULT_SOURCE_THRESHOLD = 20;
export const DEFAULT_DEVICE_THRESHOLD = 10;

const GRID_ON = ["on", "true", "1", "yes", "online", "connected", "available", "normal", "ok", "present", "utility", "grid"];
const GRID_OFF = ["off", "false", "0", "no", "offline", "disconnected", "outage", "lost", "fault", "failed", "failure"];
const GEN_RUNNING = [
  "on", "true", "1", "yes", "running", "run", "exercising", "exercise", "loaded",
  "cranking", "starting", "warming up", "warming", "cooling down", "cooldown",
];
const GEN_STARTING = ["cranking", "starting", "start", "warming up", "warming", "priming"];
const GEN_OFF = ["off", "false", "0", "no", "ready", "standby", "stopped", "idle", "auto", "off/ready"];
const ATS_GENERATOR = ["generator", "gen", "emergency", "backup", "standby", "on", "true", "1"];
const ATS_UTILITY = ["utility", "normal", "grid", "mains", "off", "false", "0"];
const ATS_OPEN = ["open", "neutral", "center", "centre", "none"];

const norm = (s: string) => s.trim().toLowerCase().replace(/_/g, " ");
const normList = (list: string[] | undefined, fallback: string[]) => (list?.length ? list : fallback).map(norm);

function valid(e: HassEntity | undefined): e is HassEntity {
  return !!e && !INVALID_STATES.has(norm(e.state));
}

export function readNumber(get: StateGetter, id: string | undefined): number | null {
  if (!id) return null;
  const e = get(id);
  if (!valid(e)) return null;
  const n = Number(e.state);
  return Number.isFinite(n) ? n : null;
}

function unitOf(e: HassEntity | undefined): string {
  return String(e?.attributes?.unit_of_measurement ?? "").trim();
}

/** Multiplier from an entity's unit to watts. Case matters: mW is milliwatt, MW is megawatt. */
export function powerScale(unit: string): number {
  switch (unit) {
    case "mW":
      return 1e-3;
    case "MW":
    case "MVA":
      return 1e6;
    case "GW":
      return 1e9;
  }
  const u = unit.toLowerCase();
  if (u === "kw" || u === "kva") return 1e3;
  return 1;
}

function scaled(get: StateGetter, id: string | undefined, scale: (unit: string) => number): number | null {
  const n = readNumber(get, id);
  if (n === null || !id) return null;
  return n * scale(unitOf(get(id)));
}

export const readPower = (get: StateGetter, id?: string) => scaled(get, id, powerScale);

const milliKilo = (unit: string) => {
  if (unit.startsWith("m")) return 1e-3;
  if (unit.startsWith("k")) return 1e3;
  return 1;
};
export const readCurrent = (get: StateGetter, id?: string) => scaled(get, id, milliKilo);
export const readVoltage = (get: StateGetter, id?: string) => scaled(get, id, milliKilo);

/** true / false for recognised states, null when missing, unavailable or unrecognised. */
export function readFlag(
  get: StateGetter,
  id: string | undefined,
  onStates: string[],
  offStates: string[],
): boolean | null {
  if (!id) return null;
  const e = get(id);
  if (!valid(e)) return null;
  const s = norm(e.state);
  if (onStates.includes(s)) return true;
  if (offStates.includes(s)) return false;
  const n = Number(s);
  if (Number.isFinite(n)) return n > 0;
  return null;
}

export interface SourceReading {
  /** Raw reading in watts (grid: net, + import). */
  power: number | null;
  voltage: number | null;
  current: number | null;
  /** True when current is estimated from power / voltage rather than measured. */
  currentEstimated: boolean;
  legs: number[];
  frequency: number | null;
}

export interface GridReading extends SourceReading {
  available: boolean | null;
}

export interface GeneratorReading extends SourceReading {
  running: boolean;
  starting: boolean;
  statusText: string | null;
  fuel: { value: number; unit: string } | null;
  /** Watts the generator is delivering to the home (0 unless the transfer switch is on generator). */
  supplying: number;
  loadPct: number | null;
}

export interface DeviceReading {
  index: number;
  cfg: DeviceConfig;
  power: number | null;
  current: number | null;
  active: boolean;
  high: boolean;
  /** Fraction of whole-home load, 0..1. */
  share: number;
  missing: boolean;
}

export interface Flows {
  /** Signed watts along each wire's drawn direction (see layout.ts). */
  grid: number;
  generator: number;
  feed: number;
  solar: number;
  battery: number;
}

export interface Snapshot {
  grid: GridReading | null;
  generator: GeneratorReading | null;
  solar: { power: number | null } | null;
  battery: { power: number | null; soc: number | null } | null;
  ats: AtsPosition | null;
  atsExplicit: boolean;
  home: { power: number | null; current: number | null; currentEstimated: boolean; voltage: number | null };
  supply: Record<SourceKey, number>;
  flows: Flows;
  devices: DeviceReading[];
  other: number | null;
  phaseInputs: PhaseInputs;
  missing: string[];
}

function readLegs(get: StateGetter, ids: string[] | undefined): number[] {
  return (ids ?? []).map((id) => readCurrent(get, id)).filter((v): v is number => v !== null);
}

function readGrid(cfg: GridConfig, get: StateGetter): GridReading {
  let power: number | null;
  if (cfg.entity) {
    power = readPower(get, cfg.entity);
  } else if (cfg.import_entity || cfg.export_entity) {
    const imp = readPower(get, cfg.import_entity);
    const exp = readPower(get, cfg.export_entity);
    power = imp === null && exp === null ? null : Math.abs(imp ?? 0) - Math.abs(exp ?? 0);
  } else {
    power = null;
  }
  if (power !== null && cfg.invert) power = -power;

  const voltage = readVoltage(get, cfg.voltage);
  const threshold = cfg.threshold ?? DEFAULT_SOURCE_THRESHOLD;
  let available = readFlag(get, cfg.status, GRID_ON, GRID_OFF);
  if (available === null && voltage !== null) available = voltage >= (cfg.outage_voltage ?? DEFAULT_OUTAGE_VOLTAGE);
  if (available === null && power !== null && Math.abs(power) > threshold) available = true;

  return {
    power,
    voltage,
    current: readCurrent(get, cfg.current),
    currentEstimated: false,
    legs: readLegs(get, cfg.current_legs),
    frequency: readNumber(get, cfg.frequency),
    available,
  };
}

function readGenerator(cfg: GeneratorConfig, get: StateGetter): Omit<GeneratorReading, "supplying" | "loadPct"> {
  const power = readPower(get, cfg.entity);
  const voltage = readVoltage(get, cfg.voltage);
  const threshold = cfg.threshold ?? DEFAULT_SOURCE_THRESHOLD;
  const startingStates = normList(cfg.starting_states, GEN_STARTING);
  const runningStates = [...normList(cfg.running_states, GEN_RUNNING), ...startingStates];

  let running = readFlag(get, cfg.running, runningStates, GEN_OFF);
  const runningEntity = cfg.running ? get(cfg.running) : undefined;
  const starting = !!runningEntity && valid(runningEntity) && startingStates.includes(norm(runningEntity.state));
  if (running === null) {
    running = (power !== null && power > threshold) || (voltage !== null && voltage >= DEFAULT_OUTAGE_VOLTAGE);
  }

  let fuel: GeneratorReading["fuel"] = null;
  const fuelValue = readNumber(get, cfg.fuel);
  if (fuelValue !== null && cfg.fuel) fuel = { value: fuelValue, unit: unitOf(get(cfg.fuel)) };

  const statusEntity = cfg.status ? get(cfg.status) : undefined;
  const statusText = valid(statusEntity) ? statusEntity.state : null;

  return {
    power,
    voltage,
    current: readCurrent(get, cfg.current),
    currentEstimated: false,
    legs: readLegs(get, cfg.current_legs),
    frequency: readNumber(get, cfg.frequency),
    running,
    starting,
    statusText,
    fuel,
  };
}

function readAts(cfg: TransferSwitchConfig | undefined, get: StateGetter): AtsPosition | null {
  if (!cfg?.entity) return null;
  const e = get(cfg.entity);
  if (!valid(e)) return null;
  const s = norm(e.state);
  if (normList(cfg.generator_states, ATS_GENERATOR).includes(s)) return "generator";
  if (normList(cfg.utility_states, ATS_UTILITY).includes(s)) return "utility";
  if (normList(cfg.open_states, ATS_OPEN).includes(s)) return "open";
  return null;
}

/**
 * Best guess at the transfer switch position when no ATS entity is configured.
 * A loaded generator wins; a generator that is merely cranking has not transferred yet.
 */
export function inferAts(
  grid: GridReading,
  gen: Pick<GeneratorReading, "power" | "running" | "starting">,
  genThreshold: number,
): AtsPosition {
  if (gen.power !== null && gen.power > genThreshold) return "generator";
  if (gen.starting) return "utility";
  if (grid.available === false && gen.running && gen.power === null) return "generator";
  return "utility";
}

function readBattery(cfg: BatteryConfig, get: StateGetter): { power: number | null; soc: number | null } {
  let power: number | null;
  if (cfg.entity) {
    power = readPower(get, cfg.entity);
  } else if (cfg.charge_entity || cfg.discharge_entity) {
    const dis = readPower(get, cfg.discharge_entity);
    const chg = readPower(get, cfg.charge_entity);
    power = dis === null && chg === null ? null : Math.abs(dis ?? 0) - Math.abs(chg ?? 0);
  } else {
    power = null;
  }
  if (power !== null && cfg.invert) power = -power;
  return { power, soc: readNumber(get, cfg.soc) };
}

function collectIds(cfg: CardConfig): string[] {
  const ids: (string | undefined)[] = [];
  const g = cfg.grid;
  if (g) ids.push(g.entity, g.import_entity, g.export_entity, g.voltage, g.current, g.frequency, g.status, ...(g.current_legs ?? []));
  const n = cfg.generator;
  if (n) ids.push(n.entity, n.voltage, n.current, n.frequency, n.running, n.status, n.fuel, ...(n.current_legs ?? []));
  ids.push(cfg.transfer_switch?.entity, cfg.home?.entity, cfg.home?.current, cfg.solar?.entity);
  const b = cfg.battery;
  if (b) ids.push(b.entity, b.charge_entity, b.discharge_entity, b.soc);
  for (const d of cfg.devices ?? []) ids.push(d.entity, d.current, d.switch_entity);
  return ids.filter((id): id is string => !!id);
}

/** Every entity id the card reads. Used for change detection and history backfill. */
export function trackedEntityIds(cfg: CardConfig): string[] {
  return [...new Set(collectIds(cfg))];
}

const pos = (n: number | null | undefined) => (n !== null && n !== undefined && n > 0 ? n : 0);

export function computeSnapshot(cfg: CardConfig, get: StateGetter): Snapshot {
  const missing = trackedEntityIds(cfg).filter((id) => !get(id));
  const grid = cfg.grid ? readGrid(cfg.grid, get) : null;
  const genRaw = cfg.generator ? readGenerator(cfg.generator, get) : null;
  const solarPower = cfg.solar ? readPower(get, cfg.solar.entity) : null;
  const battery = cfg.battery ? readBattery(cfg.battery, get) : null;
  const homeMeasured = readPower(get, cfg.home?.entity);

  const genThreshold = cfg.generator?.threshold ?? DEFAULT_SOURCE_THRESHOLD;
  let ats: AtsPosition | null = null;
  let atsExplicit = false;
  if (grid && genRaw) {
    const explicit = readAts(cfg.transfer_switch, get);
    atsExplicit = explicit !== null;
    ats = explicit ?? inferAts(grid, genRaw, genThreshold);
  }

  const solar = pos(solarPower);
  const batteryNet = battery?.power ?? 0;

  // Only the source the transfer switch is connected to can feed the home. This also keeps
  // panel-side meters (which read generator power as "grid" during an outage) from double counting.
  const gridConnected = !!grid && (ats === null || ats === "utility");
  const genConnected = !!genRaw && (ats === null || ats === "generator");
  const gridNet = gridConnected ? (grid?.power ?? 0) : 0;

  let genSupply = 0;
  if (genRaw && genConnected) {
    if (genRaw.power !== null) {
      genSupply = pos(genRaw.power);
    } else if (ats === "generator") {
      // No generator power sensor: whatever the home draws beyond solar + battery must be the generator.
      // Failing a home sensor, a panel-side mains meter (configured as grid) reads generator output.
      const panel = homeMeasured !== null ? homeMeasured - solar - batteryNet : (grid?.power ?? null);
      genSupply = pos(panel);
    } else if (genRaw.running) {
      genSupply = pos(homeMeasured !== null ? homeMeasured - solar - batteryNet : null);
    }
  }

  const anyReading =
    homeMeasured !== null || grid?.power != null || genRaw?.power != null || solarPower !== null || battery?.power != null;
  const homePower = homeMeasured ?? (anyReading ? Math.max(0, gridNet + genSupply + solar + batteryNet) : null);

  const activeVoltage =
    ats === "generator" ? (genRaw?.voltage ?? null) : grid?.available !== false ? (grid?.voltage ?? genRaw?.voltage ?? null) : null;

  const estimate = (w: number | null, v: number | null) => (w !== null && v !== null && v > 1 ? Math.abs(w) / v : null);

  const measuredHomeCurrent = readCurrent(get, cfg.home?.current);
  const home = {
    power: homePower,
    current: measuredHomeCurrent ?? estimate(homePower, activeVoltage),
    currentEstimated: measuredHomeCurrent === null,
    voltage: activeVoltage,
  };

  if (grid && grid.current === null && grid.legs.length === 0 && gridConnected) {
    grid.current = estimate(grid.power, grid.voltage);
    grid.currentEstimated = grid.current !== null;
  }

  let generator: GeneratorReading | null = null;
  if (genRaw) {
    const rated = cfg.generator?.rated_power;
    generator = {
      ...genRaw,
      supplying: genSupply,
      loadPct: rated && rated > 0 ? (genSupply / rated) * 100 : null,
    };
    if (generator.current === null && generator.legs.length === 0 && genSupply > 0) {
      generator.current = estimate(genSupply, generator.voltage);
      generator.currentEstimated = generator.current !== null;
    }
  }

  const supply: Record<SourceKey, number> = {
    grid: pos(gridNet),
    generator: genSupply,
    solar,
    battery: pos(batteryNet),
  };

  const feed = ats === "generator" ? genSupply : ats === "utility" ? gridNet : 0;
  const flows: Flows = {
    grid: gridConnected ? gridNet : 0,
    generator: genSupply,
    feed,
    solar,
    battery: batteryNet,
  };

  const devices: DeviceReading[] = (cfg.devices ?? []).map((d, index) => {
    const power = readPower(get, d.entity);
    const threshold = d.threshold ?? DEFAULT_DEVICE_THRESHOLD;
    const active = power !== null && power > 0 && power >= threshold;
    return {
      index,
      cfg: d,
      power,
      current: readCurrent(get, d.current),
      active,
      high: active && d.high_load !== undefined && power! >= d.high_load,
      share: active && homePower && homePower > 0 ? Math.min(1, power! / homePower) : 0,
      missing: !get(d.entity),
    };
  });

  let other: number | null = null;
  if (cfg.show_other && homePower !== null) {
    const measured = devices.reduce((sum, d) => sum + pos(d.power), 0);
    other = Math.max(0, homePower - measured);
  }

  return {
    grid,
    generator,
    solar: cfg.solar ? { power: solarPower } : null,
    battery,
    ats,
    atsExplicit,
    home,
    supply,
    flows,
    devices,
    other,
    phaseInputs: {
      hasGrid: !!grid,
      hasGenerator: !!generator,
      gridAvailable: grid?.available ?? null,
      genRunning: generator?.running ?? false,
      genStarting: generator?.starting ?? false,
      ats,
    },
    missing,
  };
}

/** The source carrying the largest share of the home load, or null when nothing is supplying. */
export function dominantSource(supply: Record<SourceKey, number>): SourceKey | null {
  let best: SourceKey | null = null;
  let bestW = 0;
  for (const key of ["grid", "generator", "battery", "solar"] as SourceKey[]) {
    if (supply[key] > bestW) {
      best = key;
      bestW = supply[key];
    }
  }
  return best;
}

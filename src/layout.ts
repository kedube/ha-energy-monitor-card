import { PathBuilder, clamp, type PathSamples, type Point } from "./geometry";

/**
 * Wire ids and the direction each is drawn in. Flow values in the model use
 * the same convention: positive = moving from the first node to the second.
 *   grid       utility  → transfer switch (or → home without a generator)
 *   generator  generator → transfer switch (or → home without a utility)
 *   feed       transfer switch → home
 *   solar      solar → home
 *   battery    battery → home
 */
export type WireId = "grid" | "generator" | "feed" | "solar" | "battery";

export interface NodeGeom {
  x: number;
  y: number;
  r: number;
}

export interface Wire {
  d: string;
  samples: PathSamples;
}

export interface AtsGeom {
  x: number;
  y: number;
  w: number;
  h: number;
  pivot: Point;
  utility: Point;
  generator: Point;
  bladeLen: number;
  /** Blade rotation (deg) that touches the utility contact; generator is the negative. */
  angle: number;
}

export interface LabelGeom {
  x: number;
  y: number;
  align: "left" | "right";
  anchor: "middle" | "top";
  maxWidth: number;
}

export interface DeviceGeom {
  x: number;
  y: number;
  r: number;
  slot: number;
  wire: Wire;
}

export interface Layout {
  w: number;
  h: number;
  s: number;
  flowH: number;
  nodes: { grid?: NodeGeom; generator?: NodeGeom; solar?: NodeGeom; battery?: NodeGeom; home: NodeGeom };
  ats: AtsGeom | null;
  wires: Partial<Record<WireId, Wire>>;
  /** Home → device bus junction. Carries the combined device load. */
  stem: Wire | null;
  devices: DeviceGeom[];
  deviceCapacity: number;
  labels: { grid?: LabelGeom; generator?: LabelGeom; solar?: LabelGeom; battery?: LabelGeom };
}

export interface LayoutInput {
  w: number;
  h: number;
  grid: boolean;
  generator: boolean;
  solar: boolean;
  battery: boolean;
  devices: number;
  /** Devices show a current (A) line, which needs a slightly taller band. */
  deviceExtraLine?: boolean;
}

/** Design reference size; everything scales from here. */
export const REF_WIDTH = 460;
export const REF_HEIGHT = 200;
export const DEVICE_BAND = 78;
const EXTRA_LINE = 12;

const deviceBand = (devices: boolean, extraLine = false) => (devices ? DEVICE_BAND + (extraLine ? EXTRA_LINE : 0) : 0);

export function preferredAspect(hasDevices: boolean, extraLine = false): number {
  return REF_WIDTH / (REF_HEIGHT + deviceBand(hasDevices, extraLine));
}

const wire = (p: PathBuilder): Wire => ({ d: p.toD(), samples: p.sample(1.5) });

export function computeLayout(inp: LayoutInput): Layout {
  const { w, h } = inp;
  const wantDevices = inp.devices > 0;
  const band = deviceBand(wantDevices, inp.deviceExtraLine);
  const s = clamp(Math.min(w / REF_WIDTH, h / (REF_HEIGHT + band)), 0.62, 1.3);
  const pad = 8 * s;
  const r = 21 * s;
  const rh = 35 * s;
  const bend = 9 * s;
  const devBand = band * s;
  const flowH = h - devBand;

  const atsMode = inp.grid && inp.generator;
  const single = !atsMode && (inp.grid || inp.generator);
  const lx = pad + r + 2 * s;

  const solarY = pad + r + 2 * s;
  let hy = inp.solar ? Math.max(flowH * 0.55, solarY + r + 16 * s + rh) : flowH * 0.5;
  hy = Math.min(hy, flowH - rh - 4 * s);

  const aw = 24 * s;
  const ah = 42 * s;
  const ax = lx + r + 14 * s + aw / 2;
  const leftEdge = atsMode ? ax + aw / 2 : single ? lx + r : pad;
  const bx = w - pad - r - 4 * s;
  const rightEdge = inp.battery ? bx - r : w - pad;
  const hx = atsMode || single ? leftEdge + (rightEdge - leftEdge) * 0.5 : w / 2;

  const home: NodeGeom = { x: hx, y: hy, r: rh };
  const nodes: Layout["nodes"] = { home };
  const wires: Layout["wires"] = {};
  const labels: Layout["labels"] = {};
  let ats: AtsGeom | null = null;

  if (atsMode) {
    const spread = Math.max(40 * s, Math.min(64 * s, hy - pad - r, flowH - pad - r - hy));
    const grid = { x: lx, y: hy - spread, r };
    const gen = { x: lx, y: hy + spread, r };
    nodes.grid = grid;
    nodes.generator = gen;

    const utility = { x: ax - aw * 0.18, y: hy - ah * 0.26 };
    const generator = { x: ax - aw * 0.18, y: hy + ah * 0.26 };
    const pivot = { x: ax + aw * 0.22, y: hy };
    ats = {
      x: ax,
      y: hy,
      w: aw,
      h: ah,
      pivot,
      utility,
      generator,
      bladeLen: Math.hypot(pivot.x - utility.x, pivot.y - utility.y),
      angle: (Math.atan2(pivot.y - utility.y, pivot.x - utility.x) * 180) / Math.PI,
    };

    wires.grid = wire(new PathBuilder(lx, grid.y + r).corner(lx, utility.y, utility, bend).lineTo(utility.x, utility.y));
    wires.generator = wire(
      new PathBuilder(lx, gen.y - r).corner(lx, generator.y, generator, bend).lineTo(generator.x, generator.y),
    );
    wires.feed = wire(new PathBuilder(pivot.x, hy).h(hx - rh));

    const labelX = lx + r + 7 * s;
    labels.grid = {
      x: labelX,
      y: grid.y,
      align: "left",
      anchor: "middle",
      maxWidth: Math.max(60 * s, (inp.solar ? hx - r - 6 * s : w - pad) - labelX),
    };
    labels.generator = {
      x: labelX,
      y: gen.y,
      align: "left",
      anchor: "middle",
      maxWidth: Math.max(60 * s, hx - 8 * s - labelX),
    };
  } else if (single) {
    const key = inp.grid ? "grid" : "generator";
    nodes[key] = { x: lx, y: hy, r };
    wires[key] = wire(new PathBuilder(lx + r, hy).h(hx - rh));
    labels[key] = {
      x: lx - r,
      y: hy + r + 5 * s,
      align: "left",
      anchor: "top",
      maxWidth: Math.max(60 * s, hx - 6 * s - (lx - r)),
    };
  }

  if (inp.solar) {
    nodes.solar = { x: hx, y: solarY, r };
    wires.solar = wire(new PathBuilder(hx, solarY + r).v(hy - rh));
    const x = hx + r + 7 * s;
    labels.solar = { x, y: solarY, align: "left", anchor: "middle", maxWidth: Math.max(50 * s, w - pad - x) };
  }

  if (inp.battery) {
    nodes.battery = { x: bx, y: hy, r };
    wires.battery = wire(new PathBuilder(bx - r, hy).h(hx + rh));
    labels.battery = {
      x: bx + r,
      y: hy + r + 5 * s,
      align: "right",
      anchor: "top",
      maxWidth: Math.max(60 * s, bx + r - (hx + rh * 0.6)),
    };
  }

  const devices: DeviceGeom[] = [];
  let stem: Wire | null = null;
  let deviceCapacity = 0;
  if (wantDevices) {
    const busY = flowH + 6 * s;
    const rd = 14 * s;
    const dy = busY + 14 * s + rd;
    const avail = w - 2 * pad;
    deviceCapacity = Math.max(1, Math.floor(avail / (56 * s)));
    const shown = Math.min(inp.devices, deviceCapacity);
    const spacing = Math.min(avail / shown, 96 * s);
    const groupW = spacing * shown;
    const x0 = clamp(hx - groupW / 2, pad, w - pad - groupW);
    // Branches leave from just above the bus so each device's corner stays rounded.
    const junctionY = busY - bend;
    stem = wire(new PathBuilder(hx, hy + rh).v(junctionY));
    for (let i = 0; i < shown; i++) {
      const dx = x0 + spacing * (i + 0.5);
      const p = new PathBuilder(hx, junctionY);
      if (Math.abs(dx - hx) < 1) {
        p.v(dy - rd);
      } else {
        p.corner(hx, busY, { x: dx, y: busY }, bend)
          .corner(dx, busY, { x: dx, y: dy - rd }, bend)
          .lineTo(dx, dy - rd);
      }
      devices.push({ x: dx, y: dy, r: rd, slot: spacing, wire: wire(p) });
    }
  }

  return { w, h, s, flowH, nodes, ats, wires, stem, devices, deviceCapacity, labels };
}

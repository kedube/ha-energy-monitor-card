import { pointAt, type PathSamples, type Point } from "./geometry";

export type FlowStyle = "steady" | "engine";

export interface FlowSpec {
  id: string;
  samples: PathSamples;
  /** 1 = along the wire's drawn direction, -1 = against it. */
  direction: 1 | -1;
  /** Pixels per second. */
  speed: number;
  /** Palette new particles are drawn from, with matching relative weights. */
  colors: string[];
  weights: number[];
  style: FlowStyle;
  /** Core particle radius in px. */
  size: number;
  spacing: number;
}

interface FlowState {
  spec: FlowSpec;
  group: SVGGElement;
  dots: SVGCircleElement[];
  colors: string[];
  offset: number;
  speed: number;
  seed: number;
  pick: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const GOLDEN = 0.618033988749895;
const TAU = Math.PI * 2;

/**
 * Moves glowing particles along wires with requestAnimationFrame. Each particle
 * keeps the colour it entered the wire with, so when the source changes (the
 * cut-over) the new colour visibly flows in behind the old one.
 */
export class FlowEngine {
  private flows = new Map<string, FlowState>();
  private raf = 0;
  private last = 0;
  private visible = true;
  private readonly pt: Point = { x: 0, y: 0 };

  constructor(private layer: SVGGElement) {}

  get element(): SVGGElement {
    return this.layer;
  }

  update(specs: FlowSpec[]): void {
    const seen = new Set<string>();
    for (const spec of specs) {
      seen.add(spec.id);
      let st = this.flows.get(spec.id);
      if (!st) {
        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("data-flow", spec.id);
        this.layer.appendChild(group);
        st = {
          spec,
          group,
          dots: [],
          colors: [],
          offset: Math.random() * spec.spacing,
          speed: spec.speed,
          seed: Math.random() * TAU,
          pick: Math.random(),
        };
        this.flows.set(spec.id, st);
      } else if (st.spec.direction !== spec.direction) {
        // Reversal: restart so particles don't appear to jump backwards.
        st.colors = [];
      }
      st.spec = spec;
      this.syncDots(st);
    }
    for (const [id, st] of this.flows) {
      if (!seen.has(id)) {
        st.group.remove();
        this.flows.delete(id);
      }
    }
    this.kick();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.kick();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    for (const st of this.flows.values()) st.group.remove();
    this.flows.clear();
  }

  private pickColor(st: FlowState): string {
    const { colors, weights } = st.spec;
    if (colors.length <= 1) return colors[0] ?? "currentColor";
    st.pick = (st.pick + GOLDEN) % 1;
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    for (let i = 0; i < colors.length; i++) {
      acc += weights[i] / total;
      if (st.pick < acc) return colors[i];
    }
    return colors[colors.length - 1];
  }

  private syncDots(st: FlowState): void {
    const { spec } = st;
    const count = Math.max(1, Math.ceil(spec.samples.length / spec.spacing));
    while (st.dots.length < count) {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("r", "0");
      c.setAttribute("stroke-opacity", "0.28");
      c.setAttribute("paint-order", "stroke");
      st.group.appendChild(c);
      st.dots.push(c);
    }
    while (st.dots.length > count) st.dots.pop()!.remove();
    while (st.colors.length < count) st.colors.push(this.pickColor(st));
    st.colors.length = count;
    // Keep colours in the current palette if the source set changed entirely.
    for (let i = 0; i < count; i++) {
      if (!spec.colors.includes(st.colors[i])) st.colors[i] = this.pickColor(st);
    }
    for (let i = 0; i < count; i++) this.paint(st, i);
  }

  private paint(st: FlowState, i: number): void {
    const c = st.dots[i];
    const color = st.colors[i];
    c.setAttribute("fill", color);
    c.setAttribute("stroke", color);
    c.setAttribute("stroke-width", String(st.spec.size * 1.9));
  }

  private kick(): void {
    if (this.raf || !this.visible || this.flows.size === 0) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (ts: number): void => {
    this.raf = 0;
    if (!this.visible || this.flows.size === 0) return;
    const dt = Math.min(0.05, Math.max(0, (ts - this.last) / 1000));
    this.last = ts;
    const t = ts / 1000;

    for (const st of this.flows.values()) {
      const { spec, dots } = st;
      st.speed += (spec.speed - st.speed) * Math.min(1, dt * 2.5);
      let v = st.speed;
      const engine = spec.style === "engine";
      // A generator's flow pulses with the engine rather than gliding.
      if (engine) v *= 1 + 0.6 * Math.sin(t * TAU * 1.6 + st.seed);

      const prev = st.offset;
      st.offset = (st.offset + v * dt) % spec.spacing;
      if (st.offset < prev) {
        // Every particle advanced one slot; a fresh one enters at the source.
        st.colors.pop();
        st.colors.unshift(this.pickColor(st));
        for (let i = 0; i < dots.length; i++) this.paint(st, i);
      }

      const len = spec.samples.length;
      const fadeLen = Math.min(10, len / 4);
      for (let i = 0; i < dots.length; i++) {
        const d = st.offset + i * spec.spacing;
        const dot = dots[i];
        if (d > len) {
          dot.setAttribute("r", "0");
          continue;
        }
        pointAt(spec.samples, spec.direction === 1 ? d : len - d, this.pt);
        const edge = Math.min(d, len - d);
        let opacity = fadeLen > 0 ? Math.min(1, edge / fadeLen) : 1;
        let r = spec.size;
        if (engine) {
          const beat = Math.sin(t * TAU * 3.2 + i * 1.3 + st.seed);
          r *= 1 + 0.18 * beat;
          opacity *= 0.85 + 0.15 * beat;
        }
        dot.setAttribute("cx", this.pt.x.toFixed(1));
        dot.setAttribute("cy", this.pt.y.toFixed(1));
        dot.setAttribute("r", r.toFixed(2));
        dot.setAttribute("opacity", opacity.toFixed(2));
      }
    }
    this.raf = requestAnimationFrame(this.frame);
  };
}

/** Maps watts to a particle speed / size on a log scale so small loads still visibly move. */
export function flowIntensity(watts: number, maxWatts: number): number {
  const w = Math.abs(watts);
  if (w <= 0) return 0;
  const ref = 50;
  return Math.min(1, Math.log10(1 + w / ref) / Math.log10(1 + Math.max(maxWatts, 1000) / ref));
}

export interface Point {
  x: number;
  y: number;
}

type Segment =
  | { kind: "L"; x: number; y: number }
  | { kind: "Q"; cx: number; cy: number; x: number; y: number };

/** Uniformly spaced samples along a path, so particles can move at constant speed. */
export interface PathSamples {
  length: number;
  step: number;
  xs: Float32Array;
  ys: Float32Array;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Builds a single open sub-path from lines and quadratic curves. The same
 * description renders the SVG `d` attribute and the sample table the flow
 * engine walks, so particles always sit exactly on the drawn wire.
 */
export class PathBuilder {
  private start: Point;
  private cur: Point;
  private segs: Segment[] = [];

  constructor(x: number, y: number) {
    this.start = { x, y };
    this.cur = { x, y };
  }

  lineTo(x: number, y: number): this {
    this.segs.push({ kind: "L", x, y });
    this.cur = { x, y };
    return this;
  }

  h(x: number): this {
    return this.lineTo(x, this.cur.y);
  }

  v(y: number): this {
    return this.lineTo(this.cur.x, y);
  }

  quadTo(cx: number, cy: number, x: number, y: number): this {
    this.segs.push({ kind: "Q", cx, cy, x, y });
    this.cur = { x, y };
    return this;
  }

  /** Right-angle turn with a rounded corner: travel to (cornerX, cornerY), then head toward `next`. */
  corner(cornerX: number, cornerY: number, next: Point, radius: number): this {
    const inDx = cornerX - this.cur.x;
    const inDy = cornerY - this.cur.y;
    const inLen = Math.hypot(inDx, inDy);
    const outDx = next.x - cornerX;
    const outDy = next.y - cornerY;
    const outLen = Math.hypot(outDx, outDy);
    const rad = Math.min(radius, inLen / 2, outLen / 2);
    if (rad < 0.5 || inLen === 0 || outLen === 0) return this.lineTo(cornerX, cornerY);
    this.lineTo(cornerX - (inDx / inLen) * rad, cornerY - (inDy / inLen) * rad);
    return this.quadTo(cornerX, cornerY, cornerX + (outDx / outLen) * rad, cornerY + (outDy / outLen) * rad);
  }

  get end(): Point {
    return { ...this.cur };
  }

  toD(): string {
    let d = `M${r2(this.start.x)} ${r2(this.start.y)}`;
    for (const s of this.segs) {
      d += s.kind === "L" ? `L${r2(s.x)} ${r2(s.y)}` : `Q${r2(s.cx)} ${r2(s.cy)} ${r2(s.x)} ${r2(s.y)}`;
    }
    return d;
  }

  sample(step = 2): PathSamples {
    const px: number[] = [this.start.x];
    const py: number[] = [this.start.y];
    let p = this.start;
    for (const s of this.segs) {
      if (s.kind === "L") {
        px.push(s.x);
        py.push(s.y);
      } else {
        const approx = Math.hypot(s.cx - p.x, s.cy - p.y) + Math.hypot(s.x - s.cx, s.y - s.cy);
        const n = Math.max(4, Math.ceil(approx / 1.5));
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          const a = (1 - t) * (1 - t);
          const b = 2 * (1 - t) * t;
          const c = t * t;
          px.push(a * p.x + b * s.cx + c * s.x);
          py.push(a * p.y + b * s.cy + c * s.y);
        }
      }
      p = { x: s.x, y: s.y };
    }

    const cum = [0];
    for (let i = 1; i < px.length; i++) cum.push(cum[i - 1] + Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1]));
    const length = cum[cum.length - 1];
    const count = Math.max(2, Math.floor(length / step) + 1);
    const actualStep = length / (count - 1) || 0;
    const xs = new Float32Array(count);
    const ys = new Float32Array(count);
    let j = 0;
    for (let k = 0; k < count; k++) {
      const d = k * actualStep;
      while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const segLen = cum[j + 1] - cum[j];
      const t = segLen > 0 ? Math.min(1, Math.max(0, (d - cum[j]) / segLen)) : 0;
      const j1 = Math.min(j + 1, px.length - 1);
      xs[k] = px[j] + (px[j1] - px[j]) * t;
      ys[k] = py[j] + (py[j1] - py[j]) * t;
    }
    return { length, step: actualStep, xs, ys };
  }
}

export function pointAt(s: PathSamples, distance: number, out: Point = { x: 0, y: 0 }): Point {
  const n = s.xs.length;
  if (n === 0 || s.step === 0) {
    out.x = s.xs[0] ?? 0;
    out.y = s.ys[0] ?? 0;
    return out;
  }
  const d = Math.min(Math.max(distance, 0), s.length);
  const f = d / s.step;
  const i = Math.min(Math.floor(f), n - 2);
  const t = f - i;
  out.x = s.xs[i] + (s.xs[i + 1] - s.xs[i]) * t;
  out.y = s.ys[i] + (s.ys[i + 1] - s.ys[i]) * t;
  return out;
}

/** SVG arc path for a ring segment, angles in degrees clockwise from 12 o'clock. */
export function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const sweep = Math.min(endDeg - startDeg, 359.99);
  const a0 = ((startDeg - 90) * Math.PI) / 180;
  const a1 = ((startDeg + sweep - 90) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = sweep > 180 ? 1 : 0;
  return `M${r2(x0)} ${r2(y0)}A${r2(r)} ${r2(r)} 0 ${large} 1 ${r2(x1)} ${r2(y1)}`;
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

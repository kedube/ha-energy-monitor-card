import type { HassEntity, HomeAssistant, SourceKey, StateGetter } from "./types";

export type TrendSource = SourceKey | "none";

interface Bucket {
  sum: number;
  n: number;
  max: number;
  src: Partial<Record<TrendSource, number>>;
}

export interface TrendPoint {
  avg: number;
  max: number;
  source: TrendSource;
}

export interface TrendStats {
  avg: number | null;
  peak: number | null;
  generatorMs: number;
  outageMs: number;
}

/**
 * Rolling load history bucketed over a fixed window. Each bucket remembers which
 * source carried the load most often, so the strip can be shaded by source.
 */
export class Trend {
  readonly bucketMs: number;
  private buckets = new Map<number, Bucket>();

  constructor(
    readonly windowMs: number,
    readonly count = 96,
  ) {
    this.bucketMs = windowMs / count;
  }

  add(t: number, load: number | null, source: TrendSource): void {
    const key = Math.floor(t / this.bucketMs);
    let b = this.buckets.get(key);
    if (!b) {
      b = { sum: 0, n: 0, max: 0, src: {} };
      this.buckets.set(key, b);
    }
    // An outage with nothing supplying still counts as a (zero) load sample.
    const w = load === null ? (source === "none" ? 0 : null) : Math.max(0, load);
    if (w !== null) {
      b.sum += w;
      b.n += 1;
      b.max = Math.max(b.max, w);
    }
    b.src[source] = (b.src[source] ?? 0) + 1;
  }

  prune(now: number): void {
    const oldest = Math.floor(now / this.bucketMs) - this.count;
    for (const key of this.buckets.keys()) if (key <= oldest) this.buckets.delete(key);
  }

  /** Oldest to newest, one entry per bucket; null where there is no data. */
  points(now: number): (TrendPoint | null)[] {
    const last = Math.floor(now / this.bucketMs);
    const out: (TrendPoint | null)[] = [];
    for (let key = last - this.count + 1; key <= last; key++) {
      const b = this.buckets.get(key);
      if (!b || b.n === 0) {
        out.push(null);
        continue;
      }
      let source: TrendSource = "none";
      let best = -1;
      for (const [k, v] of Object.entries(b.src) as [TrendSource, number][]) {
        if (v > best) {
          best = v;
          source = k;
        }
      }
      out.push({ avg: b.sum / b.n, max: b.max, source });
    }
    return out;
  }

  stats(now: number): TrendStats {
    let sum = 0;
    let n = 0;
    let peak: number | null = null;
    let generatorMs = 0;
    let outageMs = 0;
    for (const p of this.points(now)) {
      if (!p) continue;
      sum += p.avg;
      n += 1;
      peak = peak === null ? p.max : Math.max(peak, p.max);
      if (p.source === "generator") generatorMs += this.bucketMs;
      if (p.source === "none") outageMs += this.bucketMs;
    }
    return { avg: n ? sum / n : null, peak, generatorMs, outageMs };
  }

  /** Copies buckets this trend has no data for (e.g. recorder history behind live samples). */
  fillFrom(other: Trend): void {
    if (other.bucketMs !== this.bucketMs) return;
    for (const [key, b] of other.buckets) if (!this.buckets.has(key)) this.buckets.set(key, b);
  }

  get size(): number {
    return this.buckets.size;
  }
}

type CompressedState = { s: string; lu: number; lc?: number };
export type HistoryResponse = Record<string, CompressedState[]>;

export async function fetchHistory(
  hass: HomeAssistant,
  entityIds: string[],
  start: number,
  end: number,
): Promise<HistoryResponse | null> {
  if (!hass.callWS || entityIds.length === 0) return null;
  try {
    return await hass.callWS<HistoryResponse>({
      type: "history/history_during_period",
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      entity_ids: entityIds,
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
    });
  } catch {
    return null;
  }
}

/**
 * Walks recorded history at a fixed step, handing `visit` a state getter that
 * answers as of that moment. Attributes (units) come from the live state.
 */
export function replayHistory(
  history: HistoryResponse,
  live: StateGetter,
  start: number,
  end: number,
  stepMs: number,
  visit: (t: number, get: StateGetter) => void,
): void {
  const series = new Map<string, { times: number[]; states: string[]; i: number }>();
  for (const [id, rows] of Object.entries(history)) {
    const times: number[] = [];
    const states: string[] = [];
    for (const row of rows) {
      times.push((row.lu ?? row.lc ?? 0) * 1000);
      states.push(row.s);
    }
    series.set(id, { times, states, i: -1 });
  }

  const cache = new Map<string, HassEntity | undefined>();
  const get: StateGetter = (id) => {
    if (cache.has(id)) return cache.get(id);
    const current = live(id);
    const s = series.get(id);
    let result: HassEntity | undefined = current;
    if (s && current) {
      result = { ...current, state: s.i >= 0 ? s.states[s.i] : "unavailable" };
    }
    cache.set(id, result);
    return result;
  };

  for (let t = start; t <= end; t += stepMs) {
    for (const s of series.values()) {
      while (s.i + 1 < s.times.length && s.times[s.i + 1] <= t) s.i++;
    }
    cache.clear();
    visit(t, get);
  }
}

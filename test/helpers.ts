import type { HassEntity, StateGetter } from "../src/types";

type Spec = string | number | [string | number, Record<string, unknown>];

/** Builds a state getter from `{ entity_id: state | [state, attributes] }`. */
export function states(spec: Record<string, Spec>, changed = "2026-01-01T00:00:00Z"): StateGetter {
  const map = new Map<string, HassEntity>();
  for (const [id, v] of Object.entries(spec)) {
    const [state, attributes] = Array.isArray(v) ? v : [v, {}];
    map.set(id, { entity_id: id, state: String(state), attributes, last_changed: changed, last_updated: changed });
  }
  return (id) => map.get(id);
}

export const W = { unit_of_measurement: "W" };
export const KW = { unit_of_measurement: "kW" };

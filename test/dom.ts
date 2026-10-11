// Shared harness for component tests (run under `// @vitest-environment happy-dom`).
// Import this module BEFORE ../src/energy-monitor-card so Lit's dev-mode notices are
// silenced before Lit loads.
import { afterEach, beforeEach, vi, type Mock } from "vitest";
import type { EnergyMonitorCard } from "../src/energy-monitor-card";
import type { HassEntity, HomeAssistant } from "../src/types";

// Lit announces dev mode once per file. The fake ResizeObserver below reports
// synchronously (browsers deliver asynchronously), which trips Lit's
// "change-in-update" efficiency notice; neither is a card problem.
const lit = globalThis as { litIssuedWarnings?: Set<string> };
lit.litIssuedWarnings ??= new Set();
lit.litIssuedWarnings.add("dev-mode");
lit.litIssuedWarnings.add("change-in-update");

// Home Assistant provides these; the card only needs them to exist.
if (!customElements.get("ha-card")) customElements.define("ha-card", class extends HTMLElement {});
if (!customElements.get("ha-icon")) {
  customElements.define(
    "ha-icon",
    class extends HTMLElement {
      icon = "";
    },
  );
}

/** Reports a fixed stage size as soon as an element is observed. */
export class FakeResizeObserver {
  static size = { width: 460, height: 278 };
  static readonly instances = new Set<FakeResizeObserver>();
  private readonly targets = new Set<Element>();

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.add(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
    this.fire(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
    FakeResizeObserver.instances.delete(this);
  }

  private fire(target: Element): void {
    const { width, height } = FakeResizeObserver.size;
    const contentRect = { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height };
    const entry = { target, contentRect, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] };
    this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
  }

  /** Simulates the card's stage being resized. */
  static resize(width: number, height: number): void {
    FakeResizeObserver.size = { width, height };
    for (const ro of FakeResizeObserver.instances) for (const t of ro.targets) ro.fire(t);
  }
}

/** Never reports; the card stays "in view". */
class FakeIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/** In-memory Web Storage, fresh per test (Node 22+ may shadow happy-dom's with its own). */
export function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
  };
}

/** Fixed wall clock for every component test. */
export const T0 = Date.parse("2026-06-01T12:00:00Z");
/** Default `last_changed` for entities: one hour before T0. */
export const HOUR_AGO = new Date(T0 - 3_600_000).toISOString();

/**
 * Installs fake timers (Date included), observers and storage around every test,
 * and removes mounted cards afterwards so their timers are cleared.
 */
export function useCardEnvironment(): void {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    FakeResizeObserver.size = { width: 460, height: 278 };
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal("localStorage", memoryStorage());
  });
  afterEach(() => {
    document.body.replaceChildren();
    FakeResizeObserver.instances.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
}

export type StateSpec = string | number | [string | number, Record<string, unknown>];
export type WsMock = Mock<(msg: Record<string, unknown>) => Promise<unknown>>;
export type ServiceMock = Mock<(domain: string, service: string, data?: Record<string, unknown>) => Promise<unknown>>;

export const W = { unit_of_measurement: "W", device_class: "power" };

/**
 * Builds successive `hass` objects (Home Assistant hands the card a new one on
 * every state change) that share the same callWS / callService mocks.
 */
export function hassFactory(callWS: (msg: Record<string, unknown>) => Promise<unknown> = async () => ({})) {
  const ws: WsMock = vi.fn(callWS);
  const service: ServiceMock = vi.fn(async () => undefined);
  const make = (spec: Record<string, StateSpec>, changed: string = HOUR_AGO): HomeAssistant => {
    const states: Record<string, HassEntity> = {};
    for (const [id, v] of Object.entries(spec)) {
      const [state, attributes] = Array.isArray(v) ? v : [v, {}];
      states[id] = { entity_id: id, state: String(state), attributes, last_changed: changed, last_updated: changed };
    }
    return {
      states,
      locale: { language: "en-US" },
      language: "en",
      callWS: ws as unknown as HomeAssistant["callWS"],
      callService: service,
    };
  };
  return { make, callWS: ws, callService: service };
}

/** Waits until Lit has no update pending (the resize callback schedules a second one). */
export async function settle(card: EnergyMonitorCard): Promise<void> {
  for (let i = 0; i < 10; i++) if (await card.updateComplete) return;
}

/** Lets pending promise chains (e.g. a history fetch) run to completion. */
export async function flushPromises(rounds = 20): Promise<void> {
  for (let i = 0; i < rounds; i++) await Promise.resolve();
}

export async function mount(config: Parameters<EnergyMonitorCard["setConfig"]>[0], hass?: HomeAssistant) {
  const card = document.createElement("energy-monitor-card");
  card.setConfig(config);
  if (hass) card.hass = hass;
  document.body.appendChild(card);
  await settle(card);
  return card;
}

export async function push(card: EnergyMonitorCard, hass: HomeAssistant): Promise<void> {
  card.hass = hass;
  await settle(card);
}

export function $(card: EnergyMonitorCard, selector: string): Element | null {
  return card.shadowRoot!.querySelector(selector);
}

export function $$(card: EnergyMonitorCard, selector: string): Element[] {
  return [...card.shadowRoot!.querySelectorAll(selector)];
}

/** Whitespace-normalised text content. */
export function text(el: Element | null | undefined): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function click(el: Element | null): void {
  if (!el) throw new Error("click target not found");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

export function key(el: Element | null, k: string): KeyboardEvent {
  if (!el) throw new Error("key target not found");
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
}

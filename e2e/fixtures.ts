// Shared fixtures and helpers for the end-to-end suite. Every test drives the
// committed production bundle (dist/energy-monitor-card.js) through demo/index.html.
import { test as base, expect, type Locator, type Page } from "@playwright/test";

export { expect };

export const CARD_IDS = ["main", "minimal", "phone"] as const;
export type CardId = (typeof CARD_IDS)[number];

/** Shape of the `window.demo` hooks exposed by demo/demo.js. */
export interface DemoSim {
  gridUp: boolean;
  genStatus: string;
  ats: string;
  solar: boolean;
  battery: boolean;
  soc: number;
  fuel: number;
  speed: number;
}

export interface DemoHooks {
  sim: DemoSim;
  cutPower(): void;
  restore(): void;
  exercise(): void;
  step(): void;
  push(): void;
}

/** One distinct visible state of a card, captured by `recordTimeline`. */
export interface Snapshot {
  pill: string;
  banner: string;
  home: string;
}

declare global {
  interface Window {
    demo: DemoHooks;
    __emcTimeline?: Record<string, Snapshot[]>;
    __emcMoreInfo?: string[];
  }
}

// The demo loads Material Design Icons from a CDN. Serve a tiny stand-in module so
// the suite is hermetic: no network dependency, no console noise when the CDN is blocked.
const MDI_STUB = 'export const mdiFlash = "M7 2v11h3v9l7-12h-4l4-8z";\n';

export const test = base.extend<{ pageErrors: string[] }>({
  // Auto fixture: fails any test that produced an uncaught exception or console.error.
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
      });
      await page.route("https://cdn.jsdelivr.net/**", (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/javascript",
          headers: { "access-control-allow-origin": "*" },
          body: MDI_STUB,
        }),
      );
      await use(errors);
      expect(errors, "no uncaught errors or console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export const card = (page: Page, id: CardId): Locator => page.locator(`#${id} energy-monitor-card`);

/** Opens the demo and waits until all three cards have drawn their diagram. */
export async function gotoDemo(page: Page): Promise<void> {
  await page.goto("/demo/", { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.demo === "object" && window.demo !== null);
  for (const id of CARD_IDS) await expect(card(page, id).locator("svg.diagram")).toBeVisible();
}

/** Divides every scripted delay of the demo timeline (must be set before cutPower/restore/exercise). */
export async function setSpeed(page: Page, speed: number): Promise<void> {
  await page.evaluate((s) => {
    window.demo.sim.speed = s;
  }, speed);
}

/**
 * Makes the demo push a fresh `hass` the moment the simulated grid, generator or
 * transfer switch changes, like Home Assistant does on a state change. Without it the
 * demo only pushes once a second, so short phases of a sped-up timeline can be skipped.
 */
export async function pushOnStateChange(page: Page): Promise<void> {
  await page.evaluate(() => {
    const { sim, step, push } = window.demo;
    const target = sim as unknown as Record<string, unknown>;
    for (const key of ["gridUp", "genStatus", "ats"]) {
      let value = target[key];
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        get: () => value,
        set: (next) => {
          if (next === value) return;
          value = next;
          queueMicrotask(() => {
            step();
            push();
          });
        },
      });
    }
  });
}

/**
 * Records every distinct (status pill, banner, home value) combination each card
 * renders, via a MutationObserver on its shadow root, so transient phases can be
 * asserted in order after the fact instead of racing them with polling.
 */
export async function recordTimeline(page: Page): Promise<void> {
  await page.evaluate((ids) => {
    const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
    const log: Record<string, Snapshot[]> = {};
    for (const id of ids) {
      const root = document.querySelector(`#${id} energy-monitor-card`)!.shadowRoot!;
      const entries: Snapshot[] = (log[id] = []);
      const capture = () => {
        const pill = root.querySelector(".pill");
        // The pill is "<dot>label<dur>"; keep only the label's own text nodes.
        const label = pill
          ? [...pill.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("")
          : "";
        const snap: Snapshot = {
          pill: clean(label),
          banner: clean(root.querySelector(".banner .what")?.textContent),
          home: clean(root.querySelector(".home-value")?.textContent),
        };
        const last = entries[entries.length - 1];
        if (!last || last.pill !== snap.pill || last.banner !== snap.banner || last.home !== snap.home) {
          entries.push(snap);
        }
      };
      capture();
      new MutationObserver(capture).observe(root, { subtree: true, childList: true, characterData: true });
    }
    window.__emcTimeline = log;
  }, CARD_IDS as readonly string[]);
}

export async function timeline(page: Page, id: CardId): Promise<Snapshot[]> {
  return page.evaluate((cardId) => window.__emcTimeline?.[cardId] ?? [], id);
}

/** Asserts `expected` appears in `actual` in the same order (other entries may sit in between). */
export function expectInOrder(actual: string[], expected: string[], what: string): void {
  let from = 0;
  for (const item of expected) {
    const at = actual.indexOf(item, from);
    expect(at, `${what}: expected "${item}" after position ${from} in ${JSON.stringify(actual)}`).toBeGreaterThanOrEqual(0);
    from = at + 1;
  }
}

/** Drops empty values and collapses consecutive repeats: the sequence of changes. */
export const changes = (values: string[]): string[] => values.filter((v, i) => v && v !== values[i - 1]);

/** Current rotation of the transfer-switch blade, parsed from its inline transform. */
export async function bladeAngle(c: Locator): Promise<number> {
  const style = await c.locator("g.ats g.blade").getAttribute("style");
  const m = /rotate\((-?[\d.]+)deg\)/.exec(style ?? "");
  if (!m) throw new Error(`blade has no rotate() transform: ${style}`);
  return Number(m[1]);
}

export const pill = (c: Locator): Locator => c.locator(".header .pill");
export const banner = (c: Locator): Locator => c.locator(".header .banner .what");
export const homeValue = (c: Locator): Locator => c.locator("g.node.home text.home-value");
export const sourceLabel = (c: Locator, name: string): Locator =>
  c.locator(".overlay .label").filter({ has: c.page().locator(".name", { hasText: name }) });

// Lit templates leave indentation around text, and toHaveText(RegExp) matches the raw
// textContent, so every pattern below tolerates surrounding whitespace.

/** A power reading such as "840 W" or "11.8 kW". */
export const POWER = /^\s*[\d.,]+\s*k?W\s*$/;
/** A power reading in kilowatts. */
export const KILOWATTS = /^\s*[\d.,]+\s*kW\s*$/;

/** The status pill showing exactly `label`, optionally followed by its duration ("12s", "1m 05s", "2h 03m"). */
export function status(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${escaped}(\\d+[smhd](\\s*\\d+[smh])?)?\\s*$`);
}

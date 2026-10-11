import type { Locator, Page } from "@playwright/test";
import {
  CARD_IDS,
  card,
  expect,
  gotoDemo,
  pill,
  pushOnStateChange,
  setSpeed,
  status,
  test,
  type CardId,
} from "./fixtures";

test.describe("load and render", () => {
  test("registers the element and renders all three demo cards without errors", async ({ page, request }) => {
    const pkg = (await (await request.get("/package.json")).json()) as { version: string };
    const banners: string[] = [];
    page.on("console", (m) => {
      if (m.text().includes("ENERGY-MONITOR-CARD")) banners.push(m.text());
    });
    await gotoDemo(page);

    expect(await page.evaluate(() => typeof customElements.get("energy-monitor-card"))).toBe("function");
    expect(await page.evaluate(() => (window.customCards ?? []).map((c) => c.type))).toContain("energy-monitor-card");
    // The committed bundle announces the version it was built from.
    expect(banners.join("\n")).toContain(`v${pkg.version}`);

    const expected: Record<CardId, { nodes: string[]; devices: number; ats: boolean }> = {
      main: { nodes: ["grid", "generator", "solar", "battery", "home"], devices: 7, ats: true },
      minimal: { nodes: ["grid", "generator", "home"], devices: 4, ats: true },
      phone: { nodes: ["grid", "generator", "solar", "battery", "home"], devices: 5, ats: true },
    };
    for (const id of CARD_IDS) {
      const c = card(page, id);
      const diagram = c.locator("svg.diagram");
      await expect(diagram).toBeVisible();
      const box = await diagram.boundingBox();
      expect(box?.width, `${id} diagram width`).toBeGreaterThan(100);
      expect(box?.height, `${id} diagram height`).toBeGreaterThan(80);
      await expect(diagram).toHaveAttribute("aria-label", /^Utility power\. Home [\d.,]+ k?W/);

      const nodes = await c.locator("svg.diagram g.node").evaluateAll((els) =>
        els.map((el) => [...el.classList].find((k) => k !== "node")),
      );
      expect(nodes.sort(), `${id} nodes`).toEqual([...expected[id].nodes].sort());
      await expect(c.locator("g.ats")).toHaveCount(expected[id].ats ? 1 : 0);
      await expect(c.locator(".overlay .device")).toHaveCount(expected[id].devices);
      await expect(pill(c)).toHaveText("Utility power");
      await expect(c.locator(".trend .trend-plot svg")).toBeVisible();
    }
    await expect(card(page, "main").locator(".header .title")).toHaveText("Home power");
    await expect(card(page, "phone").locator(".header .title")).toHaveCount(0);
    await expect(card(page, "main").locator(".overlay .device").filter({ hasText: "Other" })).toHaveCount(1);
  });
});

// ── Particles ─────────────────────────────────────────────────

async function particlePositions(c: Locator): Promise<string[]> {
  return c
    .locator("g.particles circle")
    .evaluateAll((dots) => dots.map((d) => `${d.getAttribute("cx")},${d.getAttribute("cy")},${d.getAttribute("r")}`));
}

test.describe("power-flow particles", () => {
  test("move along the wires when animation is on", async ({ page }) => {
    await gotoDemo(page);
    const main = card(page, "main");
    await expect.poll(() => main.locator("g.particles circle").count()).toBeGreaterThan(5);
    await expect(main.locator('g.particles g[data-flow="grid"] circle').first()).toBeAttached();

    const before = await particlePositions(main);
    const started = Date.now();
    await expect
      .poll(async () => {
        const now = await particlePositions(main);
        return now.filter((p, i) => before[i] !== undefined && p !== before[i]).length;
      })
      .toBeGreaterThan(0);
    // Positions change frame to frame; well within the ~500 ms a viewer would notice.
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  test("are not created when the viewer prefers reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoDemo(page);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

    // Drive a full cut-over so every card re-renders its flows several times.
    await setSpeed(page, 20);
    await pushOnStateChange(page);
    await page.locator("#cut").click();
    for (const id of CARD_IDS) {
      await expect(pill(card(page, id))).toHaveText(status("On generator"), { timeout: 15_000 });
    }
    for (const id of CARD_IDS) {
      const c = card(page, id);
      await expect(c.locator("g.particles")).toBeAttached();
      await expect(c.locator("g.particles circle")).toHaveCount(0);
      // Flow is still shown statically by the lit wires.
      expect(await c.locator("g.live path").count(), `${id} live wires`).toBeGreaterThan(0);
    }
  });
});

// ── Interaction ───────────────────────────────────────────────

async function listenForMoreInfo(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__emcMoreInfo = [];
    document.addEventListener(
      "hass-more-info",
      (e) => window.__emcMoreInfo!.push((e as CustomEvent<{ entityId: string }>).detail.entityId),
      true,
    );
  });
}

const moreInfo = (page: Page) => page.evaluate(() => window.__emcMoreInfo ?? []);

test.describe("interaction", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await listenForMoreInfo(page);
  });

  test("clicking a node or device opens more-info for its entity", async ({ page }) => {
    const main = card(page, "main");
    await main.locator("g.node.grid").click();
    await expect.poll(() => moreInfo(page)).toEqual(["sensor.grid_power"]);

    await main.locator("g.node.generator").click();
    // Click the pivot: the switch box behind the blade is not part of the tap target.
    await main.locator("g.ats circle.pivot").click();
    await main.locator(".overlay .device").filter({ hasText: "HVAC" }).click();
    await main.locator(".overlay .label").filter({ hasText: "Solar" }).click();
    await expect
      .poll(() => moreInfo(page))
      .toEqual([
        "sensor.grid_power",
        "sensor.generator_power",
        "sensor.transfer_switch",
        "sensor.hvac_power",
        "sensor.solar_power",
      ]);

    // "Other" is a computed remainder with no entity: tapping it does nothing.
    // (the click handler runs synchronously, so nothing can arrive later)
    await main.locator(".overlay .device").filter({ hasText: "Other" }).click();
    expect(await moreInfo(page)).toHaveLength(5);
  });

  test("nodes and devices are keyboard operable", async ({ page }) => {
    const main = card(page, "main");
    const utility = main.locator("g.node.grid");
    await expect(utility).toHaveAttribute("role", "button");
    await expect(utility).toHaveAttribute("tabindex", "0");

    await utility.focus();
    await expect(utility).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => moreInfo(page)).toEqual(["sensor.grid_power"]);

    const battery = main.locator("g.node.battery");
    await battery.focus();
    await page.keyboard.press("Space");
    const device = main.locator(".overlay .device").filter({ hasText: "EV charger" });
    await device.focus();
    await page.keyboard.press("Enter");
    // Other keys are ignored.
    await page.keyboard.press("a");
    await expect
      .poll(() => moreInfo(page))
      .toEqual(["sensor.grid_power", "sensor.battery_soc", "sensor.ev_charger_power"]);
  });
});

// ── Layout and theming ────────────────────────────────────────

interface OverflowReport {
  width: number;
  offenders: string[];
  cardOverflowX: number;
  pageOverflowX: number;
}

/** Everything the card draws in HTML must stay inside the card, with no horizontal overflow. */
async function overflowReport(c: Locator): Promise<OverflowReport> {
  return c.evaluate((host) => {
    const root = host.shadowRoot!;
    const haCard = root.querySelector("ha-card")!;
    const box = haCard.getBoundingClientRect();
    const offenders: string[] = [];
    const check = (what: string, el: Element, r: DOMRect) => {
      if (r.width === 0 && r.height === 0) return;
      const tol = 1;
      if (r.left < box.left - tol || r.right > box.right + tol || r.top < box.top - tol || r.bottom > box.bottom + tol) {
        const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        offenders.push(
          `${what} "${text}": x ${r.left.toFixed(1)}–${r.right.toFixed(1)}, y ${r.top.toFixed(1)}–${r.bottom.toFixed(1)}; ` +
            `card x ${box.left.toFixed(1)}–${box.right.toFixed(1)}, y ${box.top.toFixed(1)}–${box.bottom.toFixed(1)}`,
        );
      }
    };
    // Element boxes.
    for (const el of root.querySelectorAll(".label, .device, .header .pill, .header .banner")) {
      check(`box of .${el.classList[0]}`, el, el.getBoundingClientRect());
    }
    // Rendered text of the parts that are not clipped with an ellipsis.
    for (const el of root.querySelectorAll(".label, .dev-value, .header .pill")) {
      const range = document.createRange();
      range.selectNodeContents(el);
      check(`text of .${el.classList[0]}`, el, range.getBoundingClientRect());
    }
    return {
      width: Math.round(box.width),
      offenders,
      cardOverflowX: haCard.scrollWidth - haCard.clientWidth,
      pageOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

async function setMainWidth(page: Page, px: number): Promise<void> {
  await page.locator("#width").evaluate((input, value) => {
    (input as HTMLInputElement).value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, px);
  const main = card(page, "main");
  await expect(page.locator("#main-frame")).toHaveCSS("width", `${px}px`);
  // Wait for the ResizeObserver-driven relayout: the diagram tracks the stage width.
  await expect
    .poll(() =>
      main.evaluate((host) => {
        const stage = host.shadowRoot!.querySelector(".stage")!.getBoundingClientRect().width;
        const svgWidth = Number(host.shadowRoot!.querySelector("svg.diagram")?.getAttribute("width") ?? 0);
        return Math.abs(stage - svgWidth) <= 1;
      }),
    )
    .toBe(true);
}

test.describe("layout", () => {
  test("labels and devices stay inside the card from 300 px to 900 px, on utility and on generator", async ({ page }) => {
    await gotoDemo(page);
    const main = card(page, "main");

    const checkWidths = async (state: string) => {
      for (const px of [300, 900]) {
        await setMainWidth(page, px);
        const report = await overflowReport(main);
        expect(report.width, `${state} @${px}px card width`).toBeLessThanOrEqual(px);
        expect(report.offenders, `${state} @${px}px`).toEqual([]);
        expect(report.cardOverflowX, `${state} @${px}px card horizontal overflow`).toBeLessThanOrEqual(0);
        expect(report.pageOverflowX, `${state} @${px}px page horizontal overflow`).toBeLessThanOrEqual(0);
        await expect(main.locator(".overlay .device")).toHaveCount(7);
      }
    };

    await checkWidths("utility");

    // The generator label is widest once it shows power, load, volts, amps, hertz and fuel.
    await setSpeed(page, 20);
    await pushOnStateChange(page);
    await page.locator("#cut").click();
    await expect(pill(main)).toHaveText(status("On generator"), { timeout: 15_000 });
    await checkWidths("on generator");

    // The fixed-height sections card and the phone card fit too.
    for (const id of ["minimal", "phone"] as const) {
      const report = await overflowReport(card(page, id));
      expect(report.offenders, id).toEqual([]);
      expect(report.cardOverflowX, `${id} horizontal overflow`).toBeLessThanOrEqual(0);
    }
  });

  test("the light theme changes the card background and text", async ({ page }) => {
    await gotoDemo(page);
    const main = card(page, "main");
    const colors = () =>
      main.evaluate((host) => {
        const root = host.shadowRoot!;
        return {
          background: getComputedStyle(root.querySelector("ha-card")!).backgroundColor,
          text: getComputedStyle(root.querySelector(".label .value")!).color,
        };
      });
    const luminance = (rgb: string) => {
      const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };

    const dark = await colors();
    expect(luminance(dark.background)).toBeLessThan(0.3);
    expect(luminance(dark.text)).toBeGreaterThan(0.6);

    await page.locator("#theme").click();
    await expect(page.locator("body")).toHaveClass(/\blight\b/);
    await expect.poll(async () => (await colors()).background).not.toBe(dark.background);
    const light = await colors();
    expect(luminance(light.background)).toBeGreaterThan(0.8);
    expect(luminance(light.text)).toBeLessThan(0.4);

    await page.locator("#theme").click();
    await expect.poll(async () => (await colors()).background).toBe(dark.background);
  });
});

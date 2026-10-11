import {
  KILOWATTS,
  POWER,
  banner,
  bladeAngle,
  card,
  changes,
  expect,
  expectInOrder,
  gotoDemo,
  homeValue,
  pill,
  pushOnStateChange,
  recordTimeline,
  setSpeed,
  sourceLabel,
  status,
  test,
  timeline,
} from "./fixtures";

test.describe("outage cycle", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
  });

  test("utility → outage → generator start → transfer → restore → cooldown → utility", async ({ page }) => {
    const main = card(page, "main");
    const grid = sourceLabel(main, "Utility");
    const gen = sourceLabel(main, "Generator");

    await expect(pill(main)).toHaveText("Utility power");
    await expect(grid.locator(".value")).toHaveText(POWER);
    await expect(gen.locator(".value")).toHaveText("Standby");
    expect(await bladeAngle(main)).toBeGreaterThan(0);

    await setSpeed(page, 20);
    await pushOnStateChange(page);
    await recordTimeline(page);

    // ── Utility lost; the generator cranks, warms up and the ATS transfers ──
    await page.locator("#cut").click();
    await expect(grid.locator(".value")).toHaveText("Outage");
    await expect(main.locator("g.node.grid")).toHaveClass(/\bdown\b/);
    await expect(main.locator("g.fault")).toBeAttached();

    await expect(pill(main)).toHaveText(status("On generator"), { timeout: 15_000 });
    await expect(banner(main)).toHaveText("Transferred to generator");
    await expect.poll(() => bladeAngle(main)).toBeLessThan(0);
    await expect(main.locator("g.ats circle.contact.on")).toHaveCount(1);

    // Generator label: power with its share of the rating, running readouts and fuel.
    await expect(gen.locator(".value")).toHaveText(/^\s*[\d.,]+\s*kW\s*\d+% load\s*$/);
    await expect(gen.locator(".value .tag")).toHaveText(/^\s*\d+% load\s*$/);
    await expect(gen.locator(".detail")).toContainText(/V/);
    await expect(gen.locator(".chip")).toHaveText(/^\s*Fuel \d+%\s*$/);
    await expect(main.locator("g.node.generator")).toHaveClass(/\bactive\b/);
    await expect(main.locator("g.node.generator circle.gauge")).toBeAttached();
    // The utility stays dead while the house runs on the generator.
    await expect(grid.locator(".value")).toHaveText("Outage");
    // Outage timer in the status pill.
    await expect(pill(main).locator(".dur")).toHaveText(/^\s*\d+(s|m \d+s)\s*$/);
    // Orange generator particles replace the blue utility flow on the feed wire.
    await expect.poll(() => main.locator('g.particles g[data-flow="generator"] circle').count()).toBeGreaterThan(0);
    await expect.poll(() => main.locator('g.particles g[data-flow="grid"] circle').count()).toBe(0);
    await expect
      .poll(() =>
        main.locator('g.particles g[data-flow="feed"] circle').evaluateAll((dots) => [
          ...new Set(dots.map((d) => d.getAttribute("fill"))),
        ]),
      )
      .toEqual(["#ff8a1f"]);

    const outage = await timeline(page, "main");
    expectInOrder(
      changes(outage.map((s) => s.banner)),
      ["Utility power lost", "Generator starting", "Transferred to generator"],
      "banners during the outage",
    );
    expectInOrder(
      changes(outage.map((s) => s.pill)),
      ["Utility power", "Outage · on battery", "Generator starting", "On generator"],
      "status pill during the outage",
    );
    // The battery carries the house, so it never goes dark on the full setup.
    expect(outage.map((s) => s.home)).not.toContain("No power");

    // ── Utility returns; the ATS retransfers and the generator cools down ──
    await page.locator("#restore").click();
    await expect(pill(main)).toHaveText(status("Utility power"), { timeout: 15_000 });
    await expect.poll(() => bladeAngle(main)).toBeGreaterThan(0);
    await expect(grid.locator(".value")).toHaveText(POWER);
    await expect(gen.locator(".value")).toHaveText("Standby");
    await expect(main.locator("g.fault")).toHaveCount(0);

    const full = await timeline(page, "main");
    expectInOrder(
      changes(full.map((s) => s.pill)),
      ["On generator", "Utility restored", "Generator cooldown", "Utility power"],
      "status pill after restore",
    );
    expectInOrder(
      changes(full.map((s) => s.banner)),
      ["Transferred to generator", "Utility restored, retransfer pending", "Back on utility, generator cooling down"],
      "banners after restore",
    );
  });

  test("the sections card with no battery and no ATS entity goes dark until the transfer", async ({ page }) => {
    const minimal = card(page, "minimal");
    // Slow enough (outage 1.5 s, cranking/warm-up 3.5 s) for plain polling to see each phase.
    await setSpeed(page, 2);

    await expect(homeValue(minimal)).toHaveText(POWER);
    await page.locator("#cut").click();

    await expect(pill(minimal)).toHaveText(status("Power outage"));
    await expect(homeValue(minimal)).toHaveText("No power");
    await expect(minimal.locator("g.node.home")).toHaveClass(/\bdark\b/);
    await expect(sourceLabel(minimal, "Utility").locator(".value")).toHaveText("Outage");

    await expect(pill(minimal)).toHaveText(status("Generator starting"), { timeout: 10_000 });
    await expect(homeValue(minimal)).toHaveText("No power");

    // With no ATS entity the switch position is inferred from generator output.
    await expect(pill(minimal)).toHaveText(status("On generator"), { timeout: 15_000 });
    await expect(homeValue(minimal)).toHaveText(KILOWATTS);
    await expect(minimal.locator("g.node.home")).not.toHaveClass(/\bdark\b/);
    await expect.poll(() => bladeAngle(minimal)).toBeLessThan(0);

    // The full setup has a battery, so its home never went dark.
    await expect(homeValue(card(page, "main"))).not.toHaveText("No power");
  });

  test("a generator exercise runs while the utility keeps supplying the house", async ({ page }) => {
    const main = card(page, "main");
    await setSpeed(page, 5); // 4 s exercise
    await pushOnStateChange(page);

    await page.locator("#exercise").click();
    await expect(pill(main)).toHaveText(status("Generator exercise"));
    await expect(banner(main)).toHaveText("Generator exercise started");
    await expect(sourceLabel(main, "Generator").locator(".value")).toHaveText("Running");
    await expect(main.locator("g.node.generator")).toHaveClass(/\brunning\b/);
    await expect(main.locator("g.node.generator")).not.toHaveClass(/\bactive\b/);
    // The ATS stays on utility and the grid keeps feeding the house.
    expect(await bladeAngle(main)).toBeGreaterThan(0);
    await expect(main.locator("g.node.grid")).toHaveClass(/\bactive\b/);
    await expect(sourceLabel(main, "Utility").locator(".value")).toHaveText(POWER);
    await expect(main.locator('g.particles g[data-flow="generator"] circle')).toHaveCount(0);

    await expect(pill(main)).toHaveText(status("Utility power"), { timeout: 15_000 });
    await expect(banner(main)).toHaveText("Generator exercise complete");
    expect(await bladeAngle(main)).toBeGreaterThan(0);
  });
});

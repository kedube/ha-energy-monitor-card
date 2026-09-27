import { describe, expect, it } from "vitest";
import { PathBuilder, arcPath, pointAt } from "../src/geometry";
import { computeLayout, preferredAspect, type Layout } from "../src/layout";

describe("PathBuilder", () => {
  it("samples straight lines at their true length", () => {
    const s = new PathBuilder(0, 0).h(100).sample(2);
    expect(s.length).toBeCloseTo(100);
    expect(pointAt(s, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAt(s, 50).x).toBeCloseTo(50);
    expect(pointAt(s, 1000).x).toBeCloseTo(100);
  });

  it("rounds corners and stays continuous", () => {
    const p = new PathBuilder(0, 0).corner(0, 50, { x: 50, y: 50 }, 10).lineTo(50, 50);
    const s = p.sample(1);
    // Two 50px legs minus the corner shortcut (quarter-circle-ish): a bit under 100.
    expect(s.length).toBeGreaterThan(94);
    expect(s.length).toBeLessThan(100);
    const end = pointAt(s, s.length);
    expect(end.x).toBeCloseTo(50);
    expect(end.y).toBeCloseTo(50);
    expect(p.toD()).toBe("M0 0L0 40Q0 50 10 50L50 50");
  });

  it("draws ring arcs clockwise from 12 o'clock", () => {
    expect(arcPath(0, 0, 10, 0, 90)).toBe("M0 -10A10 10 0 0 1 10 0");
  });
});

function allNodes(L: Layout) {
  return Object.values(L.nodes).filter(Boolean) as { x: number; y: number; r: number }[];
}

describe("computeLayout", () => {
  const full = { grid: true, generator: true, solar: true, battery: true, devices: 6 };

  it("keeps every node and device inside the card across sizes", () => {
    for (const w of [300, 360, 460, 520, 700, 960]) {
      const h = Math.round(w / preferredAspect(true));
      const L = computeLayout({ w, h, ...full });
      for (const n of allNodes(L)) {
        expect(n.x - n.r).toBeGreaterThanOrEqual(0);
        expect(n.x + n.r).toBeLessThanOrEqual(w);
        expect(n.y - n.r).toBeGreaterThanOrEqual(0);
        expect(n.y + n.r).toBeLessThanOrEqual(L.flowH);
      }
      for (const d of L.devices) {
        expect(d.x - d.r).toBeGreaterThanOrEqual(0);
        expect(d.x + d.r).toBeLessThanOrEqual(w);
        expect(d.y + d.r).toBeLessThan(h);
      }
    }
  });

  it("stacks utility over generator with the transfer switch between them", () => {
    const L = computeLayout({ w: 460, h: 278, ...full });
    const { grid, generator, home } = L.nodes;
    expect(L.ats).not.toBeNull();
    expect(grid!.y).toBeLessThan(L.ats!.y);
    expect(generator!.y).toBeGreaterThan(L.ats!.y);
    expect(L.ats!.utility.y).toBeLessThan(L.ats!.generator.y);
    expect(L.ats!.pivot.x).toBeGreaterThan(L.ats!.utility.x);
    expect(home.x).toBeGreaterThan(L.ats!.x);
    // Source labels clear the transfer switch enclosure.
    expect(L.labels.grid!.y + 20 * L.s).toBeLessThanOrEqual(L.ats!.y - L.ats!.h / 2);
    expect(L.labels.generator!.y - 20 * L.s).toBeGreaterThanOrEqual(L.ats!.y + L.ats!.h / 2);
  });

  it("wires each source to its node edges", () => {
    const L = computeLayout({ w: 460, h: 278, ...full });
    const grid = L.wires.grid!.samples;
    expect(pointAt(grid, 0).y).toBeCloseTo(L.nodes.grid!.y + L.nodes.grid!.r, 0);
    const feedEnd = pointAt(L.wires.feed!.samples, L.wires.feed!.samples.length);
    expect(feedEnd.x).toBeCloseTo(L.nodes.home.x - L.nodes.home.r, 0);
    const stemEnd = pointAt(L.stem!.samples, L.stem!.samples.length);
    const branchStart = pointAt(L.devices[0].wire.samples, 0);
    expect(branchStart.x).toBeCloseTo(stemEnd.x, 3);
    expect(branchStart.y).toBeCloseTo(stemEnd.y, 3);
  });

  it("connects a lone source straight to the home without a transfer switch", () => {
    const L = computeLayout({ w: 460, h: 200, grid: true, generator: false, solar: false, battery: false, devices: 0 });
    expect(L.ats).toBeNull();
    expect(L.nodes.generator).toBeUndefined();
    expect(L.stem).toBeNull();
    const start = pointAt(L.wires.grid!.samples, 0);
    const end = pointAt(L.wires.grid!.samples, L.wires.grid!.samples.length);
    expect(start.y).toBeCloseTo(end.y);
  });

  it("caps devices to what fits and reports capacity", () => {
    const L = computeLayout({ w: 320, h: 200, ...full, devices: 12 });
    expect(L.deviceCapacity).toBeGreaterThan(0);
    expect(L.devices.length).toBe(Math.min(12, L.deviceCapacity));
  });
});

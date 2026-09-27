import { describe, expect, it } from "vitest";
import { PhaseTracker, classifyPhase, describeTransition, type PhaseInputs } from "../src/phase";

const inputs = (over: Partial<PhaseInputs>): PhaseInputs => ({
  hasGrid: true,
  hasGenerator: true,
  gridAvailable: true,
  genRunning: false,
  genStarting: false,
  ats: "utility",
  ...over,
});

describe("classifyPhase", () => {
  it("covers the outage cycle", () => {
    expect(classifyPhase(inputs({}), false)).toBe("utility");
    expect(classifyPhase(inputs({ gridAvailable: false }), false)).toBe("outage");
    expect(classifyPhase(inputs({ gridAvailable: false, genRunning: true, genStarting: true }), false)).toBe("starting");
    expect(classifyPhase(inputs({ gridAvailable: false, genRunning: true, ats: "generator" }), false)).toBe("generator");
    expect(classifyPhase(inputs({ gridAvailable: true, genRunning: true, ats: "generator" }), false)).toBe("restored");
    expect(classifyPhase(inputs({ genRunning: true }), true)).toBe("cooldown");
    expect(classifyPhase(inputs({ genRunning: true }), false)).toBe("exercise");
  });

  it("handles installs without a generator or without a utility", () => {
    expect(classifyPhase(inputs({ hasGenerator: false, gridAvailable: false }), false)).toBe("outage");
    expect(classifyPhase(inputs({ hasGenerator: false }), false)).toBe("utility");
    expect(classifyPhase(inputs({ hasGrid: false, genRunning: true }), false)).toBe("generator");
    expect(classifyPhase(inputs({ hasGrid: false }), false)).toBe("standby");
  });
});

describe("PhaseTracker", () => {
  it("walks a full outage and marks the generator run as recent", () => {
    const t = new PhaseTracker(30 * 60_000);
    let now = 1_000_000;
    const step = (over: Partial<PhaseInputs>, dt = 1000) => t.observe(inputs(over), (now += dt));

    expect(step({})).toMatchObject({ phase: "utility", changed: false, previous: null });
    expect(step({ gridAvailable: false })).toMatchObject({ phase: "outage", changed: true, previous: "utility" });
    expect(step({ gridAvailable: false, genRunning: true, genStarting: true })).toMatchObject({ phase: "starting" });
    const onGen = step({ gridAvailable: false, genRunning: true, ats: "generator" });
    expect(onGen).toMatchObject({ phase: "generator", changed: true });
    expect(step({ gridAvailable: false, genRunning: true, ats: "generator" }, 60_000)).toMatchObject({
      phase: "generator",
      since: onGen.since,
      changed: false,
    });
    expect(step({ gridAvailable: true, genRunning: true, ats: "generator" })).toMatchObject({ phase: "restored" });
    expect(step({ genRunning: true })).toMatchObject({ phase: "cooldown" });
    expect(t.current?.lastGeneratorEnd).toBe(now);
    expect(step({})).toMatchObject({ phase: "utility" });
    // Cooldown finished; a later run is its own event.
    expect(t.current?.lastGeneratorEnd).toBeNull();
    expect(step({ genRunning: true }, 60_000)).toMatchObject({ phase: "exercise" });
  });

  it("treats a generator still running shortly after retransfer as cooling down", () => {
    const t = new PhaseTracker(5 * 60_000);
    t.observe(inputs({ gridAvailable: false, genRunning: true, ats: "generator" }), 0);
    // Utility back and the generator already stopped: no cooldown seen.
    t.observe(inputs({}), 1000);
    expect(t.observe(inputs({ genRunning: true }), 2000).phase).toBe("cooldown");
    expect(t.observe(inputs({ genRunning: true }), 10 * 60_000).phase).toBe("cooldown");
  });

  it("calls a later run an exercise", () => {
    const t = new PhaseTracker(10 * 60_000);
    t.observe(inputs({}), 0);
    expect(t.observe(inputs({ genRunning: true }), 1000).phase).toBe("exercise");
  });

  it("seeds the first phase's start time", () => {
    const t = new PhaseTracker(0);
    const r = t.observe(inputs({ gridAvailable: false }), 50_000, (p) => (p === "outage" ? 12_000 : null));
    expect(r).toMatchObject({ phase: "outage", since: 12_000, changed: false });
  });
});

describe("describeTransition", () => {
  it("announces cut-over and restoration", () => {
    expect(describeTransition(null, "outage")).toBeNull();
    expect(describeTransition("utility", "outage")?.kind).toBe("outage");
    expect(describeTransition("starting", "generator")?.title).toBe("Transferred to generator");
    expect(describeTransition("restored", "generator")).toBeNull();
    expect(describeTransition("generator", "utility")?.kind).toBe("utility");
    expect(describeTransition("exercise", "utility")?.title).toMatch(/exercise complete/);
    expect(describeTransition("cooldown", "utility")).toBeNull();
  });
});

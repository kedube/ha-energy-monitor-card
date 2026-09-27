import type { AtsPosition, Phase } from "./types";

export interface PhaseInputs {
  hasGrid: boolean;
  hasGenerator: boolean;
  gridAvailable: boolean | null;
  genRunning: boolean;
  genStarting: boolean;
  ats: AtsPosition | null;
}

/**
 * Where the home is in the outage / backup cycle.
 *
 *   utility ─▶ outage ─▶ starting ─▶ generator ─▶ restored ─▶ cooldown ─▶ utility
 *
 * `exercise` is a scheduled generator run while utility power is healthy, and
 * `standby` covers generator-only installs with the generator stopped.
 */
export function classifyPhase(i: PhaseInputs, recentGeneratorRun: boolean): Phase {
  if (!i.hasGenerator) return i.gridAvailable === false ? "outage" : "utility";
  if (!i.hasGrid) return i.genRunning ? (i.genStarting ? "starting" : "generator") : "standby";
  if (i.ats === "generator") return i.gridAvailable === true ? "restored" : "generator";
  if (i.gridAvailable === false) return i.genRunning || i.genStarting ? "starting" : "outage";
  if (i.genRunning) return recentGeneratorRun ? "cooldown" : "exercise";
  return "utility";
}

export interface PhaseState {
  phase: Phase;
  since: number;
  lastGeneratorEnd: number | null;
}

export interface PhaseChange {
  phase: Phase;
  since: number;
  previous: Phase | null;
  changed: boolean;
}

const ON_GENERATOR: Phase[] = ["generator", "restored"];

export class PhaseTracker {
  private state: PhaseState | null = null;

  constructor(private cooldownMs: number) {}

  get current(): PhaseState | null {
    return this.state;
  }

  restore(saved: PhaseState | null) {
    if (saved && !this.state) this.state = { ...saved };
  }

  /**
   * Feed the latest inputs. `seedSince` supplies a start time (e.g. an entity's
   * last_changed) the first time a phase is seen, so timers survive a page reload.
   */
  observe(inputs: PhaseInputs, now: number, seedSince?: (phase: Phase) => number | null): PhaseChange {
    const prev = this.state;
    const recent =
      prev !== null &&
      (ON_GENERATOR.includes(prev.phase) ||
        prev.phase === "cooldown" ||
        (prev.lastGeneratorEnd !== null && now - prev.lastGeneratorEnd < this.cooldownMs));
    const phase = classifyPhase(inputs, recent);

    if (prev === null) {
      this.state = { phase, since: seedSince?.(phase) ?? now, lastGeneratorEnd: null };
      return { phase, since: this.state.since, previous: null, changed: false };
    }
    if (prev.phase === phase) {
      return { phase, since: prev.since, previous: prev.phase, changed: false };
    }

    const leftGenerator = ON_GENERATOR.includes(prev.phase) && !ON_GENERATOR.includes(phase);
    // Once the post-outage cooldown finishes, the next run is a fresh event (e.g. an exercise).
    const cooldownOver = prev.phase === "cooldown" && phase !== "cooldown";
    this.state = {
      phase,
      since: now,
      lastGeneratorEnd: leftGenerator ? now : cooldownOver ? null : prev.lastGeneratorEnd,
    };
    return { phase, since: now, previous: prev.phase, changed: true };
  }
}

export interface PhaseEvent {
  kind: "outage" | "generator" | "utility" | "info";
  title: string;
}

/** Human-readable notice for a transition the user just witnessed, or null if it isn't noteworthy. */
export function describeTransition(from: Phase | null, to: Phase): PhaseEvent | null {
  if (from === null || from === to) return null;
  switch (to) {
    case "outage":
      return { kind: "outage", title: "Utility power lost" };
    case "starting":
      return { kind: "generator", title: "Generator starting" };
    case "generator":
      return ON_GENERATOR.includes(from) ? null : { kind: "generator", title: "Transferred to generator" };
    case "restored":
      return { kind: "utility", title: "Utility restored, retransfer pending" };
    case "cooldown":
      return { kind: "utility", title: "Back on utility, generator cooling down" };
    case "utility":
      if (ON_GENERATOR.includes(from)) return { kind: "utility", title: "Back on utility power" };
      if (from === "exercise") return { kind: "info", title: "Generator exercise complete" };
      if (from === "outage" || from === "starting") return { kind: "utility", title: "Utility power restored" };
      return null;
    case "exercise":
      return { kind: "info", title: "Generator exercise started" };
    case "standby":
      return from === "generator" ? { kind: "info", title: "Generator stopped" } : null;
  }
}

export interface PhaseDisplay {
  label: string;
  tone: "grid" | "generator" | "outage" | "battery" | "neutral";
  showDuration: boolean;
}

export function phaseDisplay(phase: Phase, onBattery: boolean): PhaseDisplay {
  switch (phase) {
    case "utility":
      return { label: "Utility power", tone: "grid", showDuration: false };
    case "outage":
      return onBattery
        ? { label: "Outage · on battery", tone: "battery", showDuration: true }
        : { label: "Power outage", tone: "outage", showDuration: true };
    case "starting":
      return { label: "Generator starting", tone: "generator", showDuration: true };
    case "generator":
      return { label: "On generator", tone: "generator", showDuration: true };
    case "restored":
      return { label: "Utility restored", tone: "grid", showDuration: true };
    case "cooldown":
      return { label: "Generator cooldown", tone: "grid", showDuration: true };
    case "exercise":
      return { label: "Generator exercise", tone: "generator", showDuration: true };
    case "standby":
      return { label: "Generator standby", tone: "neutral", showDuration: false };
  }
}

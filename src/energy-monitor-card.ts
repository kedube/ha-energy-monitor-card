import { LitElement, html, svg, nothing, type SVGTemplateResult, type TemplateResult } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { configForm } from "./editor";
import { FlowEngine, flowIntensity, type FlowSpec, type FlowStyle } from "./flow-engine";
import {
  formatClock,
  formatCurrent,
  formatDuration,
  formatFrequency,
  formatNumber,
  formatPower,
  formatVoltage,
  formatWindow,
  titleCase,
  type Formatted,
} from "./format";
import { arcPath, pointAt } from "./geometry";
import {
  batteryGlyph,
  faultGlyph,
  generatorGlyph,
  homeGlyph,
  placeGlyph,
  pylonGlyph,
  solarGlyph,
} from "./graphics";
import { computeLayout, preferredAspect, type Layout, type NodeGeom, type Wire } from "./layout";
import {
  DEFAULT_DEVICE_THRESHOLD,
  DEFAULT_SOURCE_THRESHOLD,
  computeSnapshot,
  dominantSource,
  trackedEntityIds,
  type Snapshot,
} from "./model";
import {
  PhaseTracker,
  classifyPhase,
  describeTransition,
  phaseDisplay,
  type PhaseChange,
  type PhaseEvent,
  type PhaseState,
} from "./phase";
import { cardStyles } from "./styles";
import { Trend, fetchHistory, replayHistory, type TrendSource } from "./trend";
import type {
  CardConfig,
  ColorConfig,
  HomeAssistant,
  Phase,
  SourceKey,
  StateGetter,
  TapConfig,
} from "./types";

const VERSION = "1.0.0";
const CARD_TAG = "energy-monitor-card";

const DEFAULT_COLORS: Required<ColorConfig> = {
  grid: "#4c9aff",
  generator: "#ff8a1f",
  solar: "#f5c400",
  battery: "#e05aa8",
  outage: "#ff4d4f",
};

const SOURCE_ORDER: SourceKey[] = ["grid", "generator", "solar", "battery"];
const SOURCE_NAMES: Record<TrendSource, string> = {
  grid: "Utility",
  generator: "Generator",
  solar: "Solar",
  battery: "Battery",
  none: "Outage",
};

interface DeviceView {
  key: string;
  name: string;
  icon: string;
  power: number | null;
  current: number | null;
  active: boolean;
  high: boolean;
  share: number;
  entity?: string;
  tap?: TapConfig;
  toggle?: string;
  missing: boolean;
}

interface Banner {
  event: PhaseEvent;
  at: number;
  id: number;
}

function hasAny(obj: object | undefined, keys: string[]): boolean {
  if (!obj) return false;
  const o = obj as Record<string, unknown>;
  return keys.some((k) => (Array.isArray(o[k]) ? (o[k] as unknown[]).length > 0 : !!o[k]));
}

/** Drops sections that have no entities yet (e.g. half-filled in the visual editor). */
export function normalizeConfig(input: CardConfig): CardConfig {
  const cfg: CardConfig = { ...input };
  if (!hasAny(cfg.grid, ["entity", "import_entity", "export_entity", "voltage", "status", "current", "current_legs"])) delete cfg.grid;
  if (!hasAny(cfg.generator, ["entity", "running", "voltage", "current", "current_legs"])) delete cfg.generator;
  if (!hasAny(cfg.transfer_switch, ["entity"])) delete cfg.transfer_switch;
  if (!hasAny(cfg.home, ["entity", "current"])) delete cfg.home;
  if (!hasAny(cfg.solar, ["entity"])) delete cfg.solar;
  if (!hasAny(cfg.battery, ["entity", "charge_entity", "discharge_entity", "soc"])) delete cfg.battery;
  cfg.devices = (cfg.devices ?? []).filter((d) => d && d.entity);
  return cfg;
}

function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export class EnergyMonitorCard extends LitElement {
  static override styles = cardStyles;

  private _hass?: HomeAssistant;
  private _config?: CardConfig;
  private _colors: Required<ColorConfig> = DEFAULT_COLORS;
  private _snap?: Snapshot;
  private _phase?: PhaseChange;
  private _tracker = new PhaseTracker(30 * 60_000);
  private _trend: Trend | null = null;
  private _layout: Layout | null = null;
  private _layoutKey = "";
  private _size = { w: 0, h: 0 };
  private _engine: FlowEngine | null = null;
  private _flowsDirty = true;
  private _resizeObserver?: ResizeObserver;
  private _intersectionObserver?: IntersectionObserver;
  private _inView = true;
  private _refreshTimer?: ReturnType<typeof setInterval>;
  private _clockTimer?: ReturnType<typeof setInterval>;
  private _bannerTimer?: ReturnType<typeof setTimeout>;
  private _banner: Banner | null = null;
  private _bannerSeq = 0;
  private _cutover = 0;
  private _lastAts: Snapshot["ats"] = null;
  private _outageSeq = 0;
  private _statusKey = "";
  private _lastRefresh = 0;
  private _historyRequested = false;
  private _signature = "";
  private _hoverIndex: number | null = null;
  private _uid = Math.random().toString(36).slice(2, 8);
  private _reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  private readonly _get: StateGetter = (id) => this._hass?.states[id];
  private readonly _onDocVisibility = () => this._syncEngineVisibility();

  // ── Home Assistant card API ───────────────────────────────

  static getConfigForm() {
    return configForm();
  }

  static getStubConfig(hass?: HomeAssistant): CardConfig {
    const states = hass?.states ?? {};
    const ids = Object.keys(states);
    const find = (domain: string, deviceClass: string | null, re: RegExp) =>
      ids.find(
        (id) =>
          id.startsWith(`${domain}.`) &&
          re.test(id) &&
          (deviceClass === null || states[id]?.attributes?.device_class === deviceClass),
      );
    const stub: CardConfig = {
      type: `custom:${CARD_TAG}`,
      grid: {
        entity: find("sensor", "power", /grid|mains|utility|import/) ?? "sensor.grid_power",
        voltage: find("sensor", "voltage", /grid|mains|utility|line/),
      },
      generator: {
        entity: find("sensor", "power", /generator|genset/) ?? "sensor.generator_power",
        running: find("binary_sensor", null, /generator/) ?? find("sensor", null, /generator.*(status|state)/),
      },
    };
    for (const section of [stub.grid, stub.generator] as Record<string, unknown>[]) {
      for (const k of Object.keys(section)) if (section[k] === undefined) delete section[k];
    }
    return stub;
  }

  setConfig(config: CardConfig): void {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    if (config.devices !== undefined && !Array.isArray(config.devices)) throw new Error("`devices` must be a list");
    const cfg = normalizeConfig(config);
    if (!cfg.grid && !cfg.generator && !cfg.solar && !cfg.battery && !cfg.home) {
      throw new Error("Add at least one of: grid, generator, solar, battery or home (each with an entity)");
    }
    this._config = cfg;
    this._colors = { ...DEFAULT_COLORS, ...(cfg.colors ?? {}) };
    // The visual editor calls setConfig on every keystroke; keep history and
    // phase timers unless the entities or window actually changed.
    const windowMin = cfg.trend_window ?? 60;
    const signature = `${trackedEntityIds(cfg).join("|")}#${windowMin}#${cfg.cooldown_window ?? ""}`;
    if (signature !== this._signature) {
      this._signature = signature;
      this._tracker = new PhaseTracker(this._cooldownMs);
      this._trend = windowMin > 0 ? new Trend(windowMin * 60_000) : null;
      this._historyRequested = false;
      this._phase = undefined;
      this._lastAts = null;
    }
    this._snap = undefined;
    this._statusKey = "";
    this._layoutKey = "";
    this._flowsDirty = true;
    if (this.isConnected) this._startTimers();
    if (this._hass) this.hass = this._hass;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (!this._config) return;
    const snap = computeSnapshot(this._config, this._get);
    const key = JSON.stringify(snap.phaseInputs);
    const interval = this._intervalMs;
    const due = interval === 0 || Date.now() - this._lastRefresh >= interval;
    // Numbers refresh on the configured interval; a change of source always shows at once.
    if (!this._snap || key !== this._statusKey || due) this._apply(snap, key);
    if (!this._historyRequested && this._trend) void this._loadHistory();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  getCardSize(): number {
    const cfg = this._config;
    const devices = (cfg?.devices?.length ?? 0) > 0 || !!cfg?.show_other;
    return 5 + (devices ? 1 : 0) + (this._trend ? 2 : 0);
  }

  getGridOptions() {
    const cfg = this._config;
    const devices = (cfg?.devices?.length ?? 0) > 0 || !!cfg?.show_other;
    const trend = (cfg?.trend_window ?? 60) > 0;
    const rows = 4 + (devices ? 1 : 0) + (trend ? 1 : 0);
    return { columns: 12, rows, min_columns: 6, min_rows: Math.max(3, rows - 2) };
  }

  // ── Lifecycle ─────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._startTimers();
    // Re-render so the particle engine and resize observer come back after a view switch.
    this.requestUpdate();
    document.addEventListener("visibilitychange", this._onDocVisibility);
    if (typeof IntersectionObserver === "function") {
      this._intersectionObserver = new IntersectionObserver((entries) => {
        this._inView = entries.some((e) => e.isIntersecting);
        this._syncEngineVisibility();
      });
      this._intersectionObserver.observe(this);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._refreshTimer);
    clearInterval(this._clockTimer);
    clearTimeout(this._bannerTimer);
    document.removeEventListener("visibilitychange", this._onDocVisibility);
    this._intersectionObserver?.disconnect();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._engine?.destroy();
    this._engine = null;
    this._flowsDirty = true;
  }

  protected override updated(): void {
    const stage = this.renderRoot.querySelector<HTMLElement>(".stage");
    if (stage && !this._resizeObserver && typeof ResizeObserver === "function") {
      this._resizeObserver = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect;
        if (!r) return;
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        if (w !== this._size.w || h !== this._size.h) {
          this._size = { w, h };
          this.requestUpdate();
        }
      });
      this._resizeObserver.observe(stage);
    }

    const layer = this.renderRoot.querySelector<SVGGElement>("g.particles");
    if (!layer) {
      this._engine?.destroy();
      this._engine = null;
      return;
    }
    if (!this._engine || this._engine.element !== layer) {
      this._engine?.destroy();
      this._engine = new FlowEngine(layer);
      this._flowsDirty = true;
      this._syncEngineVisibility();
    }
    if (this._flowsDirty) {
      this._flowsDirty = false;
      this._engine.update(this._animated ? this._flowSpecs() : []);
    }
  }

  // ── State handling ────────────────────────────────────────

  private get _intervalMs(): number {
    const s = this._config?.update_interval ?? 2;
    return Math.max(0, s) * 1000;
  }

  private get _cooldownMs(): number {
    return Math.max(0, this._config?.cooldown_window ?? 5) * 60_000;
  }

  private get _animated(): boolean {
    return this._config?.animation !== false && !this._reducedMotion;
  }

  private get _locale(): string | undefined {
    return this._hass?.locale?.language ?? this._hass?.language;
  }

  private _startTimers(): void {
    clearInterval(this._refreshTimer);
    clearInterval(this._clockTimer);
    const interval = this._intervalMs;
    if (interval > 0) {
      this._refreshTimer = setInterval(() => {
        if (this._hass && this._config) {
          const snap = computeSnapshot(this._config, this._get);
          this._apply(snap, JSON.stringify(snap.phaseInputs));
        }
      }, Math.max(1000, interval));
    }
    // Durations tick every second even when readouts refresh less often.
    this._clockTimer = setInterval(() => {
      if (this._banner || (this._phase && phaseDisplay(this._phase.phase, false).showDuration)) this.requestUpdate();
    }, 1000);
  }

  private _apply(snap: Snapshot, statusKey: string): void {
    const now = Date.now();
    if (!this._tracker.current) this._restorePhase(snap);
    const change = this._tracker.observe(snap.phaseInputs, now, (p) => this._seedSince(p));
    if (change.changed) this._onTransition(change);
    if (change.changed || !this._phase) this._savePhase();

    if (snap.ats !== this._lastAts) {
      if (this._lastAts !== null && snap.ats !== null) this._cutover++;
      this._lastAts = snap.ats;
    }

    this._snap = snap;
    this._phase = change;
    this._statusKey = statusKey;
    this._lastRefresh = now;
    this._flowsDirty = true;
    if (this._trend) {
      this._trend.add(now, snap.home.power, trendSource(snap));
      this._trend.prune(now);
    }
    this.requestUpdate();
  }

  private _onTransition(change: PhaseChange): void {
    if (change.phase === "outage" || (change.phase === "starting" && change.previous === "utility")) this._outageSeq++;
    const event = describeTransition(change.previous, change.phase);
    if (!event) return;
    this._banner = { event, at: Date.now(), id: ++this._bannerSeq };
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => {
      this._banner = null;
      this.requestUpdate();
    }, 9000);
  }

  private _seedSince(phase: Phase): number | null {
    const cfg = this._config!;
    const changed = (id?: string) => {
      const e = id ? this._hass?.states[id] : undefined;
      const t = e ? Date.parse(e.last_changed) : NaN;
      return Number.isFinite(t) ? t : null;
    };
    switch (phase) {
      case "outage":
      case "starting":
        return changed(cfg.grid?.status);
      case "generator":
        return changed(cfg.transfer_switch?.entity) ?? changed(cfg.generator?.running);
      case "restored":
        return changed(cfg.grid?.status) ?? changed(cfg.transfer_switch?.entity);
      case "exercise":
      case "cooldown":
        return changed(cfg.generator?.running);
      default:
        return changed(cfg.grid?.status);
    }
  }

  private get _storageKey(): string {
    return `${CARD_TAG}:${hashString(trackedEntityIds(this._config!).join("|"))}`;
  }

  private _savePhase(): void {
    const state = this._tracker.current;
    if (!state) return;
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode, quota). Timers fall back to entity history.
    }
  }

  private _restorePhase(snap: Snapshot): void {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as PhaseState;
      if (!saved?.phase || !Number.isFinite(saved.since)) return;
      const recent =
        ["generator", "restored", "cooldown"].includes(saved.phase) ||
        (saved.lastGeneratorEnd !== null && Date.now() - saved.lastGeneratorEnd < this._cooldownMs);
      if (classifyPhase(snap.phaseInputs, recent) === saved.phase) this._tracker.restore(saved);
    } catch {
      // Ignore corrupt or inaccessible storage.
    }
  }

  private async _loadHistory(): Promise<void> {
    this._historyRequested = true;
    const hass = this._hass;
    const cfg = this._config;
    const trend = this._trend;
    if (!hass?.callWS || !cfg || !trend) return;
    const end = Date.now();
    const start = end - trend.windowMs;
    const history = await fetchHistory(hass, trackedEntityIds(cfg), start, end);
    if (!history || trend !== this._trend) return;
    const replayed = new Trend(trend.windowMs, trend.count);
    replayHistory(history, this._get, start, end, trend.bucketMs / 4, (t, get) => {
      const s = computeSnapshot(cfg, get);
      replayed.add(t, s.home.power, trendSource(s));
    });
    trend.fillFrom(replayed);
    this.requestUpdate();
  }

  private _syncEngineVisibility(): void {
    this._engine?.setVisible(this._inView && !document.hidden);
  }

  // ── Interaction ───────────────────────────────────────────

  private _tap(cfg: TapConfig | undefined, entityId: string | undefined, toggleEntity?: string): void {
    const action = cfg?.tap_action ?? "more-info";
    if (action === "none") return;
    if (action === "navigate") {
      if (cfg?.navigation_path) {
        history.pushState(null, "", cfg.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
      }
      return;
    }
    if (action === "toggle") {
      const target = toggleEntity ?? entityId;
      if (target) void this._hass?.callService?.("homeassistant", "toggle", { entity_id: target });
      return;
    }
    if (entityId) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
    }
  }

  private _keyTap(e: KeyboardEvent, fn: () => void): void {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  }

  // ── Derived view data ─────────────────────────────────────

  private _deviceViews(snap: Snapshot): DeviceView[] {
    const cfg = this._config!;
    const views: DeviceView[] = snap.devices.map((d) => {
      const entity = this._hass?.states[d.cfg.entity];
      const friendly = String(entity?.attributes?.friendly_name ?? d.cfg.entity.split(".")[1] ?? d.cfg.entity);
      return {
        key: `d${d.index}`,
        name: d.cfg.name ?? friendly.replace(/\s+(power|consumption|load|watts)$/i, ""),
        icon: d.cfg.icon ?? (entity?.attributes?.icon as string | undefined) ?? "mdi:flash",
        power: d.power,
        current: d.current,
        active: d.active,
        high: d.high,
        share: d.share,
        entity: d.cfg.entity,
        tap: d.cfg,
        toggle: d.cfg.switch_entity,
        missing: d.missing,
      };
    });
    if (snap.other !== null) {
      const home = snap.home.power ?? 0;
      views.push({
        key: "other",
        name: "Other",
        icon: "mdi:dots-horizontal-circle-outline",
        power: snap.other,
        current: null,
        active: snap.other >= DEFAULT_DEVICE_THRESHOLD,
        high: false,
        share: home > 0 ? Math.min(1, snap.other / home) : 0,
        tap: { tap_action: "none" },
        missing: false,
      });
    }
    if (cfg.sort_devices) views.sort((a, b) => (b.power ?? -1) - (a.power ?? -1));
    return views.slice(0, Math.max(1, cfg.max_devices ?? 12));
  }

  private _ensureLayout(deviceCount: number, extraDeviceLine: boolean): Layout | null {
    const { w, h } = this._size;
    const cfg = this._config!;
    if (w < 40 || h < 40) return null;
    const flags = {
      grid: !!cfg.grid,
      generator: !!cfg.generator,
      solar: !!cfg.solar,
      battery: !!cfg.battery,
    };
    const key = `${w}x${h}|${Object.values(flags).join()}|${deviceCount}|${extraDeviceLine}`;
    if (key !== this._layoutKey) {
      this._layout = computeLayout({ w, h, ...flags, devices: deviceCount, deviceExtraLine: extraDeviceLine });
      this._layoutKey = key;
      this._flowsDirty = true;
    }
    return this._layout;
  }

  private _mix(snap: Snapshot): { colors: string[]; weights: number[]; style: FlowStyle } {
    const colors: string[] = [];
    const weights: number[] = [];
    for (const k of SOURCE_ORDER) {
      if (snap.supply[k] > 0) {
        colors.push(this._colors[k]);
        weights.push(snap.supply[k]);
      }
    }
    const onlyGenerator = colors.length === 1 && colors[0] === this._colors.generator;
    return { colors, weights, style: onlyGenerator ? "engine" : "steady" };
  }

  private _flowSpecs(): FlowSpec[] {
    const L = this._layout;
    const snap = this._snap;
    const cfg = this._config;
    if (!L || !snap || !cfg) return [];
    const max = cfg.max_power ?? Math.max(cfg.generator?.rated_power ?? 0, 10000);
    const specs: FlowSpec[] = [];
    const add = (
      id: string,
      wire: Wire | undefined,
      watts: number,
      threshold: number,
      colors: string[],
      weights: number[],
      style: FlowStyle,
      spacing = 22,
    ) => {
      if (!wire || !colors.length || Math.abs(watts) <= threshold) return;
      const k = flowIntensity(watts, max);
      specs.push({
        id,
        samples: wire.samples,
        direction: watts >= 0 ? 1 : -1,
        speed: (22 + 86 * k) * L.s,
        colors,
        weights,
        style,
        size: (1.8 + 1.4 * k) * L.s,
        spacing: spacing * L.s,
      });
    };
    const c = this._colors;
    const thr = (x?: { threshold?: number }) => x?.threshold ?? DEFAULT_SOURCE_THRESHOLD;
    add("grid", L.wires.grid, snap.flows.grid, thr(cfg.grid), [c.grid], [1], "steady");
    add("generator", L.wires.generator, snap.flows.generator, thr(cfg.generator), [c.generator], [1], "engine");
    if (snap.ats) {
      const onGen = snap.ats === "generator";
      add(
        "feed",
        L.wires.feed,
        snap.flows.feed,
        thr(onGen ? cfg.generator : cfg.grid),
        [onGen ? c.generator : c.grid],
        [1],
        onGen ? "engine" : "steady",
      );
    }
    add("solar", L.wires.solar, snap.flows.solar, thr(cfg.solar), [c.solar], [1], "steady");
    add("battery", L.wires.battery, snap.flows.battery, thr(cfg.battery), [c.battery], [1], "steady");

    const mix = this._mix(snap);
    const views = this._deviceViews(snap);
    let devicesTotal = 0;
    L.devices.forEach((geom, i) => {
      const v = views[i];
      if (v?.active && v.power !== null) {
        devicesTotal += v.power;
        // Branches share the bus, so space their particles out to keep it readable.
        add(`dev-${v.key}`, geom.wire, v.power, 0, mix.colors, mix.weights, mix.style, 34);
      }
    });
    add("stem", L.stem ?? undefined, devicesTotal, 0, mix.colors, mix.weights, mix.style);
    return specs;
  }

  // ── Rendering ─────────────────────────────────────────────

  private _fmt(watts: number | null | undefined): Formatted {
    const cfg = this._config!;
    return formatPower(watts, cfg.power_unit ?? "auto", cfg.decimals ?? 1, this._locale);
  }

  private _power(watts: number | null | undefined, tag?: string): TemplateResult {
    const f = this._fmt(watts);
    return html`${f.value}<span class="unit">${f.unit}</span>${tag ? html`<span class="tag">${tag}</span>` : nothing}`;
  }

  protected override render() {
    const cfg = this._config;
    if (!cfg) return nothing;
    const snap = this._snap;
    const c = this._colors;
    const views = snap ? this._deviceViews(snap) : [];
    const extraLine = views.some((v) => v.current !== null);
    const L = snap ? this._ensureLayout(views.length, extraLine) : null;
    const colorVars =
      `--emc-grid:${c.grid};--emc-generator:${c.generator};--emc-solar:${c.solar};` +
      `--emc-battery:${c.battery};--emc-outage:${c.outage};`;

    return html`
      <ha-card class=${cfg.hide_background ? "transparent" : ""} style=${colorVars}>
        ${this._renderHeader()}
        <div class="stage" style="aspect-ratio:${preferredAspect(views.length > 0, extraLine)};--s:${L?.s ?? 1}">
          ${snap && L ? this._renderDiagram(snap, L, views) : nothing}
        </div>
        ${this._trend && snap ? this._renderTrend() : nothing}
        ${snap?.missing.length
          ? html`<div class="warn" title=${snap.missing.join(", ")}>⚠ Entity not found: ${snap.missing.join(", ")}</div>`
          : nothing}
      </ha-card>
    `;
  }

  private _renderHeader(): TemplateResult {
    const cfg = this._config!;
    const phase = this._phase;
    const snap = this._snap;
    let pill: TemplateResult | typeof nothing = nothing;
    if (phase && snap) {
      const onBattery = snap.supply.battery > 0 && snap.supply.battery >= snap.supply.solar;
      const d = phaseDisplay(phase.phase, onBattery);
      const alert = phase.phase === "outage" || phase.phase === "starting";
      pill = html`<div class="pill tone-${d.tone} ${alert ? "alert" : ""}" role="status" aria-live="polite">
        <span class="dot"></span>${d.label}${d.showDuration
          ? html`<span class="dur">${formatDuration(Date.now() - phase.since)}</span>`
          : nothing}
      </div>`;
    }
    const banner = this._banner;
    return html`<div class="header">
      ${cfg.title ? html`<div class="title">${cfg.title}</div>` : nothing} ${pill}
      ${banner
        ? keyed(
            banner.id,
            html`<div class="banner tone-${bannerTone(banner.event)}">
              ${bannerIcon(banner.event)}<span class="what">${banner.event.title}</span>
              <span class="when">${formatClock(banner.at, this._locale)}</span>
            </div>`,
          )
        : nothing}
    </div>`;
  }

  private _glowDefs(): SVGTemplateResult {
    const c = this._colors;
    return svg`<defs>${(Object.keys(c) as (keyof ColorConfig)[]).map(
      (k) => svg`<radialGradient id="emc-glow-${k}-${this._uid}">
        <stop offset="0" stop-color=${c[k]!} stop-opacity="0.42" />
        <stop offset="0.55" stop-color=${c[k]!} stop-opacity="0.12" />
        <stop offset="1" stop-color=${c[k]!} stop-opacity="0" />
      </radialGradient>`,
    )}</defs>`;
  }

  private _glow(key: keyof ColorConfig): string {
    return `url(#emc-glow-${key}-${this._uid})`;
  }

  private _renderDiagram(snap: Snapshot, L: Layout, views: DeviceView[]): TemplateResult {
    const cfg = this._config!;
    const c = this._colors;
    const s = L.s;
    const thr = (x?: { threshold?: number }) => x?.threshold ?? DEFAULT_SOURCE_THRESHOLD;
    const gridDown = snap.grid?.available === false;
    const dominant = dominantSource(snap.supply);
    const deviceColor = dominant ? c[dominant] : "var(--emc-muted)";

    const live: SVGTemplateResult[] = [];
    const liveWire = (wire: Wire | undefined, color: string, on: boolean, dead = false) => {
      if (wire && (on || dead)) live.push(svg`<path class=${dead ? "dead" : ""} d=${wire.d} style="--c:${color}" />`);
    };
    liveWire(L.wires.grid, c.grid, Math.abs(snap.flows.grid) > thr(cfg.grid), gridDown);
    liveWire(L.wires.generator, c.generator, snap.flows.generator > thr(cfg.generator));
    if (snap.ats) {
      const onGen = snap.ats === "generator";
      liveWire(L.wires.feed, onGen ? c.generator : c.grid, Math.abs(snap.flows.feed) > thr(onGen ? cfg.generator : cfg.grid));
    }
    liveWire(L.wires.solar, c.solar, snap.flows.solar > thr(cfg.solar));
    liveWire(L.wires.battery, c.battery, Math.abs(snap.flows.battery) > thr(cfg.battery));

    let fault: SVGTemplateResult | typeof nothing = nothing;
    if (gridDown && L.wires.grid) {
      const p = pointAt(L.wires.grid.samples, L.wires.grid.samples.length * 0.42);
      fault = placeGlyph(p.x, p.y, 15 * s, faultGlyph, "fault");
    }

    return html`
      <svg
        class="diagram"
        width=${L.w}
        height=${L.h}
        viewBox="0 0 ${L.w} ${L.h}"
        role="img"
        aria-label=${this._ariaSummary(snap)}
      >
        ${this._glowDefs()}
        ${L.ats
          ? svg`<rect class="ats-box" x=${L.ats.x - L.ats.w / 2} y=${L.ats.y - L.ats.h / 2} width=${L.ats.w}
              height=${L.ats.h} rx=${5 * s} stroke-width=${1.2 * s} />`
          : nothing}
        <g class="tracks">
          ${Object.values(L.wires).map((w) => svg`<path d=${w!.d} />`)}
          ${L.stem ? svg`<path d=${L.stem.d} />` : nothing} ${L.devices.map((d) => svg`<path d=${d.wire.d} />`)}
        </g>
        <g class="live">${live}</g>
        <g class="devlive" style="--c:${deviceColor}">
          ${L.stem && dominant && views.some((v) => v.active) ? svg`<path d=${L.stem.d} />` : nothing}
          ${L.devices.map((d, i) => (dominant && views[i]?.active ? svg`<path d=${d.wire.d} />` : nothing))}
        </g>
        ${fault}
        <g class="particles"></g>
        ${L.ats ? this._renderAts(snap, L) : nothing} ${this._renderSources(snap, L)} ${this._renderHome(snap, L)}
        ${L.devices.map((d, i) => (views[i] ? this._renderDeviceRing(views[i], d, deviceColor, dominant) : nothing))}
      </svg>
      <div class="overlay">
        ${this._renderLabels(snap, L)}
        ${L.devices.map((d, i) => (views[i] ? this._renderDevice(views[i], d, deviceColor, L) : nothing))}
        ${views.length > L.devices.length
          ? html`<div class="more">+${views.length - L.devices.length} more</div>`
          : nothing}
      </div>
    `;
  }

  private _renderAts(snap: Snapshot, L: Layout): SVGTemplateResult {
    const a = L.ats!;
    const s = L.s;
    const c = this._colors;
    const gridDown = snap.grid?.available === false;
    const pos = snap.ats;
    const angle = pos === "utility" ? a.angle : pos === "generator" ? -a.angle : 0;
    const color = pos === "generator" ? c.generator : pos === "utility" ? (gridDown ? c.outage : c.grid) : "var(--emc-muted)";
    const target = pos === "generator" ? a.generator : a.utility;
    const cfg = this._config!;
    const tapEntity = cfg.transfer_switch?.entity;
    return svg`<g class="ats" style="--c:${color}" role="button" tabindex="0"
        aria-label="Transfer switch: ${pos ?? "unknown"}"
        @click=${() => this._tap(cfg.transfer_switch, tapEntity ?? cfg.generator?.running)}
        @keydown=${(e: KeyboardEvent) => this._keyTap(e, () => this._tap(cfg.transfer_switch, tapEntity ?? cfg.generator?.running))}>
      <circle class="contact ${pos === "utility" && !gridDown ? "on" : ""}" cx=${a.utility.x} cy=${a.utility.y}
        r=${2.4 * s} stroke-width=${1.3 * s} style="--c:${c.grid}" />
      <circle class="contact ${pos === "generator" ? "on" : ""}" cx=${a.generator.x} cy=${a.generator.y}
        r=${2.4 * s} stroke-width=${1.3 * s} style="--c:${c.generator}" />
      <g class="blade" style="transform:rotate(${angle}deg);transform-origin:${a.pivot.x}px ${a.pivot.y}px">
        <line x1=${a.pivot.x} y1=${a.pivot.y} x2=${a.pivot.x - a.bladeLen} y2=${a.pivot.y} stroke-width=${3 * s} />
      </g>
      <circle class="pivot" cx=${a.pivot.x} cy=${a.pivot.y} r=${3.2 * s} />
      ${this._cutover > 0 && pos !== "open"
        ? keyed(
            this._cutover,
            svg`<circle class="spark" cx=${target.x} cy=${target.y} r=${5 * s} stroke-width=${1.6 * s} />`,
          )
        : nothing}
      <text class="ats-label" x=${a.x} y=${a.y + a.h / 2 + 10 * s} font-size=${7.5 * s}>ATS</text>
    </g>`;
  }

  private _node(
    key: SourceKey,
    geom: NodeGeom,
    state: string,
    glyph: SVGTemplateResult,
    label: string,
    onTap: () => void,
    extra: SVGTemplateResult | typeof nothing = nothing,
  ): SVGTemplateResult {
    const c = this._colors;
    return svg`<g class="node ${key} ${state}" style="--c:${c[key]}" role="button" tabindex="0" aria-label=${label}
        @click=${onTap} @keydown=${(e: KeyboardEvent) => this._keyTap(e, onTap)}>
      <circle class="glow" cx=${geom.x} cy=${geom.y} r=${geom.r * 2} fill=${this._glow(key)} />
      <circle class="disc" cx=${geom.x} cy=${geom.y} r=${geom.r} />
      <circle class="ring" cx=${geom.x} cy=${geom.y} r=${geom.r} />
      ${extra}
      ${placeGlyph(geom.x, geom.y, geom.r * 1.12, glyph)}
    </g>`;
  }

  private _renderSources(snap: Snapshot, L: Layout): SVGTemplateResult[] {
    const cfg = this._config!;
    const out: SVGTemplateResult[] = [];
    const thr = (x?: { threshold?: number }) => x?.threshold ?? DEFAULT_SOURCE_THRESHOLD;
    const s = L.s;

    if (L.nodes.grid && snap.grid) {
      const g = snap.grid;
      const state =
        g.available === false ? "down" : Math.abs(snap.flows.grid) > thr(cfg.grid) ? "active" : g.available ? "idle" : "";
      out.push(
        this._node("grid", L.nodes.grid, state, pylonGlyph(g.available === false), "Utility", () =>
          this._tap(cfg.grid, cfg.grid?.entity ?? cfg.grid?.status ?? cfg.grid?.voltage),
        ),
      );
    }

    if (L.nodes.generator && snap.generator) {
      const gen = snap.generator;
      const geom = L.nodes.generator;
      const supplying = gen.supplying > thr(cfg.generator);
      const state = gen.starting ? "starting" : supplying ? "active running" : gen.running ? "running" : "standby";
      let gauge: SVGTemplateResult | typeof nothing = nothing;
      if (gen.loadPct !== null && gen.running) {
        const r = geom.r + 4.5 * s;
        const circ = 2 * Math.PI * r;
        const pct = Math.min(100, Math.max(0, gen.loadPct));
        gauge = svg`
          <circle class="gauge-track" cx=${geom.x} cy=${geom.y} r=${r} stroke-width=${2.6 * s} />
          <circle class="gauge ${pct >= 85 ? "hot" : ""}" cx=${geom.x} cy=${geom.y} r=${r} stroke-width=${2.6 * s}
            stroke-dasharray="${(circ * pct) / 100} ${circ}" transform="rotate(-90 ${geom.x} ${geom.y})" />`;
      }
      out.push(
        this._node(
          "generator",
          geom,
          state,
          generatorGlyph(gen.running),
          "Generator",
          () => this._tap(cfg.generator, cfg.generator?.entity ?? cfg.generator?.running),
          gauge,
        ),
      );
    }

    if (L.nodes.solar && snap.solar) {
      const active = snap.flows.solar > thr(cfg.solar);
      out.push(
        this._node("solar", L.nodes.solar, active ? "active" : "idle", solarGlyph, "Solar", () =>
          this._tap(cfg.solar, cfg.solar?.entity),
        ),
      );
    }

    if (L.nodes.battery && snap.battery) {
      const b = snap.battery;
      const flow = snap.flows.battery;
      const active = Math.abs(flow) > thr(cfg.battery);
      out.push(
        this._node(
          "battery",
          L.nodes.battery,
          active ? "active" : "idle",
          batteryGlyph(b.soc, flow < -thr(cfg.battery)),
          "Battery",
          () => this._tap(cfg.battery, cfg.battery?.soc ?? cfg.battery?.entity),
        ),
      );
    }
    return out;
  }

  private _renderHome(snap: Snapshot, L: Layout): SVGTemplateResult {
    const cfg = this._config!;
    const c = this._colors;
    const h = L.nodes.home;
    const s = L.s;
    const total = SOURCE_ORDER.reduce((sum, k) => sum + snap.supply[k], 0);
    const phase = this._phase?.phase;
    const dark = (phase === "outage" || phase === "starting") && total <= DEFAULT_SOURCE_THRESHOLD;
    const dominant = dominantSource(snap.supply);

    const segs: SVGTemplateResult[] = [];
    if (total > 0) {
      const parts = SOURCE_ORDER.filter((k) => snap.supply[k] / total >= 0.02);
      const gap = parts.length > 1 ? 7 : 0;
      let start = 0;
      for (const k of parts) {
        const sweep = (snap.supply[k] / total) * 360;
        if (sweep - gap > 1) {
          segs.push(svg`<path class="seg" d=${arcPath(h.x, h.y, h.r, start + gap / 2, start + sweep - gap / 2)}
            stroke=${c[k]} stroke-width=${4.2 * s} />`);
        }
        start += sweep;
      }
    }

    const f = this._fmt(snap.home.power);
    const amps = formatCurrent(snap.home.current, this._locale, snap.home.currentEstimated);
    const flickerCls = this._outageSeq > 0 ? "flicker" : "";
    return svg`<g class="node home ${dark ? "dark" : ""}" role="button" tabindex="0" aria-label="Home"
        @click=${() => this._tap(cfg.home, cfg.home?.entity)}
        @keydown=${(e: KeyboardEvent) => this._keyTap(e, () => this._tap(cfg.home, cfg.home?.entity))}>
      ${dominant ? svg`<circle cx=${h.x} cy=${h.y} r=${h.r * 1.75} fill=${this._glow(dominant)} />` : nothing}
      <circle class="disc" cx=${h.x} cy=${h.y} r=${h.r} />
      <circle class="ring-base" cx=${h.x} cy=${h.y} r=${h.r} stroke-width=${4.2 * s} />
      ${segs}
      ${keyed(
        this._outageSeq,
        svg`<g class=${flickerCls}>${placeGlyph(h.x, h.y - h.r * 0.3, h.r * 0.74, homeGlyph)}</g>`,
      )}
      <text class="home-value" x=${h.x} y=${h.y + h.r * (amps ? 0.3 : 0.42)} font-size=${14 * s}>
        ${dark ? "No power" : f.value}<tspan class="u" font-size=${10 * s} dx=${2 * s}>${dark ? "" : f.unit}</tspan>
      </text>
      ${amps && !dark
        ? svg`<text class="home-sub" x=${h.x} y=${h.y + h.r * 0.62} font-size=${9.5 * s}>${amps}</text>`
        : nothing}
    </g>`;
  }

  private _renderLabels(snap: Snapshot, L: Layout): TemplateResult[] {
    const cfg = this._config!;
    const c = this._colors;
    const loc = this._locale;
    const out: TemplateResult[] = [];
    const thr = (x?: { threshold?: number }) => x?.threshold ?? DEFAULT_SOURCE_THRESHOLD;
    const pos = (g: NonNullable<Layout["labels"]["grid"]>, color: string, onTap: () => void, body: TemplateResult) =>
      html`<div
        class="label ${g.anchor === "middle" ? "mid" : ""} ${g.align}"
        style="left:${g.x}px;top:${g.y}px;max-width:${g.maxWidth}px;--c:${color}"
        @click=${onTap}
      >
        ${body}
      </div>`;
    const detail = (parts: (string | null | false)[]) => {
      const shown = parts.filter((p): p is string => !!p);
      return shown.length ? html`<div class="detail">${shown.map((p) => html`<span>${p}</span>`)}</div>` : nothing;
    };
    const legs = (values: number[]) =>
      values.length ? values.map((a, i) => `L${i + 1} ${formatNumber(a, 1, loc)} A`).join("\u2002") : null;

    if (L.labels.grid && snap.grid) {
      const g = snap.grid;
      const onGen = snap.ats === "generator";
      const connected = g.available !== false && !onGen;
      let value: TemplateResult;
      if (g.available === false) value = html`<div class="value alarm">Outage</div>`;
      else if (onGen) value = html`<div class="value quiet">${g.available ? "Available" : "Disconnected"}</div>`;
      else {
        const exporting = (g.power ?? 0) < -thr(cfg.grid);
        value = html`<div class="value">${this._power(g.power === null ? null : Math.abs(g.power), exporting ? "export" : undefined)}</div>`;
      }
      out.push(
        pos(
          L.labels.grid,
          c.grid,
          () => this._tap(cfg.grid, cfg.grid?.entity ?? cfg.grid?.status),
          html`<div class="name">${cfg.grid?.name ?? "Utility"}</div>
            ${value}
            ${detail([
              formatVoltage(g.voltage, loc),
              // Amps and hertz mean nothing on a dead or disconnected line.
              connected && (legs(g.legs) ?? formatCurrent(g.current, loc, g.currentEstimated)),
              g.available !== false && formatFrequency(g.frequency, loc),
            ])}`,
        ),
      );
    }

    if (L.labels.generator && snap.generator) {
      const gen = snap.generator;
      const supplying = gen.supplying > thr(cfg.generator);
      let value: TemplateResult;
      if (supplying) {
        const load = gen.loadPct !== null ? `${formatNumber(gen.loadPct, 0, loc)}% load` : undefined;
        value = html`<div class="value accent">${this._power(gen.supplying, load)}</div>`;
      }
      else if (gen.starting) value = html`<div class="value quiet accent">Starting…</div>`;
      else if (gen.running) value = html`<div class="value quiet accent">Running</div>`;
      else value = html`<div class="value quiet">${gen.statusText ? titleCase(gen.statusText) : "Standby"}</div>`;
      const fuel = gen.fuel
        ? html`<span class="chip ${gen.fuel.unit === "%" && gen.fuel.value < 25 ? "low" : ""}"
            >Fuel ${formatNumber(gen.fuel.value, 0, loc)}${gen.fuel.unit === "%" ? "%" : ` ${gen.fuel.unit}`}</span
          >`
        : nothing;
      out.push(
        pos(
          L.labels.generator,
          c.generator,
          () => this._tap(cfg.generator, cfg.generator?.entity ?? cfg.generator?.running),
          html`<div class="name">${cfg.generator?.name ?? "Generator"} ${fuel}</div>
            ${value}
            ${gen.running
              ? detail([
                  formatVoltage(gen.voltage, loc),
                  supplying && (legs(gen.legs) ?? formatCurrent(gen.current, loc, gen.currentEstimated)),
                  formatFrequency(gen.frequency, loc),
                ])
              : nothing}`,
        ),
      );
    }

    if (L.labels.solar && snap.solar) {
      out.push(
        pos(
          L.labels.solar,
          c.solar,
          () => this._tap(cfg.solar, cfg.solar?.entity),
          html`<div class="name">${cfg.solar?.name ?? "Solar"}</div>
            <div class="value">${this._power(snap.solar.power)}</div>`,
        ),
      );
    }

    if (L.labels.battery && snap.battery) {
      const b = snap.battery;
      const flow = snap.flows.battery;
      const t = thr(cfg.battery);
      const state = flow < -t ? "Charging" : flow > t ? "Discharging" : "Idle";
      const f = this._fmt(Math.abs(flow));
      out.push(
        pos(
          L.labels.battery,
          c.battery,
          () => this._tap(cfg.battery, cfg.battery?.soc ?? cfg.battery?.entity),
          html`<div class="name">${cfg.battery?.name ?? "Battery"}</div>
            <div class="value">
              ${b.soc !== null
                ? html`${formatNumber(b.soc, 0, loc)}<span class="unit">%</span>`
                : this._power(b.power)}
            </div>
            <div class="detail">${state === "Idle" ? state : `${state} ${f.value} ${f.unit}`}</div>`,
        ),
      );
    }
    return out;
  }

  private _renderDeviceRing(
    v: DeviceView,
    d: Layout["devices"][number],
    color: string,
    dominant: SourceKey | null,
  ): SVGTemplateResult {
    const s = this._layout!.s;
    const circ = 2 * Math.PI * d.r;
    const share = v.active ? Math.max(0.04, v.share) : 0;
    return svg`
      ${dominant
        ? svg`<circle class="dev-glow ${v.high ? "on" : ""}" cx=${d.x} cy=${d.y} r=${d.r * 2} fill=${this._glow(dominant)} />`
        : nothing}
      <circle class="dev-ring" cx=${d.x} cy=${d.y} r=${d.r} stroke-width=${1.4 * s} />
      <circle class="dev-share" cx=${d.x} cy=${d.y} r=${d.r} stroke-width=${2.4 * s} style="--c:${color}"
        stroke-dasharray="${circ * share} ${circ}" transform="rotate(-90 ${d.x} ${d.y})" />`;
  }

  private _renderDevice(v: DeviceView, d: Layout["devices"][number], color: string, L: Layout): TemplateResult {
    const s = L.s;
    const f = this._fmt(v.power);
    const amps = v.current !== null ? formatCurrent(v.current, this._locale) : null;
    const pct = v.active && v.share > 0 ? ` · ${Math.round(v.share * 100)}% of home` : "";
    const onTap = () => this._tap(v.tap, v.entity, v.toggle);
    return html`<div
      class="device ${v.active ? "active" : ""} ${v.high ? "high" : ""}"
      style="left:${d.x}px;top:${d.y - d.r}px;width:${d.slot - 4 * s}px;--c:${color}"
      title="${v.name}: ${f.value} ${f.unit}${amps ? ` · ${amps}` : ""}${pct}"
      role="button"
      tabindex="0"
      @click=${onTap}
      @keydown=${(e: KeyboardEvent) => this._keyTap(e, onTap)}
    >
      <div class="dev-icon" style="width:${2 * d.r}px;height:${2 * d.r}px">
        <ha-icon .icon=${v.icon}></ha-icon>
      </div>
      <div class="dev-value">
        ${v.missing ? html`<span class="warnmark">⚠</span>` : html`${f.value}<span class="unit">${f.unit}</span>`}
      </div>
      ${amps ? html`<div class="dev-amps">${amps}</div>` : nothing}
      <div class="dev-name">${v.name}</div>
    </div>`;
  }

  private _renderTrend(): TemplateResult {
    const trend = this._trend!;
    const cfg = this._config!;
    const c = this._colors;
    const now = Date.now();
    const pts = trend.points(now);
    const stats = trend.stats(now);
    const n = pts.length;
    const H = 40;
    const top = Math.max(1, ...pts.map((p) => p?.max ?? 0)) * 1.08;
    const y = (w: number) => H - (Math.max(0, w) / top) * (H - 2);
    const colorOf = (src: TrendSource) => (src === "none" ? c.outage : c[src]);

    // Split the series into runs of the same source so each is shaded in its colour.
    const areas: SVGTemplateResult[] = [];
    const lines: SVGTemplateResult[] = [];
    const dark: SVGTemplateResult[] = [];
    const seen = new Set<TrendSource>();
    let i = 0;
    while (i < n) {
      const p = pts[i];
      if (!p) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < n && pts[j + 1] && pts[j + 1]!.source === p.source) j++;
      seen.add(p.source);
      if (p.source === "none") {
        dark.push(svg`<rect class="trend-dark" x=${i} y="0" width=${j - i + 1} height=${H} />`);
      } else {
        // Extend to the next point so neighbouring runs meet without a gap.
        const endIdx = j + 1 < n && pts[j + 1] ? j + 1 : j;
        let line = "";
        for (let k = i; k <= endIdx; k++) line += `${k === i ? "M" : "L"}${k + 0.5} ${y(pts[k]!.avg).toFixed(2)}`;
        if (endIdx === i) line += `L${i + 1} ${y(p.avg).toFixed(2)}`;
        const x0 = i + 0.5;
        const x1 = endIdx === i ? i + 1 : endIdx + 0.5;
        areas.push(svg`<path d="${line}L${x1} ${H}L${x0} ${H}Z" fill="url(#emc-trend-${p.source}-${this._uid})" />`);
        lines.push(svg`<path class="trend-line" d=${line} stroke=${colorOf(p.source)} />`);
      }
      i = j + 1;
    }

    const hover = this._hoverIndex !== null ? pts[this._hoverIndex] : null;
    const hoverT = this._hoverIndex !== null ? now - (n - 1 - this._hoverIndex) * trend.bucketMs : 0;
    const f = (w: number | null) => {
      const x = this._fmt(w);
      return html`<b>${x.value} ${x.unit}</b>`;
    };
    const intervalS = cfg.update_interval ?? 2;

    return html`<div class="trend">
      <div class="trend-head">
        <span>Load · ${formatWindow(cfg.trend_window ?? 60)}</span>
        <span>avg ${f(stats.avg)}</span>
        <span>peak ${f(stats.peak)}</span>
        <span class="grow"></span>
        <span>${intervalS > 0 ? `every ${intervalS}s` : "live"}</span>
      </div>
      <div
        class="trend-plot"
        @pointermove=${this._onTrendPointer}
        @pointerdown=${this._onTrendPointer}
        @pointerleave=${() => {
          this._hoverIndex = null;
          this.requestUpdate();
        }}
      >
        <svg viewBox="0 0 ${n} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            ${SOURCE_ORDER.map(
              (k) => svg`<linearGradient id="emc-trend-${k}-${this._uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color=${c[k]} stop-opacity="0.38" />
                <stop offset="1" stop-color=${c[k]} stop-opacity="0.02" />
              </linearGradient>`,
            )}
          </defs>
          ${dark} ${areas} ${lines}
          <line class="trend-base" x1="0" y1=${H - 0.5} x2=${n} y2=${H - 0.5} />
          ${this._hoverIndex !== null
            ? svg`<line class="trend-cursor" x1=${this._hoverIndex + 0.5} y1="0" x2=${this._hoverIndex + 0.5} y2=${H} />`
            : nothing}
        </svg>
        ${trend.size === 0 || pts.every((p) => !p) ? html`<div class="trend-empty">Collecting data…</div>` : nothing}
        ${this._hoverIndex !== null
          ? html`<div class="trend-tip" style="left:${((this._hoverIndex + 0.5) / n) * 100}%">
              ${hover
                ? html`<i style="--c:${colorOf(hover.source)}"></i>${formatClock(hoverT, this._locale)} ·
                    ${f(hover.avg)} · ${SOURCE_NAMES[hover.source]}`
                : html`${formatClock(hoverT, this._locale)} · no data`}
            </div>`
          : nothing}
      </div>
      <div class="legend">
        ${(["grid", "generator", "solar", "battery", "none"] as TrendSource[])
          .filter((k) => seen.has(k))
          .map(
            (k) =>
              html`<span
                ><i style="--c:${colorOf(k)}"></i>${k === "grid" ? cfg.grid?.name ?? SOURCE_NAMES.grid : SOURCE_NAMES[k]}${k ===
                  "generator" && stats.generatorMs > 0
                  ? ` ${formatDuration(stats.generatorMs)}`
                  : k === "none" && stats.outageMs > 0
                    ? ` ${formatDuration(stats.outageMs)}`
                    : ""}</span
              >`,
          )}
      </div>
    </div>`;
  }

  private _onTrendPointer = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const n = this._trend?.count ?? 0;
    if (!n || rect.width === 0) return;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * n)));
    if (idx !== this._hoverIndex) {
      this._hoverIndex = idx;
      this.requestUpdate();
    }
  };

  private _ariaSummary(snap: Snapshot): string {
    const parts: string[] = [];
    const phase = this._phase ? phaseDisplay(this._phase.phase, snap.supply.battery > 0).label : "";
    if (phase) parts.push(phase);
    const home = this._fmt(snap.home.power);
    parts.push(`Home ${home.value} ${home.unit}`);
    for (const k of SOURCE_ORDER) {
      if (snap.supply[k] > 0) {
        const f = this._fmt(snap.supply[k]);
        parts.push(`${SOURCE_NAMES[k]} ${f.value} ${f.unit}`);
      }
    }
    return parts.join(". ");
  }
}

function trendSource(snap: Snapshot): TrendSource {
  const d = dominantSource(snap.supply);
  if (d) return d;
  if (snap.ats === "generator") return "generator";
  if (snap.grid && snap.grid.available !== false) return "grid";
  if (!snap.grid && snap.generator?.running) return "generator";
  return snap.grid ? "none" : "grid";
}

function bannerTone(e: PhaseEvent): string {
  return e.kind === "outage" ? "outage" : e.kind === "generator" || e.kind === "info" ? "generator" : "grid";
}

function bannerIcon(e: PhaseEvent): TemplateResult {
  const glyph = e.kind === "outage" ? faultGlyph : e.kind === "utility" ? pylonGlyph(false) : generatorGlyph(false);
  const cls = e.kind === "outage" ? "" : "glyph";
  return html`<svg viewBox="0 0 24 24" aria-hidden="true"><g class=${cls}>${glyph}</g></svg>`;
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, EnergyMonitorCard);
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
  interface HTMLElementTagNameMap {
    "energy-monitor-card": EnergyMonitorCard;
  }
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Energy Monitor Card",
    description: "Utility, generator, solar and battery power flow with transfer-switch cut-over.",
    preview: true,
  });
}

console.info(
  `%c ENERGY-MONITOR-CARD %c v${VERSION} `,
  "color:#fff;background:#ff8a1f;font-weight:700;border-radius:4px 0 0 4px;padding:2px 4px",
  "color:#ff8a1f;background:#1c1d21;border-radius:0 4px 4px 0;padding:2px 4px",
);

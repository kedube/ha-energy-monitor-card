// Standalone preview: stubs the two Home Assistant elements the card uses
// (ha-card, ha-icon), fakes a `hass` object and simulates an outage timeline.

// ── HA element stubs ─────────────────────────────────────────

class HaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>
      :host { display:block; background: var(--ha-card-background); border-radius: 12px;
              border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    </style><slot></slot>`;
  }
}
customElements.define("ha-card", HaCard);

let mdi = null;
const mdiReady = import("https://cdn.jsdelivr.net/npm/@mdi/js@7.4.47/+esm")
  .then((m) => (mdi = m))
  .catch(() => null);

class HaIcon extends HTMLElement {
  set icon(value) {
    this._icon = value;
    this.render();
  }
  get icon() {
    return this._icon;
  }
  connectedCallback() {
    this.render();
    mdiReady.then(() => this.render());
  }
  render() {
    const name = String(this._icon ?? "").replace(/^mdi:/, "");
    const key = "mdi" + name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
    const path = mdi?.[key] ?? "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z";
    this.innerHTML = `<svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);display:block">
      <path fill="currentColor" d="${path}"/></svg>`;
  }
}
customElements.define("ha-icon", HaIcon);

await import("../dist/energy-monitor-card.js");

// ── Simulation ───────────────────────────────────────────────

const rand = (a, b) => a + Math.random() * (b - a);
const jitter = (v, pct) => v * (1 + rand(-pct, pct));

const LOADS = [
  { id: "hvac", name: "HVAC", icon: "mdi:hvac", watts: 3400, on: true, high: 3000 },
  { id: "ev_charger", name: "EV charger", icon: "mdi:car-electric", watts: 7200, on: true, high: 5000 },
  { id: "water_heater", name: "Water heater", icon: "mdi:water-boiler", watts: 4500, on: false, high: 4000 },
  { id: "well_pump", name: "Well pump", icon: "mdi:water-pump", watts: 1150, on: true },
  { id: "dryer", name: "Dryer", icon: "mdi:tumble-dryer", watts: 5200, on: false, high: 4000 },
  { id: "range", name: "Range", icon: "mdi:stove", watts: 2600, on: false },
];

const sim = {
  gridUp: true,
  genStatus: "Ready", // Ready | Cranking | Running | Exercising
  ats: "utility",
  solar: true,
  battery: true,
  soc: 78,
  fuel: 72,
  speed: 1,
  timers: [],
};

const states = {};
const setState = (id, state, attributes = {}) => {
  const prev = states[id];
  const now = new Date().toISOString();
  const s = String(state);
  states[id] = {
    entity_id: id,
    state: s,
    attributes: { ...(prev?.attributes ?? {}), ...attributes },
    last_changed: prev && prev.state === s ? prev.last_changed : now,
    last_updated: now,
  };
};

const W = { unit_of_measurement: "W", device_class: "power", state_class: "measurement" };
const V = { unit_of_measurement: "V", device_class: "voltage" };
const A = { unit_of_measurement: "A", device_class: "current" };
const HZ = { unit_of_measurement: "Hz", device_class: "frequency" };

function step() {
  const genRunning = sim.genStatus !== "Ready";
  const onGen = sim.ats === "generator";
  const powered = (sim.gridUp && sim.ats === "utility") || onGen;
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  const daylight = Math.max(0, Math.sin(((hour - 6) / 13) * Math.PI));
  const solar = sim.solar && (sim.gridUp || sim.battery) ? jitter(600 + 2600 * Math.max(daylight, 0.45), 0.05) : 0;

  let devices = 0;
  for (const l of LOADS) {
    const w = powered || sim.battery ? (l.on ? jitter(l.watts, 0.04) : rand(0, 4)) : 0;
    devices += w;
    setState(`sensor.${l.id}_power`, w.toFixed(0), { ...W, friendly_name: `${l.name} power` });
  }
  setState("sensor.hvac_current", (Number(states["sensor.hvac_power"].state) / 240).toFixed(1), A);
  const base = powered || sim.battery ? jitter(620, 0.12) : 0;
  const home = devices + base;

  let battery = 0;
  if (sim.battery) {
    if (!sim.gridUp && !onGen) battery = Math.max(0, home - solar);
    else if (solar > 400 && sim.soc < 100) battery = -Math.min(1800, solar * 0.6);
    sim.soc = Math.min(100, Math.max(5, sim.soc - battery / 36000));
  }

  const net = home - solar - battery;
  const grid = sim.gridUp && sim.ats === "utility" ? net : 0;
  const gen = onGen ? Math.max(0, net) : 0;
  const gridV = sim.gridUp ? jitter(240.2, 0.004) : 0;
  const genV = genRunning ? jitter(241, 0.006) : 0;
  if (genRunning) sim.fuel = Math.max(0, sim.fuel - 0.01 * sim.speed);

  setState("sensor.grid_power", grid.toFixed(0), { ...W, friendly_name: "Grid power" });
  setState("sensor.grid_voltage", gridV.toFixed(1), V);
  setState("sensor.grid_frequency", sim.gridUp ? jitter(60, 0.0004).toFixed(2) : "0", HZ);
  setState("sensor.grid_l1_current", Math.max(0, (grid / 240) * rand(1.02, 1.1)).toFixed(1), A);
  setState("sensor.grid_l2_current", Math.max(0, (grid / 240) * rand(0.9, 0.98)).toFixed(1), A);
  setState("binary_sensor.utility_power", sim.gridUp ? "on" : "off", { device_class: "power" });

  // Generator power is reported in kW to exercise unit conversion.
  setState("sensor.generator_power", (gen / 1000).toFixed(2), { ...W, unit_of_measurement: "kW" });
  setState("sensor.generator_voltage", genV.toFixed(1), V);
  setState("sensor.generator_current", (gen / 240).toFixed(1), A);
  setState("sensor.generator_frequency", genRunning ? jitter(60.1, 0.002).toFixed(1) : "0", HZ);
  setState("sensor.generator_status", sim.genStatus);
  setState("sensor.generator_fuel", sim.fuel.toFixed(0), { unit_of_measurement: "%" });
  setState("sensor.transfer_switch", sim.ats);

  setState("sensor.solar_power", solar.toFixed(0), W);
  setState("sensor.battery_power", battery.toFixed(0), W);
  setState("sensor.battery_soc", sim.soc.toFixed(0), { unit_of_measurement: "%", device_class: "battery" });
}

// ── Scenario timeline ────────────────────────────────────────

const logEl = document.getElementById("log");
function log(msg) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()}  ${msg}`;
  logEl.prepend(li);
}

function schedule(ms, fn) {
  sim.timers.push(setTimeout(fn, ms / sim.speed));
}
function clearTimeline() {
  sim.timers.forEach(clearTimeout);
  sim.timers = [];
}

function cutPower() {
  clearTimeline();
  sim.gridUp = false;
  log("Utility lost");
  schedule(3000, () => {
    sim.genStatus = "Cranking";
    log("Generator cranking");
  });
  schedule(6000, () => {
    sim.genStatus = "Running";
    log("Generator running, warming up");
  });
  schedule(10000, () => {
    sim.ats = "generator";
    log("ATS transferred to generator");
  });
}

function restore() {
  clearTimeline();
  sim.gridUp = true;
  log("Utility restored");
  if (sim.ats === "generator") {
    schedule(8000, () => {
      sim.ats = "utility";
      log("ATS re-transferred to utility");
    });
    schedule(20000, () => {
      sim.genStatus = "Ready";
      log("Generator cooldown complete");
    });
  } else if (sim.genStatus !== "Ready") {
    schedule(4000, () => {
      sim.genStatus = "Ready";
      log("Generator stopped");
    });
  }
}

function exercise() {
  if (!sim.gridUp) return;
  clearTimeline();
  sim.genStatus = "Exercising";
  log("Generator exercise started");
  schedule(20000, () => {
    sim.genStatus = "Ready";
    log("Generator exercise finished");
  });
}

// ── Fake recorder history for the trend strip ────────────────

function fakeHistory(msg) {
  const start = Date.parse(msg.start_time);
  const end = Date.parse(msg.end_time);
  const out = {};
  const rows = (id) => (out[id] = out[id] ?? []);
  const span = end - start;
  for (let t = start; t <= end; t += 20000) {
    const f = (t - start) / span;
    const outage = f > 0.3 && f < 0.34;
    const onGen = f >= 0.34 && f < 0.62;
    const load = 3000 + 2500 * Math.sin(f * 9) ** 2 + rand(-200, 200) + (f > 0.8 ? 4000 : 0);
    const lu = t / 1000;
    rows("binary_sensor.utility_power").push({ s: outage || onGen ? "off" : "on", lu });
    rows("sensor.transfer_switch").push({ s: onGen ? "generator" : "utility", lu });
    rows("sensor.generator_status").push({ s: outage ? "Cranking" : onGen ? "Running" : "Ready", lu });
    rows("sensor.grid_power").push({ s: outage || onGen ? "0" : String(load - 900), lu });
    rows("sensor.generator_power").push({ s: onGen ? String(load / 1000) : "0", lu });
    rows("sensor.solar_power").push({ s: onGen || outage ? "0" : "900", lu });
    rows("sensor.battery_power").push({ s: "0", lu });
    rows("sensor.grid_voltage").push({ s: outage || onGen ? "0" : "240", lu });
  }
  return out;
}

function makeHass() {
  return {
    states: { ...states },
    locale: { language: "en-US" },
    themes: { darkMode: document.body.classList.contains("dark") },
    callWS: async (msg) => (msg.type === "history/history_during_period" ? fakeHistory(msg) : {}),
    callService: async (domain, service, data) => log(`service ${domain}.${service} ${JSON.stringify(data)}`),
  };
}

// ── Cards ────────────────────────────────────────────────────

const devices = LOADS.map((l) => ({
  entity: `sensor.${l.id}_power`,
  name: l.name,
  icon: l.icon,
  ...(l.high ? { high_load: l.high } : {}),
  ...(l.id === "hvac" ? { current: "sensor.hvac_current" } : {}),
}));

const fullConfig = {
  type: "custom:energy-monitor-card",
  title: "Home power",
  update_interval: 2,
  trend_window: 30,
  grid: {
    entity: "sensor.grid_power",
    status: "binary_sensor.utility_power",
    voltage: "sensor.grid_voltage",
    current_legs: ["sensor.grid_l1_current", "sensor.grid_l2_current"],
    frequency: "sensor.grid_frequency",
  },
  generator: {
    entity: "sensor.generator_power",
    running: "sensor.generator_status",
    voltage: "sensor.generator_voltage",
    current: "sensor.generator_current",
    frequency: "sensor.generator_frequency",
    fuel: "sensor.generator_fuel",
    rated_power: 22000,
  },
  transfer_switch: { entity: "sensor.transfer_switch" },
  solar: { entity: "sensor.solar_power" },
  battery: { entity: "sensor.battery_power", soc: "sensor.battery_soc" },
  devices,
  show_other: true,
};

const minimalConfig = {
  type: "custom:energy-monitor-card",
  update_interval: 1,
  trend_window: 30,
  grid: { entity: "sensor.grid_power", voltage: "sensor.grid_voltage" },
  generator: { entity: "sensor.generator_power", running: "sensor.generator_status", voltage: "sensor.generator_voltage" },
  devices: devices.slice(0, 4),
  sort_devices: true,
};

const phoneConfig = { ...fullConfig, title: undefined, devices: devices.slice(0, 5), show_other: false };

function mount(hostId, config) {
  const card = document.createElement("energy-monitor-card");
  card.setConfig(config);
  const host = document.getElementById(hostId);
  host.appendChild(card);
  if (host.style.height) card.style.height = "100%";
  return card;
}

step();
const cards = [mount("main", fullConfig), mount("minimal", minimalConfig), mount("phone", phoneConfig)];
const push = () => {
  const hass = makeHass();
  cards.forEach((c) => (c.hass = hass));
};
push();
setInterval(() => {
  step();
  push();
}, 1000);

// ── Controls ─────────────────────────────────────────────────

document.getElementById("cut").onclick = () => {
  cutPower();
  step();
  push();
};
document.getElementById("restore").onclick = () => {
  restore();
  step();
  push();
};
document.getElementById("exercise").onclick = () => {
  exercise();
  step();
  push();
};

const loadsEl = document.getElementById("loads");
for (const l of LOADS) {
  const b = document.createElement("button");
  b.textContent = l.name;
  b.classList.toggle("on", l.on);
  b.onclick = () => {
    l.on = !l.on;
    b.classList.toggle("on", l.on);
    step();
    push();
  };
  loadsEl.appendChild(b);
}

for (const key of ["solar", "battery"]) {
  const b = document.getElementById(key);
  b.onclick = () => {
    sim[key] = !sim[key];
    b.classList.toggle("on", sim[key]);
    step();
    push();
  };
}

document.getElementById("theme").onclick = (e) => {
  const dark = document.body.classList.toggle("dark");
  document.body.classList.toggle("light", !dark);
  e.target.textContent = dark ? "Light theme" : "Dark theme";
  push();
};

document.getElementById("speed").onclick = (e) => {
  sim.speed = sim.speed === 1 ? 4 : 1;
  e.target.classList.toggle("on", sim.speed > 1);
};

const widthInput = document.getElementById("width");
widthInput.oninput = () => {
  document.getElementById("main-frame").style.width = `${widthInput.value}px`;
  document.getElementById("width-out").textContent = `${widthInput.value}px`;
};

// Hooks for automated screenshots.
window.demo = { sim, cutPower, restore, exercise, step, push, LOADS };

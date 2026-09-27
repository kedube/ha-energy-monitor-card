// Visual editor schema consumed by Home Assistant's built-in ha-form
// (returned from the card's static getConfigForm()).

const powerEntity = { entity: { filter: [{ domain: "sensor", device_class: "power" }] } };
const voltageEntity = { entity: { filter: [{ domain: "sensor", device_class: "voltage" }] } };
const currentEntity = { entity: { filter: [{ domain: "sensor", device_class: "current" }] } };
const frequencyEntity = { entity: { filter: [{ domain: "sensor", device_class: "frequency" }] } };
const anyEntity = { entity: {} };
const watts = (max = 100000) => ({ number: { min: 0, max, step: 1, mode: "box", unit_of_measurement: "W" } });
const bool = { boolean: {} };
const text = { text: {} };

const tapFields = [
  {
    name: "tap_action",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "more-info", label: "More info" },
          { value: "navigate", label: "Navigate" },
          { value: "none", label: "Nothing" },
        ],
      },
    },
  },
  { name: "navigation_path", selector: text },
];

const LABELS: Record<string, string> = {
  title: "Title",
  update_interval: "Update interval",
  trend_window: "Trend window",
  power_unit: "Power unit",
  decimals: "Decimal places (kW)",
  max_power: "Full-speed flow power",
  max_devices: "Maximum devices shown",
  sort_devices: "Sort devices by load",
  show_other: "Show unmeasured load as a device",
  animation: "Animate power flow",
  hide_background: "Hide card background",
  cooldown_window: "Cooldown window",
  grid: "Utility (grid)",
  generator: "Generator",
  transfer_switch: "Transfer switch",
  home: "Home",
  solar: "Solar",
  battery: "Battery",
  devices: "High-draw devices",
  colors: "Colours",
  entity: "Power sensor",
  import_entity: "Import power sensor",
  export_entity: "Export power sensor",
  charge_entity: "Charge power sensor",
  discharge_entity: "Discharge power sensor",
  voltage: "Voltage sensor",
  current: "Current sensor",
  current_legs: "Per-leg current sensors",
  frequency: "Frequency sensor",
  status: "Status entity",
  outage_voltage: "Outage below voltage",
  invert: "Invert sign",
  threshold: "Idle below",
  name: "Name",
  running: "Running entity",
  fuel: "Fuel level sensor",
  rated_power: "Rated output",
  soc: "State of charge sensor",
  high_load: "Heavy load at",
  icon: "Icon",
  switch_entity: "Switch entity",
  tap_action: "Tap action",
  navigation_path: "Navigation path",
};

const HELPERS: Record<string, string> = {
  update_interval: "Seconds between readout and trend refreshes. 0 updates live. Source changes always show immediately.",
  trend_window: "Minutes of load history in the trend strip. 0 hides it.",
  outage_voltage: "Used when no status entity is set. Measure voltage on the utility side of the transfer switch.",
  status: "On while utility power is present. Most reliable way to detect an outage.",
  running: "binary_sensor, or a status sensor such as Generac's (Running, Exercising, Cranking…).",
  rated_power: "Enables the load gauge around the generator.",
  entity: "Positive = importing (grid) / discharging (battery).",
  cooldown_window: "Minutes after returning to utility during which a still-running generator is shown as cooling down rather than exercising. Default 5.",
};

export function configForm() {
  return {
    schema: [
      { name: "title", selector: text },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "update_interval", selector: { number: { min: 0, max: 600, step: 1, mode: "box", unit_of_measurement: "s" } } },
          { name: "trend_window", selector: { number: { min: 0, max: 1440, step: 5, mode: "box", unit_of_measurement: "min" } } },
          { name: "power_unit", selector: { select: { mode: "dropdown", options: ["auto", "W", "kW"] } } },
          { name: "decimals", selector: { number: { min: 0, max: 3, step: 1, mode: "box" } } },
        ],
      },
      {
        name: "grid",
        type: "expandable",
        flatten: false,
        icon: "mdi:transmission-tower",
        schema: [
          { name: "entity", selector: powerEntity },
          { name: "status", selector: anyEntity },
          {
            type: "grid",
            name: "",
            schema: [
              { name: "voltage", selector: voltageEntity },
              { name: "current", selector: currentEntity },
              { name: "frequency", selector: frequencyEntity },
              { name: "outage_voltage", selector: { number: { min: 0, max: 480, step: 1, mode: "box", unit_of_measurement: "V" } } },
              { name: "name", selector: text },
              { name: "threshold", selector: watts(5000) },
            ],
          },
          { name: "current_legs", selector: { entity: { multiple: true, filter: [{ domain: "sensor", device_class: "current" }] } } },
          { name: "import_entity", selector: powerEntity },
          { name: "export_entity", selector: powerEntity },
          { name: "invert", selector: bool },
          ...tapFields,
        ],
      },
      {
        name: "generator",
        type: "expandable",
        flatten: false,
        icon: "mdi:engine",
        schema: [
          { name: "entity", selector: powerEntity },
          { name: "running", selector: anyEntity },
          {
            type: "grid",
            name: "",
            schema: [
              { name: "voltage", selector: voltageEntity },
              { name: "current", selector: currentEntity },
              { name: "frequency", selector: frequencyEntity },
              { name: "fuel", selector: { entity: { domain: "sensor" } } },
              { name: "rated_power", selector: watts(200000) },
              { name: "threshold", selector: watts(5000) },
              { name: "name", selector: text },
              { name: "status", selector: anyEntity },
            ],
          },
          { name: "current_legs", selector: { entity: { multiple: true, filter: [{ domain: "sensor", device_class: "current" }] } } },
          ...tapFields,
        ],
      },
      {
        name: "transfer_switch",
        type: "expandable",
        flatten: false,
        icon: "mdi:electric-switch",
        schema: [{ name: "entity", selector: anyEntity }, ...tapFields],
      },
      {
        name: "home",
        type: "expandable",
        flatten: false,
        icon: "mdi:home-lightning-bolt-outline",
        schema: [
          { name: "entity", selector: powerEntity },
          { name: "current", selector: currentEntity },
          ...tapFields,
        ],
      },
      {
        name: "solar",
        type: "expandable",
        flatten: false,
        icon: "mdi:solar-power-variant",
        schema: [
          { name: "entity", selector: powerEntity },
          { type: "grid", name: "", schema: [{ name: "name", selector: text }, { name: "threshold", selector: watts(5000) }] },
          ...tapFields,
        ],
      },
      {
        name: "battery",
        type: "expandable",
        flatten: false,
        icon: "mdi:home-battery-outline",
        schema: [
          { name: "entity", selector: powerEntity },
          { name: "soc", selector: { entity: { filter: [{ domain: "sensor", device_class: "battery" }] } } },
          {
            type: "grid",
            name: "",
            schema: [
              { name: "charge_entity", selector: powerEntity },
              { name: "discharge_entity", selector: powerEntity },
              { name: "name", selector: text },
              { name: "threshold", selector: watts(5000) },
            ],
          },
          { name: "invert", selector: bool },
          ...tapFields,
        ],
      },
      {
        name: "devices",
        selector: {
          object: {
            multiple: true,
            label_field: "name",
            description_field: "entity",
            fields: {
              entity: { label: "Power sensor", required: true, selector: powerEntity },
              name: { label: "Name", selector: text },
              icon: { label: "Icon", selector: { icon: {} } },
              current: { label: "Current sensor", selector: currentEntity },
              threshold: { label: "Idle below (W)", selector: watts(5000) },
              high_load: { label: "Heavy load at (W)", selector: watts() },
              switch_entity: { label: "Switch entity", selector: anyEntity },
            },
          },
        },
      },
      {
        name: "",
        type: "expandable",
        title: "Display",
        icon: "mdi:palette-outline",
        schema: [
          {
            type: "grid",
            name: "",
            schema: [
              { name: "max_devices", selector: { number: { min: 1, max: 12, step: 1, mode: "box" } } },
              { name: "max_power", selector: watts(200000) },
              { name: "cooldown_window", selector: { number: { min: 0, max: 240, step: 1, mode: "box", unit_of_measurement: "min" } } },
              { name: "sort_devices", selector: bool },
              { name: "show_other", selector: bool },
              { name: "animation", selector: bool },
              { name: "hide_background", selector: bool },
            ],
          },
        ],
      },
    ],
    computeLabel: (s: { name: string; title?: string }) => s.title ?? LABELS[s.name] ?? s.name,
    computeHelper: (s: { name: string }) => HELPERS[s.name],
  };
}

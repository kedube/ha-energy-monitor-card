// Minimal Home Assistant shapes used by the card. The real objects carry far
// more, but keeping these narrow lets the model run under tests and in the demo.
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity | undefined>;
  locale?: { language?: string };
  language?: string;
  themes?: { darkMode?: boolean };
  callWS?<T>(msg: Record<string, unknown>): Promise<T>;
  callService?(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}

export type StateGetter = (entityId: string) => HassEntity | undefined;

export type TapAction = "more-info" | "navigate" | "toggle" | "none";

export interface TapConfig {
  tap_action?: TapAction;
  navigation_path?: string;
}

export interface GridConfig extends TapConfig {
  /** Net power sensor. Positive = importing from utility, negative = exporting. */
  entity?: string;
  /** Alternative to `entity`: separate import/export sensors (both positive). */
  import_entity?: string;
  export_entity?: string;
  voltage?: string;
  current?: string;
  /** Per-leg / per-phase current sensors (e.g. split-phase L1 + L2). */
  current_legs?: string[];
  frequency?: string;
  /** Binary sensor (or any on/off entity) that is `on` while utility power is present. */
  status?: string;
  /** Below this voltage the utility is considered lost. Default 80 V. */
  outage_voltage?: number;
  invert?: boolean;
  threshold?: number;
  name?: string;
}

export interface GeneratorConfig extends TapConfig {
  /** Generator output power sensor. */
  entity?: string;
  voltage?: string;
  current?: string;
  current_legs?: string[];
  frequency?: string;
  /** Running indicator: binary_sensor or a status sensor (e.g. Generac "Running"). */
  running?: string;
  running_states?: string[];
  starting_states?: string[];
  /** Optional text status to show when the generator is idle (e.g. "Ready"). */
  status?: string;
  fuel?: string;
  /** Rated output in watts. Enables the load gauge around the generator. */
  rated_power?: number;
  threshold?: number;
  name?: string;
}

export interface TransferSwitchConfig extends TapConfig {
  entity?: string;
  generator_states?: string[];
  utility_states?: string[];
  open_states?: string[];
}

export interface HomeConfig extends TapConfig {
  entity?: string;
  current?: string;
  name?: string;
}

export interface SolarConfig extends TapConfig {
  entity: string;
  threshold?: number;
  name?: string;
}

export interface BatteryConfig extends TapConfig {
  /** Net battery power. Positive = discharging into the home, negative = charging. */
  entity?: string;
  charge_entity?: string;
  discharge_entity?: string;
  soc?: string;
  invert?: boolean;
  threshold?: number;
  name?: string;
}

export interface DeviceConfig extends TapConfig {
  entity: string;
  name?: string;
  icon?: string;
  current?: string;
  /** Below this many watts the device is shown as idle. Default 10 W. */
  threshold?: number;
  /** At or above this many watts the device is highlighted as a heavy load. */
  high_load?: number;
  switch_entity?: string;
}

export interface ColorConfig {
  grid?: string;
  generator?: string;
  solar?: string;
  battery?: string;
  outage?: string;
}

export interface CardConfig {
  type: string;
  title?: string;
  /** Seconds between readout refreshes and trend samples. 0 = live. */
  update_interval?: number;
  /** Minutes of history in the trend strip. 0 hides it. */
  trend_window?: number;
  power_unit?: "auto" | "W" | "kW";
  decimals?: number;
  /** Watts treated as "full speed" for the flow animation. */
  max_power?: number;
  max_devices?: number;
  sort_devices?: boolean;
  show_other?: boolean;
  /** Minutes after a generator run during which a still-running generator is "cooling down". */
  cooldown_window?: number;
  animation?: boolean;
  hide_background?: boolean;
  grid?: GridConfig;
  generator?: GeneratorConfig;
  transfer_switch?: TransferSwitchConfig;
  home?: HomeConfig;
  solar?: SolarConfig;
  battery?: BatteryConfig;
  devices?: DeviceConfig[];
  colors?: ColorConfig;
}

export type SourceKey = "grid" | "generator" | "solar" | "battery";

export type AtsPosition = "utility" | "generator" | "open";

export type Phase =
  | "utility"
  | "outage"
  | "starting"
  | "generator"
  | "restored"
  | "cooldown"
  | "exercise"
  | "standby";

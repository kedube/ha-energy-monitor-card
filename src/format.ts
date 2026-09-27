export interface Formatted {
  value: string;
  unit: string;
}

const EMPTY: Formatted = { value: "—", unit: "" };

const formatters = new Map<string, Intl.NumberFormat>();

export function formatNumber(n: number, decimals: number, locale?: string): string {
  const key = `${locale ?? ""}|${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } catch {
      f = new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    formatters.set(key, f);
  }
  // Avoid "-0.0" for tiny negative readings.
  const rounded = Number(n.toFixed(decimals));
  return f.format(rounded === 0 ? 0 : rounded);
}

export function formatPower(
  watts: number | null | undefined,
  unit: "auto" | "W" | "kW" = "auto",
  decimals = 1,
  locale?: string,
): Formatted {
  if (watts === null || watts === undefined || !Number.isFinite(watts)) return EMPTY;
  const abs = Math.abs(watts);
  if (unit === "W" || (unit === "auto" && abs < 1000)) {
    return { value: formatNumber(watts, 0, locale), unit: "W" };
  }
  if (unit === "kW" || abs < 1e6) {
    return { value: formatNumber(watts / 1000, decimals, locale), unit: "kW" };
  }
  return { value: formatNumber(watts / 1e6, decimals, locale), unit: "MW" };
}

export function formatVoltage(v: number | null | undefined, locale?: string): string | null {
  if (v === null || v === undefined) return null;
  return `${formatNumber(v, Math.abs(v) >= 100 || v === 0 ? 0 : 1, locale)} V`;
}

export function formatCurrent(a: number | null | undefined, locale?: string, estimated = false): string | null {
  if (a === null || a === undefined) return null;
  return `${estimated ? "≈" : ""}${formatNumber(a, Math.abs(a) >= 100 ? 0 : 1, locale)} A`;
}

export function formatFrequency(hz: number | null | undefined, locale?: string): string | null {
  if (hz === null || hz === undefined) return null;
  return `${formatNumber(hz, 1, locale)} Hz`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatWindow(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h} h` : `${formatNumber(h, 1)} h`;
}

export function formatClock(t: number, locale?: string): string {
  try {
    return new Date(t).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  } catch {
    return new Date(t).toLocaleTimeString();
  }
}

export function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

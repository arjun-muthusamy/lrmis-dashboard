import { DISTRICT_ROWS } from "@/lib/mock-data";
import { facilityRosterForDistrict } from "@/lib/facility-geo";

export type HeatmapMode = "delivery" | "mortality" | "combined";
export type HeatBand = "low" | "medium" | "high";

export interface HeatmapDatum {
  district: string;
  deliveryCount: number;
  mortalityCount: number;
  deliveryBand: HeatBand;
  mortalityBand: HeatBand;
}

export interface HeatmapScale {
  min: number;
  max: number;
  lowMax: number;
  mediumMax: number;
}

export const HEATMAP_LAST_MONTH = "May 2026";

export function createHeatmapScale(values: number[]): HeatmapScale {
  if (!values.length) return { min: 0, max: 0, lowMax: 0, mediumMax: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  return {
    min,
    max,
    lowMax: min + span / 3,
    mediumMax: min + (span * 2) / 3,
  };
}

export function bandFor(value: number, scale: HeatmapScale): HeatBand {
  if (scale.max === scale.min) return "medium";
  if (value <= scale.lowMax) return "low";
  if (value <= scale.mediumMax) return "medium";
  return "high";
}

const rawData = DISTRICT_ROWS.map((row) => ({
  district: row.district,
  // DistrictRows already represent the current reporting month used by the
  // dashboard. Keep deliveries aligned with the existing scorecards.
  deliveryCount: row.totalDeliveries,
  // Mortality is summed from the same canonical facility roster used by pins.
  mortalityCount: facilityRosterForDistrict(row.district, row.composite).reduce(
    (total, facility) => total + facility.maternalDeaths + facility.neonatalDeaths,
    0,
  ),
}));

const deliveryScale = createHeatmapScale(rawData.map((item) => item.deliveryCount));
const mortalityScale = createHeatmapScale(rawData.map((item) => item.mortalityCount));

export const HEATMAP_DATA: HeatmapDatum[] = rawData.map((item) => ({
  ...item,
  deliveryBand: bandFor(item.deliveryCount, deliveryScale),
  mortalityBand: bandFor(item.mortalityCount, mortalityScale),
}));

const byDistrict = new Map(HEATMAP_DATA.map((item) => [item.district, item]));

export function heatmapForDistrict(district: string): HeatmapDatum | undefined {
  return byDistrict.get(district);
}

export function heatmapScale(mode: "delivery" | "mortality"): HeatmapScale {
  return mode === "delivery" ? deliveryScale : mortalityScale;
}

export const HEATMAP_COLORS = {
  delivery: { low: "#DBEAFE", medium: "#60A5FA", high: "#1D4ED8" },
  mortality: { low: "#FCE7F3", medium: "#F472B6", high: "#BE185D" },
} as const;

function intensity(value: number, scale: HeatmapScale): number {
  if (scale.max === scale.min) return 0.5;
  return (value - scale.min) / (scale.max - scale.min);
}

function rgb(hex: string): [number, number, number] {
  return [0, 2, 4].map((index) => parseInt(hex.slice(index + 1, index + 3), 16)) as [
    number,
    number,
    number,
  ];
}

function toHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

/** Returns a single blended fill for a combined delivery + mortality view. */
export function combinedHeatColor(datum: HeatmapDatum): string {
  const delivery = rgb(HEATMAP_COLORS.delivery.high);
  const mortality = rgb(HEATMAP_COLORS.mortality.high);
  const deliveryWeight = intensity(datum.deliveryCount, deliveryScale);
  const mortalityWeight = intensity(datum.mortalityCount, mortalityScale);
  const total = deliveryWeight + mortalityWeight || 1;
  const weight = mortalityWeight / total;
  const base = delivery.map((channel, index) => channel * (1 - weight) + mortality[index] * weight);
  const strength = 0.18 + Math.max(deliveryWeight, mortalityWeight) * 0.82;
  return `#${base.map((channel) => toHex(channel * strength + 255 * (1 - strength))).join("")}`;
}

export function heatmapColor(datum: HeatmapDatum | undefined, mode: HeatmapMode): string {
  if (!datum) return "#DCEBE8";
  if (mode === "combined") return combinedHeatColor(datum);
  const scale = heatmapScale(mode);
  const band = mode === "delivery" ? datum.deliveryBand : datum.mortalityBand;
  return HEATMAP_COLORS[mode][band];
}

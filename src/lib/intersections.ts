import { DISTRICT_ROWS, type DistrictRow } from "./mock-data";

export type IntersectionKey =
  | "low_ref_poor_out"
  | "high_out_stockout"
  | "high_out_equipment"
  | "high_out_hr"
  | "high_in_good_out"
  | "poor_signal_low_cs"
  | "low_ref_amb_poor_out";

export interface IntersectionPreset {
  key: IntersectionKey;
  label: string;
  positive?: boolean;
  matches: (r: DistrictRow) => boolean;
}

export const INTERSECTIONS: IntersectionPreset[] = [
  { key: "low_ref_poor_out", label: "Low referrals + poor outcomes",
    matches: (r) => r.referralIn < 10 && r.referralOut < 8 && r.outcomes < 65 },
  { key: "high_out_stockout", label: "High referral-out + drug stockouts",
    matches: (r) => r.referralOut > 10 && r.stockoutFacilities > 35 },
  { key: "high_out_equipment", label: "High referral-out + malfunctioning equipment",
    matches: (r) => r.referralOut > 10 && r.infra < 70 },
  { key: "high_out_hr", label: "High referral-out + HR unavailability",
    matches: (r) => r.referralOut > 10 && r.hr < 65 },
  { key: "high_in_good_out", label: "High referral-in + good outcomes (positive)", positive: true,
    matches: (r) => r.referralIn > 13 && r.outcomes > 75 },
  { key: "poor_signal_low_cs", label: "Poor signal-function + low C-section",
    matches: (r) => r.infra < 70 && r.cSection < 16 },
  { key: "low_ref_amb_poor_out", label: "Low referrals + ambulance gap + poor outcomes",
    matches: (r) => r.referralOut < 9 && r.infra < 70 && r.outcomes < 65 },
];

export function districtsForIntersection(key: IntersectionKey): string[] {
  const preset = INTERSECTIONS.find((i) => i.key === key);
  if (!preset) return [];
  return DISTRICT_ROWS.filter(preset.matches).map((r) => r.district);
}

// Mock: districts with reported maternal / neonatal deaths last month (deterministic)
function pickDistricts(seed: string, n: number): string[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = (h ^ seed.charCodeAt(i)) * 16777619;
  const sorted = [...DISTRICT_ROWS].sort((a, b) => {
    const ka = (a.district.charCodeAt(0) * 31 + h) % 997;
    const kb = (b.district.charCodeAt(0) * 31 + h) % 997;
    return ka - kb;
  });
  return sorted.slice(0, n).map((r) => r.district);
}

export const MATERNAL_DEATH_DISTRICTS = pickDistricts("maternal", 3);
export const NEONATAL_DEATH_DISTRICTS = pickDistricts("neonatal", 4);

export const SUPERVISION_DISTRICTS = DISTRICT_ROWS
  .filter((r) => r.composite < 60)
  .map((r) => r.district);

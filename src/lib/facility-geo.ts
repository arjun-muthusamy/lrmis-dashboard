// Deterministic per-district facility rosters used by the maps: how many
// L1/L2/L3 facilities a district has, and — for the district drill-down map —
// where each one sits geographically. Kept separate from `facility-mock.ts`
// (whose small, fixed roster of ~9 facilities per district feeds the existing
// scoring tables) because real districts carry far more L1/L2 centres than
// that table models; this file exists purely to give the maps a realistic,
// map-appropriate facility count and footprint.
import type { Level } from "./scoring-rubric";
import { randomPointInDistrict, type MPGeoFeature } from "./mp-geo";

function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h % 1000) / 1000;
}

function seededInt(key: string, min: number, max: number): number {
  return min + Math.floor(seed(key) * (max - min + 1));
}

/** Facility counts a district shows on the map — independent of geometry. */
export function facilityLevelCounts(district: string): Record<Level, number> {
  return {
    L3: seededInt(district + "::mapcnt::L3", 1, 3),
    L2: seededInt(district + "::mapcnt::L2", 10, 20),
    L1: seededInt(district + "::mapcnt::L1", 45, 75),
  };
}

export interface MapFacilityPoint {
  id: string;
  facility: string;
  type: string;
  level: Level;
  score: number;
  deliveries: number;
  lon: number;
  lat: number;
}

export type FacilityMapRecord = Omit<MapFacilityPoint, "lon" | "lat">;

const L3_NAMES = ["District Hospital", "Civil Hospital", "Sub-District Hospital"];

export function facilityRosterForDistrict(
  district: string,
  districtScore: number,
): FacilityMapRecord[] {
  const counts = facilityLevelCounts(district);
  const facilities: FacilityMapRecord[] = [];

  const push = (
    level: Level,
    i: number,
    namePrefix: string,
    deltaBase: number,
    deliveryBase: number,
    deliverySpread: number,
  ) => {
    const seedKey = `${district}::${level}::${i}`;
    const s = districtScore + deltaBase + Math.round((seed(seedKey) - 0.5) * 18);
    facilities.push({
      id: seedKey,
      facility:
        level === "L3"
          ? `${L3_NAMES[i % L3_NAMES.length]}, ${district}`
          : `${namePrefix} ${district} #${i + 1}`,
      type:
        level === "L3"
          ? "L3 Facility"
          : level === "L2"
            ? "CHC (L2)"
            : i % 2 === 0
              ? "PHC (L1)"
              : "SHC (L1)",
      level,
      score: Math.max(15, Math.min(95, s)),
      deliveries: deliveryBase + Math.round(seed(seedKey + "del") * deliverySpread),
    });
  };

  for (let i = 0; i < counts.L3; i++) push("L3", i, "", 6, 220, 260);
  for (let i = 0; i < counts.L2; i++) push("L2", i, "CHC", -4, 90, 160);
  for (let i = 0; i < counts.L1; i++) push("L1", i, "Sub-Centre", -14, 20, 90);
  return facilities;
}

/**
 * Full facility roster with a plotted position for the district drill-down
 * map — inside the real district polygon when `feature` is supplied,
 * otherwise scattered near the district's centroid.
 */
export function generateFacilityPoints(
  district: string,
  districtScore: number,
  feature: MPGeoFeature | undefined,
): MapFacilityPoint[] {
  return facilityRosterForDistrict(district, districtScore).map((facility, i) => {
    const [lon, lat] = randomPointInDistrict(district, `pt::${facility.level}::${i}`, feature);
    return { ...facility, lon, lat };
  });
}

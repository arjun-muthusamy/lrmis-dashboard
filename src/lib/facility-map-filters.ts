import type { ScoredFacility } from "@/lib/facility-scores";
import type { IntersectionKey } from "@/lib/intersections";

export type ChipKey =
  | "drugStockout"
  | "hrGap"
  | "equipMalfunction"
  | "highReferralOut"
  | "lowDeliveries"
  | "lowCsection"
  | "scoreAbove80"
  | "scoreBelow40"
  | "infraGaps"
  | "consumableStockout"
  | "noBloodBank"
  | "lowRefInL3"
  | "highNeoRefs"
  | "trainingGaps";

export type AnalysisMode =
  | "none"
  | "supervision"
  | "maternalDeaths"
  | "neonatalDeaths"
  | `intersection:${IntersectionKey}`;

export type MapMode =
  | { kind: "rankings" }
  | { kind: "supervision" }
  | { kind: "maternalDeaths" }
  | { kind: "neonatalDeaths" }
  | { kind: "intersection"; preset: IntersectionKey }
  | { kind: "chips"; chips: ChipKey[] };

export interface FacilityFilterSearch {
  analysis?: AnalysisMode;
  chips?: string;
}

export const CHIP_DEFS: Array<{
  key: ChipKey;
  label: string;
  tone: "red" | "amber" | "green";
}> = [
  { key: "drugStockout", label: "Drug stockouts", tone: "red" },
  { key: "consumableStockout", label: "Consumable stockouts", tone: "red" },
  { key: "hrGap", label: "HR gaps", tone: "red" },
  { key: "trainingGaps", label: "Staff training gaps", tone: "red" },
  { key: "equipMalfunction", label: "Malfunctioning equipment", tone: "red" },
  { key: "infraGaps", label: "Infrastructure gaps", tone: "red" },
  { key: "noBloodBank", label: "No functional blood bank", tone: "red" },
  { key: "highReferralOut", label: "High referral-out", tone: "amber" },
  { key: "highNeoRefs", label: "High neonatal referrals", tone: "amber" },
  { key: "lowRefInL3", label: "Low referral-in at L3", tone: "amber" },
  { key: "lowDeliveries", label: "Lower-than-expected deliveries", tone: "amber" },
  { key: "lowCsection", label: "Low C-section rate", tone: "amber" },
  { key: "scoreAbove80", label: "Score ≥ 80 (high performers)", tone: "green" },
  { key: "scoreBelow40", label: "Score ≤ 40 (urgent attention)", tone: "red" },
];

const CHIP_KEYS = new Set(CHIP_DEFS.map((chip) => chip.key));
const ANALYSES = new Set<AnalysisMode>([
  "none",
  "supervision",
  "maternalDeaths",
  "neonatalDeaths",
  "intersection:low_ref_poor_out",
  "intersection:high_out_stockout",
  "intersection:high_out_equipment",
  "intersection:high_out_hr",
  "intersection:high_in_good_out",
  "intersection:poor_signal_low_cs",
  "intersection:low_ref_amb_poor_out",
]);

export function validateFacilityFilterSearch(
  search: Record<string, unknown>,
): FacilityFilterSearch {
  const analysis =
    typeof search.analysis === "string" && ANALYSES.has(search.analysis as AnalysisMode)
      ? (search.analysis as AnalysisMode)
      : "none";
  const chips =
    typeof search.chips === "string"
      ? search.chips
          .split(",")
          .filter((key): key is ChipKey => CHIP_KEYS.has(key as ChipKey))
          .join(",")
      : "";
  return { analysis, chips };
}

export function parseChips(chips?: string): ChipKey[] {
  return (chips ?? "").split(",").filter((key): key is ChipKey => CHIP_KEYS.has(key as ChipKey));
}

export function toMapMode(analysis: AnalysisMode, chips: ChipKey[]): MapMode {
  if (chips.length) return { kind: "chips", chips };
  if (analysis.startsWith("intersection:")) {
    return { kind: "intersection", preset: analysis.slice(13) as IntersectionKey };
  }
  if (analysis === "supervision") return { kind: "supervision" };
  if (analysis === "maternalDeaths") return { kind: "maternalDeaths" };
  if (analysis === "neonatalDeaths") return { kind: "neonatalDeaths" };
  return { kind: "rankings" };
}

interface FilterableFacility {
  scored: ScoredFacility;
  deliveries: number;
  maternalDeaths?: number;
  neonatalDeaths?: number;
  supervisionRequired?: boolean;
}

export function facilityMatchesChip(facility: FilterableFacility, chip: ChipKey): boolean {
  const { scored, deliveries } = facility;
  switch (chip) {
    case "drugStockout":
      return scored.scores.drug.score < 60;
    case "hrGap":
      return scored.scores.hr.score < 60;
    case "equipMalfunction":
      return scored.scores.infra.score < 60;
    case "highReferralOut":
      return scored.scores.referral.score < 65 && scored.total < 70;
    case "lowDeliveries":
      return deliveries < 120;
    case "lowCsection":
      return scored.scores.service.score < 60 && deliveries > 150;
    case "scoreAbove80":
      return scored.total >= 80;
    case "scoreBelow40":
      return scored.total <= 45;
    case "infraGaps":
      return scored.scores.infra.score < 65;
    case "consumableStockout":
      return scored.scores.drug.score < 65 && scored.scores.infra.score < 70;
    case "noBloodBank":
      return scored.level !== "L1" && scored.scores.infra.score < 68;
    case "lowRefInL3":
      return scored.level === "L3" && scored.scores.referral.score < 70;
    case "highNeoRefs":
      return scored.scores.outcomes.score < 65 && scored.scores.infra.score < 70;
    case "trainingGaps":
      return scored.scores.hr.score < 65 && scored.scores.outcomes.score < 70;
  }
}

export function facilityMatchesMode(facility: FilterableFacility, mode: MapMode): boolean {
  if (mode.kind === "rankings") return true;
  if (mode.kind === "chips") {
    return mode.chips.every((chip) => facilityMatchesChip(facility, chip));
  }
  const { scored, deliveries } = facility;
  if (mode.kind === "supervision") return facility.supervisionRequired ?? scored.total < 60;
  if (mode.kind === "maternalDeaths")
    return facility.maternalDeaths !== undefined
      ? facility.maternalDeaths > 0
      : scored.scores.outcomes.breakdown.some(
          (item) => item.label === "Maternal deaths (YTD)" && item.value !== "0",
        );
  if (mode.kind === "neonatalDeaths")
    return facility.neonatalDeaths !== undefined
      ? facility.neonatalDeaths > 0
      : scored.scores.outcomes.breakdown.some(
          (item) => item.label === "Neonatal deaths (YTD)" && item.value !== "0",
        );
  switch (mode.preset) {
    case "low_ref_poor_out":
      return scored.scores.referral.score < 60 && scored.scores.outcomes.score < 65;
    case "high_out_stockout":
      return scored.scores.referral.score < 65 && scored.scores.drug.score < 60;
    case "high_out_equipment":
      return scored.scores.referral.score < 65 && scored.scores.infra.score < 60;
    case "high_out_hr":
      return scored.scores.referral.score < 65 && scored.scores.hr.score < 60;
    case "high_in_good_out":
      return scored.scores.referral.score >= 75 && scored.scores.outcomes.score >= 75;
    case "poor_signal_low_cs":
      return scored.scores.infra.score < 65 && scored.scores.service.score < 60;
    case "low_ref_amb_poor_out":
      return (
        scored.scores.referral.score < 60 &&
        scored.scores.service.score < 65 &&
        scored.scores.outcomes.score < 65 &&
        deliveries > 0
      );
  }
}

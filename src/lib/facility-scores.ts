import type { Level } from "@/lib/scoring-rubric";

/**
 * Score category definitions — single source of truth for the abbreviation
 * shown in table headers/cells and the full label shown in the legend and
 * inside the breakdown popup.
 */
export const SCORE_DEFS = [
  { key: "hr", abbr: "HR", label: "Human Resources" },
  { key: "infra", abbr: "INFRA", label: "Infrastructure" },
  { key: "drug", abbr: "DRUG", label: "Drugs & Supplies" },
  { key: "service", abbr: "SVC", label: "Service Readiness" },
  { key: "outcomes", abbr: "OUT", label: "Outcomes" },
  { key: "referral", abbr: "REF", label: "Referral Linkage" },
] as const;

export type ScoreKey = (typeof SCORE_DEFS)[number]["key"];

export interface ScoreBreakdownItem {
  label: string;
  value: string;
}

export interface ScoreDetail {
  score: number; // 0-100
  breakdown: ScoreBreakdownItem[];
}

export interface ScoredFacility {
  facility: string;
  district: string;
  type: string;
  level: Level;
  scores: Record<ScoreKey, ScoreDetail>;
  total: number;
}

/** Simple deterministic string hash so mock scores stay stable across renders. */
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

function yn(seed: string, threshold = 25): string {
  return hash(seed) % 100 < threshold ? "No" : "Yes";
}

function buildBreakdown(facility: string, key: ScoreKey): ScoreBreakdownItem[] {
  const s = (suffix: string) => `${facility}-${key}-${suffix}`;
  switch (key) {
    case "hr":
      return [
        { label: "Staff in position", value: `${pick(s("a"), 55, 100)}%` },
        { label: "Specialist availability", value: `${pick(s("b"), 40, 100)}%` },
        { label: "Nurse : bed ratio", value: `1:${pick(s("c"), 2, 6)}` },
        { label: "Training compliance", value: `${pick(s("d"), 50, 100)}%` },
      ];
    case "infra":
      return [
        { label: "Labour room functional", value: yn(s("a"), 15) },
        { label: "OT functional", value: yn(s("b"), 30) },
        { label: "HDU / ICU beds", value: `${pick(s("c"), 0, 8)}` },
        { label: "Power backup", value: yn(s("d"), 10) },
        { label: "Water supply", value: yn(s("e"), 8) },
      ];
    case "drug":
      return [
        { label: "Essential drug availability", value: `${pick(s("a"), 60, 100)}%` },
        { label: "Blood bank linkage", value: yn(s("b"), 35) },
        { label: "Oxygen availability", value: yn(s("c"), 12) },
      ];
    case "service":
      return [
        { label: "Deliveries / month", value: `${pick(s("a"), 8, 260)}` },
        { label: "C-section rate", value: `${pick(s("b"), 8, 42)}%` },
        { label: "ANC coverage", value: `${pick(s("c"), 55, 100)}%` },
      ];
    case "outcomes":
      return [
        { label: "Maternal deaths (YTD)", value: `${pick(s("a"), 0, 3)}` },
        { label: "Neonatal deaths (YTD)", value: `${pick(s("b"), 0, 6)}` },
        { label: "Stillbirths (YTD)", value: `${pick(s("c"), 0, 4)}` },
      ];
    case "referral":
      return [
        { label: "Referrals in", value: `${pick(s("a"), 0, 40)}` },
        { label: "Referrals out", value: `${pick(s("b"), 0, 25)}` },
        { label: "Avg. response time", value: `${pick(s("c"), 12, 90)} min` },
      ];
  }
}

/** Builds a deterministic mock score set for a given facility. */
export function scoreFacility(
  facility: string,
  district: string,
  type: string,
  level: Level,
): ScoredFacility {
  const scores = SCORE_DEFS.reduce(
    (acc, def) => {
      acc[def.key] = {
        score: pick(`${facility}-${def.key}-score`, 45, 98),
        breakdown: buildBreakdown(facility, def.key),
      };
      return acc;
    },
    {} as Record<ScoreKey, ScoreDetail>,
  );
  const total = Math.round(
    SCORE_DEFS.reduce((sum, def) => sum + scores[def.key].score, 0) / SCORE_DEFS.length,
  );
  return { facility, district, type, level, scores, total };
}

export function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}

export const SCORE_TONE_CLASSES: Record<"good" | "warn" | "bad", string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  warn: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  bad: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
};

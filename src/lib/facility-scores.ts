import { domainBreakdown, type Domain, type Level } from "@/lib/scoring-rubric";

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
  earned: number;
  max: number;
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

export interface FacilityOutcomeSignals {
  maternalDeaths?: number;
  neonatalDeaths?: number;
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

function buildBreakdown(
  facility: string,
  key: ScoreKey,
  score: number,
  outcomeSignals?: FacilityOutcomeSignals,
): ScoreBreakdownItem[] {
  const s = (suffix: string) => `${facility}-${key}-${suffix}`;
  const variance = (suffix: string, spread = 10) =>
    Math.max(0, Math.min(100, score + pick(s(suffix), -spread, spread)));
  const good = score >= 75;
  const adequate = score >= 50;
  switch (key) {
    case "hr":
      return [
        {
          label: "Staff absent (FTE-days last month)",
          value: good ? "1" : adequate ? "5" : "12",
        },
        { label: "Sanctioned posts vacant", value: good ? "0" : adequate ? "1" : "3" },
        {
          label: "Staff nurses on duty roster",
          value: good ? "9 of 9" : adequate ? "7 of 9" : "5 of 9",
        },
        {
          label: "Gynaecologist availability",
          value: good ? "Posted & on roster" : adequate ? "Visiting" : "Not posted",
        },
      ];
    case "infra":
      return [
        { label: "Labour room functional", value: adequate ? "Yes" : "No" },
        { label: "OT functional", value: good ? "Yes" : "No" },
        { label: "HDU / ICU beds", value: good ? `${pick(s("c"), 4, 8)}` : adequate ? "2" : "0" },
        { label: "Power backup", value: adequate ? "Yes" : "No" },
        {
          label: "Water supply",
          value: good ? "Continuous" : adequate ? "Intermittent" : "Limited",
        },
      ];
    case "drug":
      return [
        { label: "Essential drug availability", value: `${variance("a", 6)}%` },
        { label: "Blood bank linkage", value: good ? "Yes" : "No" },
        { label: "Oxygen availability", value: adequate ? "Yes" : "No" },
      ];
    case "service":
      return [
        { label: "Service target achieved", value: `${variance("a", 5)}%` },
        { label: "C-section readiness", value: good ? "Adequate" : adequate ? "Partial" : "Low" },
        { label: "ANC coverage", value: `${variance("c", 8)}%` },
      ];
    case "outcomes":
      return [
        {
          label: "Maternal deaths (YTD)",
          value: String(outcomeSignals?.maternalDeaths ?? (good ? 0 : adequate ? 1 : 3)),
        },
        {
          label: "Neonatal deaths (YTD)",
          value: String(outcomeSignals?.neonatalDeaths ?? (good ? 0 : adequate ? 2 : 6)),
        },
        { label: "Stillbirths (YTD)", value: good ? "0" : adequate ? "2" : "4" },
      ];
    case "referral":
      return [
        { label: "Referral protocol compliance", value: `${variance("a", 7)}%` },
        { label: "Transport available", value: adequate ? "Yes" : "No" },
        { label: "Avg. response time", value: good ? "18 min" : adequate ? "42 min" : "78 min" },
      ];
  }
}

/** Builds a deterministic mock score set for a given facility. */
export function scoreFacility(
  facility: string,
  district: string,
  type: string,
  level: Level,
  overall?: number,
  outcomeSignals?: FacilityOutcomeSignals,
): ScoredFacility {
  const domainToKey: Record<Domain, ScoreKey> = {
    hr: "hr",
    infra: "infra",
    drugs: "drug",
    service: "service",
    outcomes: "outcomes",
    referrals: "referral",
  };
  const targetTotal =
    overall ??
    Math.round(
      SCORE_DEFS.reduce((sum, def) => sum + pick(`${facility}-${def.key}-score`, 45, 98), 0) /
        SCORE_DEFS.length,
    );
  const weighted = domainBreakdown(facility, level, targetTotal);
  const scores = SCORE_DEFS.reduce(
    (acc, def) => {
      const domain = weighted.find((row) => domainToKey[row.domain] === def.key)!;
      acc[def.key] = {
        score: domain.pct,
        earned: domain.earned,
        max: domain.max,
        breakdown: buildBreakdown(facility, def.key, domain.pct, outcomeSignals),
      };
      return acc;
    },
    {} as Record<ScoreKey, ScoreDetail>,
  );
  const total = targetTotal;
  return { facility, district, type, level, scores, total };
}

export function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export const SCORE_TONE_CLASSES: Record<"good" | "warn" | "bad", string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  warn: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  bad: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
};

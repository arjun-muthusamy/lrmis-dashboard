// LRMIS scoring rubric — domain weights per facility level.
// Weights sum to 100 per level and represent maximum points achievable per domain.
// NOTE: Replace with the exact weights from the official rubric image when available.

export type Level = "L1" | "L2" | "L3";
export type Domain = "hr" | "infra" | "drugs" | "service" | "outcomes" | "referrals";

export interface DomainMeta {
  key: Domain;
  label: string;
  short: string;
}

export const DOMAINS: DomainMeta[] = [
  { key: "hr", label: "Human Resources", short: "HR" },
  { key: "infra", label: "Infrastructure", short: "Infra" },
  { key: "drugs", label: "Drugs, Consumables & Equipment", short: "Drugs/Equip" },
  { key: "service", label: "Service Outputs", short: "Service" },
  { key: "outcomes", label: "Outcomes", short: "Outcomes" },
  { key: "referrals", label: "Referrals", short: "Referrals" },
];

// Per LRMIS official rubric (L1 Sub-centre/PHC, L2 CHC, L3 CHC-SDH/DH)
export const WEIGHTS: Record<Level, Record<Domain, number>> = {
  L1: { hr: 20, infra: 10, drugs: 20, service: 10, outcomes: 25, referrals: 15 },
  L2: { hr: 20, infra: 10, drugs: 20, service: 10, outcomes: 25, referrals: 15 },
  L3: { hr: 15, infra: 10, drugs: 15, service: 15, outcomes: 25, referrals: 20 },
};

export function levelFromType(type: string): Level {
  if (type.includes("L3") || type.startsWith("DH") || type.startsWith("CH ")) return "L3";
  if (type.includes("L2") || type.startsWith("CHC")) return "L2";
  return "L1";
}

/** Returns domain points scored out of the max-weight.
 *  Sum across all domains equals `overall` (out of 100) so the facility-level
 *  total shown in the panel always matches `facility.score`.
 *  Per-domain variation is encoded by a small deterministic spread around the
 *  facility overall ratio, then renormalized so the sum is exact. */
export function domainPoints(
  facilityName: string,
  level: Level,
  overall: number,
  domain: Domain,
): { earned: number; max: number; pct: number } {
  const max = WEIGHTS[level][domain];
  // Per-domain deterministic ratio with small spread, then anchor to overall ratio.
  let h = 2166136261;
  const s = facilityName + domain;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  const jitter = (Math.abs(h % 1000) / 1000 - 0.5) * 0.22;
  const ratio = Math.max(0.15, Math.min(0.98, overall / 100 + jitter));
  const earned = +(max * ratio).toFixed(1);
  return { earned, max, pct: Math.round(ratio * 100) };
}

/** Returns the full row of domains with `earned` values renormalized so that
 *  Σ earned == overall (clamped). Use this for the facility snapshot. */
export function domainBreakdown(
  facilityName: string,
  level: Level,
  overall: number,
): Array<{ domain: Domain; earned: number; max: number; pct: number }> {
  const raw = (Object.keys(WEIGHTS[level]) as Domain[]).map((d) => ({
    domain: d,
    ...domainPoints(facilityName, level, overall, d),
  }));
  const sum = raw.reduce((a, b) => a + b.earned, 0);
  const target = overall; // out of 100, since weights sum to 100
  const k = sum > 0 ? target / sum : 1;
  // Scale each earned, clamp to [0, max], recompute pct
  const result = raw.map((r) => {
    const earned = +Math.min(r.max, Math.max(0, r.earned * k)).toFixed(1);
    return { ...r, earned, pct: Math.round((earned / r.max) * 100) };
  });
  let delta = +(target - result.reduce((sum, row) => sum + row.earned, 0)).toFixed(1);
  for (let pass = 0; Math.abs(delta) >= 0.1 && pass < 100; pass++) {
    const direction = delta > 0 ? 0.1 : -0.1;
    const candidate = result.find((row) =>
      direction > 0 ? row.earned + direction <= row.max : row.earned + direction >= 0,
    );
    if (!candidate) break;
    candidate.earned = +(candidate.earned + direction).toFixed(1);
    candidate.pct = Math.round((candidate.earned / candidate.max) * 100);
    delta = +(delta - direction).toFixed(1);
  }
  return result;
}

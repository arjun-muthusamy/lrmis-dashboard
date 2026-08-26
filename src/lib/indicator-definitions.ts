export interface IndicatorDef {
  name: string;
  description: string;
  numerator?: string;
  denominator?: string;
  source?: string;
}

export const INDICATOR_DEFS: Record<string, IndicatorDef> = {
  functionalFRU: {
    name: "Functional FRU",
    description: "First Referral Units performing the required volume of comprehensive obstetric care.",
    numerator: "DHs with ≥10 C-sections/month + CHCs with ≥5 C-sections/month",
    denominator: "Total designated FRUs",
    source: "LRMIS monthly facility submission",
  },
  functionalDP: {
    name: "Functional Delivery Point",
    description: "Facilities conducting the minimum monthly delivery load by level.",
    numerator: "L1 ≥3 / L2 ≥10 / L3 ≥30 deliveries per month",
    denominator: "Total delivery points",
    source: "HMIS + LRMIS",
  },
  laqshya: {
    name: "LaQshya Certified Facilities",
    description: "Facilities that have completed external LaQshya certification for LR and/or MOT.",
    numerator: "LR + MOT fully or partially certified facilities",
    denominator: "Total L2 + L3 delivery points",
    source: "NHM LaQshya division",
  },
  bemonc: {
    name: "BEmONC Functional",
    description: "Basic Emergency Obstetric & Newborn Care — all 7 signal functions performed in last 3 months.",
    numerator: "Facilities performing all 7 BEmONC signal functions",
    denominator: "Total delivery points",
    source: "GoI MoHFW",
  },
  cemonc: {
    name: "CEmONC Functional",
    description: "Comprehensive EmONC — BEmONC + caesarean + blood transfusion in last 3 months.",
    numerator: "Facilities performing all 9 CEmONC signal functions",
    denominator: "Total FRUs",
    source: "GoI MoHFW",
  },
  bloodAvail: {
    name: "Blood Availability at FRU",
    description: "FRUs with functional Blood Storage Unit / blood bank linkage.",
    source: "NHM Blood Cell",
  },
  ambulance: {
    name: "Ambulance Availability",
    description: "Delivery points with 24×7 functional ambulance (102/108) within 30 min.",
  },
  fullKit: {
    name: "Full Kit Availability",
    description: "Facilities with complete essential drug + consumable kit as per LR norms.",
    numerator: "Facilities with all kit items in stock",
    denominator: "Total delivery points",
  },
  vacancy: {
    name: "HR Vacancy Rate",
    description: "Sanctioned posts that are currently unfilled.",
    numerator: "(Sanctioned − In Position)",
    denominator: "Sanctioned",
  },
  staffingNorm: {
    name: "Meeting Staffing Norms",
    description: "Facilities with ≥80% of cadre posts filled as per IPHS.",
  },
  zeroSpecialist: {
    name: "Zero Specialist",
    description: "L2 / L3 facilities with no Gynaecologist OR no Anaesthetist in position.",
  },
  stockout: {
    name: "Chronic Stockout",
    description: "Facilities reporting stockout of any essential medicine for ≥3 consecutive months.",
  },
  equipmentNF: {
    name: "Non-Functioning Equipment",
    description: "Critical equipment that is broken or unavailable on day of audit.",
  },
  infraCompliance: {
    name: "Infrastructure Compliance",
    description: "Composite score across privacy, ambience, ventilation, space, beds, washroom, handwashing.",
  },
  referralIn: {
    name: "Referral-In Rate",
    description: "Share of deliveries received as referrals from lower-level facilities.",
    numerator: "Deliveries received as referral",
    denominator: "Total deliveries at facility",
  },
  referralOut: {
    name: "Referral-Out Rate",
    description: "Share of admissions referred to higher facility.",
    numerator: "Cases referred out",
    denominator: "Total admissions",
  },
  cSection: {
    name: "Caesarean Section Rate",
    description: "% of deliveries done by C-section. WHO range 10–15%.",
  },
  reporting: {
    name: "Reporting Completeness",
    description: "% of facilities submitting LRMIS forms on time.",
  },
  composite: {
    name: "Composite Score",
    description: "Weighted index across HR, Infrastructure, Drugs, Outcomes & Data Quality domains.",
  },
  signalFn: {
    name: "Signal Functions",
    description: "WHO-defined emergency obstetric procedures used to certify EmONC capability.",
  },
};

export type IndicatorKey = keyof typeof INDICATOR_DEFS;

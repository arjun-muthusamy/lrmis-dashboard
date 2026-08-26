import { ALL_DISTRICTS, DIVISION_OF } from "./districts";

export interface DistrictRow {
  rank: number;
  district: string;
  division: string;
  composite: number;
  hr: number;
  infra: number;
  drugs: number;
  outcomes: number;
  dataQuality: number;
  deltaApr: number;
  totalDeliveries: number;
  cSection: number;
  referralIn: number;
  referralOut: number;
  functionalFRUs: number;
  functionalDPs: number;
  vacancyRate: number;
  stockoutFacilities: number;
  reportingRate: number;
}

// Curated top/bottom; rest interpolated. Seeded pseudo-random for stability.
const TOP_5 = ["Bhopal", "Indore", "Jabalpur", "Ujjain", "Gwalior"];
const BOTTOM_5 = ["Sheopur", "Dindori", "Alirajpur", "Sidhi", "Singrauli"];

function seeded(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h % 1000) / 1000;
}

function scoreFor(district: string): number {
  if (TOP_5.includes(district)) return 88 - TOP_5.indexOf(district) * 2.3;
  if (BOTTOM_5.includes(district)) return 45 + BOTTOM_5.indexOf(district) * 1.7;
  // Range 55-77 with deterministic spread
  return 55 + seeded(district) * 22;
}

function jitter(seed: string, base: number, spread: number): number {
  return Math.round(base + (seeded(seed) - 0.5) * spread * 2);
}

export const DISTRICT_ROWS: DistrictRow[] = ALL_DISTRICTS
  .map((d) => {
    const composite = scoreFor(d);
    return {
      district: d,
      division: DIVISION_OF[d],
      composite: Math.round(composite),
      hr: jitter(d + "hr", composite - 5, 10),
      infra: jitter(d + "in", composite, 8),
      drugs: jitter(d + "dr", composite - 8, 12),
      outcomes: jitter(d + "ou", composite + 3, 8),
      dataQuality: jitter(d + "dq", composite + 5, 10),
      deltaApr: +((seeded(d + "delta") - 0.4) * 6).toFixed(1),
      totalDeliveries: 400 + Math.round(seeded(d + "td") * 2200),
      cSection: jitter(d + "cs", 17, 6),
      referralIn: jitter(d + "ri", 12, 8),
      referralOut: jitter(d + "ro", 9, 7),
      functionalFRUs: jitter(d + "ff", composite - 5, 10),
      functionalDPs: jitter(d + "fd", composite - 8, 10),
      vacancyRate: jitter(d + "vr", 100 - composite + 5, 8),
      stockoutFacilities: jitter(d + "sf", 100 - composite - 10, 10),
      reportingRate: jitter(d + "rr", composite + 12, 6),
    } as Omit<DistrictRow, "rank">;
  })
  .sort((a, b) => b.composite - a.composite)
  .map((row, i) => ({ ...row, rank: i + 1 }));

// ============ Page-level summary mocks ============

export const OVERVIEW_STATS = {
  districts: 55,
  deliveryPoints: 1247,
  levels: { L1: 843, L2: 312, L3: 92 },
  rooms: { LR: 1102, MOT: 387, HDU: 68 },
  frus: 218,
  totalDeliveries: 48312,
};

const MONTHS_12 = [
  "Jul'25", "Aug'25", "Sep'25", "Oct'25", "Nov'25", "Dec'25",
  "Jan'26", "Feb'26", "Mar'26", "Apr'26", "May'26",
];

export const FUNCTIONAL_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  frus: 60 + i * 1.1 + (i % 2 ? 1 : -0.8),
  deliveryPoints: 55 + i * 1.3 + (i % 3 ? 0.5 : -1.2),
})).map((d) => ({ ...d, frus: +d.frus.toFixed(1), deliveryPoints: +d.deliveryPoints.toFixed(1) }));

export const BEDS_BY_AREA = [
  { area: "PNC Ward", count: 2103 },
  { area: "ANC Ward", count: 1842 },
  { area: "Birth Waiting Room", count: 1124 },
  { area: "Labour Room Tables", count: 987 },
  { area: "Post-Op Ward", count: 634 },
  { area: "Pre-Op Ward", count: 521 },
  { area: "OT Tables (MOT)", count: 412 },
  { area: "Obs HDU", count: 312 },
];

export const REG_APPROVALS = [
  { category: "Fire NOC", compliant: 800, nonCompliant: 447 },
  { category: "PCB NOC", compliant: 705, nonCompliant: 542 },
  { category: "SUMAN", compliant: 993, nonCompliant: 254 },
];

export const HR_VACANCY = [
  { cadre: "Gynaecologist", vacancy: 62, sanctioned: 412, inPosition: 156 },
  { cadre: "Anaesthetist", vacancy: 71, sanctioned: 287, inPosition: 83 },
  { cadre: "Staff Nurse", vacancy: 28, sanctioned: 3120, inPosition: 2246 },
  { cadre: "ANM", vacancy: 19, sanctioned: 4580, inPosition: 3710 },
  { cadre: "MO", vacancy: 41, sanctioned: 1280, inPosition: 755 },
  { cadre: "LT", vacancy: 33, sanctioned: 612, inPosition: 410 },
  { cadre: "OT Technician", vacancy: 55, sanctioned: 348, inPosition: 157 },
];

export const TRAINING_COVERAGE = [
  { training: "Dakshata", coverage: 68 },
  { training: "SBA", coverage: 61 },
  { training: "NSSK", coverage: 54 },
  { training: "PPIUCD", coverage: 47 },
  { training: "Blood Transfusion", coverage: 44 },
  { training: "MgSO4 Admin", coverage: 39 },
  { training: "EmOC", coverage: 29 },
  { training: "Laparoscopy", coverage: 22 },
];

export const TRAINING_BY_CADRE: Record<string, Array<{ cadre: string; coverage: number }>> = {
  Dakshata: [
    { cadre: "Staff Nurse", coverage: 78 },
    { cadre: "ANM", coverage: 71 },
    { cadre: "MO", coverage: 62 },
    { cadre: "Gynaecologist", coverage: 58 },
    { cadre: "Anaesthetist", coverage: 41 },
  ],
  NSSK: [
    { cadre: "Staff Nurse", coverage: 64 },
    { cadre: "ANM", coverage: 58 },
    { cadre: "MO", coverage: 47 },
    { cadre: "Gynaecologist", coverage: 39 },
    { cadre: "Anaesthetist", coverage: 22 },
  ],
};

export const STAFF_EMPLOYMENT = [
  { cadre: "Gynaecologist", permanent: 38, nhmContract: 31, stateContract: 14, bonded: 12, outsourced: 5 },
  { cadre: "Anaesthetist", permanent: 29, nhmContract: 36, stateContract: 18, bonded: 11, outsourced: 6 },
  { cadre: "Staff Nurse", permanent: 41, nhmContract: 28, stateContract: 16, bonded: 9, outsourced: 6 },
  { cadre: "ANM", permanent: 52, nhmContract: 24, stateContract: 12, bonded: 7, outsourced: 5 },
  { cadre: "MO", permanent: 44, nhmContract: 27, stateContract: 15, bonded: 8, outsourced: 6 },
  { cadre: "LT", permanent: 33, nhmContract: 32, stateContract: 19, bonded: 10, outsourced: 6 },
];

export const STAFF_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  gynaec: 32 + i * 0.6,
  anaesth: 26 + i * 0.5,
  nurse: 68 + i * 0.4,
})).map((d) => ({ ...d, gynaec: +d.gynaec.toFixed(1), anaesth: +d.anaesth.toFixed(1), nurse: +d.nurse.toFixed(1) }));

export const INFRA_COMPLIANCE = [
  { area: "ANC Ward", DH: 82, CHC: 68, PHC: 54 },
  { area: "MOT", DH: 78, CHC: 61, PHC: 38 },
  { area: "LR", DH: 84, CHC: 71, PHC: 58 },
  { area: "PNC Ward", DH: 79, CHC: 65, PHC: 51 },
  { area: "Obs HDU", DH: 72, CHC: 47, PHC: 22 },
];

export const INFRA_CATEGORIES = [
  { category: "Privacy", score: 78 },
  { category: "Ambience", score: 71 },
  { category: "Ventilation", score: 82 },
  { category: "Space Management", score: 64 },
  { category: "Beds", score: 87 },
  { category: "Washroom", score: 58 },
  { category: "Handwashing", score: 74 },
  { category: "Miscellaneous", score: 69 },
];

export const STOCKOUT_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  medicines: 18 + Math.sin(i / 2) * 4 + i * 0.2,
  consumables: 14 + Math.cos(i / 3) * 3,
  equipment: 22 + Math.sin(i / 4) * 5 - i * 0.1,
})).map((d) => ({
  ...d,
  medicines: +d.medicines.toFixed(1),
  consumables: +d.consumables.toFixed(1),
  equipment: +d.equipment.toFixed(1),
}));

export const REFERRAL_TREND_IN = MONTHS_12.map((m, i) => ({
  month: m,
  rate: +(11 + Math.sin(i / 2) * 2 + i * 0.15).toFixed(1),
}));
export const REFERRAL_TREND_OUT = MONTHS_12.map((m, i) => ({
  month: m,
  rate: +(8 + Math.cos(i / 2) * 1.5 + i * 0.1).toFixed(1),
}));

export const REFERRAL_REASONS_IN = [
  { reason: "PPH", count: 412 },
  { reason: "Pre-eclampsia", count: 387 },
  { reason: "Severe Anaemia", count: 354 },
  { reason: "Obstructed Labour", count: 298 },
  { reason: "Eclampsia", count: 241 },
  { reason: "Sepsis", count: 187 },
  { reason: "APH", count: 156 },
  { reason: "Previous LSCS", count: 142 },
  { reason: "Fetal Distress", count: 128 },
  { reason: "Other", count: 89 },
];
export const REFERRAL_REASONS_OUT = [
  { reason: "Previous LSCS", count: 478 },
  { reason: "Pre-eclampsia", count: 412 },
  { reason: "PPH", count: 367 },
  { reason: "Obstructed Labour", count: 312 },
  { reason: "Severe Anaemia", count: 287 },
  { reason: "Fetal Distress", count: 254 },
  { reason: "Sepsis", count: 198 },
  { reason: "APH", count: 167 },
  { reason: "Eclampsia", count: 134 },
  { reason: "Other", count: 96 },
];

export const DELIVERY_TRENDS = {
  total: MONTHS_12.map((m, i) => ({ month: m, value: 42000 + i * 600 + (i % 2 ? 800 : -400) })),
  cSection: MONTHS_12.map((m, i) => ({ month: m, value: +(16.5 + i * 0.18 + Math.sin(i) * 0.6).toFixed(1) })),
  normal: MONTHS_12.map((m, i) => ({ month: m, value: +(78 - i * 0.2 + Math.cos(i) * 0.5).toFixed(1) })),
  assisted: MONTHS_12.map((m, i) => ({ month: m, value: +(5.3 + Math.sin(i / 2) * 0.4).toFixed(1) })),
  liveBirth: MONTHS_12.map((m, i) => ({
    month: m,
    male: +(51 + Math.sin(i) * 0.5).toFixed(1),
    female: +(49 + Math.cos(i) * 0.5).toFixed(1),
  })),
  ppiucd: MONTHS_12.map((m, i) => ({ month: m, value: +(22 + i * 0.5 + Math.cos(i / 2) * 1.5).toFixed(1) })),
  hysterectomy: MONTHS_12.map((m, i) => ({ month: m, value: 18 + Math.round(Math.sin(i) * 6) })),
};

export const REPORTING_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  rate: +(82 + i * 0.7 + Math.sin(i) * 1.5).toFixed(1),
}));

const TOTAL_FACILITIES = 1247;
// Facilities that have NOT submitted reports for 2+ consecutive months, by month
export const NON_REPORTING_TREND = MONTHS_12.map((m, i) => {
  const count = Math.round(180 - i * 6 + Math.sin(i / 2) * 18);
  return {
    month: m,
    count,
    pct: +((count / TOTAL_FACILITIES) * 100).toFixed(1),
  };
});

export const NON_REPORTERS_BY_DISTRICT = DISTRICT_ROWS
  .slice()
  .sort((a, b) => a.reportingRate - b.reportingRate)
  .slice(0, 15)
  .map((d) => ({ district: d.district, count: Math.round((100 - d.reportingRate) * 1.3) }));

// ====== Obs HDU exact data ======
export const HDU_ADMISSIONS = [
  { month: "Jul'25", count: 1520 },
  { month: "Aug'25", count: 1463 },
  { month: "Sep'25", count: 1420 },
  { month: "Oct'25", count: 1409 },
  { month: "Nov'25", count: 1335 },
  { month: "Dec'25", count: 1415 },
  { month: "Jan'26", count: 1348 },
  { month: "Feb'26", count: 1211 },
  { month: "Mar'26", count: 1267 },
  { month: "Apr'26", count: 1103 },
  { month: "May'26", count: 965 },
  { month: "Jun'26", count: 16, partial: true },
];

export const HDU_DIAGNOSIS = [
  { name: "Other", count: 229 },
  { name: "Severe Anaemia", count: 197 },
  { name: "Pregnancy Induced Hypertension", count: 127 },
  { name: "Post Surgical/Post-Op", count: 82 },
  { name: "Previous LSCS", count: 66 },
  { name: "Severe Pre-Eclampsia", count: 40 },
  { name: "PPH", count: 37 },
  { name: "Pre-Eclampsia", count: 36 },
  { name: "Abortion", count: 30 },
  { name: "Fetal Condition", count: 26 },
  { name: "Obstructed Labour", count: 18 },
  { name: "Eclampsia", count: 17 },
];

export const HDU_OCCUPANCY = [
  { month: "Jul'25", rate: 47.11 },
  { month: "Aug'25", rate: 41.72 },
  { month: "Sep'25", rate: 43.07 },
  { month: "Oct'25", rate: 39.52 },
  { month: "Nov'25", rate: 40.88 },
  { month: "Dec'25", rate: 38.99 },
  { month: "Jan'26", rate: 42.4 },
  { month: "Feb'26", rate: 41.73 },
  { month: "Mar'26", rate: 41.57 },
  { month: "Apr'26", rate: 33.49 },
  { month: "May'26", rate: 37.03 },
  { month: "Jun'26", rate: 1, partial: true },
];

export const HDU_OUTCOME = [
  { name: "Shifted to Maternity Ward", count: 464, kind: "positive" as const },
  { name: "Discharged", count: 171, kind: "positive" as const },
  { name: "Shifted to Other Ward", count: 83, kind: "neutral" as const },
  { name: "LAMA", count: 60, kind: "warning" as const },
  { name: "Referred Out", count: 45, kind: "neutral" as const },
  { name: "Death", count: 1, kind: "danger" as const },
];

export const HDU_EQUIPMENT = [
  { name: "BIPAP", yes: 0, no: 959 },
  { name: "Infusion Pump", yes: 51, no: 914 },
  { name: "Ventilator", yes: 4, no: 961 },
  { name: "DVT Pump", yes: 2, no: 963 },
  { name: "Defibrillator", yes: 1, no: 964 },
  { name: "Blood Transfusion", yes: 318, no: 647 },
];

// Mock facility list — used for drill-downs
export const SAMPLE_FACILITIES = Array.from({ length: 24 }, (_, i) => {
  const d = DISTRICT_ROWS[i % DISTRICT_ROWS.length];
  const types = ["DH", "CHC", "PHC", "SHC"];
  const t = types[i % 4];
  return {
    facility: `${t} ${d.district} ${i + 1}`,
    district: d.district,
    block: `${d.district} ${["Urban", "Rural", "North", "South"][i % 4]}`,
    type: t,
  };
});

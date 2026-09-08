// Additional mocks used by the restructured tabs (Referrals, Outcomes, etc.)

const MONTHS_12 = [
  "Jul'25",
  "Aug'25",
  "Sep'25",
  "Oct'25",
  "Nov'25",
  "Dec'25",
  "Jan'26",
  "Feb'26",
  "Mar'26",
  "Apr'26",
  "May'26",
];

export const REFERRAL_IN_BY_LEVEL = MONTHS_12.map((m, i) => ({
  month: m,
  L1: +(4 + Math.sin(i / 2) * 1 + i * 0.05).toFixed(1),
  L2: +(11 + Math.sin(i / 2) * 1.5 + i * 0.1).toFixed(1),
  L3: +(18 + Math.cos(i / 3) * 2 + i * 0.18).toFixed(1),
}));

export const REFERRAL_OUT_BY_LEVEL = MONTHS_12.map((m, i) => ({
  month: m,
  L1: +(14 + Math.cos(i / 2) * 1.8 + i * 0.1).toFixed(1),
  L2: +(9 + Math.sin(i / 3) * 1.2).toFixed(1),
  L3: +(4 + Math.cos(i / 4) * 0.8).toFixed(1),
}));

// Combined outcome trends (single-chart series)
export const DELIVERY_IUCD_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  totalDeliveries: 42000 + i * 600 + (i % 2 ? 800 : -400),
  ppiucd: 5800 + i * 120 + (i % 3 ? 90 : -60),
  paiucd: 1650 + i * 45 + (i % 2 ? 40 : -25),
}));

export const DELIVERY_MODE_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  totalDeliveries: 42000 + i * 600 + (i % 2 ? 800 : -400),
  cSection: 7100 + i * 140 + Math.round(Math.sin(i) * 200),
  assisted: 2200 + Math.round(Math.cos(i) * 180),
}));

// Hysterectomy count per month (rare obstetric event)
export const HYSTERECTOMY_TREND = MONTHS_12.map((m, i) => ({
  month: m,
  hysterectomies: 8 + Math.round(Math.abs(Math.sin(i / 1.7)) * 6) + (i % 4 === 0 ? 2 : 0),
}));

// Calibrated drape implementation and usage: source counts are kept so the
// displayed percentage always comes from implemented LRs / total LRs.
const CALIBRATED_DRAPE_COUNTS = [
  ["Jul'25", 620, 1080, 18600],
  ["Aug'25", 654, 1095, 19400],
  ["Sep'25", 690, 1110, 20150],
  ["Oct'25", 721, 1130, 20900],
  ["Nov'25", 748, 1145, 21600],
  ["Dec'25", 781, 1160, 22400],
  ["Jan'26", 804, 1175, 23100],
  ["Feb'26", 826, 1190, 23900],
  ["Mar'26", 848, 1205, 24700],
  ["Apr'26", 871, 1220, 25500],
  ["May'26", 893, 1240, 26300],
] as const;

export const CALIBRATED_DRAPES_TREND = CALIBRATED_DRAPE_COUNTS.map(
  ([month, implementedLRs, totalLRs, womenUsed]) => ({
    month,
    implementedLRs,
    totalLRs,
    rate: +((implementedLRs / totalLRs) * 100).toFixed(1),
    womenUsed,
  }),
);

// Referral counts split by the reporting day/night windows. Percentages are
// derived from each month's total referral count.
const REFERRAL_TIME_OF_DAY_COUNTS = [
  ["Jul'25", 2880, 1740, 1140],
  ["Aug'25", 3010, 1820, 1190],
  ["Sep'25", 3125, 1880, 1245],
  ["Oct'25", 3240, 1950, 1290],
  ["Nov'25", 3375, 2025, 1350],
  ["Dec'25", 3490, 2110, 1380],
  ["Jan'26", 3610, 2170, 1440],
  ["Feb'26", 3740, 2260, 1480],
  ["Mar'26", 3860, 2350, 1510],
  ["Apr'26", 3975, 2425, 1550],
  ["May'26", 4110, 2510, 1600],
] as const;

export const REFERRAL_TIME_OF_DAY = REFERRAL_TIME_OF_DAY_COUNTS.map(
  ([month, totalReferrals, dayReferrals, nightReferrals]) => ({
    month,
    totalReferrals,
    dayReferrals,
    nightReferrals,
    dayPct: +((dayReferrals / totalReferrals) * 100).toFixed(1),
    nightPct: +((nightReferrals / totalReferrals) * 100).toFixed(1),
  }),
);

// Last-month outcome totals (box indicators)
export const OUTCOMES_LAST_MONTH = {
  totalDeliveries: 48312,
  cSections: 8224,
  liveBirths: 47105,
  stillBirths: 612,
  maternalDeaths: 3,
  neonatalDeaths: 4,
};

// Male vs female live births — monthly trend
export const LIVE_BIRTHS_BY_SEX = MONTHS_12.map((m, i) => ({
  month: m,
  male: 22800 + i * 280 + Math.round(Math.sin(i) * 220),
  female: 21300 + i * 260 + Math.round(Math.cos(i) * 200),
}));

// L-level reporting completeness for the data-quality dropdowns
export const REPORTING_COMPLETENESS_BY_LEVEL = MONTHS_12.map((m, i) => ({
  month: m,
  All: +(82 + i * 0.7 + Math.sin(i) * 1.5).toFixed(1),
  L1: +(76 + i * 0.6 + Math.sin(i) * 2).toFixed(1),
  L2: +(85 + i * 0.7 + Math.cos(i) * 1.2).toFixed(1),
  L3: +(91 + i * 0.4 + Math.sin(i / 2) * 1).toFixed(1),
}));

export const NON_REPORTING_BY_LEVEL = MONTHS_12.map((m, i) => {
  const base = 180 - i * 6 + Math.round(Math.sin(i / 2) * 18);
  return {
    month: m,
    All: base,
    L1: Math.round(base * 0.62),
    L2: Math.round(base * 0.27),
    L3: Math.round(base * 0.11),
  };
});

// Specific drugs/equipment/consumables for the stockout dropdown
export const STOCKOUT_ITEMS = {
  medicines: [
    "All",
    "Oxytocin",
    "Magnesium Sulphate",
    "Misoprostol",
    "Iron Sucrose",
    "Calcium Gluconate",
    "Ampicillin",
  ],
  consumables: [
    "All",
    "Cord Clamps",
    "Suction Catheters",
    "IV Sets",
    "Disposable Gloves",
    "Sanitary Pads",
    "Urine Bags",
  ],
  equipment: [
    "All",
    "Radiant Warmer",
    "Pulse Oximeter",
    "Suction Machine",
    "Vacuum Extractor",
    "Foetal Doppler",
    "BP Apparatus",
  ],
} as const;

/**
 * Reporting timeliness: of expected LRMIS reports, how many were submitted
 * before the 27th of the following month (on time) vs after the cut-off (late)
 * vs never submitted. Percentages sum to 100 per month/level.
 */
export const REPORTING_TIMELINESS_BY_LEVEL = MONTHS_12.map((m, i) => {
  const mk = (base: number) => {
    const onTime = +(base + i * 0.8 + Math.sin(i) * 1.5).toFixed(1);
    const late = +Math.max(3, 16 - i * 0.5 + Math.cos(i) * 2).toFixed(1);
    const missed = +(100 - onTime - late).toFixed(1);
    return { onTime, late, missed: Math.max(0, missed) };
  };
  return { month: m, All: mk(70), L1: mk(63), L2: mk(73), L3: mk(80) };
});

export const LEVEL_DENOM = { All: 1247, L1: 843, L2: 312, L3: 92 } as const;

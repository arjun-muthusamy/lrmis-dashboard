export interface SumanGapRow {
  name: string;
  district: string;
  infrastructureScore: number;
  brandingScore: number;
  facilities: number;
}

export interface ReferralStockoutRow {
  name: string;
  referralIn: number;
  stockoutFacilities: number;
  stockoutRate: number;
}

export interface StockoutDrugRow {
  name: string;
  stockoutReports: number;
  affectedFacilities: number;
  category: string;
}

export const SUMAN_GAPS: SumanGapRow[] = [
  {
    name: "CHC Vijaypur",
    district: "Sheopur",
    infrastructureScore: 41,
    brandingScore: 100,
    facilities: 4,
  },
  {
    name: "DH Alirajpur",
    district: "Alirajpur",
    infrastructureScore: 47,
    brandingScore: 100,
    facilities: 8,
  },
  {
    name: "CHC Gohad",
    district: "Bhind",
    infrastructureScore: 52,
    brandingScore: 100,
    facilities: 5,
  },
  {
    name: "CHC Kusmi",
    district: "Sidhi",
    infrastructureScore: 55,
    brandingScore: 100,
    facilities: 6,
  },
  {
    name: "CHC Bajna",
    district: "Ratlam",
    infrastructureScore: 58,
    brandingScore: 100,
    facilities: 7,
  },
  {
    name: "CHC Bichhiya",
    district: "Mandla",
    infrastructureScore: 59,
    brandingScore: 100,
    facilities: 5,
  },
];

export const REFERRAL_STOCKOUTS: ReferralStockoutRow[] = [
  { name: "DH Sheopur", referralIn: 286, stockoutFacilities: 9, stockoutRate: 38 },
  { name: "DH Alirajpur", referralIn: 264, stockoutFacilities: 8, stockoutRate: 35 },
  { name: "DH Dindori", referralIn: 239, stockoutFacilities: 7, stockoutRate: 32 },
  { name: "DH Singrauli", referralIn: 218, stockoutFacilities: 6, stockoutRate: 29 },
  { name: "DH Jhabua", referralIn: 204, stockoutFacilities: 6, stockoutRate: 27 },
  { name: "DH Chhindwara", referralIn: 191, stockoutFacilities: 5, stockoutRate: 24 },
];

export const TOP_STOCKOUT_DRUGS: StockoutDrugRow[] = [
  {
    name: "Magnesium sulphate",
    stockoutReports: 118,
    affectedFacilities: 74,
    category: "Emergency medicine",
  },
  { name: "Oxytocin 10 IU", stockoutReports: 104, affectedFacilities: 68, category: "Uterotonic" },
  {
    name: "Calcium gluconate",
    stockoutReports: 91,
    affectedFacilities: 61,
    category: "Emergency medicine",
  },
  {
    name: "Tranexamic acid",
    stockoutReports: 86,
    affectedFacilities: 57,
    category: "Emergency medicine",
  },
  {
    name: "Ceftriaxone 1 g",
    stockoutReports: 79,
    affectedFacilities: 51,
    category: "Antibiotic",
  },
  {
    name: "Misoprostol 200 mcg",
    stockoutReports: 72,
    affectedFacilities: 48,
    category: "Uterotonic",
  },
  {
    name: "Ringer lactate",
    stockoutReports: 65,
    affectedFacilities: 44,
    category: "IV fluid",
  },
  {
    name: "Amlodipine 5 mg",
    stockoutReports: 57,
    affectedFacilities: 39,
    category: "Antihypertensive",
  },
  {
    name: "Labetalol 100 mg",
    stockoutReports: 49,
    affectedFacilities: 34,
    category: "Antihypertensive",
  },
  {
    name: "Iron sucrose",
    stockoutReports: 43,
    affectedFacilities: 31,
    category: "Maternal supplement",
  },
];

export const DISTRICT_MONTHLY_REFERRALS = [
  { name: "Jan", referrals: 948 },
  { name: "Feb", referrals: 1_012 },
  { name: "Mar", referrals: 1_086 },
  { name: "Apr", referrals: 1_164 },
  { name: "May", referrals: 1_238 },
];

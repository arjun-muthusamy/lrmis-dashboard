import { ALL_DISTRICTS } from "./districts";

export interface FacilityScore {
  facility: string;
  type: "DH (L3)" | "CH (L3)" | "CHC (L2)" | "PHC (L1)" | "SHC (L1)";
  district: string;
  score: number;
  hr: number;
  infra: number;
  drugs: number;
  outcomes: number;
  deliveries: number;
}

function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h % 1000) / 1000;
}

const L3_TEMPLATES: Array<{ prefix: "DH" | "CH"; suffix: string; deltaBase: number }> = [
  { prefix: "DH", suffix: "", deltaBase: 8 },
  { prefix: "CH", suffix: "", deltaBase: 2 },
];

const L2_TEMPLATES: Array<{ prefix: "CHC"; suffix: string; deltaBase: number }> = [
  { prefix: "CHC", suffix: " North", deltaBase: -4 },
  { prefix: "CHC", suffix: " South", deltaBase: -8 },
  { prefix: "CHC", suffix: " East", deltaBase: -6 },
];

const L1_TEMPLATES: Array<{ prefix: "PHC" | "SHC"; suffix: string; deltaBase: number }> = [
  { prefix: "PHC", suffix: " Rural", deltaBase: -14 },
  { prefix: "PHC", suffix: " Urban", deltaBase: -12 },
  { prefix: "PHC", suffix: " North", deltaBase: -16 },
  { prefix: "SHC", suffix: " Rural", deltaBase: -18 },
  { prefix: "SHC", suffix: " Urban", deltaBase: -20 },
];

function typeFromPrefix(prefix: "DH" | "CH" | "CHC" | "PHC" | "SHC"): FacilityScore["type"] {
  switch (prefix) {
    case "DH": return "DH (L3)";
    case "CH": return "CH (L3)";
    case "CHC": return "CHC (L2)";
    case "PHC": return "PHC (L1)";
    case "SHC": return "SHC (L1)";
  }
}

function makeFacility(
  district: string,
  districtScore: number,
  t: { prefix: "DH" | "CH" | "CHC" | "PHC" | "SHC"; suffix: string; deltaBase: number },
  i: number,
): FacilityScore {
  const seedKey = district + t.prefix + t.suffix + i;
  const s = districtScore + t.deltaBase + Math.round((seed(seedKey) - 0.5) * 6);
  const score = Math.max(15, Math.min(95, s));
  return {
    facility: `${t.prefix} ${district}${t.suffix}`,
    type: typeFromPrefix(t.prefix),
    district,
    score,
    hr: Math.max(10, Math.min(98, score + Math.round((seed(seedKey + "h") - 0.5) * 14))),
    infra: Math.max(10, Math.min(98, score + Math.round((seed(seedKey + "i") - 0.5) * 12))),
    drugs: Math.max(10, Math.min(98, score + Math.round((seed(seedKey + "d") - 0.5) * 16))),
    outcomes: Math.max(10, Math.min(98, score + Math.round((seed(seedKey + "o") - 0.5) * 10))),
    deliveries: 40 + Math.round(seed(seedKey + "del") * 380),
  };
}

export function facilitiesForDistrict(district: string, districtScore: number): FacilityScore[] {
  const result: FacilityScore[] = [];

  // L3: every district has a DH; only a few districts have a second L3 (CH).
  result.push(makeFacility(district, districtScore, L3_TEMPLATES[0], 0));
  if (seed(district + "extraL3") > 0.82) {
    result.push(makeFacility(district, districtScore, L3_TEMPLATES[1], 1));
  }

  // L2 and L1: multiple facilities per district.
  L2_TEMPLATES.forEach((t, i) => result.push(makeFacility(district, districtScore, t, i)));
  L1_TEMPLATES.forEach((t, i) => result.push(makeFacility(district, districtScore, t, i)));

  return result;
}


// Mock staff line-list per cadre
export interface StaffRow {
  name: string;
  cadre: string;
  designation: string;
  facility: string;
  district: string;
  employmentType: string;
  joiningYear: number;
}

const FIRST = ["Anita", "Sunita", "Pooja", "Meena", "Rakesh", "Rajesh", "Sandeep", "Priyanka", "Neha", "Rahul", "Vinay", "Kavita", "Manoj", "Geeta", "Suresh", "Deepak", "Ritu", "Ankur"];
const LAST = ["Sharma", "Verma", "Patel", "Singh", "Yadav", "Kumar", "Dubey", "Tiwari", "Mishra", "Pandey", "Gupta", "Joshi"];

export function staffListFor(cadre: string, employmentType: string, count = 18): StaffRow[] {
  return Array.from({ length: count }, (_, i) => {
    const d = ALL_DISTRICTS[i % ALL_DISTRICTS.length];
    return {
      name: `Dr. ${FIRST[i % FIRST.length]} ${LAST[(i + 3) % LAST.length]}`,
      cadre,
      designation: cadre,
      facility: `DH ${d}`,
      district: d,
      employmentType,
      joiningYear: 2012 + (i % 13),
    };
  });
}

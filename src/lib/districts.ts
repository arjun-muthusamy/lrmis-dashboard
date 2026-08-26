export interface Division {
  name: string;
  districts: string[];
}

export const DIVISIONS: Division[] = [
  { name: "Bhopal", districts: ["Bhopal", "Raisen", "Sehore", "Rajgarh", "Vidisha"] },
  { name: "Indore", districts: ["Indore", "Dhar", "Jhabua", "Alirajpur", "Barwani", "Khargone", "Burhanpur"] },
  { name: "Gwalior", districts: ["Gwalior", "Shivpuri", "Guna", "Ashoknagar", "Datia"] },
  { name: "Chambal", districts: ["Morena", "Bhind", "Sheopur"] },
  { name: "Jabalpur", districts: ["Jabalpur", "Katni", "Mandla", "Dindori", "Narsinghpur", "Seoni", "Chhindwara", "Balaghat"] },
  { name: "Sagar", districts: ["Sagar", "Damoh", "Panna", "Chhatarpur", "Tikamgarh", "Niwari"] },
  { name: "Rewa", districts: ["Rewa", "Satna", "Sidhi", "Singrauli", "Umaria", "Shahdol", "Anuppur", "Maihar", "Mauganj"] },
  { name: "Ujjain", districts: ["Ujjain", "Dewas", "Shajapur", "Agar Malwa", "Mandsaur", "Neemuch", "Ratlam"] },
  { name: "Narmadapuram", districts: ["Narmadapuram", "Betul", "Harda"] },
];

export const ALL_DISTRICTS: string[] = DIVISIONS.flatMap((d) => d.districts);

export const DIVISION_OF: Record<string, string> = ALL_DISTRICTS.reduce(
  (acc, d) => {
    const div = DIVISIONS.find((dv) => dv.districts.includes(d));
    acc[d] = div?.name ?? "";
    return acc;
  },
  {} as Record<string, string>,
);

// Mock blocks per district (3-5 blocks each)
export const BLOCKS_OF: Record<string, string[]> = ALL_DISTRICTS.reduce(
  (acc, d) => {
    acc[d] = [`${d} Urban`, `${d} Rural`, `${d} North`, `${d} South`];
    return acc;
  },
  {} as Record<string, string[]>,
);

import { useMemo, useState } from "react";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import { scoreColor } from "@/lib/csv";

interface Props {
  onSelect?: (district: string) => void;
  selected?: string;
}

// Approximate 8-col grid layout for MP districts (decorative — geographic-ish).
const GRID_LAYOUT: string[][] = [
  ["Sheopur", "Morena", "Bhind", "", "Datia", "", "", ""],
  ["", "Gwalior", "", "Shivpuri", "", "Ashoknagar", "Tikamgarh", "Niwari"],
  ["Neemuch", "Mandsaur", "Guna", "Sagar", "Chhatarpur", "Panna", "Satna", "Rewa"],
  ["Ratlam", "Agar Malwa", "Rajgarh", "Vidisha", "Damoh", "Maihar", "Mauganj", "Sidhi"],
  ["Jhabua", "Ujjain", "Shajapur", "Bhopal", "Raisen", "Katni", "Umaria", "Singrauli"],
  ["Alirajpur", "Dewas", "Sehore", "Narmadapuram", "Narsinghpur", "Jabalpur", "Shahdol", "Anuppur"],
  ["Barwani", "Indore", "Dhar", "Harda", "Chhindwara", "Seoni", "Dindori", ""],
  ["", "Khargone", "Burhanpur", "Betul", "", "Balaghat", "Mandla", ""],
];

export function MPDistrictMap({ onSelect, selected }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const byName = useMemo(
    () => Object.fromEntries(DISTRICT_ROWS.map((r) => [r.district, r])),
    [],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">MP District Performance Map</h3>
          <p className="text-xs text-muted-foreground">Composite score by district · May 2026</p>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-8 gap-1.5">
          {GRID_LAYOUT.flatMap((row, ri) =>
            row.map((d, ci) => {
              if (!d) return <div key={`${ri}-${ci}`} className="aspect-square" />;
              const row = byName[d];
              if (!row) return <div key={`${ri}-${ci}`} className="aspect-square" />;
              const bg = scoreColor(row.composite);
              const dark = row.composite > 55;
              const isSel = selected === d;
              return (
                <button
                  key={d}
                  onMouseEnter={() => setHover(d)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect?.(d)}
                  className={`relative aspect-square rounded-md p-1 text-center transition hover:scale-105 ${
                    isSel ? "ring-2 ring-teal ring-offset-1" : ""
                  }`}
                  style={{ backgroundColor: bg, color: dark ? "#fff" : "#0F2D56" }}
                >
                  <div className="truncate text-[8px] font-medium leading-tight opacity-85">{d}</div>
                  <div className="mt-0.5 text-[13px] font-bold leading-none">{row.composite}</div>
                </button>
              );
            }),
          )}
        </div>

        {hover && byName[hover] && (
          <div className="pointer-events-none absolute right-2 top-2 z-10 w-56 rounded-lg border border-border bg-white p-3 shadow-lg">
            <div className="text-sm font-semibold text-navy">{byName[hover].district}</div>
            <div className="text-[11px] text-muted-foreground">{byName[hover].division} Division · Rank #{byName[hover].rank}</div>
            <div className="mt-2 text-2xl font-bold" style={{ color: scoreColor(byName[hover].composite) }}>
              {byName[hover].composite}
              <span className="ml-1 text-xs font-medium text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {(["hr", "infra", "drugs", "outcomes", "dataQuality"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="font-semibold" style={{ color: scoreColor(byName[hover][k]) }}>{byName[hover][k]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground">Score:</span>
        <div className="flex-1">
          <div
            className="h-2.5 w-full rounded"
            style={{ background: "linear-gradient(to right, #E8F4FA, #A8D4EA, #5BAED4, #1E6FA8, #0F2D56)" }}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

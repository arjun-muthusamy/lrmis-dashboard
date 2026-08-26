import { useMemo, useState } from "react";
import { Search, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SCORE_DEFS,
  scoreFacility,
  scoreTone,
  SCORE_TONE_CLASSES,
  type ScoredFacility,
  type ScoreKey,
} from "@/lib/facility-scores";
import type { Level } from "@/lib/scoring-rubric";
import { facilitiesForDistrict } from "@/lib/facility-mock";
import { levelFromType } from "@/lib/scoring-rubric";

interface Props {
  district: string;
  /** Composite seed passed through to the existing mock-facility generator. */
  composite: number;
}

const LEVEL_TABS: { key: Level; label: string }[] = [
  { key: "L1", label: "L1 Facilities" },
  { key: "L2", label: "L2 Facilities" },
  { key: "L3", label: "L3 Facilities" },
];

export function FacilityScoreTable({ district, composite }: Props) {
  const [level, setLevel] = useState<Level>("L1");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<{ facility: ScoredFacility; key: ScoreKey } | null>(null);

  const scored = useMemo(() => {
    const facilities = facilitiesForDistrict(district, composite);
    return facilities
      .map((f) => scoreFacility(f.facility, district, f.type, levelFromType(f.type)))
      .filter((f) => f.level === level);
  }, [district, composite, level]);

  const counts = useMemo(() => {
    const facilities = facilitiesForDistrict(district, composite);
    const c: Record<Level, number> = { L1: 0, L2: 0, L3: 0 };
    facilities.forEach((f) => c[levelFromType(f.type)]++);
    return c;
  }, [district, composite]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scored;
    const q = search.toLowerCase();
    return scored.filter(
      (f) => f.facility.toLowerCase().includes(q) || f.type.toLowerCase().includes(q),
    );
  }, [scored, search]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Header: level tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex overflow-hidden rounded-md border border-border text-xs">
          {LEVEL_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setLevel(t.key)}
              className={`px-3 py-1.5 font-semibold transition ${
                level === t.key
                  ? "bg-navy text-navy-foreground"
                  : "bg-white text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 ${level === t.key ? "text-navy-foreground/70" : "text-muted-foreground/70"}`}
              >
                ({counts[t.key]})
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search center name or type..."
            className="h-9 w-64 rounded-md border border-border bg-white pl-8 pr-3 text-xs outline-none focus:border-teal"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border bg-secondary/40 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 font-semibold text-foreground">
          <Info className="h-3.5 w-3.5" /> Legend:
        </span>
        {SCORE_DEFS.map((d) => (
          <span key={d.key}>
            <span className="font-semibold text-foreground">{d.abbr}</span> = {d.label}
          </span>
        ))}
        <span className="ml-auto italic">Click any score to see its breakdown</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">Center Name</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              {SCORE_DEFS.map((d) => (
                <th key={d.key} className="px-3 py-2.5 text-center" title={d.label}>
                  {d.abbr}
                </th>
              ))}
              <th className="px-4 py-2.5 text-center font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={SCORE_DEFS.length + 3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No facilities match &quot;{search}&quot;
                </td>
              </tr>
            )}
            {filtered.map((f, i) => {
              const totalTone = scoreTone(f.total);
              return (
                <tr
                  key={f.facility}
                  className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} border-t border-border/60 hover:bg-teal-soft/20`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{f.facility}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{f.type}</td>
                  {SCORE_DEFS.map((d) => {
                    const detail = f.scores[d.key];
                    const tone = scoreTone(detail.score);
                    return (
                      <td key={d.key} className="px-3 py-2 text-center">
                        <button
                          onClick={() => setActive({ facility: f, key: d.key })}
                          className={`inline-flex w-12 items-center justify-center rounded-md border px-1.5 py-1 font-semibold transition ${SCORE_TONE_CLASSES[tone]}`}
                        >
                          {detail.score}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex w-12 items-center justify-center rounded-md border px-1.5 py-1 font-bold ${SCORE_TONE_CLASSES[totalTone]}`}
                    >
                      {f.total}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Breakdown popup */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-sm">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm">
                  {SCORE_DEFS.find((d) => d.key === active.key)?.label}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {active.facility.facility}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">Score</span>
                <span
                  className={`rounded-md border px-2 py-0.5 font-bold ${
                    SCORE_TONE_CLASSES[scoreTone(active.facility.scores[active.key].score)]
                  }`}
                >
                  {active.facility.scores[active.key].score}
                </span>
              </div>
              <div className="divide-y divide-border text-xs">
                {active.facility.scores[active.key].breakdown.map((b) => (
                  <div key={b.label} className="flex items-center justify-between py-1.5">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium text-foreground">{b.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

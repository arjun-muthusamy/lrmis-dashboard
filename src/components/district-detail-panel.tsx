import { useState, useMemo } from "react";
import { X, Download, ChevronRight, ArrowLeft } from "lucide-react";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import { facilitiesForDistrict, type FacilityScore } from "@/lib/facility-mock";
import { scoreColor, downloadCSV } from "@/lib/csv";
import { DOMAINS, WEIGHTS, levelFromType, domainBreakdown, type Level } from "@/lib/scoring-rubric";

interface Props {
  district: string;
  onClose: () => void;
  initialFacility?: string;
}

function levelOf(f: FacilityScore): Level { return levelFromType(f.type); }

export function DistrictDetailPanel({ district, onClose, initialFacility }: Props) {
  const row = DISTRICT_ROWS.find((d) => d.district === district);
  const facilities = useMemo(() => row ? facilitiesForDistrict(district, row.composite) : [], [district, row]);

  const [view, setView] = useState<"overview" | "level" | "facility">(
    initialFacility ? "facility" : "overview",
  );
  const [selectedLevel, setSelectedLevel] = useState<Level>("L3");
  const [selectedFacility, setSelectedFacility] = useState<FacilityScore | undefined>(
    initialFacility ? facilities.find((f) => f.facility === initialFacility) : undefined,
  );

  if (!row) return null;

  const byLevel: Record<Level, FacilityScore[]> = {
    L1: facilities.filter((f) => levelOf(f) === "L1"),
    L2: facilities.filter((f) => levelOf(f) === "L2"),
    L3: facilities.filter((f) => levelOf(f) === "L3"),
  };
  const avg = (arr: FacilityScore[]) => arr.length ? Math.round(arr.reduce((s, x) => s + x.score, 0) / arr.length) : 0;
  const levelAvg: Record<Level, number> = { L1: avg(byLevel.L1), L2: avg(byLevel.L2), L3: avg(byLevel.L3) };
  const facilityAvg = avg(facilities);
  const category =
    facilityAvg >= 75 ? { label: "Green", desc: "Performing", bg: "#059669", soft: "#ECFDF5" } :
    facilityAvg >= 50 ? { label: "Amber", desc: "Needs attention", bg: "#F59E0B", soft: "#FFFBEB" } :
    { label: "Red", desc: "Priority for supervision", bg: "#E11D48", soft: "#FEF2F2" };

  return (
    <div className="fixed inset-0 z-40 flex">
      <button onClick={onClose} className="flex-1 bg-black/30 backdrop-blur-sm" aria-label="Close" />
      <aside className="flex w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl animate-in slide-in-from-right">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card p-5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <button onClick={() => { setView("overview"); setSelectedFacility(undefined); }} className="hover:text-foreground">{district}</button>
              {view !== "overview" && <><ChevronRight className="h-3 w-3" /> <span>{selectedLevel} Facilities</span></>}
              {view === "facility" && selectedFacility && <><ChevronRight className="h-3 w-3" /> <span className="truncate">{selectedFacility.facility}</span></>}
            </div>
            <h2 className="mt-0.5 text-xl font-bold text-navy">{district}</h2>
            <p className="text-xs text-muted-foreground">{row.division} Division</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </header>

        {view === "overview" && (
          <div className="space-y-5 p-5">
            <section
              className="rounded-lg border border-border p-4 text-center"
              style={{ background: `linear-gradient(135deg, ${category.soft}, #ffffff)` }}
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">District Category</div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white"
                style={{ backgroundColor: category.bg }}>
                <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                {category.label}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {category.desc} · based on average of {facilities.length} facility scores
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average Score by Facility Level</h3>
              <div className="grid grid-cols-3 gap-2">
                {(["L1","L2","L3"] as Level[]).map((lvl) => (
                  <button key={lvl}
                    onClick={() => { setSelectedLevel(lvl); setView("level"); }}
                    disabled={!byLevel[lvl].length}
                    className="rounded-lg border border-border bg-white p-3 text-left transition hover:border-teal hover:shadow-sm disabled:opacity-40">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">{lvl}</div>
                    <div className="mt-1 text-2xl font-bold" style={{ color: scoreColor(levelAvg[lvl]) }}>{levelAvg[lvl] || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">{byLevel[lvl].length} facilities</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-2">
              {[
                ["Deliveries", row.totalDeliveries.toLocaleString()],
                ["C-Sections", `${row.cSection}%`],
                ["Delivery Points", Math.round(row.functionalDPs / 4)],
              ].map(([label, val]) => (
                <div key={label} className="rounded-md border border-border bg-secondary/40 p-2.5">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
                  <div className="mt-0.5 text-base font-bold text-navy">{val}</div>
                </div>
              ))}
            </section>

            <p className="rounded-md border border-dashed border-border bg-secondary/30 p-3 text-[11px] italic text-muted-foreground">
              Click on a level (L1 / L2 / L3) above to see facility-wise scores and drill into individual facility domains.
            </p>
          </div>
        )}

        {view === "level" && (
          <div className="space-y-3 p-5">
            <button onClick={() => setView("overview")} className="flex items-center gap-1 text-xs text-teal hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to overview
            </button>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{selectedLevel} Facilities ({byLevel[selectedLevel].length})</h3>
              <button onClick={() => downloadCSV(byLevel[selectedLevel], `${district}_${selectedLevel}`)}
                className="flex items-center gap-1 text-[11px] text-teal hover:underline">
                <Download className="h-3 w-3" /> CSV
              </button>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Facility</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {byLevel[selectedLevel].sort((a,b)=>b.score-a.score).map((f, i) => {
                    const c = scoreColor(f.score); const dark = f.score > 55;
                    return (
                      <tr key={f.facility}
                        onClick={() => { setSelectedFacility(f); setView("facility"); }}
                        className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} cursor-pointer hover:bg-teal-soft/40`}>
                        <td className="px-3 py-2 text-foreground">{f.facility}</td>
                        <td className="px-3 py-2 text-muted-foreground">{f.type}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-grid h-6 w-9 place-items-center rounded text-[11px] font-bold"
                            style={{ backgroundColor: c, color: dark ? "#fff" : "#0F2D56" }}>{f.score}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "facility" && selectedFacility && (
          <FacilitySnapshot facility={selectedFacility} onBack={() => setView("level")} />
        )}
      </aside>
    </div>
  );
}

function FacilitySnapshot({ facility, onBack }: { facility: FacilityScore; onBack: () => void }) {
  const lvl = levelFromType(facility.type);
  const weights = WEIGHTS[lvl];
  const breakdown = domainBreakdown(facility.facility, lvl, facility.score);
  const rows = DOMAINS.map((d) => {
    const b = breakdown.find((x) => x.domain === d.key)!;
    return { domain: d.label, key: d.key, earned: b.earned, max: b.max, pct: b.pct };
  });
  const total = Math.round(rows.reduce((s, r) => s + r.earned, 0));
  const [openDomain, setOpenDomain] = useState<typeof rows[number] | null>(null);

  return (
    <div className="space-y-4 p-5">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-teal hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to facility list
      </button>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{facility.type} • {lvl}</div>
        <h3 className="text-base font-bold text-navy">{facility.facility}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{facility.deliveries} deliveries · {facility.district}</p>
      </div>

      <section className="rounded-lg border border-border bg-gradient-to-br from-teal-soft/40 to-white p-4 text-center">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Overall Score</div>
        <div className="mt-1 text-4xl font-extrabold" style={{ color: scoreColor(facility.score) }}>
          {total}<span className="text-lg text-muted-foreground">/100</span>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Scoring Domains ({lvl} rubric) — click a domain for related parameters
        </h4>
        <div className="space-y-2.5">
          {rows.map((r) => {
            const isOpen = openDomain?.key === r.key;
            return (
              <div key={r.domain} className="rounded-md border border-transparent transition hover:border-teal/30">
                <button
                  onClick={() => setOpenDomain(isOpen ? null : r)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground">{r.domain}</span>
                    <span className="font-semibold text-navy tabular-nums">
                      {r.earned} <span className="text-muted-foreground">/ {r.max}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full transition-all"
                      style={{ width: `${(r.earned / r.max) * 100}%`, backgroundColor: scoreColor(r.pct) }} />
                  </div>
                </button>
                {isOpen && (
                  <RelatedParametersTable domain={r.key} pct={r.pct} facility={facility.facility} />
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] italic text-muted-foreground">
          Max points per domain reflect {lvl} weighting (HR {weights.hr}, Infra {weights.infra}, Drugs {weights.drugs},
          Service {weights.service}, Outcomes {weights.outcomes}, Referrals {weights.referrals}).
        </p>
      </section>
    </div>
  );
}

const RELATED: Record<string, Array<{ label: string; bad: string; good: string }>> = {
  hr: [
    { label: "Staff absent (FTE-days last month)", bad: "12", good: "1" },
    { label: "Sanctioned posts vacant", bad: "3", good: "0" },
    { label: "Staff nurses on duty roster", bad: "5 of 9", good: "9 of 9" },
    { label: "Gynaecologist availability", bad: "Not posted", good: "Posted & on roster" },
  ],
  infra: [
    { label: "Baby warmer functional", bad: "Not functional", good: "Functional" },
    { label: "OT light functional", bad: "Not functional", good: "Functional" },
    { label: "Suction machine functional", bad: "Not functional", good: "Functional" },
    { label: "Labour-room running water", bad: "Intermittent", good: "Continuous" },
  ],
  drugs: [
    { label: "Oxytocin stockout (days)", bad: "14", good: "0" },
    { label: "Magnesium Sulphate stockout (days)", bad: "9", good: "0" },
    { label: "Iron Sucrose stockout (days)", bad: "11", good: "0" },
    { label: "Misoprostol stockout (days)", bad: "6", good: "0" },
    { label: "Consumables (IV sets, cord clamps)", bad: "Short", good: "Adequate" },
  ],
  service: [
    { label: "Ambulance availability", bad: "Not available", good: "On-site, 24×7" },
    { label: "Blood storage unit functional", bad: "No", good: "Yes" },
    { label: "Referral linkages established", bad: "Partial", good: "Documented" },
  ],
  outcomes: [
    { label: "Linked: Magnesium Sulphate stockout", bad: "9 days", good: "0" },
    { label: "Linked: staff nurse vacancy", bad: "Yes", good: "No" },
    { label: "Linked: baby warmer malfunction", bad: "Yes", good: "No" },
  ],
  referrals: [
    { label: "Oxytocin stockout (days)", bad: "5", good: "0" },
    { label: "Magnesium Sulphate stockout (days)", bad: "9", good: "0" },
    { label: "Iron Sucrose stockout (days)", bad: "11", good: "0" },
    { label: "HR availability (SBA / MO-EmOC on roster)", bad: "Gap", good: "Adequate" },
    { label: "Equipment malfunction (warmer / OT light)", bad: "Yes", good: "No" },
  ],
};

function RelatedParametersTable({ domain, pct, facility: _f }: { domain: string; pct: number; facility: string }) {
  const items = RELATED[domain] ?? [];
  const doingWell = pct >= 65;
  return (
    <div className="mt-2 rounded-md border border-border bg-secondary/30 p-2.5">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Related linked parameters {doingWell ? "(performing well)" : "(possible drivers of low score)"}
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left text-[10px] uppercase text-muted-foreground">
            <th className="py-1 font-medium">Parameter</th>
            <th className="py-1 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.label} className="border-t border-border/60">
              <td className="py-1.5 text-foreground">{it.label}</td>
              <td className={`py-1.5 text-right font-semibold ${doingWell ? "text-emerald-700" : "text-rose-600"}`}>
                {doingWell ? it.good : it.bad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[9px] italic text-muted-foreground">
        Linked parameters reported as-is for user interpretation — not algorithmic causation.
      </p>
    </div>
  );
}

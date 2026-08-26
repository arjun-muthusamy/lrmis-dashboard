import { useMemo, useState } from "react";
import { Download, BedDouble, ShieldCheck, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCSV } from "@/lib/csv";
import {
  SAMPLE_FACILITIES,
  BEDS_BY_AREA,
  REG_APPROVALS,
  INFRA_COMPLIANCE,
  INFRA_CATEGORIES,
} from "@/lib/mock-data";
import type { FacilityRow } from "@/components/facility-list-panel";

type TabKey = "beds" | "regulatory" | "infrastructure";
type RegStatus = "All" | "Compliant" | "Non-Compliant";

const TAB_DEFS: Array<{ key: TabKey; label: string; icon: typeof BedDouble }> = [
  { key: "beds", label: "Bed Availability", icon: BedDouble },
  { key: "regulatory", label: "Regulatory Approvals", icon: ShieldCheck },
  { key: "infrastructure", label: "Infrastructure Compliance", icon: Layers },
];

const cols = (
  extra: Array<{ key: keyof FacilityRow; label: string }>,
): Array<{ key: keyof FacilityRow; label: string }> => [
  { key: "facility", label: "Facility" },
  { key: "district", label: "District" },
  { key: "type", label: "Type" },
  ...extra,
];

export function FacilityInfraTable() {
  const [tab, setTab] = useState<TabKey>("beds");

  // mirrors the #/% toggle on the Bed Availability chart
  const [bedsMode, setBedsMode] = useState<"%" | "#">("#");
  const [bedsArea, setBedsArea] = useState("All");

  // mirrors the #/% toggle + Compliant/Non-Compliant bars on the Regulatory chart
  const [regCategory, setRegCategory] = useState("All");
  const [regStatus, setRegStatus] = useState<RegStatus>("All");

  // mirrors the #/% toggle + area-then-category drilldown on the Infrastructure chart
  const [infraMode, setInfraMode] = useState<"%" | "#">("%");
  const [infraArea, setInfraArea] = useState("All");
  const [infraCategory, setInfraCategory] = useState("All");

  const totalBeds = useMemo(() => BEDS_BY_AREA.reduce((s, b) => s + b.count, 0), []);

  const { rows, columns, filename, caption } = useMemo(() => {
    switch (tab) {
      case "beds": {
        const areas =
          bedsArea === "All" ? BEDS_BY_AREA : BEDS_BY_AREA.filter((b) => b.area === bedsArea);
        const rows: FacilityRow[] = [];
        areas.forEach((areaRow) => {
          SAMPLE_FACILITIES.slice(0, 6).forEach((f, i) => {
            const share = (i + 1) / 21;
            const count = Math.max(2, Math.round(areaRow.count * share));
            rows.push({
              facility: f.facility,
              district: f.district,
              type: f.type,
              "Service Area": areaRow.area,
              Beds: bedsMode === "%" ? `${((count / totalBeds) * 100).toFixed(1)}%` : count,
            });
          });
        });
        return {
          rows,
          columns: cols([
            { key: "Service Area", label: "Service Area" },
            { key: "Beds", label: bedsMode === "%" ? "Share of Total Beds" : "Bed Count" },
          ]),
          filename: `beds_${bedsArea}`,
          caption: `Bed availability${bedsArea !== "All" ? ` — ${bedsArea}` : " — all service areas"}`,
        };
      }
      case "regulatory": {
        const cats = regCategory === "All" ? REG_APPROVALS.map((r) => r.category) : [regCategory];
        let rows: FacilityRow[] = [];
        cats.forEach((cat) => {
          SAMPLE_FACILITIES.slice(0, 8).forEach((f, i) => {
            const status: RegStatus = i % 3 === 0 ? "Non-Compliant" : "Compliant";
            rows.push({
              facility: f.facility,
              district: f.district,
              type: f.type,
              Category: cat,
              Status: status,
              "Fire NOC": status === "Compliant" || i % 2 === 0 ? "✓" : "✗",
              "PCB NOC": status === "Compliant" ? "✓" : "✗",
              SUMAN: status === "Compliant" || i % 4 !== 0 ? "✓" : "✗",
            });
          });
        });
        if (regStatus !== "All") rows = rows.filter((r) => r.Status === regStatus);
        return {
          rows,
          columns: cols([
            { key: "Category", label: "Category" },
            { key: "Status", label: "Status" },
            { key: "Fire NOC", label: "Fire NOC" },
            { key: "PCB NOC", label: "PCB NOC" },
            { key: "SUMAN", label: "SUMAN" },
          ]),
          filename: `regulatory_${regCategory}_${regStatus}`,
          caption: `Regulatory approvals${regCategory !== "All" ? ` — ${regCategory}` : ""}${regStatus !== "All" ? ` (${regStatus})` : ""}`,
        };
      }
      case "infrastructure": {
        const areas = infraArea === "All" ? INFRA_COMPLIANCE.map((r) => r.area) : [infraArea];
        const cats =
          infraCategory === "All" ? INFRA_CATEGORIES.map((c) => c.category) : [infraCategory];
        const rows: FacilityRow[] = [];
        areas.forEach((area) => {
          cats.forEach((cat, ci) => {
            SAMPLE_FACILITIES.slice(0, 4).forEach((f, i) => {
              const score = Math.max(
                20,
                Math.min(98, 55 + ((i + ci) % 7) * 6 - (area === "Obs HDU" ? 8 : 0)),
              );
              rows.push({
                facility: f.facility,
                district: f.district,
                block: f.block,
                type: f.type,
                Area: area,
                Category: cat,
                Score: infraMode === "%" ? `${score}%` : score,
              });
            });
          });
        });
        return {
          rows,
          columns: [
            { key: "facility", label: "Facility" },
            { key: "district", label: "District" },
            { key: "block", label: "Block" },
            { key: "type", label: "Type" },
            { key: "Area", label: "Service Area" },
            { key: "Category", label: "Category" },
            { key: "Score", label: "Compliance Score" },
          ],
          filename: `infra_${infraArea}_${infraCategory}`,
          caption: `Infrastructure compliance${infraArea !== "All" ? ` — ${infraArea}` : ""}${infraCategory !== "All" ? ` · ${infraCategory}` : ""}`,
        };
      }
    }
  }, [
    tab,
    bedsMode,
    bedsArea,
    regCategory,
    regStatus,
    infraMode,
    infraArea,
    infraCategory,
    totalBeds,
  ]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            {TAB_DEFS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          {tab === "beds" && (
            <>
              <Select value={bedsArea} onValueChange={setBedsArea}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All Service Areas
                  </SelectItem>
                  {BEDS_BY_AREA.map((b) => (
                    <SelectItem key={b.area} value={b.area} className="text-xs">
                      {b.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
                {(["#", "%"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setBedsMode(m)}
                    className={`px-2.5 py-1.5 font-semibold ${bedsMode === m ? "bg-navy text-navy-foreground" : "bg-white text-muted-foreground hover:bg-secondary"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "regulatory" && (
            <>
              <Select value={regCategory} onValueChange={setRegCategory}>
                <SelectTrigger className="h-9 w-[170px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All Categories
                  </SelectItem>
                  {REG_APPROVALS.map((r) => (
                    <SelectItem key={r.category} value={r.category} className="text-xs">
                      {r.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={regStatus} onValueChange={(v) => setRegStatus(v as RegStatus)}>
                <SelectTrigger className="h-9 w-[150px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="Compliant" className="text-xs">
                    Compliant
                  </SelectItem>
                  <SelectItem value="Non-Compliant" className="text-xs">
                    Non-Compliant
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {tab === "infrastructure" && (
            <>
              <Select value={infraArea} onValueChange={setInfraArea}>
                <SelectTrigger className="h-9 w-[170px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All Service Areas
                  </SelectItem>
                  {INFRA_COMPLIANCE.map((r) => (
                    <SelectItem key={r.area} value={r.area} className="text-xs">
                      {r.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={infraCategory} onValueChange={setInfraCategory}>
                <SelectTrigger className="h-9 w-[190px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All Categories
                  </SelectItem>
                  {INFRA_CATEGORIES.map((c) => (
                    <SelectItem key={c.category} value={c.category} className="text-xs">
                      {c.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
                {(["#", "%"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setInfraMode(m)}
                    className={`px-2.5 py-1.5 font-semibold ${infraMode === m ? "bg-navy text-navy-foreground" : "bg-white text-muted-foreground hover:bg-secondary"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => downloadCSV(rows, filename)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <h4 className="text-xs font-semibold text-navy">{caption} — May 2026</h4>
        <span className="text-[11px] text-muted-foreground">{rows.length} rows</span>
      </div>

      <div className="overflow-auto p-4 pt-2">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-3 py-2 text-left">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No rows match this filter
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={`${r.facility}-${i}`}
                className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} border-t border-border/60`}
              >
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-3 py-2 text-foreground">
                    {String(r[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

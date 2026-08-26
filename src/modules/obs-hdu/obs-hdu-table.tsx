import { useMemo, useState } from "react";
import { Download, ClipboardList, Stethoscope, BedDouble, Activity, Wrench } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCSV } from "@/lib/csv";
import { SAMPLE_FACILITIES, HDU_DIAGNOSIS, HDU_OUTCOME, HDU_EQUIPMENT } from "@/lib/mock-data";
import type { FacilityRow } from "@/components/facility-list-panel";
import { REFERRAL_IN_BY_LEVEL } from "@/lib/mock-extra";

type TabKey = "admissions" | "diagnosis" | "occupancy" | "outcome" | "equipment";

function hduFacilityList(
  extra: Record<string, (i: number) => string | number>,
  count = 12,
): FacilityRow[] {
  return SAMPLE_FACILITIES.slice(0, count).map((f, i) => {
    const row: FacilityRow = {
      facility: f.facility,
      district: f.district,
      type: f.type,
      "HDU Admissions": 30 + ((i * 17) % 70),
      "Bed Occupancy %": (28 + ((i * 11) % 40)).toFixed(1) + "%",
    };
    for (const [k, fn] of Object.entries(extra)) row[k] = fn(i);
    return row;
  });
}

const TAB_DEFS: Array<{ key: TabKey; label: string; icon: typeof ClipboardList }> = [
  { key: "admissions", label: "Admissions", icon: ClipboardList },
  { key: "diagnosis", label: "Diagnosis", icon: Stethoscope },
  { key: "occupancy", label: "Occupancy", icon: BedDouble },
  { key: "outcome", label: "Outcome", icon: Activity },
  { key: "equipment", label: "Equipment", icon: Wrench },
];

const cols = (
  extra: Array<{ key: keyof FacilityRow; label: string }>,
): Array<{ key: keyof FacilityRow; label: string }> => [
  { key: "facility", label: "Facility" },
  { key: "district", label: "District" },
  { key: "type", label: "Type" },
  { key: "HDU Admissions", label: "HDU Admissions" },
  { key: "Bed Occupancy %", label: "Bed Occupancy" },
  ...extra,
];

export function ObsHduTable() {
  const [tab, setTab] = useState<TabKey>("admissions");

  // mirrors the %/# toggles on the Diagnosis and Outcome charts
  const [diagMode, setDiagMode] = useState<"%" | "#">("#");
  const [outcomeMode, setOutcomeMode] = useState<"%" | "#">("#");

  const months = useMemo(() => REFERRAL_IN_BY_LEVEL.map((d) => d.month), []);
  const [monthIdx, setMonthIdx] = useState(months.length - 1);

  // mirrors the categories shown in each chart's legend/axis
  const [diagFilter, setDiagFilter] = useState("All");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [equipFilter, setEquipFilter] = useState("All");
  const [occupancyFilter, setOccupancyFilter] = useState<"All" | "Above" | "Below">("All");

  const diagTotal = useMemo(() => HDU_DIAGNOSIS.reduce((s, d) => s + d.count, 0), []);
  const outcomeTotal = useMemo(() => HDU_OUTCOME.reduce((s, o) => s + o.count, 0), []);

  const { rows, columns, filename, caption } = useMemo(() => {
    switch (tab) {
      case "admissions": {
        const rows = hduFacilityList({
          "Trend vs prev month": (i) => (i % 3 === 0 ? "↓ down" : "↑ up"),
        });
        return {
          rows,
          columns: cols([{ key: "Trend vs prev month", label: "Trend vs prev month" }]),
          filename: "hdu_admissions_facilities",
          caption: "Facilities driving the month-wise admission trend",
        };
      }
      case "diagnosis": {
        let rows = hduFacilityList({
          "Top diagnosis": (i) => HDU_DIAGNOSIS[i % HDU_DIAGNOSIS.length].name,
          Cases: (i) => {
            const d = HDU_DIAGNOSIS[i % HDU_DIAGNOSIS.length];
            return diagMode === "%" ? `${((d.count / diagTotal) * 100).toFixed(1)}%` : d.count;
          },
        });
        if (diagFilter !== "All") rows = rows.filter((r) => r["Top diagnosis"] === diagFilter);
        return {
          rows,
          columns: cols([
            { key: "Top diagnosis", label: "Top diagnosis" },
            { key: "Cases", label: diagMode === "%" ? "Share %" : "Cases" },
          ]),
          filename: "hdu_diagnosis_facilities",
          caption: "Facilities by primary diagnosis at admission",
        };
      }
      case "occupancy": {
        let rows = hduFacilityList({
          "vs Target (40%)": (i) => (28 + ((i * 11) % 40) >= 40 ? "Above" : "Below"),
        });
        if (occupancyFilter !== "All")
          rows = rows.filter((r) => r["vs Target (40%)"] === occupancyFilter);
        return {
          rows,
          columns: cols([{ key: "vs Target (40%)", label: "vs Target (40%)" }]),
          filename: "hdu_occupancy_facilities",
          caption: "Facility-level bed occupancy vs the 40% target",
        };
      }
      case "outcome": {
        let rows = hduFacilityList({
          "Most common outcome": (i) => HDU_OUTCOME[i % HDU_OUTCOME.length].name,
          Count: (i) => {
            const o = HDU_OUTCOME[i % HDU_OUTCOME.length];
            return outcomeMode === "%"
              ? `${((o.count / outcomeTotal) * 100).toFixed(1)}%`
              : o.count;
          },
        });
        if (outcomeFilter !== "All")
          rows = rows.filter((r) => r["Most common outcome"] === outcomeFilter);
        return {
          rows,
          columns: cols([
            { key: "Most common outcome", label: "Most common outcome" },
            { key: "Count", label: outcomeMode === "%" ? "Share %" : "Count" },
          ]),
          filename: "hdu_outcome_facilities",
          caption: "Facilities by most common patient outcome",
        };
      }
      case "equipment": {
        let rows = hduFacilityList({
          "Missing equipment": (i) => HDU_EQUIPMENT[i % HDU_EQUIPMENT.length].name,
        });
        if (equipFilter !== "All")
          rows = rows.filter((r) => r["Missing equipment"] === equipFilter);
        return {
          rows,
          columns: cols([{ key: "Missing equipment", label: "Missing equipment" }]),
          filename: "hdu_equipment_facilities",
          caption: "Facilities with critical-equipment gaps",
        };
      }
    }
  }, [
    tab,
    diagMode,
    outcomeMode,
    diagFilter,
    outcomeFilter,
    equipFilter,
    occupancyFilter,
    diagTotal,
    outcomeTotal,
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
          <Select value={String(monthIdx)} onValueChange={(v) => setMonthIdx(Number(v))}>
            <SelectTrigger className="h-9 w-[130px] text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i)} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tab === "diagnosis" && (
            <>
              <Select value={diagFilter} onValueChange={setDiagFilter}>
                <SelectTrigger className="h-9 w-[190px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All diagnoses
                  </SelectItem>
                  {HDU_DIAGNOSIS.map((d) => (
                    <SelectItem key={d.name} value={d.name} className="text-xs">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
                {(["#", "%"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDiagMode(m)}
                    className={`px-2.5 py-1.5 font-semibold ${diagMode === m ? "bg-navy text-navy-foreground" : "bg-white text-muted-foreground hover:bg-secondary"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "occupancy" && (
            <Select
              value={occupancyFilter}
              onValueChange={(v) => setOccupancyFilter(v as typeof occupancyFilter)}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">
                  All facilities
                </SelectItem>
                <SelectItem value="Above" className="text-xs">
                  Above target
                </SelectItem>
                <SelectItem value="Below" className="text-xs">
                  Below target
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {tab === "outcome" && (
            <>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="h-9 w-[190px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">
                    All outcomes
                  </SelectItem>
                  {HDU_OUTCOME.map((o) => (
                    <SelectItem key={o.name} value={o.name} className="text-xs">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
                {(["#", "%"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setOutcomeMode(m)}
                    className={`px-2.5 py-1.5 font-semibold ${outcomeMode === m ? "bg-navy text-navy-foreground" : "bg-white text-muted-foreground hover:bg-secondary"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "equipment" && (
            <Select value={equipFilter} onValueChange={setEquipFilter}>
              <SelectTrigger className="h-9 w-[190px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">
                  All equipment
                </SelectItem>
                {HDU_EQUIPMENT.map((e) => (
                  <SelectItem key={e.name} value={e.name} className="text-xs">
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <span className="text-[11px] text-muted-foreground">{rows.length} facilities</span>
      </div>

      <div className="max-h-[560px] overflow-auto p-4 pt-2">
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
                  No facilities match this filter
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

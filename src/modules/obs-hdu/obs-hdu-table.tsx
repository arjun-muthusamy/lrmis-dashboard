import { useState } from "react";
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
import {
  OBS_HDU_ADMISSIONS,
  OBS_HDU_DIAGNOSIS,
  OBS_HDU_OCCUPANCY,
  OBS_HDU_OUTCOME,
  OBS_HDU_EQUIPMENT,
} from "@/lib/mock-data";
import { REFERRAL_IN_BY_LEVEL } from "@/lib/mock-extra";

type TabKey = "admissions" | "diagnosis" | "occupancy" | "outcome" | "equipment";

type TableRow = Record<string, string | number>;

function filterRows(rows: TableRow[], field: string, value: string) {
  return value === "All" ? rows : rows.filter((row) => String(row[field]) === value);
}

const TAB_DEFS: Array<{ key: TabKey; label: string; icon: typeof ClipboardList }> = [
  { key: "admissions", label: "Admissions", icon: ClipboardList },
  { key: "diagnosis", label: "Diagnosis", icon: Stethoscope },
  { key: "occupancy", label: "Occupancy", icon: BedDouble },
  { key: "outcome", label: "Outcome", icon: Activity },
  { key: "equipment", label: "Equipment", icon: Wrench },
];

const columnsFor = (keys: string[]): Array<{ key: string; label: string }> =>
  keys.map((key) => ({ key, label: key }));

export function ObsHduTable() {
  const [tab, setTab] = useState<TabKey>("admissions");
  const [diagFilter, setDiagFilter] = useState("All");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [equipFilter, setEquipFilter] = useState("All");
  const [occupancyFilter, setOccupancyFilter] = useState("All");

  const { rows, columns, filename, caption } = (() => {
    switch (tab) {
      case "admissions":
        return {
          rows: OBS_HDU_ADMISSIONS,
          columns: columnsFor([
            "Division",
            "District",
            "Block",
            "Facility",
            "Date of Admission",
            "Name of Patient",
            "Indoor ID",
          ]),
          filename: "hdu_admissions",
          caption: "HDU patient admissions",
        };

      case "diagnosis":
        return {
          rows: filterRows(OBS_HDU_DIAGNOSIS, "Diagnosis Name", diagFilter),
          columns: columnsFor([
            "Division",
            "District",
            "Block",
            "Facility",
            "Diagnosis Name",
            "Patient Name",
            "Indoor ID",
          ]),
          filename: "hdu_diagnosis",
          caption: "HDU patient diagnosis",
        };

      case "occupancy":
        return {
          rows: filterRows(OBS_HDU_OCCUPANCY, "Division", occupancyFilter),
          columns: columnsFor([
            "Division",
            "District",
            "Total no of beds",
            "Total no of admission",
            "Average stay",
            "Bed occupancy rate (Obs HDU) %",
          ]),
          filename: "hdu_bed_occupancy",
          caption: "HDU bed occupancy",
        };

      case "outcome":
        return {
          rows: filterRows(OBS_HDU_OUTCOME, "Diagnosis Name", outcomeFilter),
          columns: columnsFor([
            "Division",
            "District",
            "Block",
            "Facility",
            "Diagnosis Name",
            "Patient Name",
          ]),
          filename: "hdu_outcome_of_patient",
          caption: "Outcome of patients",
        };

      case "equipment":
        return {
          rows: filterRows(OBS_HDU_EQUIPMENT, "Indicator", equipFilter),
          columns: columnsFor([
            "Division",
            "District",
            "Block",
            "Facility",
            "Indicator",
            "Patient Name",
          ]),
          filename: "hdu_equipments",
          caption: "Equipment indicators",
        };
    }
  })();

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
          {tab === "diagnosis" && (
            <Select value={diagFilter} onValueChange={setDiagFilter}>
              <SelectTrigger className="h-9 w-[220px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">
                  All diagnoses
                </SelectItem>
                {Array.from(new Set(OBS_HDU_DIAGNOSIS.map((r) => String(r["Diagnosis Name"])))).map(
                  (name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          )}

          {tab === "occupancy" && (
            <Select value={occupancyFilter} onValueChange={setOccupancyFilter}>
              <SelectTrigger className="h-9 w-[160px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">
                  All divisions
                </SelectItem>
                {Array.from(new Set(OBS_HDU_OCCUPANCY.map((r) => String(r["Division"])))).map(
                  (division) => (
                    <SelectItem key={division} value={division} className="text-xs">
                      {division}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          )}

          {tab === "outcome" && (
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="h-9 w-[220px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">
                  All diagnoses
                </SelectItem>
                {Array.from(new Set(OBS_HDU_OUTCOME.map((r) => String(r["Diagnosis Name"])))).map(
                  (name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          )}

          {tab === "equipment" && (
            <Select value={equipFilter} onValueChange={setEquipFilter}>
              <SelectTrigger className="h-9 w-[240px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">
                  All indicators
                </SelectItem>
                {Array.from(new Set(OBS_HDU_EQUIPMENT.map((r) => String(r["Indicator"])))).map(
                  (indicator) => (
                    <SelectItem key={indicator} value={indicator} className="text-xs">
                      {indicator}
                    </SelectItem>
                  ),
                )}
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
        <h4 className="text-xs font-semibold text-navy">{caption}</h4>
        <span className="text-[11px] text-muted-foreground">{rows.length} records</span>
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
                  No records match this filter
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={`${String(r["Indoor ID"] ?? r["Patient Name"] ?? r["Facility"] ?? i)}-${i}`}
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

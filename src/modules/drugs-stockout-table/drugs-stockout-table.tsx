import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCSV } from "@/lib/csv";
import { SAMPLE_FACILITIES, STOCKOUT_TREND } from "@/lib/mock-data";
import type { FacilityRow } from "@/components/facility-list-panel";

type FacilityType = "All" | "DH" | "CHC" | "PHC" | "SHC";

interface Props {
  kind: string;
  kindLabel: string;
  item: string;
  facilityType: FacilityType;
}

const DIVISIONS = ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"];

export function DrugsStockoutTable({ kind, kindLabel, item, facilityType }: Props) {
  const months = useMemo(() => STOCKOUT_TREND.map((d) => d.month), []);
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const month = months[monthIdx];

  const rows: FacilityRow[] = useMemo(() => {
    const pool = SAMPLE_FACILITIES.filter((f) => facilityType === "All" || f.type === facilityType);
    return pool.slice(0, 20).map((f, i) => ({
      facility: f.facility,
      district: f.district,
      division: DIVISIONS[i % DIVISIONS.length],
      type: f.type,
      item: item === "All" ? kindLabel : item,
      "Stockout Since (days)": 5 + ((i * 7 + monthIdx * 3) % 90),
      "Last Reported": month,
    }));
  }, [facilityType, item, kindLabel, month, monthIdx]);

  const columns: Array<{ key: keyof FacilityRow; label: string }> = [
    { key: "facility", label: "Facility" },
    { key: "district", label: "District" },
    { key: "division", label: "Division" },
    { key: "type", label: "Type" },
    { key: "item", label: "Item" },
    { key: "Stockout Since (days)", label: "Stockout Since (days)" },
    { key: "Last Reported", label: "Last Reported" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h4 className="text-sm font-semibold text-navy">
            Facilities reporting stockout — {kindLabel}
            {item !== "All" ? ` · ${item}` : ""} ({facilityType === "All" ? "All Facility Types" : facilityType})
          </h4>
          <p className="text-[11px] text-muted-foreground">{rows.length} facilities · {month}</p>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => downloadCSV(rows, `stockout_${kind}_${item}_${facilityType}_${month}`)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      <div className="p-4 pt-3">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-3 py-2 text-left">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  No facilities match this filter
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.facility}-${i}`} className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} border-t border-border/60`}>
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-3 py-2 text-foreground">{String(r[c.key] ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
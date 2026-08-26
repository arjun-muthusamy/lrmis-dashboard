import { useMemo, useState } from "react";
import { Download, ClipboardCheck, ClipboardPen, ClipboardX } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCSV } from "@/lib/csv";
import { facilitiesForDistrict } from "@/lib/facility-mock";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import type { FacilityRow } from "@/components/facility-list-panel";

const WARDS = ["ANC ward", "Labour Room", "MOT", "Obs HDU", "PNC Ward", "Post Operative Ward"];

type StatusTab = "Submitted" | "Partial" | "Not Started";

const TAB_DEFS: Array<{ key: StatusTab; label: string; icon: typeof ClipboardCheck }> = [
  { key: "Submitted", label: "Submitted", icon: ClipboardCheck },
  { key: "Partial", label: "Partial Submitted", icon: ClipboardPen },
  { key: "Not Started", label: "Not Started", icon: ClipboardX },
];

function seedNum(s: string, max: number) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h) % max;
}

interface Props {
  district: string;
}

export function WardSubmissionTable({ district }: Props) {
  const [tab, setTab] = useState<StatusTab>("Not Started");
  const [ward, setWard] = useState("All");

  const districtRow = DISTRICT_ROWS.find((d) => d.district === district) ?? DISTRICT_ROWS[0];
  const facilities = useMemo(
    () => facilitiesForDistrict(district, districtRow.composite),
    [district, districtRow.composite],
  );
  const wards = ward === "All" ? WARDS : [ward];

  const rows: FacilityRow[] = useMemo(() => {
    const out: FacilityRow[] = [];
    wards.forEach((w) => {
      facilities.forEach((f) => {
        const s = seedNum(f.facility + w, 3);
        const status: StatusTab = (["Submitted", "Not Started", "Partial"] as const)[s];
        if (status !== tab) return;
        out.push({
          facility: f.facility,
          district: f.district,
          type: f.type,
          Ward: w,
          "Last Update": `${27 - seedNum(f.facility + w, 10)} May 2026`,
        });
      });
    });
    return out;
  }, [wards, facilities, tab]);

  const columns: Array<{ key: keyof FacilityRow; label: string }> = [
    { key: "facility", label: "Facility" },
    { key: "district", label: "District" },
    { key: "type", label: "Type" },
    { key: "Ward", label: "Ward" },
    { key: "Last Update", label: "Last Update" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
          <TabsList>
            {TAB_DEFS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={ward} onValueChange={setWard}>
            <SelectTrigger className="h-9 w-[190px] text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="text-xs">
                All Wards
              </SelectItem>
              {WARDS.map((w) => (
                <SelectItem key={w} value={w} className="text-xs">
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => downloadCSV(rows, `ward_${tab}_${ward}_${district}`)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <h4 className="text-xs font-semibold text-navy">
          {tab} — {ward === "All" ? "All Wards" : ward} · {district}
        </h4>
        <span className="text-[11px] text-muted-foreground">{rows.length} facilities</span>
      </div>

      <div className="max-h-[420px] overflow-auto p-4 pt-2">
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
                key={`${r.facility}-${r.Ward}-${i}`}
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

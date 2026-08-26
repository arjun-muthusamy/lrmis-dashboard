import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import { StatCard } from "@/components/stat-card";
import { FacilityListPanel, type FacilityRow } from "@/components/facility-list-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, FileWarning, Activity } from "lucide-react";
import { ALL_DISTRICTS } from "@/lib/districts";
import { facilitiesForDistrict } from "@/lib/facility-mock";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import { AnalyticCard } from "@/components/analytic-card";
import { WardSubmissionTable } from "@/modules/ward-submission-table/ward-submission-table";

export const Route = createFileRoute("/_app/app-utility")({
  head: () => ({ meta: [{ title: "App Utility — LRMIS" }] }),
  component: AppUtilityPage,
});

const WARDS = ["ANC ward", "Labour Room", "MOT", "Obs HDU", "PNC Ward", "Post Operative Ward"];

function seedNum(s: string, max: number) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h) % max;
}

function AppUtilityPage() {
  const [district, setDistrict] = useState<string>("Anuppur");
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<{ title: string; rows: FacilityRow[] } | null>(null);

  const wardData = useMemo(() => {
    return WARDS.map((w) => {
      const total = 1700 + seedNum(district + w, 200);
      const submitted = 2 + seedNum(district + w + "s", 60);
      const partial = seedNum(district + w + "p", 12);
      return {
        ward: w,
        Submitted: submitted,
        "Partial Submitted": partial,
        "Not Started": total - submitted - partial,
        _total: total,
      };
    });
  }, [district]);

  const districtRow = DISTRICT_ROWS.find((d) => d.district === district) ?? DISTRICT_ROWS[0];
  const allFacilities = useMemo(
    () => facilitiesForDistrict(district, districtRow.composite),
    [district, districtRow.composite],
  );
  const filteredFacilities = allFacilities.filter(
    (f) => !search || f.facility.toLowerCase().includes(search.toLowerCase()),
  );

  const openWardPanel = (ward: string, status: string) => {
    setPanel({
      title: `${ward} — ${status} • ${district}`,
      rows: allFacilities.slice(0, 8).map((f, i) => ({
        facility: f.facility,
        district: f.district,
        type: f.type,
        ward,
        status,
        lastUpdate: `${27 - (i % 10)} May 2026`,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">App Utility</h1>
        <p className="text-sm text-muted-foreground">
          Submission status review and facility-level line lists.
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticCard icon={CheckCircle2} value="34" label="Submitted" color="green" />
        <AnalyticCard icon={FileWarning} value="0" label="Partial Submitted" color="amber" />
        <AnalyticCard icon={Activity} value="1,734" label="Not Started" color="red" />
      </div>

      {/* App utility review chart */}
      <ChartCard
        title="App Utility Review"
        info="Submission status per ward across MP. Click any bar to view facility list."
      >
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={wardData} margin={{ top: 24, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="ward" tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="Submitted"
              fill="#0B7B8A"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => openWardPanel(d.ward, "Submitted")}
            >
              <LabelList
                dataKey="Submitted"
                position="top"
                style={{ fontSize: 10, fontWeight: 600 }}
              />
            </Bar>
            <Bar
              dataKey="Partial Submitted"
              fill="#84CC16"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => openWardPanel(d.ward, "Partial")}
            >
              <LabelList
                dataKey="Partial Submitted"
                position="top"
                style={{ fontSize: 10, fontWeight: 600 }}
              />
            </Bar>
            <Bar
              dataKey="Not Started"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => openWardPanel(d.ward, "Not Started")}
            >
              <LabelList
                dataKey="Not Started"
                position="top"
                style={{ fontSize: 10, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* District selector + facility line list */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Monthly
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search facility..."
                className="h-9 w-60 pl-7 text-xs"
              />
            </div>
          </div>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="h-9 w-[200px] text-xs uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {ALL_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d} className="text-xs uppercase">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                {["Facility", "Type", "ANC", "LR", "MOT", "Obs HDU", "PNC", "Post-Op"].map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No facilities match search.
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((f, i) => (
                  <tr
                    key={f.facility}
                    className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} cursor-pointer hover:bg-teal-soft/40`}
                    onClick={() =>
                      setPanel({
                        title: `${f.facility} — Ward Submissions`,
                        rows: WARDS.map((w) => ({
                          facility: f.facility,
                          ward: w,
                          status: ["Submitted", "Not Started", "Partial"][
                            seedNum(f.facility + w, 3)
                          ],
                          lastUpdate: `${27 - seedNum(f.facility + w, 10)} May 2026`,
                        })),
                      })
                    }
                  >
                    <td className="px-3 py-2 text-[12px] font-medium text-foreground">
                      {f.facility}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{f.type}</td>
                    {WARDS.map((w) => {
                      const s = seedNum(f.facility + w, 3);
                      const status = ["✓", "—", "◐"][s];
                      const color = ["text-emerald-600", "text-rose-500", "text-amber-500"][s];
                      return (
                        <td
                          key={w}
                          className={`px-3 py-2 text-center text-base font-bold ${color}`}
                        >
                          {status}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WardSubmissionTable district={district} />

      {/* <FacilityListPanel
        open={!!panel}
        onClose={() => setPanel(null)}
        title={panel?.title ?? ""}
        rows={panel?.rows ?? []}
        columns={[
          { key: "facility", label: "Facility" },
          { key: "ward", label: "Ward" },
          { key: "status", label: "Status" },
          { key: "lastUpdate", label: "Last Update" },
        ]}
      /> */}
    </div>
  );
}

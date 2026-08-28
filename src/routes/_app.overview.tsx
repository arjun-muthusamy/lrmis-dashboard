import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileCheck, SlidersHorizontal, X } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { CHIP_DEFS, MPOutlineMap, type ChipKey, type MapMode } from "@/components/mp-outline-map";
import { ChartCard } from "@/components/chart-card";
import { type FacilityRow } from "@/components/facility-list-panel";
import { OVERVIEW_STATS, SAMPLE_FACILITIES } from "@/lib/mock-data";
import {
  REPORTING_COMPLETENESS_BY_LEVEL,
  NON_REPORTING_BY_LEVEL,
  OUTCOMES_LAST_MONTH,
  REPORTING_TIMELINESS_BY_LEVEL,
  LEVEL_DENOM,
} from "@/lib/mock-extra";
import { downloadCSV } from "@/lib/csv";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { OverviewStatsStrip } from "@/components/OverviewStatsStrip";
import { OverviewStatsStripLight } from "@/components/OverviewStatsStripLight";
import { DistrictTable } from "@/modules/overview/DistrictTable";
import { INTERSECTIONS, type IntersectionKey } from "@/lib/intersections";

export const Route = createFileRoute("/_app/overview")({
  head: () => ({ meta: [{ title: "Overview and Facility Performance — LRMIS" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<
    "none" | "supervision" | "maternalDeaths" | "neonatalDeaths" | `intersection:${IntersectionKey}`
  >("none");
  const [chips, setChips] = useState<ChipKey[]>([]);
  const [dqLevel, setDqLevel] = useState<"All" | "L1" | "L2" | "L3">("All");
  const [dqMode, setDqMode] = useState<"%" | "#">("%");
  const [dqView, setDqView] = useState<"completeness" | "timeliness">("completeness");
  const [gapPanel, setGapPanel] = useState<{ month: string; rows: FacilityRow[] } | null>(null);
  const mapMode = useMemo<MapMode>(() => {
    if (chips.length) return { kind: "chips", chips };
    if (analysis.startsWith("intersection:")) {
      return { kind: "intersection", preset: analysis.split(":")[1] as IntersectionKey };
    }
    if (analysis === "supervision") return { kind: "supervision" };
    if (analysis === "maternalDeaths") return { kind: "maternalDeaths" };
    if (analysis === "neonatalDeaths") return { kind: "neonatalDeaths" };
    return { kind: "rankings" };
  }, [analysis, chips]);

  const setAnalysisMode = (value: typeof analysis) => {
    setAnalysis(value);
    setChips([]);
  };

  const toggleChip = (key: ChipKey) => {
    setAnalysis("none");
    setChips((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Overview and Facility Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            55 districts · 1,247 facilities · May 2026
          </p>
        </div>
      </div>

      {/* <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <StatCard icon={MapPin} value={OVERVIEW_STATS.districts} label="Districts" />
        <StatCard icon={Building2} value={OVERVIEW_STATS.deliveryPoints.toLocaleString()} label="Delivery Points" trend={{ value: "3 new", positive: true }} />
        <StatCard icon={Layers} value="" label=""
          breakdown={[
            { label: "L1", value: OVERVIEW_STATS.levels.L1.toLocaleString() },
            { label: "L2", value: OVERVIEW_STATS.levels.L2.toLocaleString() },
            { label: "L3", value: OVERVIEW_STATS.levels.L3.toLocaleString() },
          ]} />
        <StatCard icon={Activity} value="" label=""
          breakdown={[
            { label: "LR", value: OVERVIEW_STATS.rooms.LR.toLocaleString() },
            { label: "MOT", value: OVERVIEW_STATS.rooms.MOT.toLocaleString() },
            { label: "HDU", value: OVERVIEW_STATS.rooms.HDU.toLocaleString() },
          ]} />
        <StatCard icon={Star} value={OVERVIEW_STATS.frus} label="FRUs" trend={{ value: "2.3%", positive: true }} indicator="functionalFRU" />
        <StatCard icon={HeartPulse} value={OVERVIEW_STATS.totalDeliveries.toLocaleString()} label="Total Deliveries" trend={{ value: "4.1%", positive: true }} />
        <StatCard icon={Skull} value={OUTCOMES_LAST_MONTH.maternalDeaths} label="Maternal Deaths (last mo.)" />
        <StatCard icon={Baby} value={OUTCOMES_LAST_MONTH.neonatalDeaths} label="Neonatal Deaths (last mo.)" />
      </div> */}
      {/* <OverviewStatsStripMain
        OVERVIEW_STATS={OVERVIEW_STATS}
        OUTCOMES_LAST_MONTH={OUTCOMES_LAST_MONTH}
      />
      <OverviewStatsStripMinimal
        OVERVIEW_STATS={OVERVIEW_STATS}
        OUTCOMES_LAST_MONTH={OUTCOMES_LAST_MONTH}
      /> */}
      <OverviewStatsStripLight
        OVERVIEW_STATS={OVERVIEW_STATS}
        OUTCOMES_LAST_MONTH={OUTCOMES_LAST_MONTH}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">District Analysis Map</h3>
            <p className="text-[11px] text-muted-foreground">
              One state view · apply an analysis to focus matching districts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
            <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Map analysis
            </div>
            <Select
              value={analysis === "supervision" ? analysis : ""}
              onValueChange={(value) => setAnalysisMode(value as typeof analysis)}
            >
              <SelectTrigger className="h-8 w-[155px] bg-white text-xs">
                <SelectValue placeholder="Supervision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervision" className="text-xs">
                  Supervision required
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={analysis === "maternalDeaths" || analysis === "neonatalDeaths" ? analysis : ""}
              onValueChange={(value) => setAnalysisMode(value as typeof analysis)}
            >
              <SelectTrigger className="h-8 w-[165px] bg-white text-xs">
                <SelectValue placeholder="Mortality overlay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maternalDeaths" className="text-xs">
                  Maternal deaths
                </SelectItem>
                <SelectItem value="neonatalDeaths" className="text-xs">
                  Neonatal deaths
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={analysis.startsWith("intersection:") ? analysis : ""}
              onValueChange={(value) => setAnalysisMode(value as typeof analysis)}
            >
              <SelectTrigger className="h-8 w-[210px] bg-white text-xs">
                <SelectValue placeholder="Intersection preset" />
              </SelectTrigger>
              <SelectContent>
                {INTERSECTIONS.map((preset) => (
                  <SelectItem
                    key={preset.key}
                    value={`intersection:${preset.key}`}
                    className="text-xs"
                  >
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(analysis !== "none" || chips.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setAnalysis("none");
                  setChips([]);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
        <MPOutlineMap
          mode={mapMode}
          onSelect={(d) => {
            navigate({ to: "/district/$districtId", params: { districtId: d } });
          }}
        />
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Parameter chips — combine to study intersections
              </div>
              <div className="text-[10px] text-muted-foreground">
                Select multiple conditions to find districts where they occur together.
              </div>
            </div>
            {chips.length > 0 && (
              <button
                type="button"
                onClick={() => setChips([])}
                className="text-[11px] font-medium text-teal hover:underline"
              >
                Clear ({chips.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHIP_DEFS.map((chip) => {
              const active = chips.includes(chip.key);
              const activeClass =
                chip.tone === "green"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : chip.tone === "amber"
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-rose-600 bg-rose-600 text-white";
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleChip(chip.key)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? activeClass
                      : "border-border bg-white text-muted-foreground hover:border-teal/40 hover:bg-teal-soft/30"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Quality */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-teal" />
          <h2 className="text-base font-semibold text-foreground">Data Quality</h2>
        </div>
        <Select value={dqLevel} onValueChange={(v) => setDqLevel(v as typeof dqLevel)}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["All", "L1", "L2", "L3"] as const).map((l) => (
              <SelectItem key={l} value={l} className="text-xs">
                {l === "All" ? "All Levels" : l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={
            dqView === "completeness"
              ? "Reporting Completeness Trend"
              : "Reporting Timeliness Trend"
          }
          info={
            dqView === "completeness"
              ? "Share of expected LRMIS reports submitted each month (target 90%). Filter by facility level."
              : "Of expected LRMIS reports: submitted on time (before the 27th of the following month), submitted late (after the cut-off), and never submitted."
          }
          toggle={{ value: dqMode, onChange: setDqMode }}
          onDownload={() =>
            dqView === "completeness"
              ? downloadCSV(REPORTING_COMPLETENESS_BY_LEVEL, "reporting_completeness_by_level")
              : downloadCSV(
                  REPORTING_TIMELINESS_BY_LEVEL.map((d) => ({ month: d.month, ...d[dqLevel] })),
                  `reporting_timeliness_${dqLevel}`,
                )
          }
          headerRight={
            <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
              {(
                [
                  ["completeness", "Completeness"],
                  ["timeliness", "Timeliness"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setDqView(v)}
                  className={`px-2 py-0.5 font-semibold ${dqView === v ? "bg-navy text-navy-foreground" : "bg-white text-muted-foreground hover:bg-secondary"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          }
        >
          {dqView === "completeness" ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={REPORTING_COMPLETENESS_BY_LEVEL.map((d) => ({
                  month: d.month,
                  rate: d[dqLevel],
                  count: Math.round((d[dqLevel] / 100) * LEVEL_DENOM[dqLevel]),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  domain={dqMode === "%" ? [70, 100] : ["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) =>
                    dqMode === "%" ? [`${v}%`, "Completeness"] : [v.toLocaleString(), "Facilities"]
                  }
                />
                {dqMode === "%" && (
                  <ReferenceLine
                    y={90}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={{ value: "Target 90%", fontSize: 10, fill: "#059669" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={dqMode === "%" ? "rate" : "count"}
                  stroke="#0B7B8A"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={REPORTING_TIMELINESS_BY_LEVEL.map((d) => {
                    const t = d[dqLevel];
                    const den = LEVEL_DENOM[dqLevel];
                    const f = (p: number) => (dqMode === "%" ? p : Math.round((p / 100) * den));
                    return {
                      month: d.month,
                      onTime: f(t.onTime),
                      late: f(t.late),
                      missed: f(t.missed),
                    };
                  })}
                  stackOffset={dqMode === "%" ? "none" : undefined}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number, n) => [
                      dqMode === "%" ? `${v}%` : v.toLocaleString(),
                      n === "onTime"
                        ? "On time (before 27th)"
                        : n === "late"
                          ? "Late (after 27th)"
                          : "Not submitted",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(n) =>
                      n === "onTime"
                        ? "On time (before 27th)"
                        : n === "late"
                          ? "Late (after 27th)"
                          : "Not submitted"
                    }
                  />
                  <Bar dataKey="onTime" stackId="a" fill="#0B7B8A" />
                  <Bar dataKey="late" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="missed" stackId="a" fill="#E11D48" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-[10px] italic text-muted-foreground">
                Cut-off: reports for a month must be submitted before the 27th of the following
                month.
              </p>
            </>
          )}
        </ChartCard>

        <ChartCard
          title="Facility Reporting Gap — Monthly Trend"
          info="Facilities NOT submitting LRMIS reports for 2+ consecutive months. Filter by level."
          toggle={{ value: dqMode, onChange: setDqMode }}
          onDownload={() => downloadCSV(NON_REPORTING_BY_LEVEL, "non_reporting_by_level")}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={NON_REPORTING_BY_LEVEL.map((d) => {
                const cnt = d[dqLevel];
                const denom =
                  dqLevel === "L1" ? 843 : dqLevel === "L2" ? 312 : dqLevel === "L3" ? 92 : 1247;
                return { month: d.month, count: cnt, pct: +((cnt / denom) * 100).toFixed(1) };
              })}
              onClick={(e) => {
                const m = (e as { activeLabel?: string })?.activeLabel;
                if (!m) return;
                const row = NON_REPORTING_BY_LEVEL.find((x) => x.month === m);
                if (!row) return;
                const n = row[dqLevel];
                const rows = SAMPLE_FACILITIES.slice(0, Math.min(n, 40)).map((f, i) => ({
                  facility: f.facility,
                  district: f.district,
                  type: f.type,
                  "Last LRMIS Report": ["Mar 2026", "Feb 2026", "Jan 2026"][i % 3],
                  "Consecutive months missed": 2 + (i % 4),
                }));
                setGapPanel({ month: m, rows });
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) =>
                  dqMode === "%" ? [`${v}%`, "Non-Reporting"] : [v.toLocaleString(), "Facilities"]
                }
              />
              <Line
                type="monotone"
                dataKey={dqMode === "%" ? "pct" : "count"}
                stroke="#E11D48"
                strokeWidth={2.5}
                dot={{ r: 4, cursor: "pointer" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-1 text-[10px] italic text-muted-foreground">
            Click any month dot to see the line-list of non-reporting facilities.
          </p>
        </ChartCard>
      </div>

      <DistrictTable />

      {/* <FacilityListPanel
        open={!!gapPanel}
        onClose={() => setGapPanel(null)}
        title={gapPanel ? `Facilities not reporting (${dqLevel}) — ${gapPanel.month}` : ""}
        rows={gapPanel?.rows ?? []}
        columns={[
          { key: "facility", label: "Facility" },
          { key: "district", label: "District" },
          { key: "type", label: "Type" },
          { key: "Last LRMIS Report", label: "Last LRMIS Report" },
          { key: "Consecutive months missed", label: "Months Missed" },
        ]}
        filename={`reporting_gap_${dqLevel}_${gapPanel?.month ?? ""}`}
      /> */}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  MapPin,
  Building2,
  Layers,
  Activity,
  Star,
  HeartPulse,
  FileCheck,
  Skull,
  Baby,
} from "lucide-react";
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
import { StatCard } from "@/components/stat-card";
import { MPOutlineMap, type MapMode, CHIP_DEFS, type ChipKey } from "@/components/mp-outline-map";
import { DistrictDetailPanel } from "@/components/district-detail-panel";
import { ChartCard } from "@/components/chart-card";
import { FacilityListPanel, type FacilityRow } from "@/components/facility-list-panel";
import { DISTRICT_ROWS, OVERVIEW_STATS, SAMPLE_FACILITIES } from "@/lib/mock-data";
import {
  REPORTING_COMPLETENESS_BY_LEVEL,
  NON_REPORTING_BY_LEVEL,
  OUTCOMES_LAST_MONTH,
  REPORTING_TIMELINESS_BY_LEVEL,
  LEVEL_DENOM,
} from "@/lib/mock-extra";
import { INTERSECTIONS, type IntersectionKey } from "@/lib/intersections";
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

export const Route = createFileRoute("/_app/overview")({
  head: () => ({ meta: [{ title: "Overview and Facility Performance — LRMIS" }] }),
  component: OverviewPage,
});

type MapModeChoice =
  | "rankings"
  | "supervision"
  | "maternalDeaths"
  | "neonatalDeaths"
  | "chips"
  | `intersection:${IntersectionKey}`
  | `facilities:${"L1" | "L2" | "L3"}`;

function OverviewPage() {
  const [selected, setSelected] = useState<string | undefined>();
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();
  const [modeChoice, setModeChoice] = useState<MapModeChoice>("facilities:L3");
  const [chips, setChips] = useState<ChipKey[]>([]);
  const [dqLevel, setDqLevel] = useState<"All" | "L1" | "L2" | "L3">("All");
  const [dqMode, setDqMode] = useState<"%" | "#">("%");
  const [dqView, setDqView] = useState<"completeness" | "timeliness">("completeness");
  const [gapPanel, setGapPanel] = useState<{ month: string; rows: FacilityRow[] } | null>(null);

  const mapMode: MapMode = useMemo(() => {
    if (modeChoice === "chips") return { kind: "chips", chips };
    if (modeChoice.startsWith("intersection:")) {
      return { kind: "intersection", preset: modeChoice.split(":")[1] as IntersectionKey };
    }
    if (modeChoice.startsWith("facilities:")) {
      return { kind: "facilitiesByLevel", level: modeChoice.split(":")[1] as "L1" | "L2" | "L3" };
    }

    return { kind: modeChoice as "rankings" | "supervision" | "maternalDeaths" | "neonatalDeaths" };
  }, [modeChoice, chips]);

  const toggleChip = (k: ChipKey) => {
    setModeChoice("chips");
    setChips((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));
  };
  const clearChips = () => {
    setChips([]);
    setModeChoice("facilities:L3");
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Facility Performance Map</h3>
            <p className="text-[11px] text-muted-foreground">
              Facility-wise traffic light (green / amber / red) — click for detail
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Facility level pins */}
            <Select
              value={modeChoice.startsWith("facilities:") ? modeChoice : ""}
              onValueChange={(v) => {
                setModeChoice(v as MapModeChoice);
                setSelected(undefined);
              }}
            >
              <SelectTrigger className="h-9 w-[180px] text-xs bg-white">
                <SelectValue placeholder="Show facility pins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facilities:L1" className="text-xs">
                  📍 L1 facilities
                </SelectItem>
                <SelectItem value="facilities:L2" className="text-xs">
                  📍 L2 facilities
                </SelectItem>
                <SelectItem value="facilities:L3" className="text-xs">
                  📍 L3 facilities
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Supervision */}
            <Select
              value={modeChoice === "supervision" ? modeChoice : ""}
              onValueChange={(v) => {
                setModeChoice(v as MapModeChoice);
                setSelected(undefined);
              }}
            >
              <SelectTrigger className="h-9 w-[190px] text-xs  bg-white">
                <SelectValue placeholder="Supervision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervision" className="text-xs">
                  ⚠️ Supervision Required
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Mortality */}
            <Select
              value={
                modeChoice === "maternalDeaths" || modeChoice === "neonatalDeaths" ? modeChoice : ""
              }
              onValueChange={(v) => {
                setModeChoice(v as MapModeChoice);
                setSelected(undefined);
              }}
            >
              <SelectTrigger className="h-9 w-[170px] text-xs bg-white">
                <SelectValue placeholder="Mortality overlay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maternalDeaths" className="text-xs">
                  🩺 Maternal Deaths
                </SelectItem>
                <SelectItem value="neonatalDeaths" className="text-xs">
                  👶 Neonatal Deaths
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Intersections */}
            <Select
              value={modeChoice.startsWith("intersection:") ? modeChoice : ""}
              onValueChange={(v) => {
                setModeChoice(v as MapModeChoice);
                setSelected(undefined);
              }}
            >
              <SelectTrigger className="h-9 w-[220px] text-xs bg-white">
                <SelectValue placeholder="Intersection preset" />
              </SelectTrigger>
              <SelectContent>
                {INTERSECTIONS.map((p, i) => (
                  <SelectItem key={p.key} value={`intersection:${p.key}`} className="text-xs">
                    {p.positive ? "✅" : "🔴"} {i + 1}. {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(modeChoice !== "facilities:L3" || chips.length > 0) && (
              <button
                onClick={() => {
                  setModeChoice("facilities:L3");
                  setChips([]);
                  setSelected(undefined);
                  setSelectedFacility(undefined);
                }}
                className="h-9 rounded-md border border-border bg-white px-3 text-[11px] font-medium text-muted-foreground hover:bg-secondary"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
        <MPOutlineMap
          mode={mapMode}
          onSelect={(d) => {
            setSelected(d);
            setSelectedFacility(undefined);
          }}
          onSelectFacility={(d, f) => {
            setSelected(d);
            setSelectedFacility(f);
          }}
          selected={selected}
        />

        {/* Combinable parameter chips */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Parameter chips — combine to study intersections
            </div>
            {chips.length > 0 && (
              <button onClick={clearChips} className="text-[11px] text-teal hover:underline">
                Clear ({chips.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHIP_DEFS.map((c) => {
              const on = chips.includes(c.key);
              const toneOn =
                c.tone === "red"
                  ? "bg-rose-600 text-white border-rose-600"
                  : c.tone === "amber"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-emerald-600 text-white border-emerald-600";
              const toneOff =
                c.tone === "red"
                  ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                  : c.tone === "amber"
                    ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50";
              return (
                <button
                  key={c.key}
                  onClick={() => toggleChip(c.key)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${on ? toneOn : `bg-white ${toneOff}`}`}
                >
                  {c.label}
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

      <FacilityListPanel
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
      />

      {selected && (
        <DistrictDetailPanel
          district={selected}
          initialFacility={selectedFacility}
          onClose={() => {
            setSelected(undefined);
            setSelectedFacility(undefined);
          }}
        />
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, Lock, List } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import { SectionHeader } from "@/components/filter-panel";
import { FacilityListPanel, type FacilityRow } from "@/components/facility-list-panel";
import {
  HDU_ADMISSIONS,
  HDU_DIAGNOSIS,
  HDU_OCCUPANCY,
  HDU_OUTCOME,
  HDU_EQUIPMENT,
  SAMPLE_FACILITIES,
} from "@/lib/mock-data";
import { downloadCSV } from "@/lib/csv";
import { ObsHduTable } from "@/modules/obs-hdu/obs-hdu-table";

type PanelSpec = {
  title: string;
  rows: FacilityRow[];
  columns: Array<{ key: keyof FacilityRow; label: string }>;
} | null;

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

export const Route = createFileRoute("/_app/obs-hdu")({
  head: () => ({ meta: [{ title: "Obs HDU — LRMIS" }] }),
  component: ObsHDUPage,
});

const C = {
  navy: "#0F2D56",
  teal: "#0B7B8A",
  chartTeal: "#0891B2",
  rose: "#E11D48",
  amber: "#D97706",
  indigo: "#6366F1",
};

function diagnosisColor(count: number, max: number): string {
  const t = count / max;
  const r = Math.round(15 + (8 - 15) * t);
  const g = Math.round(45 + (123 - 45) * t);
  const b = Math.round(86 + (138 - 86) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
function outcomeColor(kind: string): string {
  switch (kind) {
    case "positive":
      return C.teal;
    case "neutral":
      return C.indigo;
    case "warning":
      return C.amber;
    case "danger":
      return C.rose;
    default:
      return C.navy;
  }
}

function ObsHDUPage() {
  const [diagMode, setDiagMode] = useState<"%" | "#">("#");
  const [outcomeMode, setOutcomeMode] = useState<"%" | "#">("#");
  const [panel, setPanel] = useState<PanelSpec>(null);

  const diagMax = Math.max(...HDU_DIAGNOSIS.map((d) => d.count));
  const diagTotal = HDU_DIAGNOSIS.reduce((s, d) => s + d.count, 0);
  const diagData = HDU_DIAGNOSIS.map((d) => ({
    ...d,
    value: diagMode === "%" ? +((d.count / diagTotal) * 100).toFixed(1) : d.count,
  }));
  const outcomeTotal = HDU_OUTCOME.reduce((s, o) => s + o.count, 0);
  const outcomeData = HDU_OUTCOME.map((o) => ({
    ...o,
    value: outcomeMode === "%" ? +((o.count / outcomeTotal) * 100).toFixed(1) : o.count,
  }));

  const LinelistBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-secondary"
    >
      <List className="h-3 w-3" /> View facility line-list
    </button>
  );

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

  const admissionsSpec: PanelSpec = {
    title: "Obs HDU facilities — admissions (May 2026)",
    rows: hduFacilityList({ "Trend vs prev month": (i) => (i % 3 === 0 ? "↓ down" : "↑ up") }),
    columns: cols([{ key: "Trend vs prev month", label: "Trend vs prev month" }]),
  };
  const diagnosisSpec: PanelSpec = {
    title: "Facilities with diagnosis breakdown — Obs HDU (May 2026)",
    rows: hduFacilityList({ "Top diagnosis": (i) => HDU_DIAGNOSIS[i % HDU_DIAGNOSIS.length].name }),
    columns: cols([{ key: "Top diagnosis", label: "Top diagnosis" }]),
  };
  const occupancySpec: PanelSpec = {
    title: "Facility-level Obs HDU occupancy (May 2026)",
    rows: hduFacilityList({
      "vs Target (40%)": (i) => (28 + ((i * 11) % 40) >= 40 ? "Above" : "Below"),
    }),
    columns: cols([{ key: "vs Target (40%)", label: "vs Target (40%)" }]),
  };
  const outcomeSpec: PanelSpec = {
    title: "Facility-level patient outcomes — Obs HDU (May 2026)",
    rows: hduFacilityList({
      "Most common outcome": (i) => HDU_OUTCOME[i % HDU_OUTCOME.length].name,
    }),
    columns: cols([{ key: "Most common outcome", label: "Most common outcome" }]),
  };
  const equipmentSpec: PanelSpec = {
    title: "Facilities with critical-equipment gaps — Obs HDU",
    rows: hduFacilityList({
      "Missing equipment": (i) => HDU_EQUIPMENT[i % HDU_EQUIPMENT.length].name,
    }),
    columns: cols([{ key: "Missing equipment", label: "Missing equipment" }]),
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Obs HDU</h1>
        <p className="text-sm text-muted-foreground">
          Last completed month —{" "}
          <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
            <Lock className="h-3 w-3" /> May 2026
          </span>
        </p>
      </div>

      <SectionHeader icon={HeartPulse} title="Obs HDU Performance" />

      <ChartCard
        title="Month-Wise Admission"
        info="Total Obs HDU admissions per month. June 2026 is partial (dashed). Click chart or button to see HDU facilities driving the trend."
        onDownload={() => downloadCSV(HDU_ADMISSIONS, "hdu_admissions")}
        onBodyClick={() => setPanel(admissionsSpec)}
        headerRight={<LinelistBtn onClick={() => setPanel(admissionsSpec)} />}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={HDU_ADMISSIONS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 2000]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v: number, _: string, p) =>
                p.payload.partial ? [`${v} (partial)`, "Admissions"] : [v, "Admissions"]
              }
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={C.teal}
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                return payload.partial ? (
                  <circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="white"
                    stroke={C.teal}
                    strokeWidth={2}
                    strokeDasharray="3 2"
                  />
                ) : (
                  <circle key={index} cx={cx} cy={cy} r={4} fill={C.teal} />
                );
              }}
            >
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 10, fill: "#1A202C", fontWeight: 600 }}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Condition / Diagnosis at Admission"
          info="Distribution of primary diagnosis at HDU admission"
          toggle={{ value: diagMode, onChange: setDiagMode }}
          onDownload={() => downloadCSV(HDU_DIAGNOSIS, "hdu_diagnosis")}
          onBodyClick={() => setPanel(diagnosisSpec)}
          headerRight={<LinelistBtn onClick={() => setPanel(diagnosisSpec)} />}
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart layout="vertical" data={diagData} margin={{ left: 30, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => (diagMode === "%" ? `${v}%` : v)}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {diagData.map((d, i) => (
                  <Cell key={i} fill={diagnosisColor(d.count, diagMax)} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{ fontSize: 10, fill: "#1A202C", fontWeight: 600 }}
                  formatter={(v: number) => (diagMode === "%" ? `${v}%` : v)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Bed Occupancy Rate — Obs HDU"
          info="Monthly bed occupancy %. Target 40%. June is partial (dashed)."
          onDownload={() => downloadCSV(HDU_OCCUPANCY, "hdu_occupancy")}
          onBodyClick={() => setPanel(occupancySpec)}
          headerRight={<LinelistBtn onClick={() => setPanel(occupancySpec)} />}
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={HDU_OCCUPANCY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 60]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => `${v}%`}
              />
              <ReferenceLine
                y={40}
                stroke={C.amber}
                strokeDasharray="4 4"
                label={{ value: "Target 40%", fontSize: 10, fill: C.amber }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={C.teal}
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload, index } = props;
                  return payload.partial ? (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="white"
                      stroke={C.teal}
                      strokeWidth={2}
                      strokeDasharray="3 2"
                    />
                  ) : (
                    <circle key={index} cx={cx} cy={cy} r={4} fill={C.teal} />
                  );
                }}
              >
                <LabelList
                  dataKey="rate"
                  position="top"
                  style={{ fontSize: 10, fill: "#1A202C", fontWeight: 600 }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Outcome of Patient"
          info="Patient discharge / shift / referral outcomes from Obs HDU"
          toggle={{ value: outcomeMode, onChange: setOutcomeMode }}
          onDownload={() => downloadCSV(HDU_OUTCOME, "hdu_outcomes")}
          onBodyClick={() => setPanel(outcomeSpec)}
          headerRight={<LinelistBtn onClick={() => setPanel(outcomeSpec)} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart layout="vertical" data={outcomeData} margin={{ left: 30, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => (outcomeMode === "%" ? `${v}%` : v)}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {outcomeData.map((o, i) => (
                  <Cell key={i} fill={outcomeColor(o.kind)} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{ fontSize: 10, fill: "#1A202C", fontWeight: 600 }}
                  formatter={(v: number) => (outcomeMode === "%" ? `${v}%` : v)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Critical Equipment Availability"
          info="Yes/No availability across HDU facilities"
          onDownload={() => downloadCSV(HDU_EQUIPMENT, "hdu_equipment")}
          onBodyClick={() => setPanel(equipmentSpec)}
          headerRight={<LinelistBtn onClick={() => setPanel(equipmentSpec)} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={HDU_EQUIPMENT}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#64748B" }}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="yes" stackId="a" name="Yes" fill={C.chartTeal}>
                <LabelList
                  dataKey="yes"
                  position="inside"
                  style={{ fontSize: 9, fill: "#fff", fontWeight: 600 }}
                  formatter={(v: number) => (v > 30 ? v : "")}
                />
              </Bar>
              <Bar dataKey="no" stackId="a" name="No" fill={C.rose}>
                <LabelList
                  dataKey="no"
                  position="inside"
                  style={{ fontSize: 9, fill: "#fff", fontWeight: 600 }}
                  formatter={(v: number) => (v > 100 ? v : "")}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ObsHduTable />

      {/* <FacilityListPanel
        open={!!panel}
        onClose={() => setPanel(null)}
        title={panel?.title ?? ""}
        rows={panel?.rows ?? []}
        columns={panel?.columns ?? []}
        filename="obs_hdu_facilities"
      /> */}
    </div>
  );
}

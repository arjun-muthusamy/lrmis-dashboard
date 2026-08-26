import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Building2, Lock } from "lucide-react";
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
  ReferenceLine,
  Legend,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import { SectionHeader } from "@/components/filter-panel";
import { FacilityListPanel, type FacilityRow } from "@/components/facility-list-panel";
import {
  BEDS_BY_AREA,
  REG_APPROVALS,
  FUNCTIONAL_TREND,
  INFRA_CATEGORIES,
  INFRA_COMPLIANCE,
  SAMPLE_FACILITIES,
} from "@/lib/mock-data";
import { downloadCSV } from "@/lib/csv";
import { AnalyticCard } from "@/components/analytic-card";
import { FacilityInfraTable } from "@/modules/facility-infra-table/facility-infra-table";

export const Route = createFileRoute("/_app/facility-hr")({
  head: () => ({ meta: [{ title: "Facility & Infrastructure — LRMIS" }] }),
  component: FacilityInfraPage,
});

const C = {
  navy: "#0F2D56",
  teal: "#0B7B8A",
  indigo: "#6366F1",
  amber: "#D97706",
  rose: "#E11D48",
};

function PeriodLock() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
      <Lock className="h-3 w-3" /> May 2026
    </span>
  );
}

function FacilityInfraPage() {
  const [bedsMode, setBedsMode] = useState<"%" | "#">("#");
  const [regMode, setRegMode] = useState<"%" | "#">("#");
  const [infraMode, setInfraMode] = useState<"%" | "#">("%");
  const [infraArea, setInfraArea] = useState<string | null>(null);
  const [panel, setPanel] = useState<{
    title: string;
    rows: FacilityRow[];
    columns: Array<{ key: keyof FacilityRow; label: string }>;
  } | null>(null);

  const totalBeds = BEDS_BY_AREA.reduce((s, b) => s + b.count, 0);
  const bedsData = BEDS_BY_AREA.map((b) => ({
    ...b,
    pct: +((b.count / totalBeds) * 100).toFixed(1),
  }));

  const regData = REG_APPROVALS.map((r) => {
    const total = r.compliant + r.nonCompliant;
    return regMode === "%"
      ? {
          category: r.category,
          Compliant: +((r.compliant / total) * 100).toFixed(1),
          "Non-Compliant": +((r.nonCompliant / total) * 100).toFixed(1),
        }
      : { category: r.category, Compliant: r.compliant, "Non-Compliant": r.nonCompliant };
  });

  const infraByArea = useMemo(
    () =>
      INFRA_COMPLIANCE.map((r) => ({
        area: r.area,
        score: Math.round((r.DH + r.CHC + r.PHC) / 3),
      })),
    [],
  );
  const infraByCategoryForArea = useMemo(() => {
    if (!infraArea) return [];
    const seedOffset = infraArea.length % 7;
    return INFRA_CATEGORIES.map((c, i) => ({
      category: c.category,
      score: Math.max(
        20,
        Math.min(98, c.score + ((i + seedOffset) % 5) - 2 + (infraArea === "Obs HDU" ? -8 : 0)),
      ),
    }));
  }, [infraArea]);

  const openFacilityPanel = (title: string) => {
    setPanel({
      title,
      rows: SAMPLE_FACILITIES.slice(0, 20).map((f) => ({
        ...f,
        FireNOC: Math.random() > 0.4 ? "✓" : "✗",
        SUMAN: Math.random() > 0.3 ? "✓" : "✗",
        PCB: Math.random() > 0.5 ? "✓" : "✗",
      })),
      columns: [
        { key: "facility", label: "Facility" },
        { key: "district", label: "District" },
        { key: "type", label: "Type" },
        { key: "FireNOC", label: "Fire NOC" },
        { key: "SUMAN", label: "SUMAN" },
        { key: "PCB", label: "PCB NOC" },
      ],
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Facility & Infrastructure</h1>
        <p className="text-sm text-muted-foreground">
          Last completed month — <PeriodLock />
        </p>
      </div>

      <SectionHeader icon={Building2} title="Facility Profile" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AnalyticCard
          icon={Building2}
          value="42%"
          label="Facility Compliance"
          info="% of facilities complying with all infrastructure standards (Fire NOC, PCB NOC, SUMAN, LaQshya readiness, bed norms)."
          color="blue"
        />
        <AnalyticCard
          icon={Building2}
          value="73%"
          label="Functional FRUs"
          trend={{ value: "2.1%", positive: true }}
          indicator="functionalFRU"
          color="green"
        />
        <AnalyticCard
          icon={Building2}
          value="68%"
          label="Functional Delivery Points"
          indicator="functionalDP"
          color="teal"
        />
        <AnalyticCard
          icon={Building2}
          value="47 of 1,247"
          label="LaQshya Certified"
          indicator="laqshya"
          color="purple"
        />
        <AnalyticCard
          icon={Building2}
          value="38%"
          label="BEmONC Functional"
          indicator="bemonc"
          color="indigo"
        />
        <AnalyticCard
          icon={Building2}
          value="22%"
          label="CEmONC Functional"
          indicator="cemonc"
          color="pink"
        />
        <AnalyticCard
          icon={Building2}
          value="61%"
          label="Blood Availability at FRUs"
          indicator="bloodAvail"
          color="red"
        />
        <AnalyticCard
          icon={Building2}
          value="54%"
          label="Ambulance Availability"
          indicator="ambulance"
          color="orange"
        />
      </div>

      <ChartCard
        title="Bed Availability by Service Area"
        info="Total beds available by service area across MP. Click any bar for facility list."
        toggle={{ value: bedsMode, onChange: setBedsMode }}
        onDownload={() => downloadCSV(BEDS_BY_AREA, "beds_by_area")}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart layout="vertical" data={bedsData} margin={{ left: 30, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis
              type="category"
              dataKey="area"
              width={150}
              tick={{ fontSize: 11, fill: "#1A202C" }}
            />
            <Tooltip
              formatter={(v: number) => (bedsMode === "%" ? `${v}%` : v.toLocaleString())}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar
              dataKey={bedsMode === "%" ? "pct" : "count"}
              radius={[0, 4, 4, 0]}
              fill={C.teal}
              cursor="pointer"
              onClick={(d) => openFacilityPanel(`Facilities — ${d.area}`)}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Regulatory Approvals Status"
        info="Compliance with Fire NOC, Pollution Control NOC, and SUMAN branding."
        toggle={{ value: regMode, onChange: setRegMode }}
        onDownload={() => downloadCSV(REG_APPROVALS, "regulatory_approvals")}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={regData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#1A202C" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v: number) => (regMode === "%" ? `${v}%` : v.toLocaleString())}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="Compliant"
              stackId="r"
              fill={C.teal}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => openFacilityPanel(`${d.category} — Compliant`)}
            />
            <Bar
              dataKey="Non-Compliant"
              stackId="r"
              fill={C.rose}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => openFacilityPanel(`${d.category} — Non-Compliant`)}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Monthly Trend — Functional FRUs & Delivery Points (%)"
        info="12-month rolling trend. Target line at 70%."
        onDownload={() => downloadCSV(FUNCTIONAL_TREND, "functional_trend")}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={FUNCTIONAL_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 100]} />
            <Tooltip
              formatter={(v: number) => `${v}%`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              y={70}
              stroke={C.amber}
              strokeDasharray="4 4"
              label={{ value: "Target 70%", fontSize: 10, fill: C.amber }}
            />
            <Line
              type="monotone"
              dataKey="frus"
              name="Functional FRUs"
              stroke={C.teal}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="deliveryPoints"
              name="Delivery Points"
              stroke={C.indigo}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <SectionHeader icon={Building2} title="Infrastructure Compliance" />

      <ChartCard
        title={
          infraArea
            ? `Infrastructure Compliance — ${infraArea} (by Category)`
            : "Infrastructure Compliance — by Service Area"
        }
        info="State-level compliance score by service area. Click a bar to drill into the eight infrastructure quality categories for that area."
        toggle={{ value: infraMode, onChange: setInfraMode }}
        onDownload={() =>
          downloadCSV(
            infraArea ? infraByCategoryForArea : infraByArea,
            infraArea ? `infra_${infraArea}` : "infra_by_area",
          )
        }
        breadcrumb={
          infraArea
            ? { label: "Back to Service Areas", onBack: () => setInfraArea(null) }
            : undefined
        }
      >
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            layout="vertical"
            data={infraArea ? infraByCategoryForArea : infraByArea}
            margin={{ left: 30, right: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis
              type="category"
              dataKey={infraArea ? "category" : "area"}
              width={140}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(v: number) => (infraMode === "%" ? `${v}%` : v)}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar
              dataKey="score"
              fill={C.teal}
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(d) => {
                if (!infraArea) setInfraArea(d.area);
                else
                  setPanel({
                    title: `Infrastructure — ${infraArea} · ${d.category}`,
                    rows: SAMPLE_FACILITIES.slice(0, 15),
                    columns: [
                      { key: "facility", label: "Facility" },
                      { key: "district", label: "District" },
                      { key: "block", label: "Block" },
                      { key: "type", label: "Type" },
                    ],
                  });
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <FacilityInfraTable />

      {/* <FacilityListPanel
        open={!!panel}
        onClose={() => setPanel(null)}
        title={panel?.title ?? ""}
        rows={panel?.rows ?? []}
        columns={panel?.columns ?? []}
      /> */}
    </div>
  );
}

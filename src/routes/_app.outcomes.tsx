import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Lock, Baby, Heart, Activity, Skull, Scissors } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import { SectionHeader } from "@/components/filter-panel";
import {
  DELIVERY_IUCD_TREND,
  DELIVERY_MODE_TREND,
  OUTCOMES_LAST_MONTH,
  HYSTERECTOMY_TREND,
  CALIBRATED_DRAPES_TREND,
} from "@/lib/mock-extra";
import { downloadCSV } from "@/lib/csv";
import { AnalyticCard } from "@/components/analytic-card";

export const Route = createFileRoute("/_app/outcomes")({
  head: () => ({ meta: [{ title: "Outcome Indicators — LRMIS" }] }),
  component: OutcomesPage,
});

const C = {
  navy: "#0F2D56",
  teal: "#0B7B8A",
  rose: "#E11D48",
  amber: "#D97706",
  purple: "#7C3AED",
};

function OutcomesPage() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Outcome Indicators</h1>
        <p className="text-sm text-muted-foreground">
          Last completed month —{" "}
          <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
            <Lock className="h-3 w-3" /> May 2026
          </span>
        </p>
      </div>

      <SectionHeader icon={HeartPulse} title="Outcome Indicators — Last Month" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <AnalyticCard
          icon={Baby}
          value={OUTCOMES_LAST_MONTH.totalDeliveries.toLocaleString()}
          label="Total Deliveries"
          trend={{ value: "4.1%", positive: true }}
          color="blue"
        />
        <AnalyticCard
          icon={Activity}
          value={`${((OUTCOMES_LAST_MONTH.cSections / OUTCOMES_LAST_MONTH.totalDeliveries) * 100).toFixed(1)}%`}
          label={`C-Section Rate`}
          statLabel={`(${OUTCOMES_LAST_MONTH.cSections.toLocaleString()} / ${OUTCOMES_LAST_MONTH.totalDeliveries.toLocaleString()})`}
          color="purple"
        />
        <AnalyticCard
          icon={Heart}
          value={`${((OUTCOMES_LAST_MONTH.liveBirths / OUTCOMES_LAST_MONTH.totalDeliveries) * 100).toFixed(1)}%`}
          label={`Live Births / Deliveries`}
          statLabel={`(${OUTCOMES_LAST_MONTH.liveBirths.toLocaleString()} / ${OUTCOMES_LAST_MONTH.totalDeliveries.toLocaleString()})`}
          color="green"
        />
        <AnalyticCard
          icon={Skull}
          value={`${((OUTCOMES_LAST_MONTH.stillBirths / OUTCOMES_LAST_MONTH.totalDeliveries) * 100).toFixed(2)}%`}
          label={`Still Births / Deliveries`}
          statLabel={`(${OUTCOMES_LAST_MONTH.stillBirths.toLocaleString()} / ${OUTCOMES_LAST_MONTH.totalDeliveries.toLocaleString()})`}
          color="red"
        />
        <AnalyticCard
          icon={Scissors}
          value={HYSTERECTOMY_TREND[HYSTERECTOMY_TREND.length - 1].hysterectomies}
          label="Obstetric Hysterectomies"
          statLabel="(last month)"
          color="orange"
        />
        <AnalyticCard
          icon={Activity}
          value={`${CALIBRATED_DRAPES_TREND[CALIBRATED_DRAPES_TREND.length - 1].rate}%`}
          label="Calibrated Drapes Implementation"
          statLabel={`(${CALIBRATED_DRAPES_TREND[CALIBRATED_DRAPES_TREND.length - 1].implementedLRs.toLocaleString()} / ${CALIBRATED_DRAPES_TREND[CALIBRATED_DRAPES_TREND.length - 1].totalLRs.toLocaleString()} LRs)`}
          color="teal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Deliveries · PPIUCD · PAIUCD — Monthly Trend"
          info="Total deliveries with post-partum and post-abortion IUCD insertions."
          onDownload={() => downloadCSV(DELIVERY_IUCD_TREND, "delivery_iucd_trend")}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={DELIVERY_IUCD_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => v.toLocaleString()}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="totalDeliveries"
                name="Total Deliveries"
                stroke={C.navy}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="ppiucd"
                name="PPIUCD"
                stroke={C.teal}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="paiucd"
                name="PAIUCD"
                stroke={C.purple}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Deliveries · C-Section · Assisted — Monthly Trend"
          info="Mode-of-delivery breakdown alongside total deliveries."
          onDownload={() => downloadCSV(DELIVERY_MODE_TREND, "delivery_mode_trend")}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={DELIVERY_MODE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => v.toLocaleString()}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="totalDeliveries"
                name="Total Deliveries"
                stroke={C.navy}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="cSection"
                name="C-Section"
                stroke={C.rose}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="assisted"
                name="Assisted"
                stroke={C.amber}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Calibrated Drape Usage — Women"
          info="Number of women for whom calibrated drapes were actually used each month."
          onDownload={() => downloadCSV(CALIBRATED_DRAPES_TREND, "calibrated_drape_usage")}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={CALIBRATED_DRAPES_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: number) => [value.toLocaleString(), "Women"]}
              />
              <Line
                type="monotone"
                dataKey="womenUsed"
                name="Women using calibrated drapes"
                stroke={C.teal}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

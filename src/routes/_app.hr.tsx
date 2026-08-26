import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Lock } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Cell,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import {
  HR_VACANCY,
  TRAINING_COVERAGE,
  TRAINING_BY_CADRE,
  STAFF_EMPLOYMENT,
  DISTRICT_ROWS,
} from "@/lib/mock-data";
import { downloadCSV } from "@/lib/csv";
import { AnalyticCard } from "@/components/analytic-card";

export const Route = createFileRoute("/_app/hr")({
  head: () => ({ meta: [{ title: "Human Resources — LRMIS" }] }),
  component: HRPage,
});

const C = {
  navy: "#0F2D56",
  teal: "#0B7B8A",
  indigo: "#6366F1",
  amber: "#D97706",
  rose: "#E11D48",
  emerald: "#059669",
  muted: "#94A3B8",
};

function HRPage() {
  const [vacMode, setVacMode] = useState<"%" | "#">("%");
  const [empMode, setEmpMode] = useState<"%" | "#">("%");
  const [trainingDrill, setTrainingDrill] = useState<string | null>(null);
  const [empDrill, setEmpDrill] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Human Resources & Training</h1>
        <p className="text-sm text-muted-foreground">
          Last completed month —{" "}
          <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
            <Lock className="h-3 w-3" /> May 2026
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AnalyticCard
          icon={Users}
          value="44%"
          label="Facilities Meeting Staffing Norms"
          indicator="staffingNorm"
          color="blue"
        />
        <AnalyticCard
          icon={Users}
          value="28%"
          label="L3 Facilities with 0 Specialist"
          indicator="zeroSpecialist"
          color="red"
        />
        <AnalyticCard
          icon={Users}
          value="34%"
          label="Overall HR Vacancy Rate"
          indicator="vacancy"
          color="orange"
        />
        <AnalyticCard icon={Users} value="52%" label="Staff on Contractual/Bonded" color="purple" />
      </div>

      <ChartCard
        title="HR Vacancy Rate by Cadre"
        info="Color reflects severity. Reference line at 30% acceptable threshold."
        toggle={{ value: vacMode, onChange: setVacMode }}
        onDownload={() => downloadCSV(HR_VACANCY, "hr_vacancy")}
      >
        <ResponsiveContainer width="100%" height={320}>
          {vacMode === "%" ? (
            <BarChart data={HR_VACANCY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="cadre"
                tick={{ fontSize: 10, fill: "#64748B" }}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(_, __, p) => {
                  const d = p.payload;
                  return [`${d.vacancy}% (${d.inPosition}/${d.sanctioned})`, "Vacancy"];
                }}
              />
              <ReferenceLine
                y={30}
                stroke={C.amber}
                strokeDasharray="4 4"
                label={{ value: "Threshold 30%", fontSize: 10, fill: C.amber }}
              />
              <Bar dataKey="vacancy" radius={[4, 4, 0, 0]}>
                {HR_VACANCY.map((r) => (
                  <Cell
                    key={r.cadre}
                    fill={r.vacancy > 50 ? C.rose : r.vacancy > 30 ? C.amber : C.emerald}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={HR_VACANCY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="cadre"
                tick={{ fontSize: 10, fill: "#64748B" }}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sanctioned" name="Sanctioned" fill={C.muted} radius={[4, 4, 0, 0]} />
              <Bar dataKey="inPosition" name="In Position" fill={C.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={
          trainingDrill
            ? `Training Coverage › ${trainingDrill} — by Cadre`
            : "Training Coverage by Programme"
        }
        info="Click any training to see coverage split by cadre."
        breadcrumb={
          trainingDrill
            ? { label: "All Trainings", onBack: () => setTrainingDrill(null) }
            : undefined
        }
        onDownload={() =>
          downloadCSV(
            trainingDrill ? [...(TRAINING_BY_CADRE[trainingDrill] ?? [])] : [...TRAINING_COVERAGE],
            "training_coverage",
          )
        }
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            layout="vertical"
            data={
              trainingDrill
                ? (TRAINING_BY_CADRE[trainingDrill] ?? TRAINING_BY_CADRE.Dakshata)
                : TRAINING_COVERAGE
            }
            margin={{ left: 20, right: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey={trainingDrill ? "cadre" : "training"}
              width={140}
              tick={{ fontSize: 11, fill: "#1A202C" }}
            />
            <Tooltip
              formatter={(v: number) => `${v}%`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar
              dataKey="coverage"
              radius={[0, 4, 4, 0]}
              fill={C.teal}
              cursor="pointer"
              onClick={(d) => !trainingDrill && setTrainingDrill(d.training)}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={
          empDrill
            ? `Employment Type › ${empDrill} — by District`
            : "Staff Employment Type Distribution"
        }
        info="Click any cadre to drill down to district breakdown."
        breadcrumb={empDrill ? { label: "All Cadres", onBack: () => setEmpDrill(null) } : undefined}
        toggle={{ value: empMode, onChange: setEmpMode }}
        onDownload={() => downloadCSV(STAFF_EMPLOYMENT, "staff_employment")}
      >
        <ResponsiveContainer width="100%" height={320}>
          {empDrill ? (
            <BarChart
              layout="vertical"
              data={DISTRICT_ROWS.slice(0, 15).map((d) => ({
                district: d.district,
                permanent: Math.round(d.composite * 0.5),
                nhmContract: Math.round((100 - d.composite) * 0.4),
                stateContract: 14,
                bonded: 9,
                outsourced: 5,
              }))}
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis type="category" dataKey="district" width={100} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="permanent" stackId="x" fill={C.navy} name="Permanent" />
              <Bar dataKey="nhmContract" stackId="x" fill={C.teal} name="NHM Contract" />
              <Bar dataKey="stateContract" stackId="x" fill={C.indigo} name="State Contract" />
              <Bar dataKey="bonded" stackId="x" fill={C.amber} name="Bonded" />
              <Bar dataKey="outsourced" stackId="x" fill={C.muted} name="Outsourced" />
            </BarChart>
          ) : (
            <BarChart layout="vertical" data={STAFF_EMPLOYMENT} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis type="category" dataKey="cadre" width={120} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="permanent"
                stackId="e"
                fill={C.navy}
                name="Permanent"
                cursor="pointer"
                onClick={(d) => setEmpDrill(d.cadre)}
              />
              <Bar dataKey="nhmContract" stackId="e" fill={C.teal} name="NHM Contract" />
              <Bar dataKey="stateContract" stackId="e" fill={C.indigo} name="State Contract" />
              <Bar dataKey="bonded" stackId="e" fill={C.amber} name="Bonded" />
              <Bar dataKey="outsourced" stackId="e" fill={C.muted} name="Outsourced" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

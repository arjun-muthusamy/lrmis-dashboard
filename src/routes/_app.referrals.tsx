import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftRight, Lock, Users2 } from "lucide-react";
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
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import { FacilityListPanel, type FacilityRow } from "@/components/facility-list-panel";
import { REFERRAL_REASONS_IN, REFERRAL_REASONS_OUT, SAMPLE_FACILITIES } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { REFERRAL_IN_BY_LEVEL, REFERRAL_OUT_BY_LEVEL } from "@/lib/mock-extra";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCSV } from "@/lib/csv";
import { ReferralTable } from "@/modules/referrals/referrals";
import { AnalyticCard } from "@/components/analytic-card";

export const Route = createFileRoute("/_app/referrals")({
  head: () => ({ meta: [{ title: "Referrals — LRMIS" }] }),
  component: ReferralsPage,
});

const C = { navy: "#0F2D56", teal: "#0B7B8A", indigo: "#6366F1", amber: "#D97706" };
const LEVEL_COLOR = { L1: "#D97706", L2: "#0B7B8A", L3: "#0F2D56" } as const;
type Lvl = "L1" | "L2" | "L3";
type Kind = "in" | "out";

// LRMIS-derived likely reasons, scoped by facility level so we never attribute
// L3-only gaps (specialist roster, blood bank, ambulance) to L1 SHCs/PHCs that
// don't offer those services per IPHS norms.
const REF_OUT_REASONS: Record<Lvl, string[]> = {
  L1: [
    "Oxytocin stockout (5d)",
    "Magnesium Sulphate stockout (9d)",
    "Inj. Vitamin K stockout",
    "Iron Sucrose stockout (11d)",
    "Baby warmer not functional",
    "Suction machine not functional",
    "Staff nurse vacancy",
    "SBA-trained nurse absent on shift",
    "Partograph not maintained",
    "Resuscitation kit incomplete",
  ],
  L2: [
    "Oxytocin stockout (5d)",
    "Magnesium Sulphate stockout (9d)",
    "MO-EmOC trained absent",
    "OT light not functional",
    "Anaesthetist not on roster",
    "Blood storage unit non-functional",
    "Staff nurse vacancy",
    "Baby warmer not functional",
    "Suction machine not functional",
    "Functional newborn corner gap",
  ],
  L3: [
    "Gynaecologist not on roster",
    "Paediatrician not on roster",
    "Anaesthetist not on roster",
    "Blood bank non-functional",
    "108 ambulance unavailable",
    "OT downtime",
    "NICU bed shortage",
    "Obstetric HDU full",
    "Sepsis kit stockout",
    "USG machine downtime",
  ],
};

const REF_IN_REASONS: Record<Lvl, string[]> = {
  L1: [
    "Diversion by 108 to higher facility",
    "Patient awareness gap",
    "Weak ANM-PHC linkage",
    "Distance / connectivity",
    "Drug stockouts deterring referrals",
    "Reporting gap",
    "Staff nurse vacancy",
    "No SBA on night shift",
  ],
  L2: [
    "Underutilized FRU capacity",
    "Drug stockouts deterring referrals",
    "Equipment downtime (OT light)",
    "MO-EmOC trained absent",
    "Weak referral linkages from L1",
    "Patient awareness gap",
    "Blood storage unit non-functional",
    "Reporting gap",
  ],
  L3: [
    "Underutilized FRU capacity",
    "Specialist roster gaps (gynaec/paeds/anaes)",
    "Blood bank non-functional",
    "Equipment downtime (OT/USG)",
    "Long 108 ambulance turnaround",
    "Weak referral linkages from L1/L2",
    "Patient awareness gap",
    "Reporting gap",
  ],
};

function facilityListFor(level: Lvl, kind: "out" | "in"): FacilityRow[] {
  const pool = SAMPLE_FACILITIES.filter((f) =>
    level === "L1"
      ? f.type.startsWith("PHC") || f.type.startsWith("SHC") || f.type.startsWith("SC")
      : level === "L2"
        ? f.type.startsWith("CHC")
        : f.type.startsWith("DH") || f.type.startsWith("CH"),
  );
  const reasons = kind === "out" ? REF_OUT_REASONS[level] : REF_IN_REASONS[level];
  const sample = pool.length ? pool : SAMPLE_FACILITIES;
  return sample.slice(0, 8).map((f, i) => ({
    facility: f.facility,
    district: f.district,
    type: f.type,
    Rate: kind === "out" ? `${(22 - i * 1.4).toFixed(1)}%` : `${(3 + i * 0.6).toFixed(1)}%`,
    "Possible Reason": reasons[i % reasons.length],
    "Secondary Reason": reasons[(i + 3) % reasons.length],
  }));
}

function ReferralsPage() {
  const [kind, setKind] = useState<Kind>("in");
  const [refInLevel, setRefInLevel] = useState<Lvl>("L3");
  const [refOutLevel, setRefOutLevel] = useState<Lvl>("L1");
  const [panel, setPanel] = useState<{
    title: string;
    rows: FacilityRow[];
    columns: Array<{ key: keyof FacilityRow; label: string }>;
  } | null>(null);

  const refOutColumns: Array<{ key: keyof FacilityRow; label: string }> = [
    { key: "facility", label: "Facility" },
    { key: "district", label: "District" },
    { key: "type", label: "Type" },
    { key: "Rate", label: "Referral-Out %" },
    { key: "Possible Reason", label: "Primary Likely Reason" },
    { key: "Secondary Reason", label: "Secondary Reason" },
  ];
  const refInColumns: Array<{ key: keyof FacilityRow; label: string }> = [
    { key: "facility", label: "Facility" },
    { key: "district", label: "District" },
    { key: "type", label: "Type" },
    { key: "Rate", label: "Referral-In %" },
    { key: "Possible Reason", label: "Primary Likely Reason" },
    { key: "Secondary Reason", label: "Secondary Reason" },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground">
            Last completed month —{" "}
            <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
              <Lock className="h-3 w-3" /> May 2026
            </span>
          </p>
        </div>

        <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <TabsList>
            <TabsTrigger value="in" className="gap-2">
              <Users2 className="h-4 w-4" /> Referral-In
            </TabsTrigger>
            <TabsTrigger value="out" className="gap-2">
              <Users2 className="h-4 w-4" /> Referral-Out
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {kind === "in" ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <AnalyticCard
            icon={Users2}
            value="58"
            label="Total Referral - IN ( L1 )"
            indicator="staffingNorm"
            color="blue"
          />
          <AnalyticCard
            icon={Users2}
            value="41"
            label="Total Referral - IN ( L2 )"
            indicator="zeroSpecialist"
            color="purple"
          />
          <AnalyticCard
            icon={Users2}
            value="35"
            label="Total Referral - IN ( L3 )"
            indicator="vacancy"
            color="teal"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <AnalyticCard
            icon={Users2}
            value="44"
            label="Total Referral - OUT ( L1 )"
            indicator="staffingNorm"
            color="orange"
          />
          <AnalyticCard
            icon={Users2}
            value="38"
            label="Total Referral - OUT ( L2 )"
            indicator="zeroSpecialist"
            color="pink"
          />
          <AnalyticCard
            icon={Users2}
            value="32"
            label="Total Referral - OUT ( L3 )"
            indicator="vacancy"
            color="indigo"
          />
        </div>
      )}

      {kind === "in" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={`Referral-In Rate (%) — ${refInLevel}`}
            info="Share of total deliveries received as referrals at the selected facility level. Click a point to see facilities with low referral-in and possible reasons."
            onDownload={() => downloadCSV(REFERRAL_IN_BY_LEVEL, "referral_in_by_level")}
            headerRight={
              <Select value={refInLevel} onValueChange={(v) => setRefInLevel(v as Lvl)}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1" className="text-xs">
                    L1
                  </SelectItem>
                  <SelectItem value="L2" className="text-xs">
                    L2
                  </SelectItem>
                  <SelectItem value="L3" className="text-xs">
                    L3
                  </SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={REFERRAL_IN_BY_LEVEL.map((d) => ({ month: d.month, rate: d[refInLevel] }))}
                onClick={() =>
                  setPanel({
                    title: `${refInLevel} facilities with notably low referral-in (May 2026)`,
                    rows: facilityListFor(refInLevel, "in"),
                    columns: refInColumns,
                  })
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => `${v}%`}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name={`${refInLevel} referral-in %`}
                  stroke={LEVEL_COLOR[refInLevel]}
                  strokeWidth={2.5}
                  dot={{ r: 4, cursor: "pointer" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-1 text-[10px] italic text-muted-foreground">
              Click the chart to see facilities with low referral-in and likely drivers.
            </p>
          </ChartCard>

          <ChartCard
            title="Referral-In: Reasons"
            info="Distribution of clinical reasons captured at the receiving facility."
            onDownload={() => downloadCSV(REFERRAL_REASONS_IN, "referral_in_reasons")}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart layout="vertical" data={REFERRAL_REASONS_IN} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis type="category" dataKey="reason" width={130} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill={C.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {kind === "out" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={`Referral-Out Rate (%) — ${refOutLevel}`}
            info="Share of admissions referred out from the selected facility level. Click to see facilities with high referral-out and possible reasons."
            onDownload={() => downloadCSV(REFERRAL_OUT_BY_LEVEL, "referral_out_by_level")}
            headerRight={
              <Select value={refOutLevel} onValueChange={(v) => setRefOutLevel(v as Lvl)}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1" className="text-xs">
                    L1
                  </SelectItem>
                  <SelectItem value="L2" className="text-xs">
                    L2
                  </SelectItem>
                  <SelectItem value="L3" className="text-xs">
                    L3
                  </SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={REFERRAL_OUT_BY_LEVEL.map((d) => ({ month: d.month, rate: d[refOutLevel] }))}
                onClick={() =>
                  setPanel({
                    title: `${refOutLevel} facilities with notably high referral-out (May 2026)`,
                    rows: facilityListFor(refOutLevel, "out"),
                    columns: refOutColumns,
                  })
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => `${v}%`}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name={`${refOutLevel} referral-out %`}
                  stroke={LEVEL_COLOR[refOutLevel]}
                  strokeWidth={2.5}
                  dot={{ r: 4, cursor: "pointer" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-1 text-[10px] italic text-muted-foreground">
              Click the chart to see facilities with high referral-out and likely drivers.
            </p>
          </ChartCard>

          <ChartCard
            title="Referral-Out: Reasons"
            info="Distribution of clinical reasons captured at the referring facility."
            onDownload={() => downloadCSV(REFERRAL_REASONS_OUT, "referral_out_reasons")}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart layout="vertical" data={REFERRAL_REASONS_OUT} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <YAxis type="category" dataKey="reason" width={130} tick={{ fontSize: 10 }} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill={C.indigo} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <ArrowLeftRight className="mr-1.5 inline h-3.5 w-3.5 text-teal" />
        Each chart shows a single facility-level trend — switch level via the dropdown. Clicking the chart drills into facilities driving that pattern with likely reasons.
      </div> */}

      <ReferralTable kind={kind} setKind={setKind} />

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

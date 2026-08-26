import {
  Activity,
  Baby,
  Building2,
  HeartPulse,
  Layers,
  MapPin,
  Skull,
  Star,
  TrendingUp,
} from "lucide-react";
import { AnalyticCard } from "./analytic-card";

function Trend({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-teal">
      <TrendingUp className={`h-3 w-3 ${positive ? "" : "rotate-180 opacity-60"}`} />
      {value}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendPositive,
  emphasis = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex relative flex-col justify-between rounded-xl border border-teal/15 bg-white p-4 shadow-sm transition-colors hover:border-teal/30">
      {/* <div className="absolute inset-y-3 left-0 w-[2px] rounded-r bg-teal" /> */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft">
            <Icon className="h-4 w-4 text-teal" />
          </div>
          <div className={`font-bold text-teal-950 ${emphasis ? "text-3xl" : "text-2xl"}`}>
            {value}
          </div>
        </div>
        {trend && <Trend value={trend} positive={!!trendPositive} />}
      </div>
      <div className="mt-2">
        <span className="text-[14px] font-medium text-teal">{label}</span>
        {/* <div className="mt-0.5 text-[14px] font-medium text-teal/60">{label}</div> */}
      </div>
    </div>
  );
}

function SplitBarCard({
  icon: Icon,
  title,
  segments,
}: {
  icon: any;
  title: string;
  segments: { label: string; value: number; opacity: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="flex relative flex-col justify-between rounded-xl border border-teal/15 bg-white p-4 shadow-sm transition-colors hover:border-teal/30">
      {/* <div className="absolute inset-y-3 left-0 w-[2px] rounded-r bg-teal" /> */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft">
          <Icon className="h-4 w-4 text-teal" />
        </div>
        <div className="flex gap-3">
          {segments.map((s) => (
            <span key={s.label} className="text-[12px] text-teal">
              {s.label} <b className="font-semibold text-[16px] text-teal-950">{s.value}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <div className="flex h-2 overflow-hidden rounded-full bg-teal-soft">
          {segments.map((s) => (
            <div
              key={s.label}
              className={`bg-teal ${s.opacity}`}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
        </div>
        <span className="text-[14px] font-medium text-teal">{title}</span>
      </div>
    </div>
  );
}

export function OverviewStatsStripLight({ OVERVIEW_STATS, OUTCOMES_LAST_MONTH }: any) {
  return (
    <div className="">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AnalyticCard icon={MapPin} label="Districts" value={OVERVIEW_STATS.districts} color={"indigo"} />

        <AnalyticCard
          icon={Building2}
          label="Delivery points"
          value={OVERVIEW_STATS.deliveryPoints.toLocaleString()}
          color={"green"}
        />

        <AnalyticCard
          icon={Building2}
          label="Facility levels (L1 | L2 | L3)"
          value={`${OVERVIEW_STATS.levels.L1} | ${OVERVIEW_STATS.levels.L2} | ${OVERVIEW_STATS.levels.L3}`}
          color={"teal"}
        />

        <AnalyticCard
          icon={Building2}
          label="Readiness rooms (LR | MOT | HDU)"
          value={`${OVERVIEW_STATS.rooms.LR} | ${OVERVIEW_STATS.rooms.MOT} | ${OVERVIEW_STATS.rooms.HDU}`}
          color={"purple"}
        />

        {/* <SplitBarCard
          icon={Layers}
          title=""
          segments={[
            { label: "L1", value: OVERVIEW_STATS.levels.L1, opacity: "opacity-100" },
            { label: "L2", value: OVERVIEW_STATS.levels.L2, opacity: "opacity-60" },
            { label: "L3", value: OVERVIEW_STATS.levels.L3, opacity: "opacity-30" },
          ]}
        /> */}

        {/* <SplitBarCard
          icon={Activity}
          title="Readiness rooms"
          segments={[
            { label: "LR", value: OVERVIEW_STATS.rooms.LR, opacity: "opacity-100" },
            { label: "MOT", value: OVERVIEW_STATS.rooms.MOT, opacity: "opacity-60" },
            { label: "HDU", value: OVERVIEW_STATS.rooms.HDU, opacity: "opacity-30" },
          ]}
        /> */}

        <AnalyticCard
          icon={Star}
          label="Functional FRUs"
          value={OVERVIEW_STATS.frus}
          color={"amber"}
        />

        <AnalyticCard
          icon={HeartPulse}
          label="Total deliveries"
          value={OVERVIEW_STATS.totalDeliveries.toLocaleString()}
          color={"pink"}
        />

        <AnalyticCard icon={Skull} label="Maternal deaths" value={OUTCOMES_LAST_MONTH.maternalDeaths} color="red" />

        <AnalyticCard icon={Baby} label="Neonatal deaths" value={OUTCOMES_LAST_MONTH.neonatalDeaths} color="orange" />
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, HeartPulse, Users2 } from "lucide-react";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import { FacilityScoreTable } from "@/modules/overview/FacilityScoreTable";
import { AnalyticCard } from "@/components/analytic-card";
import { DistrictFacilityMap } from "@/components/district-facility-map";
import { facilityLevelCounts } from "@/lib/facility-geo";

export const Route = createFileRoute("/_app/district/$districtId")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.districtId} — Facility Performance — LRMIS`,
      },
    ],
  }),
  component: DistrictDetailPage,
});

function DistrictDetailPage() {
  const { districtId } = Route.useParams();
  const row = DISTRICT_ROWS.find((r) => r.district === districtId);
  const levels = facilityLevelCounts(districtId);

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/overview"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{districtId}</h1>
        <p className="text-sm text-muted-foreground">
          {row ? `${row.division} Division · ` : ""}
          Facility performance scorecard
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <AnalyticCard
          icon={HeartPulse}
          label="Total deliveries"
          value={(row?.totalDeliveries ?? 0).toLocaleString()}
          color={"pink"}
        />

        <AnalyticCard
          icon={Users2}
          value={`${row?.cSection ?? 0}%`}
          label="C-Section Rate"
          indicator="vacancy"
          color="orange"
        />

             <AnalyticCard
          icon={Building2}
          label="Facility levels"
          value=""
          breakdown={[
            { label: "L1", value: levels.L1 },
            { label: "L2", value: levels.L2 },
            { label: "L3", value: levels.L3 },
          ]}
          breakdownLayout="inline"
          color="teal"
        />
        {/* <AnalyticCard
          icon={Building2}
          label="Facility levels (L1 | L2 | L3)"
          value={`${levels.L1} | ${levels.L2} | ${levels.L3}`}
          color={"teal"}
        /> */}
      </div>

      <DistrictFacilityMap district={districtId} districtScore={row?.composite ?? 50} />

      <FacilityScoreTable district={districtId} composite={row?.composite ?? 0} />
    </div>
  );
}

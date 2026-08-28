import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, HeartPulse, Users2 } from "lucide-react";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import { FacilityScoreTable } from "@/modules/overview/FacilityScoreTable";
import { AnalyticCard } from "@/components/analytic-card";
import { DistrictFacilityMap } from "@/components/district-facility-map";
import { facilityLevelCounts } from "@/lib/facility-geo";
import { FacilityFilterControls } from "@/components/facility-filter-controls";
import {
  parseChips,
  toMapMode,
  validateFacilityFilterSearch,
  type AnalysisMode,
  type ChipKey,
} from "@/lib/facility-map-filters";

export const Route = createFileRoute("/_app/district/$districtId")({
  validateSearch: validateFacilityFilterSearch,
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
  const search = Route.useSearch();
  const navigate = useNavigate();
  const row = DISTRICT_ROWS.find((r) => r.district === districtId);
  const levels = facilityLevelCounts(districtId);
  const chips = parseChips(search.chips);
  const analysis = search.analysis ?? "none";
  const mode = toMapMode(analysis, chips);
  const setAnalysis = (analysis: AnalysisMode) =>
    navigate({
      to: "/district/$districtId",
      params: { districtId },
      search: { analysis, chips: "" },
      replace: true,
    });
  const setChips = (value: ChipKey[]) =>
    navigate({
      to: "/district/$districtId",
      params: { districtId },
      search: {
        analysis: value.length ? "none" : analysis,
        chips: value.join(","),
      },
      replace: true,
    });

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/overview"
          search={search}
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
      </div>

      <FacilityFilterControls
        analysis={analysis}
        chips={chips}
        onAnalysisChange={setAnalysis}
        onChipsChange={setChips}
      />

      <DistrictFacilityMap district={districtId} districtScore={row?.composite ?? 50} mode={mode} />

      <FacilityScoreTable district={districtId} composite={row?.composite ?? 0} mode={mode} />
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback, useRef, type MouseEvent } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  type ProjectionFunction,
} from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { ArrowLeft } from "lucide-react";
import { generateFacilityPoints, type MapFacilityPoint } from "@/lib/facility-geo";
import {
  fetchMPGeo,
  findDistrictFeature,
  syntheticSquareFeature,
  CENTROID,
  GEO_NAME_TO_OURS,
  VIRTUAL_DISTRICTS,
  type MPGeoFeature,
  type MPGeoCollection,
} from "@/lib/mp-geo";
import type { Level } from "@/lib/scoring-rubric";
import { SCORE_DEFS, scoreFacility, scoreTone, type ScoredFacility } from "@/lib/facility-scores";
import { facilityMatchesMode, type MapMode } from "@/lib/facility-map-filters";
import { FacilityScoreDetailDialog } from "@/components/facility-score-detail-dialog";
import { HeatmapModeTabs } from "@/components/heatmap-mode-tabs";
import { HeatmapLegend } from "@/components/heatmap-legend";
import {
  HEATMAP_LAST_MONTH,
  bandFor,
  createHeatmapScale,
  type HeatBand,
  type HeatmapMode,
} from "@/lib/heatmap-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  district: string;
  districtScore: number;
  mode: MapMode;
  onBackToState?: () => void;
  onSelectDistrict?: (district: string) => void;
}

const FACILITY_ICON_SIZE = 14;
const LEVEL_LABEL: Record<Level, string> = {
  L1: "L1 · PHC/SHC",
  L2: "L2 · CHC",
  L3: "L3 · Hospital",
};
const DISTRICT_HEATMAP_COLORS = {
  delivery: { low: "#DBEAFE", medium: "#60A5FA", high: "#1D4ED8" },
  mortality: { low: "#FECACA", medium: "#EF4444", high: "#991B1B" },
} as const;
type LevelFilter = "All" | Level;
const ALL_LEVELS: LevelFilter[] = ["All", "L1", "L2", "L3"];
const SCORE_COLORS = { good: "#059669", warn: "#F59E0B", bad: "#E11D48" } as const;
const SCORE_LABELS = { good: "Green", warn: "Amber", bad: "Red" } as const;

interface HoveredFacility {
  point: MapFacilityPoint;
  scored: ScoredFacility;
  x: number;
  y: number;
}

const W = 640,
  H = 440,
  PAD = 34;
const STATE_INSET_PROJECTION = geoMercator()
  .center([0, 0])
  .scale(4186.4)
  .translate([-5340.12, 2067.42]);

export function DistrictFacilityMap({
  district,
  districtScore,
  mode,
  onBackToState,
  onSelectDistrict,
}: Props) {
  const [geo, setGeo] = useState<MPGeoCollection | null>(null);
  const [geoSettled, setGeoSettled] = useState(false);
  const [level, setLevel] = useState<LevelFilter>("All");
  const [hover, setHover] = useState<HoveredFacility | null>(null);
  const [selected, setSelected] = useState<HoveredFacility | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("delivery");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchMPGeo()
      .then((d) => alive && setGeo(d))
      .catch(() => {})
      .finally(() => alive && setGeoSettled(true));
    return () => {
      alive = false;
    };
  }, []);

  const feature = useMemo<MPGeoFeature | undefined>(
    () => (geo ? findDistrictFeature(geo, district) : undefined),
    [geo, district],
  );
  const isVirtual = VIRTUAL_DISTRICTS.has(district);
  const districtCentroid = useMemo<[number, number]>(
    () => CENTROID[district] ?? [78.4, 23.9],
    [district],
  );

  const points = useMemo(
    () => (geoSettled ? generateFacilityPoints(district, districtScore, feature) : []),
    [geoSettled, district, districtScore, feature],
  );

  const scoredPoints = useMemo(
    () =>
      points.map((point) => ({
        point,
        scored: scoreFacility(point.facility, district, point.type, point.level, point.score, {
          maternalDeaths: point.maternalDeaths,
          neonatalDeaths: point.neonatalDeaths,
        }),
      })),
    [points, district],
  );

  const matchingPoints = useMemo(
    () =>
      scoredPoints.filter(({ point, scored }) => facilityMatchesMode({ scored, ...point }, mode)),
    [scoredPoints, mode],
  );

  const counts = useMemo(() => {
    const c: Record<Level, number> = { L1: 0, L2: 0, L3: 0 };
    matchingPoints.forEach(({ point }) => c[point.level]++);
    return c;
  }, [matchingPoints]);

  const visiblePoints = useMemo(
    () =>
      level === "All"
        ? matchingPoints
        : matchingPoints.filter(({ point }) => point.level === level),
    [matchingPoints, level],
  );

  const deliveryAreaScale = useMemo(
    () => createHeatmapScale(points.map((point) => point.deliveries)),
    [points],
  );
  const mortalityAreaScale = useMemo(
    () => createHeatmapScale(points.map((point) => point.maternalDeaths + point.neonatalDeaths)),
    [points],
  );

  const geomFeature = useMemo<MPGeoFeature>(
    () => feature ?? syntheticSquareFeature(districtCentroid),
    [feature, districtCentroid],
  );

  const projection = useMemo(
    () =>
      geoMercator().fitExtent(
        [
          [PAD, PAD],
          [W - PAD, H - PAD],
        ],
        geomFeature as unknown as GeoJSON.Feature,
      ),
    [geomFeature],
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const districtPathD = useMemo(
    () => pathGen(geomFeature as unknown as GeoJSON.Feature) ?? undefined,
    [pathGen, geomFeature],
  );
  const heatClipId = useMemo(
    () => `districtHeatClip-${district.replace(/[^a-zA-Z0-9]/g, "")}`,
    [district],
  );

  const defaultCenter = useMemo<[number, number]>(() => {
    const inverted = projection.invert?.([W / 2, H / 2]);
    return inverted ?? districtCentroid;
  }, [projection, districtCentroid]);

  const resetView = useCallback(() => {
    setZoom(1);
    setCenter(defaultCenter);
  }, [defaultCenter]);

  const showFacility = useCallback(
    (point: MapFacilityPoint, event: MouseEvent<SVGElement>) => {
      const bounds = mapRef.current?.getBoundingClientRect();
      const scored = scoreFacility(point.facility, district, point.type, point.level, point.score, {
        maternalDeaths: point.maternalDeaths,
        neonatalDeaths: point.neonatalDeaths,
      });
      setHover({
        point,
        scored,
        x: bounds ? event.clientX - bounds.left : 0,
        y: bounds ? event.clientY - bounds.top : 0,
      });
    },
    [district],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">District-level Heat Map</h3>
          <p className="text-[11px] text-muted-foreground">
            {HEATMAP_LAST_MONTH} area intensity · {matchingPoints.length} of {points.length}{" "}
            facility pins match the active filters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HeatmapModeTabs value={heatmapMode} onChange={setHeatmapMode} />
          <Select
            value={level}
            onValueChange={(value) => {
              setLevel(value as LevelFilter);
              setHover(null);
            }}
          >
            <SelectTrigger className="h-10 w-[190px] bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_LEVELS.map((item) => (
                <SelectItem key={item} value={item} className="text-xs">
                  {item === "All"
                    ? `All facility levels (${matchingPoints.length})`
                    : `${LEVEL_LABEL[item]} (${counts[item]})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        ref={mapRef}
        className="relative overflow-hidden rounded-lg"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, #F7FAFD 0%, #EAF0F7 100%)" }}
      >
        {!geoSettled ? (
          <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
            Loading district boundary…
          </div>
        ) : (
          <ComposableMap
            width={W}
            height={H}
            projection={projection as unknown as ProjectionFunction}
            className="h-auto w-full"
            role="img"
          >
            <defs>
              <filter id="facilityPinShadow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
                <feOffset dx="0" dy="0.6" result="o" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {districtPathD && (
                <clipPath id={heatClipId}>
                  <path d={districtPathD} />
                </clipPath>
              )}
              {(["delivery", "mortality"] as const).flatMap((metric) =>
                (["low", "medium", "high"] as const).map((band) => (
                  <radialGradient
                    key={`${metric}-${band}`}
                    id={`district-${metric}-heat-${band}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop
                      offset="0%"
                      stopColor={DISTRICT_HEATMAP_COLORS[metric][band]}
                      stopOpacity="0.95"
                    />
                    <stop
                      offset="38%"
                      stopColor={DISTRICT_HEATMAP_COLORS[metric][band]}
                      stopOpacity="0.62"
                    />
                    <stop
                      offset="72%"
                      stopColor={DISTRICT_HEATMAP_COLORS[metric][band]}
                      stopOpacity="0.22"
                    />
                    <stop
                      offset="100%"
                      stopColor={DISTRICT_HEATMAP_COLORS[metric][band]}
                      stopOpacity="0"
                    />
                  </radialGradient>
                )),
              )}
            </defs>
            <ZoomableGroup
              center={center ?? defaultCenter}
              zoom={zoom}
              onMoveEnd={({ coordinates, zoom: z }) => {
                setCenter(coordinates);
                setZoom(z);
              }}
              minZoom={1}
              maxZoom={10}
            >
              {districtPathD && (
                <path
                  d={districtPathD}
                  fill="#F8FAFC"
                  stroke="#0B2545"
                  strokeWidth={2.6 / zoom}
                  strokeLinejoin="round"
                  strokeDasharray={feature ? undefined : `${5 / zoom} ${3.5 / zoom}`}
                />
              )}

              {districtPathD && (
                <g clipPath={`url(#${heatClipId})`}>
                  {(heatmapMode === "delivery" || heatmapMode === "combined") &&
                    points.map((point) => {
                      const band = bandFor(point.deliveries, deliveryAreaScale);
                      return (
                        <Marker
                          key={`delivery-heat-${point.id}`}
                          coordinates={[point.lon, point.lat]}
                        >
                          <circle
                            r={AREA_RADIUS[band] / zoom}
                            fill={`url(#district-delivery-heat-${band})`}
                            fillOpacity={AREA_OPACITY[band]}
                            className="pointer-events-none"
                            style={{
                              mixBlendMode: heatmapMode === "combined" ? "multiply" : "normal",
                            }}
                          />
                        </Marker>
                      );
                    })}
                  {(heatmapMode === "mortality" || heatmapMode === "combined") &&
                    points
                      .filter((point) => point.maternalDeaths + point.neonatalDeaths > 0)
                      .map((point) => {
                        const mortality = point.maternalDeaths + point.neonatalDeaths;
                        const band = bandFor(mortality, mortalityAreaScale);
                        return (
                          <Marker
                            key={`mortality-heat-${point.id}`}
                            coordinates={[point.lon, point.lat]}
                          >
                            <circle
                              r={(AREA_RADIUS[band] + 8) / zoom}
                              fill={`url(#district-mortality-heat-${band})`}
                              fillOpacity={Math.min(0.55, AREA_OPACITY[band] + 0.12)}
                              className="pointer-events-none"
                              style={{
                                mixBlendMode: heatmapMode === "combined" ? "multiply" : "normal",
                              }}
                            />
                          </Marker>
                        );
                      })}
                </g>
              )}

              {visiblePoints.map(({ point, scored }) => {
                const tone = scoreTone(point.score);
                const size = FACILITY_ICON_SIZE / Math.sqrt(zoom);
                return (
                  <Marker key={point.id} coordinates={[point.lon, point.lat]}>
                    <g
                      filter="url(#facilityPinShadow)"
                      className="cursor-pointer"
                      onMouseEnter={(event) => showFacility(point, event)}
                      onMouseMove={(event) => showFacility(point, event)}
                      onMouseLeave={() =>
                        setHover((current) => (current?.point.id === point.id ? null : current))
                      }
                      onClick={() => setSelected({ point, scored, x: 0, y: 0 })}
                    >
                      <FacilityMarkerIcon
                        level={point.level}
                        size={size}
                        fill={SCORE_COLORS[tone]}
                      />
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-white/95 shadow-sm">
          <button
            type="button"
            aria-label="Zoom in"
            className="h-7 w-7 text-sm font-semibold text-navy hover:bg-slate-100"
            onClick={() => setZoom((z) => Math.min(10, +(z * 1.5).toFixed(2)))}
          >
            +
          </button>
          <div className="h-px bg-border" />
          <button
            type="button"
            aria-label="Zoom out"
            className="h-7 w-7 text-sm font-semibold text-navy hover:bg-slate-100"
            onClick={() => setZoom((z) => Math.max(1, +(z / 1.5).toFixed(2)))}
          >
            −
          </button>
          {zoom !== 1 && (
            <>
              <div className="h-px bg-border" />
              <button
                type="button"
                aria-label="Reset view"
                className="h-7 w-7 text-[10px] font-semibold text-muted-foreground hover:bg-slate-100"
                onClick={resetView}
              >
                ⟲
              </button>
            </>
          )}
        </div>

        <div className="absolute left-3 top-3 z-10 w-[154px] overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={onBackToState}
            className="flex w-full items-center gap-1.5 border-b border-slate-200 px-2.5 py-2 text-left text-[11px] font-semibold text-navy transition-colors hover:bg-blue-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to state map
          </button>
          <div className="px-2 pt-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Switch district
            </div>
            <div className="truncate text-[10px] font-semibold text-blue-700">{district}</div>
          </div>
          {geo && (
            <ComposableMap
              width={180}
              height={125}
              projection={STATE_INSET_PROJECTION as unknown as ProjectionFunction}
              className="h-auto w-full"
              aria-label="Select another district from Madhya Pradesh map"
            >
              <Geographies geography={geo}>
                {({ geographies }) =>
                  geographies.map((item) => {
                    const geoName = item.properties.district as string;
                    const itemDistrict = GEO_NAME_TO_OURS[geoName] ?? geoName;
                    const active = itemDistrict === district;
                    return (
                      <Geography
                        key={item.rsmKey}
                        geography={item}
                        aria-label={itemDistrict}
                        onClick={() => onSelectDistrict?.(itemDistrict)}
                        style={{
                          default: {
                            fill: active ? "#2563EB" : "#DBEAFE",
                            stroke: "#FFFFFF",
                            strokeWidth: active ? 1.3 : 0.65,
                            outline: "none",
                            cursor: "pointer",
                          },
                          hover: {
                            fill: active ? "#1D4ED8" : "#60A5FA",
                            stroke: "#FFFFFF",
                            strokeWidth: 1.1,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: "#1D4ED8",
                            stroke: "#FFFFFF",
                            strokeWidth: 1.1,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          )}
        </div>

        <div
          className={`absolute right-12 top-3 z-10 rounded-md border px-3 py-2 text-[11px] shadow-sm ${
            mode.kind === "rankings" ? "border-border bg-white/95" : "border-teal/40 bg-teal-50/95"
          }`}
        >
          <span className="font-bold text-navy">{visiblePoints.length}</span>
          <span className="text-muted-foreground">
            {" "}
            {level === "All" ? "matching facilities shown" : `${level} matching facilities shown`}
          </span>
        </div>

        {geoSettled && visiblePoints.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
            <div className="rounded-lg border border-amber-300 bg-white/95 px-4 py-3 text-center shadow-md">
              <div className="text-sm font-semibold text-navy">No matching facilities</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Try another facility level or clear the active filter.
              </div>
            </div>
          </div>
        )}

        {hover && (
          <div
            className="pointer-events-none absolute z-20 w-72 rounded-lg border border-border bg-white p-3 shadow-xl"
            style={{
              left: `clamp(12px, ${hover.x + 14}px, calc(100% - 300px))`,
              top: `clamp(12px, ${hover.y + 14}px, calc(100% - 314px))`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-navy">{hover.point.facility}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {LEVEL_LABEL[hover.point.level]}
                </div>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                style={{ background: SCORE_COLORS[scoreTone(hover.scored.total)] }}
              >
                {SCORE_LABELS[scoreTone(hover.scored.total)]}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between rounded-md bg-secondary/50 px-2.5 py-2">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  Total score
                </div>
                <div
                  className="text-2xl font-extrabold"
                  style={{ color: SCORE_COLORS[scoreTone(hover.scored.total)] }}
                >
                  {hover.scored.total}
                  <span className="text-xs font-medium text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  Deliveries
                </div>
                <div className="text-base font-bold text-navy">{hover.point.deliveries}</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {SCORE_DEFS.map((definition) => {
                const detail = hover.scored.scores[definition.key];
                return (
                  <div
                    key={definition.key}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-muted-foreground">{definition.abbr}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {detail.earned}/{detail.max}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 border-t border-border pt-1.5 text-[9px] text-muted-foreground">
              Six weighted domains total {hover.scored.total}/100 · Click to view full details
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-secondary/25 p-3">
        <HeatmapLegend
          mode={heatmapMode}
          deliveryScale={deliveryAreaScale}
          mortalityScale={mortalityAreaScale}
          scopeLabel="Facility-area ranges"
          palette={DISTRICT_HEATMAP_COLORS}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {(["good", "warn", "bad"] as const).map((tone) => (
          <span key={tone} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: SCORE_COLORS[tone] }}
            />
            {tone === "good" ? "Green (≥ 75)" : tone === "warn" ? "Amber (50–74)" : "Red (< 50)"}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#0B2545]" />
          District boundary
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          Facility icons:
          {(["L1", "L2", "L3"] as const).map((facilityLevel) => (
            <span key={facilityLevel} className="inline-flex items-center gap-1">
              <svg viewBox="-8 -8 16 16" className="h-4 w-4" aria-hidden="true">
                <FacilityMarkerIcon
                  level={facilityLevel}
                  size={14}
                  fill="#64748B"
                  includeHitTarget={false}
                />
              </svg>
              {facilityLevel}
            </span>
          ))}
        </span>
        {isVirtual && (
          <span className="italic">
            No official boundary polygon yet for this district — facilities shown around its centre.
          </span>
        )}
      </div>

      <FacilityScoreDetailDialog
        facility={selected?.scored ?? null}
        deliveries={selected?.point.deliveries ?? 0}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

const AREA_RADIUS: Record<HeatBand, number> = { low: 16, medium: 24, high: 34 };
const AREA_OPACITY: Record<HeatBand, number> = { low: 0.2, medium: 0.3, high: 0.42 };

function FacilityMarkerIcon({
  level,
  size,
  fill,
  includeHitTarget = true,
}: {
  level: Level;
  size: number;
  fill: string;
  includeHitTarget?: boolean;
}) {
  const radius = size / 2;
  const outline = "#FFFFFF";
  const label = level;
  const shape =
    level === "L1" ? (
      <circle r={radius} fill={fill} stroke={outline} strokeWidth={1.5} />
    ) : level === "L2" ? (
      <path
        d={`M 0 ${-radius} L ${radius} 0 L 0 ${radius} L ${-radius} 0 Z`}
        fill={fill}
        stroke={outline}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    ) : (
      <path
        d={`M 0 ${-radius} L ${radius * 0.87} ${-radius * 0.5} L ${radius * 0.87} ${
          radius * 0.5
        } L 0 ${radius} L ${-radius * 0.87} ${radius * 0.5} L ${-radius * 0.87} ${-radius * 0.5} Z`}
        fill={fill}
        stroke={outline}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    );

  return (
    <>
      {includeHitTarget && (
        <circle
          r={radius + 4}
          fill="transparent"
          stroke="none"
          pointerEvents="all"
          aria-hidden="true"
        />
      )}
      <g className="pointer-events-none">
        {shape}
        <text
          x="0"
          y="0.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize={size * 0.4}
          fontWeight="500"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {label}
        </text>
      </g>
    </>
  );
}

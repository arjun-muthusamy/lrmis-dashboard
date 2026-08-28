import { useEffect, useMemo, useState, useCallback, useRef, type MouseEvent } from "react";
import { ComposableMap, Marker, ZoomableGroup, type ProjectionFunction } from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { generateFacilityPoints, type MapFacilityPoint } from "@/lib/facility-geo";
import {
  fetchMPGeo,
  findDistrictFeature,
  syntheticSquareFeature,
  CENTROID,
  VIRTUAL_DISTRICTS,
  type MPGeoFeature,
  type MPGeoCollection,
} from "@/lib/mp-geo";
import type { Level } from "@/lib/scoring-rubric";
import { SCORE_DEFS, scoreFacility, scoreTone, type ScoredFacility } from "@/lib/facility-scores";
import { facilityMatchesMode, type MapMode } from "@/lib/facility-map-filters";
import { FacilityScoreDetailDialog } from "@/components/facility-score-detail-dialog";
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
}

const LEVEL_RADIUS: Record<Level, number> = { L1: 2.8, L2: 4.6, L3: 6.8 };
const LEVEL_LABEL: Record<Level, string> = {
  L1: "L1 Facility",
  L2: "L2 Facility",
  L3: "L3 Facility",
};
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

export function DistrictFacilityMap({ district, districtScore, mode }: Props) {
  const [geo, setGeo] = useState<MPGeoCollection | null>(null);
  const [geoSettled, setGeoSettled] = useState(false);
  const [level, setLevel] = useState<LevelFilter>("All");
  const [hover, setHover] = useState<HoveredFacility | null>(null);
  const [selected, setSelected] = useState<HoveredFacility | null>(null);
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

  const defaultCenter = useMemo<[number, number]>(() => {
    const inverted = projection.invert?.([W / 2, H / 2]);
    return inverted ?? districtCentroid;
  }, [projection, districtCentroid]);

  const resetView = useCallback(() => {
    setZoom(1);
    setCenter(defaultCenter);
  }, [defaultCenter]);

  const showFacility = useCallback(
    (point: MapFacilityPoint, event: MouseEvent<SVGCircleElement>) => {
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
          <h3 className="text-sm font-semibold text-foreground">Facility Locations Map</h3>
          <p className="text-[11px] text-muted-foreground">
            {matchingPoints.length} of {points.length} facilities match · hover for summary, click
            for details
          </p>
        </div>
        <Select
          value={level}
          onValueChange={(value) => {
            setLevel(value as LevelFilter);
            setHover(null);
          }}
        >
          <SelectTrigger className="h-9 w-[190px] bg-white text-xs">
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
                  fill="#DCEBE8"
                  stroke="#0B2545"
                  strokeWidth={2.6 / zoom}
                  strokeLinejoin="round"
                  strokeDasharray={feature ? undefined : `${5 / zoom} ${3.5 / zoom}`}
                />
              )}

              {visiblePoints.map(({ point, scored }) => {
                const tone = scoreTone(point.score);
                return (
                  <Marker key={point.id} coordinates={[point.lon, point.lat]}>
                    <circle
                      r={LEVEL_RADIUS[point.level] / Math.sqrt(zoom)}
                      fill={SCORE_COLORS[tone]}
                      fillOpacity={0.9}
                      stroke="#fff"
                      strokeWidth={0.8 / zoom}
                      filter="url(#facilityPinShadow)"
                      className="cursor-pointer"
                      onMouseEnter={(event) => showFacility(point, event)}
                      onMouseMove={(event) => showFacility(point, event)}
                      onMouseLeave={() =>
                        setHover((current) => (current?.point.id === point.id ? null : current))
                      }
                      onClick={() => setSelected({ point, scored, x: 0, y: 0 })}
                    />
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

        <div
          className={`absolute left-3 top-3 z-10 rounded-md border px-3 py-2 text-[11px] shadow-sm ${
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

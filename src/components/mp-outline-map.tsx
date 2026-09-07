import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  type ProjectionFunction,
} from "react-simple-maps";
import { geoMercator } from "d3-geo";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import {
  facilityLevelCounts,
  generateFacilityPoints,
  type MapFacilityPoint,
} from "@/lib/facility-geo";
import { ScoredFacility, scoreFacility } from "@/lib/facility-scores";
import {
  GEO_URL,
  GEO_NAME_TO_OURS,
  VIRTUAL_DISTRICTS,
  CENTROID,
  fetchMPGeo,
  findDistrictFeature,
  type MPGeoCollection,
} from "@/lib/mp-geo";
import { facilityMatchesMode, type MapMode } from "@/lib/facility-map-filters";
import {
  HEATMAP_DATA,
  HEATMAP_LAST_MONTH,
  bandFor,
  createHeatmapScale,
  type HeatBand,
  type HeatmapMode,
} from "@/lib/heatmap-data";
import { HeatmapModeTabs } from "@/components/heatmap-mode-tabs";
import { HeatmapLegend } from "@/components/heatmap-legend";
export { CHIP_DEFS, type ChipKey, type MapMode } from "@/lib/facility-map-filters";

interface Props {
  mode: MapMode;
  onSelect?: (district: string) => void;
}

const W = 780;
const H = 520;
const projection = geoMercator().center([0, 0]).scale(4186.4).translate([-5340.12, 2067.42]);
const LEVEL_COLOR = { L1: "#0EA5E9", L2: "#7C3AED", L3: "#E11D48" } as const;
const STATE_HEATMAP_COLORS = {
  delivery: { low: "#DBEAFE", medium: "#60A5FA", high: "#1D4ED8" },
  mortality: { low: "#FECACA", medium: "#EF4444", high: "#991B1B" },
} as const;
const HEAT_RADIUS: Record<HeatBand, number> = { low: 5.5, medium: 8.5, high: 12 };
const HEAT_OPACITY: Record<HeatBand, number> = { low: 0.42, medium: 0.58, high: 0.74 };

interface StateFacility {
  district: string;
  point: MapFacilityPoint;
  scored: ScoredFacility;
}

export function MPOutlineMap({ mode, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([78.4, 23.9]);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("delivery");
  const [geoCollection, setGeoCollection] = useState<MPGeoCollection | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const byName = useMemo(
    () => Object.fromEntries(DISTRICT_ROWS.map((row) => [row.district, row])),
    [],
  );
  const heatByDistrict = useMemo(
    () => Object.fromEntries(HEATMAP_DATA.map((datum) => [datum.district, datum])),
    [],
  );

  useEffect(() => {
    let active = true;
    fetchMPGeo()
      .then((collection) => {
        if (active) setGeoCollection(collection);
      })
      .catch(() => {
        if (active) setGeoCollection({ type: "FeatureCollection", features: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const facilities = useMemo<StateFacility[]>(() => {
    if (!geoCollection) return [];
    return DISTRICT_ROWS.flatMap((row) => {
      const feature = findDistrictFeature(geoCollection, row.district);
      return generateFacilityPoints(row.district, row.composite, feature).map((point) => ({
        district: row.district,
        point,
        scored: scoreFacility(point.facility, row.district, point.type, point.level, point.score, {
          maternalDeaths: point.maternalDeaths,
          neonatalDeaths: point.neonatalDeaths,
        }),
      }));
    });
  }, [geoCollection]);

  const filtering = mode.kind !== "rankings" && !(mode.kind === "chips" && !mode.chips.length);
  const heatFacilities = useMemo(
    () =>
      filtering
        ? facilities.filter(({ point, scored }) => facilityMatchesMode({ scored, ...point }, mode))
        : facilities,
    [facilities, filtering, mode],
  );
  const highlights = useMemo(() => {
    if (!filtering) return new Set<string>();
    return new Set(heatFacilities.map((facility) => facility.district));
  }, [filtering, heatFacilities]);
  const deliveryFacilityScale = useMemo(
    () => createHeatmapScale(facilities.map(({ point }) => point.deliveries)),
    [facilities],
  );
  const mortalityFacilityScale = useMemo(
    () =>
      createHeatmapScale(
        facilities
          .map(({ point }) => point.maternalDeaths + point.neonatalDeaths)
          .filter((value) => value > 0),
      ),
    [facilities],
  );
  const accent =
    mode.kind === "maternalDeaths"
      ? "#BE185D"
      : mode.kind === "neonatalDeaths"
        ? "#7C3AED"
        : mode.kind === "supervision"
          ? "#D97706"
          : "#0F2D56";

  const updateHover = useCallback((district: string, event: MouseEvent<SVGElement>) => {
    const bounds = mapRef.current?.getBoundingClientRect();
    if (bounds) {
      setHoverPoint({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    }
    setHover(district);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setCenter([78.4, 23.9]);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">State-level Heat Map</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Facility-coordinate heat intensity from {HEATMAP_LAST_MONTH} data · no point markers
          </p>
        </div>
        <HeatmapModeTabs value={heatmapMode} onChange={setHeatmapMode} />
      </div>
      <div
        ref={mapRef}
        className="relative overflow-hidden rounded-lg"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, #F7FAFD 0%, #EAF0F7 100%)" }}
      >
        <ComposableMap
          width={W}
          height={H}
          projection={projection as unknown as ProjectionFunction}
          className="h-auto w-full"
          role="img"
        >
          <defs>
            <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" />
              <feOffset dx="0" dy="1.2" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.22" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {(["delivery", "mortality"] as const).flatMap((metric) =>
              (["low", "medium", "high"] as const).map((band) => (
                <radialGradient
                  key={`${metric}-${band}`}
                  id={`state-${metric}-heat-${band}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop
                    offset="0%"
                    stopColor={STATE_HEATMAP_COLORS[metric][band]}
                    stopOpacity="0.95"
                  />
                  <stop
                    offset="38%"
                    stopColor={STATE_HEATMAP_COLORS[metric][band]}
                    stopOpacity="0.62"
                  />
                  <stop
                    offset="72%"
                    stopColor={STATE_HEATMAP_COLORS[metric][band]}
                    stopOpacity="0.22"
                  />
                  <stop
                    offset="100%"
                    stopColor={STATE_HEATMAP_COLORS[metric][band]}
                    stopOpacity="0"
                  />
                </radialGradient>
              )),
            )}
          </defs>
          <ZoomableGroup
            center={center}
            zoom={zoom}
            onMoveEnd={({ coordinates, zoom: nextZoom }) => {
              setCenter(coordinates);
              setZoom(nextZoom);
            }}
            minZoom={1}
            maxZoom={6}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.district as string;
                  const district = GEO_NAME_TO_OURS[geoName] ?? geoName;
                  const row = byName[district];
                  const highlighted = highlights.has(district);
                  const muted = filtering && !highlighted;
                  const fill = muted ? "#E2E8F0" : "#F8FAFC";
                  const opacity = muted ? 0.5 : 1;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      filter="url(#softShadow)"
                      onMouseEnter={(event) => row && updateHover(district, event)}
                      onMouseMove={(event) => row && updateHover(district, event)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => row && onSelect?.(district)}
                      style={{
                        default: {
                          fill,
                          opacity,
                          stroke: highlighted ? accent : "#FFFFFF",
                          strokeWidth: (highlighted ? 2.4 : 1.1) / zoom,
                          outline: "none",
                          cursor: row ? "pointer" : "default",
                          transition: "fill 0.2s ease, opacity 0.2s ease, filter 0.2s ease",
                        },
                        hover: {
                          fill: highlighted || !filtering ? "#EEF2F6" : "#CBD5E1",
                          opacity: 1,
                          stroke: highlighted ? accent : "#0F2D56",
                          strokeWidth: 1.8 / zoom,
                          outline: "none",
                          cursor: row ? "pointer" : "default",
                          filter: row ? "brightness(1.08)" : undefined,
                        },
                        pressed: { fill: "#E2E8F0", outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {(heatmapMode === "delivery" || heatmapMode === "combined") &&
              heatFacilities.map(({ point }) => {
                const band = bandFor(point.deliveries, deliveryFacilityScale);
                return (
                  <Marker
                    key={`state-delivery-heat-${point.id}`}
                    coordinates={[point.lon, point.lat]}
                  >
                    <circle
                      r={HEAT_RADIUS[band] / Math.sqrt(zoom)}
                      fill={`url(#state-delivery-heat-${band})`}
                      fillOpacity={HEAT_OPACITY[band]}
                      className="pointer-events-none"
                      style={{ mixBlendMode: heatmapMode === "combined" ? "multiply" : "normal" }}
                    />
                  </Marker>
                );
              })}

            {(heatmapMode === "mortality" || heatmapMode === "combined") &&
              heatFacilities
                .filter(({ point }) => point.maternalDeaths + point.neonatalDeaths > 0)
                .map(({ point }) => {
                  const deaths = point.maternalDeaths + point.neonatalDeaths;
                  const band = bandFor(deaths, mortalityFacilityScale);
                  return (
                    <Marker
                      key={`state-mortality-heat-${point.id}`}
                      coordinates={[point.lon, point.lat]}
                    >
                      <circle
                        r={(HEAT_RADIUS[band] + 4) / Math.sqrt(zoom)}
                        fill={`url(#state-mortality-heat-${band})`}
                        fillOpacity={Math.min(0.9, HEAT_OPACITY[band] + 0.12)}
                        className="pointer-events-none"
                        style={{ mixBlendMode: heatmapMode === "combined" ? "multiply" : "normal" }}
                      />
                    </Marker>
                  );
                })}

            {DISTRICT_ROWS.map((row) => {
              const coord = CENTROID[row.district];
              if (!coord) return null;
              const virtual = VIRTUAL_DISTRICTS.has(row.district);
              const highlighted = highlights.has(row.district);
              const muted = filtering && !highlighted;
              const opacity = muted ? 0.38 : 1;
              return (
                <Marker key={row.district} coordinates={coord}>
                  {virtual && (
                    <rect
                      x={-14 / zoom}
                      y={-14 / zoom}
                      width={28 / zoom}
                      height={28 / zoom}
                      rx={2 / zoom}
                      fill="transparent"
                      stroke={highlighted ? accent : "#FFFFFF"}
                      strokeWidth={(highlighted ? 2.4 : 1.4) / zoom}
                      opacity={opacity}
                      onMouseEnter={(event) => updateHover(row.district, event)}
                      onMouseMove={(event) => updateHover(row.district, event)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelect?.(row.district)}
                      className="cursor-pointer"
                    />
                  )}
                  <text
                    textAnchor="middle"
                    dy={-1}
                    opacity={opacity}
                    style={{
                      pointerEvents: "none",
                      fontSize: 8.2 / zoom,
                      fontWeight: 650,
                      fill: "#334155",
                    }}
                  >
                    {row.district.length > 10 ? `${row.district.slice(0, 9)}…` : row.district}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-white/95 shadow-sm">
          <button
            type="button"
            aria-label="Zoom in"
            className="h-7 w-7 text-sm font-semibold text-navy hover:bg-slate-100"
            onClick={() => setZoom((value) => Math.min(6, +(value * 1.4).toFixed(2)))}
          >
            +
          </button>
          <div className="h-px bg-border" />
          <button
            type="button"
            aria-label="Zoom out"
            className="h-7 w-7 text-sm font-semibold text-navy hover:bg-slate-100"
            onClick={() => setZoom((value) => Math.max(1, +(value / 1.4).toFixed(2)))}
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

        {filtering && (
          <div className="absolute left-3 top-3 rounded-md border border-border bg-white/95 px-2.5 py-1.5 text-[11px] shadow-sm">
            <span className="font-semibold text-navy">{heatFacilities.length}</span>
            <span className="text-muted-foreground"> matching facilities</span>
          </div>
        )}

        {hover && byName[hover] && (
          <div
            className="pointer-events-none absolute z-20 w-60 rounded-lg border border-border bg-white p-3 shadow-xl"
            style={{
              left: `clamp(12px, ${hoverPoint.x + 14}px, calc(100% - 252px))`,
              top: `clamp(12px, ${hoverPoint.y + 14}px, calc(100% - 204px))`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-navy">{hover}</div>
                <div className="text-[10px] text-muted-foreground">
                  {byName[hover].division} • Rank #{byName[hover].rank}
                </div>
              </div>
              {filtering && highlights.has(hover) && (
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                  style={{ background: accent }}
                >
                  Match
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1.5 text-[11px]">
              <span className="text-muted-foreground">Total deliveries</span>
              <span className="font-semibold text-foreground">
                {byName[hover].totalDeliveries.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-md bg-rose-50 px-2 py-1.5 text-[11px]">
              <span className="text-muted-foreground">Mortality deaths</span>
              <span className="font-semibold text-rose-700">
                {heatByDistrict[hover]?.mortalityCount ?? 0}
              </span>
            </div>
            <div className="mt-1.5 flex gap-1 text-[11px]">
              {(["L1", "L2", "L3"] as const).map((level) => (
                <div
                  key={level}
                  className="flex flex-1 flex-col items-center rounded-md border border-border/70 py-1"
                >
                  <span className="text-[9px] font-semibold" style={{ color: LEVEL_COLOR[level] }}>
                    {level}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {facilityLevelCounts(hover)[level]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 rounded-lg border border-border bg-secondary/25 p-3">
        <HeatmapLegend
          mode={heatmapMode}
          deliveryScale={deliveryFacilityScale}
          mortalityScale={mortalityFacilityScale}
          palette={STATE_HEATMAP_COLORS}
          scopeLabel="Facility-level values"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        {filtering && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: accent }} />
            Matches current analysis
          </span>
        )}
        {heatmapMode === "combined" && (
          <span className="text-[10px]">
            Combined view overlays blue delivery heat with red mortality heat at facility locations.
          </span>
        )}
        <span className="ml-auto text-[10px]">Hover for details · Click to open district view</span>
      </div>
    </div>
  );
}

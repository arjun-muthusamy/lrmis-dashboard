import { useCallback, useMemo, useRef, useState, type MouseEvent } from "react";
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
import { facilityLevelCounts, facilityRosterForDistrict } from "@/lib/facility-geo";
import { scoreFacility, type ScoredFacility } from "@/lib/facility-scores";
import { GEO_URL, GEO_NAME_TO_OURS, VIRTUAL_DISTRICTS, CENTROID } from "@/lib/mp-geo";
import { facilityMatchesMode, type MapMode } from "@/lib/facility-map-filters";
export { CHIP_DEFS, type ChipKey, type MapMode } from "@/lib/facility-map-filters";

interface Props {
  mode: MapMode;
  onSelect?: (district: string) => void;
}

const W = 780;
const H = 520;
const STATE_FILL = "#3A9188";
const projection = geoMercator().center([0, 0]).scale(4186.4).translate([-5340.12, 2067.42]);
const LEVEL_COLOR = { L1: "#0EA5E9", L2: "#7C3AED", L3: "#E11D48" } as const;

interface CanonicalFacility {
  scored: ScoredFacility;
  deliveries: number;
}

export function MPOutlineMap({ mode, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([78.4, 23.9]);
  const mapRef = useRef<HTMLDivElement>(null);
  const byName = useMemo(
    () => Object.fromEntries(DISTRICT_ROWS.map((row) => [row.district, row])),
    [],
  );

  const highlights = useMemo(() => {
    if (mode.kind === "rankings") return new Set<string>();
    return new Set(
      DISTRICT_ROWS.filter((row) =>
        facilityRosterForDistrict(row.district, row.composite).some((facility) => {
          const scored = scoreFacility(
            facility.facility,
            row.district,
            facility.type,
            facility.level,
            facility.score,
            {
              maternalDeaths: facility.maternalDeaths,
              neonatalDeaths: facility.neonatalDeaths,
            },
          );
          return facilityMatchesMode({ scored, ...facility }, mode);
        }),
      ).map((row) => row.district),
    );
  }, [mode]);

  const filtering = mode.kind !== "rankings" && !(mode.kind === "chips" && !mode.chips.length);
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
                  const fill = muted ? "#CBD5E1" : STATE_FILL;
                  const opacity = muted ? 0.38 : 1;
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
                          fill: highlighted || !filtering ? STATE_FILL : "#94A3B8",
                          opacity: 1,
                          stroke: highlighted ? accent : "#0F2D56",
                          strokeWidth: 1.8 / zoom,
                          outline: "none",
                          cursor: row ? "pointer" : "default",
                          filter: row ? "brightness(1.08)" : undefined,
                        },
                        pressed: { fill: STATE_FILL, outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

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
                      fill={muted ? "#CBD5E1" : STATE_FILL}
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
                      fill: "#FFFFFF",
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
            <span className="font-semibold text-navy">{highlights.size}</span>
            <span className="text-muted-foreground"> matching districts</span>
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
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: STATE_FILL }} />
          Madhya Pradesh districts
        </span>
        {filtering && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: accent }} />
            Matches current analysis
          </span>
        )}
        <span className="ml-auto text-[10px]">Hover for details · Click to open district view</span>
      </div>
    </div>
  );
}

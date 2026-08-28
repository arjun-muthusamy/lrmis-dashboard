import { useMemo, useState, useCallback, useRef, type MouseEvent } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  type ProjectionFunction,
} from "react-simple-maps";
import { geoMercator } from "d3-geo";
import { DISTRICT_ROWS, type DistrictRow } from "@/lib/mock-data";
import { facilityLevelCounts } from "@/lib/facility-geo";
import { GEO_URL, GEO_NAME_TO_OURS, VIRTUAL_DISTRICTS, CENTROID } from "@/lib/mp-geo";

interface Props {
  onSelect?: (district: string) => void;
}

const W = 780,
  H = 520;

// Mercator projection fitted once to the real MP boundary extent (lon 74.03–82.81,
// lat 21.07–26.87) so the state fills the viewBox with a consistent 28px margin.
const projection = geoMercator().center([0, 0]).scale(4186.4).translate([-5340.12, 2067.42]);

const LEVEL_COLOR = { L1: "#0EA5E9", L2: "#7C3AED", L3: "#E11D48" } as const;
const DELIVERY_COLORS = {
  top: "#166534",
  medium: "#22C55E",
  normal: "#FACC15",
} as const;

export function MPOutlineMap({ onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([78.4, 23.9]);
  const byName = useMemo(() => Object.fromEntries(DISTRICT_ROWS.map((r) => [r.district, r])), []);

  const updateDistrictHover = useCallback((district: string, event: MouseEvent<SVGPathElement>) => {
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

  function fillFor(row: DistrictRow | undefined): { fill: string; label: string; dark: boolean } {
    if (!row) return { fill: "#E7EDF5", label: "", dark: false };
    if (row.totalDeliveries >= 1700) {
      return { fill: DELIVERY_COLORS.top, label: "", dark: true };
    }
    if (row.totalDeliveries >= 1000) {
      return { fill: DELIVERY_COLORS.medium, label: "", dark: true };
    }
    return { fill: DELIVERY_COLORS.normal, label: "", dark: false };
  }

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
              <feOffset dx="0" dy="1.2" result="offsetblur" />
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
            onMoveEnd={({ coordinates, zoom: z }) => {
              setCenter(coordinates);
              setZoom(z);
            }}
            minZoom={1}
            maxZoom={6}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.district as string;
                  const ourName = GEO_NAME_TO_OURS[geoName] ?? geoName;
                  const row = byName[ourName];
                  const { fill } = fillFor(row);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      filter="url(#softShadow)"
                      onMouseEnter={(event) => row && updateDistrictHover(ourName, event)}
                      onMouseMove={(event) => row && updateDistrictHover(ourName, event)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => row && onSelect?.(ourName)}
                      style={{
                        default: {
                          fill,
                          opacity: 1,
                          stroke: "#FFFFFF",
                          strokeWidth: 1.1 / zoom,
                          outline: "none",
                          cursor: row ? "pointer" : "default",
                          transition: "opacity 0.25s ease, filter 0.2s ease",
                        },
                        hover: {
                          fill,
                          opacity: 1,
                          stroke: "#0F2D56",
                          strokeWidth: 1.6 / zoom,
                          outline: "none",
                          cursor: row ? "pointer" : "default",
                          filter: row ? "brightness(1.07)" : undefined,
                        },
                        pressed: { fill, outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* District labels + virtual (boundary-less) districts */}
            {DISTRICT_ROWS.map((row) => {
              const name = row.district;
              const coord = CENTROID[name];
              if (!coord) return null;
              const isVirtual = VIRTUAL_DISTRICTS.has(name);
              const { fill, label, dark } = fillFor(row);
              return (
                <Marker key={name} coordinates={coord}>
                  {isVirtual && (
                    <rect
                      x={-14 / zoom}
                      y={-14 / zoom}
                      width={28 / zoom}
                      height={28 / zoom}
                      rx={2 / zoom}
                      fill={fill}
                      stroke="#FFFFFF"
                      strokeWidth={1.4 / zoom}
                      opacity={1}
                      filter="url(#softShadow)"
                      onMouseEnter={(event) => updateDistrictHover(name, event)}
                      onMouseMove={(event) => updateDistrictHover(name, event)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelect?.(name)}
                      className="cursor-pointer"
                      style={{ transition: "opacity 0.25s ease" }}
                    />
                  )}
                  <g style={{ pointerEvents: "none" }} opacity={1}>
                    <text
                      textAnchor="middle"
                      dy={isVirtual ? -1 : -2}
                      style={{
                        fontSize: 8.2 / zoom,
                        fontWeight: 600,
                        fill: dark ? "#fff" : "#0F2D56",
                      }}
                    >
                      {name.length > 10 ? name.slice(0, 9) + "\u2026" : name}
                    </text>
                    {label && (
                      <text
                        textAnchor="middle"
                        dy={9 / zoom}
                        style={{
                          fontSize: 9.5 / zoom,
                          fontWeight: 800,
                          fill: dark ? "#fff" : "#0F2D56",
                        }}
                      >
                        {label}
                      </text>
                    )}
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-white/95 shadow-sm">
          <button
            type="button"
            aria-label="Zoom in"
            className="h-7 w-7 text-sm font-semibold text-navy hover:bg-slate-100"
            onClick={() => setZoom((z) => Math.min(6, +(z * 1.4).toFixed(2)))}
          >
            +
          </button>
          <div className="h-px bg-border" />
          <button
            type="button"
            aria-label="Zoom out"
            className="h-7 w-7 text-sm font-semibold text-navy hover:bg-slate-100"
            onClick={() => setZoom((z) => Math.max(1, +(z / 1.4).toFixed(2)))}
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

        {hover && byName[hover] && (
          <div
            className="pointer-events-none absolute z-10 w-60 rounded-lg border border-border bg-white p-3 shadow-lg"
            style={{
              left: `clamp(12px, ${hoverPoint.x + 14}px, calc(100% - 252px))`,
              top: `clamp(12px, ${hoverPoint.y + 14}px, calc(100% - 204px))`,
            }}
          >
            <div className="text-sm font-semibold text-navy">{byName[hover].district}</div>
            <div className="text-[10px] text-muted-foreground">
              {byName[hover].division} • Rank #{byName[hover].rank}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1.5 text-[11px]">
              <span className="text-muted-foreground">Total deliveries</span>
              <span className="font-semibold text-foreground">
                {byName[hover].totalDeliveries.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px]">
              {(["L1", "L2", "L3"] as const).map((lvl) => (
                <div
                  key={lvl}
                  className="flex flex-1 flex-col items-center rounded-md border border-border/70 py-1"
                >
                  <span className="text-[9px] font-semibold" style={{ color: LEVEL_COLOR[lvl] }}>
                    {lvl}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {facilityLevelCounts(byName[hover].district)[lvl]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Total deliveries:</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: DELIVERY_COLORS.top }}
          />{" "}
          Top (≥ 1,700)
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: DELIVERY_COLORS.medium }}
          />{" "}
          Medium (1,000–1,699)
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: DELIVERY_COLORS.normal }}
          />{" "}
          Normal (&lt; 1,000)
        </span>
        <span className="ml-auto text-[10px]">
          Hover a district for details · Click to open district view
        </span>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from "react";
import { ComposableMap, Marker, ZoomableGroup } from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { scoreColor } from "@/lib/csv";
import { generateFacilityPoints, type MapFacilityPoint } from "@/lib/facility-geo";
import { BLOCKS_OF } from "@/lib/districts";
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

interface Props {
  district: string;
  districtScore: number;
}

const LEVEL_COLOR: Record<Level, string> = { L1: "#0EA5E9", L2: "#7C3AED", L3: "#E11D48" };
const LEVEL_RADIUS: Record<Level, number> = { L1: 2.8, L2: 4.6, L3: 6.8 };
const LEVEL_LABEL: Record<Level, string> = {
  L1: "L1 · PHC/SHC",
  L2: "L2 · CHC",
  L3: "L3 · Hospital",
};
const ALL_LEVELS: Level[] = ["L1", "L2", "L3"];

// Block quadrant fills — distinct from the facility-level palette so the two
// layers of colour (block vs. facility) never get confused for one another.
const BLOCK_FILLS = ["#BFE3F0", "#C9E9CE", "#F6D9AE", "#E4C7F5"];
const BLOCK_STROKES = ["#3E8FB0", "#4F9D68", "#C98A3A", "#9B5FC0"];

const W = 640,
  H = 440,
  PAD = 34;

interface Quadrant {
  name: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  fill: string;
  stroke: string;
}

export function DistrictFacilityMap({ district, districtScore }: Props) {
  const [geo, setGeo] = useState<MPGeoCollection | null>(null);
  const [geoSettled, setGeoSettled] = useState(false);
  const [levels, setLevels] = useState<Set<Level>>(new Set(ALL_LEVELS));
  const [hover, setHover] = useState<MapFacilityPoint | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number] | null>(null);

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

  const counts = useMemo(() => {
    const c: Record<Level, number> = { L1: 0, L2: 0, L3: 0 };
    points.forEach((p) => c[p.level]++);
    return c;
  }, [points]);

  const visiblePoints = useMemo(() => points.filter((p) => levels.has(p.level)), [points, levels]);

  // The real polygon when we have one; otherwise a small synthetic square
  // around the centroid, used for the bold outline and its block subdivision
  // so virtual (boundary-less) districts still get the same treatment.
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

  const bounds = useMemo(
    () => pathGen.bounds(geomFeature as unknown as GeoJSON.Feature),
    [pathGen, geomFeature],
  );

  const clipId = useMemo(() => `districtClip-${district.replace(/[^a-zA-Z0-9]/g, "")}`, [district]);

  // Split the district's pixel-space bounding box into 4 quadrants — one per
  // mock administrative block — then clip them to the real (or synthetic)
  // district shape so the fills never spill outside it.
  const quadrants = useMemo<Quadrant[]>(() => {
    const [[x0, y0], [x1, y1]] = bounds;
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const names = BLOCKS_OF[district] ?? [1, 2, 3, 4].map((n) => `${district} Block ${n}`);
    const rects: Array<[number, number, number, number]> = [
      [x0, y0, mx, my],
      [mx, y0, x1, my],
      [x0, my, mx, y1],
      [mx, my, x1, y1],
    ];
    return rects.map(([rx0, ry0, rx1, ry1], i) => ({
      name: names[i % names.length],
      x0: rx0,
      y0: ry0,
      x1: rx1,
      y1: ry1,
      fill: BLOCK_FILLS[i % BLOCK_FILLS.length],
      stroke: BLOCK_STROKES[i % BLOCK_STROKES.length],
    }));
  }, [bounds, district]);

  const blockForPoint = useCallback(
    (lon: number, lat: number): string | undefined => {
      const projected = projection([lon, lat]);
      if (!projected) return undefined;
      const [px, py] = projected;
      const [[x0, y0], [x1, y1]] = bounds;
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const idx = (px < mx ? 0 : 1) + (py < my ? 0 : 2);
      return quadrants[idx]?.name;
    },
    [projection, bounds, quadrants],
  );

  const defaultCenter = useMemo<[number, number]>(() => {
    const inverted = projection.invert?.([W / 2, H / 2]);
    return inverted ?? districtCentroid;
  }, [projection, districtCentroid]);

  const resetView = useCallback(() => {
    setZoom(1);
    setCenter(defaultCenter);
  }, [defaultCenter]);

  const toggleLevel = (lvl: Level) => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) {
        if (next.size === 1) return prev; // keep at least one level visible
        next.delete(lvl);
      } else {
        next.add(lvl);
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Facility Locations Map</h3>
          <p className="text-[11px] text-muted-foreground">
            {points.length} facilities plotted · hover a point for details
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_LEVELS.map((lvl) => {
            const on = levels.has(lvl);
            return (
              <button
                key={lvl}
                onClick={() => toggleLevel(lvl)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  on
                    ? "border-transparent text-white"
                    : "border-border bg-white text-muted-foreground hover:bg-secondary"
                }`}
                style={on ? { background: LEVEL_COLOR[lvl] } : undefined}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: on ? "#fff" : LEVEL_COLOR[lvl] }}
                />
                {lvl} ({counts[lvl]})
              </button>
            );
          })}
        </div>
      </div>

      <div
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
            projection={projection as any}
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
                <clipPath id={clipId}>
                  <path d={districtPathD} />
                </clipPath>
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
              {/* Block subdivisions — clipped to the real (or synthetic) district shape */}
              {districtPathD && (
                <g clipPath={`url(#${clipId})`}>
                  {quadrants.map((q) => (
                    <rect
                      key={q.name}
                      x={q.x0}
                      y={q.y0}
                      width={q.x1 - q.x0}
                      height={q.y1 - q.y0}
                      fill={q.fill}
                      fillOpacity={0.6}
                      stroke={q.stroke}
                      strokeOpacity={0.8}
                      strokeWidth={1.2 / zoom}
                    />
                  ))}
                </g>
              )}

              {/* Bold district boundary on top of the blocks */}
              {districtPathD && (
                <path
                  d={districtPathD}
                  fill="none"
                  stroke="#0B2545"
                  strokeWidth={2.6 / zoom}
                  strokeLinejoin="round"
                  strokeDasharray={feature ? undefined : `${5 / zoom} ${3.5 / zoom}`}
                />
              )}

              {/* Block name labels, one per quadrant */}
              {quadrants.map((q) => (
                <text
                  key={`label-${q.name}`}
                  x={(q.x0 + q.x1) / 2}
                  y={(q.y0 + q.y1) / 2}
                  textAnchor="middle"
                  style={{
                    fontSize: 9 / zoom,
                    fontWeight: 700,
                    fill: "#0F2D56",
                    pointerEvents: "none",
                  }}
                  opacity={0.75}
                >
                  {q.name}
                </text>
              ))}

              {visiblePoints.map((p) => (
                <Marker key={p.id} coordinates={[p.lon, p.lat]}>
                  <circle
                    r={LEVEL_RADIUS[p.level] / Math.sqrt(zoom)}
                    fill={LEVEL_COLOR[p.level]}
                    fillOpacity={p.level === "L1" ? 0.75 : 0.9}
                    stroke="#fff"
                    strokeWidth={0.8 / zoom}
                    filter="url(#facilityPinShadow)"
                    className="cursor-pointer"
                    onMouseEnter={() => setHover(p)}
                    onMouseLeave={() => setHover((cur) => (cur?.id === p.id ? null : cur))}
                  />
                </Marker>
              ))}
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

        <div className="absolute left-3 top-3 z-10 rounded-md border border-border bg-white/95 px-2.5 py-1.5 text-[11px] shadow-sm">
          <span className="font-semibold text-navy">{visiblePoints.length}</span>
          <span className="text-muted-foreground"> shown of {points.length}</span>
        </div>

        {hover && (
          <div className="pointer-events-none absolute right-3 top-3 z-20 w-56 rounded-lg border border-border bg-white p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: LEVEL_COLOR[hover.level] }}
              />
              <div className="text-sm font-semibold text-navy">{hover.facility}</div>
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {LEVEL_LABEL[hover.level]}
            </div>
            <div className="mt-1 text-[10px] font-medium text-navy">
              Block: {blockForPoint(hover.lon, hover.lat) ?? "—"}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-muted-foreground">Score</div>
                <div className="text-lg font-bold" style={{ color: scoreColor(hover.score) }}>
                  {hover.score}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Deliveries</div>
                <div className="text-lg font-bold text-foreground">{hover.deliveries}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {ALL_LEVELS.map((lvl) => (
          <span key={lvl} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: LEVEL_COLOR[lvl] }}
            />
            {LEVEL_LABEL[lvl]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#0B2545]" />
          District boundary
        </span>
        {isVirtual && (
          <span className="italic">
            No official boundary polygon yet for this district — blocks &amp; facilities shown
            around its centre.
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Blocks:</span>
        {quadrants.map((q) => (
          <span key={q.name} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: q.fill, border: `1px solid ${q.stroke}` }}
            />
            {q.name}
          </span>
        ))}
      </div>
    </div>
  );
}

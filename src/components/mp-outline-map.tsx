import { useMemo, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoMercator } from "d3-geo";
import { DISTRICT_ROWS, type DistrictRow } from "@/lib/mock-data";
import { scoreColor, trafficColor } from "@/lib/csv";
import {
  districtsForIntersection,
  MATERNAL_DEATH_DISTRICTS,
  NEONATAL_DEATH_DISTRICTS,
  SUPERVISION_DISTRICTS,
  type IntersectionKey,
} from "@/lib/intersections";
import { facilitiesForDistrict, type FacilityScore } from "@/lib/facility-mock";
import { levelFromType, type Level } from "@/lib/scoring-rubric";

export type ChipKey =
  | "drugStockout"
  | "hrGap"
  | "equipMalfunction"
  | "highReferralOut"
  | "lowDeliveries"
  | "lowCsection"
  | "scoreAbove80"
  | "scoreBelow40"
  | "infraGaps"
  | "consumableStockout"
  | "noBloodBank"
  | "lowRefInL3"
  | "highNeoRefs"
  | "trainingGaps";

export type MapMode =
  | {
      kind: "metric";
      metric: keyof Pick<
        DistrictRow,
        "composite" | "hr" | "infra" | "drugs" | "outcomes" | "dataQuality"
      >;
    }
  | { kind: "rankings" }
  | { kind: "intersection"; preset: IntersectionKey }
  | { kind: "supervision" }
  | { kind: "maternalDeaths" }
  | { kind: "neonatalDeaths" }
  | { kind: "facilitiesByLevel"; level: Level }
  | { kind: "chips"; chips: ChipKey[] };

interface Props {
  mode: MapMode;
  onSelect?: (district: string) => void;
  onSelectFacility?: (district: string, facility: string) => void;
  selected?: string;
}

// Real Madhya Pradesh district boundaries (district-level GeoJSON, pinned commit
// so the shapes never shift under us). Fetched client-side by react-simple-maps.
const GEO_URL =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/states/madhya-pradesh.geojson";

// The source boundary data predates a couple of admin changes. Map its
// district property to our canonical name where the two disagree.
const GEO_NAME_TO_OURS: Record<string, string> = {
  Hoshangabad: "Narmadapuram", // renamed 2021
};

// Districts carved out after the boundary data was captured (Maihar from
// Satna, Mauganj from Rewa, both 2023) have no polygon in the source file.
// They're plotted as standalone markers at their real town coordinates so
// they keep full functionality without a fabricated boundary.
const VIRTUAL_DISTRICT_COORDS: Record<string, [number, number]> = {
  Maihar: [80.7667, 24.2667],
  Mauganj: [81.8833, 24.6764],
};
const VIRTUAL_DISTRICTS = new Set(Object.keys(VIRTUAL_DISTRICT_COORDS));

// Real [lon, lat] centroids for every district — used to place facility pins
// and, for the two virtual districts above, the district marker itself.
const CENTROID: Record<string, [number, number]> = {
  "Agar Malwa": [76.0882, 23.8147],
  Alirajpur: [74.3644, 22.3149],
  Anuppur: [81.6826, 23.0569],
  Ashoknagar: [77.8751, 24.6098],
  Balaghat: [80.3587, 21.8804],
  Barwani: [75.0215, 21.7885],
  Betul: [77.8711, 21.8787],
  Bhind: [78.7213, 26.4223],
  Bhopal: [77.3907, 23.4703],
  Burhanpur: [76.3698, 21.3699],
  Chhatarpur: [79.6656, 24.7982],
  Chhindwara: [78.8542, 22.1229],
  Damoh: [79.527, 23.8117],
  Datia: [78.5973, 25.8029],
  Dewas: [76.4573, 22.7442],
  Dhar: [75.1036, 22.4984],
  Dindori: [81.0509, 22.8901],
  Guna: [77.1984, 24.5555],
  Gwalior: [78.1461, 26.0398],
  Harda: [77.1235, 22.2323],
  Indore: [75.7825, 22.7136],
  Jabalpur: [79.9753, 23.2337],
  Jhabua: [74.6717, 22.8935],
  Katni: [80.4031, 23.7529],
  Khargone: [75.7717, 21.9189],
  Mandla: [80.5128, 22.6386],
  Mandsaur: [75.4049, 24.2043],
  Morena: [77.8683, 26.4131],
  Narmadapuram: [77.9913, 22.5909], // = Hoshangabad centroid
  Narsinghpur: [79.0883, 22.936],
  Neemuch: [75.1416, 24.592],
  Niwari: [78.7491, 25.2845],
  Panna: [80.1888, 24.4193],
  Raisen: [78.1189, 23.2199],
  Rajgarh: [76.733, 23.8608],
  Ratlam: [75.0889, 23.5024],
  Rewa: [81.5871, 24.7558],
  Sagar: [78.7598, 23.8498],
  Satna: [80.8313, 24.5311],
  Sehore: [77.1272, 22.9873],
  Seoni: [79.6892, 22.3171],
  Shahdol: [81.4736, 23.6295],
  Shajapur: [76.575, 23.3657],
  Sheopur: [77.0073, 25.7546],
  Shivpuri: [77.8054, 25.3651],
  Sidhi: [81.834, 24.2212],
  Singrauli: [82.4188, 24.2149],
  Tikamgarh: [79.015, 24.8827],
  Ujjain: [75.669, 23.3306],
  Umaria: [80.974, 23.563],
  Vidisha: [77.8131, 23.8925],
  ...VIRTUAL_DISTRICT_COORDS,
};

const W = 780,
  H = 520;

// Mercator projection fitted once to the real MP boundary extent (lon 74.03–82.81,
// lat 21.07–26.87) so the state fills the viewBox with a consistent 28px margin.
const projection = geoMercator().center([0, 0]).scale(4186.4).translate([-5340.12, 2067.42]);

// Standard Google-style map pin: round head + teardrop tip, tip at local (0, cyTip).
function pinPath(cyTip: number, r = 5.5): string {
  const cy = cyTip - r * 2.1;
  return (
    `M 0 ${cyTip} ` +
    `C ${-r * 1.05} ${cy + r * 0.55}, ${-r * 1.15} ${cy - r * 0.55}, ${-r * 0.62} ${cy - r * 0.95} ` +
    `A ${r} ${r} 0 1 1 ${r * 0.62} ${cy - r * 0.95} ` +
    `C ${r * 1.15} ${cy - r * 0.55}, ${r * 1.05} ${cy + r * 0.55}, 0 ${cyTip} Z`
  );
}

// Rounded diamond used for the two "virtual" districts that have no polygon.
function diamondPath(r: number): string {
  const k = r * 0.42;
  return `M 0 ${-r} C ${k} ${-k} ${r} ${-k} ${r} 0 C ${r} ${k} ${k} ${r} 0 ${r} C ${-k} ${r} ${-r} ${k} ${-r} 0 C ${-r} ${-k} ${-k} ${-k} 0 ${-r} Z`;
}

const LEVEL_COLOR: Record<Level, string> = { L1: "#0EA5E9", L2: "#7C3AED", L3: "#E11D48" };

const METRIC_LABELS: Record<string, string> = {
  composite: "Overall Score",
  hr: "Human Resources",
  infra: "Infrastructure",
  drugs: "Essential Drugs",
  outcomes: "Delivery Outcomes",
  dataQuality: "Data Quality",
};

// Per-intersection facility filter — pins only show facilities that actually
// drive the intersection (so e.g. "High referral-out + HR unavailability"
// shows facilities whose HR domain is genuinely low).
function facilityMatchesPreset(f: FacilityScore, preset: IntersectionKey): boolean {
  switch (preset) {
    case "high_out_hr":
      return f.hr < 60;
    case "high_out_stockout":
      return f.drugs < 60;
    case "high_out_equipment":
      return f.infra < 65;
    case "low_ref_poor_out":
      return f.outcomes < 65;
    case "high_in_good_out":
      return f.outcomes > 78 && f.score > 75;
    case "poor_signal_low_cs":
      return f.infra < 65;
    case "low_ref_amb_poor_out":
      return f.outcomes < 65 || f.infra < 65;
  }
}

function facilityMatchesChip(f: FacilityScore, chip: ChipKey): boolean {
  switch (chip) {
    case "drugStockout":
      return f.drugs < 60;
    case "hrGap":
      return f.hr < 60;
    case "equipMalfunction":
      return f.infra < 60;
    case "highReferralOut":
      return f.outcomes < 65 && f.score < 70;
    case "lowDeliveries":
      return f.deliveries < 120;
    case "lowCsection":
      return f.outcomes < 60 && f.deliveries > 150;
    case "scoreAbove80":
      return f.score >= 80;
    case "scoreBelow40":
      return f.score <= 45;
    case "infraGaps":
      return f.infra < 65;
    case "consumableStockout":
      return f.drugs < 65 && f.infra < 70;
    case "noBloodBank":
      return levelFromType(f.type) !== "L1" && f.infra < 68;
    case "lowRefInL3":
      return levelFromType(f.type) === "L3" && f.outcomes < 70;
    case "highNeoRefs":
      return f.outcomes < 65 && f.infra < 70;
    case "trainingGaps":
      return f.hr < 65 && f.outcomes < 70;
  }
}

export function MPOutlineMap({ mode, onSelect, onSelectFacility, selected }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPin, setHoverPin] = useState<{ f: FacilityScore; d: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([78.4, 23.9]);
  const byName = useMemo(() => Object.fromEntries(DISTRICT_ROWS.map((r) => [r.district, r])), []);

  const resetView = useCallback(() => {
    setZoom(1);
    setCenter([78.4, 23.9]);
  }, []);

  // Pre-compute facility pins so chips/intersection highlights map to districts
  // that actually contain matching facilities (others get greyed out).
  const facilityPins: Array<{ dx: number; dy: number; district: string; facility: FacilityScore }> =
    useMemo(() => {
      const enable =
        mode.kind === "intersection" ||
        mode.kind === "maternalDeaths" ||
        mode.kind === "neonatalDeaths" ||
        mode.kind === "facilitiesByLevel" ||
        (mode.kind === "chips" && mode.chips.length > 0);
      if (!enable) return [];
      const pins: Array<{ dx: number; dy: number; district: string; facility: FacilityScore }> = [];
      const baseDistricts: string[] =
        mode.kind === "intersection"
          ? districtsForIntersection(mode.preset)
          : mode.kind === "maternalDeaths"
            ? MATERNAL_DEATH_DISTRICTS
            : mode.kind === "neonatalDeaths"
              ? NEONATAL_DEATH_DISTRICTS
              : DISTRICT_ROWS.map((d) => d.district);
      baseDistricts.forEach((d) => {
        const row = byName[d];
        if (!row || !CENTROID[d]) return;
        let facs = facilitiesForDistrict(d, row.composite);
        if (mode.kind === "intersection") {
          facs = facs.filter((f) => facilityMatchesPreset(f, mode.preset));
        } else if (mode.kind === "chips") {
          facs = facs.filter((f) => mode.chips.every((c) => facilityMatchesChip(f, c)));
        } else if (mode.kind === "facilitiesByLevel") {
          facs = facs.filter((f) => levelFromType(f.type) === mode.level);
        } else if (mode.kind === "maternalDeaths" || mode.kind === "neonatalDeaths") {
          facs = facs.slice(0, 1);
        }
        const maxPins =
          mode.kind === "maternalDeaths" || mode.kind === "neonatalDeaths"
            ? 1
            : mode.kind === "facilitiesByLevel"
              ? mode.level === "L3"
                ? 2
                : mode.level === "L2"
                  ? 4
                  : 6
              : 3;

        facs.slice(0, maxPins).forEach((f, i) => {
          const angle = (i / maxPins) * Math.PI * 2 - Math.PI / 3;
          const dx = maxPins === 1 ? 0 : Math.cos(angle) * 15;
          const dy = maxPins === 1 ? 0 : Math.sin(angle) * 15;
          pins.push({ dx, dy, district: d, facility: f });
        });
      });
      return pins;
    }, [byName, mode]);

  const highlights = useMemo<Set<string>>(() => {
    switch (mode.kind) {
      case "intersection":
      case "chips":
        return new Set(facilityPins.map((p) => p.district));
      case "supervision":
        return new Set(SUPERVISION_DISTRICTS);
      case "maternalDeaths":
        return new Set(MATERNAL_DEATH_DISTRICTS);
      case "neonatalDeaths":
        return new Set(NEONATAL_DEATH_DISTRICTS);
      default:
        return new Set();
    }
  }, [mode, facilityPins]);

  const showFacilityPins =
    mode.kind === "intersection" ||
    mode.kind === "maternalDeaths" ||
    mode.kind === "neonatalDeaths" ||
    mode.kind === "facilitiesByLevel" ||
    (mode.kind === "chips" && mode.chips.length > 0);
  const showHalo = mode.kind === "maternalDeaths" || mode.kind === "neonatalDeaths";
  const dimsNonHighlighted =
    mode.kind === "intersection" ||
    mode.kind === "supervision" ||
    mode.kind === "maternalDeaths" ||
    mode.kind === "neonatalDeaths" ||
    (mode.kind === "chips" && mode.chips.length > 0);

  function fillFor(row: DistrictRow | undefined): { fill: string; label: string; dark: boolean } {
    if (!row) return { fill: "#E7EDF5", label: "", dark: false };
    if (mode.kind === "supervision") {
      const isHi = highlights.has(row.district);
      return { fill: isHi ? "#FCA5A5" : "#EAF1F8", label: "", dark: false };
    }
    if (mode.kind === "metric") {
      const v = row[mode.metric];
      return { fill: trafficColor(v), label: String(v), dark: true };
    }
    // Districts are never traffic-lit — only facilities carry the RAG colour.
    return { fill: "#EAF1F8", label: "", dark: false };
  }

  const overlayColor =
    mode.kind === "maternalDeaths"
      ? "#F472B6"
      : mode.kind === "neonatalDeaths"
        ? "#A78BFA"
        : "#FBBF24";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, #F7FAFD 0%, #EAF0F7 100%)" }}
      >
        <ComposableMap
          width={W}
          height={H}
          projection={projection as any}
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
            <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" />
              <feOffset dx="0" dy="0.8" result="o" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.45" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="overlayHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={overlayColor} stopOpacity="0.55" />
              <stop offset="70%" stopColor={overlayColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={overlayColor} stopOpacity="0" />
            </radialGradient>
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
                  const isSel = selected === ourName;
                  const isHi = highlights.has(ourName);
                  const { fill } = fillFor(row);
                  const baseOpacity = dimsNonHighlighted && !isHi ? 0.22 : 1;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      filter="url(#softShadow)"
                      onMouseEnter={() => row && setHover(ourName)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => row && onSelect?.(ourName)}
                      style={{
                        default: {
                          fill,
                          opacity: baseOpacity,
                          stroke: isSel ? "#0B7B8A" : "#FFFFFF",
                          strokeWidth: isSel ? 2.4 / zoom : 1.1 / zoom,
                          outline: "none",
                          cursor: row ? "pointer" : "default",
                          transition: "opacity 0.25s ease, filter 0.2s ease",
                        },
                        hover: {
                          fill,
                          opacity: dimsNonHighlighted && !isHi ? 0.42 : 1,
                          stroke: isSel ? "#0B7B8A" : "#0F2D56",
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
              const isSel = selected === name;
              const isHi = highlights.has(name);
              const opacity = dimsNonHighlighted && !isHi ? 0.35 : 1;
              return (
                <Marker key={name} coordinates={coord}>
                  {isVirtual && (
                    <path
                      d={diamondPath(12 / zoom)}
                      fill={fill}
                      stroke={isSel ? "#0B7B8A" : "#FFFFFF"}
                      strokeWidth={(isSel ? 2.4 : 1.4) / zoom}
                      opacity={dimsNonHighlighted && !isHi ? 0.22 : 1}
                      filter="url(#softShadow)"
                      onMouseEnter={() => setHover(name)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelect?.(name)}
                      className="cursor-pointer"
                      style={{ transition: "opacity 0.25s ease" }}
                    />
                  )}
                  <g style={{ pointerEvents: "none" }} opacity={opacity}>
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
                  {isHi && showHalo && (
                    <circle r={26 / zoom} fill="url(#overlayHalo)" pointerEvents="none" />
                  )}
                </Marker>
              );
            })}

            {/* Facility pins */}
            {facilityPins.map((p, i) => {
              const coord = CENTROID[p.district];
              if (!coord) return null;
              const color = trafficColor(p.facility.score);
              const s = 1 / zoom;
              return (
                <Marker key={i} coordinates={coord}>
                  <g
                    transform={`translate(${p.dx * s}, ${p.dy * s}) scale(${s})`}
                    onMouseEnter={() => setHoverPin({ f: p.facility, d: p.district })}
                    onMouseLeave={() => setHoverPin(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFacility?.(p.district, p.facility.facility);
                    }}
                    className="cursor-pointer"
                    filter="url(#pinShadow)"
                  >
                    <circle r={6} fill={color} stroke="#fff" strokeWidth={1.6} />
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

        {hover && byName[hover] && !hoverPin && (
          <div className="pointer-events-none absolute right-3 top-3 z-10 w-56 rounded-lg border border-border bg-white p-3 shadow-lg">
            <div className="text-sm font-semibold text-navy">{byName[hover].district}</div>
            <div className="text-[10px] text-muted-foreground">
              {byName[hover].division} • Rank #{byName[hover].rank}
            </div>
            {mode.kind === "metric" && (
              <>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {METRIC_LABELS[mode.metric]}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: scoreColor(byName[hover][mode.metric]) }}
                >
                  {byName[hover][mode.metric]}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">/ 100</span>
                </div>
              </>
            )}
            {mode.kind === "rankings" && (
              <div className="mt-1.5 text-xs">
                <div className="text-muted-foreground">
                  Deliveries {byName[hover].totalDeliveries.toLocaleString()}
                </div>
              </div>
            )}
            {(mode.kind === "maternalDeaths" || mode.kind === "neonatalDeaths") &&
              highlights.has(hover) && (
                <div className="mt-1.5 text-xs font-semibold" style={{ color: overlayColor }}>
                  {mode.kind === "maternalDeaths" ? "Maternal" : "Neonatal"} death reported (last
                  month)
                </div>
              )}
          </div>
        )}

        {hoverPin && (
          <div className="pointer-events-none absolute right-3 top-3 z-20 w-60 rounded-lg border border-border bg-white p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: LEVEL_COLOR[levelFromType(hoverPin.f.type)] }}
              />
              <div className="text-sm font-semibold text-navy">{hoverPin.f.facility}</div>
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {hoverPin.f.type} · {hoverPin.d}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">Overall score</div>
            <div className="text-2xl font-bold" style={{ color: scoreColor(hoverPin.f.score) }}>
              {hoverPin.f.score}
              <span className="ml-1 text-xs font-medium text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-1.5 text-[10px] italic text-muted-foreground">
              Click pin to open full facility panel →
            </div>
          </div>
        )}

        {dimsNonHighlighted && (
          <div className="absolute left-3 top-3 z-10 rounded-md border border-border bg-white/95 px-2.5 py-1.5 text-[11px] shadow-sm">
            <span className="font-semibold text-navy">{highlights.size}</span>
            <span className="text-muted-foreground">
              {" "}
              district{highlights.size === 1 ? "" : "s"}
            </span>
            {showFacilityPins && (
              <>
                <span className="mx-1.5 text-border">·</span>
                <span className="font-semibold text-navy">{facilityPins.length}</span>
                <span className="text-muted-foreground">
                  {" "}
                  facility pin{facilityPins.length === 1 ? "" : "s"}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {showFacilityPins && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Facility score:</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#10B981" }} />{" "}
            Green (≥ 75)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#F59E0B" }} />{" "}
            Amber (50–74)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#EF4444" }} />{" "}
            Red (&lt; 50)
          </span>
          {(mode.kind === "maternalDeaths" || mode.kind === "neonatalDeaths") && (
            <span className="inline-flex items-center gap-1 ml-2">
              <span
                className="inline-block h-3 w-6 rounded-full"
                style={{ background: overlayColor, opacity: 0.5 }}
              />
              {mode.kind === "maternalDeaths" ? "Maternal death" : "Neonatal death"} (last month)
            </span>
          )}
          <span className="ml-auto text-[10px]">
            {facilityPins.length} facility pin{facilityPins.length === 1 ? "" : "s"}
            {mode.kind === "facilitiesByLevel" ? ` · ${mode.level}` : ""}
          </span>
        </div>
      )}

      {mode.kind === "metric" && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">Score:</span>
          <div className="flex-1">
            <div
              className="h-2 w-full rounded"
              style={{ background: "linear-gradient(to right, #EF4444, #F59E0B, #10B981)" }}
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}
      {mode.kind === "supervision" && (
        <div className="mt-3 text-[11px] text-muted-foreground">
          {highlights.size} district{highlights.size === 1 ? "" : "s"} flagged for supervision
        </div>
      )}
    </div>
  );
}

export const CHIP_DEFS: Array<{ key: ChipKey; label: string; tone: "red" | "amber" | "green" }> = [
  { key: "drugStockout", label: "Drug stockouts", tone: "red" },
  { key: "consumableStockout", label: "Consumable stockouts", tone: "red" },
  { key: "hrGap", label: "HR gaps", tone: "red" },
  { key: "trainingGaps", label: "Staff training gaps", tone: "red" },
  { key: "equipMalfunction", label: "Malfunctioning equipment", tone: "red" },
  { key: "infraGaps", label: "Infrastructure gaps", tone: "red" },
  { key: "noBloodBank", label: "No functional blood bank", tone: "red" },
  { key: "highReferralOut", label: "High referral-out", tone: "amber" },
  { key: "highNeoRefs", label: "High neonatal referrals", tone: "amber" },
  { key: "lowRefInL3", label: "Low referral-in at L3", tone: "amber" },
  { key: "lowDeliveries", label: "Lower-than-expected deliveries", tone: "amber" },
  { key: "lowCsection", label: "Low C-section rate", tone: "amber" },
  { key: "scoreAbove80", label: "Score ≥ 80 (high performers)", tone: "green" },
  { key: "scoreBelow40", label: "Score ≤ 40 (urgent attention)", tone: "red" },
];

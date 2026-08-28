// Shared Madhya Pradesh geography constants + helpers.
//
// Single source of truth for the real district boundary data (fetched from a
// pinned CDN GeoJSON), district name reconciliation, centroids, and the
// "virtual" post-2023 districts that have no polygon in the source file.
// Both the statewide outline map and the per-district facility map read from
// here so the two stay consistent.
import { geoContains } from "d3-geo";

export type MPGeoFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
};

export type MPGeoCollection = {
  type: "FeatureCollection";
  features: MPGeoFeature[];
};

// Real Madhya Pradesh district boundaries (district-level GeoJSON, pinned commit
// so the shapes never shift under us). Fetched client-side.
export const GEO_URL =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/states/madhya-pradesh.geojson";

// The source boundary data predates a couple of admin changes. Map its
// district property to our canonical name where the two disagree.
export const GEO_NAME_TO_OURS: Record<string, string> = {
  Hoshangabad: "Narmadapuram", // renamed 2021
};

// Districts carved out after the boundary data was captured (Maihar from
// Satna, Mauganj from Rewa, both 2023) have no polygon in the source file.
// They're plotted as standalone markers at their real town coordinates so
// they keep full functionality without a fabricated boundary.
export const VIRTUAL_DISTRICT_COORDS: Record<string, [number, number]> = {
  Maihar: [80.7667, 24.2667],
  Mauganj: [81.8833, 24.6764],
};
export const VIRTUAL_DISTRICTS = new Set(Object.keys(VIRTUAL_DISTRICT_COORDS));

// Real [lon, lat] centroids for every district — used to place facility pins
// and, for the two virtual districts above, the district marker itself.
export const CENTROID: Record<string, [number, number]> = {
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

let geoPromise: Promise<MPGeoCollection> | null = null;

/** Fetches + caches the statewide district boundary GeoJSON (once per session). */
export function fetchMPGeo(): Promise<MPGeoCollection> {
  if (!geoPromise) {
    geoPromise = fetch(GEO_URL).then((r) => r.json() as Promise<MPGeoCollection>);
  }
  return geoPromise;
}

/** Finds the boundary feature for one of our canonical district names, if any. */
export function findDistrictFeature(
  collection: MPGeoCollection,
  district: string,
): MPGeoFeature | undefined {
  return collection.features.find((f) => {
    const geoName = f.properties.district as string;
    return (GEO_NAME_TO_OURS[geoName] ?? geoName) === district;
  });
}

function flattenCoords(coords: unknown, out: Array<[number, number]>): void {
  if (Array.isArray(coords) && typeof coords[0] === "number") {
    out.push(coords as [number, number]);
    return;
  }
  if (Array.isArray(coords)) {
    for (const c of coords) flattenCoords(c, out);
  }
}

export interface LonLatBBox {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/** A small square Polygon feature around a point — used to `fitExtent` a
 * projection for districts that have no real boundary polygon (the two
 * post-2023 "virtual" districts). */
export function syntheticSquareFeature(center: [number, number], halfSpanDeg = 0.09): MPGeoFeature {
  const [lon, lat] = center;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lon - halfSpanDeg, lat - halfSpanDeg],
          [lon + halfSpanDeg, lat - halfSpanDeg],
          [lon + halfSpanDeg, lat + halfSpanDeg],
          [lon - halfSpanDeg, lat + halfSpanDeg],
          [lon - halfSpanDeg, lat - halfSpanDeg],
        ],
      ],
    },
  };
}

export function bboxOfFeature(feature: MPGeoFeature): LonLatBBox {
  const pts: Array<[number, number]> = [];
  flattenCoords(feature.geometry.coordinates, pts);
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of pts) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, maxLon, minLat, maxLat };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return h >>> 0;
}

/**
 * Deterministic point for a facility inside a district — inside the real
 * polygon when we have one, otherwise a small ring around the district's
 * centroid (used for the two boundary-less "virtual" districts).
 */
export function randomPointInDistrict(
  district: string,
  seedKey: string,
  feature: MPGeoFeature | undefined,
): [number, number] {
  const rng = mulberry32(strSeed(district + "::" + seedKey));
  if (feature) {
    const bbox = bboxOfFeature(feature);
    for (let attempt = 0; attempt < 30; attempt++) {
      const lon = bbox.minLon + rng() * (bbox.maxLon - bbox.minLon);
      const lat = bbox.minLat + rng() * (bbox.maxLat - bbox.minLat);
      if (geoContains(feature as unknown as GeoJSON.Feature, [lon, lat])) return [lon, lat];
    }
    // Fell through 30 tries (thin/concave shape) — fall back to the bbox centre.
    return [(bbox.minLon + bbox.maxLon) / 2, (bbox.minLat + bbox.maxLat) / 2];
  }
  const centroid = CENTROID[district] ?? [78.4, 23.9];
  const angle = rng() * Math.PI * 2;
  const radius = 0.02 + rng() * 0.045;
  return [centroid[0] + Math.cos(angle) * radius, centroid[1] + Math.sin(angle) * radius * 0.85];
}

// src/types/geojson.d.ts

declare module "*.geojson" {
  const value: GeoJSON.GeoJsonObject;
  export default value;
}

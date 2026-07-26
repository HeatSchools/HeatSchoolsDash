/**
 * Tipos compartidos del dashboard HeatSchools.
 * Paso 1: alinear el frontend con pipeline/schema.py.
 */

export type CountryCode = "CL" | "CO" | "PE";
export type CountrySlug = "cl" | "co" | "pe";

export interface SchoolProperties {
  school_id: string;
  school_name: string;
  country: CountryCode;
  admin1: string;
  admin2: string;
  level: string;
  sector: string;
  enrollment: number;
  urban_rural: string;
  altitude_m: number;
  tmax_avg_c: number;
  pet_avg_c: number;
  wbgt_avg_c: number;
  heat_days_30: number;
  heat_days_35: number;
  tx90p: number;
  wsdi: number;
  wellbeing_score: number;
  health_index: number;
}

export interface SchoolFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: SchoolProperties;
}

export interface SchoolsGeoJSON {
  type: "FeatureCollection";
  features: SchoolFeature[];
}

export interface HistoricalSeries {
  school_id: string;
  resolution: string;
  years: number;
  week_start: string[];
  tmax_c: number[];
  pet_c: number[];
  wbgt_c: number[];
}

export interface RecentRow {
  school_id: string;
  country: string;
  date: string;
  tmax_c: number;
  tmin_c: number;
  pet_c: number;
  wbgt_c: number;
}

export interface CountryMeta {
  code: CountryCode;
  slug: CountrySlug;
  route: string;
  label: string;
  mapCenter: [number, number];
  mapZoom: number;
}

export const COUNTRIES: CountryMeta[] = [
  { code: "CL", slug: "cl", route: "chile", label: "Chile", mapCenter: [-71, -38], mapZoom: 3.25 },
  { code: "CO", slug: "co", route: "colombia", label: "Colombia", mapCenter: [-74, 4.2], mapZoom: 4.2 },
  { code: "PE", slug: "pe", route: "peru", label: "Perú", mapCenter: [-76, -9.5], mapZoom: 4.2 },
];

export function countryByRoute(route: string): CountryMeta | undefined {
  return COUNTRIES.find((c) => c.route === route);
}

export function countryByCode(code: CountryCode): CountryMeta {
  return COUNTRIES.find((c) => c.code === code)!;
}

/**
 * Carga de datos en el navegador desde /public/data (fetch).
 * Evita embeber GeoJSON en el HTML estático de Next.js (límite 25 MiB en Workers).
 */
import type { CountryCode, CountrySlug, SchoolsGeoJSON, SchoolProperties } from "./types";
import { COUNTRIES } from "./types";
import type { DailyClimateSeries } from "./climate";
import { computeCountryKpis, computeGlobalKpis } from "./aggregates";
import { countByField, schoolsByCountry } from "./distributions";
import type { CountryPanelData } from "@/components/HomeStatsPanel";
import type { CountryMapInfo } from "@/components/SouthAmericaMap";
import type { SchoolFeature } from "./types";
import { COUNTRY_CODE_TO_ISO } from "./mapStyles";

const COUNTRY_BLURBS: Record<CountryCode, string> = {
  CL: "Muestra en regiones del norte, centro y sur. Datos ficticios para el mockup.",
  CO: "Cobertura en costa, Andes y Orinoquía. Datos ficticios para el mockup.",
  PE: "Desde la costa hasta la sierra y selva. Datos ficticios para el mockup.",
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
  return res.json() as Promise<T>;
}

async function fetchGzipJson<T>(gzUrl: string, legacyUrl: string): Promise<T> {
  const res = await fetch(gzUrl);
  if (res.ok && typeof DecompressionStream !== "undefined" && res.body) {
    const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    return JSON.parse(text) as T;
  }

  return fetchJson<T>(legacyUrl);
}

export async function fetchSchoolsGeoJSON(slug: CountrySlug): Promise<SchoolsGeoJSON> {
  return fetchJson(`/data/schools/${slug}.geojson`);
}

export async function fetchSchoolMapGeoJSON(slug: CountrySlug): Promise<SchoolsGeoJSON> {
  return fetchGzipJson(
    `/data/schools-map/${slug}.geojson.gz`,
    `/data/schools-map/${slug}.geojson`
  );
}

export async function fetchCountryDaily(slug: CountrySlug): Promise<DailyClimateSeries> {
  return fetchJson(`/data/summary/${slug}_daily.json`);
}

export async function fetchCountryDailyFull(slug: CountrySlug): Promise<DailyClimateSeries> {
  return fetchJson(`/data/summary/${slug}_daily_full.json`);
}

export interface CountryDashboardData {
  schools: SchoolProperties[];
  mapFeatures: SchoolFeature[];
  dailySeries: DailyClimateSeries;
}

export async function fetchCountryDashboardData(slug: CountrySlug): Promise<CountryDashboardData> {
  const [schoolsGeo, mapGeo, dailySeries] = await Promise.all([
    fetchSchoolsGeoJSON(slug),
    fetchSchoolMapGeoJSON(slug),
    fetchCountryDailyFull(slug),
  ]);

  return {
    schools: schoolsGeo.features.map((f) => f.properties),
    mapFeatures: mapGeo.features,
    dailySeries,
  };
}

export interface HomePageData {
  globalKpis: ReturnType<typeof computeGlobalKpis>;
  dailyByCountry: Record<CountryCode, DailyClimateSeries>;
  globalDistribution: {
    byCountry: ReturnType<typeof schoolsByCountry>;
    byLevel: ReturnType<typeof countByField>;
    bySector: ReturnType<typeof countByField>;
  };
  mapCountries: CountryMapInfo[];
  schoolFeatures: SchoolFeature[];
  countries: CountryPanelData[];
}

export async function fetchHomePageData(): Promise<HomePageData> {
  const byCountry = await Promise.all(
    COUNTRIES.map(async (c) => {
      const [schoolsGeo, mapGeo, daily] = await Promise.all([
        fetchSchoolsGeoJSON(c.slug),
        fetchSchoolMapGeoJSON(c.slug),
        fetchCountryDaily(c.slug),
      ]);
      const schools = schoolsGeo.features.map((f) => f.properties);
      const kpis = computeCountryKpis(schools);
      return {
        meta: c,
        schools,
        mapFeatures: mapGeo.features,
        daily,
        kpis,
      };
    })
  );

  const allSchools = byCountry.flatMap((c) => c.schools);
  const dailyByCountry = Object.fromEntries(
    byCountry.map((c) => [c.meta.code, c.daily])
  ) as Record<CountryCode, DailyClimateSeries>;

  const countries: CountryPanelData[] = byCountry.map((c) => ({
    code: c.meta.code,
    route: c.meta.route,
    label: c.meta.label,
    count: c.schools.length,
    kpis: c.kpis,
    distribution: {
      byLevel: countByField(c.schools, "level"),
      bySector: countByField(c.schools, "sector"),
      byZone: countByField(c.schools, "urban_rural"),
    },
    dailyClimate: c.daily,
  }));

  const mapCountries: CountryMapInfo[] = countries.map((c) => ({
    code: c.code,
    iso: COUNTRY_CODE_TO_ISO[c.code],
    label: c.label,
    count: c.count,
    avgTmax: c.kpis.avgTmax,
    avgWellbeing: c.kpis.avgWellbeing,
    avgHealth: c.kpis.avgHealth,
    blurb: COUNTRY_BLURBS[c.code],
  }));

  return {
    globalKpis: computeGlobalKpis(allSchools),
    dailyByCountry,
    globalDistribution: {
      byCountry: schoolsByCountry(allSchools),
      byLevel: countByField(allSchools, "level"),
      bySector: countByField(allSchools, "sector"),
    },
    mapCountries,
    schoolFeatures: byCountry.flatMap((c) => c.mapFeatures),
    countries,
  };
}

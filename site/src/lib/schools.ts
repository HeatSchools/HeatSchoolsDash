/**
 * Carga de GeoJSON de escuelas en tiempo de compilación (build estático).
 * Paso 3: la capa de mapa y KPIs se alimentan solo de estos archivos resumen;
 * no se usa DuckDB-WASM en home ni en páginas de país.
 */
import fs from "fs";
import path from "path";
import type { CountryCode, CountrySlug, SchoolsGeoJSON, SchoolProperties } from "./types";
import { COUNTRIES } from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data", "schools");

export function loadSchoolsGeoJSON(slug: CountrySlug): SchoolsGeoJSON {
  const filePath = path.join(DATA_DIR, `${slug}.geojson`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SchoolsGeoJSON;
}

export function loadAllSchools(): SchoolProperties[] {
  return COUNTRIES.flatMap((c) =>
    loadSchoolsGeoJSON(c.slug).features.map((f) => f.properties)
  );
}

export function loadCountrySchools(code: CountryCode): SchoolProperties[] {
  const slug = COUNTRIES.find((c) => c.code === code)!.slug;
  return loadSchoolsGeoJSON(slug).features.map((f) => f.properties);
}

export function loadAllSchoolFeatures() {
  return COUNTRIES.flatMap((c) => loadSchoolsGeoJSON(c.slug).features);
}

export function countByCountry(): Record<CountryCode, number> {
  const counts = {} as Record<CountryCode, number>;
  for (const c of COUNTRIES) {
    counts[c.code] = loadSchoolsGeoJSON(c.slug).features.length;
  }
  return counts;
}

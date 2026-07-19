import { loadAllSchools, loadCountrySchools, loadAllSchoolFeatures, countByCountry } from "@/lib/schools";
import { computeGlobalKpis, computeCountryKpis } from "@/lib/aggregates";
import { countByField, schoolsByCountry } from "@/lib/distributions";
import { loadCountryDaily } from "@/lib/summary";
import { COUNTRIES, type CountryCode } from "@/lib/types";
import { COUNTRY_CODE_TO_ISO } from "@/lib/mapStyles";
import HomeExplorer from "@/components/HomeExplorer";
import type { CountryMapInfo } from "@/components/SouthAmericaMap";

const COUNTRY_BLURBS: Record<CountryCode, string> = {
  CL: "Muestra en regiones del norte, centro y sur. Datos ficticios para el mockup.",
  CO: "Cobertura en costa, Andes y Orinoquía. Datos ficticios para el mockup.",
  PE: "Desde la costa hasta la sierra y selva. Datos ficticios para el mockup.",
};

export default function HomePage() {
  const allSchools = loadAllSchools();
  const globalKpis = computeGlobalKpis(allSchools);
  const counts = countByCountry();
  const schoolFeatures = loadAllSchoolFeatures();

  const dailyByCountry = Object.fromEntries(
    COUNTRIES.map((c) => [c.code, loadCountryDaily(c.slug)])
  ) as Record<CountryCode, ReturnType<typeof loadCountryDaily>>;

  const countries = COUNTRIES.map((c) => {
    const schools = loadCountrySchools(c.code);
    return {
      code: c.code,
      route: c.route,
      label: c.label,
      count: counts[c.code],
      kpis: computeCountryKpis(schools),
      distribution: {
        byLevel: countByField(schools, "level"),
        bySector: countByField(schools, "sector"),
        byZone: countByField(schools, "urban_rural"),
      },
      dailyClimate: dailyByCountry[c.code],
    };
  });

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

  return (
    <div className="container">
      <section className="hero">
        <h1 className="hero-tagline">Hacer visible a un asesino silencioso</h1>
        <p className="hero-subtitle">
          Catalizar la acción política para proteger la salud y el bienestar del estudiantado
          frente al calor extremo en un clima cambiante en América Latina.
        </p>
      </section>

      <HomeExplorer
        globalKpis={globalKpis}
        dailyByCountry={dailyByCountry}
        globalDistribution={{
          byCountry: schoolsByCountry(allSchools),
          byLevel: countByField(allSchools, "level"),
          bySector: countByField(allSchools, "sector"),
        }}
        mapCountries={mapCountries}
        schoolFeatures={schoolFeatures}
        countries={countries}
      />

      <div className="disclaimer">
        <strong>Aviso:</strong> todos los datos mostrados en este dashboard son 100% ficticios
        y sirven únicamente para probar la interfaz. No deben usarse para análisis ni
        decisiones de política pública.
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import CountryDashboard from "@/components/CountryDashboard";
import { loadSchoolsGeoJSON, loadSchoolMapGeoJSON } from "@/lib/schools";
import { loadCountryDailyFull } from "@/lib/summary";
import { countryByRoute } from "@/lib/types";

interface Props {
  params: Promise<{ country: string }>;
}

/**
 * Página dinámica por país (/chile, /colombia, /peru).
 * Generada estáticamente en build time.
 */
export function generateStaticParams() {
  return [{ country: "chile" }, { country: "colombia" }, { country: "peru" }];
}

export default async function CountryPage({ params }: Props) {
  const { country: route } = await params;
  const meta = countryByRoute(route);
  if (!meta) notFound();

  const geojson = loadSchoolsGeoJSON(meta.slug);
  const mapGeojson = loadSchoolMapGeoJSON(meta.slug);
  const schools = geojson.features.map((f) => f.properties);
  const dailySeries = loadCountryDailyFull(meta.slug);

  return (
    <CountryDashboard
      country={meta}
      mapFeatures={mapGeojson.features}
      allSchools={schools}
      dailySeries={dailySeries}
    />
  );
}

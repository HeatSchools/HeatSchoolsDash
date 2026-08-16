"use client";

import { useEffect, useState } from "react";
import { fetchHomePageData, type HomePageData } from "@/lib/dataClient";
import HomeExplorer from "./HomeExplorer";

export default function HomePageClient() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHomePageData()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      });
  }, []);

  if (error) {
    return <div className="loading" style={{ color: "var(--color-accent)" }}>{error}</div>;
  }

  if (!data) {
    return <div className="loading">Cargando datos del dashboard…</div>;
  }

  return (
    <HomeExplorer
      globalKpis={data.globalKpis}
      dailyByCountry={data.dailyByCountry}
      globalDistribution={data.globalDistribution}
      mapCountries={data.mapCountries}
      schoolFeatures={data.schoolFeatures}
      countries={data.countries}
    />
  );
}

"use client";

import { useState } from "react";
import type { CountryCode, SchoolFeature } from "@/lib/types";
import type { GlobalKpis } from "@/lib/aggregates";
import type { DailyClimateSeries } from "@/lib/climate";
import type { PieSlice } from "@/lib/distributions";
import SouthAmericaMap, { type CountryMapInfo } from "./SouthAmericaMap";
import HomeStatsPanel, { type CountryPanelData } from "./HomeStatsPanel";

interface Props {
  globalKpis: GlobalKpis;
  dailyByCountry: Record<CountryCode, DailyClimateSeries>;
  globalDistribution: {
    byCountry: PieSlice[];
    byLevel: PieSlice[];
    bySector: PieSlice[];
  };
  mapCountries: CountryMapInfo[];
  schoolFeatures: SchoolFeature[];
  countries: CountryPanelData[];
}

export default function HomeExplorer({
  globalKpis,
  dailyByCountry,
  globalDistribution,
  mapCountries,
  schoolFeatures,
  countries,
}: Props) {
  const [selected, setSelected] = useState<CountryCode | null>(null);

  return (
    <section className="home-explorer">
      <div className="home-explorer-grid">
        <div className="home-map-panel panel">
          <SouthAmericaMap
            countries={mapCountries}
            schoolFeatures={schoolFeatures}
            selectedCountry={selected}
            onSelectCountry={setSelected}
          />
        </div>

        <HomeStatsPanel
          globalKpis={globalKpis}
          dailyByCountry={dailyByCountry}
          globalDistribution={globalDistribution}
          countries={countries}
          selected={selected}
        />
      </div>
    </section>
  );
}

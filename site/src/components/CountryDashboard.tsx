"use client";

/**
 * Vista principal de exploración por país: mapa, filtros, KPIs, gráficos y tabla.
 */
import { useMemo, useState } from "react";
import type { CountryMeta, SchoolFeature, SchoolProperties } from "@/lib/types";
import type { DailyClimateSeries } from "@/lib/climate";
import {
  computeCountryKpis,
  filterSchools,
  schoolsByRegion,
} from "@/lib/aggregates";
import SchoolMap from "./SchoolMap";
import KpiCards from "./KpiCards";
import { CountryTmaxChart, RegionBarChart } from "./Charts";
import SchoolTable from "./SchoolTable";
import SchoolDetailModal from "./SchoolDetailModal";

interface Props {
  country: CountryMeta;
  mapFeatures: SchoolFeature[];
  allSchools: SchoolProperties[];
  dailySeries: DailyClimateSeries;
}

export default function CountryDashboard({
  country,
  mapFeatures,
  allSchools,
  dailySeries,
}: Props) {
  const [level, setLevel] = useState("todos");
  const [sector, setSector] = useState("todos");
  const [urbanRural, setUrbanRural] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filterSchools(allSchools, {
        level: level === "todos" ? undefined : level,
        sector: sector === "todos" ? undefined : sector,
        urban_rural: urbanRural === "todos" ? undefined : urbanRural,
      }),
    [allSchools, level, sector, urbanRural]
  );

  const kpis = computeCountryKpis(filtered);
  const regionData = schoolsByRegion(filtered);

  const selectedSchool = selectedId
    ? allSchools.find((s) => s.school_id === selectedId) ?? null
    : null;

  const isChile = country.code === "CL";

  const mapBlock = (
    <div className={`panel country-map-panel${isChile ? " country-map-panel--tall" : ""}`}>
      <h3>Mapa de escuelas</h3>
      <SchoolMap
        features={mapFeatures}
        center={country.mapCenter}
        zoom={country.mapZoom}
        onSchoolClick={setSelectedId}
        exportName={country.route}
        variant={isChile ? "tall" : "default"}
      />
    </div>
  );

  const chartsBlock = (
    <>
      <div className="panel">
        <h3>Escuelas por región</h3>
        <RegionBarChart data={regionData} exportName={country.route} />
      </div>
      <div className="panel country-tmax-panel">
        <h3>Evolución Tmax nacional (promedio diario)</h3>
        <CountryTmaxChart
          series={dailySeries}
          label={country.label}
          exportName={country.route}
        />
      </div>
    </>
  );

  return (
    <div className={`container dashboard-grid country-dashboard country-dashboard--${country.slug}`}>
      <h1 style={{ fontFamily: "var(--font-heading)", marginTop: "1.5rem" }}>
        {country.label}
      </h1>

      <div className="filters">
        <label>
          Nivel
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="Inicial">Inicial</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
          </select>
        </label>
        <label>
          Sector
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="Publico">Público</option>
            <option value="Privado">Privado</option>
            <option value="Subvencionado">Subvencionado</option>
          </select>
        </label>
        <label>
          Zona
          <select value={urbanRural} onChange={(e) => setUrbanRural(e.target.value)}>
            <option value="todos">Todas</option>
            <option value="Urbano">Urbano</option>
            <option value="Rural">Rural</option>
          </select>
        </label>
      </div>

      <KpiCards
        items={[
          { label: "Escuelas", value: kpis.count },
          { label: "Tmax promedio", value: `${kpis.avgTmax}°C` },
          { label: "Bienestar promedio", value: kpis.avgWellbeing },
          { label: "Salud promedio", value: kpis.avgHealth },
          { label: "Días calor (avg)", value: kpis.avgHeatDays30 },
        ]}
      />

      {isChile ? (
        <div className="country-explorer-grid">
          <div className="country-charts-stack">{chartsBlock}</div>
          {mapBlock}
        </div>
      ) : (
        <>
          {mapBlock}
          <div className="dashboard-charts">{chartsBlock}</div>
        </>
      )}

      <div className="panel">
        <h3>Tabla de escuelas ({filtered.length})</h3>
        <SchoolTable schools={filtered} onSelect={setSelectedId} exportName={country.route} />
      </div>

      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          countrySlug={country.slug}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

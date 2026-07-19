"use client";

/**
 * Vista principal de exploración por país: mapa, filtros, KPIs, gráficos y tabla.
 * Paso 3–4: todo se alimenta del GeoJSON; DuckDB solo en el modal de detalle.
 */
import { useMemo, useState } from "react";
import type { CountryMeta, SchoolFeature, SchoolProperties } from "@/lib/types";
import {
  computeCountryKpis,
  filterSchools,
  schoolsByRegion,
  syntheticNationalTmaxSeries,
} from "@/lib/aggregates";
import SchoolMap from "./SchoolMap";
import KpiCards from "./KpiCards";
import { RegionBarChart, TmaxLineChart } from "./Charts";
import SchoolTable from "./SchoolTable";
import SchoolDetailModal from "./SchoolDetailModal";

interface Props {
  country: CountryMeta;
  allFeatures: SchoolFeature[];
  allSchools: SchoolProperties[];
}

export default function CountryDashboard({ country, allFeatures, allSchools }: Props) {
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

  const filteredIds = useMemo(() => new Set(filtered.map((s) => s.school_id)), [filtered]);

  const filteredFeatures = useMemo(
    () => allFeatures.filter((f) => filteredIds.has(f.properties.school_id)),
    [allFeatures, filteredIds]
  );

  const kpis = computeCountryKpis(filtered);
  const regionData = schoolsByRegion(filtered);
  const lineData = syntheticNationalTmaxSeries(kpis.avgTmax, country.code);

  const selectedSchool = selectedId
    ? allSchools.find((s) => s.school_id === selectedId) ?? null
    : null;

  return (
    <div className="container dashboard-grid">
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

      <div className="panel">
        <h3>Mapa de escuelas (color = severidad de calor)</h3>
        <SchoolMap
          features={filteredFeatures}
          center={country.mapCenter}
          zoom={country.mapZoom}
          onSchoolClick={setSelectedId}
        />
      </div>

      <div className="dashboard-charts">
        <div className="panel">
          <h3>Escuelas por región</h3>
          <RegionBarChart data={regionData} />
        </div>
        <div className="panel">
          <h3>Evolución Tmax nacional (agregado)</h3>
          <TmaxLineChart data={lineData} />
        </div>
      </div>

      <div className="panel">
        <h3>Tabla de escuelas ({filtered.length})</h3>
        <SchoolTable schools={filtered} onSelect={setSelectedId} />
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

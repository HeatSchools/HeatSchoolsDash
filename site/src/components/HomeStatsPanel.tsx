"use client";

import Link from "next/link";
import type { CountryCode } from "@/lib/types";
import type { GlobalKpis } from "@/lib/aggregates";
import type { DailyClimateSeries } from "@/lib/climate";
import type { PieSlice } from "@/lib/distributions";
import { COUNTRIES } from "@/lib/types";
import { CompactKpiRow } from "./KpiCards";
import { PieChart, DailyTmaxChart } from "./HomeCharts";

export interface CountryPanelData {
  code: CountryCode;
  route: string;
  label: string;
  count: number;
  kpis: {
    count: number;
    avgTmax: number;
    avgWellbeing: number;
    avgHealth: number;
    avgHeatDays30: number;
  };
  distribution: {
    byLevel: PieSlice[];
    bySector: PieSlice[];
    byZone: PieSlice[];
  };
  dailyClimate: DailyClimateSeries;
}

interface Props {
  globalKpis: GlobalKpis;
  dailyByCountry: Record<CountryCode, DailyClimateSeries>;
  globalDistribution: {
    byCountry: PieSlice[];
    byLevel: PieSlice[];
    bySector: PieSlice[];
  };
  countries: CountryPanelData[];
  selected: CountryCode | null;
}

export default function HomeStatsPanel({
  globalKpis,
  dailyByCountry,
  globalDistribution,
  countries,
  selected,
}: Props) {
  const active = selected ? countries.find((c) => c.code === selected) : null;
  const panelKey = active?.code ?? "global";

  return (
    <div className="home-stats-panel">
      <div className="stats-panel-header">
        <span className="stats-eyebrow">{active ? "PAÍS" : "PANORAMA"}</span>
        <h2 className="stats-title">{active ? active.label : "Cifras generales"}</h2>
        {!active && <p className="stats-subtitle">Chile · Colombia · Perú</p>}
      </div>

      <div key={panelKey} className="stats-panel-body">
        <CompactKpiRow
          items={
            active
              ? [
                  { label: "Escuelas", value: active.kpis.count },
                  { label: "Tmax", value: `${active.kpis.avgTmax}°C` },
                  { label: "Bienestar", value: active.kpis.avgWellbeing },
                  { label: "Salud", value: active.kpis.avgHealth },
                  { label: "Días ≥30°C", value: active.kpis.avgHeatDays30 },
                ]
              : [
                  { label: "Escuelas", value: globalKpis.totalSchools },
                  { label: "Tmax", value: `${globalKpis.avgTmax}°C` },
                  { label: "Bienestar", value: globalKpis.avgWellbeing },
                  { label: "Salud", value: globalKpis.avgHealth },
                ]
          }
        />

        <div className="home-chart-grid">
          {active ? (
            <>
              <div className="mini-panel">
                <h4>Por nivel</h4>
                <PieChart data={active.distribution.byLevel} />
              </div>
              <div className="mini-panel">
                <h4>Por sector</h4>
                <PieChart data={active.distribution.bySector} />
              </div>
              <div className="mini-panel">
                <h4>Zona</h4>
                <PieChart data={active.distribution.byZone} />
              </div>
            </>
          ) : (
            <>
              <div className="mini-panel">
                <h4>Por país</h4>
                <PieChart data={globalDistribution.byCountry} />
              </div>
              <div className="mini-panel">
                <h4>Por nivel</h4>
                <PieChart data={globalDistribution.byLevel} />
              </div>
              <div className="mini-panel">
                <h4>Por sector</h4>
                <PieChart data={globalDistribution.bySector} />
              </div>
            </>
          )}
        </div>

        <div className={active ? "climate-row-single" : "climate-row-stack"}>
          {active ? (
            <div className="mini-panel mini-panel-chart">
              <h4>Tmax diaria · {active.label}</h4>
              <DailyTmaxChart series={active.dailyClimate} label={active.label} />
            </div>
          ) : (
            COUNTRIES.map((c) => (
              <div key={c.code} className="mini-panel mini-panel-chart">
                <h4>Tmax diaria · {c.label}</h4>
                <DailyTmaxChart series={dailyByCountry[c.code]} label={c.label} />
              </div>
            ))
          )}
        </div>

        {active && (
          <Link href={`/${active.route}`} className="btn explore-btn">
            Explorar →
          </Link>
        )}

        {!active && (
          <p className="stats-hint">Selecciona un país en el mapa para ver su detalle.</p>
        )}
      </div>
    </div>
  );
}

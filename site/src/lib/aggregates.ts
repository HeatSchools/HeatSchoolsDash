/**
 * Agregaciones sobre GeoJSON para KPIs y gráficos de país.
 * Paso 4: estadísticas pre-calculadas en memoria; evita preagregar todas las
 * combinaciones escuela × comuna en archivos separados.
 */
import type { SchoolProperties } from "./types";

export interface GlobalKpis {
  totalSchools: number;
  avgTmax: number;
  avgWellbeing: number;
  avgHealth: number;
}

export function computeGlobalKpis(schools: SchoolProperties[]): GlobalKpis {
  const n = schools.length || 1;
  return {
    totalSchools: schools.length,
    avgTmax: round1(schools.reduce((s, x) => s + x.tmax_avg_c, 0) / n),
    avgWellbeing: round1(schools.reduce((s, x) => s + x.wellbeing_score, 0) / n),
    avgHealth: round1(schools.reduce((s, x) => s + x.health_index, 0) / n),
  };
}

export function computeCountryKpis(schools: SchoolProperties[]) {
  const n = schools.length || 1;
  return {
    count: schools.length,
    avgTmax: round1(schools.reduce((s, x) => s + x.tmax_avg_c, 0) / n),
    avgWellbeing: round1(schools.reduce((s, x) => s + x.wellbeing_score, 0) / n),
    avgHealth: round1(schools.reduce((s, x) => s + x.health_index, 0) / n),
    avgHeatDays30: round1(schools.reduce((s, x) => s + x.heat_days_30, 0) / n),
  };
}

/** Escuelas agrupadas por región (admin1) para gráfico de barras */
export function schoolsByRegion(schools: SchoolProperties[]): { region: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of schools) {
    map.set(s.admin1, (map.get(s.admin1) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Serie mensual sintética de Tmax nacional (24 meses).
 * Derivada del promedio de escuelas + estacionalidad; no consulta Parquet en vivo.
 * TODO: reemplazar por agregación real del pipeline 04_aggregate.py en producción.
 */
export function syntheticNationalTmaxSeries(baseTmax: number, countryCode: string) {
  const months: { month: string; tmax: number }[] = [];
  const start = new Date(2024, 7, 1);
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const doy = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    const amp = countryCode === "CL" ? 4 : 2.2;
    const phase = ((doy - 15) / 365.25) * 2 * Math.PI;
    const seasonal = amp * Math.cos(phase);
    months.push({
      month: d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
      tmax: round1(baseTmax + seasonal + (i * 0.02)),
    });
  }
  return months;
}

export function filterSchools(
  schools: SchoolProperties[],
  filters: { level?: string; sector?: string; urban_rural?: string }
): SchoolProperties[] {
  return schools.filter((s) => {
    if (filters.level && filters.level !== "todos" && s.level !== filters.level) return false;
    if (filters.sector && filters.sector !== "todos" && s.sector !== filters.sector) return false;
    if (filters.urban_rural && filters.urban_rural !== "todos" && s.urban_rural !== filters.urban_rural)
      return false;
    return true;
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

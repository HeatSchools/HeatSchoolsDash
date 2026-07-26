/**
 * Distribuciones de escuelas para gráficos de torta en la home.
 */
import type { SchoolProperties } from "./types";
import { COUNTRIES } from "./types";

export interface PieSlice {
  label: string;
  value: number;
}

export function countByField(schools: SchoolProperties[], field: keyof SchoolProperties): PieSlice[] {
  const map = new Map<string, number>();
  for (const s of schools) {
    const key = String(s[field]);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function schoolsByCountry(allSchools: SchoolProperties[]): PieSlice[] {
  return COUNTRIES.map((c) => ({
    label: c.label,
    value: allSchools.filter((s) => s.country === c.code).length,
  }));
}

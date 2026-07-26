/**
 * Carga de resúmenes mensuales (solo servidor / build time).
 */
import fs from "fs";
import path from "path";
import type { CountrySlug } from "./types";
import type { MonthlyClimateSeries, DailyClimateSeries } from "./climate";

const SUMMARY_DIR = path.join(process.cwd(), "public", "data", "summary");

export function loadCountryMonthly(slug: CountrySlug): MonthlyClimateSeries {
  const raw = fs.readFileSync(path.join(SUMMARY_DIR, `${slug}_monthly.json`), "utf-8");
  return JSON.parse(raw) as MonthlyClimateSeries;
}

export function loadGlobalMonthly(): MonthlyClimateSeries {
  const raw = fs.readFileSync(path.join(SUMMARY_DIR, "global_monthly.json"), "utf-8");
  return JSON.parse(raw) as MonthlyClimateSeries;
}

export function loadCountryDaily(slug: CountrySlug): DailyClimateSeries {
  const raw = fs.readFileSync(path.join(SUMMARY_DIR, `${slug}_daily.json`), "utf-8");
  return JSON.parse(raw) as DailyClimateSeries;
}

export function loadCountryDailyFull(slug: CountrySlug): DailyClimateSeries {
  const raw = fs.readFileSync(path.join(SUMMARY_DIR, `${slug}_daily_full.json`), "utf-8");
  return JSON.parse(raw) as DailyClimateSeries;
}

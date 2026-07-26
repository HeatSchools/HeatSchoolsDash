/**
 * Estilos base MapLibre según tema del sitio.
 * Claro → Positron (pastel, OpenFreeMap), referencia MapLibreGL Rennes2.
 * Oscuro → Dark / Night (OpenFreeMap).
 */
import type { Theme } from "@/components/ThemeProvider";
import type maplibregl from "maplibre-gl";

export const MAP_STYLE_URLS = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

export function getMapStyleUrl(theme: Theme): string {
  return theme === "dark" ? MAP_STYLE_URLS.dark : MAP_STYLE_URLS.light;
}

/** @deprecated Usar onMapStyleReady de schoolMapLayers.ts */
export function onMapStyleLoad(map: maplibregl.Map, fn: () => void) {
  map.once("style.load", fn);
}

/** Códigos ISO-3166 alpha-3 de los países del proyecto */
export const PROJECT_COUNTRY_ISOS = ["CHL", "COL", "PER"] as const;

export type ProjectCountryIso = (typeof PROJECT_COUNTRY_ISOS)[number];

export const ISO_TO_COUNTRY_CODE: Record<ProjectCountryIso, "CL" | "CO" | "PE"> = {
  CHL: "CL",
  COL: "CO",
  PER: "PE",
};

/** Países de Sudamérica incluidos en el GeoJSON regional */
export const SOUTH_AMERICA_ISOS = [
  "ARG", "BOL", "BRA", "CHL", "COL", "ECU", "GUY", "PER", "PRY", "SUR", "URY", "VEN",
] as const;

export const PROJECT_COUNTRY_COLORS: Record<ProjectCountryIso, string> = {
  CHL: "#e07a5f",
  COL: "#f2a154",
  PER: "#1e4d6b",
};

export const COUNTRY_CODE_TO_ISO: Record<"CL" | "CO" | "PE", ProjectCountryIso> = {
  CL: "CHL",
  CO: "COL",
  PE: "PER",
};

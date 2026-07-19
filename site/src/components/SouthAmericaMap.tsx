"use client";

/**
 * Mapa Sudamérica: Positron/Night, atenuación suave en claro, escuelas con clustering.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "./ThemeProvider";
import ExportToolbar from "./ExportToolbar";
import { downloadCsv, downloadPng, shareLink } from "@/lib/export";
import {
  getMapStyleUrl,
  ISO_TO_COUNTRY_CODE,
  PROJECT_COUNTRY_ISOS,
  type ProjectCountryIso,
} from "@/lib/mapStyles";
import type { CountryCode, SchoolFeature } from "@/lib/types";

const SA_GEOJSON_URL = "/data/regions/south-america.geojson";
const POPUP_FADE_MS = 220;

const CUSTOM_LAYERS = [
  "school-cluster-count",
  "school-points",
  "school-clusters",
  "sa-dim",
] as const;

const CUSTOM_SOURCES = ["schools", "sa-countries"] as const;

export interface CountryMapInfo {
  code: CountryCode;
  iso: ProjectCountryIso;
  label: string;
  count: number;
  avgTmax: number;
  avgWellbeing: number;
  avgHealth: number;
  blurb: string;
}

interface Props {
  countries: CountryMapInfo[];
  schoolFeatures: SchoolFeature[];
  selectedCountry: CountryCode | null;
  onSelectCountry: (code: CountryCode | null) => void;
}

interface InteractionHandlers {
  click?: (e: maplibregl.MapMouseEvent) => void;
  mouseenterDim?: (e: maplibregl.MapLayerMouseEvent) => void;
  mouseleaveDim?: () => void;
  mouseenterClusters?: () => void;
  mouseleaveClusters?: () => void;
  mouseenterPoints?: () => void;
  mouseleavePoints?: () => void;
}

function isoFromCode(code: CountryCode | null): ProjectCountryIso | null {
  if (!code) return null;
  return code === "CL" ? "CHL" : code === "CO" ? "COL" : "PER";
}

function isProjectCountry(iso: string | undefined): iso is ProjectCountryIso {
  return !!iso && iso in ISO_TO_COUNTRY_CODE;
}

/** Atribución mínima: © OpenStreetMap */
class OsmAttributionControl implements maplibregl.IControl {
  onAdd() {
    const el = document.createElement("div");
    el.className = "maplibregl-ctrl map-osm-attrib";
    el.innerHTML = "© OpenStreetMap";
    return el;
  }
  onRemove() {}
}

/** Espera al próximo estilo cargado (nunca ejecutar en caliente tras setStyle). */
function onStyleLoad(map: maplibregl.Map, fn: () => void) {
  map.once("style.load", fn);
}

export default function SouthAmericaMap({
  countries,
  schoolFeatures,
  selectedCountry,
  onSelectCountry,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const geojsonRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const schoolsRef = useRef(schoolFeatures);
  const countriesRef = useRef(countries);
  const selectedRef = useRef(selectedCountry);
  const onSelectRef = useRef(onSelectCountry);
  const focusRef = useRef<ProjectCountryIso | null>(isoFromCode(selectedCountry));
  const themeRef = useRef<"light" | "dark">("light");
  const handlersRef = useRef<InteractionHandlers>({});
  const styleGenerationRef = useRef(0);
  const mapThemeRef = useRef<"light" | "dark" | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { theme, mounted } = useTheme();

  schoolsRef.current = schoolFeatures;
  countriesRef.current = countries;
  selectedRef.current = selectedCountry;
  onSelectRef.current = onSelectCountry;
  focusRef.current = isoFromCode(selectedCountry);
  themeRef.current = theme;

  function dimColor() {
    return "#f7f9fc";
  }

  function clusterStrokeColor() {
    return themeRef.current === "dark" ? "#f0f4f8" : "#ffffff";
  }

  function applyDimming(map: maplibregl.Map, focusIso: ProjectCountryIso | null) {
    if (!map.getLayer("sa-dim")) return;
    if (themeRef.current === "dark") {
      map.setPaintProperty("sa-dim", "fill-opacity", 0);
      return;
    }
    map.setPaintProperty("sa-dim", "fill-color", dimColor());
    map.setPaintProperty("sa-dim", "fill-opacity", [
      "case",
      focusIso === null,
      ["case", ["in", ["get", "iso"], ["literal", [...PROJECT_COUNTRY_ISOS]]], 0, 0.28],
      [
        "case",
        ["==", ["get", "iso"], focusIso],
        0,
        ["in", ["get", "iso"], ["literal", [...PROJECT_COUNTRY_ISOS]]],
        0.1,
        0.32,
      ],
    ]);
  }

  function fadeOutPopup(onDone: () => void) {
    const popup = popupRef.current;
    if (!popup) {
      onDone();
      return;
    }
    const el = popup.getElement()?.querySelector(".maplibregl-popup-content");
    el?.classList.add("sa-popup-leaving");
    window.setTimeout(() => {
      popup.remove();
      if (popupRef.current === popup) popupRef.current = null;
      onDone();
    }, POPUP_FADE_MS);
  }

  function showPopup(map: maplibregl.Map, code: CountryCode, lngLat: maplibregl.LngLatLike) {
    const info = countriesRef.current.find((c) => c.code === code);
    if (!info) return;

    fadeOutPopup(() => {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: "280px",
        className: "sa-map-popup",
        offset: 12,
      })
        .setLngLat(lngLat)
        .setHTML(`
          <div class="map-popup">
            <strong>${info.label}</strong>
            <p>${info.blurb}</p>
            <ul>
              <li><span>Escuelas</span><b>${info.count}</b></li>
              <li><span>Tmax prom.</span><b>${info.avgTmax}°C</b></li>
              <li><span>Bienestar</span><b>${info.avgWellbeing}</b></li>
              <li><span>Salud</span><b>${info.avgHealth}</b></li>
            </ul>
          </div>`)
        .addTo(map);
    });
  }

  function selectCountry(map: maplibregl.Map, code: CountryCode | null, lngLat?: maplibregl.LngLatLike) {
    onSelectRef.current(code);
    focusRef.current = isoFromCode(code);
    applyDimming(map, focusRef.current);

    if (code && lngLat) {
      showPopup(map, code, lngLat);
    } else {
      fadeOutPopup(() => undefined);
    }
  }

  function schoolsGeoJSON(): GeoJSON.FeatureCollection {
    return {
      type: "FeatureCollection",
      features: schoolsRef.current.map((f) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: { ...f.properties },
      })),
    };
  }

  function removeCustomContent(map: maplibregl.Map) {
    for (const layerId of CUSTOM_LAYERS) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
    for (const sourceId of CUSTOM_SOURCES) {
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }

  function installCustomContent(map: maplibregl.Map) {
    if (!geojsonRef.current) return;

    removeCustomContent(map);

    map.addSource("sa-countries", { type: "geojson", data: geojsonRef.current });
    map.addLayer({
      id: "sa-dim",
      type: "fill",
      source: "sa-countries",
      paint: { "fill-color": dimColor(), "fill-opacity": 0 },
    });

    map.addSource("schools", {
      type: "geojson",
      data: schoolsGeoJSON(),
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 55,
    });

    const clusterStroke = clusterStrokeColor();

    map.addLayer({
      id: "school-clusters",
      type: "circle",
      source: "schools",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#c05621",
        "circle-radius": ["step", ["get", "point_count"], 16, 20, 22, 50, 28, 100, 34],
        "circle-stroke-width": 2,
        "circle-stroke-color": clusterStroke,
        "circle-opacity": 0.92,
      },
    });

    map.addLayer({
      id: "school-cluster-count",
      type: "symbol",
      source: "schools",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
        "text-font": ["Noto Sans Regular"],
      },
      paint: { "text-color": "#ffffff" },
    });

    map.addLayer({
      id: "school-points",
      type: "circle",
      source: "schools",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#e07a5f",
        "circle-radius": 4,
        "circle-stroke-width": 1,
        "circle-stroke-color": clusterStroke,
      },
    });

    applyDimming(map, focusRef.current);
  }

  function unbindInteractions(map: maplibregl.Map) {
    const h = handlersRef.current;
    if (h.click) map.off("click", h.click);
    if (h.mouseenterDim) map.off("mouseenter", "sa-dim", h.mouseenterDim);
    if (h.mouseleaveDim) map.off("mouseleave", "sa-dim", h.mouseleaveDim);
    if (h.mouseenterClusters) map.off("mouseenter", "school-clusters", h.mouseenterClusters);
    if (h.mouseleaveClusters) map.off("mouseleave", "school-clusters", h.mouseleaveClusters);
    if (h.mouseenterPoints) map.off("mouseenter", "school-points", h.mouseenterPoints);
    if (h.mouseleavePoints) map.off("mouseleave", "school-points", h.mouseleavePoints);
    handlersRef.current = {};
  }

  function bindInteractions(map: maplibregl.Map) {
    unbindInteractions(map);

    const onMapClick = async (e: maplibregl.MapMouseEvent) => {
      const clusterFeats = map.queryRenderedFeatures(e.point, { layers: ["school-clusters"] });
      if (clusterFeats[0]) {
        const clusterId = clusterFeats[0].properties?.cluster_id;
        const source = map.getSource("schools") as maplibregl.GeoJSONSource;
        const count = clusterFeats[0].properties?.point_count;
        if (clusterId !== undefined && count && count > 1) {
          const z = await source.getClusterExpansionZoom(clusterId);
          const coords = (clusterFeats[0].geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center: coords, zoom: z });
          return;
        }
        const country = clusterFeats[0].properties?.country as string | undefined;
        if (country && ["CL", "CO", "PE"].includes(country)) {
          const code = country as CountryCode;
          const toggled = selectedRef.current === code ? null : code;
          selectCountry(map, toggled, toggled ? e.lngLat : undefined);
          return;
        }
      }

      const pointFeats = map.queryRenderedFeatures(e.point, { layers: ["school-points"] });
      const pointCountry = pointFeats[0]?.properties?.country as string | undefined;
      if (pointCountry && ["CL", "CO", "PE"].includes(pointCountry)) {
        const code = pointCountry as CountryCode;
        const toggled = selectedRef.current === code ? null : code;
        selectCountry(map, toggled, toggled ? e.lngLat : undefined);
        return;
      }

      const dimFeats = map.queryRenderedFeatures(e.point, { layers: ["sa-dim"] });
      const iso = dimFeats[0]?.properties?.iso as string | undefined;
      if (isProjectCountry(iso)) {
        const code = ISO_TO_COUNTRY_CODE[iso];
        const toggled = selectedRef.current === code ? null : code;
        selectCountry(map, toggled, toggled ? e.lngLat : undefined);
        return;
      }

      if (selectedRef.current) selectCountry(map, null);
    };

    const mouseenterDim = (e: maplibregl.MapLayerMouseEvent) => {
      const iso = e.features?.[0]?.properties?.iso;
      if (iso && PROJECT_COUNTRY_ISOS.includes(iso as ProjectCountryIso)) {
        map.getCanvas().style.cursor = "pointer";
        if (!selectedRef.current && themeRef.current === "light") {
          applyDimming(map, iso as ProjectCountryIso);
        }
      }
    };

    const mouseleaveDim = () => {
      map.getCanvas().style.cursor = "default";
      applyDimming(map, focusRef.current);
    };

    const mouseenterClusters = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const mouseleaveClusters = () => {
      map.getCanvas().style.cursor = "default";
    };
    const mouseenterPoints = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const mouseleavePoints = () => {
      map.getCanvas().style.cursor = "default";
    };

    handlersRef.current = {
      click: onMapClick,
      mouseenterDim,
      mouseleaveDim,
      mouseenterClusters,
      mouseleaveClusters,
      mouseenterPoints,
      mouseleavePoints,
    };

    map.on("click", onMapClick);
    map.on("mouseenter", "sa-dim", mouseenterDim);
    map.on("mouseleave", "sa-dim", mouseleaveDim);
    map.on("mouseenter", "school-clusters", mouseenterClusters);
    map.on("mouseleave", "school-clusters", mouseleaveClusters);
    map.on("mouseenter", "school-points", mouseenterPoints);
    map.on("mouseleave", "school-points", mouseleavePoints);
  }

  function restoreMapState(map: maplibregl.Map) {
    installCustomContent(map);
    bindInteractions(map);

    if (selectedRef.current) {
      const info = countriesRef.current.find((c) => c.code === selectedRef.current);
      if (info) {
        const meta = COUNTRY_CENTERS[selectedRef.current];
        showPopup(map, selectedRef.current, meta);
      }
    } else {
      fadeOutPopup(() => undefined);
    }
  }

  const exportMapPng = useCallback(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    downloadPng("mapa-sudamerica.png", canvas.toDataURL("image/png"));
  }, []);

  const exportMapCsv = useCallback(() => {
    downloadCsv(
      "escuelas-mapa.csv",
      ["school_id", "country", "lon", "lat"],
      schoolsRef.current.map((f) => [
        f.properties.school_id,
        f.properties.country,
        f.geometry.coordinates[0],
        f.geometry.coordinates[1],
      ])
    );
  }, []);

  const exportMapShare = useCallback(() => {
    void shareLink("Mapa HeatSchools", "Mapa de escuelas en Chile, Colombia y Perú.");
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    let cancelled = false;

    fetch(SA_GEOJSON_URL)
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (cancelled || !containerRef.current) return;
        geojsonRef.current = data;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: getMapStyleUrl(themeRef.current),
          center: [-63.5, -22],
          zoom: 2.95,
          minZoom: 2.4,
          maxZoom: 10,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new OsmAttributionControl(), "bottom-right");

        map.on("load", () => {
          restoreMapState(map);
          setMapReady(true);
        });

        mapRef.current = map;
      });

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      const map = mapRef.current;
      if (map) unbindInteractions(map);
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
      mapThemeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    themeRef.current = theme;
    if (mapThemeRef.current === theme) return;

    mapThemeRef.current = theme;
    const generation = ++styleGenerationRef.current;

    map.setStyle(getMapStyleUrl(theme), { diff: false });
    onStyleLoad(map, () => {
      if (generation !== styleGenerationRef.current) return;
      restoreMapState(map);
    });
  }, [theme, mounted, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getSource("schools")) return;

    focusRef.current = isoFromCode(selectedCountry);
    applyDimming(map, focusRef.current);

    if (!selectedCountry) {
      fadeOutPopup(() => undefined);
    }
  }, [selectedCountry, theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource("schools") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(schoolsGeoJSON());
  }, [schoolFeatures]);

  return (
    <div className="home-map-wrap">
      <div className="map-panel-top">
        <p className="panel-hint">
          <span className="hint-cursor" aria-hidden="true">↖</span>
          Haz clic en Chile, Colombia o Perú
        </p>
        <ExportToolbar onShare={exportMapShare} onPng={exportMapPng} onCsv={exportMapCsv} />
      </div>
      <div ref={containerRef} className="map-container home-sa-map pastel-map" />
    </div>
  );
}

/** Centros aproximados para reubicar el popup tras cambio de estilo. */
const COUNTRY_CENTERS: Record<CountryCode, [number, number]> = {
  CL: [-71, -35],
  CO: [-74, 4.5],
  PE: [-75, -10],
};

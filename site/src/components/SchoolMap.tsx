"use client";

/**
 * Mapa MapLibre por país — mismo contenido que la home (heatmap + escuelas).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SchoolFeature } from "@/lib/types";
import { getMapStyleUrl } from "@/lib/mapStyles";
import { downloadCsv, downloadPng, shareLink } from "@/lib/export";
import {
  applyTempGridToSchoolMap,
  installSchoolMapContent,
  onMapStyleReady,
} from "@/lib/schoolMapLayers";
import { DEFAULT_TEMP_SCENARIO, fetchTempGrid, type TempScenarioId } from "@/lib/tempGrid";
import { useTheme } from "./ThemeProvider";
import TempScenarioFilter from "./TempScenarioFilter";
import ExportToolbar from "./ExportToolbar";

const POPUP_FADE_MS = 220;

interface Props {
  features: SchoolFeature[];
  center: [number, number];
  zoom: number;
  onSchoolClick: (schoolId: string) => void;
  exportName?: string;
  variant?: "default" | "tall";
}

function buildGeoJSON(features: SchoolFeature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: { ...f.properties },
    })),
  };
}

export default function SchoolMap({
  features,
  center,
  zoom,
  onSchoolClick,
  exportName = "escuelas",
  variant = "default",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const geojsonRef = useRef(buildGeoJSON(features));
  const onClickRef = useRef(onSchoolClick);
  const tempGridDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const themeRef = useRef<"light" | "dark">("light");
  const mapThemeRef = useRef<"light" | "dark" | null>(null);
  const styleGenerationRef = useRef(0);
  const handlersRef = useRef<{
    clickPoints?: (e: maplibregl.MapLayerMouseEvent) => void;
    clickClusters?: (e: maplibregl.MapLayerMouseEvent) => void;
    clickMap?: (e: maplibregl.MapMouseEvent) => void;
    mouseenterPoints?: () => void;
    mouseleavePoints?: () => void;
    mouseenterClusters?: () => void;
    mouseleaveClusters?: () => void;
  }>({});
  const [mapReady, setMapReady] = useState(false);
  const [tempScenario, setTempScenario] = useState<TempScenarioId>(DEFAULT_TEMP_SCENARIO);
  const { theme, mounted } = useTheme();

  onClickRef.current = onSchoolClick;
  themeRef.current = theme;
  geojsonRef.current = buildGeoJSON(features);
  const featuresRef = useRef(features);
  featuresRef.current = features;

  const exportMapPng = useCallback(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    downloadPng(`mapa-${exportName}.png`, canvas.toDataURL("image/png"));
  }, [exportName]);

  const exportMapCsv = useCallback(() => {
    downloadCsv(
      `escuelas-${exportName}.csv`,
      ["school_id", "country", "lon", "lat", "tmax_avg_c"],
      featuresRef.current.map((f) => [
        f.properties.school_id,
        f.properties.country,
        f.geometry.coordinates[0],
        f.geometry.coordinates[1],
        f.properties.tmax_avg_c,
      ])
    );
  }, [exportName]);

  const exportMapShare = useCallback(() => {
    void shareLink(`Mapa HeatSchools · ${exportName}`, "Mapa de escuelas con capa de temperatura.");
  }, [exportName]);

  function restoreMapState(map: maplibregl.Map) {
    installSchoolMapContent(map, {
      schools: geojsonRef.current,
      theme: themeRef.current,
      tempGrid: tempGridDataRef.current,
    });
    bindSchoolInteractions(map);
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

  function showSchoolPopup(
    map: maplibregl.Map,
    props: Record<string, unknown>,
    lngLat: maplibregl.LngLatLike
  ) {
    const name = String(props.school_name ?? "Escuela");
    const admin1 = String(props.admin1 ?? "—");
    const level = String(props.level ?? "—");
    const tmax = Number(props.tmax_avg_c ?? 0);
    const wellbeing = Number(props.wellbeing_score ?? 0);
    const health = Number(props.health_index ?? 0);
    const enrollment = Number(props.enrollment ?? 0);
    const schoolId = String(props.school_id ?? "");

    fadeOutPopup(() => {
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: "280px",
        className: "sa-map-popup",
        offset: 12,
      })
        .setLngLat(lngLat)
        .setHTML(`
          <div class="map-popup">
            <strong>${name}</strong>
            <p>${admin1} · ${level}</p>
            <ul>
              <li><span>Tmax prom.</span><b>${tmax.toFixed(1)}°C</b></li>
              <li><span>Bienestar</span><b>${wellbeing.toFixed(1)}</b></li>
              <li><span>Salud</span><b>${health.toFixed(1)}</b></li>
              <li><span>Matrícula</span><b>${enrollment.toLocaleString("es")}</b></li>
            </ul>
            <button type="button" class="map-popup-action" data-school-id="${schoolId}">Ver ficha completa</button>
          </div>`)
        .addTo(map);

      popupRef.current = popup;

      popup.getElement()?.querySelector(".map-popup-action")?.addEventListener("click", () => {
        if (schoolId) onClickRef.current(schoolId);
      });
    });
  }

  function unbindSchoolInteractions(map: maplibregl.Map) {
    const h = handlersRef.current;
    if (h.clickPoints) map.off("click", "school-points", h.clickPoints);
    if (h.clickClusters) map.off("click", "school-clusters", h.clickClusters);
    if (h.clickMap) map.off("click", h.clickMap);
    if (h.mouseenterPoints) map.off("mouseenter", "school-points", h.mouseenterPoints);
    if (h.mouseleavePoints) map.off("mouseleave", "school-points", h.mouseleavePoints);
    if (h.mouseenterClusters) map.off("mouseenter", "school-clusters", h.mouseenterClusters);
    if (h.mouseleaveClusters) map.off("mouseleave", "school-clusters", h.mouseleaveClusters);
    handlersRef.current = {};
  }

  function bindSchoolInteractions(map: maplibregl.Map) {
    unbindSchoolInteractions(map);

    const clickPoints = (e: maplibregl.MapLayerMouseEvent) => {
      const feat = e.features?.[0];
      if (feat?.properties) {
        showSchoolPopup(map, feat.properties, e.lngLat);
      }
    };

    const clickClusters = async (e: maplibregl.MapLayerMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ["school-clusters"] });
      const clusterId = feats[0]?.properties?.cluster_id;
      const source = map.getSource("schools") as maplibregl.GeoJSONSource;
      if (clusterId !== undefined && feats[0]) {
        const z = await source.getClusterExpansionZoom(clusterId);
        const coords = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coords, zoom: z });
      }
    };

    const clickMap = (e: maplibregl.MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point, {
        layers: ["school-points", "school-clusters"],
      });
      if (!hits.length) fadeOutPopup(() => undefined);
    };

    const mouseenterPoints = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const mouseleavePoints = () => {
      map.getCanvas().style.cursor = "default";
    };
    const mouseenterClusters = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const mouseleaveClusters = () => {
      map.getCanvas().style.cursor = "default";
    };

    map.on("click", "school-points", clickPoints);
    map.on("click", "school-clusters", clickClusters);
    map.on("click", clickMap);
    map.on("mouseenter", "school-points", mouseenterPoints);
    map.on("mouseleave", "school-points", mouseleavePoints);
    map.on("mouseenter", "school-clusters", mouseenterClusters);
    map.on("mouseleave", "school-clusters", mouseleaveClusters);

    handlersRef.current = {
      clickPoints,
      clickClusters,
      clickMap,
      mouseenterPoints,
      mouseleavePoints,
      mouseenterClusters,
      mouseleaveClusters,
    };
  }

  // Precargar grilla (no esperar al mapa)
  useEffect(() => {
    let cancelled = false;
    fetchTempGrid(tempScenario)
      .then((data) => {
        if (cancelled) return;
        tempGridDataRef.current = data;
        const map = mapRef.current;
        if (map?.isStyleLoaded() && map.getSource("schools")) {
          applyTempGridToSchoolMap(map, data);
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [tempScenario]);

  // Crear mapa
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(themeRef.current),
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      restoreMapState(map);
      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      unbindSchoolInteractions(map);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      mapThemeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Pastel ↔ Night — mismo flujo que SouthAmericaMap
  useEffect(() => {
    if (!mounted || !mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    themeRef.current = theme;
    if (mapThemeRef.current === theme) return;

    mapThemeRef.current = theme;
    const generation = ++styleGenerationRef.current;

    map.setStyle(getMapStyleUrl(theme), { diff: false });
    onMapStyleReady(map, () => {
      if (generation !== styleGenerationRef.current) return;
      restoreMapState(map);
    });
  }, [theme, mounted, mapReady]);

  // Aplicar grilla cuando el mapa queda listo (p. ej. fetch terminó antes)
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map?.isStyleLoaded() || !tempGridDataRef.current) return;
    if (!map.getSource("schools")) return;
    applyTempGridToSchoolMap(map, tempGridDataRef.current);
  }, [mapReady, tempScenario]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("schools") as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildGeoJSON(features));
  }, [features]);

  useEffect(() => {
    mapRef.current?.easeTo({ center, zoom, duration: 800 });
  }, [center, zoom]);

  return (
    <div className={`map-with-temp${variant === "tall" ? " map-with-temp--tall" : ""}`}>
      <TempScenarioFilter value={tempScenario} onChange={setTempScenario} />
      <div className="map-panel-top map-panel-top--export-only">
        <ExportToolbar onShare={exportMapShare} onPng={exportMapPng} onCsv={exportMapCsv} />
      </div>
      <div
        ref={containerRef}
        className={`map-container pastel-map${variant === "tall" ? " country-map-tall" : ""}`}
      />
    </div>
  );
}

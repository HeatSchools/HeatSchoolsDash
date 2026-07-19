"use client";

/**
 * Mapa MapLibre con puntos coloreados por severidad de calor (tmax_avg_c).
 * Estilo base: Pastel (claro) / Night (oscuro), sincronizado con el tema del sitio.
 */
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SchoolFeature } from "@/lib/types";
import { getMapStyleUrl } from "@/lib/mapStyles";
import { useTheme } from "./ThemeProvider";

interface Props {
  features: SchoolFeature[];
  center: [number, number];
  zoom: number;
  onSchoolClick: (schoolId: string) => void;
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

export default function SchoolMap({ features, center, zoom, onSchoolClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const geojsonRef = useRef(buildGeoJSON(features));
  const onClickRef = useRef(onSchoolClick);
  const { theme, mounted } = useTheme();
  const prevTheme = useRef<typeof theme | null>(null);
  onClickRef.current = onSchoolClick;

  geojsonRef.current = buildGeoJSON(features);

  function addSchoolLayers(map: maplibregl.Map) {
    const geojson = geojsonRef.current;
    const labelColor = theme === "dark" ? "#f0f4f8" : "#1a1a2e";

    if (map.getSource("schools")) {
      (map.getSource("schools") as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource("schools", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });
    }

    if (!map.getLayer("clusters")) {
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "schools",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#fde68a",
            20,
            "#f2a154",
            50,
            "#e07a5f",
          ],
          "circle-radius": ["step", ["get", "point_count"], 18, 20, 24, 50, 30],
          "circle-stroke-width": 2,
          "circle-stroke-color": theme === "dark" ? "#1e2a3a" : "#fff",
        },
      });
    }

    if (!map.getLayer("cluster-count")) {
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "schools",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: { "text-color": labelColor },
      });
    }

    if (!map.getLayer("school-points")) {
      map.addLayer({
        id: "school-points",
        type: "circle",
        source: "schools",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "tmax_avg_c"],
            16,
            "#fde68a",
            22,
            "#f2a154",
            28,
            "#e07a5f",
            34,
            "#c0392b",
          ],
          "circle-radius": 7,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": theme === "dark" ? "#1e2a3a" : "#fff",
        },
      });
    } else if (map.getLayer("school-points")) {
      map.setPaintProperty(
        "school-points",
        "circle-stroke-color",
        theme === "dark" ? "#1e2a3a" : "#fff"
      );
    }
  }

  function bindSchoolInteractions(map: maplibregl.Map) {
    map.on("click", "school-points", (e) => {
      const feat = e.features?.[0];
      if (feat?.properties?.school_id) {
        onClickRef.current(String(feat.properties.school_id));
      }
    });

    map.on("click", "clusters", async (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
      const clusterId = feats[0]?.properties?.cluster_id;
      const source = map.getSource("schools") as maplibregl.GeoJSONSource;
      if (clusterId !== undefined && feats[0]) {
        const z = await source.getClusterExpansionZoom(clusterId);
        const coords = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coords, zoom: z });
      }
    });

    map.on("mouseenter", "school-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "school-points", () => {
      map.getCanvas().style.cursor = "default";
    });
  }

  // Crear mapa (esperar hidratación del tema para usar Pastel/Night correcto)
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(theme),
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      addSchoolLayers(map);
      bindSchoolInteractions(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Pastel ↔ Night
  useEffect(() => {
    if (!mounted) return;
    const map = mapRef.current;
    if (!map) return;
    if (prevTheme.current === null) {
      prevTheme.current = theme;
      return;
    }
    if (prevTheme.current === theme) return;
    prevTheme.current = theme;

    map.setStyle(getMapStyleUrl(theme));
    map.once("load", () => {
      addSchoolLayers(map);
      bindSchoolInteractions(map);
    });
  }, [theme, mounted]);

  // Actualizar puntos al filtrar
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("schools") as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildGeoJSON(features));
  }, [features]);

  // Recentrar si cambia el país
  useEffect(() => {
    mapRef.current?.easeTo({ center, zoom, duration: 800 });
  }, [center, zoom]);

  return <div ref={containerRef} className="map-container" />;
}

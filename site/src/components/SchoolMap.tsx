"use client";

/**
 * Mapa MapLibre con puntos coloreados por severidad de calor (tmax_avg_c).
 * Paso 4: clustering activado para escalar a miles de escuelas en producción.
 * TODO: evaluar PMTiles o tiles vectoriales si el número de puntos supera decenas de miles.
 */
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SchoolFeature } from "@/lib/types";

interface Props {
  features: SchoolFeature[];
  center: [number, number];
  zoom: number;
  onSchoolClick: (schoolId: string) => void;
}

export default function SchoolMap({ features, center, zoom, onSchoolClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onClickRef = useRef(onSchoolClick);
  onClickRef.current = onSchoolClick;

  useEffect(() => {
    if (!containerRef.current) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: features.map((f) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: { ...f.properties },
      })),
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("schools", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });

      // Clusters
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
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "schools",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: { "text-color": "#1a1a2e" },
      });

      // Puntos individuales coloreados por tmax_avg_c (ámbar → rojo)
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
          "circle-stroke-color": "#fff",
        },
      });

      map.on("click", "school-points", (e) => {
        const feat = e.features?.[0];
        if (feat?.properties?.school_id) {
          onClickRef.current(String(feat.properties.school_id));
        }
      });

      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("schools") as maplibregl.GeoJSONSource;
        if (clusterId !== undefined && features[0]) {
          const z = await source.getClusterExpansionZoom(clusterId);
          const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center: coords, zoom: z });
        }
      });

      map.getCanvas().style.cursor = "default";
      map.on("mouseenter", "school-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "school-points", () => {
        map.getCanvas().style.cursor = "default";
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [features, center, zoom]);

  return <div ref={containerRef} className="map-container" />;
}

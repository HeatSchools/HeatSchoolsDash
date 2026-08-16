import type maplibregl from "maplibre-gl";

export function clusterStrokeForTheme(theme: "light" | "dark"): string {
  return theme === "dark" ? "#f0f4f8" : "#ffffff";
}

/** Espera a que el estilo esté listo tras setStyle (style.load + idle como respaldo). */
export function onMapStyleReady(map: maplibregl.Map, fn: () => void) {
  let done = false;
  const run = () => {
    if (done || !map.isStyleLoaded()) return;
    done = true;
    map.off("style.load", run);
    map.off("idle", run);
    fn();
  };
  map.once("style.load", run);
  map.once("idle", run);
}

export function removeSchoolMapContent(map: maplibregl.Map) {
  for (const layerId of ["school-cluster-count", "school-points", "school-clusters"] as const) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  if (map.getSource("schools")) map.removeSource("schools");
}

function findMapLabelAnchor(map: maplibregl.Map): string | undefined {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  return style.layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;
}

/** Capas de escuelas con clustering. */
export function installSchoolMapContent(
  map: maplibregl.Map,
  options: {
    schools: GeoJSON.FeatureCollection;
    theme: "light" | "dark";
  }
) {
  removeSchoolMapContent(map);

  const beforeLabels = findMapLabelAnchor(map);
  const clusterStroke = clusterStrokeForTheme(options.theme);

  map.addSource("schools", {
    type: "geojson",
    data: options.schools,
    cluster: true,
    clusterMaxZoom: 8,
    clusterRadius: 55,
  });

  map.addLayer(
    {
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
    },
    beforeLabels
  );

  map.addLayer(
    {
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
    },
    beforeLabels
  );

  map.addLayer(
    {
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
    },
    beforeLabels
  );
}

"""
Grilla simulada de temperatura (Tmax anual media, °C) cada ~25 km sobre
Sudamérica (solo celdas en tierra). Cuatro escenarios con calentamiento progresivo.

Modelo: campo espacial continuo (gradientes + regiones) + ruido multi-escala + jitter aleatorio.

Salida: site/public/data/temp-grid/<escenario>.geojson.gz + manifest.json
"""
from __future__ import annotations

import gzip
import json
import math
from pathlib import Path

import numpy as np
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep

REPO_ROOT = Path(__file__).resolve().parents[1]
SA_GEOJSON = REPO_ROOT / "site" / "public" / "data" / "regions" / "south-america.geojson"
OUT_DIR = REPO_ROOT / "site" / "public" / "data" / "temp-grid"

KM_PER_DEG_LAT = 111.32
GRID_KM = 25
T_MIN = 12.0  # mínimo visible en la escala del heatmap (°C)
T_MAX = 42.0

SCENARIOS = {
    "2000-2025": {
        "label": "2000–2025 (histórico)",
        "warming_c": 0.0,
        "default": True,
    },
    "2025-2050": {
        "label": "2025–2050",
        "warming_c": 1.05,
    },
    "2050-2075": {
        "label": "2050–2075",
        "warming_c": 2.15,
    },
    "2075-2100": {
        "label": "2075–2100",
        "warming_c": 3.45,
    },
}


def load_sa_land():
    with open(SA_GEOJSON, encoding="utf-8") as f:
        collection = json.load(f)
    geoms = [shape(feat["geometry"]) for feat in collection["features"]]
    land = unary_union(geoms)
    return prep(land), land.bounds


def km_to_deg_lat(km: float) -> float:
    return km / KM_PER_DEG_LAT


def km_to_deg_lon(km: float, lat_deg: float) -> float:
    cos_lat = max(math.cos(math.radians(lat_deg)), 0.15)
    return km / (KM_PER_DEG_LAT * cos_lat)


def gaussian(lat: float, lon: float, clat: float, clon: float, lat_w: float, lon_w: float) -> float:
    return math.exp(-(((lat - clat) ** 2) / lat_w + ((lon - clon) ** 2) / lon_w))


def hash_noise(lat: float, lon: float, seed: float = 0.0) -> float:
    x = math.sin(lat * 12.9898 + lon * 78.233 + seed) * 43758.5453
    return (x - math.floor(x) - 0.5) * 2.0


def andes_ridge(lat: float, lon: float) -> float:
    """Intensidad orográfica 0–1 a lo largo de la cordillera."""
    central = gaussian(lat, lon, -16.0, -69.0, 240.0, 18.0)
    norte = gaussian(lat, lon, 2.0, -77.0, 85.0, 24.0)
    sur = gaussian(lat, lon, -42.0, -72.0, 70.0, 26.0)
    return min(1.0, central + 0.85 * norte + 0.65 * sur)


def spatial_base_field(lat: float, lon: float) -> float:
    """Campo Tmax de gran escala — continuo en todo el continente."""

    # Columna latitudinal suave (ecuador cálido → sur más frío)
    t = 30.5 - 0.42 * abs(lat + 3.0) ** 1.08
    if lat < -38.0:
        t -= 0.14 * (-lat - 38.0)

    # Amazonia y Guayana
    t += 5.0 * gaussian(lat, lon, -3.0, -58.0, 135.0, 290.0)
    t += 2.2 * gaussian(lat, lon, 5.0, -62.0, 48.0, 115.0)

    # Llanos / Orinoquía
    t += 2.8 * gaussian(lat, lon, 7.0, -68.0, 38.0, 95.0)

    # Interior tropical / Cerrado brasileño
    t += 3.2 * gaussian(lat, lon, -12.0, -48.0, 105.0, 195.0)

    # Chaco y Gran Chaco
    t += 2.2 * gaussian(lat, lon, -22.0, -62.0, 58.0, 75.0)

    # Enfriamiento andino (atenuado hacia el sur)
    ridge = andes_ridge(lat, lon)
    lee = 0.35 if lon < -69.5 and lat < -18.0 else 1.0
    atacama = gaussian(lat, lon, -24.0, -69.0, 40.0, 30.0)
    orographic = ridge * (0.25 if atacama > 0.35 else lee)
    oro_scale = 1.0 if lat > -28.0 else 0.75 if lat > -40.0 else 0.45
    t -= 9.0 * orographic * oro_scale

    # Altiplano
    t -= 3.5 * gaussian(lat, lon, -17.0, -67.5, 30.0, 42.0)

    # Corriente de Humboldt (franja costera pacífica)
    if lon < -71.0:
        t -= 2.8 * gaussian(lat, lon, -14.0, -75.5, 175.0, 11.0)

    # Desierto de Atacama
    t += 3.8 * gaussian(lat, lon, -24.0, -69.0, 36.0, 26.0)

    # Valle central, sur de Chile y Patagonia occidental
    t += 2.4 * gaussian(lat, lon, -33.0, -71.0, 32.0, 24.0)
    t += 2.6 * gaussian(lat, lon, -40.0, -73.0, 38.0, 28.0)
    t += 2.2 * gaussian(lat, lon, -48.0, -74.0, 35.0, 30.0)

    # Pampas, Patagonia oriental y llanura del Plata
    t += 2.0 * gaussian(lat, lon, -34.0, -60.0, 32.0, 58.0)
    t += 2.4 * gaussian(lat, lon, -44.0, -66.0, 48.0, 60.0)

    # Meseta patagónica: enfriamiento leve (sin corte abrupto)
    t -= 0.9 * gaussian(lat, lon, -50.0, -72.0, 48.0, 62.0)

    # Moderación costa atlántica
    t -= 1.4 * gaussian(lat, lon, -32.0, -52.0, 58.0, 38.0)

    # Sur de Chile, Patagonia y extremo austral: piso térmico suave (evita recorte masivo a 12 °C)
    if lat < -36.0:
        t += 6.0 - 0.07 * (-lat - 36.0)

    return t


def spatial_noise(lat: float, lon: float) -> float:
    """Componente espacial correlacionado (~±3.5 °C)."""
    return (
        1.8 * math.sin(lat * 0.58 + lon * 0.34 + 0.9)
        + 1.3 * math.sin(lat * 1.35 - lon * 0.92 + 2.1)
        + 0.95 * math.sin(lat * 2.6 + lon * 1.85 - 0.5)
        + 1.0 * hash_noise(lat, lon, 1.3)
        + 0.75 * hash_noise(lat * 2.2, lon * 1.9, 5.7)
        + 0.55 * hash_noise(lat * 4.8, lon * 3.6, 11.4)
    )


def cell_random_offset(lon: float, lat: float) -> float:
    """Jitter aleatorio por celda (~±3 °C), reproducible."""
    seed = int(abs(math.sin(lat * 991.73 + lon * 131.51) * 1_000_000_987)) % (2**32)
    rng = np.random.default_rng(seed)
    return float(rng.normal(0.0, 1.4) + rng.uniform(-1.2, 1.2))


def scenario_adjustment(lat: float, lon: float, warming: float) -> float:
    """Calentamiento desigual según escenario."""
    if warming <= 0:
        return 0.0
    interior = 1.0 + 0.25 * min(1.0, abs(lon + 58.0) / 20.0)
    tropical = 1.0 + 0.2 * max(0.0, (14.0 - abs(lat)) / 14.0)
    return warming * interior * tropical


def simulate_tmax(lat: float, lon: float, warming: float) -> float:
    t = (
        spatial_base_field(lat, lon)
        + spatial_noise(lat, lon)
        + cell_random_offset(lon, lat)
        + scenario_adjustment(lat, lon, warming)
    )
    return float(np.clip(t, T_MIN, T_MAX))


def iter_grid_cells(bounds, land_checker):
    minx, miny, maxx, maxy = bounds
    step_lat = km_to_deg_lat(GRID_KM)
    lat = miny + step_lat * 0.5
    while lat <= maxy:
        step_lon = km_to_deg_lon(GRID_KM, lat)
        lon = minx + step_lon * 0.5
        while lon <= maxx:
            if land_checker.contains(Point(lon, lat)):
                yield round(lon, 2), round(lat, 2)
            lon += step_lon
        lat += step_lat


def build_features(warming: float) -> list[dict]:
    land_checker, bounds = load_sa_land()
    features: list[dict] = []
    for lon, lat in iter_grid_cells(bounds, land_checker):
        t = round(simulate_tmax(lat, lon, warming), 1)
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {"t": t},
            }
        )
    return features


def write_geojson_gz(path: Path, features: list[dict]) -> None:
    collection = {"type": "FeatureCollection", "features": features}
    payload = json.dumps(collection, ensure_ascii=False, separators=(",", ":"))
    with gzip.open(path, "wb", compresslevel=9) as f:
        f.write(payload.encode("utf-8"))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summary: dict = {"grid_km": GRID_KM, "format": "geojson.gz", "t_range": [T_MIN, T_MAX], "scenarios": {}}

    for scenario_id, meta in SCENARIOS.items():
        print(f"Generando {scenario_id} …")
        features = build_features(meta["warming_c"])
        out_path = OUT_DIR / f"{scenario_id}.geojson.gz"
        write_geojson_gz(out_path, features)
        size_mb = out_path.stat().st_size / (1024 * 1024)
        summary["scenarios"][scenario_id] = {
            **meta,
            "cells": len(features),
            "file_mb": round(size_mb, 2),
        }
        print(f"  {len(features)} celdas → {out_path.name} ({size_mb:.2f} MB)")

        legacy = OUT_DIR / f"{scenario_id}.geojson"
        if legacy.exists():
            legacy.unlink()

    with open(OUT_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"Manifest → {OUT_DIR / 'manifest.json'}")


if __name__ == "__main__":
    main()

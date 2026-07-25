"""
Utilidades geográficas para el pipeline de datos simulados.

Usa los contornos de países en site/public/data/regions/south-america.geojson
para asegurar que las escuelas ficticias caigan dentro del territorio de
Chile, Colombia o Perú (no mar ni países vecinos).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep

REPO_ROOT = Path(__file__).resolve().parents[1]
SA_GEOJSON = REPO_ROOT / "site" / "public" / "data" / "regions" / "south-america.geojson"

ISO_BY_COUNTRY = {"CL": "CHL", "CO": "COL", "PE": "PER"}


@lru_cache(maxsize=1)
def _country_layers():
    with open(SA_GEOJSON, encoding="utf-8") as f:
        collection = json.load(f)

    shapes: dict[str, object] = {}
    prepared: dict[str, object] = {}
    for feat in collection["features"]:
        iso = feat["properties"].get("iso")
        for country, target_iso in ISO_BY_COUNTRY.items():
            if iso == target_iso:
                geom = shape(feat["geometry"])
                shapes[country] = geom
                prepared[country] = prep(geom)
                break
    missing = set(ISO_BY_COUNTRY) - set(shapes)
    if missing:
        raise RuntimeError(f"Faltan geometrías para: {sorted(missing)}")
    return shapes, prepared


def point_in_country(country: str, lon: float, lat: float) -> bool:
    """True si (lon, lat) está dentro del polígono del país."""
    return _country_layers()[1][country].contains(Point(lon, lat))


def sample_near_region(
    country: str,
    base_lat: float,
    base_lon: float,
    rng,
    *,
    max_attempts: int = 120,
    sigma: float = 0.38,
) -> tuple[float, float]:
    """
    Muestra un punto cerca del centro regional, reintentando hasta caer en tierra.
    Si falla, cae a muestreo uniforme dentro del bbox nacional.
    """
    for _ in range(max_attempts):
        lat = float(base_lat + rng.normal(0, sigma))
        lon = float(base_lon + rng.normal(0, sigma))
        if point_in_country(country, lon, lat):
            return lat, lon
    return sample_in_country(country, rng)


def sample_in_country(country: str, rng, *, max_attempts: int = 2000) -> tuple[float, float]:
    """Muestreo uniforme dentro del bbox del país, validado contra el polígono."""
    shapes, prepared = _country_layers()
    geom = shapes[country]
    checker = prepared[country]
    minx, miny, maxx, maxy = geom.bounds
    for _ in range(max_attempts):
        lon = float(rng.uniform(minx, maxx))
        lat = float(rng.uniform(miny, maxy))
        if checker.contains(Point(lon, lat)):
            return lat, lon
    raise RuntimeError(f"No se pudo muestrear un punto en tierra para {country}")

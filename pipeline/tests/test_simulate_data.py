"""
Pruebas básicas del generador de datos simulados.

Paso 0 del proyecto: asegurar que los GeoJSON, Parquet e históricos cumplen el esquema
antes de alimentar el dashboard.
"""
import json
from pathlib import Path

import pandas as pd
import pytest

from schema import COORD_BOUNDS, N_SCHOOLS_PER_COUNTRY, RECENT_COLUMNS, SCHOOL_PROPERTIES
from geo_utils import point_in_country

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = REPO_ROOT / "site" / "public" / "data"


@pytest.mark.parametrize("country", ["cl", "co", "pe"])
def test_geojson_valido(country):
    path = DATA_ROOT / "schools" / f"{country}.geojson"
    assert path.exists(), f"Falta {path}"
    with open(path, encoding="utf-8") as f:
        geojson = json.load(f)
    assert geojson["type"] == "FeatureCollection"
    features = geojson["features"]
    assert len(features) == N_SCHOOLS_PER_COUNTRY
    for feat in features[:5]:
        assert feat["type"] == "Feature"
        assert feat["geometry"]["type"] == "Point"
        props = feat["properties"]
        for key in SCHOOL_PROPERTIES:
            assert key in props, f"Falta propiedad {key}"


@pytest.mark.parametrize("country_code,slug", [("CL", "cl"), ("CO", "co"), ("PE", "pe")])
def test_coordenadas_plausibles(country_code, slug):
    path = DATA_ROOT / "schools" / f"{slug}.geojson"
    with open(path, encoding="utf-8") as f:
        geojson = json.load(f)
    bounds = COORD_BOUNDS[country_code]
    for feat in geojson["features"]:
        lon, lat = feat["geometry"]["coordinates"]
        assert bounds["lat"][0] <= lat <= bounds["lat"][1]
        assert bounds["lon"][0] <= lon <= bounds["lon"][1]


@pytest.mark.parametrize("country_code,slug", [("CL", "cl"), ("CO", "co"), ("PE", "pe")])
def test_coordenadas_en_territorio(country_code, slug):
    path = DATA_ROOT / "schools" / f"{slug}.geojson"
    with open(path, encoding="utf-8") as f:
        geojson = json.load(f)
    for feat in geojson["features"]:
        lon, lat = feat["geometry"]["coordinates"]
        assert point_in_country(country_code, lon, lat), (
            f"Punto fuera de {country_code}: ({lon}, {lat})"
        )


@pytest.mark.parametrize("country", ["cl", "co", "pe"])
def test_parquet_columnas(country):
    path = DATA_ROOT / "recent" / f"{country}.parquet"
    assert path.exists()
    df = pd.read_parquet(path)
    for col in RECENT_COLUMNS:
        assert col in df.columns, f"Falta columna {col}"
    assert len(df) > 0


def test_historical_sample():
    sample = DATA_ROOT / "historical" / "cl" / "CL0001.json"
    assert sample.exists()
    with open(sample, encoding="utf-8") as f:
        data = json.load(f)
    assert data["school_id"] == "CL0001"
    assert len(data["week_start"]) == len(data["tmax_c"])

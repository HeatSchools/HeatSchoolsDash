"""
Convierte los CSV georeferenciados de escuelas en GeoJSON comprimido para la capa de mapa.

Entrada: pipeline/source/geoschool-2026/{CL,CO,PE}-geoschool-2026.csv
Salida:  site/public/data/schools-map/{cl,co,pe}.geojson.gz

Solo incluye escuelas con lat/lon válidos. Los paneles del dashboard siguen
usando los GeoJSON simulados en site/public/data/schools/.
"""
from __future__ import annotations

import csv
import gzip
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = REPO_ROOT / "pipeline" / "source" / "geoschool-2026"
OUT_DIR = REPO_ROOT / "site" / "public" / "data" / "schools-map"

COUNTRIES = {
    "CL": "cl",
    "CO": "co",
    "PE": "pe",
}


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    number = _parse_float(value)
    if number is None:
        return None
    return int(number)


def csv_to_geojson(country_code: str, slug: str) -> dict:
    csv_path = SOURCE_DIR / f"{country_code}-geoschool-2026.csv"
    features: list[dict] = []

    with csv_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            lat = _parse_float(row.get("lat"))
            lon = _parse_float(row.get("lon"))
            if lat is None or lon is None:
                continue

            properties = {
                "school_id": row.get("school_id", "").strip(),
                "school_name": row.get("school_name", "").strip(),
                "country": country_code,
                "admin1": (row.get("admin1") or "").strip(),
                "admin2": (row.get("admin2") or "").strip(),
                "sector": (row.get("sector") or "").strip(),
                "urban_rural": (row.get("urban_rural") or "").strip(),
            }

            enrollment = _parse_int(row.get("enrollment"))
            if enrollment is not None:
                properties["enrollment"] = enrollment

            altitude_m = _parse_float(row.get("altitude_m"))
            if altitude_m is not None:
                properties["altitude_m"] = round(altitude_m, 1)

            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": properties,
                }
            )

    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summary: dict[str, int] = {}

    for country_code, slug in COUNTRIES.items():
        geojson = csv_to_geojson(country_code, slug)
        out_path = OUT_DIR / f"{slug}.geojson.gz"
        payload = json.dumps(geojson, ensure_ascii=False).encode("utf-8")
        with gzip.open(out_path, "wb") as handle:
            handle.write(payload)
        legacy_path = OUT_DIR / f"{slug}.geojson"
        if legacy_path.exists():
            legacy_path.unlink()
        summary[slug] = len(geojson["features"])
        print(f"{slug}: {summary[slug]} escuelas -> {out_path.relative_to(REPO_ROOT)}")

    print(f"Total: {sum(summary.values())} puntos georeferenciados")


if __name__ == "__main__":
    main()

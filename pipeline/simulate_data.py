"""
Genera un dataset simulado de 200 escuelas por país (Chile, Colombia, Peru) para
probar el dashboard de HeatSchools. TODOS los datos son ficticios: coordenadas,
matricula, indices de temperatura y de bienestar/salud. No usar para analisis real.

Salidas (en site/public/data/ dentro del repo HeatSchoolsDash):
  schools/cl.geojson, co.geojson, pe.geojson
      -> capa de mapa: geometria + atributos resumen por escuela
  recent/cl.parquet, co.parquet, pe.parquet
      -> detalle DIARIO de los ultimos 24 meses, para DuckDB-WASM (httpfs)
  historical/<country>/<school_id>.json
      -> serie SEMANAL de los ultimos 15 anios, un archivo liviano por escuela
"""
import json
import os
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

N_PER_COUNTRY = 200
DAILY_MONTHS = 24
HIST_YEARS = 15

# Paso 0: salida en site/public/data para servir como estáticos desde Next.js
OUT_ROOT = "site/public/data"

# ---------------------------------------------------------------------------
# Regiones representativas por pais: (admin1, lat, lon, altitud_base_m, tmax_base_c)
# Coordenadas aproximadas de referencia (capital regional); son solo puntos de
# anclaje para dispersar escuelas de forma plausible, no limites administrativos reales.
# ---------------------------------------------------------------------------
REGIONS = {
    "CL": [
        ("Tarapaca",        -20.21, -70.15,  40, 24.5),
        ("Antofagasta",     -23.65, -70.40,  60, 23.0),
        ("Coquimbo",        -29.90, -71.25,  30, 26.5),
        ("Valparaiso",      -33.05, -71.55,  50, 27.0),
        ("Metropolitana",   -33.45, -70.65, 520, 29.0),
        ("Ohiggins",        -34.17, -70.74, 350, 29.5),
        ("Maule",           -35.43, -71.65, 100, 29.0),
        ("Biobio",          -36.83, -73.05,  15, 25.0),
        ("Araucania",       -38.74, -72.59, 120, 22.0),
        ("Los Lagos",       -41.47, -72.94,  30, 19.0),
    ],
    "CO": [
        ("Bogota D.C.",     4.71,  -74.07, 2600, 19.5),
        ("Antioquia",       6.25,  -75.56, 1500, 27.5),
        ("Valle del Cauca", 3.45,  -76.53,  995, 29.0),
        ("Atlantico",       10.96, -74.80,   18, 32.5),
        ("Santander",       7.12,  -73.13,  959, 28.0),
        ("Cundinamarca",    4.90,  -74.25, 2560, 20.0),
        ("Bolivar",         10.39, -75.51,    2, 32.0),
        ("Narino",          1.21,  -77.28, 2527, 19.0),
        ("Boyaca",          5.54,  -73.36, 2782, 18.5),
        ("Risaralda",       4.81,  -75.69, 1411, 26.5),
    ],
    "PE": [
        ("Lima",            -12.05, -77.04,  150, 26.0),
        ("Arequipa",        -16.41, -71.53, 2335, 23.0),
        ("La Libertad",     -8.11,  -79.03,   34, 27.0),
        ("Piura",           -5.19,  -80.63,   29, 31.0),
        ("Cusco",           -13.53, -71.97, 3399, 20.0),
        ("Junin",           -12.07, -75.21, 3259, 18.5),
        ("Lambayeque",      -6.77,  -79.84,   18, 30.5),
        ("Loreto",          -3.75,  -73.25,  106, 32.5),
        ("Puno",            -15.84, -70.02, 3825, 16.5),
        ("Ica",             -14.07, -75.73,  406, 29.0),
    ],
}

SCHOOL_ID_PREFIX = {"CL": "CL", "CO": "CO", "PE": "PE"}
LEVELS = ["Inicial", "Primaria", "Secundaria"]
LEVEL_W = [0.25, 0.40, 0.35]
SECTORS = ["Publico", "Privado", "Subvencionado"]
SECTOR_W = [0.60, 0.15, 0.25]
URBAN_RURAL = ["Urbano", "Rural"]
UR_W = [0.75, 0.25]

NAME_WORDS = [
    "San Martin", "Los Andes", "Las Flores", "El Bosque", "Nueva Esperanza",
    "Simon Bolivar", "Jose Marti", "Amanecer", "Los Alamos", "Santa Rosa",
    "Villa del Sol", "Alto del Rio", "Las Colinas", "Buenos Aires", "El Progreso",
]


def make_school(country, idx, region):
    admin1, base_lat, base_lon, base_alt, base_tmax = region
    lat = base_lat + np.random.normal(0, 0.55)
    lon = base_lon + np.random.normal(0, 0.55)
    altitude = max(0, base_alt + np.random.normal(0, 120))

    school_id = f"{SCHOOL_ID_PREFIX[country]}{idx:04d}"
    school_name = f"Escuela {random.choice(NAME_WORDS)} {idx}"
    admin2 = f"{admin1} - Comuna {1 + idx % 12}"

    level = np.random.choice(LEVELS, p=LEVEL_W)
    sector = np.random.choice(SECTORS, p=SECTOR_W)
    urban_rural = np.random.choice(URBAN_RURAL, p=UR_W)
    enrollment = int(np.clip(np.random.lognormal(mean=5.6, sigma=0.5), 60, 1400))

    tmax_avg = base_tmax + np.random.normal(0, 1.3)
    pet_avg = tmax_avg + np.random.uniform(1.5, 5.5)
    wbgt_avg = tmax_avg - np.random.uniform(1.0, 4.0)

    heat_days_30 = int(np.clip((tmax_avg - 24) * 15 + np.random.normal(0, 12), 0, 365))
    heat_days_35 = int(np.clip(heat_days_30 * np.random.uniform(0.05, 0.30), 0, heat_days_30))
    tx90p = round(float(np.clip(np.random.normal(11, 3), 3, 25)), 1)
    wsdi = int(np.clip(heat_days_30 * np.random.uniform(0.15, 0.5) + np.random.normal(0, 3), 0, 90))

    wellbeing_score = round(float(np.clip(np.random.normal(65, 12), 20, 98)), 1)
    health_index = round(float(np.clip(80 - heat_days_30 * 0.08 + np.random.normal(0, 8), 25, 97)), 1)

    return {
        "school_id": school_id,
        "school_name": school_name,
        "country": country,
        "admin1": admin1,
        "admin2": admin2,
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "level": level,
        "sector": sector,
        "enrollment": enrollment,
        "urban_rural": urban_rural,
        "altitude_m": round(altitude, 1),
        "tmax_avg_c": round(tmax_avg, 1),
        "pet_avg_c": round(pet_avg, 1),
        "wbgt_avg_c": round(wbgt_avg, 1),
        "heat_days_30": heat_days_30,
        "heat_days_35": heat_days_35,
        "tx90p": tx90p,
        "wsdi": wsdi,
        "wellbeing_score": wellbeing_score,
        "health_index": health_index,
        "_base_tmax": tmax_avg,  # usado solo para generar series, no se exporta
    }


def seasonal_offset(day_of_year, country, amplitude=6.0):
    # hemisferio sur: peak de calor en enero (dia ~15), salvo zonas ecuatoriales
    # con estacionalidad mas plana (se simula igual, solo cambia amplitud)
    phase = (day_of_year - 15) / 365.25 * 2 * np.pi
    amp = amplitude if country in ("CL",) else amplitude * 0.55
    return amp * np.cos(phase)


def build_recent_daily(schools_df, country, months=DAILY_MONTHS):
    end = date(2026, 7, 18)
    start = end - timedelta(days=months * 30)
    dates = pd.date_range(start, end, freq="D")
    rows = []
    for _, s in schools_df.iterrows():
        base = s["_base_tmax"]
        doy = dates.dayofyear.values
        seas = seasonal_offset(doy, country)
        noise = np.random.normal(0, 1.8, size=len(dates))
        tmax = base + seas + noise
        tmin = tmax - np.random.uniform(6, 11, size=len(dates))
        pet = tmax + np.random.uniform(1.5, 5.5, size=len(dates))
        wbgt = tmax - np.random.uniform(1.0, 4.0, size=len(dates))
        rows.append(pd.DataFrame({
            "school_id": s["school_id"],
            "country": country,
            "date": dates,
            "tmax_c": np.round(tmax, 2),
            "tmin_c": np.round(tmin, 2),
            "pet_c": np.round(pet, 2),
            "wbgt_c": np.round(wbgt, 2),
        }))
    return pd.concat(rows, ignore_index=True)


def build_historical_weekly(school_row, country, years=HIST_YEARS):
    end = date(2026, 7, 18)
    start = end - timedelta(days=years * 365)
    weeks = pd.date_range(start, end, freq="W-MON")
    base = school_row["_base_tmax"]
    doy = weeks.dayofyear.values
    seas = seasonal_offset(doy, country, amplitude=5.5)
    # leve tendencia al alza en 15 anios (calentamiento simulado, ~0.03 C/anio)
    years_elapsed = (weeks - weeks[0]).days / 365.25
    trend = years_elapsed * 0.03
    noise = np.random.normal(0, 1.0, size=len(weeks))
    tmax = base + seas + trend + noise
    pet = tmax + np.random.uniform(1.5, 5.5, size=len(weeks))
    wbgt = tmax - np.random.uniform(1.0, 4.0, size=len(weeks))
    # formato columnar (arrays paralelos), mas liviano que un array de objetos
    return {
        "week_start": [w.strftime("%Y-%m-%d") for w in weeks],
        "tmax_c": [round(float(t), 2) for t in tmax],
        "pet_c": [round(float(p), 2) for p in pet],
        "wbgt_c": [round(float(g), 2) for g in wbgt],
    }


def build_country_monthly(daily_df):
    """Agrega series mensuales nacionales a partir del detalle diario simulado."""
    df = daily_df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly = df.groupby("month", as_index=False).agg(
        tmax_c=("tmax_c", "mean"),
        tmin_c=("tmin_c", "mean"),
        pet_c=("pet_c", "mean"),
        wbgt_c=("wbgt_c", "mean"),
        heat_days_30=("tmax_c", lambda s: float((s >= 30).mean() * 100)),
    )
    for col in ["tmax_c", "tmin_c", "pet_c", "wbgt_c", "heat_days_30"]:
        monthly[col] = monthly[col].round(2)
    return {
        "month": monthly["month"].tolist(),
        "tmax_c": monthly["tmax_c"].tolist(),
        "tmin_c": monthly["tmin_c"].tolist(),
        "pet_c": monthly["pet_c"].tolist(),
        "wbgt_c": monthly["wbgt_c"].tolist(),
        "heat_days_30": monthly["heat_days_30"].tolist(),
    }


def build_country_daily(daily_df, days=90):
    """Promedio nacional diario de Tmax (últimos N días) para series en la home."""
    df = daily_df.copy()
    df["date"] = pd.to_datetime(df["date"])
    national = (
        df.groupby("date", as_index=False)["tmax_c"]
        .mean()
        .sort_values("date")
        .tail(days)
    )
    # Ligera variación diaria adicional sobre el promedio agregado (más realista visualmente)
    noise = np.random.normal(0, 0.35, size=len(national))
    tmax = (national["tmax_c"].values + noise).round(2)
    return {
        "date": [d.strftime("%Y-%m-%d") for d in national["date"]],
        "tmax_c": tmax.tolist(),
    }


def main():
    os.makedirs(f"{OUT_ROOT}/schools", exist_ok=True)
    os.makedirs(f"{OUT_ROOT}/recent", exist_ok=True)
    os.makedirs(f"{OUT_ROOT}/summary", exist_ok=True)

    summary = {}
    idx_counter = {"CL": 0, "CO": 0, "PE": 0}
    all_daily = []

    for country in ["CL", "CO", "PE"]:
        regions = REGIONS[country]
        schools = []
        for i in range(N_PER_COUNTRY):
            idx_counter[country] += 1
            region = regions[i % len(regions)]
            schools.append(make_school(country, idx_counter[country], region))
        schools_df = pd.DataFrame(schools)

        # ---- GeoJSON (capa de mapa, sin la columna interna _base_tmax) ----
        features = []
        for _, s in schools_df.iterrows():
            props = s.drop(labels=["lat", "lon", "_base_tmax"]).to_dict()
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
                "properties": props,
            })
        geojson = {"type": "FeatureCollection", "features": features}
        with open(f"{OUT_ROOT}/schools/{country.lower()}.geojson", "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)

        # ---- Parquet diario reciente (24 meses), particionado por pais ----
        daily = build_recent_daily(schools_df, country)
        daily.to_parquet(f"{OUT_ROOT}/recent/{country.lower()}.parquet", index=False)
        all_daily.append(daily)

        # ---- Resumen mensual nacional (series climaticas para home) ----
        monthly = build_country_monthly(daily)
        with open(f"{OUT_ROOT}/summary/{country.lower()}_monthly.json", "w", encoding="utf-8") as f:
            json.dump({"country": country, "resolution": "monthly", **monthly}, f, ensure_ascii=False)

        daily_series = build_country_daily(daily)
        with open(f"{OUT_ROOT}/summary/{country.lower()}_daily.json", "w", encoding="utf-8") as f:
            json.dump({"country": country, "resolution": "daily", **daily_series}, f, ensure_ascii=False)

        # ---- JSON semanal historico (15 anios), un archivo por escuela ----
        hist_dir = f"{OUT_ROOT}/historical/{country.lower()}"
        os.makedirs(hist_dir, exist_ok=True)
        for _, s in schools_df.iterrows():
            series = build_historical_weekly(s, country)
            with open(f"{hist_dir}/{s['school_id']}.json", "w", encoding="utf-8") as f:
                json.dump({"school_id": s["school_id"], "resolution": "weekly",
                           "years": HIST_YEARS, **series}, f, ensure_ascii=False,
                           separators=(",", ":"))

        summary[country] = {
            "n_schools": len(schools_df),
            "daily_rows": len(daily),
            "historical_files": len(schools_df),
            "sample": schools_df.drop(columns=["_base_tmax"]).head(3).to_dict(orient="records"),
        }
        print(f"{country}: {len(schools_df)} escuelas, {len(daily)} filas diarias, "
              f"{len(schools_df)} archivos historicos semanales")

    # Serie mensual global (tres paises combinados)
    global_daily = pd.concat(all_daily, ignore_index=True)
    global_monthly = build_country_monthly(global_daily)
    with open(f"{OUT_ROOT}/summary/global_monthly.json", "w", encoding="utf-8") as f:
        json.dump({"country": "ALL", "resolution": "monthly", **global_monthly}, f, ensure_ascii=False)

    with open("pipeline/mock_data_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print("Resumen escrito en pipeline/mock_data_summary.json")


if __name__ == "__main__":
    main()

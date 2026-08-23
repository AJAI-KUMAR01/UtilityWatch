"""Routes: Data — /api/health and /api/consumption"""

import os
import pandas as pd
from flask import Blueprint, jsonify, request
from pathlib import Path

data_bp = Blueprint("data", __name__)

DATA_PATH = Path(__file__).parent.parent / "data" / "sample_consumption.csv"

_df_cache = None


def load_data() -> pd.DataFrame:
    """Load CSV once and cache in memory."""
    global _df_cache
    if _df_cache is None:
        if not DATA_PATH.exists():
            raise FileNotFoundError(
                f"Dataset not found at {DATA_PATH}. "
                "Run: python backend/data/generate_data.py"
            )
        _df_cache = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])
    return _df_cache


@data_bp.route("/health", methods=["GET"])
def health_check():
    """GET /api/health — service health check."""
    return jsonify({"status": "ok", "service": "UtilityWatch API", "version": "1.0.0"})


@data_bp.route("/consumption", methods=["GET"])
def get_consumption():
    """
    GET /api/consumption
    Query params:
      - meter_type: 'electricity' | 'water' (required)
      - range: 'day' | 'week' | 'month' | 'year' (default: 'month')
      - aggregate: 'hourly' | 'daily' (default: 'daily')
    """
    meter_type = request.args.get("meter_type", "").strip().lower()
    if meter_type not in ("electricity", "water"):
        return jsonify({"error": "meter_type must be 'electricity' or 'water'"}), 400

    time_range = request.args.get("range", "month").strip().lower()
    aggregate = request.args.get("aggregate", "daily").strip().lower()

    try:
        df = load_data()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    filtered = df[df["meter_type"] == meter_type].copy()

    # Apply time range filter
    max_date = filtered["timestamp"].max()
    range_map = {
        "day": pd.Timedelta(days=1),
        "week": pd.Timedelta(weeks=1),
        "month": pd.Timedelta(days=30),
        "year": pd.Timedelta(days=365),
    }
    delta = range_map.get(time_range, pd.Timedelta(days=30))
    filtered = filtered[filtered["timestamp"] >= max_date - delta]

    # Aggregate if requested
    if aggregate == "daily":
        filtered = filtered.set_index("timestamp")
        daily = filtered["usage"].resample("D").sum().reset_index()
        daily["meter_type"] = meter_type
        daily["unit"] = "kWh" if meter_type == "electricity" else "L"
        filtered = daily

    result = []
    for _, row in filtered.iterrows():
        result.append({
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"]),
            "meter_type": row.get("meter_type", meter_type),
            "usage": round(float(row["usage"]), 3),
            "unit": row.get("unit", "kWh" if meter_type == "electricity" else "L"),
        })

    return jsonify({
        "data": result,
        "meter_type": meter_type,
        "range": time_range,
        "aggregate": aggregate,
        "count": len(result),
    })

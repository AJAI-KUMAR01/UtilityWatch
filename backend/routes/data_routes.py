"""Routes: Data — /api/health and /api/consumption"""

import os
import pandas as pd
from flask import Blueprint, jsonify, request
from pathlib import Path

data_bp = Blueprint("data", __name__)

DATA_PATH_DEMO = Path(__file__).parent.parent / "data" / "sample_consumption.csv"
DATA_PATH_USER = Path(__file__).parent.parent / "data" / "user_consumption.csv"

_df_cache_demo = None
_df_cache_user = None

def load_data(source: str = "demo") -> pd.DataFrame:
    """Load CSV once and cache in memory."""
    global _df_cache_demo, _df_cache_user
    
    is_demo = (source == "demo")
    cache = _df_cache_demo if is_demo else _df_cache_user
    data_path = DATA_PATH_DEMO if is_demo else DATA_PATH_USER

    if cache is None:
        if not data_path.exists():
            if is_demo:
                raise FileNotFoundError(
                    f"Demo dataset not found at {data_path}. "
                    "Run: python backend/data/generate_data.py"
                )
            else:
                # Return empty DataFrame for user data if not uploaded yet
                return pd.DataFrame(columns=["timestamp", "meter_type", "usage", "unit"])
                
        cache = pd.read_csv(data_path, parse_dates=["timestamp"])
        if is_demo:
            _df_cache_demo = cache
        else:
            _df_cache_user = cache
            
    return cache


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

    source = request.args.get("source", "demo").strip().lower()

    try:
        df = load_data(source=source)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    if df.empty:
        return jsonify({
            "data": [],
            "meter_type": meter_type,
            "range": time_range,
            "aggregate": aggregate,
            "count": 0,
        })

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

@data_bp.route("/user-upload", methods=["POST"])
def user_upload():
    """POST /api/data/user-upload - Upload custom CSV or JSON data."""
    global _df_cache_user
    
    if "file" in request.files:
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        try:
            df = pd.read_csv(file, parse_dates=["timestamp"])
        except Exception as e:
            return jsonify({"error": f"Error parsing CSV: {e}"}), 400
    else:
        # JSON payload
        data = request.json
        if not data or not isinstance(data, list):
            return jsonify({"error": "Expected a JSON array of records or a CSV file"}), 400
        df = pd.DataFrame(data)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])

    required_cols = {"timestamp", "meter_type", "usage"}
    if not required_cols.issubset(set(df.columns)):
        return jsonify({"error": f"Missing required columns. Expected at least {required_cols}"}), 400

    if "unit" not in df.columns:
        df["unit"] = df["meter_type"].apply(lambda m: "kWh" if m == "electricity" else "L")

    # Save to user_consumption.csv
    try:
        df.to_csv(DATA_PATH_USER, index=False)
        _df_cache_user = None  # invalidate cache
        return jsonify({"message": "Data uploaded successfully", "records": len(df)}), 200
    except Exception as e:
        return jsonify({"error": f"Error saving data: {e}"}), 500

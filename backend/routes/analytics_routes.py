"""Routes: Analytics — anomalies, cost, forecast"""

import pandas as pd
from flask import Blueprint, jsonify, request
from pathlib import Path

from services.anomaly_detection import detect_anomalies
from services.forecasting import generate_forecast
from services.cost_analysis import analyze_costs

from .data_routes import load_data

analytics_bp = Blueprint("analytics", __name__)


def _get_meter_df(meter_type: str, source: str = "demo") -> pd.DataFrame:
    df = load_data(source=source)
    if df.empty:
        return df
    return df[df["meter_type"] == meter_type][["timestamp", "usage"]].copy()


@analytics_bp.route("/anomalies", methods=["GET"])
def get_anomalies():
    """
    GET /api/analytics/anomalies
    Query params:
      - meter_type: 'electricity' | 'water' (required)
      - z_threshold: float (default 2.5)
      - rolling_window: int hours (default 24)
    """
    meter_type = request.args.get("meter_type", "").strip().lower()
    if meter_type not in ("electricity", "water"):
        return jsonify({"error": "meter_type must be 'electricity' or 'water'"}), 400

    try:
        z_threshold = float(request.args.get("z_threshold", 2.5))
        rolling_window = int(request.args.get("rolling_window", 24))
    except ValueError:
        return jsonify({"error": "z_threshold must be float, rolling_window must be int"}), 400

    source = request.args.get("source", "demo").strip().lower()

    try:
        df = _get_meter_df(meter_type, source=source)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    if df.empty:
        return jsonify({"anomalies": [], "flagged_count": 0, "meter_type": meter_type})

    result = detect_anomalies(df, z_threshold=z_threshold, rolling_window=rolling_window)
    result["meter_type"] = meter_type
    return jsonify(result)


@analytics_bp.route("/cost", methods=["GET"])
def get_cost():
    """
    GET /api/analytics/cost
    Query params:
      - meter_type: 'electricity' | 'water' (required)
      - rate: float — tariff per unit (optional, uses default if omitted)
    """
    meter_type = request.args.get("meter_type", "").strip().lower()
    if meter_type not in ("electricity", "water"):
        return jsonify({"error": "meter_type must be 'electricity' or 'water'"}), 400

    rate = None
    if request.args.get("rate"):
        try:
            rate = float(request.args.get("rate"))
            if rate < 0:
                return jsonify({"error": "rate must be a non-negative number"}), 400
        except ValueError:
            return jsonify({"error": "rate must be a valid float"}), 400

    source = request.args.get("source", "demo").strip().lower()

    try:
        df = _get_meter_df(meter_type, source=source)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    result = analyze_costs(df, meter_type=meter_type, rate=rate)
    return jsonify(result)


@analytics_bp.route("/forecast", methods=["GET"])
def get_forecast():
    """
    GET /api/analytics/forecast
    Query params:
      - meter_type: 'electricity' | 'water' (required)
      - horizon: int — days to forecast (default 30, max 90)
    """
    meter_type = request.args.get("meter_type", "").strip().lower()
    if meter_type not in ("electricity", "water"):
        return jsonify({"error": "meter_type must be 'electricity' or 'water'"}), 400

    try:
        horizon = int(request.args.get("horizon", 30))
        horizon = max(1, min(horizon, 90))  # Clamp 1-90
    except ValueError:
        return jsonify({"error": "horizon must be an integer"}), 400

    source = request.args.get("source", "demo").strip().lower()

    try:
        df = _get_meter_df(meter_type, source=source)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    if df.empty:
        return jsonify({"historical": [], "forecast": [], "model": "none", "meter_type": meter_type})

    result = generate_forecast(df, horizon=horizon)
    result["meter_type"] = meter_type
    return jsonify(result)

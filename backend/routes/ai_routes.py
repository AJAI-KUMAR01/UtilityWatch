"""Routes: AI — /api/ai/recommendations"""

from flask import Blueprint, jsonify, request
from services.groq_client import get_recommendations

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/recommendations", methods=["POST"])
def recommendations():
    """
    POST /api/ai/recommendations
    Body (JSON):
      {
        "meter_type": "electricity" | "water",
        "unit": "kWh" | "L",
        "avg_daily_usage": float,
        "total_usage": float,
        "total_cost": float,
        "avg_monthly_cost": float,
        "rate_per_unit": float,
        "anomaly_count": int,
        "peak_day": {"date": str, "usage": float, "cost": float},
        "forecast_trend": "increasing" | "decreasing" | "stable"
      }
    Returns:
      {
        "recommendations": [...],
        "summary": "..."
      }
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Empty or invalid JSON body"}), 400

    # Validate required fields
    required = ["meter_type"]
    missing = [f for f in required if f not in body]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    meter_type = body.get("meter_type", "").strip().lower()
    if meter_type not in ("electricity", "water"):
        return jsonify({"error": "meter_type must be 'electricity' or 'water'"}), 400

    try:
        result = get_recommendations(body)
        return jsonify(result)
    except EnvironmentError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 500

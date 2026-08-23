"""
Cost Analysis Service
=====================
Computes estimated utility costs from usage data using configurable tariff rates.

Formula: cost = usage * rate_per_unit

Supported breakdowns:
  - daily   : per-day total cost
  - weekly  : per-week total cost (Mon-Sun)
  - monthly : per-month total cost

Default tariff rates (can be overridden via API parameter):
  - Electricity: $0.12 per kWh  (US residential average ~2024)
  - Water:       $0.004 per litre (~$4 per 1000L, typical municipal rate)
"""

import pandas as pd
import numpy as np
from typing import Optional


DEFAULT_RATES = {
    "electricity": 0.12,   # USD per kWh
    "water": 0.004,        # USD per litre
}


def analyze_costs(
    df: pd.DataFrame,
    meter_type: str = "electricity",
    rate: Optional[float] = None,
) -> dict:
    """
    Compute daily, weekly, and monthly cost breakdowns.

    Args:
        df: DataFrame with columns [timestamp, usage]
        meter_type: 'electricity' or 'water'
        rate: Custom tariff rate (overrides default if provided)

    Returns:
        dict with daily/weekly/monthly breakdowns and summary stats
    """
    if df.empty or "usage" not in df.columns:
        return {
            "daily": [], "weekly": [], "monthly": [],
            "summary": {}, "rate_per_unit": 0, "meter_type": meter_type
        }

    effective_rate = rate if rate is not None else DEFAULT_RATES.get(meter_type, 0.12)

    df = df.copy().sort_values("timestamp")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["cost"] = df["usage"].astype(float) * effective_rate
    df = df.set_index("timestamp")

    # --- Daily breakdown ---
    daily_usage = df["usage"].resample("D").sum()
    daily_cost = df["cost"].resample("D").sum()
    daily = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "usage": round(float(u), 3),
            "cost": round(float(c), 4),
        }
        for d, u, c in zip(daily_usage.index, daily_usage.values, daily_cost.values)
    ]

    # --- Weekly breakdown ---
    weekly_usage = df["usage"].resample("W-MON").sum()
    weekly_cost = df["cost"].resample("W-MON").sum()
    weekly = [
        {
            "week_ending": d.strftime("%Y-%m-%d"),
            "usage": round(float(u), 3),
            "cost": round(float(c), 4),
        }
        for d, u, c in zip(weekly_usage.index, weekly_usage.values, weekly_cost.values)
    ]

    # --- Monthly breakdown ---
    monthly_usage = df["usage"].resample("ME").sum()
    monthly_cost = df["cost"].resample("ME").sum()
    monthly = [
        {
            "month": d.strftime("%Y-%m"),
            "usage": round(float(u), 3),
            "cost": round(float(c), 4),
        }
        for d, u, c in zip(monthly_usage.index, monthly_usage.values, monthly_cost.values)
    ]

    # --- Summary ---
    total_usage = float(df["usage"].sum())
    total_cost = float(df["cost"].sum())
    avg_daily_cost = total_cost / max(len(daily), 1)
    avg_weekly_cost = total_cost / max(len(weekly), 1)
    avg_monthly_cost = total_cost / max(len(monthly), 1)
    peak_day = max(daily, key=lambda x: x["cost"]) if daily else {}
    lowest_day = min(daily, key=lambda x: x["cost"]) if daily else {}

    unit = "kWh" if meter_type == "electricity" else "L"
    currency = "USD"

    return {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly,
        "summary": {
            "total_usage": round(total_usage, 3),
            "total_cost": round(total_cost, 4),
            "avg_daily_cost": round(avg_daily_cost, 4),
            "avg_weekly_cost": round(avg_weekly_cost, 4),
            "avg_monthly_cost": round(avg_monthly_cost, 4),
            "peak_day": peak_day,
            "lowest_day": lowest_day,
            "currency": currency,
            "unit": unit,
        },
        "rate_per_unit": effective_rate,
        "meter_type": meter_type,
    }

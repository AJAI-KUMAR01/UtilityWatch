"""
Forecasting Service — Holt-Winters Exponential Smoothing
=========================================================
Uses statsmodels ExponentialSmoothing (Holt-Winters) with:
  - trend='add'      : additive trend component
  - seasonal='add'   : additive seasonal component
  - seasonal_periods : 24 (hourly data → daily seasonality)
                       or 7 (daily data → weekly seasonality)

Why Holt-Winters?
- Explicitly models level, trend, AND seasonality — ideal for utility data
- Outperforms simple moving average when data has strong seasonal cycles
- Lightweight enough for a REST API response (no GPU needed)
- Handles both electricity peaks and water usage rhythms well

For hourly data with 24h seasonality, the model captures:
  - Daily patterns (morning/evening peaks)
  - Trend drift (gradual increase/decrease over weeks)
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings("ignore")  # Suppress statsmodels convergence warnings


def generate_forecast(df: pd.DataFrame, horizon: int = 30) -> dict:
    """
    Fit a Holt-Winters model on daily-aggregated usage and forecast N days ahead.

    Args:
        df: DataFrame with columns [timestamp, usage] (hourly data)
        horizon: Number of days to forecast (default 30)

    Returns:
        dict with 'historical' list and 'forecast' list of {date, usage} points
    """
    if df.empty or "usage" not in df.columns:
        return {"historical": [], "forecast": [], "model": "holt_winters", "horizon_days": horizon}

    df = df.copy().sort_values("timestamp")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.set_index("timestamp")

    # Aggregate to daily totals for more stable modelling
    daily = df["usage"].resample("D").sum().dropna()

    if len(daily) < 14:
        # Not enough history — fall back to simple mean forecast
        mean_val = float(daily.mean())
        last_date = daily.index[-1]
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=horizon, freq="D")
        return {
            "historical": [{"date": d.strftime("%Y-%m-%d"), "usage": round(float(v), 3)} for d, v in daily.items()],
            "forecast": [{"date": d.strftime("%Y-%m-%d"), "usage": round(mean_val, 3)} for d in future_dates],
            "model": "mean_fallback",
            "horizon_days": horizon,
        }

    # Determine seasonal period (weekly if enough data, else simpler)
    seasonal_periods = 7 if len(daily) >= 14 else None

    try:
        model = ExponentialSmoothing(
            daily,
            trend="add",
            seasonal="add" if seasonal_periods else None,
            seasonal_periods=seasonal_periods,
            initialization_method="estimated",
        )
        fitted = model.fit(optimized=True, remove_bias=True)
        forecast_values = fitted.forecast(horizon)
        # Clip negatives — usage can't be negative
        forecast_values = forecast_values.clip(lower=0)

    except Exception as exc:
        # Graceful degradation: linear regression fallback
        x = np.arange(len(daily))
        coeffs = np.polyfit(x, daily.values, 1)
        future_x = np.arange(len(daily), len(daily) + horizon)
        forecast_array = np.polyval(coeffs, future_x).clip(min=0)
        last_date = daily.index[-1]
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=horizon, freq="D")
        forecast_values = pd.Series(forecast_array, index=future_dates)

    historical = [
        {"date": d.strftime("%Y-%m-%d"), "usage": round(float(v), 3)}
        for d, v in daily.items()
    ]
    forecast = [
        {"date": d.strftime("%Y-%m-%d"), "usage": round(float(v), 3)}
        for d, v in forecast_values.items()
    ]

    return {
        "historical": historical,
        "forecast": forecast,
        "model": "holt_winters_exponential_smoothing",
        "seasonal_periods": seasonal_periods,
        "horizon_days": horizon,
    }

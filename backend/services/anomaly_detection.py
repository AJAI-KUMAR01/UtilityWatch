"""
Anomaly Detection Service
=========================
Uses two complementary methods:

1. Z-Score: flags points where |z| > threshold (default 2.5)
   - Good for detecting global outliers relative to the full distribution
   
2. Rolling Moving Average: flags points deviating from a rolling window mean
   by more than N * rolling_std (default window=24h, N=2.5)
   - Better for detecting local spikes/drops in time-series context

A point is flagged if EITHER method marks it as anomalous.
"""

import pandas as pd
import numpy as np
from typing import TypedDict


class AnomalyResult(TypedDict):
    timestamp: str
    usage: float
    z_score: float
    rolling_deviation: float
    method: str  # 'z_score', 'rolling', or 'both'


def detect_anomalies(
    df: pd.DataFrame,
    z_threshold: float = 2.5,
    rolling_window: int = 24,
    rolling_threshold: float = 2.5,
) -> dict:
    """
    Detect anomalies in a time-series DataFrame.

    Args:
        df: DataFrame with columns [timestamp, usage]
        z_threshold: Z-score threshold for flagging (default 2.5)
        rolling_window: Hours for rolling window (default 24)
        rolling_threshold: Std deviation multiplier for rolling method (default 2.5)

    Returns:
        dict with 'anomalies' list and 'thresholds' metadata
    """
    if df.empty or "usage" not in df.columns:
        return {"anomalies": [], "thresholds": {}, "total_points": 0}

    df = df.copy().sort_values("timestamp").reset_index(drop=True)
    usage = df["usage"].astype(float)

    # --- Method 1: Z-Score ---
    mean_val = usage.mean()
    std_val = usage.std()
    z_scores = ((usage - mean_val) / std_val).abs() if std_val > 0 else pd.Series([0.0] * len(usage))
    z_flag = z_scores > z_threshold

    # --- Method 2: Rolling Moving Average ---
    rolling_mean = usage.rolling(window=rolling_window, center=True, min_periods=1).mean()
    rolling_std = usage.rolling(window=rolling_window, center=True, min_periods=1).std().fillna(0)
    rolling_dev = (usage - rolling_mean).abs()
    rolling_flag = rolling_dev > (rolling_threshold * rolling_std)

    # Combine
    anomaly_mask = z_flag | rolling_flag

    anomalies = []
    for idx in df[anomaly_mask].index:
        method = "both"
        if z_flag.iloc[idx] and not rolling_flag.iloc[idx]:
            method = "z_score"
        elif rolling_flag.iloc[idx] and not z_flag.iloc[idx]:
            method = "rolling"

        anomalies.append({
            "timestamp": df["timestamp"].iloc[idx].isoformat()
            if hasattr(df["timestamp"].iloc[idx], "isoformat")
            else str(df["timestamp"].iloc[idx]),
            "usage": round(float(usage.iloc[idx]), 3),
            "z_score": round(float(z_scores.iloc[idx]), 3),
            "rolling_deviation": round(float(rolling_dev.iloc[idx]), 3),
            "rolling_mean": round(float(rolling_mean.iloc[idx]), 3),
            "method": method,
        })

    return {
        "anomalies": anomalies,
        "total_points": len(df),
        "flagged_count": len(anomalies),
        "thresholds": {
            "z_score_threshold": z_threshold,
            "rolling_window_hours": rolling_window,
            "rolling_std_multiplier": rolling_threshold,
            "global_mean": round(float(mean_val), 3),
            "global_std": round(float(std_val), 3),
        },
    }

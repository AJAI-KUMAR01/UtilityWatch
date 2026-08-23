"""
Synthetic Utility Data Generator
=================================
Generates realistic hourly electricity and water consumption data for 365 days.

Patterns:
- Electricity: seasonal summer peaks, higher weekday usage, evening peaks (6-9 PM)
- Water: morning (6-9 AM) and evening (6-9 PM) spikes, weekend variation
- Injected anomalies: random spikes (3x normal) and drops (~10% of normal)

Output schema: timestamp, meter_type, usage, unit
"""

import pandas as pd
import numpy as np
from pathlib import Path
import random

random.seed(42)
np.random.seed(42)

OUTPUT_PATH = Path(__file__).parent / "sample_consumption.csv"
DAYS = 365
START_DATE = "2024-01-01"


def generate_electricity(timestamps: pd.DatetimeIndex) -> pd.Series:
    """Hourly electricity usage in kWh with seasonal + daily patterns."""
    usage = []
    for ts in timestamps:
        # Base load (kWh per hour)
        base = 1.2

        # Seasonal variation: summer peaks (June-August)
        month = ts.month
        if month in [6, 7, 8]:
            seasonal = 1.5  # AC usage
        elif month in [12, 1, 2]:
            seasonal = 1.3  # Heating
        else:
            seasonal = 1.0

        # Time-of-day pattern
        hour = ts.hour
        if 6 <= hour <= 9:
            tod = 1.3   # Morning routine
        elif 17 <= hour <= 21:
            tod = 1.8   # Evening peak
        elif 0 <= hour <= 5:
            tod = 0.4   # Night low
        else:
            tod = 1.0

        # Weekday vs weekend
        dow = ts.dayofweek
        weekday_factor = 1.1 if dow < 5 else 0.9

        # Combined with noise
        val = base * seasonal * tod * weekday_factor
        noise = np.random.normal(0, val * 0.1)
        usage.append(max(0.1, val + noise))

    return pd.Series(usage)


def generate_water(timestamps: pd.DatetimeIndex) -> pd.Series:
    """Hourly water usage in litres with morning/evening spikes."""
    usage = []
    for ts in timestamps:
        # Base load (litres per hour)
        base = 15.0

        # Time-of-day pattern
        hour = ts.hour
        if 6 <= hour <= 9:
            tod = 3.0   # Morning showers, cooking
        elif 17 <= hour <= 20:
            tod = 2.5   # Evening cooking, dishes
        elif 0 <= hour <= 5:
            tod = 0.2   # Overnight near-zero
        elif 10 <= hour <= 16:
            tod = 1.2   # Daytime moderate
        else:
            tod = 1.5

        # Weekend higher (more home time, garden watering)
        dow = ts.dayofweek
        weekday_factor = 1.0 if dow < 5 else 1.3

        # Seasonal: summer garden watering
        month = ts.month
        if month in [5, 6, 7, 8]:
            seasonal = 1.4
        else:
            seasonal = 1.0

        val = base * seasonal * tod * weekday_factor
        noise = np.random.normal(0, val * 0.12)
        usage.append(max(0.0, val + noise))

    return pd.Series(usage)


def inject_anomalies(series: pd.Series, num_spikes: int = 12, num_drops: int = 6) -> pd.Series:
    """
    Inject synthetic anomalies into a usage series.
    - Spikes: 3-5x the local mean (e.g., appliance malfunction, leak)
    - Drops: near-zero values (e.g., sensor outage, meter error)
    """
    result = series.copy()
    indices = series.index.tolist()

    # Inject spikes
    spike_indices = random.sample(indices, num_spikes)
    for idx in spike_indices:
        local_mean = series[max(0, idx - 24):idx + 24].mean()
        multiplier = random.uniform(3.0, 5.0)
        result.iloc[idx] = local_mean * multiplier

    # Inject drops
    drop_indices = random.sample([i for i in indices if i not in spike_indices], num_drops)
    for idx in drop_indices:
        result.iloc[idx] = result.iloc[idx] * random.uniform(0.05, 0.15)

    return result


def main():
    print("Generating synthetic utility consumption data...")

    timestamps = pd.date_range(start=START_DATE, periods=DAYS * 24, freq="h")

    # Generate base series
    elec_usage = generate_electricity(timestamps)
    water_usage = generate_water(timestamps)

    # Inject anomalies
    elec_usage = inject_anomalies(elec_usage, num_spikes=15, num_drops=8)
    water_usage = inject_anomalies(water_usage, num_spikes=12, num_drops=6)

    # Build DataFrames
    elec_df = pd.DataFrame({
        "timestamp": timestamps,
        "meter_type": "electricity",
        "usage": elec_usage.round(3),
        "unit": "kWh"
    })

    water_df = pd.DataFrame({
        "timestamp": timestamps,
        "meter_type": "water",
        "usage": water_usage.round(3),
        "unit": "L"
    })

    # Combine and sort
    df = pd.concat([elec_df, water_df], ignore_index=True)
    df = df.sort_values(["timestamp", "meter_type"]).reset_index(drop=True)

    # Save
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Dataset saved to: {OUTPUT_PATH}")
    print(f"   Total rows: {len(df):,}")
    print(f"   Date range: {timestamps[0]} to {timestamps[-1]}")
    print(f"   Electricity rows: {len(elec_df):,}")
    print(f"   Water rows: {len(water_df):,}")
    print(f"\n   Sample:\n{df.head(4).to_string(index=False)}")


if __name__ == "__main__":
    main()

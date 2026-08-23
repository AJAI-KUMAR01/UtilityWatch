"""
NVIDIA API Client
===============
Calls the NVIDIA OpenAI-compatible API to generate plain-language energy-saving recommendations.

Model: nvidia/nemotron-3.5-lightning-30b-a3b
Uses a 3-step agentic pipeline: Analyze -> Reason -> Recommend.
"""

import json
import logging
import os
import time

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

PRIMARY_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"

_client = None

def _get_client() -> OpenAI:
    """Lazy-initialize the OpenAI client."""
    global _client
    if _client is None:
        api_key = os.environ.get("NVIDIA_API_KEY", "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")
        _client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
    return _client

def build_summary_text(summary: dict) -> str:
    meter_type = summary.get("meter_type", "utility")
    unit = summary.get("unit", "units")
    avg_daily = summary.get("avg_daily_usage", "N/A")
    total_usage = summary.get("total_usage", "N/A")
    total_cost = summary.get("total_cost", "N/A")
    anomaly_count = summary.get("anomaly_count", 0)
    peak_day = summary.get("peak_day", {})
    avg_monthly_cost = summary.get("avg_monthly_cost", "N/A")
    forecast_trend = summary.get("forecast_trend", "stable")
    rate = summary.get("rate_per_unit", "N/A")

    return f"""## Utility Summary
- **Meter Type**: {meter_type.capitalize()}
- **Unit**: {unit}
- **Average Daily Usage**: {avg_daily} {unit}
- **Total Usage (Period)**: {total_usage} {unit}
- **Total Cost (Period)**: ₹{total_cost} INR
- **Average Monthly Cost**: ₹{avg_monthly_cost} INR
- **Tariff Rate**: ₹{rate} per {unit}
- **Anomalies Detected**: {anomaly_count} unusual usage spikes or drops
- **Peak Usage Day**: {peak_day.get('date', 'N/A')} ({peak_day.get('usage', 'N/A')} {unit}, ₹{peak_day.get('cost', 'N/A')})
- **Forecast Trend**: {forecast_trend}"""

def _call_model(messages: list) -> str:
    client = _get_client()
    completion = client.chat.completions.create(
        model=PRIMARY_MODEL,
        messages=messages,
        temperature=0.4,
        max_tokens=2048,
        top_p=0.9,
    )
    return completion.choices[0].message.content.strip()

def get_recommendations(summary: dict) -> dict:
    """
    Send usage summary to NVIDIA and return structured recommendations.
    Uses a 3-step pipeline.
    """
    meter_type = summary.get("meter_type", "utility")
    summary_text = build_summary_text(summary)
    
    # Step 1: Analyze
    t0 = time.time()
    try:
        logger.info("Starting Step 1 (Analyze)...")
        messages = [
            {"role": "system", "content": "You are a highly knowledgeable energy efficiency consultant."},
            {"role": "user", "content": f"Analyze the following utility consumption summary and identify key trends, issues, and notable figures. Keep it to a short paragraph.\n\n{summary_text}"}
        ]
        analysis = _call_model(messages)
    except Exception as e:
        logger.error(f"Step 1 (Analyze) failed: {e}")
        raise Exception(f"Step 1 (Analyze) failed: {str(e)}")
    t1 = time.time()
    logger.info(f"Step 1 (Analyze) took {t1 - t0:.2f} seconds")

    # Step 2: Reason
    try:
        logger.info("Starting Step 2 (Reason)...")
        messages.append({"role": "assistant", "content": analysis})
        messages.append({"role": "user", "content": "Think step-by-step about why the usage is at this level, what the anomalies or peaks might mean, and what practical steps the user could take to reduce consumption. Provide a short paragraph of reasoning."})
        reasoning = _call_model(messages)
    except Exception as e:
        logger.error(f"Step 2 (Reason) failed: {e}")
        raise Exception(f"Step 2 (Reason) failed: {str(e)}")
    t2 = time.time()
    logger.info(f"Step 2 (Reason) took {t2 - t1:.2f} seconds")

    # Step 3: Recommend
    try:
        logger.info("Starting Step 3 (Recommend)...")
        messages.append({"role": "assistant", "content": reasoning})
        messages.append({"role": "user", "content": f"""Provide exactly 5-7 specific, actionable, and practical recommendations to help the user reduce their {meter_type} usage and costs.
Each recommendation must be specific to {meter_type} consumption. Include estimated savings percentage or amount where possible. Keep each recommendation to 2-3 sentences maximum. End with a brief one-sentence motivational summary.

Format your response exactly as a JSON object with this structure:
{{
  "recommendations": [
    {{"id": 1, "title": "Short Title", "detail": "Detailed explanation...", "estimated_savings": "X%"}},
    ...
  ],
  "summary": "One-sentence motivational closing."
}}"""})
        # Add system prompt for JSON
        messages[0] = {"role": "system", "content": "You are a highly knowledgeable energy efficiency consultant. Always respond in valid JSON format when requested."}
        recs_json_str = _call_model(messages)
    except Exception as e:
        logger.error(f"Step 3 (Recommend) failed: {e}")
        raise Exception(f"Step 3 (Recommend) failed: {str(e)}")
    t3 = time.time()
    logger.info(f"Step 3 (Recommend) took {t3 - t2:.2f} seconds")
    
    # Parse JSON
    start_idx = recs_json_str.find('{')
    end_idx = recs_json_str.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        recs_json_str = recs_json_str[start_idx:end_idx + 1]

    try:
        result = json.loads(recs_json_str)
    except json.JSONDecodeError:
        result = {
            "recommendations": [
                {
                    "id": 1,
                    "title": "Analysis Result",
                    "detail": "Failed to parse recommendations properly, but here is the raw output: " + recs_json_str,
                    "estimated_savings": "N/A",
                }
            ],
            "summary": "Please review the information above.",
        }

    result["analysis"] = analysis
    result["reasoning"] = reasoning
    result["model_used"] = PRIMARY_MODEL
    result["primary_model"] = PRIMARY_MODEL
    result["fallback_used"] = False

    return result

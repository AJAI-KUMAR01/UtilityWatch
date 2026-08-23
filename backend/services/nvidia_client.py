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
import re

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

def build_prompt(summary: dict) -> str:
    """
    Construct a structured prompt from usage summary stats using the 3-step Agentic Pipeline.
    """
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

    prompt = f"""You are an expert energy efficiency consultant. Use a 3-step process to analyze and provide recommendations.
    
1. ANALYZE: Review the utility consumption summary below.
2. REASON: Think step-by-step about why the usage is at this level, what anomalies might mean, and what practical steps the user could take to reduce consumption.
3. RECOMMEND: Provide 5-7 specific, actionable, and practical recommendations to help the user reduce their {meter_type} usage and costs.

## Utility Summary
- **Meter Type**: {meter_type.capitalize()}
- **Unit**: {unit}
- **Average Daily Usage**: {avg_daily} {unit}
- **Total Usage (Period)**: {total_usage} {unit}
- **Total Cost (Period)**: ₹{total_cost} INR
- **Average Monthly Cost**: ₹{avg_monthly_cost} INR
- **Tariff Rate**: ₹{rate} per {unit}
- **Anomalies Detected**: {anomaly_count} unusual usage spikes or drops
- **Peak Usage Day**: {peak_day.get('date', 'N/A')} ({peak_day.get('usage', 'N/A')} {unit}, ₹{peak_day.get('cost', 'N/A')})
- **Forecast Trend**: {forecast_trend}

## Instructions for Recommendations
1. Provide exactly 5-7 recommendations numbered as a list.
2. Each recommendation must be specific to {meter_type} consumption.
3. Include estimated savings percentage or amount where possible.
4. Keep each recommendation to 2-3 sentences maximum.
5. End with a brief one-sentence motivational summary.
6. Do NOT make up data — base advice strictly on the statistics above.

Format your response exactly as a JSON object with this structure:
{{
  "analysis": "Your analysis of the data...",
  "reasoning": "Your reasoning for the recommendations...",
  "recommendations": [
    {{"id": 1, "title": "Short Title", "detail": "Detailed explanation...", "estimated_savings": "X%"}},
    ...
  ],
  "summary": "One-sentence motivational closing."
}}"""

    return prompt

def _parse_response(raw_text: str) -> dict:
    """
    Robustly parse the LLM response into a structured dict.
    """
    # Extract JSON substring from the first '{' to the last '}'
    start_idx = raw_text.find('{')
    end_idx = raw_text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        raw_text = raw_text[start_idx:end_idx + 1]

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # Graceful fallback
        return {
            "analysis": "Failed to parse analysis properly.",
            "reasoning": "Failed to parse reasoning properly.",
            "recommendations": [
                {
                    "id": 1,
                    "title": "Analysis Result",
                    "detail": "Failed to parse recommendations properly, but here is the raw output: " + raw_text,
                    "estimated_savings": "N/A",
                }
            ],
            "summary": "Please review the information above.",
        }

def get_recommendations(summary: dict) -> dict:
    """
    Send usage summary to NVIDIA and return structured recommendations.
    """
    client = _get_client()
    prompt = build_prompt(summary)

    try:
        logger.info("Calling NVIDIA API with model: %s", PRIMARY_MODEL)
        completion = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a highly knowledgeable energy efficiency consultant. "
                        "Always respond in valid JSON format exactly as requested. "
                        "Do not include any text outside the JSON object."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=16384,
            top_p=0.9,
            extra_body={"chat_template_kwargs":{"enable_thinking":True},"reasoning_budget":16384}
        )
        
        raw_text = completion.choices[0].message.content.strip()
        result = _parse_response(raw_text)

        result["model_used"] = PRIMARY_MODEL
        result["primary_model"] = PRIMARY_MODEL
        result["fallback_used"] = False

        return result

    except Exception as exc:
        logger.error(f"NVIDIA API model {PRIMARY_MODEL} failed. Exception: {exc}")
        raise

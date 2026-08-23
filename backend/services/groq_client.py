"""
Groq API Client
===============
Calls the Groq API with llama-3.3-70b-versatile to generate
plain-language energy-saving recommendations.

NO RAG — the LLM receives only structured summary stats in the prompt.
The prompt is deterministic and reproducible for a given input.

API key is loaded exclusively from the GROQ_API_KEY environment variable.
It is NEVER hardcoded or logged.
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None


def _get_client() -> Groq:
    """Lazy-initialize the Groq client (avoids import-time failure if key is missing)."""
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY is not set. Add it to backend/.env")
        _client = Groq(api_key=api_key)
    return _client


def build_prompt(summary: dict) -> str:
    """
    Construct a structured prompt from usage summary stats.
    The LLM receives factual context — not retrieved documents.
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

    prompt = f"""You are an expert energy efficiency consultant. Analyze the following utility consumption summary and provide 5-7 specific, actionable, and practical recommendations to help the user reduce their {meter_type} usage and costs.

## Utility Summary
- **Meter Type**: {meter_type.capitalize()}
- **Unit**: {unit}
- **Average Daily Usage**: {avg_daily} {unit}
- **Total Usage (Period)**: {total_usage} {unit}
- **Total Cost (Period)**: ${total_cost} USD
- **Average Monthly Cost**: ${avg_monthly_cost} USD
- **Tariff Rate**: ${rate} per {unit}
- **Anomalies Detected**: {anomaly_count} unusual usage spikes or drops
- **Peak Usage Day**: {peak_day.get('date', 'N/A')} ({peak_day.get('usage', 'N/A')} {unit}, ${peak_day.get('cost', 'N/A')})
- **Forecast Trend**: {forecast_trend}

## Instructions
1. Provide exactly 5-7 recommendations numbered as a list.
2. Each recommendation must be specific to {meter_type} consumption.
3. Include estimated savings percentage or amount where possible.
4. Keep each recommendation to 2-3 sentences maximum.
5. End with a brief one-sentence motivational summary.
6. Do NOT make up data — base advice strictly on the statistics above.

Format your response as a JSON object with this structure:
{{
  "recommendations": [
    {{"id": 1, "title": "Short Title", "detail": "Detailed explanation...", "estimated_savings": "X%"}},
    ...
  ],
  "summary": "One-sentence motivational closing."
}}"""

    return prompt


def get_recommendations(summary: dict) -> dict:
    """
    Send usage summary to Groq and return structured recommendations.

    Args:
        summary: Dict of usage statistics from analytics services

    Returns:
        dict with 'recommendations' list and 'summary' string
    """
    client = _get_client()
    prompt = build_prompt(summary)

    completion = client.chat.completions.create(
        model="openai/gpt-oss-20b",
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
        temperature=0.4,      # Slightly creative but mostly factual
        max_tokens=1200,
        top_p=0.9,
    )

    raw_text = completion.choices[0].message.content.strip()

    # Strip Qwen's chain-of-thought <think>...</think> block if present
    import re as _re
    raw_text = _re.sub(r"<think>.*?</think>", "", raw_text, flags=_re.DOTALL).strip()

    # Parse JSON response robustly
    import json
    import re

    # Strip markdown code fences if present
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
    raw_text = re.sub(r"\s*```$", "", raw_text, flags=re.MULTILINE)

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError:
        # Graceful fallback — return raw text wrapped in expected structure
        result = {
            "recommendations": [
                {"id": 1, "title": "AI Response", "detail": raw_text, "estimated_savings": "N/A"}
            ],
            "summary": "Please review the recommendation above.",
        }

    return result

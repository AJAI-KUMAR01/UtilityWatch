"""
Groq API Client
===============
Calls the Groq API to generate plain-language energy-saving recommendations.

Model Selection (configurable via environment):
------------------------------------------------
Primary model:  GROQ_MODEL env var (default: llama-3.3-70b-versatile)
Fallback model: GROQ_FALLBACK_MODEL env var (default: openai/gpt-oss-20b)

If the primary model call fails with a model-not-found / access error, the
client automatically retries with the fallback model and annotates the response
with which model was actually used. No silent substitution — the caller always
knows which model served the response.

Why two models?
  - llama-3.3-70b-versatile requires a paid/developer Groq tier.
  - openai/gpt-oss-20b is available on the free tier and produces
    comparable quality recommendations for this structured task.
  - To upgrade: set GROQ_MODEL=llama-3.3-70b-versatile in backend/.env
    and ensure your API key has access to that model at console.groq.com.

NO RAG — the LLM receives only structured summary stats in the prompt.
The prompt is deterministic and reproducible for a given input.

API key is loaded exclusively from the GROQ_API_KEY environment variable.
It is NEVER hardcoded or logged.
"""

import json
import logging
import os
import re

from dotenv import load_dotenv
from groq import Groq, APIStatusError

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model configuration — both read from env, never hardcoded
# ---------------------------------------------------------------------------
PRIMARY_MODEL_DEFAULT = "llama-3.3-70b-versatile"
FALLBACK_MODEL_DEFAULT = "openai/gpt-oss-20b"

PRIMARY_MODEL = os.environ.get("GROQ_MODEL", PRIMARY_MODEL_DEFAULT)
FALLBACK_MODEL = os.environ.get("GROQ_FALLBACK_MODEL", FALLBACK_MODEL_DEFAULT)

# Error codes/messages that indicate a model is unavailable on this API key
_MODEL_NOT_FOUND_CODES = {"model_not_found", "invalid_model", "model_access_denied"}

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


def _call_model(client: Groq, model: str, prompt: str) -> str:
    """
    Make a single Groq chat completion call and return raw content string.
    Raises APIStatusError (or other exceptions) on failure.
    """
    completion = client.chat.completions.create(
        model=model,
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
        max_tokens=1200,
        top_p=0.9,
    )
    return completion.choices[0].message.content.strip()


def _is_model_unavailable(exc: Exception) -> bool:
    """
    Return True if the exception signals that the requested model is not
    available on this API key — so we should retry with the fallback model.
    """
    if not isinstance(exc, APIStatusError):
        return False
    status = exc.status_code
    body = exc.body or {}
    error_code = body.get("error", {}).get("code", "") if isinstance(body, dict) else ""
    error_msg = str(exc).lower()
    return (
        status == 404
        or error_code in _MODEL_NOT_FOUND_CODES
        or "model_not_found" in error_msg
        or "does not exist" in error_msg
        or "do not have access" in error_msg
    )


def _parse_response(raw_text: str) -> dict:
    """
    Robustly parse the LLM response into a structured dict.
    Handles: markdown code fences, <think> blocks (Qwen reasoning models),
    and JSON decode errors (graceful plain-text fallback).
    """
    # Strip chain-of-thought <think>...</think> blocks (e.g. from Qwen models)
    raw_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

    # Strip markdown code fences
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
    raw_text = re.sub(r"\s*```$", "", raw_text, flags=re.MULTILINE)
    raw_text = raw_text.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # Graceful fallback — return the raw text wrapped in expected structure
        return {
            "recommendations": [
                {
                    "id": 1,
                    "title": "AI Response",
                    "detail": raw_text,
                    "estimated_savings": "N/A",
                }
            ],
            "summary": "Please review the recommendation above.",
        }


def get_recommendations(summary: dict) -> dict:
    """
    Send usage summary to Groq and return structured recommendations.

    Tries PRIMARY_MODEL first. If that model is unavailable on this API key
    (404 / model_not_found), automatically retries with FALLBACK_MODEL.
    The response is annotated with 'model_used' so callers know which model ran.

    Args:
        summary: Dict of usage statistics from analytics services

    Returns:
        dict with 'recommendations' list, 'summary' string, and 'model_used' str
    """
    client = _get_client()
    prompt = build_prompt(summary)

    # --- Attempt 1: primary model ---
    model_used = PRIMARY_MODEL
    try:
        logger.info("Calling Groq with primary model: %s", PRIMARY_MODEL)
        raw_text = _call_model(client, PRIMARY_MODEL, prompt)

    except Exception as primary_exc:
        if _is_model_unavailable(primary_exc):
            # Primary model not accessible on this key — use documented fallback
            logger.warning(
                "Primary model '%s' not available (error: %s). "
                "Retrying with fallback model '%s'. "
                "To use the primary model, ensure your Groq API key has access at "
                "console.groq.com and set GROQ_MODEL in backend/.env.",
                PRIMARY_MODEL,
                primary_exc,
                FALLBACK_MODEL,
            )
            model_used = FALLBACK_MODEL
            raw_text = _call_model(client, FALLBACK_MODEL, prompt)
        else:
            # Re-raise unexpected errors (auth failures, rate limits, etc.)
            raise

    result = _parse_response(raw_text)

    # Annotate which model actually served the response
    result["model_used"] = model_used
    result["primary_model"] = PRIMARY_MODEL
    result["fallback_used"] = model_used != PRIMARY_MODEL

    return result

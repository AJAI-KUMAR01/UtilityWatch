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

def _call_model(messages: list, disable_thinking: bool = False) -> str:
    client = _get_client()
    kwargs = {
        "model": PRIMARY_MODEL,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 4096,
        "top_p": 0.9,
    }
    if disable_thinking:
        kwargs["extra_body"] = {"chat_template_kwargs": {"enable_thinking": False}}
    else:
        # Default behavior for steps 1 and 2 if we want it
        kwargs["extra_body"] = {"chat_template_kwargs": {"enable_thinking": True}, "reasoning_budget": 2048}

    completion = client.chat.completions.create(**kwargs)
    return completion.choices[0].message.content.strip()

def get_recommendations(summary: dict) -> dict:
    """
    Send usage summary to NVIDIA and return structured recommendations.
    Uses a single comprehensive prompt to guarantee execution under 30-40 seconds.
    """
    meter_type = summary.get("meter_type", "utility")
    summary_text = build_summary_text(summary)
    
    import re
    def _parse_json(text: str) -> dict:
        text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        json_blocks = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', text, flags=re.DOTALL)
        if json_blocks:
            for block in reversed(json_blocks):
                try:
                    parsed = json.loads(block)
                    if isinstance(parsed, dict) and "recommendations" in parsed:
                        return parsed
                except json.JSONDecodeError:
                    pass
        
        end_idx = text.rfind('}')
        while end_idx != -1:
            start_idx = text.rfind('{', 0, end_idx)
            while start_idx != -1:
                try:
                    candidate = text[start_idx:end_idx + 1]
                    parsed = json.loads(candidate)
                    if isinstance(parsed, dict) and "recommendations" in parsed:
                        return parsed
                except json.JSONDecodeError:
                    pass
                start_idx = text.rfind('{', 0, start_idx)
            end_idx = text.rfind('}', 0, end_idx)
            
        raise ValueError("Valid JSON not found in response")

    t0 = time.time()
    try:
        logger.info("Starting Comprehensive AI Prompt...")
        prompt_content = f"""Analyze the following utility consumption summary, identify key trends/issues, reason about why the usage is at this level, and provide exactly 5-7 specific, actionable recommendations to help the user reduce their {meter_type} usage and costs.

Summary Data:
{summary_text}

Each recommendation must be specific to {meter_type} consumption. Include estimated savings percentage or amount where possible. The 'detail' field for each recommendation should be written as a polished, natural paragraph (2-3 full sentences).
Include a 'greeting' field with a one-sentence personalized opening line summarizing their situation.
Include your analysis and reasoning in the 'analysis' and 'reasoning' fields.

Format your response exactly as a JSON object with this structure (no markdown, just JSON):
{{
  "analysis": "Short paragraph analyzing trends, issues, and notable figures...",
  "reasoning": "Short paragraph of step-by-step reasoning...",
  "greeting": "Personalized opening line...",
  "recommendations": [
    {{"id": 1, "title": "Short Title", "detail": "Polished paragraph explanation...", "estimated_savings": "X%"}}
  ],
  "summary": "One-sentence motivational closing."
}}"""
        
        messages = [
            {"role": "system", "content": "You are a highly knowledgeable energy efficiency consultant. Always respond in valid JSON format."},
            {"role": "user", "content": prompt_content}
        ]
        
        # We leave thinking disabled for this single prompt to guarantee it stays extremely fast (under 30s)
        # while returning the exact JSON structure we need.
        recs_json_str = _call_model(messages, disable_thinking=True)
        
        try:
            result = _parse_json(recs_json_str)
        except ValueError:
            logger.warning("Parsing failed, retrying with stricter prompt...")
            messages.append({"role": "assistant", "content": recs_json_str})
            messages.append({"role": "user", "content": "Failed to parse JSON. Respond with ONLY the JSON object, no reasoning, no explanation, no markdown."})
            recs_json_str_retry = _call_model(messages, disable_thinking=True)
            try:
                result = _parse_json(recs_json_str_retry)
            except ValueError:
                raise Exception("Failed to generate valid JSON recommendations after retry.")
                
    except Exception as e:
        logger.error(f"Comprehensive Prompt failed: {e}")
        raise Exception(f"AI service failed: {str(e)}")
        
    t1 = time.time()
    logger.info(f"AI Pipeline took {t1 - t0:.2f} seconds")

    result["model_used"] = PRIMARY_MODEL
    result["primary_model"] = PRIMARY_MODEL
    result["fallback_used"] = False

    return result

# UtilityWatch — Smart Utility Consumption Analyzer

UtilityWatch is a full-stack web application that helps households and businesses monitor, analyze, and optimize their electricity and water consumption. It ingests time-series utility data, visualizes usage trends with interactive charts, flags anomalies using statistical methods, estimates costs against configurable tariff rates, forecasts future consumption with Holt-Winters exponential smoothing, and leverages the Groq LLM API to generate actionable, plain-language energy-saving recommendations — all in a premium dark-mode dashboard.

---

## Features

- 📊 **Interactive Charts** — Time-series line charts for electricity and water consumption with meter-type toggle
- 🚨 **Anomaly Detection** — Z-score + rolling moving average flags usage spikes and drops
- 💰 **Cost Analysis** — Daily, weekly, and monthly cost estimates against configurable tariff rates
- 🔮 **Forecasting** — Holt-Winters Exponential Smoothing for future consumption projection
- 🤖 **AI Recommendations** — Groq-powered (llama-3.3-70b-versatile, with automatic fallback) plain-language energy-saving tips
- 🌙 **Premium Dark UI** — Glassmorphism cards, smooth animations, responsive layout

---

## Architecture

```
┌─────────────────────────────────────┐
│           Browser (React)           │
│  Dashboard · Charts · AI Panel      │
└────────────────┬────────────────────┘
                 │ HTTP (REST)
                 ▼
┌─────────────────────────────────────┐
│         Flask REST API              │
│  /api/consumption                   │
│  /api/analytics/anomalies           │
│  /api/analytics/cost                │
│  /api/analytics/forecast            │
│  /api/ai/recommendations ──────────►│ Groq API (llama-3.3-70b-versatile)
└────────────────┬────────────────────┘
                 │ pandas
                 ▼
┌─────────────────────────────────────┐
│   Synthetic CSV Dataset             │
│   backend/data/sample_consumption.csv │
└─────────────────────────────────────┘
```

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts |
| Backend    | Python 3.11+, Flask, Flask-CORS     |
| AI         | Groq API — llama-3.3-70b-versatile (fallback: openai/gpt-oss-20b) |
| Analytics  | pandas, numpy, scikit-learn, statsmodels |
| Data       | Synthetic CSV (timestamp, meter_type, usage, unit) |

---

## Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.11
- **Groq API key** — [console.groq.com](https://console.groq.com)

---

## Setup — Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

# Edit .env and add your Groq API key:
# GROQ_API_KEY=gsk_...

# Generate synthetic dataset
python data/generate_data.py

# Start the Flask API
python app.py
# Runs on http://localhost:5000
```

---

## Setup — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# VITE_API_URL is already set to http://localhost:5000

# Start the dev server
npm run dev
# Runs on http://localhost:5173
```

---

## Dataset Schema

File: `backend/data/sample_consumption.csv`

| Column       | Type     | Description                        |
|--------------|----------|------------------------------------|
| `timestamp`  | datetime | ISO 8601 hourly timestamp          |
| `meter_type` | string   | `electricity` or `water`           |
| `usage`      | float    | Consumption value                  |
| `unit`       | string   | `kWh` (electricity) or `L` (water) |

Synthetic data covers 365 days of hourly readings with:
- Seasonal patterns (summer peaks for electricity, morning/evening spikes for water)
- Day-of-week variation
- Injected anomalies (spikes + drops at random intervals)

**Example row:**
```csv
timestamp,meter_type,usage,unit
2024-01-01 00:00:00,electricity,1.25,kWh
```

---

## API Reference

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| `GET`  | `/api/health` | — | Health check |
| `GET`  | `/api/consumption` | `meter_type`, `range` | Time-series data |
| `GET`  | `/api/analytics/anomalies` | `meter_type` | Flagged anomaly points |
| `GET`  | `/api/analytics/cost` | `meter_type`, `rate` | Cost breakdown (daily/weekly/monthly) |
| `GET`  | `/api/analytics/forecast` | `meter_type`, `horizon` | Usage forecast |
| `POST` | `/api/ai/recommendations` | JSON body with summary stats | AI energy-saving recommendations |

---

## AI Model Configuration

UtilityWatch is designed for **`llama-3.3-70b-versatile`** as the primary model, with **`openai/gpt-oss-20b`** as an automatic fallback.

### Configuration

| Env Variable | Default | Purpose |
|---|---|---|
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Primary model (paid/developer tier) |
| `GROQ_FALLBACK_MODEL` | `openai/gpt-oss-20b` | Auto-used if primary is unavailable |

### How the fallback works

The fallback logic lives in `backend/services/groq_client.py`. If the primary model call returns a `model_not_found` / 404 error, the backend automatically retries with the fallback model. The response includes `model_used` and `fallback_used` fields — the frontend displays the actual model name and shows a `FALLBACK` badge when the fallback ran.

### Accessing `llama-3.3-70b-versatile`

`llama-3.3-70b-versatile` requires a **paid or developer-tier Groq API key**. To enable it:

1. Upgrade your Groq account at [console.groq.com](https://console.groq.com)
2. Verify your key has access to `llama-3.3-70b-versatile` in the Models tab
3. Your `backend/.env` already has `GROQ_MODEL=llama-3.3-70b-versatile` — no code changes needed

If your key is on the free tier, `openai/gpt-oss-20b` is used automatically and produces high-quality recommendations for this structured task.

---

## Screenshots

> _Screenshots coming soon — run locally to see the dashboard._

---

## Live Demo

[Add your deployed link here]

---

## License

MIT © 2024 UtilityWatch

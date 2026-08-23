# ⚡ UtilityWatch — Smart Utility Consumption Analyzer

**An AI-powered platform that monitors electricity and water consumption, detects anomalies, forecasts usage, and delivers intelligent energy-saving recommendations.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-utilitywatch01.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://utilitywatch01.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-AJAI--KUMAR01/UtilityWatch-181717?style=for-the-badge&logo=github)](https://github.com/AJAI-KUMAR01/UtilityWatch)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white)]()
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white)]()
[![NVIDIA AI](https://img.shields.io/badge/NVIDIA_AI-Nemotron-76B900?style=for-the-badge&logo=nvidia&logoColor=white)]()
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)]()
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=white)]()
[![MIT License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)]()

> 📸 *Screenshot — add dashboard image here*

---

## About The Project

UtilityWatch is a smart monitoring platform designed to help users track and analyze their electricity and water consumption. It solves the critical problem of resource waste and bill shock by transforming raw meter data into actionable intelligence. The platform provides interactive time-series dashboards, calculates exact costs in Indian Rupees (₹), detects abnormal usage spikes in real-time, forecasts future consumption, and leverages advanced AI to provide personalized energy-saving advice.

Built by Ajai Kumar as a capstone project for the Electrical and Electronics Engineering AI Training program, demonstrating applied AI, full-stack development, and real-world data analytics.

## ✅ Key Features

- **⚡ Electricity & 💧 Water consumption monitoring** — full year time-series dashboard
- **🔍 Anomaly detection using Z-Score and moving average** — flags abnormal spikes and drops
- **💸 Cost analysis in Indian Rupees (₹)** — daily, weekly, monthly, and yearly breakdown
- **📈 30-day usage forecasting** — Holt-Winters Exponential Smoothing
- **🤖 Agentic AI energy-saving recommendations** — NVIDIA Nemotron via NVIDIA NIM API
- **📂 Upload your own CSV** — "My Data" mode for fully personalized, real-data analysis
- **🔄 Demo mode** — 17,520 rows of synthetic data with injected anomalies for instant exploration
- **📱 Fully mobile-responsive** — works seamlessly on phones, tablets, and desktops
- **🔒 Secure by design** — all API keys stored server-side, never exposed to the browser

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                       USER BROWSER                      │
│              React 18 + Vite + Tailwind CSS             │
│        Deployed → https://utilitywatch01.vercel.app     │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API over HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                       FLASK BACKEND                     │
│         Deployed → https://utilitywatch.onrender.com    │
│                                                         │
│     /api/consumption         /api/analytics/anomalies   │
│     /api/analytics/cost      /api/analytics/forecast    │
│     /api/ai/recommendations  /api/data/user-upload      │
│                                                         │
│     anomaly_detection.py     forecasting.py             │
│     cost_analysis.py         nvidia_client.py           │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
             ▼                          ▼
   ┌────────────────────┐   ┌─────────────────────────────┐
   │ sample_consumption │   │        NVIDIA NIM API       │
   │ .csv (17,520 rows) │   │  nemotron-3.5-lightning-30b │
   │ or User CSV Upload │   │    (Agentic AI Pipeline)    │
   └────────────────────┘   └─────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts |
| **Backend** | Python 3, Flask, Flask-CORS, Gunicorn |
| **AI Model** | NVIDIA NIM — nemotron-3.5-lightning-30b-a3b |
| **Analytics** | Pandas, NumPy, Statsmodels (Holt-Winters), Scikit-learn |
| **Deployment — Frontend** | Vercel |
| **Deployment — Backend** | Render |
| **Version Control** | Git + GitHub |

## 📁 Project Structure

```text
UtilityWatch/
├── backend/
│   ├── data/
│   │   └── sample_consumption.csv   # 17,520-row synthetic dataset
│   ├── routes/
│   │   ├── ai_routes.py             # AI recommendations endpoint
│   │   ├── analytics_routes.py      # Anomaly, cost, forecast endpoints
│   │   └── data_routes.py           # Consumption data + CSV upload
│   ├── services/
│   │   ├── anomaly_detection.py     # Z-score + moving average logic
│   │   ├── cost_analysis.py         # INR cost calculations
│   │   ├── forecasting.py           # Holt-Winters forecasting
│   │   └── nvidia_client.py         # NVIDIA NIM API client
│   ├── app.py                       # Flask app entry point
│   ├── render.yaml                  # Render deployment config
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/              # Dashboard UI components
│   │   ├── pages/                   # Page-level views
│   │   └── api/                     # Axios API client
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json                  # SPA routing config
│   └── .env.example
├── .gitignore
└── README.md
```

## 🚀 Local Setup

**Prerequisites**
- Node.js 18 or higher
- Python 3.10 or higher
- Git
- NVIDIA NIM API key (free at https://build.nvidia.com)

**1. Clone the repository**
```bash
git clone https://github.com/AJAI-KUMAR01/UtilityWatch.git
cd UtilityWatch
```

**2. Backend setup**
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# macOS / Linux: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Open .env and add your NVIDIA_API_KEY
python app.py
# Backend running at http://localhost:5000
```

**3. Frontend setup (in a new terminal)**
```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL is already set to http://localhost:5000 for local dev
npm run dev
# Frontend running at http://localhost:5173
```

## 🔐 Environment Variables

**`backend/.env.example`**
```env
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env.example`**
```env
VITE_API_URL=http://localhost:5000
```

> ⚠️ **Never commit `.env` files.** They are gitignored. For production, set these variables in Render's dashboard (backend) and Vercel's dashboard (frontend).

## 📡 API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| **GET** | `/api/health` | Health check — returns `{"status": "ok"}` |
| **GET** | `/api/consumption` | Time-series consumption data |
| **GET** | `/api/analytics/anomalies` | Anomaly detection results |
| **GET** | `/api/analytics/cost` | Cost breakdown in ₹ |
| **GET** | `/api/analytics/forecast` | 30-day Holt-Winters forecast |
| **POST** | `/api/ai/recommendations` | NVIDIA AI energy-saving recommendations |
| **POST** | `/api/data/user-upload` | Upload custom CSV (My Data mode) |

*Common query parameters: `meter_type=electricity|water` · `source=demo|user` · `rate=<₹ tariff>` · `horizon=<days>`*

## 📂 CSV Upload Format (My Data Mode)

Upload a CSV file with these exact columns to analyze your own consumption data:

```csv
timestamp,meter_type,usage,unit
2024-01-01 06:00,electricity,3.5,kWh
2024-01-01 06:00,water,120,L
2024-01-02 07:00,electricity,4.1,kWh
2024-01-02 07:00,water,95,L
```

| Column | Format | Values |
| --- | --- | --- |
| **timestamp** | YYYY-MM-DD HH:MM | Any valid datetime |
| **meter_type** | string | `electricity` or `water` |
| **usage** | number | Consumption amount |
| **unit** | string | `kWh` (electricity) or `L` (water) |

## 🤖 Agentic AI Pipeline

This project satisfies the "Agentic AI" paradigm specified in the capstone brief. The `/api/ai/recommendations` endpoint implements a structured, multi-stage intelligence pipeline:

**How it works:**
1. **Analytics Layer** — backend services compute real consumption statistics: total usage, average daily load, anomaly count and timestamps, cost breakdown, and 30-day forecast direction.
2. **AI Synthesis** — these structured stats are passed to NVIDIA Nemotron via NVIDIA NIM with an engineered prompt that instructs the model to reason about the user's specific patterns and generate 5-7 actionable, personalized recommendations with estimated savings in ₹ or percentage.
3. **JSON Mode Enforcement** — the NVIDIA NIM API is called with `response_format={"type": "json_object"}` to guarantee perfectly structured, parseable output every time — no raw text dumps, no parsing failures.
4. **Personalization** — in "My Data" mode, the pipeline runs against the user's actual uploaded CSV, producing genuinely different, data-specific recommendations compared to the demo dataset.

This demonstrates agentic behavior through data-aware reasoning, structured tool output, and context-sensitive personalized responses — not just generic prompting.

## 🌐 Deployment

| Service | Platform | URL |
| --- | --- | --- |
| **Frontend** | Vercel | [https://utilitywatch01.vercel.app](https://utilitywatch01.vercel.app) |
| **Backend API** | Render | [https://utilitywatch.onrender.com](https://utilitywatch.onrender.com) |

*Free tier note: The backend runs on Render's free tier. Free instances spin down after periods of inactivity — the first request after idle time may take 30–60 seconds to wake up. This is expected on free-tier hosting.*

## 📸 Screenshots

*Add dashboard screenshots here by dragging images into this section on GitHub*

## 👤 Author

**Ajai Kumar**  
Electrical and Electronics Engineering — AI Training Capstone Project  
GitHub: [@AJAI-KUMAR01](https://github.com/AJAI-KUMAR01)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- [NVIDIA NIM](https://build.nvidia.com/) — hosted LLM inference platform
- [Render](https://render.com/) — backend cloud hosting
- [Vercel](https://vercel.com/) — frontend deployment platform
- [Recharts](https://recharts.org/) — React charting library
- [Statsmodels](https://www.statsmodels.org/) — Holt-Winters forecasting

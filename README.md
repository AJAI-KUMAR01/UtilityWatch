# UtilityWatch — Smart Utility Consumption Analyzer

UtilityWatch is a full-stack web application that helps households and businesses monitor, analyze, and optimize their electricity and water consumption. It ingests time-series utility data, visualizes usage trends with interactive charts, flags anomalies using statistical methods, estimates costs against configurable tariff rates, forecasts future consumption with Holt-Winters exponential smoothing, and leverages the NVIDIA Nemotron AI model to generate actionable, plain-language energy-saving recommendations — all in a premium dark-mode dashboard.

---

## 🚀 Features

- 📊 **Interactive Charts** — Time-series line charts for electricity and water consumption with meter-type toggle
- 🚨 **Anomaly Detection** — Z-score + rolling moving average flags usage spikes and drops
- 💰 **Cost Analysis** — Daily, weekly, and monthly cost estimates against configurable tariff rates (₹ INR)
- 🔮 **Forecasting** — Holt-Winters Exponential Smoothing for 30-day future consumption projection
- 🤖 **Agentic AI Recommendations** — Powered by NVIDIA Nemotron-3.5-Lightning. Uses a 3-step reasoning pipeline (Analyze → Reason → Recommend) to provide highly personalized efficiency tips.
- 🌙 **Premium Dark UI** — Glassmorphism cards, smooth animations, and responsive layouts built with Tailwind CSS.

---

## 🏗️ Architecture

```text
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
│  /api/ai/recommendations ──────────►│ NVIDIA NIM API (Nemotron)
└────────────────┬────────────────────┘
                 │ pandas
                 ▼
┌─────────────────────────────────────┐
│   User Uploads & Synthetic Data     │
│   backend/data/*.csv                │
└─────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| **Frontend**   | React 18, Vite, Tailwind CSS, Recharts |
| **Backend**    | Python 3.11+, Flask, Flask-CORS, Gunicorn |
| **AI**         | NVIDIA NIM API (`nvidia/nemotron-3.5-lightning-30b-a3b`) |
| **Analytics**  | pandas, numpy, scikit-learn, statsmodels |
| **Data**       | CSV Data Ingestion (Demo and User Uploads) |

---

## 🌐 Live Demo

- **Frontend:** [Vercel URL here]
- **Backend:** [Render URL here]

---

## ⚙️ Agentic AI Pipeline

UtilityWatch utilizes an advanced 3-step Agentic AI pipeline for its recommendation engine. Instead of a single prompt, the backend explicitly orchestrates three sequential LLM calls:
1. **Analyze**: The model receives raw summary statistics and outputs a factual analysis of the current trends.
2. **Reason**: The model uses the analysis to "think out loud" about the root causes of the usage patterns and anomalies.
3. **Recommend**: The model takes its own reasoning and synthesizes it into 5-7 actionable, polished recommendations, returning them as a strict JSON payload.

---

## 📂 "My Data" CSV Upload Format

You can upload your own utility data directly from the dashboard! The application expects a `.csv` file with the following columns:

| Column       | Type     | Description                        |
|--------------|----------|------------------------------------|
| `timestamp`  | datetime | ISO 8601 hourly timestamp          |
| `meter_type` | string   | `electricity` or `water`           |
| `usage`      | float    | Consumption value                  |
| `unit`       | string   | `kWh` (electricity) or `L` (water) |

**Example Row:**
```csv
timestamp,meter_type,usage,unit
2024-01-01 00:00:00,electricity,1.25,kWh
```

---

## 🚀 Deployment

UtilityWatch is configured for seamless deployment across Vercel and Render.

### 1. Backend (Render)
1. Connect your repository to Render and create a new **Web Service**.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `gunicorn app:app`
4. **Environment Variables**:
   - `NVIDIA_API_KEY`: Your NVIDIA API key
   - `ALLOWED_ORIGINS`: The URL of your deployed frontend (e.g., `https://utilitywatch.vercel.app`)

### 2. Frontend (Vercel)
1. Import the project into Vercel. Ensure the framework preset is **Vite**.
2. **Root Directory**: `frontend`
3. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://utilitywatch-api.onrender.com`)

---

## 🛠️ Local Development

### Prerequisites
- **Node.js** ≥ 18.x
- **Python** ≥ 3.11
- **NVIDIA API key** — [build.nvidia.com](https://build.nvidia.com/)

### Setup — Backend

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

# Edit .env and add your NVIDIA_API_KEY.

# Start the Flask API
python app.py
# Runs on http://localhost:5000
```

### Setup — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

# Start the dev server
npm run dev
# Runs on http://localhost:5173
```

---

## 📸 Screenshots

> _Screenshots coming soon — run locally or visit the live demo to see the dashboard._

---

## 📄 License

MIT © 2024 UtilityWatch

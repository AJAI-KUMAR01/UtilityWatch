import { useState } from 'react';
import { Sparkles, ChevronRight, Loader2, Lightbulb, Zap, Droplets } from 'lucide-react';
import { fetchRecommendations } from '../api/client';

function RecommendationCard({ rec, index, meterType }) {
  const [expanded, setExpanded] = useState(false);

  const colors = [
    'border-cyan-500/20 hover:border-cyan-500/40',
    'border-violet-500/20 hover:border-violet-500/40',
    'border-emerald-500/20 hover:border-emerald-500/40',
    'border-amber-500/20 hover:border-amber-500/40',
    'border-rose-500/20 hover:border-rose-500/40',
    'border-sky-500/20 hover:border-sky-500/40',
    'border-fuchsia-500/20 hover:border-fuchsia-500/40',
  ];
  const dotColors = [
    'bg-cyan-400', 'bg-violet-400', 'bg-emerald-400',
    'bg-amber-400', 'bg-rose-400', 'bg-sky-400', 'bg-fuchsia-400',
  ];

  return (
    <div
      className={`rounded-xl bg-navy-900/50 border ${colors[index % colors.length]} p-4 cursor-pointer transition-all duration-300 animate-slide-up`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => setExpanded(!expanded)}
      id={`recommendation-${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`h-8 w-8 rounded-full ${dotColors[index % dotColors.length]} bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-1`}>
            {meterType === 'water' ? (
              <Droplets className={`h-4 w-4 ${dotColors[index % dotColors.length].replace('bg-', 'text-')}`} />
            ) : (
              <Zap className={`h-4 w-4 ${dotColors[index % dotColors.length].replace('bg-', 'text-')}`} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {rec.title || `Recommendation ${index + 1}`}
            </p>
            {rec.estimated_savings && rec.estimated_savings !== 'N/A' && (
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md px-1.5 py-0.5">
                Save ~{rec.estimated_savings}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </div>

      {expanded && (
        <div className="mt-4 pl-11 animate-fade-in">
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
            {rec.detail}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AIRecommendations({ costData, anomalyData, forecastData, meterType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFetch = async () => {
    if (!costData?.summary) return;

    setLoading(true);
    setError(null);

    try {
      // Compute forecast trend from forecast data
      let forecastTrend = 'stable';
      if (forecastData?.forecast?.length >= 2) {
        const first = forecastData.forecast[0].usage;
        const last = forecastData.forecast[forecastData.forecast.length - 1].usage;
        const delta = ((last - first) / first) * 100;
        if (delta > 5) forecastTrend = 'increasing';
        else if (delta < -5) forecastTrend = 'decreasing';
      }

      const { summary } = costData;
      const avgDailyUsage = summary.total_usage / Math.max(
        (forecastData?.historical?.length || 365), 1
      );

      const payload = {
        meter_type: meterType,
        unit: meterType === 'electricity' ? 'kWh' : 'L',
        avg_daily_usage: parseFloat(avgDailyUsage.toFixed(2)),
        total_usage: summary.total_usage,
        total_cost: parseFloat(summary.total_cost.toFixed(2)),
        avg_monthly_cost: parseFloat(summary.avg_monthly_cost.toFixed(2)),
        rate_per_unit: costData.rate_per_unit,
        anomaly_count: anomalyData?.flagged_count ?? 0,
        peak_day: summary.peak_day || {},
        forecast_trend: forecastTrend,
      };

      const data = await fetchRecommendations(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {!result && !loading && (
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20">
            <Sparkles className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200 mb-1">AI-Powered Insights</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Get personalized energy-saving recommendations based on your actual usage data
            </p>
          </div>
          <button
            id="ai-recommendations-btn"
            onClick={handleFetch}
            disabled={!costData}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Sparkles className="h-4 w-4" />
            Generate Recommendations
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-3 animate-fade-in">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Analyzing your consumption data...</p>
          <p className="text-xs text-slate-600">Powered by NVIDIA Nemotron (30b)</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center py-6 gap-3 animate-fade-in">
          <p className="text-sm text-red-400 font-semibold">Failed to get recommendations</p>
          <p className="text-xs text-slate-500 text-center max-w-xs">{error}</p>
          <button
            onClick={handleFetch}
            className="px-4 py-2 text-xs font-medium text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {result && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              {result.recommendations?.length || 0} Recommendations
            </h3>
            <div className="ml-auto flex items-center gap-1.5">
              {result.fallback_used && (
                <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md">
                  FALLBACK
                </span>
              )}
              <span className="text-[10px] text-slate-500">
                {result.model_used || 'nvidia'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {(result.recommendations || []).map((rec, i) => (
              <RecommendationCard key={i} rec={rec} index={i} meterType={meterType} />
            ))}
          </div>

          {result.summary && (
            <div className="bg-gradient-to-r from-cyan-500/5 to-violet-500/5 border border-cyan-500/10 rounded-xl p-3">
              <p className="text-xs text-slate-400 italic">{result.summary}</p>
            </div>
          )}

          <button
            id="ai-refresh-btn"
            onClick={() => { setResult(null); setError(null); }}
            className="mt-3 text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3" />
            Generate new recommendations
          </button>
        </div>
      )}
    </div>
  );
}

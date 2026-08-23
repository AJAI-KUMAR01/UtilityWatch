import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Droplets, RefreshCw, Activity, BarChart3,
  TrendingUp, Sparkles, AlertCircle, Brain
} from 'lucide-react';
import ConsumptionChart from '../components/ConsumptionChart';
import ForecastChart from '../components/ForecastChart';
import CostCards from '../components/CostCards';
import AnomalyPanel from '../components/AnomalyPanel';
import AIRecommendations from '../components/AIRecommendations';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  fetchConsumption, fetchAnomalies, fetchCost, fetchForecast
} from '../api/client';

function SectionCard({ id, title, icon: Icon, children, className = '', accentColor = 'cyan' }) {
  const accent = {
    cyan: 'from-cyan-500/10',
    violet: 'from-violet-500/10',
    amber: 'from-amber-500/10',
    red: 'from-red-500/10',
    emerald: 'from-emerald-500/10',
  };
  const iconColors = {
    cyan: 'text-cyan-400 bg-cyan-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    red: 'text-red-400 bg-red-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
  };

  return (
    <div
      id={id}
      className={`relative rounded-2xl bg-navy-800/50 backdrop-blur-sm border border-slate-800/60 overflow-hidden ${className}`}
    >
      {/* Gradient top edge */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent[accentColor]} to-transparent`} />

      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${iconColors[accentColor]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

function MeterToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-navy-900/60 border border-slate-800/60 rounded-xl p-1">
      {[
        { id: 'electricity', label: 'Electricity', icon: Zap, color: 'text-cyan-400' },
        { id: 'water', label: 'Water', icon: Droplets, color: 'text-violet-400' },
      ].map(({ id, label, icon: Icon, color }) => (
        <button
          key={id}
          id={`toggle-${id}`}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
            value === id
              ? 'bg-navy-700 text-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon className={`h-3.5 w-3.5 ${value === id ? color : ''}`} />
          {label}
        </button>
      ))}
    </div>
  );
}

function useAsyncData(fetcher, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export default function Dashboard() {
  const [meterType, setMeterType] = useState('electricity');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: consumptionData, loading: cLoading, error: cError, reload: cReload } =
    useAsyncData(() => fetchConsumption(meterType, 'year', 'daily'), [meterType]);

  const { data: anomalyData, loading: aLoading, error: aError, reload: aReload } =
    useAsyncData(() => fetchAnomalies(meterType), [meterType]);

  const { data: costData, loading: costLoading, error: costError, reload: costReload } =
    useAsyncData(() => fetchCost(meterType), [meterType]);

  const { data: forecastData, loading: fLoading, error: fError, reload: fReload } =
    useAsyncData(() => fetchForecast(meterType, 30), [meterType]);

  const handleRefresh = () => {
    cReload(); aReload(); costReload(); fReload();
    setLastRefresh(new Date());
  };

  const unit = meterType === 'electricity' ? 'kWh' : 'L';
  const meterIcon = meterType === 'electricity' ? Zap : Droplets;

  return (
    <div className="min-h-screen bg-navy-950 font-sans">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-emerald-500/4 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/60 bg-navy-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">UtilityWatch</h1>
                <p className="text-[10px] text-slate-500 tracking-wider uppercase">Smart Consumption Analyzer</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live • {lastRefresh.toLocaleTimeString()}</span>
              </div>
              <button
                id="refresh-all-btn"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 hover:text-slate-300 transition-all duration-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Meter toggle + summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm">
              Monitoring <span className="text-white font-semibold capitalize">{meterType}</span> consumption · Last 12 months
            </p>
          </div>
          <MeterToggle value={meterType} onChange={setMeterType} />
        </div>

        {/* Cost Cards */}
        <section id="cost-section" aria-label="Cost Analysis">
          {costLoading && <LoadingSpinner text="Calculating costs..." />}
          {costError && <ErrorMessage message={costError} onRetry={costReload} />}
          {!costLoading && !costError && costData && (
            <CostCards costData={costData} meterType={meterType} />
          )}
        </section>

        {/* Main charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Consumption chart (larger) */}
          <SectionCard
            id="consumption-section"
            title="Usage Over Time"
            icon={BarChart3}
            accentColor="cyan"
            className="xl:col-span-3"
          >
            {cLoading && <LoadingSpinner text="Loading consumption data..." />}
            {cError && <ErrorMessage message={cError} onRetry={cReload} />}
            {!cLoading && !cError && (
              <ConsumptionChart
                data={consumptionData?.data || []}
                anomalies={anomalyData?.anomalies || []}
                meterType={meterType}
              />
            )}
          </SectionCard>

          {/* Anomaly panel */}
          <SectionCard
            id="anomaly-section"
            title="Anomaly Detection"
            icon={AlertCircle}
            accentColor="red"
            className="xl:col-span-2"
          >
            {aLoading && <LoadingSpinner text="Scanning for anomalies..." />}
            {aError && <ErrorMessage message={aError} onRetry={aReload} />}
            {!aLoading && !aError && (
              <AnomalyPanel anomalyData={anomalyData} meterType={meterType} />
            )}
          </SectionCard>
        </div>

        {/* Forecast + AI row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Forecast chart */}
          <SectionCard
            id="forecast-section"
            title="30-Day Forecast (Holt-Winters)"
            icon={TrendingUp}
            accentColor="violet"
            className="xl:col-span-3"
          >
            {fLoading && <LoadingSpinner text="Generating forecast..." />}
            {fError && <ErrorMessage message={fError} onRetry={fReload} />}
            {!fLoading && !fError && forecastData && (
              <>
                <ForecastChart
                  historical={forecastData.historical || []}
                  forecast={forecastData.forecast || []}
                  meterType={meterType}
                />
                <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 bg-cyan-400 rounded-full" />
                    <span>Historical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 border-b-2 border-dashed border-violet-400 rounded-full" />
                    <span>Forecast ({forecastData.model?.replace(/_/g, ' ')})</span>
                  </div>
                </div>
              </>
            )}
          </SectionCard>

          {/* AI Recommendations */}
          <SectionCard
            id="ai-section"
            title="AI Recommendations"
            icon={Brain}
            accentColor="amber"
            className="xl:col-span-2"
          >
            <AIRecommendations
              costData={costData}
              anomalyData={anomalyData}
              forecastData={forecastData}
              meterType={meterType}
            />
          </SectionCard>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pt-4 border-t border-slate-800/40">
          <p>UtilityWatch · Groq AI (llama-3.3-70b-versatile / fallback: gpt-oss-20b) · Flask + React</p>
        </footer>
      </main>
    </div>
  );
}

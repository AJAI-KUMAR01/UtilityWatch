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
import logoUrl from '../assets/logo.svg';
import {
  fetchConsumption, fetchAnomalies, fetchCost, fetchForecast, uploadData
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
      className={`relative rounded-2xl bg-navy-800/50 backdrop-blur-md border border-slate-800/60 overflow-hidden shadow-xl shadow-black/20 hover:border-slate-700/60 hover:shadow-black/40 transition-all duration-300 ${className}`}
    >
      {/* Gradient top edge */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent[accentColor]} to-transparent opacity-50`} />

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
  const [dataSource, setDataSource] = useState('demo');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Custom Rates (INR)
  const [elecRate, setElecRate] = useState(8.00);
  const [waterRate, setWaterRate] = useState(0.05);
  const currentRate = meterType === 'electricity' ? elecRate : waterRate;

  const { data: consumptionData, loading: cLoading, error: cError, reload: cReload } =
    useAsyncData(() => fetchConsumption(meterType, 'year', 'daily', dataSource), [meterType, dataSource]);

  const { data: anomalyData, loading: aLoading, error: aError, reload: aReload } =
    useAsyncData(() => fetchAnomalies(meterType, dataSource), [meterType, dataSource]);

  const { data: costData, loading: costLoading, error: costError, reload: costReload } =
    useAsyncData(() => fetchCost(meterType, currentRate, dataSource), [meterType, currentRate, dataSource]);

  const { data: forecastData, loading: fLoading, error: fError, reload: fReload } =
    useAsyncData(() => fetchForecast(meterType, 30, dataSource), [meterType, dataSource]);

  const handleRefresh = () => {
    cReload(); aReload(); costReload(); fReload();
    setLastRefresh(new Date());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadData(file);
      setDataSource('user');
      handleRefresh();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
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
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 relative">
                <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full" />
                <img src={logoUrl} alt="UtilityWatch" className="h-full w-full object-contain relative z-10 drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-tight">UtilityWatch</h1>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium">Smart Analyzer</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-navy-900/60 border border-slate-800/60 rounded-xl p-1 mr-4">
                <button
                  onClick={() => setDataSource('demo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    dataSource === 'demo' ? 'bg-navy-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Demo Data
                </button>
                <button
                  onClick={() => setDataSource('user')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    dataSource === 'user' ? 'bg-navy-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  My Data
                </button>
              </div>

              <div className="relative overflow-hidden">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  disabled={isUploading}
                />
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-all duration-200 pointer-events-none">
                  {isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  Upload CSV
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 ml-2">
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
          
          {/* Meter toggle + summary + Rate Editor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm">
                Monitoring <span className="text-white font-semibold capitalize">{meterType}</span> consumption · {dataSource === 'demo' ? 'Last 12 months' : 'Custom Dataset'}
              </p>
              {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-navy-900/60 border border-slate-800/60 rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-400 font-medium">Rate: ₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={currentRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (meterType === 'electricity') setElecRate(val);
                    else setWaterRate(val);
                  }}
                  className="bg-transparent border-b border-slate-700 w-16 text-xs text-white focus:outline-none focus:border-cyan-400 text-center"
                />
                <span className="text-xs text-slate-400 font-medium">/{unit}</span>
              </div>
              <MeterToggle value={meterType} onChange={setMeterType} />
            </div>
          </div>

          {dataSource === 'user' && (!consumptionData || !consumptionData.data || consumptionData.data.length === 0) && !cLoading ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-navy-900/40 rounded-3xl border border-slate-800/60 shadow-xl">
              <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <Activity className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">No data uploaded yet</h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6">
                Click "Upload CSV" above to get started. Ensure your CSV has columns: <br/>
                <code className="text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded text-xs mt-2 inline-block">timestamp, meter_type, usage, unit</code>
              </p>
            </div>
          ) : (
            <>
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
      
              {/* Forecast Row (Full Width) */}
              <SectionCard
                id="forecast-section"
                title="30-Day Forecast (Holt-Winters)"
                icon={TrendingUp}
                accentColor="violet"
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
      
              {/* AI Recommendations Row (Full Width) */}
              <SectionCard
                id="ai-section"
                title="Agentic AI Recommendations"
                icon={Brain}
                accentColor="amber"
              >
                <AIRecommendations
                  costData={costData}
                  anomalyData={anomalyData}
                  forecastData={forecastData}
                  meterType={meterType}
                />
              </SectionCard>
            </>
          )}
  
          <footer className="text-center text-xs text-slate-600 pt-4 border-t border-slate-800/40">
            <p>UtilityWatch · NVIDIA Nemotron AI (nemotron-3.5-lightning-30b-a3b) · Flask + React</p>
          </footer>
        </main>
    </div>
  );
}

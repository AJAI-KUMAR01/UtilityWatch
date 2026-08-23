import { AlertTriangle, Zap, Droplets, Clock, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function AnomalyBadge({ method }) {
  const map = {
    z_score: { label: 'Z-Score', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    rolling: { label: 'Rolling Avg', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    both: { label: 'Both', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  };
  const { label, color } = map[method] || map.both;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${color}`}>
      {label}
    </span>
  );
}

export default function AnomalyPanel({ anomalyData, meterType }) {
  const anomalies = anomalyData?.anomalies || [];
  const thresholds = anomalyData?.thresholds || {};
  const unit = meterType === 'electricity' ? 'kWh' : 'L';
  const Icon = meterType === 'electricity' ? Zap : Droplets;

  if (!anomalyData) return null;

  return (
    <div className="animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Flagged Points', value: anomalyData.flagged_count ?? 0, color: 'text-red-400' },
          { label: 'Total Points', value: anomalyData.total_points ?? 0, color: 'text-slate-300' },
          { label: 'Global Mean', value: `${thresholds.global_mean ?? 0} ${unit}`, color: 'text-cyan-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-navy-900/60 rounded-xl p-3 border border-slate-800/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Anomaly list */}
      {anomalies.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm text-emerald-400 font-semibold">No anomalies detected</p>
          <p className="text-xs text-slate-500">Usage patterns look normal</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {anomalies.slice(0, 20).map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-navy-900/40 border border-slate-800/40 rounded-xl px-3 py-2.5 hover:bg-navy-900/70 transition-colors duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-xs text-slate-300 font-medium">
                      {format(parseISO(a.timestamp), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-300 font-semibold font-mono">
                      {a.usage} {unit}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (z={a.z_score})
                    </span>
                  </div>
                </div>
              </div>
              <AnomalyBadge method={a.method} />
            </div>
          ))}
          {anomalies.length > 20 && (
            <p className="text-center text-xs text-slate-500 py-2">
              +{anomalies.length - 20} more anomalies
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import { IndianRupee, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ id, icon: Icon, label, value, subValue, accent = 'cyan', trend }) {
  const accentMap = {
    cyan: {
      border: 'border-cyan-500/20',
      icon: 'bg-cyan-500/10 text-cyan-400',
      value: 'text-cyan-400',
    },
    violet: {
      border: 'border-violet-500/20',
      icon: 'bg-violet-500/10 text-violet-400',
      value: 'text-violet-400',
    },
    emerald: {
      border: 'border-emerald-500/20',
      icon: 'bg-emerald-500/10 text-emerald-400',
      value: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/20',
      icon: 'bg-amber-500/10 text-amber-400',
      value: 'text-amber-400',
    },
  };
  const colors = accentMap[accent] || accentMap.cyan;

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-xl bg-[#111827] backdrop-blur-sm border border-white/5 p-5 flex flex-col gap-3 hover:border-slate-600/60 transition-all duration-200 group animate-slide-up`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${colors.icon}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold ${colors.value} font-mono`}>{value}</p>
        {subValue && (
          <p className="text-xs text-slate-500 mt-1">{subValue}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          {trend > 0
            ? <TrendingUp className="h-3.5 w-3.5 text-red-400" />
            : <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
          }
          <span className={`text-xs font-medium ${trend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs avg
          </span>
        </div>
      )}
    </div>
  );
}

export default function CostCards({ costData, meterType }) {
  if (!costData?.summary) return null;

  const { summary } = costData;
  const unit = meterType === 'electricity' ? 'kWh' : 'L';
  const currency = summary.currency || 'INR';

  const fmtCost = (v) => `₹${Number(v).toFixed(2)}`;
  const fmtUsage = (v) => `${Number(v).toFixed(1)} ${unit}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      <StatCard
        id="cost-card-daily"
        icon={Calendar}
        label="Avg Daily Cost"
        value={fmtCost(summary.avg_daily_cost)}
        subValue={`Rate: ₹${costData.rate_per_unit}/${unit}`}
        accent="cyan"
      />
      <StatCard
        id="cost-card-weekly"
        icon={TrendingUp}
        label="Avg Weekly Cost"
        value={fmtCost(summary.avg_weekly_cost)}
        subValue={`${(summary.avg_weekly_cost / summary.avg_daily_cost).toFixed(0)} days avg`}
        accent="violet"
      />
      <StatCard
        id="cost-card-monthly"
        icon={IndianRupee}
        label="Avg Monthly Cost"
        value={fmtCost(summary.avg_monthly_cost)}
        subValue="Per calendar month"
        accent="emerald"
      />
      <StatCard
        id="cost-card-total"
        icon={IndianRupee}
        label="Total Cost (Year)"
        value={fmtCost(summary.total_cost)}
        subValue={`${fmtUsage(summary.total_usage)} consumed`}
        accent="amber"
      />
    </div>
  );
}

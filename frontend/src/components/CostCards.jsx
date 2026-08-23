import { IndianRupee, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ id, icon: Icon, label, value, subValue, accent = 'cyan', trend }) {
  const accentMap = {
    purple: {
      border: 'border-[#2a2a2a] border-l-[4px] border-l-[#7c3aed] hover:border-[#3a3a3a] hover:border-l-[#7c3aed]',
      icon: 'bg-[#7c3aed] text-white',
      value: 'text-[#a78bfa]',
    },
    blue: {
      border: 'border-[#2a2a2a] border-l-[4px] border-l-[#2563eb] hover:border-[#3a3a3a] hover:border-l-[#2563eb]',
      icon: 'bg-[#2563eb] text-white',
      value: 'text-[#60a5fa]',
    },
    cyan: {
      border: 'border-[#2a2a2a] border-l-[4px] border-l-[#0891b2] hover:border-[#3a3a3a] hover:border-l-[#0891b2]',
      icon: 'bg-[#0891b2] text-white',
      value: 'text-[#22d3ee]',
    },
    orange: {
      border: 'border-[#2a2a2a] border-l-[4px] border-l-[#d97706] hover:border-[#3a3a3a] hover:border-l-[#d97706]',
      icon: 'bg-[#d97706] text-white',
      value: 'text-[#fbbf24]',
    },
  };
  const colors = accentMap[accent] || accentMap.cyan;

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-xl bg-[#161616] backdrop-blur-sm border p-5 flex flex-col gap-3 transition-all duration-200 group animate-slide-up ${colors.border}`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${colors.icon}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs text-[#888888] font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold ${colors.value} font-mono`}>{value}</p>
        {subValue && (
          <p className="text-xs text-[#4a4a4a] mt-1">{subValue}</p>
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
        accent="purple"
      />
      <StatCard
        id="cost-card-weekly"
        icon={TrendingUp}
        label="Avg Weekly Cost"
        value={fmtCost(summary.avg_weekly_cost)}
        subValue={`${(summary.avg_weekly_cost / summary.avg_daily_cost).toFixed(0)} days avg`}
        accent="blue"
      />
      <StatCard
        id="cost-card-monthly"
        icon={IndianRupee}
        label="Avg Monthly Cost"
        value={fmtCost(summary.avg_monthly_cost)}
        subValue="Per calendar month"
        accent="cyan"
      />
      <StatCard
        id="cost-card-total"
        icon={IndianRupee}
        label="Total Cost (Year)"
        value={fmtCost(summary.total_cost)}
        subValue={`${fmtUsage(summary.total_usage)} consumed`}
        accent="orange"
      />
    </div>
  );
}

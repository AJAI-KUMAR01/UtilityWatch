import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl p-3 shadow-xl text-xs text-white">
      <p className="text-[#888888] mb-1 font-medium">
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value} {unit}
        </p>
      ))}
    </div>
  );
};

const AnomalyDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.isAnomaly) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fca5a5" strokeWidth={2} opacity={0.9} />
      <circle cx={cx} cy={cy} r={10} fill="#ef4444" opacity={0.15} />
    </g>
  );
};

export default function ConsumptionChart({ data, anomalies, meterType, loading }) {
  const unit = meterType === 'electricity' ? 'kWh' : 'L';
  const color = '#7c3aed';

  // Merge anomaly flags into data
  const anomalyDates = new Set(
    (anomalies || []).map((a) => a.timestamp?.slice(0, 10))
  );

  const chartData = (data || []).map((d) => ({
    ...d,
    isAnomaly: anomalyDates.has(d.timestamp?.slice(0, 10)),
  }));

  const formatXAxis = (tick) => {
    try { return format(parseISO(tick), 'MMM d'); } catch { return tick; }
  };

  return (
    <div className="w-full animate-fade-in">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            tick={{ fill: '#555555', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#555555', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#555555' }}
          />
          <Area
            type="monotone"
            dataKey="usage"
            name={`Usage (${unit})`}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUsage)"
            dot={<AnomalyDot />}
            activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Anomaly legend */}
      {anomalies?.length > 0 && (
        <div className="flex items-center gap-2 mt-2 px-2">
          <div className="h-3 w-3 rounded-full bg-[#ef4444] border border-[#fca5a5]" />
          <span className="text-xs text-[#888888]">
            {anomalies.length} anomaly point{anomalies.length !== 1 ? 's' : ''} detected
          </span>
        </div>
      )}
    </div>
  );
}

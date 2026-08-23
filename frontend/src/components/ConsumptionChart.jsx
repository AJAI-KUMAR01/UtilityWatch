import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800 border border-slate-700/50 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-1 font-medium">
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
      <circle cx={cx} cy={cy} r={6} fill="#f43f5e" stroke="#fda4af" strokeWidth={2} opacity={0.9} />
      <circle cx={cx} cy={cy} r={10} fill="#f43f5e" opacity={0.15} />
    </g>
  );
};

export default function ConsumptionChart({ data, anomalies, meterType, loading }) {
  const unit = meterType === 'electricity' ? 'kWh' : 'L';
  const color = meterType === 'electricity' ? '#06b6d4' : '#818cf8';

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
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="usage"
            name={`Usage (${unit})`}
            stroke={color}
            strokeWidth={2}
            dot={<AnomalyDot />}
            activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Anomaly legend */}
      {anomalies?.length > 0 && (
        <div className="flex items-center gap-2 mt-2 px-2">
          <div className="h-3 w-3 rounded-full bg-red-500 border border-red-300" />
          <span className="text-xs text-slate-400">
            {anomalies.length} anomaly point{anomalies.length !== 1 ? 's' : ''} detected
          </span>
        </div>
      )}
    </div>
  );
}

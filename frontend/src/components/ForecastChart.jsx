import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl p-3 shadow-xl text-xs text-white">
      <p className="text-[#888888] mb-1 font-medium">
        {label ? format(parseISO(label), 'MMM d, yyyy') : label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {unit}
        </p>
      ))}
    </div>
  );
};

export default function ForecastChart({ historical, forecast, meterType }) {
  const unit = meterType === 'electricity' ? 'kWh' : 'L';

  // Combine: last 90 days of historical + all forecast
  const recentHistorical = (historical || []).slice(-90).map((d) => ({
    date: d.date,
    historical: d.usage,
    forecast: null,
  }));

  // Transition point — overlap last historical day into forecast start
  const forecastData = (forecast || []).map((d) => ({
    date: d.date,
    historical: null,
    forecast: d.usage,
  }));

  // Insert a bridge point if there's history
  if (recentHistorical.length > 0 && forecastData.length > 0) {
    const lastHist = recentHistorical[recentHistorical.length - 1];
    forecastData[0] = { ...forecastData[0], historical: lastHist.historical };
  }

  const combined = [...recentHistorical, ...forecastData];

  // Find the date where forecast starts for the reference line
  const forecastStartDate = forecastData[0]?.date;

  const formatXAxis = (tick) => {
    try { return format(parseISO(tick), 'MMM d'); } catch { return tick; }
  };

  return (
    <div className="w-full animate-fade-in">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={combined} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
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
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#555555' }} />

          {/* Reference line at forecast start */}
          {forecastStartDate && (
            <ReferenceLine
              x={forecastStartDate}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{ value: 'Forecast →', position: 'insideTopRight', fill: '#64748b', fontSize: 10 }}
            />
          )}

          {/* Forecast area fill */}
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            fill="url(#forecastGrad)"
            stroke="#a78bfa"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4, fill: '#a78bfa' }}
            connectNulls
          />

          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="historical"
            name="Historical"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#2563eb' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

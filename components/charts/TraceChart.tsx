'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import { TracePoint } from '@/lib/types';

interface TraceChartProps {
  data: TracePoint[];
  title: string;
  unit: string;
  height?: number;
  showLimits?: boolean;
}

const hasOosPoints = (data: TracePoint[]) =>
  data.some((d) => d.status === 'OOS');

// Using any for tooltip props to avoid Recharts v3 generic type conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip(props: any) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as TracePoint | undefined;
  const isOos = point?.status === 'OOS';

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${isOos ? 'rgba(239,68,68,0.4)' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        minWidth: 160,
      }}
    >
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p
          key={i}
          style={{
            color: isOos ? '#dc2626' : '#4f46e5',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {typeof entry.value === 'number' ? entry.value.toFixed(4) : String(entry.value ?? '')}
        </p>
      ))}
      {point && (
        <div style={{ marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
          <Row label="UCL" value={point.ucl} color="#ef444499" />
          <Row label="Target" value={point.target} color="#22c55e99" />
          <Row label="LCL" value={point.lcl} color="#ef444499" />
          {isOos && (
            <p style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: 700 }}>
              OUT OF SPEC
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
      <span style={{ color: '#64748b', fontSize: 11 }}>{label}</span>
      <span style={{ color, fontSize: 11, fontWeight: 500 }}>{value.toFixed(4)}</span>
    </div>
  );
}

export default function TraceChart({
  data,
  title,
  unit,
  height = 220,
  showLimits = true,
}: TraceChartProps) {
  const oosExists = hasOosPoints(data);
  const gradientId = `traceGrad-${title.replace(/\s+/g, '')}`;
  const areaColor = oosExists ? '#ef4444' : '#6366f1';
  const areaStroke = oosExists ? '#f87171' : '#818cf8';

  const ucl = data[0]?.ucl ?? 0;
  const lcl = data[0]?.lcl ?? 0;
  const target = data[0]?.target ?? 0;

  const oosPoints = data.filter((d) => d.status === 'OOS');

  return (
    <div className="w-full">
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: '#f1f5f9',
              color: 'var(--muted)',
            }}
          >
            {unit}
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={areaColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v: number) => v.toFixed(2)}
          />

          <Tooltip content={CustomTooltip} />

          {showLimits && (
            <>
              <ReferenceLine
                y={ucl}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: 'UCL', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
              />
              <ReferenceLine
                y={target}
                stroke="#22c55e"
                strokeDasharray="2 4"
                strokeWidth={1.5}
                label={{ value: 'TGT', position: 'insideTopRight', fill: '#22c55e', fontSize: 10 }}
              />
              <ReferenceLine
                y={lcl}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: 'LCL', position: 'insideBottomRight', fill: '#ef4444', fontSize: 10 }}
              />
            </>
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={areaStroke}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: areaStroke, stroke: '#ffffff', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-out"
          />

          {oosPoints.map((p, i) => (
            <ReferenceDot
              key={`oos-${i}`}
              x={p.time}
              y={p.value}
              r={5}
              fill="#ef4444"
              stroke="#fca5a5"
              strokeWidth={2}
              label={undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

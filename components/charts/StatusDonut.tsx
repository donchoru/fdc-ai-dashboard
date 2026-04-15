'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: DonutData[];
  size?: number;
  innerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.5rem',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: item.payload?.color ?? '#6366f1',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ color: '#94a3b8', fontSize: 11 }}>{item.name}</span>
      </div>
      <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginTop: 2 }}>
        {item.value}
      </p>
    </div>
  );
}

export default function StatusDonut({
  data,
  size = 160,
  innerRadius,
  centerLabel,
  centerValue,
}: StatusDonutProps) {
  const outerRadius = size / 2 - 4;
  const inner = innerRadius ?? Math.round(outerRadius * 0.62);
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outerRadius}
            paddingAngle={data.length > 1 ? 2 : 0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={CustomTooltip as any} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text overlay */}
      {(centerLabel !== undefined || centerValue !== undefined) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {centerValue !== undefined && (
            <span
              style={{
                color: '#e2e8f0',
                fontSize: size > 140 ? 24 : 18,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {centerValue}
            </span>
          )}
          {centerLabel !== undefined && (
            <span
              style={{
                color: '#64748b',
                fontSize: size > 140 ? 11 : 10,
                marginTop: centerValue !== undefined ? 3 : 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
                maxWidth: inner * 1.6,
                lineHeight: 1.3,
              }}
            >
              {centerLabel}
            </span>
          )}
          {centerValue === undefined && total > 0 && (
            <span
              style={{
                color: '#64748b',
                fontSize: size > 140 ? 11 : 10,
                marginTop: 2,
              }}
            >
              Total: {total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

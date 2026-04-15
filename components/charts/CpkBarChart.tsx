'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CpkBarItem {
  name: string;
  cpk: number;
}

interface CpkBarChartProps {
  data: CpkBarItem[];
  height?: number;
}

function getCpkColor(cpk: number): string {
  if (cpk >= 1.33) return '#22c55e';
  if (cpk >= 1.0) return '#f59e0b';
  return '#ef4444';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const cpk = item.value as number;
  const color = getCpkColor(cpk);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
    >
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>{item.payload.name}</p>
      <p style={{ color, fontSize: 14, fontWeight: 700 }}>
        Cpk {cpk.toFixed(2)}
      </p>
      <p style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>
        {cpk >= 1.33 ? '양호' : cpk >= 1.0 ? '주의' : '이탈'}
      </p>
    </div>
  );
}

export default function CpkBarChart({ data, height = 220 }: CpkBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
          domain={[0, 'auto']}
          tickFormatter={(v: number) => v.toFixed(1)}
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip content={CustomTooltip as any} />

        {/* Target line — Cpk 1.33 */}
        <ReferenceLine
          y={1.33}
          stroke="#22c55e"
          strokeDasharray="4 3"
          strokeWidth={1.5}
          label={{ value: '목표 1.33', position: 'insideTopRight', fill: '#22c55e', fontSize: 10 }}
        />
        {/* Minimum line — Cpk 1.0 */}
        <ReferenceLine
          y={1.0}
          stroke="#ef4444"
          strokeDasharray="4 3"
          strokeWidth={1.5}
          label={{ value: '최소 1.0', position: 'insideBottomRight', fill: '#ef4444', fontSize: 10 }}
        />

        <Bar dataKey="cpk" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCpkColor(entry.cpk)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

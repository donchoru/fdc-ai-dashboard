'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { SpcItem } from '@/lib/types';

interface SpcChartProps {
  data: SpcItem;
  height?: number;
  showZones?: boolean;
}

interface DataPoint {
  index: number;
  label: string;
  value: number;
  isOoc: boolean;
  oocRule?: number;
}

function buildDataPoints(data: SpcItem): DataPoint[] {
  const oocMap = new Map<number, number>();
  data.oocViolations.forEach((v) => oocMap.set(v.index, v.rule));
  return data.recentValues.map((value, i) => ({
    index: i,
    label: `#${i + 1}`,
    value,
    isOoc: oocMap.has(i),
    oocRule: oocMap.get(i),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload as DataPoint | undefined;
  if (!p) return null;

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${p.isOoc ? 'rgba(239,68,68,0.4)' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
    >
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>샘플 {p.label}</p>
      <p style={{
        color: p.isOoc ? '#dc2626' : '#4f46e5',
        fontSize: 14,
        fontWeight: 700,
      }}>
        {p.value.toFixed(4)}
      </p>
      {p.isOoc && (
        <p style={{ color: p.oocRule === 1 ? '#ef4444' : '#f59e0b', fontSize: 10, marginTop: 4, fontWeight: 700 }}>
          {p.oocRule === 1 ? '관리 이탈 (±3σ 초과)' : `패턴 이상 (Rule ${p.oocRule})`}
        </p>
      )}
    </div>
  );
}

export default function SpcChart({
  data,
  height = 240,
  showZones = false,
}: SpcChartProps) {
  const points = buildDataPoints(data);
  const sigma = data.sigma;

  const ucl = data.ucl;
  const lcl = data.lcl;
  const target = data.target;
  const warn2sigPos = target + 2 * sigma;
  const warn2sigNeg = target - 2 * sigma;
  const warn1sigPos = target + sigma;
  const warn1sigNeg = target - sigma;

  const oocSet = new Set(data.oocViolations.map((v) => v.index));

  // Auto Y-axis domain: fit to data range with padding around UCL/LCL
  const allValues = data.recentValues;
  const dataMin = Math.min(...allValues, lcl);
  const dataMax = Math.max(...allValues, ucl);
  const range = dataMax - dataMin;
  const padding = range * 0.15 || 0.1;
  const yDomain: [number, number] = [dataMin - padding, dataMax + padding];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">{data.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{data.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {data.cpk !== undefined && (
            <StatPill label="Cpk" value={data.cpk.toFixed(2)} warn={data.cpk < 1.33} />
          )}
          {data.cp !== undefined && (
            <StatPill label="Cp" value={data.cp.toFixed(2)} warn={data.cp < 1.33} />
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => v.toFixed(3)}
          />

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={CustomTooltip as any} />

          {/* Zone bands (optional) */}
          {showZones && (
            <>
              {/* ±1σ zone — subtle green */}
              <ReferenceArea
                y1={warn1sigNeg}
                y2={warn1sigPos}
                fill="rgba(34,197,94,0.04)"
                ifOverflow="visible"
              />
              {/* ±2σ zone — subtle yellow */}
              <ReferenceArea
                y1={warn2sigNeg}
                y2={warn1sigNeg}
                fill="rgba(245,158,11,0.04)"
                ifOverflow="visible"
              />
              <ReferenceArea
                y1={warn1sigPos}
                y2={warn2sigPos}
                fill="rgba(245,158,11,0.04)"
                ifOverflow="visible"
              />
              {/* ±3σ zone — subtle red */}
              <ReferenceArea
                y1={lcl}
                y2={warn2sigNeg}
                fill="rgba(239,68,68,0.04)"
                ifOverflow="visible"
              />
              <ReferenceArea
                y1={warn2sigPos}
                y2={ucl}
                fill="rgba(239,68,68,0.04)"
                ifOverflow="visible"
              />
            </>
          )}

          {/* UCL */}
          <ReferenceLine
            y={ucl}
            stroke="#ef4444"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: 'UCL', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
          />
          {/* +2σ warning */}
          <ReferenceLine
            y={warn2sigPos}
            stroke="#f59e0b"
            strokeDasharray="2 4"
            strokeWidth={1}
            label={{ value: '+2σ', position: 'insideTopRight', fill: '#f59e0b', fontSize: 9 }}
          />
          {/* Center line (target) */}
          <ReferenceLine
            y={target}
            stroke="#22c55e"
            strokeWidth={1.5}
            label={{ value: 'CL', position: 'insideTopRight', fill: '#22c55e', fontSize: 10 }}
          />
          {/* -2σ warning */}
          <ReferenceLine
            y={warn2sigNeg}
            stroke="#f59e0b"
            strokeDasharray="2 4"
            strokeWidth={1}
            label={{ value: '-2σ', position: 'insideBottomRight', fill: '#f59e0b', fontSize: 9 }}
          />
          {/* LCL */}
          <ReferenceLine
            y={lcl}
            stroke="#ef4444"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: 'LCL', position: 'insideBottomRight', fill: '#ef4444', fontSize: 10 }}
          />

          {/* Main data line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#818cf8"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index } = props;
              const isOoc = oocSet.has(index);
              return (
                <g key={`dot-${index}`}>
                  {isOoc && (
                    <circle cx={cx} cy={cy} r={10} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.3} />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isOoc ? 5 : 3}
                    fill={isOoc ? '#ef4444' : '#6366f1'}
                    stroke={isOoc ? '#fca5a5' : '#e0e7ff'}
                    strokeWidth={isOoc ? 2 : 1}
                    style={isOoc ? { filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' } : undefined}
                  />
                </g>
              );
            }}
            activeDot={{ r: 5, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-out"
          />

          {/* OOC violation markers — extra ring */}
          {data.oocViolations.map((v, i) =>
            v.value !== null ? (
              <ReferenceDot
                key={`ooc-${v.index}-${i}`}
                x={points[v.index]?.label ?? ''}
                y={v.value}
                r={10}
                fill="transparent"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatPill({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center px-2 py-1 rounded-lg"
      style={{
        background: warn ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
        border: `1px solid ${warn ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span
        style={{
          color: warn ? '#d97706' : '#4f46e5',
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
    </div>
  );
}

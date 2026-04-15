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
  type TooltipContentProps,
  type TooltipValueType,
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
}

function buildDataPoints(data: SpcItem): DataPoint[] {
  const oocIndices = new Set(data.oocViolations.map((v) => v.index));
  return data.recentValues.map((value, i) => ({
    index: i,
    label: `#${i + 1}`,
    value,
    isOoc: oocIndices.has(i),
  }));
}

function CustomTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload as DataPoint | undefined;
  if (!p) return null;

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.96)',
        border: `1px solid ${p.isOoc ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '0.5rem',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Sample {p.label}</p>
      <p style={{
        color: p.isOoc ? '#fca5a5' : '#a5b4fc',
        fontSize: 14,
        fontWeight: 700,
      }}>
        {p.value.toFixed(4)}
      </p>
      {p.isOoc && (
        <p style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: 700 }}>
          OUT OF CONTROL
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/80">{data.name}</h3>
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
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
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
            type="linear"
            dataKey="value"
            stroke="#818cf8"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index } = props;
              const isOoc = oocSet.has(index);
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={isOoc ? 5 : 3}
                  fill={isOoc ? '#ef4444' : '#6366f1'}
                  stroke={isOoc ? '#fca5a5' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isOoc ? 2 : 1}
                />
              );
            }}
            activeDot={{ r: 5, fill: '#818cf8', stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-out"
          />

          {/* OOC violation markers — extra ring */}
          {data.oocViolations.map((v) =>
            v.value !== null ? (
              <ReferenceDot
                key={`ooc-${v.index}`}
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
        background: warn ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
        border: `1px solid ${warn ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'}`,
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span
        style={{
          color: warn ? '#fcd34d' : '#a5b4fc',
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

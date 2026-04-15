'use client';

import GlassCard from './GlassCard';

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
}

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export default function KpiCard({
  icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color = '#6366f1',
}: KpiCardProps) {
  return (
    <GlassCard solid hover className="p-5 flex flex-col gap-3 min-w-0">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span
          className="text-2xl leading-none"
          role="img"
          aria-label={label}
        >
          {icon}
        </span>
        {trend && trendValue && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 trend-${trend}`}
            aria-label={`Trend: ${trendValue} ${trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'stable'}`}
          >
            <span aria-hidden="true">{TREND_ICONS[trend]}</span>
            {trendValue}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className="text-3xl font-bold truncate leading-none"
          style={{ color }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {label}
      </p>

      {/* Accent bottom bar */}
      <div
        className="h-0.5 rounded-full mt-auto"
        style={{ background: `linear-gradient(90deg, ${color}60, transparent)` }}
        aria-hidden="true"
      />
    </GlassCard>
  );
}

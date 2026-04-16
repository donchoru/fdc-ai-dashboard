'use client';

import { useMemo } from 'react';
import {
  Settings2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import GlassCard from './GlassCard';

/* ─── Icon map ────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  settings: Settings2,
  alarm: AlertTriangle,
  chart: BarChart3,
  trend: TrendingUp,
};

/* ─── Mini Sparkline ──────────────────────────────────────────────────── */
function MiniSparkline({ color, points = 8 }: { color: string; points?: number }) {
  const data = useMemo(() => {
    const arr: number[] = [];
    let v = 0.4 + Math.random() * 0.2;
    for (let i = 0; i < points; i++) {
      v = Math.max(0.1, Math.min(0.95, v + (Math.random() - 0.5) * 0.25));
      arr.push(v);
    }
    return arr;
  }, [points]);

  const w = 100;
  const h = 24;
  const stepX = w / (data.length - 1);

  const pathD = data
    .map((v, i) => {
      const x = i * stepX;
      const y = h - v * h;
      return i === 0 ? `M${x},${y}` : `L${x},${y}`;
    })
    .join(' ');

  const areaD = `${pathD} L${w},${h} L0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-6 mt-auto"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Props ────────────────────────────────────────────────────────────── */
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
  up: '\u2191',
  down: '\u2193',
  stable: '\u2192',
};

/* ─── KpiCard ──────────────────────────────────────────────────────────── */
export default function KpiCard({
  icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color = '#6366f1',
}: KpiCardProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <GlassCard solid hover className="p-5 flex flex-col gap-3 min-w-0">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
            border: `1px solid ${color}15`,
          }}
        >
          {IconComponent ? (
            <IconComponent size={20} style={{ color }} strokeWidth={2} />
          ) : (
            <span className="text-xl leading-none" role="img" aria-label={label}>
              {icon}
            </span>
          )}
        </div>
        {trend && trendValue && (
          <span
            className={`text-[11px] font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-full trend-${trend}`}
            style={{
              background:
                trend === 'up'
                  ? 'rgba(239,68,68,0.06)'
                  : trend === 'down'
                    ? 'rgba(34,197,94,0.06)'
                    : 'rgba(100,116,139,0.06)',
            }}
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
          className="text-[2rem] font-extrabold truncate leading-none tracking-tight"
          style={{ color }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        {label}
      </p>

      {/* Mini sparkline replacing gradient bar */}
      <MiniSparkline color={color} />
    </GlassCard>
  );
}

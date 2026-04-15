'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ProcessFilter from '@/components/filters/ProcessFilter';
import KpiCard from '@/components/cards/KpiCard';
import GlassCard from '@/components/cards/GlassCard';
import type { SpcItem, ProcessType, SpcStatus } from '@/lib/types';
import { SPC_STATUS_COLORS } from '@/lib/constants';

// Recharts-using components — SSR disabled
const SpcChart = dynamic(() => import('@/components/charts/SpcChart'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpcApiResponse {
  items: SpcItem[];
  count: number;
  cpkSummary: { avg: number | null; min: number | null };
  statusSummary: Record<SpcStatus, number>;
  scenarios?: ScenarioOption[];
}

interface ScenarioOption {
  id: string;
  name: string;
  description: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<SpcStatus, string> = {
  IN_CONTROL: 'In Control',
  WARNING: 'Warning',
  OOC: 'Out of Control',
};

const STATUS_ICON: Record<SpcStatus, string> = {
  IN_CONTROL: '✓',
  WARNING: '⚠',
  OOC: '✕',
};

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
      className="flex flex-col items-center px-2.5 py-1.5 rounded-lg"
      style={{
        background: warn ? 'rgba(245,158,11,0.10)' : 'rgba(99,102,241,0.10)',
        border: `1px solid ${warn ? 'rgba(245,158,11,0.22)' : 'rgba(99,102,241,0.22)'}`,
      }}
    >
      <span
        style={{
          color: '#64748b',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: warn ? '#fcd34d' : '#a5b4fc',
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.3,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function OocViolationList({ item }: { item: SpcItem }) {
  if (item.oocViolations.length === 0) return null;
  return (
    <div
      className="mt-3 rounded-lg p-3 space-y-1.5"
      style={{
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.18)',
      }}
      role="alert"
      aria-label="OOC violations"
    >
      <p
        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: '#f87171' }}
      >
        Western Electric Rule Violations
      </p>
      {item.oocViolations.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <span
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
            style={{
              background: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.35)',
            }}
            aria-hidden="true"
          >
            {v.rule}
          </span>
          <p className="text-[11px] leading-snug" style={{ color: '#fca5a5' }}>
            {v.message}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  item,
  isHighlighted,
}: {
  item: SpcItem;
  isHighlighted: boolean;
}) {
  const isOoc = item.status === 'OOC';
  const isWarn = item.status === 'WARNING';

  const accentColor = isOoc
    ? 'rgba(239,68,68,0.3)'
    : isWarn
    ? 'rgba(245,158,11,0.25)'
    : 'rgba(255,255,255,0.10)';

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: isHighlighted
          ? 'rgba(239,68,68,0.08)'
          : isOoc
          ? 'rgba(239,68,68,0.04)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isHighlighted ? 'rgba(239,68,68,0.5)' : accentColor}`,
        boxShadow: isHighlighted
          ? '0 0 0 2px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.3)'
          : isOoc
          ? '0 4px 20px rgba(0,0,0,0.2)'
          : 'none',
      }}
      aria-label={`SPC chart: ${item.name}`}
    >
      {/* Status badge row */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            color: SPC_STATUS_COLORS[item.status],
            background: `${SPC_STATUS_COLORS[item.status]}18`,
            border: `1px solid ${SPC_STATUS_COLORS[item.status]}35`,
          }}
          role="status"
          aria-label={`Status: ${STATUS_LABELS[item.status]}`}
        >
          <span aria-hidden="true">{STATUS_ICON[item.status]}</span>
          {STATUS_LABELS[item.status]}
        </span>
        <span className="text-[10px]" style={{ color: '#475569' }}>
          n={item.sampleSize} · {item.measurementTool.split(' ')[0]}
        </span>
      </div>

      {/* Chart (SSR-safe dynamic import) */}
      <SpcChart data={item} height={220} showZones />

      {/* Stat pills row */}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.cp !== undefined && (
          <StatPill label="Cp" value={item.cp.toFixed(2)} warn={item.cp < 1.33} />
        )}
        {item.cpk !== undefined && (
          <StatPill label="Cpk" value={item.cpk.toFixed(2)} warn={item.cpk < 1.33} />
        )}
        {item.pp !== undefined && (
          <StatPill label="Pp" value={item.pp.toFixed(2)} warn={item.pp < 1.33} />
        )}
        {item.ppk !== undefined && (
          <StatPill label="Ppk" value={item.ppk.toFixed(2)} warn={item.ppk < 1.33} />
        )}
        {item.mean !== undefined && (
          <StatPill
            label="Mean"
            value={`${item.mean.toFixed(3)} ${item.unit}`}
            warn={false}
          />
        )}
        {item.std !== undefined && (
          <StatPill label="1σ Std" value={item.std.toFixed(4)} warn={false} />
        )}
      </div>

      {/* OOC violations */}
      <OocViolationList item={item} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl h-28"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        ))}
      </div>
      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl h-72"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpcPage() {
  const [process, setProcess] = useState<ProcessType | 'all'>('all');
  const [scenario, setScenario] = useState<string>('NORMAL');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SpcApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSpc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (process !== 'all') params.set('process', process);
      if (scenario !== 'NORMAL') params.set('scenario', scenario);
      params.set('includeScenarios', 'true');
      const res = await fetch(`/api/spc?${params.toString()}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json: SpcApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SPC data');
    } finally {
      setLoading(false);
    }
  }, [process, scenario]);

  useEffect(() => {
    fetchSpc();
  }, [fetchSpc]);

  const scenarios = data?.scenarios ?? [];
  const items = data?.items ?? [];
  const statusSummary = data?.statusSummary ?? { IN_CONTROL: 0, WARNING: 0, OOC: 0 };
  const total = data?.count ?? 0;

  // The chart(s) affected by the current OOC scenario
  const SCENARIO_AFFECTED_KEYS: Record<string, string> = {
    'OOC-DRIFT': 'etch_cd',
    'OOC-SHIFT': 'overlay_x',
    'OOC-SPIKE': 'cmp_removal_rate',
    'OOC-OSCILLATION': 'diffusion_oxide_thickness',
  };
  const highlightedKey = SCENARIO_AFFECTED_KEYS[scenario] ?? null;

  const currentScenarioMeta = scenarios.find((s) => s.id === scenario);

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              SPC Control Charts
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
              Statistical Process Control per{' '}
              <abbr title="Automotive Industry Action Group SPC Manual, 4th Edition">
                AIAG SPC Manual
              </abbr>{' '}
              &amp; Western Electric Rules —{' '}
              <abbr title="International Roadmap for Devices and Systems 2024">
                IRDS 2024
              </abbr>{' '}
              5nm node specifications
            </p>
          </div>

          {/* Cpk summary pill */}
          {data?.cpkSummary.avg !== null && data?.cpkSummary.avg !== undefined && (
            <div
              className="flex items-center gap-4 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Avg Cpk
                </p>
                <p
                  className="text-xl font-bold"
                  style={{
                    color:
                      data.cpkSummary.avg >= 1.33
                        ? '#22c55e'
                        : data.cpkSummary.avg >= 1.0
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
                  {data.cpkSummary.avg.toFixed(2)}
                </p>
              </div>
              {data.cpkSummary.min !== null && (
                <>
                  <div
                    className="w-px h-8 self-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    aria-hidden="true"
                  />
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>
                      Min Cpk
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{
                        color:
                          data.cpkSummary.min >= 1.33
                            ? '#22c55e'
                            : data.cpkSummary.min >= 1.0
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    >
                      {data.cpkSummary.min.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Process Filter ────────────────────────────────────────────── */}
      <section aria-label="Process filter">
        <ProcessFilter selected={process} onChange={setProcess} />
      </section>

      {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="SPC summary"
      >
        <KpiCard
          icon="📊"
          label="Total Items"
          value={total}
          color="#6366f1"
        />
        <KpiCard
          icon="✓"
          label="In Control"
          value={statusSummary.IN_CONTROL}
          color="#22c55e"
          trend={statusSummary.IN_CONTROL === total ? 'stable' : undefined}
          trendValue={statusSummary.IN_CONTROL === total ? '100%' : undefined}
        />
        <KpiCard
          icon="⚠"
          label="Warning"
          value={statusSummary.WARNING}
          color="#f59e0b"
          trend={statusSummary.WARNING > 0 ? 'up' : 'stable'}
          trendValue={
            total > 0
              ? `${Math.round((statusSummary.WARNING / total) * 100)}%`
              : '0%'
          }
        />
        <KpiCard
          icon="✕"
          label="Out of Control"
          value={statusSummary.OOC}
          color="#ef4444"
          trend={statusSummary.OOC > 0 ? 'up' : 'stable'}
          trendValue={
            total > 0
              ? `${Math.round((statusSummary.OOC / total) * 100)}%`
              : '0%'
          }
        />
      </section>

      {/* ── Error State ───────────────────────────────────────────────── */}
      {error && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
          role="alert"
        >
          <span className="text-lg" aria-hidden="true">⚠</span>
          <p className="text-sm" style={{ color: '#fca5a5' }}>
            {error}
          </p>
          <button
            onClick={fetchSpc}
            className="ml-auto text-xs px-3 py-1 rounded-lg transition-colors"
            style={{
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ── SPC Charts Grid ───────────────────────────────────────────── */}
      {!loading && !error && items.length > 0 && (
        <section aria-label="SPC control charts">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <ChartCard
                key={item.key}
                item={item}
                isHighlighted={highlightedKey === item.key}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty State ───────────────────────────────────────────────── */}
      {!loading && !error && items.length === 0 && (
        <GlassCard className="p-12 flex flex-col items-center justify-center gap-3">
          <span className="text-4xl" aria-hidden="true">📈</span>
          <p className="text-sm font-medium text-white/60">
            No SPC data for the selected process
          </p>
        </GlassCard>
      )}

      {/* ── OOC Scenario Demo ─────────────────────────────────────────── */}
      <section aria-label="OOC scenario demonstration">
        <GlassCard solid className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg" aria-hidden="true">🧪</span>
            <div>
              <h2 className="text-sm font-semibold text-white">
                OOC Scenario Demo
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
                Simulate Western Electric Rule violations using injected fault
                patterns — AIAG SPC Manual §4
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label
                htmlFor="scenario-select"
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: '#64748b' }}
              >
                Inject Scenario
              </label>
              <select
                id="scenario-select"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="glass-input px-3 py-2 text-sm text-white appearance-none cursor-pointer"
                style={{ minWidth: 280 }}
                aria-label="Select OOC scenario"
              >
                {scenarios.length > 0
                  ? scenarios.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        style={{ background: '#0f172a' }}
                      >
                        {s.name}
                      </option>
                    ))
                  : (
                    <>
                      <option value="NORMAL" style={{ background: '#0f172a' }}>Normal Operation</option>
                      <option value="OOC-DRIFT" style={{ background: '#0f172a' }}>Gate CD Drift (Rule 3)</option>
                      <option value="OOC-SHIFT" style={{ background: '#0f172a' }}>Overlay X Shift (Rule 2)</option>
                      <option value="OOC-SPIKE" style={{ background: '#0f172a' }}>CMP Rate Spike (Rule 1)</option>
                      <option value="OOC-OSCILLATION" style={{ background: '#0f172a' }}>Oxide Thickness Oscillation (Rule 4)</option>
                    </>
                  )}
              </select>
            </div>

            {/* Scenario description */}
            {currentScenarioMeta && (
              <div
                className="flex-1 min-w-0 px-4 py-3 rounded-xl"
                style={{
                  background:
                    scenario === 'NORMAL'
                      ? 'rgba(34,197,94,0.06)'
                      : 'rgba(239,68,68,0.06)',
                  border:
                    scenario === 'NORMAL'
                      ? '1px solid rgba(34,197,94,0.18)'
                      : '1px solid rgba(239,68,68,0.18)',
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: scenario === 'NORMAL' ? '#86efac' : '#fca5a5',
                  }}
                >
                  {currentScenarioMeta.name}
                </p>
                <p className="text-[11px] mt-1 leading-snug" style={{ color: '#94a3b8' }}>
                  {currentScenarioMeta.description}
                </p>
                {scenario !== 'NORMAL' && highlightedKey && (
                  <p className="text-[10px] mt-1.5" style={{ color: '#64748b' }}>
                    Highlighted chart:{' '}
                    <span style={{ color: '#f87171' }}>
                      {items.find((i) => i.key === highlightedKey)?.name ?? highlightedKey}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* WE Rules reference table */}
          <div
            className="mt-4 rounded-xl p-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: '#64748b' }}
            >
              Western Electric Rules (AIAG SPC §4)
            </p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {[
                { rule: 1, label: '1 point beyond 3σ' },
                { rule: 2, label: '9 consecutive same side' },
                { rule: 3, label: '6 monotone trend' },
                { rule: 5, label: '2 of 3 beyond 2σ' },
              ].map(({ rule, label }) => (
                <div
                  key={rule}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <span
                    className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      background: 'rgba(99,102,241,0.2)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    {rule}
                  </span>
                  <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

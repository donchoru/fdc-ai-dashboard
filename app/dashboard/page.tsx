'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import KpiCard from '@/components/cards/KpiCard';
import EquipmentCard from '@/components/cards/EquipmentCard';
import GlassCard from '@/components/cards/GlassCard';
import AlarmTimeline from '@/components/charts/AlarmTimeline';
import AiReportPanel from '@/components/ai/AiReportPanel';
import { STATUS_COLORS, SEVERITY_COLORS } from '@/lib/constants';
import type { Equipment, Alarm, KpiData, AnomalyScenario } from '@/lib/types';

// ── Dynamic imports for Recharts SSR safety ────────────────────────────────
const StatusDonut = dynamic(() => import('@/components/charts/StatusDonut'), {
  ssr: false,
  loading: () => <DonutSkeleton />,
});

// ── Skeleton helpers ───────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: '#f1f5f9' }}
      aria-hidden="true"
    />
  );
}

function KpiSkeleton() {
  return (
    <GlassCard solid className="p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-24 h-8" />
      <Skeleton className="w-32 h-3" />
    </GlassCard>
  );
}

function EquipmentSkeleton() {
  return (
    <GlassCard solid className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
        <Skeleton className="flex-1 h-4" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
      </div>
      <Skeleton className="h-6 rounded-full" />
    </GlassCard>
  );
}

function DonutSkeleton() {
  return <Skeleton className="w-40 h-40 rounded-full" />;
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {accent && (
        <div
          className="w-1 h-5 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(180deg, #6366f1, #4f46e5)' }}
          aria-hidden="true"
        />
      )}
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Anomaly scenario card ──────────────────────────────────────────────────
function AnomalyCard({
  scenario,
  onAnalyze,
}: {
  scenario: AnomalyScenario;
  onAnalyze: (scenario: AnomalyScenario) => void;
}) {
  const processColors: Record<string, string> = {
    etch: '#f59e0b',
    cvd: '#6366f1',
    litho: '#3b82f6',
    cmp: '#22c55e',
    pvd: '#8b5cf6',
    diffusion: '#ef4444',
  };
  const color = processColors[scenario.process] ?? '#6366f1';

  return (
    <div
      className="glass-card-solid p-4 flex flex-col gap-3"
      style={{ borderLeft: `2px solid ${color}60` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{
                background: `${color}18`,
                color,
                border: `1px solid ${color}35`,
              }}
            >
              {scenario.process.toUpperCase()}
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: 'var(--muted)' }}
            >
              {scenario.id}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {scenario.description}
          </p>
        </div>
      </div>

      {/* Affected parameters */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--muted)' }}
        >
          Affected Parameters
        </p>
        <div className="flex flex-wrap gap-1">
          {scenario.affectedParameters.map((param) => (
            <span
              key={param}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #e2e8f0',
              }}
            >
              {param}
            </span>
          ))}
        </div>
      </div>

      {/* Root cause hint */}
      <div
        className="rounded-lg p-3"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}
      >
        <p
          className="text-[10px] uppercase tracking-wider mb-1"
          style={{ color: '#d97706' }}
        >
          Root Cause Hint
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
          {scenario.rootCause}
        </p>
        {scenario.semiReference && (
          <p
            className="text-[10px] mt-1.5 font-mono"
            style={{ color: '#d97706' }}
          >
            {scenario.semiReference}
          </p>
        )}
      </div>

      {/* AI Analyze button */}
      <button
        onClick={() => onAnalyze(scenario)}
        className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 4px 14px rgba(99,102,241,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 2px 8px rgba(99,102,241,0.25)';
        }}
        aria-label={`AI 분석: ${scenario.description}`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        AI 분석
      </button>
    </div>
  );
}

// ── Line group header ──────────────────────────────────────────────────────
function LineBadge({ line }: { line: string }) {
  const isFabA = line === 'FAB-A';
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="text-xs font-bold px-3 py-1 rounded-full"
        style={{
          background: isFabA
            ? 'rgba(99,102,241,0.15)'
            : 'rgba(34,197,94,0.15)',
          color: isFabA ? '#4f46e5' : '#16a34a',
          border: `1px solid ${isFabA ? 'rgba(99,102,241,0.25)' : 'rgba(34,197,94,0.25)'}`,
        }}
      >
        {line}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: '#e2e8f0' }}
        aria-hidden="true"
      />
    </div>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') ?? undefined;

  // ── State ──────────────────────────────────────────────────────────────
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [anomalyScenarios, setAnomalyScenarios] = useState<AnomalyScenario[]>([]);
  const [equipmentAlarmMap, setEquipmentAlarmMap] = useState<Record<string, number>>({});
  const [equipmentOosMap, setEquipmentOosMap] = useState<Record<string, number>>({});

  const [kpiLoading, setKpiLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [alarmsLoading, setAlarmsLoading] = useState(true);
  const [scenariosLoading, setScenariosLoading] = useState(true);

  // AI Report
  const [aiContent, setAiContent] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeAnalysisScenario, setActiveAnalysisScenario] =
    useState<AnomalyScenario | null>(null);

  // ── Fetchers ───────────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true);
    try {
      const res = await fetch('/api/fdc/overview');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKpiData(data);
    } catch {
      // keep null, show skeleton
    } finally {
      setKpiLoading(false);
    }
  }, []);

  const fetchEquipment = useCallback(async () => {
    setEquipmentLoading(true);
    try {
      const res = await fetch('/api/fdc/equipment');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEquipment(data.equipment ?? []);
    } catch {
      setEquipment([]);
    } finally {
      setEquipmentLoading(false);
    }
  }, []);

  const fetchAlarms = useCallback(async () => {
    setAlarmsLoading(true);
    try {
      const res = await fetch('/api/alarms?limit=10');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlarms(data.alarms ?? []);
    } catch {
      setAlarms([]);
    } finally {
      setAlarmsLoading(false);
    }
  }, []);

  const fetchScenarios = useCallback(async () => {
    setScenariosLoading(true);
    try {
      const res = await fetch('/api/fdc/anomalies');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnomalyScenarios(data.scenarios ?? []);
    } catch {
      setAnomalyScenarios([]);
    } finally {
      setScenariosLoading(false);
    }
  }, []);

  // Fetch per-equipment alarm / OOS counts
  const fetchEquipmentStats = useCallback(async () => {
    try {
      const [alarmsRes, paramsRes] = await Promise.all([
        fetch('/api/alarms'),
        fetch(`/api/fdc/parameters${scenario ? `?scenario=${scenario}` : ''}`),
      ]);
      const alarmsData = await alarmsRes.json();
      const paramsData = await paramsRes.json();

      const alarmMap: Record<string, number> = {};
      (alarmsData.alarms ?? []).forEach((a: Alarm) => {
        if (a.status === 'ACTIVE') {
          alarmMap[a.equipmentId] = (alarmMap[a.equipmentId] ?? 0) + 1;
        }
      });

      const oosMap: Record<string, number> = {};
      (paramsData.parameters ?? []).forEach(
        (p: { equipmentId: string; status: string }) => {
          if (p.status === 'OOS') {
            oosMap[p.equipmentId] = (oosMap[p.equipmentId] ?? 0) + 1;
          }
        }
      );

      setEquipmentAlarmMap(alarmMap);
      setEquipmentOosMap(oosMap);
    } catch {
      // silent
    }
  }, [scenario]);

  useEffect(() => {
    fetchKpi();
    fetchEquipment();
    fetchAlarms();
    fetchScenarios();
    fetchEquipmentStats();
  }, [fetchKpi, fetchEquipment, fetchAlarms, fetchScenarios, fetchEquipmentStats]);

  // ── AI Analyze handler ─────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (targetScenario: AnomalyScenario) => {
    setActiveAnalysisScenario(targetScenario);
    setAiContent('');
    setAiError(null);
    setAiStreaming(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: targetScenario.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            setAiStreaming(false);
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              setAiError(parsed.error);
              setAiStreaming(false);
              return;
            }
            if (parsed.content) {
              setAiContent((prev) => prev + parsed.content);
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setAiStreaming(false);
    }
  }, []);

  // ── Group equipment by line ─────────────────────────────────────────────
  const equipmentByLine = equipment.reduce<Record<string, Equipment[]>>(
    (acc, eq) => {
      (acc[eq.line] = acc[eq.line] ?? []).push(eq);
      return acc;
    },
    {}
  );

  // ── Donut chart data ───────────────────────────────────────────────────
  const equipmentDonutData = kpiData
    ? [
        { name: 'Running', value: kpiData.equipmentByStatus.RUN, color: STATUS_COLORS.RUN },
        { name: 'Idle', value: kpiData.equipmentByStatus.IDLE, color: STATUS_COLORS.IDLE },
        { name: 'Down', value: kpiData.equipmentByStatus.DOWN, color: STATUS_COLORS.DOWN },
        { name: 'PM', value: kpiData.equipmentByStatus.PM, color: STATUS_COLORS.PM },
        {
          name: 'Engineering',
          value: kpiData.equipmentByStatus.ENGINEERING,
          color: STATUS_COLORS.ENGINEERING,
        },
      ].filter((d) => d.value > 0)
    : [];

  const alarmDonutData = kpiData
    ? [
        {
          name: 'Critical',
          value: kpiData.alarmsBySeverity.CRITICAL,
          color: SEVERITY_COLORS.CRITICAL,
        },
        {
          name: 'Warning',
          value: kpiData.alarmsBySeverity.WARNING,
          color: SEVERITY_COLORS.WARNING,
        },
        {
          name: 'Info',
          value: kpiData.alarmsBySeverity.INFO,
          color: SEVERITY_COLORS.INFO,
        },
      ].filter((d) => d.value > 0)
    : [];

  // ── KPI derived values ─────────────────────────────────────────────────
  const cpkColor =
    (kpiData?.avgCpk ?? 0) >= 1.33
      ? '#22c55e'
      : (kpiData?.avgCpk ?? 0) >= 1.0
      ? '#f59e0b'
      : '#ef4444';

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── 1. KPI Row ────────────────────────────────────────────────── */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                icon="⚙️"
                label="Total Equipment"
                value={kpiData?.totalEquipment ?? 0}
                color="#818cf8"
                trend="stable"
                trendValue="12 units"
              />
              <KpiCard
                icon="🚨"
                label="Active Alarms"
                value={kpiData?.activeAlarms ?? 0}
                color={
                  (kpiData?.activeAlarms ?? 0) > 5
                    ? '#ef4444'
                    : (kpiData?.activeAlarms ?? 0) > 2
                    ? '#f59e0b'
                    : '#22c55e'
                }
                trend={
                  (kpiData?.activeAlarms ?? 0) > 5
                    ? 'up'
                    : (kpiData?.activeAlarms ?? 0) === 0
                    ? 'down'
                    : 'stable'
                }
                trendValue={`${kpiData?.activeAlarms ?? 0} active`}
              />
              <KpiCard
                icon="📊"
                label="OOS Parameters"
                value={kpiData?.oosParameters ?? 0}
                color={
                  (kpiData?.oosParameters ?? 0) > 3 ? '#ef4444' : '#f59e0b'
                }
                trend={
                  (kpiData?.oosParameters ?? 0) > 3
                    ? 'up'
                    : (kpiData?.oosParameters ?? 0) === 0
                    ? 'down'
                    : 'stable'
                }
                trendValue="SEMI E164"
              />
              <KpiCard
                icon="📈"
                label="Average Cpk"
                value={kpiData?.avgCpk?.toFixed(2) ?? '—'}
                unit="index"
                color={cpkColor}
                trend={
                  (kpiData?.avgCpk ?? 0) >= 1.33
                    ? 'stable'
                    : (kpiData?.avgCpk ?? 0) >= 1.0
                    ? 'up'
                    : 'down'
                }
                trendValue="AIAG SPC"
              />
            </>
          )}
        </div>
      </section>

      {/* ── 2. Equipment Grid by Line ──────────────────────────────────── */}
      <section aria-label="Equipment Status by Line">
        <SectionHeader
          title="Equipment Overview"
          subtitle="Click any card for detailed FDC traces and parameter analysis"
          accent
        />

        {equipmentLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <EquipmentSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(equipmentByLine)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([line, lineEquipment]) => (
                <div key={line}>
                  <LineBadge line={line} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {lineEquipment.map((eq) => (
                      <EquipmentCard
                        key={eq.equipmentId}
                        equipment={eq}
                        alarmCount={equipmentAlarmMap[eq.equipmentId] ?? 0}
                        oosCount={equipmentOosMap[eq.equipmentId] ?? 0}
                        onClick={() =>
                          router.push(`/equipment/${eq.equipmentId}`)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ── 3. Status Donuts ──────────────────────────────────────────── */}
      <section aria-label="Status Distribution Charts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equipment status */}
          <GlassCard solid className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Equipment Status Distribution
            </h3>
            {kpiLoading ? (
              <div className="flex items-center gap-6">
                <DonutSkeleton />
                <div className="flex-1 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <StatusDonut
                  data={equipmentDonutData}
                  size={160}
                  centerLabel="Equipment"
                  centerValue={kpiData?.totalEquipment}
                />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {equipmentDonutData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between gap-3 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: d.color }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-xs truncate"
                          style={{ color: '#94a3b8' }}
                        >
                          {d.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold flex-shrink-0"
                        style={{ color: d.color }}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Alarm severity */}
          <GlassCard solid className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Alarm Severity Distribution
            </h3>
            {kpiLoading ? (
              <div className="flex items-center gap-6">
                <DonutSkeleton />
                <div className="flex-1 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <StatusDonut
                  data={alarmDonutData}
                  size={160}
                  centerLabel="Total Alarms"
                  centerValue={
                    alarmDonutData.reduce((s, d) => s + d.value, 0)
                  }
                />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {alarmDonutData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between gap-3 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: d.color }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-xs truncate"
                          style={{ color: '#94a3b8' }}
                        >
                          {d.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold flex-shrink-0"
                        style={{ color: d.color }}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                  {/* OEE metric */}
                  {kpiData?.oee !== undefined && (
                    <div
                      className="mt-2 pt-2 flex items-center justify-between gap-3"
                      style={{ borderTop: '1px solid #f1f5f9' }}
                    >
                      <span className="text-xs" style={{ color: '#64748b' }}>
                        OEE
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          color:
                            kpiData.oee >= 80
                              ? '#22c55e'
                              : kpiData.oee >= 60
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {kpiData.oee}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </section>

      {/* ── 4. Active Anomaly Scenarios ───────────────────────────────── */}
      <section aria-label="Active Anomaly Scenarios">
        <SectionHeader
          title="Anomaly Scenarios"
          subtitle={`${anomalyScenarios.length} known failure modes — click AI 분석 to generate root cause analysis`}
          accent
        />

        {scenariosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard solid key={i} className="p-4 flex flex-col gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : anomalyScenarios.length === 0 ? (
          <GlassCard className="p-8 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No anomaly scenarios configured
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {anomalyScenarios.map((s) => (
              <AnomalyCard key={s.id} scenario={s} onAnalyze={handleAnalyze} />
            ))}
          </div>
        )}

        {/* AI Report Panel — appears after AI analyze is triggered */}
        {(activeAnalysisScenario || aiContent || aiStreaming) && (
          <div className="mt-4">
            <AiReportPanel
              title={
                activeAnalysisScenario
                  ? `AI 분석: ${activeAnalysisScenario.description}`
                  : 'AI 분석 리포트'
              }
              onGenerate={() => {
                if (activeAnalysisScenario) handleAnalyze(activeAnalysisScenario);
              }}
              content={aiContent}
              isStreaming={aiStreaming}
              error={aiError}
            />
          </div>
        )}
      </section>

      {/* ── 5. Alarm Timeline ─────────────────────────────────────────── */}
      <section aria-label="Recent Alarm Timeline">
        <GlassCard solid className="p-5">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader
              title="Recent Alarm Timeline"
              subtitle="Latest 10 alarms across all equipment"
              accent
            />
            <a
              href="/alarms"
              className="text-xs font-medium transition-colors"
              style={{ color: '#818cf8' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = '#a5b4fc')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = '#818cf8')
              }
              aria-label="View all alarms"
            >
              View All →
            </a>
          </div>
          {alarmsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="w-14 h-8" />
                  <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                  <Skeleton className="flex-1 h-12 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <AlarmTimeline alarms={alarms} maxItems={10} />
          )}
        </GlassCard>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="glass-card-solid p-5 flex flex-col gap-3"
              >
                <div
                  className="rounded-lg animate-pulse h-8 w-8"
                  style={{ background: '#f1f5f9' }}
                />
                <div
                  className="rounded-lg animate-pulse h-8 w-24"
                  style={{ background: '#f1f5f9' }}
                />
                <div
                  className="rounded-lg animate-pulse h-3 w-32"
                  style={{ background: '#f1f5f9' }}
                />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

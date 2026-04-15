'use client';

import { useState, useEffect, useCallback, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import GlassCard from '@/components/cards/GlassCard';
import StatusBadge from '@/components/badges/StatusBadge';
import ProcessBadge from '@/components/badges/ProcessBadge';
import ParameterTable from '@/components/tables/ParameterTable';
import AlarmTable from '@/components/tables/AlarmTable';
import AiReportPanel from '@/components/ai/AiReportPanel';
import { PROCESS_LABELS } from '@/lib/constants';
import { generateParameterTrace } from '@/lib/trace-generator';
import type {
  Equipment,
  FdcParameter,
  Alarm,
  SpcItem,
  TracePoint,
} from '@/lib/types';

// ── Dynamic chart imports ─────────────────────────────────────────────────
const TraceChart = dynamic(
  () => import('@/components/charts/TraceChart'),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> }
);

const SpcChart = dynamic(
  () => import('@/components/charts/SpcChart'),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> }
);

// ── Skeleton helpers ──────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'rgba(255,255,255,0.06)' }}
      aria-hidden="true"
    />
  );
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="rounded-lg animate-pulse w-full"
      style={{ height, background: 'rgba(255,255,255,0.06)' }}
      aria-hidden="true"
    />
  );
}

function HeaderSkeleton() {
  return (
    <GlassCard solid className="p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2 mt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </GlassCard>
  );
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-1 h-5 rounded-full flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #6366f1, #4f46e5)' }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {count !== undefined && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(99,102,241,0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Meta pill ─────────────────────────────────────────────────────────────
function MetaPill({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div
      className="flex flex-col px-3 py-2 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        className="text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold mt-0.5"
        style={{ color: valueColor ?? '#e2e8f0' }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Trace card wrapper ────────────────────────────────────────────────────
function TraceCardWrapper({
  parameter,
  traceData,
}: {
  parameter: FdcParameter;
  traceData: TracePoint[];
}) {
  const isOos = parameter.status === 'OOS';
  const isWarn = parameter.status === 'WARNING';

  return (
    <div
      className="glass-card-solid p-4"
      style={
        isOos
          ? { borderLeft: '2px solid rgba(239,68,68,0.5)' }
          : isWarn
          ? { borderLeft: '2px solid rgba(245,158,11,0.4)' }
          : undefined
      }
    >
      {/* Parameter header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold truncate"
              style={{
                color: isOos ? '#fca5a5' : isWarn ? '#fcd34d' : '#e2e8f0',
              }}
            >
              {parameter.parameter}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
              style={
                isOos
                  ? {
                      background: 'rgba(239,68,68,0.12)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.25)',
                    }
                  : isWarn
                  ? {
                      background: 'rgba(245,158,11,0.12)',
                      color: '#fcd34d',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }
                  : {
                      background: 'rgba(34,197,94,0.10)',
                      color: '#86efac',
                      border: '1px solid rgba(34,197,94,0.22)',
                    }
              }
            >
              {parameter.status}
            </span>
          </div>
          <p
            className="text-[11px] mt-0.5 truncate"
            style={{ color: 'var(--muted)' }}
            title={parameter.description}
          >
            {parameter.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span
            className="text-base font-bold leading-none"
            style={{
              color: isOos ? '#fca5a5' : isWarn ? '#fcd34d' : '#22c55e',
            }}
          >
            {parameter.value}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {parameter.unit}
          </span>
        </div>
      </div>

      {/* Spec info strip */}
      <div
        className="flex items-center gap-4 mb-3 px-2 py-1.5 rounded-lg text-[11px]"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <span style={{ color: '#64748b' }}>
          Spec: <span style={{ color: '#94a3b8' }}>{parameter.spec}</span>
        </span>
        <span style={{ color: '#64748b' }}>
          UCL: <span style={{ color: '#f87171' }}>{parameter.ucl}</span>
        </span>
        <span style={{ color: '#64748b' }}>
          TGT: <span style={{ color: '#86efac' }}>{parameter.target}</span>
        </span>
        <span style={{ color: '#64748b' }}>
          LCL: <span style={{ color: '#f87171' }}>{parameter.lcl}</span>
        </span>
      </div>

      {/* Trace chart */}
      <TraceChart
        data={traceData}
        title=""
        unit={parameter.unit}
        height={180}
        showLimits
      />
    </div>
  );
}

// ── Inner component using useSearchParams ─────────────────────────────────
function EquipmentDetailContent({
  equipmentId,
}: {
  equipmentId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') ?? undefined;

  // ── State ──────────────────────────────────────────────────────────────
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [parameters, setParameters] = useState<FdcParameter[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [spcItems, setSpcItems] = useState<SpcItem[]>([]);
  const [traceDataMap, setTraceDataMap] = useState<Record<string, TracePoint[]>>({});

  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [paramsLoading, setParamsLoading] = useState(true);
  const [alarmsLoading, setAlarmsLoading] = useState(true);
  const [spcLoading, setSpcLoading] = useState(true);

  const [notFound, setNotFound] = useState(false);

  // AI
  const [aiContent, setAiContent] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTriggered, setAiTriggered] = useState(false);

  // ── Fetchers ───────────────────────────────────────────────────────────
  const fetchEquipment = useCallback(async () => {
    setEquipmentLoading(true);
    try {
      const res = await fetch('/api/fdc/equipment');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.equipment ?? []).find(
        (eq: Equipment) => eq.equipmentId === equipmentId
      );
      if (!found) {
        setNotFound(true);
      } else {
        setEquipment(found);
      }
    } catch {
      setNotFound(true);
    } finally {
      setEquipmentLoading(false);
    }
  }, [equipmentId]);

  const fetchParameters = useCallback(async () => {
    setParamsLoading(true);
    try {
      const qs = new URLSearchParams({ equipmentId });
      if (scenario) qs.set('scenario', scenario);
      const res = await fetch(`/api/fdc/parameters?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const params: FdcParameter[] = data.parameters ?? [];
      setParameters(params);

      // Generate traces client-side for each parameter
      const traceMap: Record<string, TracePoint[]> = {};
      for (const p of params) {
        traceMap[p.parameter] = generateParameterTrace({
          target: p.target,
          ucl: p.ucl,
          lcl: p.lcl,
          anomalyType: p.status === 'OOS' ? 'drift' : null,
          points: 80,
        });
      }
      setTraceDataMap(traceMap);
    } catch {
      setParameters([]);
    } finally {
      setParamsLoading(false);
    }
  }, [equipmentId, scenario]);

  const fetchAlarms = useCallback(async () => {
    setAlarmsLoading(true);
    try {
      const res = await fetch(`/api/alarms?equipmentId=${equipmentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlarms(data.alarms ?? []);
    } catch {
      setAlarms([]);
    } finally {
      setAlarmsLoading(false);
    }
  }, [equipmentId]);

  const fetchSpc = useCallback(async () => {
    if (!equipment) return;
    setSpcLoading(true);
    try {
      const qs = new URLSearchParams({ process: equipment.process });
      if (scenario) qs.set('scenario', scenario);
      const res = await fetch(`/api/spc?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSpcItems(data.items ?? []);
    } catch {
      setSpcItems([]);
    } finally {
      setSpcLoading(false);
    }
  }, [equipment, scenario]);

  useEffect(() => {
    fetchEquipment();
    fetchParameters();
    fetchAlarms();
  }, [fetchEquipment, fetchParameters, fetchAlarms]);

  useEffect(() => {
    if (equipment) fetchSpc();
  }, [equipment, fetchSpc]);

  // ── AI analyze ────────────────────────────────────────────────────────
  const handleAiAnalyze = useCallback(async () => {
    if (!equipment) return;
    setAiTriggered(true);
    setAiContent('');
    setAiError(null);
    setAiStreaming(true);

    // Pick scenario by equipment process
    const processScenarioMap: Record<string, string> = {
      etch: 'SCN-ETCH-001',
      cvd: 'SCN-CVD-001',
      litho: 'SCN-LITHO-001',
      cmp: 'SCN-CMP-001',
      diffusion: 'SCN-DIFF-001',
      pvd: 'SCN-ETCH-001', // fallback
    };
    const targetScenario =
      scenario ?? processScenarioMap[equipment.process] ?? 'SCN-ETCH-001';

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: targetScenario, equipmentId }),
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
            // skip
          }
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setAiStreaming(false);
    }
  }, [equipment, equipmentId, scenario]);

  // ── Derived data ──────────────────────────────────────────────────────
  const oosParameters = parameters.filter((p) => p.status === 'OOS');
  const warningParameters = parameters.filter((p) => p.status === 'WARNING');
  const activeAlarms = alarms.filter((a) => a.status === 'ACTIVE');

  // ── Not Found ─────────────────────────────────────────────────────────
  if (!equipmentLoading && notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)' }}
          aria-hidden="true"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f87171"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Equipment Not Found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Equipment ID <code className="text-red-400">{equipmentId}</code> does not exist
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.35)',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Equipment Header ──────────────────────────────────────────── */}
      {equipmentLoading ? (
        <HeaderSkeleton />
      ) : equipment ? (
        <GlassCard solid className="p-5">
          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')
            }
            aria-label="Back to dashboard"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </button>

          {/* Main header content */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left: name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-xl font-bold text-white">{equipment.name}</h1>
                <StatusBadge status={equipment.status} />
                <ProcessBadge process={equipment.process} full />
              </div>
              <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>
                {equipment.model}
                <span
                  className="mx-2"
                  style={{ color: 'rgba(255,255,255,0.15)' }}
                >
                  ·
                </span>
                {equipment.vendor}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                {equipment.equipmentId}
              </p>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleAiAnalyze}
                disabled={aiStreaming}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                style={{
                  background: aiStreaming
                    ? 'rgba(99,102,241,0.25)'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  boxShadow: aiStreaming
                    ? 'none'
                    : '0 2px 12px rgba(99,102,241,0.35)',
                  cursor: aiStreaming ? 'not-allowed' : 'pointer',
                  opacity: aiStreaming ? 0.7 : 1,
                }}
                aria-label="Run AI analysis for this equipment"
                aria-busy={aiStreaming}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={aiStreaming ? 'animate-spin' : ''}
                  aria-hidden="true"
                >
                  {aiStreaming ? (
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  ) : (
                    <>
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </>
                  )}
                </svg>
                {aiStreaming ? 'Analyzing...' : 'AI 분석'}
              </button>
            </div>
          </div>

          {/* Meta pills row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
            <MetaPill label="Line" value={equipment.line} />
            <MetaPill
              label="Chambers"
              value={`${equipment.chamberCount} ch`}
            />
            <MetaPill
              label="Last PM"
              value={equipment.lastPmDate}
            />
            <MetaPill
              label="Wafers Since PM"
              value={equipment.waferCount.toLocaleString()}
              valueColor={
                equipment.waferCount > 4000
                  ? '#f59e0b'
                  : '#e2e8f0'
              }
            />
            <MetaPill
              label="Active Alarms"
              value={activeAlarms.length}
              valueColor={
                activeAlarms.length > 0 ? '#fca5a5' : '#86efac'
              }
            />
            <MetaPill
              label="OOS Params"
              value={oosParameters.length}
              valueColor={
                oosParameters.length > 0 ? '#fca5a5' : '#86efac'
              }
            />
          </div>

          {/* Process description */}
          <div
            className="mt-4 px-3 py-2.5 rounded-lg text-xs"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ color: '#64748b' }}>Process:</span>{' '}
            <span style={{ color: '#94a3b8' }}>
              {PROCESS_LABELS[equipment.process] ?? equipment.process}
            </span>
          </div>
        </GlassCard>
      ) : null}

      {/* ── AI Report ─────────────────────────────────────────────────── */}
      {aiTriggered && (
        <AiReportPanel
          title={`AI 분석 — ${equipment?.name ?? equipmentId}`}
          onGenerate={handleAiAnalyze}
          content={aiContent}
          isStreaming={aiStreaming}
          error={aiError}
        />
      )}

      {/* ── Parameter Trace Charts ─────────────────────────────────────── */}
      <section aria-label="FDC Parameter Traces">
        <SectionHeader
          title="FDC Parameter Traces"
          subtitle="Real-time 30-second interval FDC traces with UCL/LCL control limits"
          count={parameters.length}
        />

        {paramsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard solid key={i} className="p-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-full mb-3" />
                <ChartSkeleton height={180} />
              </GlassCard>
            ))}
          </div>
        ) : parameters.length === 0 ? (
          <GlassCard className="p-8 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No FDC parameters found for this equipment
            </p>
          </GlassCard>
        ) : (
          <>
            {/* OOS & Warning parameters first */}
            {(oosParameters.length > 0 || warningParameters.length > 0) && (
              <div className="mb-4">
                <div
                  className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span style={{ color: '#fca5a5' }}>
                    {oosParameters.length} OOS
                    {warningParameters.length > 0 &&
                      ` · ${warningParameters.length} WARNING`}{' '}
                    — anomaly detected
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Prioritize OOS → WARNING → NORMAL */}
              {[...oosParameters, ...warningParameters, ...parameters.filter((p) => p.status === 'NORMAL')].map(
                (param) => (
                  <TraceCardWrapper
                    key={param.parameter}
                    parameter={param}
                    traceData={traceDataMap[param.parameter] ?? []}
                  />
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Parameter Table ────────────────────────────────────────────── */}
      <section aria-label="Parameter Table">
        <SectionHeader
          title="Parameter Summary Table"
          subtitle="All FDC parameters with SEMI E164 spec reference"
          count={parameters.length}
        />
        <GlassCard solid className="overflow-hidden">
          {paramsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ParameterTable parameters={parameters} />
          )}
        </GlassCard>
      </section>

      {/* ── SPC Charts ────────────────────────────────────────────────── */}
      {equipment && (
        <section aria-label="SPC Statistical Process Control Charts">
          <SectionHeader
            title={`SPC Charts — ${PROCESS_LABELS[equipment.process] ?? equipment.process}`}
            subtitle="AIAG SPC Manual 4th Ed. Western Electric Rules — Cpk ≥ 1.33 target"
            count={spcItems.length}
          />

          {spcLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <GlassCard solid key={i} className="p-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-3 w-full mb-3" />
                  <ChartSkeleton height={240} />
                </GlassCard>
              ))}
            </div>
          ) : spcItems.length === 0 ? (
            <GlassCard className="p-8 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No SPC data available for this process
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {spcItems.map((item) => (
                <div
                  key={item.key}
                  className="glass-card-solid p-4"
                  style={
                    item.status === 'OOC'
                      ? { borderLeft: '2px solid rgba(239,68,68,0.5)' }
                      : item.status === 'WARNING'
                      ? { borderLeft: '2px solid rgba(245,158,11,0.4)' }
                      : undefined
                  }
                >
                  <SpcChart data={item} height={240} showZones />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Alarm History ─────────────────────────────────────────────── */}
      <section aria-label="Alarm History">
        <SectionHeader
          title="Alarm History"
          subtitle={`All alarms for ${equipmentId}`}
          count={alarms.length}
        />

        <GlassCard solid className="overflow-hidden">
          {alarmsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : alarms.length === 0 ? (
            <div
              className="flex items-center justify-center py-12"
              style={{ color: 'var(--muted)', fontSize: 13 }}
            >
              No alarms found for this equipment
            </div>
          ) : (
            <AlarmTable alarms={alarms} />
          )}
        </GlassCard>
      </section>
    </div>
  );
}

// ── Page export with params unwrap + Suspense ──────────────────────────────
export default function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div
            className="glass-card-solid p-6"
            style={{ height: 200 }}
          >
            <div
              className="rounded-lg animate-pulse w-full h-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              aria-hidden="true"
            />
          </div>
        </div>
      }
    >
      <EquipmentDetailContent equipmentId={equipmentId} />
    </Suspense>
  );
}

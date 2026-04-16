'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProcessFilter from '@/components/filters/ProcessFilter';
import KpiCard from '@/components/cards/KpiCard';
import GlassCard from '@/components/cards/GlassCard';
import SeverityBadge from '@/components/badges/SeverityBadge';
import type { Alarm, AlarmCorrelation, ProcessType, Severity } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';

// Recharts-using components — SSR disabled
const AlarmTable = dynamic(() => import('@/components/tables/AlarmTable'), { ssr: false });
const AlarmTimeline = dynamic(() => import('@/components/charts/AlarmTimeline'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlarmApiResponse {
  alarms: Alarm[];
  count: number;
  summary?: {
    bySeverity: Record<Severity, number>;
    byStatus: Record<string, number>;
  };
}

interface CorrelationApiResponse {
  correlations: EnrichedCorrelation[];
  count: number;
}

interface EnrichedCorrelation extends AlarmCorrelation {
  alarms: Alarm[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_FILTER_OPTIONS: Array<{ value: Severity | 'ALL'; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'CRITICAL', label: '위험' },
  { value: 'WARNING', label: '경고' },
  { value: 'INFO', label: '정보' },
];

const SEVERITY_BUTTON_STYLES: Record<
  Severity | 'ALL',
  { active: { bg: string; color: string; border: string }; inactive: { color: string } }
> = {
  ALL: {
    active: { bg: 'rgba(99,102,241,0.18)', color: '#c7d2fe', border: 'rgba(99,102,241,0.35)' },
    inactive: { color: '#64748b' },
  },
  CRITICAL: {
    active: { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
    inactive: { color: '#64748b' },
  },
  WARNING: {
    active: { bg: 'rgba(245,158,11,0.08)', color: '#d97706', border: 'rgba(245,158,11,0.2)' },
    inactive: { color: '#64748b' },
  },
  INFO: {
    active: { bg: 'rgba(59,130,246,0.08)', color: '#2563eb', border: 'rgba(59,130,246,0.2)' },
    inactive: { color: '#64748b' },
  },
};

// ─── Correlation Panel ────────────────────────────────────────────────────────

function CorrelationArrow() {
  return (
    <span
      className="flex-shrink-0 text-xs font-bold"
      style={{ color: '#475569' }}
      aria-hidden="true"
    >
      →
    </span>
  );
}

function CorrelationChain({ chain }: { chain: EnrichedCorrelation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl p-4 space-y-3 transition-colors duration-150"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Chain header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 leading-tight">
            {chain.name}
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#94a3b8' }}>
            {chain.description}
          </p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 gap-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.22)',
            }}
          >
            {chain.alarms.length}건
          </span>
          <span className="text-[10px]" style={{ color: '#475569' }}>
            {chain.timeWindowMin}분 윈도우
          </span>
        </div>
      </div>

      {/* Alarm sequence flow */}
      <div
        className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 rounded-lg"
        style={{
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
        }}
        aria-label={`Alarm sequence: ${chain.alarmSequence.join(' → ')}`}
      >
        {chain.alarms.length > 0
          ? chain.alarms.map((alarm, idx) => (
              <div key={alarm.id} className="flex items-center gap-1.5">
                {idx > 0 && <CorrelationArrow />}
                <div className="flex flex-col items-center gap-0.5">
                  <SeverityBadge severity={alarm.severity} />
                  <code
                    className="text-[9px] font-mono"
                    style={{ color: '#475569' }}
                  >
                    {alarm.alarmCode}
                  </code>
                </div>
              </div>
            ))
          : chain.alarmSequence.map((id, idx) => (
              <div key={id} className="flex items-center gap-1.5">
                {idx > 0 && <CorrelationArrow />}
                <code
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: '#e2e8f0',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {id}
                </code>
              </div>
            ))}
      </div>

      {/* Equipment pattern */}
      <div className="flex items-center gap-2 text-[11px]">
        <span style={{ color: '#64748b' }}>설비:</span>
        <span
          className="font-medium px-2 py-0.5 rounded"
          style={{
            color: '#64748b',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
          }}
        >
          {chain.equipmentPattern}
        </span>
      </div>

      {/* Root cause hint */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left flex items-center gap-2 text-[11px] group"
        aria-expanded={expanded}
        aria-controls={`root-cause-${chain.id}`}
      >
        <span
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full transition-transform duration-150"
          style={{
            background: 'rgba(245,158,11,0.08)',
            color: '#d97706',
            border: '1px solid rgba(245,158,11,0.2)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        >
          ›
        </span>
        <span
          className="font-medium"
          style={{ color: '#d97706' }}
        >
          근본 원인 힌트
        </span>
      </button>
      {expanded && (
        <div
          id={`root-cause-${chain.id}`}
          className="px-3 py-2.5 rounded-lg text-[11px] leading-relaxed"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#92400e',
          }}
        >
          {chain.rootCauseHint}
        </div>
      )}
    </div>
  );
}

function CorrelationPanel({
  loading,
  correlations,
}: {
  loading: boolean;
  correlations: EnrichedCorrelation[];
}) {
  return (
    <GlassCard className="p-4 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base" aria-hidden="true">🔗</span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">알람 상관관계</h2>
          <p className="text-[11px]" style={{ color: '#64748b' }}>
            인과 체인 및 근본 원인
          </p>
        </div>
        {correlations.length > 0 && (
          <span
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
            aria-label={`${correlations.length} correlation chains`}
          >
            {correlations.length}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl h-28"
              style={{ background: '#f1f5f9' }}
            />
          ))}
        </div>
      )}

      {!loading && correlations.length === 0 && (
        <div
          className="py-8 flex flex-col items-center gap-2"
          style={{ color: '#475569' }}
        >
          <span className="text-2xl" aria-hidden="true">🔍</span>
          <p className="text-xs">상관 체인 없음</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {correlations.map((chain) => (
            <CorrelationChain key={chain.id} chain={chain} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl h-28"
            style={{ background: '#f1f5f9' }}
          />
        ))}
      </div>
      <div
        className="rounded-2xl h-16"
        style={{ background: '#f1f5f9' }}
      />
      <div
        className="rounded-2xl h-96"
        style={{ background: '#f1f5f9' }}
      />
    </div>
  );
}

// ─── Alarms Content ───────────────────────────────────────────────────────────

function AlarmsContent() {
  const searchParams = useSearchParams();
  const urlScenario = searchParams.get('scenario') || 'normal';

  const [process, setProcess] = useState<ProcessType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [correlationsLoading, setCorrelationsLoading] = useState(true);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [correlations, setCorrelations] = useState<EnrichedCorrelation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Fetch alarms ──
  const fetchAlarms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('includeSummary', 'true');
      if (urlScenario !== 'normal') params.set('scenario', urlScenario);
      const res = await fetch(`/api/alarms?${params.toString()}`);
      if (!res.ok) throw new Error(`API 오류 ${res.status}`);
      const json: AlarmApiResponse = await res.json();
      setAlarms(json.alarms);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알람 데이터를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [urlScenario]);

  // ── Fetch correlations ──
  const fetchCorrelations = useCallback(async () => {
    setCorrelationsLoading(true);
    try {
      const res = await fetch('/api/alarms/correlations');
      if (!res.ok) throw new Error(`API 오류 ${res.status}`);
      const json: CorrelationApiResponse = await res.json();
      setCorrelations(json.correlations);
    } catch {
      setCorrelations([]);
    } finally {
      setCorrelationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlarms();
    fetchCorrelations();
  }, [fetchAlarms, fetchCorrelations]);

  // ── Acknowledge handler ──
  const handleAcknowledge = useCallback((id: string) => {
    setAlarms((prev) => {
      const target = prev.find((a) => a.id === id);
      const updated = prev.map((a) =>
        a.id === id ? { ...a, acknowledged: true, status: 'ACKNOWLEDGED' as const } : a,
      );
      if (target) {
        setToast(`알람 ${target.alarmCode} 확인 처리되었습니다.`);
        setTimeout(() => setToast(null), 3000);
      }
      return updated;
    });
  }, []);

  // ── KPI counts (from all alarms) ──
  const kpiCounts = useMemo(() => {
    const counts = { CRITICAL: 0, WARNING: 0, INFO: 0 };
    alarms.forEach((a) => {
      if (a.status !== 'CLEARED') {
        counts[a.severity] = (counts[a.severity] ?? 0) + 1;
      }
    });
    return counts;
  }, [alarms]);

  // ── Unique equipment list for dropdown ──
  const equipmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    alarms.forEach((a) => {
      if (!map.has(a.equipmentId)) map.set(a.equipmentId, a.equipmentName);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [alarms]);

  // ── Client-side filtering ──
  const filteredAlarms = useMemo(() => {
    return alarms.filter((a) => {
      if (process !== 'all' && a.process !== process) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (equipmentFilter !== 'ALL' && a.equipmentId !== equipmentFilter) return false;
      return true;
    });
  }, [alarms, process, severityFilter, equipmentFilter]);

  // ── Recent alarms for timeline (top 15 by time) ──
  const recentAlarms = useMemo(() => {
    return [...alarms]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 15);
  }, [alarms]);

  const activeCount = alarms.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              설비 알람
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
              SEMI E5 / SEMI E164 기반 실시간 알람 관리 — SEMI PV16 알람 분류
            </p>
          </div>

          {/* Active alarms indicator */}
          {activeCount > 0 && (
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
              role="status"
              aria-live="polite"
              aria-label={`${activeCount} active alarms`}
            >
              <span
                className="status-dot down"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                {activeCount} 활성
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label="Alarm severity summary"
      >
        <KpiCard
          icon="🔴"
          label="위험 알람"
          value={kpiCounts.CRITICAL}
          color={SEVERITY_COLORS.CRITICAL}
          trend={kpiCounts.CRITICAL > 0 ? 'up' : 'stable'}
          trendValue={kpiCounts.CRITICAL > 0 ? `${kpiCounts.CRITICAL} 활성` : '정상'}
        />
        <KpiCard
          icon="🟡"
          label="경고 알람"
          value={kpiCounts.WARNING}
          color={SEVERITY_COLORS.WARNING}
          trend={kpiCounts.WARNING > 0 ? 'up' : 'stable'}
          trendValue={kpiCounts.WARNING > 0 ? `${kpiCounts.WARNING} 활성` : '정상'}
        />
        <KpiCard
          icon="🔵"
          label="정보 알람"
          value={kpiCounts.INFO}
          color={SEVERITY_COLORS.INFO}
          trend="stable"
          trendValue={`${kpiCounts.INFO} 전체`}
        />
      </section>

      {/* ── Acknowledge Toast ─────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg"
          style={{
            background: 'rgba(22,163,74,0.12)',
            border: '1px solid rgba(22,163,74,0.3)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeInUp 0.2s ease',
          }}
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium" style={{ color: '#16a34a' }}>
            {toast}
          </span>
        </div>
      )}

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
          <p className="text-sm" style={{ color: '#dc2626' }}>
            {error}
          </p>
          <button
            onClick={fetchAlarms}
            className="ml-auto text-xs px-3 py-1 rounded-lg"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: '#dc2626',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            재시도
          </button>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && !error && (
        <>
          {/* ── Filters Row ─────────────────────────────────────────── */}
          <section
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
            aria-label="Alarm filters"
          >
            {/* Process filter */}
            <ProcessFilter selected={process} onChange={setProcess} />

            {/* Severity filter buttons */}
            <div
              className="flex items-center gap-0.5 rounded-xl p-1"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
              role="group"
              aria-label="Filter by severity"
            >
              {SEVERITY_FILTER_OPTIONS.map((opt) => {
                const isActive = severityFilter === opt.value;
                const styles = SEVERITY_BUTTON_STYLES[opt.value];
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSeverityFilter(opt.value)}
                    aria-pressed={isActive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: isActive ? styles.active.bg : 'transparent',
                      color: isActive ? styles.active.color : styles.inactive.color,
                      border: isActive
                        ? `1px solid ${styles.active.border}`
                        : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(0,0,0,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color =
                          styles.inactive.color;
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {opt.value !== 'ALL' && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: SEVERITY_COLORS[opt.value as Severity] }}
                        aria-hidden="true"
                      />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Equipment dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="equipment-filter"
                className="text-xs flex-shrink-0"
                style={{ color: '#64748b' }}
              >
                설비
              </label>
              <select
                id="equipment-filter"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="glass-input px-2.5 py-1.5 text-xs text-slate-700 appearance-none cursor-pointer"
                aria-label="Filter by equipment"
              >
                <option value="ALL" style={{ background: '#ffffff' }}>
                  전체 설비
                </option>
                {equipmentOptions.map(([id, name]) => (
                  <option
                    key={id}
                    value={id}
                    style={{ background: '#ffffff' }}
                  >
                    {name} ({id})
                  </option>
                ))}
              </select>
            </div>

            {/* Result count */}
            <span
              className="text-xs ml-auto"
              style={{ color: '#475569' }}
              aria-live="polite"
              aria-atomic="true"
            >
              {filteredAlarms.length}건
            </span>
          </section>

          {/* ── Main content: Table + Correlation Sidebar ─────────── */}
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            {/* Alarm Table — main content */}
            <section className="flex-1 min-w-0" aria-label="Alarm table">
              <GlassCard className="overflow-hidden">
                {/* Table header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      알람 목록
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {filteredAlarms.length}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: '#475569' }}>
                    시간/심각도 정렬 가능
                  </p>
                </div>

                {/* Empty state */}
                {filteredAlarms.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <span className="text-4xl" aria-hidden="true">🔔</span>
                    <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                      현재 필터에 해당하는 알람 없음
                    </p>
                    <button
                      onClick={() => {
                        setProcess('all');
                        setSeverityFilter('ALL');
                        setEquipmentFilter('ALL');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        color: '#4f46e5',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}
                    >
                      필터 초기화
                    </button>
                  </div>
                ) : (
                  <AlarmTable
                    alarms={filteredAlarms}
                    onAcknowledge={handleAcknowledge}
                    scenario={urlScenario}
                  />
                )}
              </GlassCard>
            </section>

            {/* Right sidebar: Correlations + Timeline */}
            <aside
              className="xl:w-96 flex-shrink-0 space-y-6"
              aria-label="Alarm analysis panels"
            >
              {/* Correlation chains */}
              <CorrelationPanel
                loading={correlationsLoading}
                correlations={correlations}
              />

              {/* Recent alarm timeline */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base" aria-hidden="true">⏱</span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      최근 타임라인
                    </h2>
                    <p className="text-[11px]" style={{ color: '#64748b' }}>
                      최신 15건, 최근순
                    </p>
                  </div>
                </div>
                <AlarmTimeline alarms={recentAlarms} maxItems={15} />
              </GlassCard>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function AlarmsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">로딩 중...</div>}>
      <AlarmsContent />
    </Suspense>
  );
}

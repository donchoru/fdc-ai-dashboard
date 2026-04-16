'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import KpiCard from '@/components/cards/KpiCard';
import GlassCard from '@/components/cards/GlassCard';
import ProcessFilter from '@/components/filters/ProcessFilter';
import StatusBadge from '@/components/badges/StatusBadge';
import ProcessBadge from '@/components/badges/ProcessBadge';
import { STATUS_COLORS } from '@/lib/constants';
import type { Equipment, Alarm, ProcessType } from '@/lib/types';

const StatusDonut = dynamic(() => import('@/components/charts/StatusDonut'), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-full animate-pulse"
      style={{ width: 160, height: 160, background: '#f1f5f9' }}
      aria-hidden="true"
    />
  ),
});

// ── Skeleton helpers ───────────────────────────────────────────────────────────
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
    <div className="glass-card-solid p-5 flex flex-col gap-3">
      <Skeleton className="h-7 w-8" />
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-0.5 w-full mt-auto" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
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
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
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
          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Equipment status label map ─────────────────────────────────────────────────
const STATUS_KO: Record<string, string> = {
  RUN: '가동',
  IDLE: '대기',
  DOWN: '정지',
  PM: 'PM',
  ENGINEERING: '엔지니어링',
};

// ── Equipment Content ─────────────────────────────────────────────────────────
function EquipmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'normal';

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  const [processFilter, setProcessFilter] = useState<ProcessType | 'all'>('all');

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const scenarioParam = scenario !== 'normal' ? `?scenario=${scenario}` : '';
        const [eqRes, alRes] = await Promise.all([
          fetch(`/api/fdc/equipment${scenarioParam}`),
          fetch('/api/alarms'),
        ]);
        const eqData = await eqRes.json();
        const alData = await alRes.json();
        setEquipment(eqData.equipment ?? []);
        setAlarms(alData.alarms ?? []);
      } catch {
        setEquipment([]);
        setAlarms([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scenario]);

  // ── Derived: alarm count per equipment ────────────────────────────────────────
  const alarmCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const alarm of alarms) {
      if (alarm.status === 'ACTIVE') {
        map[alarm.equipmentId] = (map[alarm.equipmentId] ?? 0) + 1;
      }
    }
    return map;
  }, [alarms]);

  // ── Derived: OOS param count per equipment from alarm data ───────────────────
  // We use alarms with OOS-like codes as a proxy (parameters API is per-equipment)
  // For the table we show active alarm count and derive OOS from equipment status
  const oosEquipmentIds = useMemo(
    () => new Set(equipment.filter((eq) => eq.status === 'DOWN').map((eq) => eq.equipmentId)),
    [equipment]
  );

  // ── KPI ───────────────────────────────────────────────────────────────────────
  const totalCount = equipment.length;
  const runCount = equipment.filter((eq) => eq.status === 'RUN').length;
  const alarmCount = equipment.filter((eq) => (alarmCountMap[eq.equipmentId] ?? 0) > 0).length;
  const oosCount = equipment.filter((eq) => oosEquipmentIds.has(eq.equipmentId)).length;

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filteredEquipment = useMemo(() => {
    if (processFilter === 'all') return equipment;
    return equipment.filter((eq) => eq.process === processFilter);
  }, [equipment, processFilter]);

  // ── Status donut data ─────────────────────────────────────────────────────────
  const donutData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    for (const eq of equipment) {
      statusCounts[eq.status] = (statusCounts[eq.status] ?? 0) + 1;
    }
    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_KO[status] ?? status,
        value: count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? '#94a3b8',
      }));
  }, [equipment]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── 페이지 헤더 ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">설비 관리</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          SEMI E164 기반 FAB 설비 모니터링
        </p>
      </div>

      {/* ── KPI 카드 ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              icon="🏭"
              label="전체 설비"
              value={totalCount}
              unit="대"
              color="#6366f1"
            />
            <KpiCard
              icon="✅"
              label="가동 설비"
              value={runCount}
              unit="대"
              color="#22c55e"
              trend={runCount === totalCount ? 'stable' : 'down'}
              trendValue={`${Math.round((runCount / Math.max(totalCount, 1)) * 100)}%`}
            />
            <KpiCard
              icon="🔔"
              label="알람 설비"
              value={alarmCount}
              unit="대"
              color={alarmCount > 0 ? '#f59e0b' : '#22c55e'}
            />
            <KpiCard
              icon="⛔"
              label="OOS 설비"
              value={oosCount}
              unit="대"
              color={oosCount > 0 ? '#ef4444' : '#22c55e'}
            />
          </>
        )}
      </div>

      {/* ── 공정 필터 ────────────────────────────────────────────────────────── */}
      <ProcessFilter selected={processFilter} onChange={setProcessFilter} />

      {/* ── 설비 테이블 + 도넛 차트 ──────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">

        {/* 테이블 */}
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="설비 목록"
            subtitle="클릭하면 설비 상세 페이지로 이동합니다"
            count={loading ? undefined : filteredEquipment.length}
          />
          <GlassCard solid className="overflow-hidden">
            {loading ? (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {['설비명', '모델', '제조사', '라인', '공정', '챔버', '상태', '알람', 'OOS', '웨이퍼'].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-[10px] uppercase tracking-wider px-4 py-3 text-left"
                          style={{ color: '#94a3b8', fontWeight: 600 }}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            ) : filteredEquipment.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 gap-3"
                role="status"
                aria-label="설비 없음"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  해당 공정의 설비가 없습니다
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      {[
                        '설비명',
                        '모델',
                        '제조사',
                        '라인',
                        '공정',
                        '챔버',
                        '상태',
                        '알람',
                        'OOS',
                        '웨이퍼',
                      ].map((col) => (
                        <th
                          key={col}
                          className="text-[10px] uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap"
                          style={{ color: '#94a3b8', fontWeight: 600 }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((eq) => {
                      const activeAlarmCount = alarmCountMap[eq.equipmentId] ?? 0;
                      const isOos = oosEquipmentIds.has(eq.equipmentId);

                      return (
                        <tr
                          key={eq.equipmentId}
                          onClick={() => router.push(`/equipment/${eq.equipmentId}`)}
                          className="cursor-pointer transition-colors"
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              'transparent';
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${eq.name} 상세 보기`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/equipment/${eq.equipmentId}`);
                            }
                          }}
                        >
                          {/* 설비명 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900">
                                {eq.name}
                              </span>
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: '#94a3b8' }}
                              >
                                {eq.equipmentId}
                              </span>
                            </div>
                          </td>

                          {/* 모델 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-slate-700">{eq.model}</span>
                          </td>

                          {/* 제조사 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs" style={{ color: '#64748b' }}>
                              {eq.vendor}
                            </span>
                          </td>

                          {/* 라인 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-slate-700">{eq.line}</span>
                          </td>

                          {/* 공정 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ProcessBadge process={eq.process} />
                          </td>

                          {/* 챔버 */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className="text-xs text-slate-700">{eq.chamberCount}</span>
                          </td>

                          {/* 상태 */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={eq.status} />
                          </td>

                          {/* 알람 */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {activeAlarmCount > 0 ? (
                              <span
                                className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold"
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  color: '#dc2626',
                                  border: '1px solid rgba(239,68,68,0.25)',
                                }}
                              >
                                {activeAlarmCount}
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>

                          {/* OOS */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {isOos ? (
                              <span
                                className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold"
                                style={{
                                  background: 'rgba(239,68,68,0.08)',
                                  color: '#dc2626',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                }}
                              >
                                OOS
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>

                          {/* 웨이퍼 */}
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span
                              className="text-xs font-mono"
                              style={{
                                color: eq.waferCount > 4000 ? '#f59e0b' : '#475569',
                                fontWeight: eq.waferCount > 4000 ? 700 : 400,
                              }}
                            >
                              {eq.waferCount.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

        {/* 도넛 차트 */}
        <div className="w-full xl:w-64 flex-shrink-0">
          <SectionHeader title="상태별 분포" />
          <GlassCard solid className="p-5">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="rounded-full animate-pulse"
                  style={{ width: 160, height: 160, background: '#f1f5f9' }}
                  aria-hidden="true"
                />
                <div className="w-full space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <StatusDonut
                  data={donutData}
                  size={160}
                  centerLabel="설비 현황"
                  centerValue={totalCount}
                />
                {/* Legend */}
                <div className="w-full space-y-1.5">
                  {donutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: item.color }}
                          aria-hidden="true"
                        />
                        <span className="text-xs" style={{ color: '#475569' }}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* PM 필요 경고 */}
                {equipment.filter((eq) => eq.waferCount > 4000).length > 0 && (
                  <div
                    className="w-full rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      color: '#d97706',
                    }}
                  >
                    <span className="font-semibold">PM 검토 필요</span>
                    <br />
                    <span style={{ color: '#92400e' }}>
                      웨이퍼 4,000+ 설비{' '}
                      {equipment.filter((eq) => eq.waferCount > 4000).length}대
                    </span>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ── Page Export ───────────────────────────────────────────────────────────────
export default function EquipmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">로딩 중...</div>}>
      <EquipmentContent />
    </Suspense>
  );
}

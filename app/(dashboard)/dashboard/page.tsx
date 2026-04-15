'use client';

import React, { useState, useEffect, Suspense, Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import KpiCard from '@/components/cards/KpiCard';
import EquipmentCard from '@/components/cards/EquipmentCard';
import GlassCard from '@/components/cards/GlassCard';
import AlarmTimeline from '@/components/charts/AlarmTimeline';
import AiReportPanel from '@/components/ai/AiReportPanel';
import { STATUS_COLORS, SEVERITY_COLORS } from '@/lib/constants';
import type { Equipment, Alarm, KpiData, AnomalyScenario } from '@/lib/types';

const StatusDonut = dynamic(() => import('@/components/charts/StatusDonut'), {
  ssr: false,
  loading: () => <div className="w-40 h-40 rounded-full animate-pulse" style={{ background: '#f1f5f9' }} />,
});

// ─── Error Boundary ─────────────────────────────────────────────────
class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; info: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('DashboardErrorBoundary:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-red-800 font-bold text-lg mb-2">렌더링 오류</h2>
            <p className="text-red-600 text-sm mb-3">{this.state.error.message}</p>
            <pre className="bg-red-100 rounded-lg p-3 text-xs text-red-700 overflow-auto max-h-60">
              {this.state.error.stack}
            </pre>
            <button onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Skeleton ───────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />;
}

// ─── Dashboard Content ──────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || 'normal';

  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [scenarios, setScenarios] = useState<AnomalyScenario[]>([]);
  const [alarmMap, setAlarmMap] = useState<Record<string, number>>({});
  const [oosMap, setOosMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // AI
  const [aiContent, setAiContent] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<AnomalyScenario | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const scenarioParam = scenario !== 'normal' ? `?scenario=${scenario}` : '';
        const [kpiRes, eqRes, alRes, scRes, allAlRes, paramRes] = await Promise.all([
          fetch(`/api/fdc/overview${scenarioParam}`),
          fetch(`/api/fdc/equipment`),
          fetch(`/api/alarms?limit=10`),
          fetch('/api/fdc/anomalies'),
          fetch('/api/alarms'),
          fetch(`/api/fdc/parameters${scenarioParam}`),
        ]);

        const kpi = await kpiRes.json();
        const eq = await eqRes.json();
        const al = await alRes.json();
        const sc = await scRes.json();
        const allAl = await allAlRes.json();
        const params = await paramRes.json();

        setKpiData(kpi);
        setEquipment(eq.equipment ?? []);
        setAlarms(al.alarms ?? []);
        setScenarios(sc.scenarios ?? []);

        const aMap: Record<string, number> = {};
        (allAl.alarms ?? []).forEach((a: Alarm) => {
          if (a.status === 'ACTIVE') aMap[a.equipmentId] = (aMap[a.equipmentId] ?? 0) + 1;
        });
        setAlarmMap(aMap);

        const oMap: Record<string, number> = {};
        (params.parameters ?? []).forEach((p: { equipmentId: string; status: string }) => {
          if (p.status === 'OOS') oMap[p.equipmentId] = (oMap[p.equipmentId] ?? 0) + 1;
        });
        setOosMap(oMap);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scenario]);

  // AI analyze
  const handleAnalyze = async (scenario: AnomalyScenario) => {
    setActiveScenario(scenario);
    setAiContent('');
    setAiError(null);
    setAiStreaming(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenario.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '요청 실패' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('스트림 없음');
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { setAiStreaming(false); return; }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) { setAiError(parsed.error); setAiStreaming(false); return; }
            if (parsed.content) setAiContent(prev => prev + parsed.content);
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setAiStreaming(false);
    }
  };

  // Group equipment by line
  const byLine = equipment.reduce<Record<string, Equipment[]>>((acc, eq) => {
    (acc[eq.line] ??= []).push(eq);
    return acc;
  }, {});

  const cpkColor = (kpiData?.avgCpk ?? 0) >= 1.33 ? '#22c55e' : (kpiData?.avgCpk ?? 0) >= 1.0 ? '#f59e0b' : '#ef4444';

  const equipDonut = kpiData ? [
    { name: '가동', value: kpiData.equipmentByStatus.RUN ?? 0, color: STATUS_COLORS.RUN },
    { name: '대기', value: kpiData.equipmentByStatus.IDLE ?? 0, color: STATUS_COLORS.IDLE },
    { name: '정지', value: kpiData.equipmentByStatus.DOWN ?? 0, color: STATUS_COLORS.DOWN },
    { name: 'PM', value: kpiData.equipmentByStatus.PM ?? 0, color: STATUS_COLORS.PM },
    { name: '엔지니어링', value: kpiData.equipmentByStatus.ENGINEERING ?? 0, color: STATUS_COLORS.ENGINEERING },
  ].filter(d => d.value > 0) : [];

  const alarmDonut = kpiData ? [
    { name: '위험', value: kpiData.alarmsBySeverity.CRITICAL ?? 0, color: SEVERITY_COLORS.CRITICAL },
    { name: '경고', value: kpiData.alarmsBySeverity.WARNING ?? 0, color: SEVERITY_COLORS.WARNING },
    { name: '정보', value: kpiData.alarmsBySeverity.INFO ?? 0, color: SEVERITY_COLORS.INFO },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card-solid p-5 space-y-3">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-24 h-8" />
              <Skeleton className="w-32 h-3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card-solid p-4 space-y-3">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-3" />
              <Skeleton className="w-full h-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="⚙️" label="전체 설비" value={kpiData?.totalEquipment ?? 0} color="#6366f1" />
          <KpiCard
            icon="🚨"
            label="활성 알람"
            value={kpiData?.activeAlarms ?? 0}
            color={(kpiData?.activeAlarms ?? 0) > 5 ? '#ef4444' : '#f59e0b'}
            trend={(kpiData?.activeAlarms ?? 0) > 5 ? 'up' : 'stable'}
            trendValue={`${kpiData?.activeAlarms ?? 0} 활성`}
          />
          <KpiCard
            icon="📊"
            label="OOS 파라미터"
            value={kpiData?.oosParameters ?? 0}
            color={(kpiData?.oosParameters ?? 0) > 0 ? '#ef4444' : '#22c55e'}
          />
          <KpiCard
            icon="📈"
            label="평균 Cpk"
            value={kpiData?.avgCpk?.toFixed(2) ?? '—'}
            color={cpkColor}
            trendValue="AIAG SPC"
          />
        </div>
      </section>

      {/* Equipment Grid */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-indigo-500" />
          설비 현황
        </h2>
        {Object.entries(byLine).sort(([a], [b]) => a.localeCompare(b)).map(([line, eqs]) => (
          <div key={line} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                {line}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {eqs.map(eq => (
                <EquipmentCard
                  key={eq.equipmentId}
                  equipment={eq}
                  alarmCount={alarmMap[eq.equipmentId] ?? 0}
                  oosCount={oosMap[eq.equipmentId] ?? 0}
                  onClick={() => router.push(`/equipment/${eq.equipmentId}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Donut Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard solid className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">설비 상태</h3>
          <div className="flex items-center gap-6 flex-wrap">
            <StatusDonut data={equipDonut} size={160} centerLabel="설비" centerValue={kpiData?.totalEquipment} />
            <div className="flex flex-col gap-2 flex-1">
              {equipDonut.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-500">{d.name}</span>
                  </div>
                  <span className="font-semibold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
        <GlassCard solid className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">알람 심각도</h3>
          <div className="flex items-center gap-6 flex-wrap">
            <StatusDonut data={alarmDonut} size={160} centerLabel="알람" centerValue={kpiData?.activeAlarms} />
            <div className="flex flex-col gap-2 flex-1">
              {alarmDonut.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-500">{d.name}</span>
                  </div>
                  <span className="font-semibold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
              {kpiData?.oee !== undefined && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">OEE</span>
                  <span className="font-bold" style={{ color: kpiData.oee >= 80 ? '#22c55e' : kpiData.oee >= 60 ? '#f59e0b' : '#ef4444' }}>
                    {kpiData.oee}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Anomaly Scenarios */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-indigo-500" />
          이상 시나리오
          <span className="text-xs text-slate-400 font-normal ml-2">{scenarios.length}개 이상 유형</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios.map(s => {
            const colors: Record<string, string> = { etch: '#f59e0b', cvd: '#6366f1', litho: '#3b82f6', cmp: '#22c55e', pvd: '#8b5cf6', diffusion: '#ef4444' };
            const c = colors[s.process] ?? '#6366f1';
            return (
              <GlassCard solid key={s.id} className="p-4" style={{ borderLeft: `3px solid ${c}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}>
                    {s.process}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{s.id}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 mb-2">{s.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {s.affectedParameters.map(p => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-500 border border-slate-200">{p}</span>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                  <p className="text-[10px] uppercase text-amber-600 font-semibold mb-0.5">근본 원인</p>
                  <p className="text-xs text-amber-700">{s.rootCause}</p>
                </div>
                <button
                  onClick={() => handleAnalyze(s)}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  AI 분석
                </button>
              </GlassCard>
            );
          })}
        </div>
        {(activeScenario || aiContent || aiStreaming) && (
          <div className="mt-4">
            <AiReportPanel
              title={activeScenario ? `AI 분석: ${activeScenario.description}` : 'AI 분석 리포트'}
              onGenerate={() => { if (activeScenario) handleAnalyze(activeScenario); }}
              content={aiContent}
              isStreaming={aiStreaming}
              error={aiError}
            />
          </div>
        )}
      </section>

      {/* Alarm Timeline */}
      <section>
        <GlassCard solid className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">최근 알람</h2>
            <a href="/alarms" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">전체 보기 →</a>
          </div>
          <AlarmTimeline alarms={alarms} maxItems={10} />
        </GlassCard>
      </section>
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<div className="p-8 text-slate-400 text-sm">로딩 중...</div>}>
        <DashboardContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}

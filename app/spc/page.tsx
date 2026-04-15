'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import ProcessFilter from '@/components/filters/ProcessFilter';
import KpiCard from '@/components/cards/KpiCard';
import GlassCard from '@/components/cards/GlassCard';
import type { SpcItem, ProcessType, SpcStatus } from '@/lib/types';
import { SPC_STATUS_COLORS } from '@/lib/constants';

// Recharts-using components — SSR disabled
const SpcChart = dynamic(() => import('@/components/charts/SpcChart'), { ssr: false });
const AiReportPanel = dynamic(() => import('@/components/ai/AiReportPanel'), { ssr: false });

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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<SpcStatus, string> = {
  IN_CONTROL: '관리 내',
  WARNING: '경고',
  OOC: '관리 이탈',
};

const STATUS_ICON: Record<SpcStatus, string> = {
  IN_CONTROL: '✓',
  WARNING: '⚠',
  OOC: '✕',
};

// Korean scenario name map (fallback when API doesn't return scenarios)
const SCENARIO_KO: Record<string, { name: string; description: string }> = {
  NORMAL: {
    name: '정상 운전',
    description: '모든 공정 파라미터가 관리 한계 내에 있는 정상 상태입니다.',
  },
  'OOC-DRIFT': {
    name: '게이트 CD 드리프트 (Rule 3)',
    description: '6연속 단조 추세 — 게이트 CD가 지속적으로 드리프트됩니다. RF 파워 저하 또는 압력 변동 의심.',
  },
  'OOC-SHIFT': {
    name: '오버레이 X 시프트 (Rule 2)',
    description: '9연속 중심선 편측 — 오버레이 X 방향으로 지속적인 시프트. 스테이지 정렬 오차 의심.',
  },
  'OOC-SPIKE': {
    name: 'CMP 제거율 스파이크 (Rule 1)',
    description: '1개 포인트 3σ 이탈 — CMP 제거율이 단발성 급변. 슬러리 공급 이상 또는 패드 결함 의심.',
  },
  'OOC-OSCILLATION': {
    name: '산화막 두께 진동 (Rule 4)',
    description: '3개 중 2개 2σ 이탈 — 산화막 두께가 반복적으로 진동. 온도 Zone 불균형 의심.',
  },
};

// OOC Rule Korean labels
const RULE_KO: Record<number, string> = {
  1: '1개 포인트 3σ 이탈',
  2: '9연속 중심선 편측',
  3: '6연속 단조 추세',
  4: '14연속 교대 변동',
  5: '3개 중 2개 2σ 이탈',
  6: '5개 중 4개 1σ 이탈',
  7: '15연속 ±1σ 내',
  8: '8연속 ±1σ 외',
};

const SCENARIO_AFFECTED_KEYS: Record<string, string> = {
  'OOC-DRIFT': 'etch_cd',
  'OOC-SHIFT': 'overlay_x',
  'OOC-SPIKE': 'cmp_removal_rate',
  'OOC-OSCILLATION': 'diffusion_oxide_thickness',
};

// Cpk capability tiers
type CpkTier = 'excellent' | 'good' | 'marginal' | 'poor';

function getCpkTier(cpk: number | undefined): CpkTier {
  if (cpk === undefined) return 'poor';
  if (cpk >= 1.67) return 'excellent';
  if (cpk >= 1.33) return 'good';
  if (cpk >= 1.0) return 'marginal';
  return 'poor';
}

const CPK_TIER_STYLES: Record<CpkTier, { bg: string; border: string; color: string; label: string }> = {
  excellent: {
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
    color: '#16a34a',
    label: '최우수',
  },
  good: {
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    color: '#2563eb',
    label: '우수',
  },
  marginal: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    color: '#d97706',
    label: '주의',
  },
  poor: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    color: '#dc2626',
    label: '불량',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 8,
        background: warn ? 'rgba(245,158,11,0.10)' : 'rgba(99,102,241,0.10)',
        border: `1px solid ${warn ? 'rgba(245,158,11,0.22)' : 'rgba(99,102,241,0.22)'}`,
      }}
    >
      <span style={{ color: '#64748b', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ color: warn ? '#d97706' : '#4f46e5', fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
        {value}
      </span>
    </div>
  );
}

function OocViolationList({ item }: { item: SpcItem }) {
  if (item.oocViolations.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 10,
        padding: 12,
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.18)',
      }}
      role="alert"
      aria-label="OOC 위반 목록"
    >
      <p style={{ color: '#f87171', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        Western Electric Rule 위반 목록
      </p>
      {item.oocViolations.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.08)',
              color: '#dc2626',
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 10,
              fontWeight: 700,
            }}
            aria-hidden="true"
          >
            {v.rule}
          </span>
          <p style={{ color: '#dc2626', fontSize: 11, lineHeight: 1.4 }}>
            {RULE_KO[v.rule] ?? v.message}
            {v.index !== undefined && (
              <span style={{ color: '#f87171', fontSize: 10, marginLeft: 4 }}>
                (샘플 #{v.index + 1})
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Cpk Heatmap ─────────────────────────────────────────────────────────────

function CpkHeatmap({
  items,
  highlightedKey,
  onCellClick,
}: {
  items: SpcItem[];
  highlightedKey: string | null;
  onCellClick: (key: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Cpk 능력 히트맵">
      <GlassCard solid className="p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }} aria-hidden="true">🗺️</span>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              Cpk 능력 히트맵
            </h2>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              항목을 클릭하면 해당 관리도로 이동합니다
            </p>
          </div>
          {/* Legend */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(CPK_TIER_STYLES) as CpkTier[]).map((tier) => {
              const s = CPK_TIER_STYLES[tier];
              const ranges: Record<CpkTier, string> = {
                excellent: '≥1.67',
                good: '≥1.33',
                marginal: '≥1.0',
                poor: '<1.0',
              };
              return (
                <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>
                    {s.label} ({ranges[tier]})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {items.map((item) => {
            const tier = getCpkTier(item.cpk);
            const s = CPK_TIER_STYLES[tier];
            const isHL = highlightedKey === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onCellClick(item.key)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isHL ? s.bg : `${s.bg.replace('0.12)', '0.07)')}`,
                  border: `1px solid ${isHL ? s.border : s.border.replace('0.3)', '0.15)')}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: isHL ? `0 0 0 2px ${s.border}` : 'none',
                  outline: 'none',
                }}
                aria-label={`${item.name} Cpk ${item.cpk?.toFixed(2) ?? 'N/A'} — ${s.label}`}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = s.bg;
                  (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${s.border}`;
                }}
                onMouseLeave={(e) => {
                  if (!isHL) {
                    (e.currentTarget as HTMLButtonElement).style.background = s.bg.replace('0.12)', '0.07)');
                    (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${s.border.replace('0.3)', '0.15)')}`;
                  }
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4, lineHeight: 1.3 }}>
                  {item.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {item.cpk !== undefined ? item.cpk.toFixed(2) : '—'}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: s.color,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 4,
                      padding: '1px 5px',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>
    </section>
  );
}

// ─── Capability Summary ───────────────────────────────────────────────────────

function CapabilitySummary({ items }: { items: SpcItem[] }) {
  const stats = useMemo(() => {
    const counts: Record<CpkTier, number> = { excellent: 0, good: 0, marginal: 0, poor: 0 };
    let best: SpcItem | null = null;
    let worst: SpcItem | null = null;

    for (const item of items) {
      const tier = getCpkTier(item.cpk);
      counts[tier]++;
      if (item.cpk !== undefined) {
        if (best === null || (best.cpk ?? 0) < item.cpk) best = item;
        if (worst === null || (worst.cpk ?? Infinity) > item.cpk) worst = item;
      }
    }
    return { counts, best, worst, total: items.length };
  }, [items]);

  if (items.length === 0) return null;

  const tiers: CpkTier[] = ['excellent', 'good', 'marginal', 'poor'];

  return (
    <section aria-label="Cpk 분포 요약">
      <GlassCard solid className="p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }} aria-hidden="true">📊</span>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
            공정 능력 분포 요약
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Distribution bars */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Cpk 분포
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tiers.map((tier) => {
                const s = CPK_TIER_STYLES[tier];
                const count = stats.counts[tier];
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={tier}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                        {count}건 ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 4,
                          background: s.color,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best / Worst highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              파라미터 하이라이트
            </p>
            {stats.best && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(34,197,94,0.07)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <p style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                  최우수 파라미터
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{stats.best.name}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', marginTop: 2 }}>
                  Cpk {stats.best.cpk?.toFixed(2)}
                </p>
              </div>
            )}
            {stats.worst && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <p style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                  최저 파라미터
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{stats.worst.name}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginTop: 2 }}>
                  Cpk {stats.worst.cpk?.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}

// ─── Expanded Stats Table ─────────────────────────────────────────────────────

function ExpandedStatsTable({ item }: { item: SpcItem }) {
  const rows: Array<{ label: string; value: string | number | undefined; highlight?: boolean }> = [
    { label: 'Cp', value: item.cp?.toFixed(3), highlight: (item.cp ?? 99) < 1.33 },
    { label: 'Cpk', value: item.cpk?.toFixed(3), highlight: (item.cpk ?? 99) < 1.33 },
    { label: 'Pp', value: item.pp?.toFixed(3), highlight: (item.pp ?? 99) < 1.33 },
    { label: 'Ppk', value: item.ppk?.toFixed(3), highlight: (item.ppk ?? 99) < 1.33 },
    { label: '평균 (Mean)', value: item.mean !== undefined ? `${item.mean.toFixed(4)} ${item.unit}` : undefined },
    { label: '표준편차 (Std)', value: item.std?.toFixed(5) },
    { label: 'Sigma (σ)', value: item.sigma.toFixed(5) },
    { label: 'USL', value: `${item.usl} ${item.unit}` },
    { label: 'LSL', value: `${item.lsl} ${item.unit}` },
    { label: 'UCL', value: item.ucl.toFixed(4) },
    { label: 'LCL', value: item.lcl.toFixed(4) },
    { label: '샘플 수', value: item.sampleSize },
  ];

  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          상세 통계
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        }}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #f1f5f9',
              borderRight: '1px solid #f1f5f9',
              background: row.highlight ? 'rgba(239,68,68,0.03)' : 'transparent',
            }}
          >
            <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{row.label}</p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: row.highlight ? '#dc2626' : '#1e293b',
              }}
            >
              {row.value !== undefined ? String(row.value) : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

function ChartCard({
  item,
  isHighlighted,
  isExpanded,
  onToggleExpand,
}: {
  item: SpcItem;
  isHighlighted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
      id={`chart-${item.key}`}
      style={{
        borderRadius: 16,
        padding: 16,
        background: isHighlighted
          ? 'rgba(239,68,68,0.06)'
          : isOoc
          ? 'rgba(239,68,68,0.03)'
          : '#ffffff',
        border: `1px solid ${isHighlighted ? 'rgba(239,68,68,0.5)' : accentColor}`,
        boxShadow: isHighlighted
          ? '0 0 0 2px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.08)'
          : isOoc
          ? '0 2px 8px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease',
      }}
      aria-label={`SPC 관리도: ${item.name}`}
    >
      {/* Status badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 8px',
            borderRadius: 999,
            color: SPC_STATUS_COLORS[item.status],
            background: `${SPC_STATUS_COLORS[item.status]}18`,
            border: `1px solid ${SPC_STATUS_COLORS[item.status]}35`,
          }}
          role="status"
          aria-label={`상태: ${STATUS_LABELS[item.status]}`}
        >
          <span aria-hidden="true">{STATUS_ICON[item.status]}</span>
          {STATUS_LABELS[item.status]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#475569' }}>
            n={item.sampleSize} · {item.measurementTool.split(' ')[0]}
          </span>
          {/* Expand / collapse toggle */}
          <button
            onClick={onToggleExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              color: isExpanded ? '#4f46e5' : '#64748b',
              background: isExpanded ? 'rgba(99,102,241,0.08)' : '#f8fafc',
              border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.2)' : '#e2e8f0'}`,
              borderRadius: 6,
              padding: '3px 8px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '차트 접기' : '상세 통계 보기'}
          >
            {isExpanded ? '▲ 접기' : '▼ 상세'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <SpcChart data={item} height={isExpanded ? 260 : 220} showZones />

      {/* Stat pills */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
            label="평균"
            value={`${item.mean.toFixed(3)} ${item.unit}`}
            warn={false}
          />
        )}
        {item.std !== undefined && (
          <StatPill label="1σ Std" value={item.std.toFixed(4)} warn={false} />
        )}
      </div>

      {/* Expanded stats table */}
      {isExpanded && <ExpandedStatsTable item={item} />}

      {/* OOC violations */}
      <OocViolationList item={item} />
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl h-28" style={{ background: '#f1f5f9' }} />
        ))}
      </div>
      <div className="rounded-2xl h-48" style={{ background: '#f1f5f9' }} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl h-72" style={{ background: '#f1f5f9' }} />
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

  // Expand state per chart key
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // AI Report state
  const [aiContent, setAiContent] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSpc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (process !== 'all') params.set('process', process);
      if (scenario !== 'NORMAL') params.set('scenario', scenario);
      params.set('includeScenarios', 'true');
      const res = await fetch(`/api/spc?${params.toString()}`);
      if (!res.ok) throw new Error(`API 오류 ${res.status}`);
      const json: SpcApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SPC 데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [process, scenario]);

  useEffect(() => {
    fetchSpc();
  }, [fetchSpc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const scenarios = data?.scenarios ?? [];
  const items = data?.items ?? [];
  const statusSummary = data?.statusSummary ?? { IN_CONTROL: 0, WARNING: 0, OOC: 0 };
  const total = data?.count ?? 0;

  const highlightedKey = SCENARIO_AFFECTED_KEYS[scenario] ?? null;

  // Build scenario options — prefer API data, fallback to static Korean labels
  const scenarioOptions = useMemo(() => {
    if (scenarios.length > 0) return scenarios;
    return Object.entries(SCENARIO_KO).map(([id, meta]) => ({
      id,
      name: meta.name,
      description: meta.description,
    }));
  }, [scenarios]);

  const currentScenarioMeta = useMemo(
    () => scenarioOptions.find((s) => s.id === scenario) ?? null,
    [scenarioOptions, scenario]
  );

  // Scroll to a chart cell by key
  const scrollToChart = useCallback((key: string) => {
    const el = document.getElementById(`chart-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
      el.style.transition = 'box-shadow 0.15s';
      el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.4)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 1200);
    }
  }, []);

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // AI Report SSE streaming
  const generateAiReport = useCallback(async () => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setAiStreaming(true);
    setAiContent('');
    setAiError(null);

    let accumulated = '';

    try {
      const res = await fetch('/api/ai/spc-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          process: process !== 'all' ? process : undefined,
          scenario,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const chunk = line.slice(6).trim();
          if (chunk === '[DONE]') {
            setAiStreaming(false);
            return;
          }
          try {
            const parsed = JSON.parse(chunk);
            if (parsed.content) {
              accumulated += parsed.content;
              setAiContent(accumulated);
            }
            if (parsed.error) {
              setAiError(parsed.error);
              setAiStreaming(false);
              return;
            }
          } catch {
            // malformed JSON chunk — skip
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setAiError(err instanceof Error ? err.message : 'AI 리포트 생성 실패');
    } finally {
      setAiStreaming(false);
    }
  }, [process, scenario]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <header>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>
              SPC 관리도
            </h1>
            <p style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
              AIAG SPC Manual 및 Western Electric Rules 기반 통계적 공정 관리 — IRDS 2024 5nm 노드 사양
            </p>
          </div>

          {/* Avg / Min Cpk pill */}
          {data?.cpkSummary.avg !== null && data?.cpkSummary.avg !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '10px 16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', margin: 0 }}>
                  평균 Cpk
                </p>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color:
                      data.cpkSummary.avg >= 1.33
                        ? '#22c55e'
                        : data.cpkSummary.avg >= 1.0
                        ? '#f59e0b'
                        : '#ef4444',
                    margin: 0,
                  }}
                >
                  {data.cpkSummary.avg.toFixed(2)}
                </p>
              </div>
              {data.cpkSummary.min !== null && (
                <>
                  <div style={{ width: 1, height: 32, background: '#e2e8f0' }} aria-hidden="true" />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', margin: 0 }}>
                      최소 Cpk
                    </p>
                    <p
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color:
                          data.cpkSummary.min >= 1.33
                            ? '#22c55e'
                            : data.cpkSummary.min >= 1.0
                            ? '#f59e0b'
                            : '#ef4444',
                        margin: 0,
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

      {/* ── Process Filter ────────────────────────────────────────── */}
      <section aria-label="공정 필터">
        <ProcessFilter selected={process} onChange={setProcess} />
      </section>

      {/* ── KPI Summary Cards ─────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="SPC 요약">
        <KpiCard icon="📊" label="전체 항목" value={total} color="#6366f1" />
        <KpiCard
          icon="✓"
          label="관리 내"
          value={statusSummary.IN_CONTROL}
          color="#22c55e"
          trend={statusSummary.IN_CONTROL === total ? 'stable' : undefined}
          trendValue={statusSummary.IN_CONTROL === total ? '100%' : undefined}
        />
        <KpiCard
          icon="⚠"
          label="경고"
          value={statusSummary.WARNING}
          color="#f59e0b"
          trend={statusSummary.WARNING > 0 ? 'up' : 'stable'}
          trendValue={total > 0 ? `${Math.round((statusSummary.WARNING / total) * 100)}%` : '0%'}
        />
        <KpiCard
          icon="✕"
          label="관리 이탈"
          value={statusSummary.OOC}
          color="#ef4444"
          trend={statusSummary.OOC > 0 ? 'up' : 'stable'}
          trendValue={total > 0 ? `${Math.round((statusSummary.OOC / total) * 100)}%` : '0%'}
        />
      </section>

      {/* ── Error State ───────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
          role="alert"
        >
          <span style={{ fontSize: 18 }} aria-hidden="true">⚠</span>
          <p style={{ fontSize: 14, color: '#dc2626' }}>{error}</p>
          <button
            onClick={fetchSpc}
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              color: '#dc2626',
              border: '1px solid rgba(239,68,68,0.2)',
              cursor: 'pointer',
            }}
          >
            재시도
          </button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {!loading && !error && items.length > 0 && (
        <>
          {/* ── AI SPC 리포트 패널 ─────────────────────────────────── */}
          <section aria-label="AI SPC 리포트">
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI SPC 리포트 생성
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#4f46e5',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                Gemini
              </span>
            </div>
            <AiReportPanel
              title="SPC AI 분석 리포트"
              onGenerate={generateAiReport}
              content={aiContent}
              isStreaming={aiStreaming}
              error={aiError}
            />
          </section>

          {/* ── Cpk Heatmap ───────────────────────────────────────── */}
          <CpkHeatmap
            items={items}
            highlightedKey={highlightedKey}
            onCellClick={scrollToChart}
          />

          {/* ── Capability Summary ────────────────────────────────── */}
          <CapabilitySummary items={items} />

          {/* ── SPC Charts Grid ───────────────────────────────────── */}
          <section aria-label="SPC 관리도 목록">
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }} aria-hidden="true">📈</span>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                개별 관리도
              </h2>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                — 차트를 클릭해 상세 통계를 펼칩니다
              </span>
              {/* Expand all / collapse all */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setExpandedKeys(new Set(items.map((i) => i.key)))}
                  style={{
                    fontSize: 11,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  전체 펼치기
                </button>
                <button
                  onClick={() => setExpandedKeys(new Set())}
                  style={{
                    fontSize: 11,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  전체 접기
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <ChartCard
                  key={item.key}
                  item={item}
                  isHighlighted={highlightedKey === item.key}
                  isExpanded={expandedKeys.has(item.key)}
                  onToggleExpand={() => toggleExpand(item.key)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── Empty State ───────────────────────────────────────────── */}
      {!loading && !error && items.length === 0 && (
        <GlassCard className="p-12 flex flex-col items-center justify-center gap-3">
          <span className="text-4xl" aria-hidden="true">📈</span>
          <p className="text-sm font-medium text-slate-500">
            선택한 공정의 SPC 데이터 없음
          </p>
        </GlassCard>
      )}

      {/* ── OOC Scenario Demo ─────────────────────────────────────── */}
      <section aria-label="OOC 시나리오 데모">
        <GlassCard solid className="p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }} aria-hidden="true">🧪</span>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                OOC 시나리오 데모
              </h2>
              <p style={{ fontSize: 11, marginTop: 2, color: '#64748b' }}>
                Western Electric Rule 위반 시뮬레이션 — AIAG SPC Manual §4
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Scenario selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                htmlFor="scenario-select"
                style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}
              >
                시나리오 주입
              </label>
              <select
                id="scenario-select"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="glass-input px-3 py-2 text-sm text-white appearance-none cursor-pointer"
                style={{ maxWidth: 380 }}
                aria-label="OOC 시나리오 선택"
              >
                {scenarioOptions.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: '#ffffff', color: '#1e293b' }}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario description */}
            {currentScenarioMeta && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: scenario === 'NORMAL' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${scenario === 'NORMAL' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: scenario === 'NORMAL' ? '#16a34a' : '#dc2626', marginBottom: 4 }}>
                  {currentScenarioMeta.name}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                  {currentScenarioMeta.description}
                </p>
                {scenario !== 'NORMAL' && highlightedKey && (
                  <p style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                    강조 차트:{' '}
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      {items.find((i) => i.key === highlightedKey)?.name ?? highlightedKey}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* WE Rules reference table */}
            <div
              style={{
                borderRadius: 12,
                padding: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                Western Electric Rules (AIAG SPC §4)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                {[
                  { rule: 1, label: '1개 포인트 3σ 이탈' },
                  { rule: 2, label: '9연속 중심선 편측' },
                  { rule: 3, label: '6연속 단조 추세' },
                  { rule: 5, label: '3개 중 2개 2σ 이탈' },
                ].map(({ rule, label }) => (
                  <div
                    key={rule}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: '#f1f5f9',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)',
                        color: '#4f46e5',
                        border: '1px solid rgba(99,102,241,0.2)',
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {rule}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

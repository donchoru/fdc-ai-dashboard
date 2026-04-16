'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { CheckCircle, X, ExternalLink } from 'lucide-react';
import { Alarm, Severity } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';
import SeverityBadge from '@/components/badges/SeverityBadge';
import ProcessBadge from '@/components/badges/ProcessBadge';

interface AlarmTableProps {
  alarms: Alarm[];
  onAcknowledge?: (id: string) => void;
  scenario?: string;
}

type SortKey = 'time' | 'severity';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

const SEVERITY_LABELS_KO: Record<Severity, string> = {
  CRITICAL: '위험',
  WARNING: '경고',
  INFO: '정보',
};

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVE: {
    color: '#dc2626',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  ACKNOWLEDGED: {
    color: '#d97706',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  CLEARED: {
    color: '#16a34a',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
  },
};

const STATUS_LABELS_KO: Record<string, string> = {
  ACTIVE: '활성',
  ACKNOWLEDGED: '확인됨',
  CLEARED: '해제',
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return ts;
  }
}

function formatTimestampFull(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return ts;
  }
}

/* ─── Alarm Detail Modal ──────────────────────────────────────────────── */
function AlarmDetailModal({
  alarm,
  onClose,
  onAcknowledge,
  scenario,
}: {
  alarm: Alarm;
  onClose: () => void;
  onAcknowledge?: (id: string) => void;
  scenario?: string;
}) {
  const severityColor = SEVERITY_COLORS[alarm.severity];
  const statusStyle = STATUS_STYLES[alarm.status] ?? STATUS_STYLES.CLEARED;

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`알람 상세: ${alarm.alarmName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
      >
        {/* Severity strip */}
        <div
          className="h-1.5 w-full rounded-t-2xl"
          style={{ background: severityColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <SeverityBadge severity={alarm.severity} />
              <code
                className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: '#f1f5f9', color: '#4f46e5' }}
              >
                {alarm.alarmCode}
              </code>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  color: statusStyle.color,
                  background: statusStyle.bg,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {STATUS_LABELS_KO[alarm.status] ?? alarm.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {alarm.alarmName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {alarm.description}
          </p>

          {/* Detail grid */}
          <div
            className="grid grid-cols-2 gap-3 p-4 rounded-xl"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <DetailItem label="발생 시간" value={formatTimestampFull(alarm.timestamp)} />
            <DetailItem label="심각도" value={SEVERITY_LABELS_KO[alarm.severity]} color={severityColor} />
            <DetailItem
              label="설비"
              value={alarm.equipmentName}
              link={`/equipment/${alarm.equipmentId}${scenario && scenario !== 'normal' ? `?scenario=${scenario}` : ''}`}
            />
            <DetailItem label="설비 ID" value={alarm.equipmentId} mono />
            <DetailItem label="라인" value={alarm.lineId} />
            <DetailItem label="공정">
              <ProcessBadge process={alarm.process} />
            </DetailItem>
            {alarm.value !== null && (
              <DetailItem
                label="측정값"
                value={String(alarm.value)}
                color={alarm.severity === 'CRITICAL' ? '#dc2626' : undefined}
              />
            )}
            {alarm.spec && (
              <DetailItem label="규격" value={alarm.spec} />
            )}
          </div>

          {/* SEMI Reference */}
          {alarm.semiReference && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}
            >
              <span className="text-indigo-400 font-semibold">SEMI</span>
              <span className="text-indigo-600 font-mono">{alarm.semiReference}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Link
              href={`/equipment/${alarm.equipmentId}?focus=parameters${scenario && scenario !== 'normal' ? `&scenario=${scenario}` : ''}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <ExternalLink size={12} />
              설비 상세 보기
            </Link>
            {onAcknowledge && alarm.status === 'ACTIVE' && !alarm.acknowledged && (
              <button
                onClick={() => { onAcknowledge(alarm.id); onClose(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(22,163,74,0.08)',
                  color: '#16a34a',
                  border: '1px solid rgba(22,163,74,0.2)',
                }}
              >
                <CheckCircle size={12} />
                알람 확인
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  color,
  mono,
  link,
  children,
}: {
  label: string;
  value?: string;
  color?: string;
  mono?: boolean;
  link?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>
        {label}
      </p>
      {children ? (
        children
      ) : link ? (
        <Link
          href={link}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
        >
          {value}
        </Link>
      ) : (
        <p
          className={`text-xs font-semibold truncate ${mono ? 'font-mono' : ''}`}
          style={{ color: color ?? '#1e293b' }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

/* ─── Main Table ──────────────────────────────────────────────────────── */
export default function AlarmTable({ alarms, onAcknowledge, scenario }: AlarmTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('severity');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const sorted = [...alarms].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'severity') {
      cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    } else {
      cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table
          className="data-table w-full text-sm border-collapse"
          aria-label="Alarm list"
        >
          <thead>
            <tr>
              <SortableTh
                label="시간"
                sortKey="time"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="심각도"
                sortKey="severity"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <StaticTh label="설비" />
              <StaticTh label="코드" />
              <StaticTh label="알람명" />
              <StaticTh label="설명" />
              <StaticTh label="값" />
              <StaticTh label="공정" />
              <StaticTh label="상태" />
              {onAcknowledge && <StaticTh label="조치" />}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={onAcknowledge ? 10 : 9}
                  className="py-10 text-center"
                  style={{ color: 'var(--muted)', fontSize: 13 }}
                >
                  알람 없음
                </td>
              </tr>
            )}
            {sorted.map((alarm) => {
              const statusStyle = STATUS_STYLES[alarm.status] ?? STATUS_STYLES.CLEARED;
              const severityColor = SEVERITY_COLORS[alarm.severity];
              const rowStyle: React.CSSProperties =
                alarm.severity === 'CRITICAL' && alarm.status === 'ACTIVE'
                  ? { borderLeft: `2px solid ${severityColor}` }
                  : {};

              return (
                <tr
                  key={alarm.id}
                  style={{ ...rowStyle, cursor: 'pointer' }}
                  className="hover:bg-indigo-50/40 transition-colors"
                  onClick={() => setSelectedAlarm(alarm)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedAlarm(alarm); }}
                  aria-label={`알람 상세 보기: ${alarm.alarmName}`}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: '#64748b', fontSize: 11 }}>
                    {formatTimestamp(alarm.timestamp)}
                  </td>
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={alarm.severity} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-medium text-indigo-600">
                      {alarm.equipmentName}
                    </span>
                    <br />
                    <span style={{ color: 'var(--muted)', fontSize: 10 }}>{alarm.lineId}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <code
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{
                        background: '#f1f5f9',
                        color: '#4f46e5',
                        fontFamily: 'monospace',
                      }}
                    >
                      {alarm.alarmCode}
                    </code>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-medium" style={{ color: '#1e293b' }}>
                      {alarm.alarmName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[220px]">
                    <span
                      className="text-xs block truncate"
                      style={{ color: '#64748b' }}
                      title={alarm.description}
                    >
                      {alarm.description}
                    </span>
                    {alarm.semiReference && (
                      <span className="text-[10px] mt-0.5 block" style={{ color: 'var(--muted)' }}>
                        {alarm.semiReference}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    {alarm.value !== null ? (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: alarm.severity === 'CRITICAL' ? '#dc2626' : '#1e293b' }}
                      >
                        {alarm.value}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                    )}
                    {alarm.spec && (
                      <span className="block text-[10px]" style={{ color: 'var(--muted)' }}>
                        {alarm.spec}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <ProcessBadge process={alarm.process} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider"
                      style={{
                        color: statusStyle.color,
                        background: statusStyle.bg,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      {STATUS_LABELS_KO[alarm.status] ?? alarm.status}
                    </span>
                  </td>
                  {onAcknowledge && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {alarm.status === 'ACTIVE' && !alarm.acknowledged ? (
                        <button
                          onClick={() => onAcknowledge(alarm.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all duration-150"
                          style={{
                            background: 'rgba(22,163,74,0.07)',
                            color: '#16a34a',
                            border: '1px solid rgba(22,163,74,0.2)',
                          }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.background = 'rgba(22,163,74,0.15)';
                            btn.style.borderColor = 'rgba(22,163,74,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.background = 'rgba(22,163,74,0.07)';
                            btn.style.borderColor = 'rgba(22,163,74,0.2)';
                          }}
                          aria-label={`알람 확인 ${alarm.alarmCode}`}
                        >
                          <CheckCircle size={12} aria-hidden="true" />
                          확인
                        </button>
                      ) : alarm.acknowledged || alarm.status === 'ACKNOWLEDGED' ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(100,116,139,0.08)',
                            color: '#94a3b8',
                            border: '1px solid rgba(100,116,139,0.18)',
                          }}
                        >
                          <CheckCircle size={10} aria-hidden="true" />
                          확인됨
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alarm Detail Modal — Portal to body to avoid parent overflow/transform breaking fixed positioning */}
      {selectedAlarm && createPortal(
        <AlarmDetailModal
          alarm={selectedAlarm}
          onClose={() => setSelectedAlarm(null)}
          onAcknowledge={onAcknowledge}
          scenario={scenario}
        />,
        document.body
      )}
    </>
  );
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-3 py-3 text-left whitespace-nowrap">
      <button
        className="flex items-center gap-1 group"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label} ${active ? (dir === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
      >
        <span
          style={{
            color: active ? '#4f46e5' : '#64748b',
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          style={{
            color: active ? '#6366f1' : '#cbd5e1',
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

function StaticTh({ label }: { label: string }) {
  return (
    <th className="px-3 py-3 text-left whitespace-nowrap">
      <span
        style={{
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </th>
  );
}

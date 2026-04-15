'use client';

import StatusDonut from '@/components/charts/StatusDonut';
import CpkBarChart from '@/components/charts/CpkBarChart';
import SpcChart from '@/components/charts/SpcChart';
import type { KpiData, SpcItem, Alarm } from '@/lib/types';
import { AlertTriangle, Clock } from 'lucide-react';

// ─────────────────────────────────────────────────────
// Equipment Status Section
// ─────────────────────────────────────────────────────
interface EquipmentStatusSectionProps {
  kpi: KpiData;
}

const EQUIP_STATUS_COLORS: Record<string, string> = {
  RUN: '#22c55e',
  IDLE: '#64748b',
  DOWN: '#ef4444',
  PM: '#f59e0b',
  ENGINEERING: '#8b5cf6',
};

const EQUIP_STATUS_LABELS: Record<string, string> = {
  RUN: '가동',
  IDLE: '대기',
  DOWN: '정지',
  PM: '예방정비',
  ENGINEERING: '엔지니어링',
};

export function EquipmentStatusSection({ kpi }: EquipmentStatusSectionProps) {
  const donutData = Object.entries(kpi.equipmentByStatus)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: EQUIP_STATUS_LABELS[key] || key,
      value,
      color: EQUIP_STATUS_COLORS[key] || '#94a3b8',
    }));

  return (
    <div className="flex flex-col items-center gap-3">
      <h4
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#64748b' }}
      >
        설비 상태 분포
      </h4>
      <StatusDonut
        data={donutData}
        size={160}
        centerLabel="설비"
        centerValue={kpi.totalEquipment}
      />
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {donutData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-xs" style={{ color: '#64748b' }}>
              {d.name} {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Alarm Summary Section
// ─────────────────────────────────────────────────────
interface AlarmSummarySectionProps {
  kpi: KpiData;
  alarms: Alarm[];
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
};

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: '긴급',
  WARNING: '주의',
  INFO: '정보',
};

export function AlarmSummarySection({ kpi, alarms }: AlarmSummarySectionProps) {
  const donutData = Object.entries(kpi.alarmsBySeverity)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: SEVERITY_LABELS[key] || key,
      value,
      color: SEVERITY_COLORS[key] || '#94a3b8',
    }));

  const recentAlarms = alarms.slice(0, 5);

  return (
    <div className="flex flex-col items-center gap-3">
      <h4
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#64748b' }}
      >
        알람 분포
      </h4>
      <StatusDonut
        data={donutData}
        size={160}
        centerLabel="알람"
        centerValue={kpi.activeAlarms}
      />
      {/* Recent alarms mini-list */}
      {recentAlarms.length > 0 && (
        <div className="w-full space-y-1.5 mt-1">
          {recentAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className="flex items-start gap-2 rounded-lg px-2.5 py-1.5"
              style={{
                background: 'rgba(248,250,252,0.8)',
                border: '1px solid #f1f5f9',
              }}
            >
              <AlertTriangle
                size={11}
                className="mt-0.5 flex-shrink-0"
                style={{ color: SEVERITY_COLORS[alarm.severity] || '#64748b' }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs font-medium"
                  style={{ color: '#334155' }}
                >
                  {alarm.alarmName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={9} style={{ color: '#94a3b8' }} />
                  <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                    {alarm.time}
                  </span>
                  <span
                    className="ml-1 rounded px-1 py-0 text-[9px] font-medium"
                    style={{
                      background: `${SEVERITY_COLORS[alarm.severity]}12`,
                      color: SEVERITY_COLORS[alarm.severity],
                    }}
                  >
                    {alarm.severity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SPC Overview Section
// ─────────────────────────────────────────────────────
interface SpcOverviewSectionProps {
  spcItems: SpcItem[];
}

export function SpcOverviewSection({ spcItems }: SpcOverviewSectionProps) {
  // Build Cpk bar chart data
  const cpkData = spcItems
    .filter((item) => item.cpk !== undefined)
    .map((item) => ({
      name: item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name,
      cpk: item.cpk!,
    }));

  // Find worst SPC item (lowest Cpk)
  const worstItem = spcItems
    .filter((item) => item.cpk !== undefined)
    .sort((a, b) => (a.cpk ?? 99) - (b.cpk ?? 99))[0];

  return (
    <div className="space-y-4">
      {/* Cpk Bar Chart */}
      {cpkData.length > 0 && (
        <div>
          <h4
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#64748b' }}
          >
            SPC 항목별 Cpk
          </h4>
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid #f1f5f9' }}
          >
            <CpkBarChart data={cpkData} height={200} />
          </div>
        </div>
      )}

      {/* Worst SPC item control chart */}
      {worstItem && (
        <div>
          <h4
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#64748b' }}
          >
            최약 SPC 항목 — {worstItem.name} (Cpk {worstItem.cpk?.toFixed(2)})
          </h4>
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid #f1f5f9' }}
          >
            <SpcChart data={worstItem} height={200} showZones />
          </div>
        </div>
      )}
    </div>
  );
}

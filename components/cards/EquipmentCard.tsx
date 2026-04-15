'use client';

import { Equipment } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/constants';
import GlassCard from './GlassCard';

interface EquipmentCardProps {
  equipment: Equipment;
  alarmCount?: number;
  oosCount?: number;
  onClick?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  RUN: 'Running',
  IDLE: 'Idle',
  DOWN: 'Down',
  PM: 'Preventive Maint.',
  ENGINEERING: 'Engineering',
};

const PROCESS_SHORT: Record<string, string> = {
  etch: 'ETCH',
  cvd: 'CVD',
  litho: 'LITHO',
  cmp: 'CMP',
  pvd: 'PVD',
  diffusion: 'DIFF',
};

export default function EquipmentCard({
  equipment,
  alarmCount = 0,
  oosCount = 0,
  onClick,
}: EquipmentCardProps) {
  const statusColor = STATUS_COLORS[equipment.status];
  const statusDotClass = equipment.status.toLowerCase();
  const hasAlarms = alarmCount > 0;
  const hasOos = oosCount > 0;

  return (
    <GlassCard
      solid
      hover
      onClick={onClick}
      className="p-4 flex flex-col gap-3 min-w-0"
    >
      {/* Top: status dot + name + badges */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`status-dot ${statusDotClass} flex-shrink-0 mt-0.5`}
            aria-label={`Status: ${STATUS_LABELS[equipment.status]}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {equipment.name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
              {equipment.model}
            </p>
          </div>
        </div>

        {/* Alarm / OOS badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasAlarms && (
            <span
              className="inline-flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
              aria-label={`${alarmCount} active alarm${alarmCount > 1 ? 's' : ''}`}
            >
              {alarmCount > 9 ? '9+' : alarmCount}
            </span>
          )}
          {hasOos && (
            <span
              className="inline-flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
              aria-label={`${oosCount} out-of-spec parameter${oosCount > 1 ? 's' : ''}`}
            >
              {oosCount > 9 ? '9+' : oosCount}
            </span>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <MetaItem label="Vendor" value={equipment.vendor} />
        <MetaItem label="Line" value={equipment.line} />
        <MetaItem label="Process" value={PROCESS_SHORT[equipment.process] ?? equipment.process.toUpperCase()} />
        <MetaItem label="Chambers" value={String(equipment.chamberCount)} />
      </div>

      {/* Footer: status pill + wafer count */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span
          className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
          style={{
            background: `${statusColor}1a`,
            color: statusColor,
            border: `1px solid ${statusColor}40`,
          }}
        >
          {STATUS_LABELS[equipment.status]}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {equipment.waferCount.toLocaleString()} wfr
        </span>
      </div>
    </GlassCard>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider truncate" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <p className="text-xs font-medium text-slate-700 truncate">{value}</p>
    </div>
  );
}

'use client';

import { EquipmentStatus } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/constants';

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  RUN: '가동',
  IDLE: '대기',
  DOWN: '정지',
  PM: 'PM',
  ENGINEERING: 'ENG',
};

const STATUS_ARIA: Record<EquipmentStatus, string> = {
  RUN: '상태: 가동',
  IDLE: '상태: 대기',
  DOWN: '상태: 정지',
  PM: '상태: 예방 정비',
  ENGINEERING: '상태: 엔지니어링',
};

interface StatusBadgeProps {
  status: EquipmentStatus;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];
  const dotClass = status.toLowerCase();

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
      }}
      aria-label={STATUS_ARIA[status]}
      role="status"
    >
      {showDot && (
        <span
          className={`status-dot ${dotClass}`}
          style={{ width: 6, height: 6 }}
          aria-hidden="true"
        />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

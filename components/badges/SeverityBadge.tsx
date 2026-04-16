'use client';

import { Severity } from '@/lib/types';

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; className: string; ariaLabel: string }
> = {
  CRITICAL: {
    label: '위험',
    className: 'severity-critical',
    ariaLabel: '심각도: 위험',
  },
  WARNING: {
    label: '경고',
    className: 'severity-warning',
    ariaLabel: '심각도: 경고',
  },
  INFO: {
    label: '정보',
    className: 'severity-info',
    ariaLabel: '심각도: 정보',
  },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.className}`}
      aria-label={config.ariaLabel}
      role="status"
    >
      {config.label}
    </span>
  );
}

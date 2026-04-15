'use client';

import { Severity } from '@/lib/types';

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; className: string; ariaLabel: string }
> = {
  CRITICAL: {
    label: 'CRITICAL',
    className: 'severity-critical',
    ariaLabel: 'Severity: Critical',
  },
  WARNING: {
    label: 'WARNING',
    className: 'severity-warning',
    ariaLabel: 'Severity: Warning',
  },
  INFO: {
    label: 'INFO',
    className: 'severity-info',
    ariaLabel: 'Severity: Informational',
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

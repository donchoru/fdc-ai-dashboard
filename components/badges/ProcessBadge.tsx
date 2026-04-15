'use client';

import { ProcessType } from '@/lib/types';
import { PROCESS_LABELS } from '@/lib/constants';

const PROCESS_COLORS: Record<ProcessType | 'transfer', { color: string; bg: string; border: string }> = {
  etch: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)' },
  cvd: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)' },
  litho: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.28)' },
  cmp: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)' },
  pvd: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.28)' },
  diffusion: { color: '#facc15', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.28)' },
  transfer: { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)' },
};

const PROCESS_SHORT: Record<string, string> = {
  etch: 'ETCH',
  cvd: 'CVD',
  litho: 'LITHO',
  cmp: 'CMP',
  pvd: 'PVD',
  diffusion: 'DIFF',
  transfer: 'XFER',
};

interface ProcessBadgeProps {
  process: ProcessType | 'transfer';
  full?: boolean;
}

export default function ProcessBadge({ process, full = false }: ProcessBadgeProps) {
  const theme = PROCESS_COLORS[process] ?? PROCESS_COLORS.transfer;
  const label = full
    ? (PROCESS_LABELS[process] ?? process.toUpperCase())
    : (PROCESS_SHORT[process] ?? process.toUpperCase());

  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{
        color: theme.color,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
      }}
      aria-label={`Process: ${PROCESS_LABELS[process] ?? process}`}
    >
      {label}
    </span>
  );
}

'use client';

import { ProcessType } from '@/lib/types';

interface ProcessFilterProps {
  selected: ProcessType | 'all';
  onChange: (process: ProcessType | 'all') => void;
}

// ──────────────────────────────────────────────
// Process definitions
// ──────────────────────────────────────────────
const PROCESS_OPTIONS: Array<{ value: ProcessType | 'all'; label: string; abbr: string }> = [
  { value: 'all',       label: '전체',     abbr: 'ALL'  },
  { value: 'etch',      label: 'ETCH',     abbr: 'ETC'  },
  { value: 'cvd',       label: 'CVD',      abbr: 'CVD'  },
  { value: 'litho',     label: 'LITHO',    abbr: 'LIT'  },
  { value: 'cmp',       label: 'CMP',      abbr: 'CMP'  },
  { value: 'pvd',       label: 'PVD',      abbr: 'PVD'  },
  { value: 'diffusion', label: 'DIFFUSION', abbr: 'DIF' },
];

// Per-process accent color — used for the active indicator dot
const PROCESS_ACCENT: Record<ProcessType | 'all', string> = {
  all:       '#6366f1',
  etch:      '#ef4444',
  cvd:       '#f59e0b',
  litho:     '#3b82f6',
  cmp:       '#22c55e',
  pvd:       '#8b5cf6',
  diffusion: '#06b6d4',
};

export default function ProcessFilter({ selected, onChange }: ProcessFilterProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-xl p-1"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
      role="tablist"
      aria-label="공정 필터"
    >
      {PROCESS_OPTIONS.map((opt) => {
        const isActive = selected === opt.value;
        const accent = PROCESS_ACCENT[opt.value];

        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: isActive ? '#ffffff' : 'transparent',
              color: isActive ? '#1e293b' : '#64748b',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            {/* Active accent dot */}
            {isActive && (
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  background: accent,
                  boxShadow: `0 0 6px ${accent}`,
                }}
                aria-hidden="true"
              />
            )}

            {/* Label — show full on md+, abbr on small */}
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="inline sm:hidden">{opt.abbr}</span>

            {/* Active underline bar */}
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 h-[2px] w-4/5 -translate-x-1/2 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

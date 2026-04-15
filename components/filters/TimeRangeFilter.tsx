'use client';

import { Clock } from 'lucide-react';

type TimeRange = '1h' | '4h' | '8h' | '24h';

interface TimeRangeFilterProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_OPTIONS: Array<{ value: TimeRange; label: string; desc: string }> = [
  { value: '1h',  label: '1H',  desc: '최근 1시간'  },
  { value: '4h',  label: '4H',  desc: '최근 4시간'  },
  { value: '8h',  label: '8H',  desc: '최근 8시간'  },
  { value: '24h', label: '24H', desc: '최근 24시간' },
];

export default function TimeRangeFilter({ selected, onChange }: TimeRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Clock icon label */}
      <div className="flex items-center gap-1.5">
        <Clock size={13} style={{ color: '#64748b' }} aria-hidden="true" />
        <span className="text-xs" style={{ color: '#64748b' }}>기간</span>
      </div>

      {/* Button group */}
      <div
        className="flex items-center rounded-lg p-0.5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        role="group"
        aria-label="시간 범위 선택"
      >
        {TIME_OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.desc}
              aria-pressed={isActive}
              className="rounded-md px-3 py-1 text-xs font-medium transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(79,70,229,0.25))'
                  : 'transparent',
                color: isActive ? '#c7d2fe' : '#64748b',
                border: isActive
                  ? '1px solid rgba(99,102,241,0.3)'
                  : '1px solid transparent',
                boxShadow: isActive ? '0 1px 6px rgba(99,102,241,0.2)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

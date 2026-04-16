'use client';

import { Alarm } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';

interface AlarmTimelineProps {
  alarms: Alarm[];
  maxItems?: number;
}

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.06)',
  WARNING: 'rgba(245,158,11,0.06)',
  INFO: 'rgba(59,130,246,0.06)',
};

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: 'CRIT',
  WARNING: 'WARN',
  INFO: 'INFO',
};

function formatTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  } catch {
    return timeStr;
  }
}

function formatDate(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '';
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export default function AlarmTimeline({
  alarms,
  maxItems = 20,
}: AlarmTimelineProps) {
  const sorted = [...alarms]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-10"
        style={{ color: 'var(--muted)', fontSize: 13 }}
      >
        알람 이력 없음
      </div>
    );
  }

  return (
    <div className="w-full" role="list" aria-label="Alarm timeline">
      {sorted.map((alarm, idx) => {
        const dotColor = SEVERITY_COLORS[alarm.severity];
        const bg = SEVERITY_BG[alarm.severity];
        const isLast = idx === sorted.length - 1;

        return (
          <div
            key={alarm.id}
            role="listitem"
            className="flex gap-3 items-stretch min-w-0 animate-fade-in"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Left: time */}
            <div
              className="flex flex-col items-end flex-shrink-0 pt-1"
              style={{ width: 56 }}
            >
              <span style={{ color: '#1e293b', fontSize: 11, fontWeight: 600, lineHeight: 1 }}>
                {formatTime(alarm.timestamp)}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 9, marginTop: 2 }}>
                {formatDate(alarm.timestamp)}
              </span>
            </div>

            {/* Center: dot + vertical line */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: dotColor,
                  boxShadow: `0 0 0 3px ${dotColor}20, 0 0 8px ${dotColor}40`,
                  flexShrink: 0,
                  marginTop: 3,
                  border: '2px solid #ffffff',
                  animation: alarm.severity === 'CRITICAL' ? 'pulse-red 2s ease-in-out infinite' : undefined,
                }}
                aria-hidden="true"
              />
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 16,
                    background: 'linear-gradient(to bottom, #e2e8f0, #f1f5f9)',
                    marginTop: 3,
                    marginBottom: 3,
                    borderRadius: 1,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Right: content */}
            <div
              className={`flex-1 min-w-0 rounded-lg px-3 py-2 mb-${isLast ? '0' : '2'}`}
              style={{ background: bg, border: `1px solid ${dotColor}25`, marginBottom: isLast ? 0 : 8 }}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      background: `${dotColor}20`,
                      color: dotColor,
                      border: `1px solid ${dotColor}40`,
                    }}
                    aria-label={`Severity: ${alarm.severity}`}
                  >
                    {SEVERITY_LABEL[alarm.severity]}
                  </span>
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: '#1e293b' }}
                  >
                    {alarm.alarmName}
                  </span>
                </div>
                <span
                  className="text-[10px] flex-shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {alarm.alarmCode}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 min-w-0">
                <span
                  className="text-[11px] truncate"
                  style={{ color: '#94a3b8' }}
                >
                  {alarm.equipmentName}
                </span>
                <span style={{ color: '#cbd5e1', flexShrink: 0 }}>·</span>
                <span
                  className="text-[11px] truncate flex-1"
                  style={{ color: 'var(--muted)' }}
                >
                  {alarm.description}
                </span>
              </div>

              {alarm.value !== null && (
                <div className="mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    값:{' '}
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: dotColor }}
                  >
                    {alarm.value}
                  </span>
                  {alarm.spec && (
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {' '}/ 규격: {alarm.spec}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { FdcParameter } from '@/lib/types';
import { PARAMETER_STATUS_COLORS } from '@/lib/constants';
import ProcessBadge from '@/components/badges/ProcessBadge';

interface ParameterTableProps {
  parameters: FdcParameter[];
  onParameterClick?: (param: FdcParameter) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  NORMAL: {
    label: 'NORMAL',
    color: '#16a34a',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
  },
  WARNING: {
    label: 'WARN',
    color: '#d97706',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  OOS: {
    label: 'OOS',
    color: '#dc2626',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
};

function ValueCell({ value, ucl, lcl, status }: { value: number; ucl: number; lcl: number; status: string }) {
  const isOos = status === 'OOS';
  const isWarn = status === 'WARNING';
  const color = isOos
    ? PARAMETER_STATUS_COLORS.OOS
    : isWarn
    ? PARAMETER_STATUS_COLORS.WARNING
    : PARAMETER_STATUS_COLORS.NORMAL;

  // Calculate fill percentage for mini sparkbar
  const range = ucl - lcl;
  const pct = range > 0 ? Math.max(0, Math.min(1, (value - lcl) / range)) * 100 : 50;

  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <span className="text-sm font-semibold" style={{ color }}>
        {value.toFixed(4)}
      </span>
      {/* Mini bar */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: '#f1f5f9', width: 80 }}
        aria-hidden="true"
        title={`Value position: ${pct.toFixed(0)}% within spec range`}
      >
        {/* Target center */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: '50%', background: 'rgba(34,197,94,0.4)' }}
        />
        {/* Value marker */}
        <div
          className="absolute top-0 bottom-0 w-1.5 rounded-full"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default function ParameterTable({ parameters, onParameterClick }: ParameterTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className="data-table w-full text-sm border-collapse"
        aria-label="FDC parameter list"
      >
        <thead>
          <tr>
            <StaticTh label="Parameter" />
            <StaticTh label="Description" />
            <StaticTh label="Process" />
            <StaticTh label="Value" />
            <StaticTh label="Spec" />
            <StaticTh label="UCL" />
            <StaticTh label="Target" />
            <StaticTh label="LCL" />
            <StaticTh label="Status" />
            {onParameterClick && <StaticTh label="" />}
          </tr>
        </thead>
        <tbody>
          {parameters.length === 0 && (
            <tr>
              <td
                colSpan={onParameterClick ? 10 : 9}
                className="py-10 text-center"
                style={{ color: 'var(--muted)', fontSize: 13 }}
              >
                No parameters found
              </td>
            </tr>
          )}
          {parameters.map((param, idx) => {
            const isOos = param.status === 'OOS';
            const isWarn = param.status === 'WARNING';
            const cfg = STATUS_CONFIG[param.status] ?? STATUS_CONFIG.NORMAL;

            const rowStyle: React.CSSProperties = {};
            if (isOos) {
              rowStyle.background = 'rgba(239,68,68,0.04)';
              rowStyle.borderLeft = '2px solid rgba(239,68,68,0.5)';
            } else if (isWarn) {
              rowStyle.background = 'rgba(245,158,11,0.03)';
              rowStyle.borderLeft = '2px solid rgba(245,158,11,0.4)';
            }

            const clickable = !!onParameterClick;

            return (
              <tr
                key={`${param.equipmentId}-${param.parameter}-${idx}`}
                style={rowStyle}
                className={clickable ? 'cursor-pointer' : ''}
                onClick={clickable ? () => onParameterClick(param) : undefined}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? 'button' : undefined}
                aria-label={clickable ? `View parameter ${param.parameter}` : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onParameterClick(param);
                        }
                      }
                    : undefined
                }
              >
                {/* Parameter */}
                <td className="px-3 py-2.5">
                  <div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isOos ? '#dc2626' : isWarn ? '#d97706' : '#1e293b' }}
                    >
                      {param.parameter}
                    </span>
                    {param.semiStandard && (
                      <span
                        className="block text-[10px] mt-0.5"
                        style={{ color: 'var(--muted)' }}
                      >
                        {param.semiStandard}
                      </span>
                    )}
                  </div>
                </td>

                {/* Description */}
                <td className="px-3 py-2.5 max-w-[180px]">
                  <span
                    className="text-xs block truncate"
                    style={{ color: '#64748b' }}
                    title={param.description}
                  >
                    {param.description}
                  </span>
                  <span className="text-[10px] block mt-0.5" style={{ color: 'var(--muted)' }}>
                    {param.equipmentId}
                  </span>
                </td>

                {/* Process */}
                <td className="px-3 py-2.5">
                  <ProcessBadge process={param.process} />
                </td>

                {/* Value with mini bar */}
                <td className="px-3 py-2.5">
                  <ValueCell
                    value={param.value}
                    ucl={param.ucl}
                    lcl={param.lcl}
                    status={param.status}
                  />
                </td>

                {/* Spec */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-xs" style={{ color: '#64748b' }}>
                    {param.spec}
                  </span>
                  <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                    {param.unit}
                  </span>
                </td>

                {/* UCL */}
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <span className="text-xs" style={{ color: '#ef4444' }}>
                    {param.ucl.toFixed(4)}
                  </span>
                </td>

                {/* Target */}
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <span className="text-xs font-medium" style={{ color: '#16a34a' }}>
                    {param.target.toFixed(4)}
                  </span>
                </td>

                {/* LCL */}
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <span className="text-xs" style={{ color: '#ef4444' }}>
                    {param.lcl.toFixed(4)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: cfg.color,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}
                    aria-label={`Status: ${param.status}`}
                  >
                    {cfg.label}
                  </span>
                </td>

                {/* Action */}
                {onParameterClick && (
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: '#818cf8' }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StaticTh({ label }: { label: string }) {
  return (
    <th className="px-3 py-3 text-left whitespace-nowrap">
      {label && (
        <span
          style={{
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
      )}
    </th>
  );
}

'use client';

import {
  FileText,
  Clock,
  Tag,
  Printer,
  ChevronRight,
  Activity,
  Shield,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
  EquipmentStatusSection,
  AlarmSummarySection,
  SpcOverviewSection,
} from './ReportCharts';
import type { ReportData } from './useReportData';

interface InteractiveReportViewerProps {
  report: {
    title: string;
    generatedAt: string;
    type: 'shift' | 'daily';
    content: string;
  };
  reportData: ReportData;
}

// ──────────────────────────────────────────────
// KPI Mini Card
// ──────────────────────────────────────────────
interface KpiMiniProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function KpiMini({ label, value, icon, color, bgColor }: KpiMiniProps) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{ background: bgColor, border: `1px solid ${color}20` }}
    >
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${color}15` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-tight" style={{ color }}>
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Section heading (reuse pattern from ReportViewer)
// ──────────────────────────────────────────────
function SectionHeading({ text }: { text: string }) {
  const colorMap: Record<string, string> = {
    '설비 상태': '#16a34a',
    '설비 현황': '#16a34a',
    'Equipment': '#16a34a',
    '이상 감지': '#dc2626',
    '알람': '#dc2626',
    'Alarm': '#dc2626',
    'SPC': '#d97706',
    '권고': '#4f46e5',
    '조치': '#4f46e5',
    '인수인계': '#4f46e5',
    '요약': '#6366f1',
    '수율': '#dc2626',
    'FDC': '#d97706',
  };

  const accentColor = Object.entries(colorMap).find(([k]) => text.includes(k))?.[1] ?? '#4f46e5';

  return (
    <div
      className="mb-3 mt-6 flex items-center gap-3"
      style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}
    >
      <span
        className="h-4 w-0.5 flex-shrink-0 rounded-full"
        style={{ background: accentColor }}
      />
      <h3 className="text-sm font-semibold" style={{ color: accentColor }}>
        {text}
      </h3>
    </div>
  );
}

// ──────────────────────────────────────────────
// Inline markdown renderer
// ──────────────────────────────────────────────
function renderInline(line: string, key: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              className="rounded px-1 py-0.5 text-xs font-mono"
              style={{
                background: '#f1f5f9',
                color: '#0e7490',
                border: '1px solid #e2e8f0',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function renderMarkdownBlock(content: string): React.ReactNode {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;
  let codeBlockKey = 0;

  // Table detection
  let tableRows: string[][] = [];
  let inTable = false;

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const body = tableRows.slice(1).filter(
      (row) => !row.every((cell) => /^[-:]+$/.test(cell.trim()))
    );

    nodes.push(
      <div key={`table-${codeBlockKey++}`} className="my-3 overflow-x-auto">
        <table className="data-table w-full text-xs">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-2.5 py-1.5 text-left">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2.5 py-1.5" style={{ color: '#475569' }}>
                    {renderInline(cell.trim(), `tc-${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    // Code blocks
    if (line.trimStart().startsWith('```')) {
      if (inTable) flushTable();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlock = [];
      } else {
        inCodeBlock = false;
        nodes.push(
          <pre
            key={`code-${codeBlockKey++}`}
            className="my-3 overflow-x-auto rounded-lg p-3 text-xs font-mono leading-relaxed"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0e7490',
            }}
          >
            <code>{codeBlock.join('\n')}</code>
          </pre>
        );
      }
      return;
    }
    if (inCodeBlock) { codeBlock.push(line); return; }

    // Table rows
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      if (cells.length > 0) {
        if (!inTable) inTable = true;
        tableRows.push(cells);
        return;
      }
    } else if (inTable) {
      flushTable();
    }

    // ### sub-heading
    if (line.startsWith('### ')) {
      nodes.push(
        <h4
          key={idx}
          className="mb-1 mt-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#64748b' }}
        >
          {renderInline(line.slice(4), `h4-${idx}`)}
        </h4>
      );
      return;
    }
    // Bullets
    if (/^[•\-*]\s/.test(line)) {
      const bulletText = line.slice(2).trim();
      nodes.push(
        <div key={idx} className="flex items-start gap-2 py-0.5 text-sm leading-relaxed" style={{ color: '#475569' }}>
          <ChevronRight size={12} className="mt-[3px] flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span>{renderInline(bulletText, `li-${idx}`)}</span>
        </div>
      );
      return;
    }
    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.*)$/);
      if (m) {
        nodes.push(
          <div key={idx} className="flex items-start gap-2 py-0.5 text-sm leading-relaxed" style={{ color: '#475569' }}>
            <span
              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-xs font-bold"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5', fontSize: '0.6rem' }}
            >
              {m[1]}
            </span>
            <span>{renderInline(m[2], `ol-${idx}`)}</span>
          </div>
        );
        return;
      }
    }
    // HR
    if (/^-{3,}$/.test(line.trim())) {
      nodes.push(<hr key={idx} className="my-4" style={{ borderColor: '#e2e8f0' }} />);
      return;
    }
    // Blank
    if (line.trim() === '') {
      nodes.push(<div key={idx} className="h-2" />);
      return;
    }
    // Paragraph
    nodes.push(
      <p key={idx} className="text-sm leading-relaxed" style={{ color: '#475569' }}>
        {renderInline(line, `p-${idx}`)}
      </p>
    );
  });

  if (inTable) flushTable();

  return <>{nodes}</>;
}

// ──────────────────────────────────────────────
// Split AI content into sections by ## headings
// ──────────────────────────────────────────────
interface ContentSection {
  heading: string;
  body: string;
}

function splitBySections(content: string): ContentSection[] {
  const lines = content.split('\n');
  const sections: ContentSection[] = [];
  let currentHeading = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Flush previous section
      if (currentHeading || currentBody.length > 0) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n') });
      }
      currentHeading = line.slice(3).trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  // Flush last section
  if (currentHeading || currentBody.length > 0) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n') });
  }

  return sections;
}

// ──────────────────────────────────────────────
// Determine which chart to show after a section
// ──────────────────────────────────────────────
type ChartSlot = 'equipment_alarm' | 'spc' | null;

function classifySection(heading: string): ChartSlot {
  const h = heading.toLowerCase();
  if (h.includes('설비') || h.includes('equipment') || h.includes('알람') || h.includes('alarm') || h.includes('이상')) {
    return 'equipment_alarm';
  }
  if (h.includes('spc') || h.includes('cpk') || h.includes('공정')) {
    return 'spc';
  }
  return null;
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function InteractiveReportViewer({
  report,
  reportData,
}: InteractiveReportViewerProps) {
  const { kpi, spcItems, alarms } = reportData;

  const typeLabel = report.type === 'daily' ? '일별 리포트' : '교대 리포트';
  const typeColors = {
    daily: { bg: 'rgba(99,102,241,0.08)', color: '#4f46e5', border: 'rgba(99,102,241,0.2)' },
    shift: { bg: 'rgba(34,197,94,0.08)', color: '#16a34a', border: 'rgba(34,197,94,0.2)' },
  };
  const colors = typeColors[report.type];

  const handlePrint = () => window.print();

  // Split content into sections
  const sections = splitBySections(report.content);

  // Track which chart slots have been rendered
  const renderedSlots = new Set<ChartSlot>();

  return (
    <div className="glass-card overflow-hidden" id="interactive-report">
      {/* ── Report header ── */}
      <div
        className="flex items-start justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(99,102,241,0.08)' }}
          >
            <FileText size={16} style={{ color: 'var(--accent-light)' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{report.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                style={{
                  background: colors.bg,
                  color: colors.color,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Tag size={9} />
                {typeLabel}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                <Clock size={10} />
                {report.generatedAt}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors print:hidden"
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#64748b',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#1e293b';
            (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
            (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9';
          }}
          aria-label="리포트 인쇄"
        >
          <Printer size={12} />
          인쇄
        </button>
      </div>

      {/* ── Content area ── */}
      <div className="px-5 py-4 space-y-4" id="report-print-area">

        {/* KPI Summary Bar */}
        {kpi && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiMini
              label="총 설비"
              value={kpi.totalEquipment}
              icon={<Activity size={14} style={{ color: '#6366f1' }} />}
              color="#6366f1"
              bgColor="rgba(99,102,241,0.05)"
            />
            <KpiMini
              label="활성 알람"
              value={kpi.activeAlarms}
              icon={<AlertTriangle size={14} style={{ color: '#ef4444' }} />}
              color="#ef4444"
              bgColor="rgba(239,68,68,0.05)"
            />
            <KpiMini
              label="OOS 파라미터"
              value={kpi.oosParameters}
              icon={<Shield size={14} style={{ color: '#f59e0b' }} />}
              color="#f59e0b"
              bgColor="rgba(245,158,11,0.05)"
            />
            <KpiMini
              label="평균 Cpk"
              value={kpi.avgCpk.toFixed(2)}
              icon={<BarChart3 size={14} style={{ color: '#22c55e' }} />}
              color={kpi.avgCpk >= 1.33 ? '#22c55e' : kpi.avgCpk >= 1.0 ? '#f59e0b' : '#ef4444'}
              bgColor={
                kpi.avgCpk >= 1.33
                  ? 'rgba(34,197,94,0.05)'
                  : kpi.avgCpk >= 1.0
                    ? 'rgba(245,158,11,0.05)'
                    : 'rgba(239,68,68,0.05)'
              }
            />
          </div>
        )}

        {/* Sections with interleaved charts */}
        {sections.map((section, idx) => {
          const slot = classifySection(section.heading);
          const shouldRenderChart = slot && !renderedSlots.has(slot) && kpi;
          if (shouldRenderChart) renderedSlots.add(slot);

          return (
            <div key={idx}>
              {/* Section heading */}
              {section.heading && <SectionHeading text={section.heading} />}

              {/* AI Text */}
              {section.body.trim() && (
                <div className="space-y-0.5">
                  {renderMarkdownBlock(section.body)}
                </div>
              )}

              {/* Interleaved chart after matching section */}
              {shouldRenderChart && slot === 'equipment_alarm' && kpi && (
                <div
                  className="mt-4 grid grid-cols-1 gap-4 rounded-2xl p-4 sm:grid-cols-2"
                  style={{
                    background: 'rgba(248,250,252,0.6)',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <EquipmentStatusSection kpi={kpi} />
                  <AlarmSummarySection kpi={kpi} alarms={alarms} />
                </div>
              )}

              {shouldRenderChart && slot === 'spc' && spcItems.length > 0 && (
                <div
                  className="mt-4 rounded-2xl p-4"
                  style={{
                    background: 'rgba(248,250,252,0.6)',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <SpcOverviewSection spcItems={spcItems} />
                </div>
              )}
            </div>
          );
        })}

        {/* If no sections triggered charts, show them at the end */}
        {kpi && !renderedSlots.has('equipment_alarm') && (
          <div
            className="mt-4 grid grid-cols-1 gap-4 rounded-2xl p-4 sm:grid-cols-2"
            style={{
              background: 'rgba(248,250,252,0.6)',
              border: '1px solid #f1f5f9',
            }}
          >
            <EquipmentStatusSection kpi={kpi} />
            <AlarmSummarySection kpi={kpi} alarms={alarms} />
          </div>
        )}

        {spcItems.length > 0 && !renderedSlots.has('spc') && (
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              background: 'rgba(248,250,252,0.6)',
              border: '1px solid #f1f5f9',
            }}
          >
            <SpcOverviewSection spcItems={spcItems} />
          </div>
        )}
      </div>
    </div>
  );
}

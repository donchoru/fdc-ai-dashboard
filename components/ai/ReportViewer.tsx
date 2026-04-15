'use client';

import { FileText, Clock, Tag, Printer, ChevronRight } from 'lucide-react';

interface ReportViewerProps {
  report: {
    title: string;
    generatedAt: string;
    type: 'shift' | 'daily';
    content: string;
  } | null;
}

// ──────────────────────────────────────────────
// Inline markdown with section-aware rendering
// ──────────────────────────────────────────────
function renderSection(content: string): React.ReactNode {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;
  let codeBlockKey = 0;

  const renderInline = (line: string, key: string): React.ReactNode => {
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
  };

  lines.forEach((line, idx) => {
    if (line.trimStart().startsWith('```')) {
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

    // ## section heading — rendered as a section divider
    if (line.startsWith('## ')) {
      nodes.push(
        <SectionHeading key={idx} text={line.slice(3)} />
      );
      return;
    }
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
    if (/^[•\-\*]\s/.test(line)) {
      const bulletText = line.slice(2).trim();
      nodes.push(
        <div key={idx} className="flex items-start gap-2 py-0.5 text-sm leading-relaxed" style={{ color: '#475569' }}>
          <ChevronRight size={12} className="mt-[3px] flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span>{renderInline(bulletText, `li-${idx}`)}</span>
        </div>
      );
      return;
    }
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
    if (/^-{3,}$/.test(line.trim())) {
      nodes.push(<hr key={idx} className="my-4" style={{ borderColor: '#e2e8f0' }} />);
      return;
    }
    if (line.trim() === '') {
      nodes.push(<div key={idx} className="h-2" />);
      return;
    }
    nodes.push(
      <p key={idx} className="text-sm leading-relaxed" style={{ color: '#475569' }}>
        {renderInline(line, `p-${idx}`)}
      </p>
    );
  });

  return <>{nodes}</>;
}

function SectionHeading({ text }: { text: string }) {
  // Map known section names to accent colors
  const colorMap: Record<string, string> = {
    '설비 상태': '#16a34a',
    'Equipment Status': '#16a34a',
    '이상 감지': '#dc2626',
    'Active Anomalies': '#dc2626',
    'SPC': '#d97706',
    '권고 조치': '#4f46e5',
    'Recommended': '#4f46e5',
    'Actions': '#4f46e5',
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
// Main component
// ──────────────────────────────────────────────
export default function ReportViewer({ report }: ReportViewerProps) {
  const typeLabel = report?.type === 'daily' ? '일별 리포트' : '교대 리포트';
  const typeColors = {
    daily: { bg: 'rgba(99,102,241,0.08)', color: '#4f46e5', border: 'rgba(99,102,241,0.2)' },
    shift: { bg: 'rgba(34,197,94,0.08)', color: '#16a34a', border: 'rgba(34,197,94,0.2)' },
  };
  const colors = report ? typeColors[report.type] : typeColors.shift;

  const handlePrint = () => window.print();

  // ── Empty state ──
  if (!report) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.08)' }}
        >
          <FileText size={26} style={{ color: 'rgba(99,102,241,0.35)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>
          리포트 없음
        </p>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
          리포트가 생성되면 여기에 표시됩니다. AI 분석 패널에서 "생성" 버튼을 누르세요.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
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
              {/* Type badge */}
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
              {/* Generated time */}
              <span className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                <Clock size={10} />
                {report.generatedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Print button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
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

      {/* ── Report content ── */}
      <div
        className="overflow-y-auto px-5 py-4"
        style={{ maxHeight: '600px' }}
        id="report-print-area"
      >
        <div className="space-y-0.5">{renderSection(report.content)}</div>
      </div>

      {/* ── Print styles injected inline ── */}
      <style jsx global>{`
        @media print {
          body > *:not(#report-print-area) { display: none !important; }
          #report-print-area {
            max-height: none !important;
            overflow: visible !important;
            color: #000 !important;
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}

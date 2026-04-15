'use client';

import { useState } from 'react';
import { FileText, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AiReportPanelProps {
  title?: string;
  onGenerate: () => void;
  content: string;
  isStreaming: boolean;
  error?: string | null;
}

// ──────────────────────────────────────────────
// Inline markdown renderer — no external deps
// Supports: ## headers, **bold**, • bullets, ```code```
// ──────────────────────────────────────────────
function renderMarkdown(text: string, isStreaming: boolean): React.ReactNode {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;
  let codeBlockKey = 0;

  const renderInline = (line: string, key: string): React.ReactNode => {
    // Split on **bold** markers
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  lines.forEach((line, idx) => {
    const isLast = idx === lines.length - 1;

    // Code block toggle
    if (line.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlock = [];
      } else {
        inCodeBlock = false;
        const blockContent = codeBlock.join('\n');
        nodes.push(
          <pre
            key={`code-${codeBlockKey++}`}
            className="my-3 overflow-x-auto rounded-lg p-3 text-xs font-mono leading-relaxed"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#a5f3fc',
            }}
          >
            <code>{blockContent}</code>
          </pre>
        );
      }
      return;
    }

    if (inCodeBlock) {
      codeBlock.push(line);
      return;
    }

    // ## H2 header
    if (line.startsWith('## ')) {
      const heading = line.slice(3);
      nodes.push(
        <h2
          key={idx}
          className="mb-2 mt-5 flex items-center gap-2 text-sm font-semibold tracking-wide"
          style={{ color: 'var(--accent-light)' }}
        >
          <span
            className="inline-block h-[1px] w-4 flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          />
          {renderInline(heading, `h2-inner-${idx}`)}
        </h2>
      );
      return;
    }

    // ### H3 header
    if (line.startsWith('### ')) {
      const heading = line.slice(4);
      nodes.push(
        <h3
          key={idx}
          className="mb-1 mt-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#94a3b8' }}
        >
          {renderInline(heading, `h3-inner-${idx}`)}
        </h3>
      );
      return;
    }

    // Bullet points — • or - or *
    if (/^[•\-\*]\s/.test(line)) {
      const bulletText = line.slice(2).trim();
      nodes.push(
        <li
          key={idx}
          className="mb-1 flex items-start gap-2 text-sm leading-relaxed"
          style={{ color: '#cbd5e1' }}
        >
          <span
            className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
          {renderInline(bulletText, `li-inner-${idx}`)}
        </li>
      );
      return;
    }

    // Numbered list  1. 2. etc.
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        nodes.push(
          <li
            key={idx}
            className="mb-1 flex items-start gap-2 text-sm leading-relaxed"
            style={{ color: '#cbd5e1' }}
          >
            <span
              className="mt-[2px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-xs font-bold"
              style={{
                background: 'rgba(99,102,241,0.2)',
                color: 'var(--accent-light)',
                fontSize: '0.6rem',
              }}
            >
              {match[1]}
            </span>
            {renderInline(match[2], `ol-inner-${idx}`)}
          </li>
        );
        return;
      }
    }

    // Horizontal rule ---
    if (/^-{3,}$/.test(line.trim())) {
      nodes.push(
        <hr
          key={idx}
          className="my-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        />
      );
      return;
    }

    // Empty line — spacing
    if (line.trim() === '') {
      nodes.push(<div key={idx} className="h-2" />);
      return;
    }

    // Plain paragraph — add cursor blink on last line while streaming
    const isLastLine = isLast && isStreaming;
    nodes.push(
      <p
        key={idx}
        className={`text-sm leading-relaxed${isLastLine ? ' cursor-blink' : ''}`}
        style={{ color: '#cbd5e1' }}
      >
        {renderInline(line, `p-inner-${idx}`)}
      </p>
    );
  });

  return <>{nodes}</>;
}

// ──────────────────────────────────────────────
// Loading dots animation
// ──────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: 'var(--accent)',
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function AiReportPanel({
  title = 'AI 분석 리포트',
  onGenerate,
  content,
  isStreaming,
  error,
}: AiReportPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isEmpty = !content && !isStreaming && !error;

  return (
    <div className="glass-card flex flex-col" style={{ minHeight: '200px' }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(99,102,241,0.15)' }}
          >
            <FileText size={15} style={{ color: 'var(--accent-light)' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isStreaming ? '생성 중...' : content ? 'AI 분석 완료' : '리포트를 생성하세요'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse toggle — only when there is content */}
          {content && !isStreaming && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#64748b',
              }}
              aria-label={collapsed ? '펼치기' : '접기'}
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}

          {/* Generate button */}
          <button
            onClick={onGenerate}
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all"
            style={{
              background: isStreaming
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              boxShadow: isStreaming ? 'none' : '0 2px 12px rgba(99,102,241,0.35)',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              opacity: isStreaming ? 0.7 : 1,
            }}
            aria-busy={isStreaming}
          >
            <RefreshCw
              size={12}
              className={isStreaming ? 'animate-spin' : ''}
            />
            {isStreaming ? '생성 중' : '생성'}
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      {!collapsed && (
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ maxHeight: '480px' }}
          aria-live="polite"
          aria-atomic={false}
        >
          {/* Error state */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl p-3"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
              role="alert"
            >
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#fca5a5' }} />
              <p className="text-sm" style={{ color: '#fca5a5' }}>
                {error}
              </p>
            </div>
          )}

          {/* Streaming loading dots (no content yet) */}
          {isStreaming && !content && !error && <LoadingDots />}

          {/* Rendered markdown content */}
          {content && !error && (
            <div className="space-y-0.5">
              {renderMarkdown(content, isStreaming)}
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(99,102,241,0.08)' }}
              >
                <FileText size={22} style={{ color: 'rgba(99,102,241,0.4)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#475569' }}>
                리포트 없음
              </p>
              <p className="mt-1 text-xs" style={{ color: '#334155' }}>
                "생성" 버튼을 눌러 AI 분석을 시작하세요
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

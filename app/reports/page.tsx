'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Clock,
  CalendarDays,
  Sparkles,
  Settings,
  ChevronRight,
  History,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import GlassCard from '@/components/cards/GlassCard';
import AiReportPanel from '@/components/ai/AiReportPanel';
import ReportViewer from '@/components/ai/ReportViewer';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
type ReportType = 'shift' | 'daily';

interface HistoryEntry {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  content: string;
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
function formatDateTime(date: Date): string {
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeTitle(type: ReportType, date: Date): string {
  const base = type === 'shift' ? '교대 리포트' : '일별 리포트';
  const dateStr = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
  return `${dateStr} ${base}`;
}

// ─────────────────────────────────────────────────────
// ConfigWarning — shown when API key is missing
// ─────────────────────────────────────────────────────
function ConfigWarning() {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.2)',
      }}
      role="alert"
    >
      <AlertCircle
        size={16}
        className="mt-0.5 flex-shrink-0"
        style={{ color: '#fcd34d' }}
      />
      <div>
        <p className="text-sm font-medium" style={{ color: '#fcd34d' }}>
          LLM API 키가 설정되지 않았습니다
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: '#92400e' }}>
          AI 리포트 기능을 사용하려면 Settings 페이지에서 API 키를 설정하세요.
        </p>
        <a
          href="/settings"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: '#fbbf24' }}
        >
          <Settings size={11} />
          설정 바로가기
          <ChevronRight size={11} />
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ReportTypeCard — large selection card
// ─────────────────────────────────────────────────────
interface ReportTypeCardProps {
  type: ReportType;
  isActive: boolean;
  isStreaming: boolean;
  onGenerate: (type: ReportType) => void;
}

function ReportTypeCard({
  type,
  isActive,
  isStreaming,
  onGenerate,
}: ReportTypeCardProps) {
  const isShift = type === 'shift';

  const config = isShift
    ? {
        icon: Clock,
        title: '교대 리포트',
        subtitle: 'Shift Report',
        description:
          '현재 교대 기간의 설비 상태, 이상 현황, SPC 요약을 분석합니다',
        badge: '8h',
        accentColor: '#22c55e',
        accentBg: 'rgba(34,197,94,0.1)',
        accentBorder: 'rgba(34,197,94,0.25)',
        glowColor: 'rgba(34,197,94,0.15)',
        btnGradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
        btnShadow: '0 2px 14px rgba(34,197,94,0.35)',
      }
    : {
        icon: CalendarDays,
        title: '일별 리포트',
        subtitle: 'Daily Report',
        description: '금일 전체 FAB 운영 현황을 종합 분석합니다',
        badge: '24h',
        accentColor: 'var(--accent-light)',
        accentBg: 'rgba(99,102,241,0.1)',
        accentBorder: 'rgba(99,102,241,0.25)',
        glowColor: 'rgba(99,102,241,0.15)',
        btnGradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        btnShadow: '0 2px 14px rgba(99,102,241,0.35)',
      };

  const Icon = config.icon;
  const isThisStreaming = isStreaming && isActive;

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300"
      style={{
        background: isActive
          ? `rgba(255,255,255,0.05)`
          : 'rgba(255,255,255,0.02)',
        border: isActive
          ? `1px solid ${config.accentBorder}`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isActive ? `0 0 24px ${config.glowColor}` : 'none',
      }}
    >
      {/* Active shimmer line */}
      {isActive && (
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: config.btnGradient }}
        />
      )}

      {/* Icon + badge row */}
      <div className="mb-3 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: config.accentBg }}
        >
          <Icon size={18} style={{ color: config.accentColor }} />
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums"
          style={{
            background: config.accentBg,
            color: config.accentColor,
            border: `1px solid ${config.accentBorder}`,
          }}
        >
          {config.badge}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-white">{config.title}</h2>
      <p className="text-xs" style={{ color: '#64748b' }}>
        {config.subtitle}
      </p>

      {/* Description */}
      <p
        className="mt-2 text-xs leading-relaxed"
        style={{ color: '#94a3b8' }}
      >
        {config.description}
      </p>

      {/* Generate button */}
      <button
        onClick={() => onGenerate(type)}
        disabled={isStreaming}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all duration-200"
        style={{
          background: isStreaming
            ? 'rgba(255,255,255,0.06)'
            : config.btnGradient,
          boxShadow: isStreaming ? 'none' : config.btnShadow,
          cursor: isStreaming ? 'not-allowed' : 'pointer',
          opacity: isStreaming && !isThisStreaming ? 0.4 : 1,
        }}
        aria-busy={isThisStreaming}
        aria-label={`${config.title} 생성`}
      >
        {isThisStreaming ? (
          <>
            <RefreshCw size={13} className="animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles size={13} />
            AI 리포트 생성
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HistoryItem
// ─────────────────────────────────────────────────────
interface HistoryItemProps {
  entry: HistoryEntry;
  isSelected: boolean;
  onClick: () => void;
}

function HistoryItem({ entry, isSelected, onClick }: HistoryItemProps) {
  const typeConfig = {
    shift: { label: '교대', color: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    daily: { label: '일별', color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
  };
  const cfg = typeConfig[entry.type];

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
      style={{
        background: isSelected
          ? 'rgba(99,102,241,0.1)'
          : 'rgba(255,255,255,0.02)',
        border: isSelected
          ? '1px solid rgba(99,102,241,0.2)'
          : '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLButtonElement).style.background =
            'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLButtonElement).style.background =
            'rgba(255,255,255,0.02)';
      }}
      aria-pressed={isSelected}
    >
      <div
        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: cfg.bg }}
      >
        <FileText size={11} style={{ color: cfg.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white">{entry.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className="inline-block rounded px-1.5 py-0 text-[10px] font-medium"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>
          <span className="text-[10px]" style={{ color: '#475569' }}>
            {entry.generatedAt}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeType, setActiveType] = useState<ReportType | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  // History — latest generated reports
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryEntry | null>(null);

  // Viewer shows either the final completed report or selected history item
  const [viewerReport, setViewerReport] = useState<{
    title: string;
    generatedAt: string;
    type: ReportType;
    content: string;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // When streaming finishes, move content to viewer + add to history
  const finalizeReport = (type: ReportType, content: string) => {
    const now = new Date();
    const entry: HistoryEntry = {
      id: `${type}-${Date.now()}`,
      type,
      title: makeTitle(type, now),
      generatedAt: formatDateTime(now),
      content,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 10));
    setSelectedHistory(entry);
    setViewerReport({
      title: entry.title,
      generatedAt: entry.generatedAt,
      type,
      content,
    });
  };

  const generateReport = async (type: ReportType) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setActiveType(type);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);
    setConfigError(false);
    setSelectedHistory(null);
    setViewerReport(null);

    let accumulated = '';

    try {
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        signal: abort.signal,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const msg: string = json?.error ?? `HTTP ${response.status}`;
        if (msg.toLowerCase().includes('api key') || response.status === 400) {
          setConfigError(true);
        }
        setError(msg);
        setIsStreaming(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            setIsStreaming(false);
            finalizeReport(type, accumulated);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setStreamingContent(accumulated);
            }
            if (parsed.error) {
              const errMsg: string = parsed.error;
              if (errMsg.toLowerCase().includes('api key')) {
                setConfigError(true);
              }
              setError(errMsg);
              setIsStreaming(false);
              return;
            }
          } catch {
            // malformed JSON chunk — skip
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsStreaming(false);
    }
  };

  // When user picks a history entry
  const handleHistorySelect = (entry: HistoryEntry) => {
    setSelectedHistory(entry);
    setViewerReport({
      title: entry.title,
      generatedAt: entry.generatedAt,
      type: entry.type,
      content: entry.content,
    });
    // Reset streaming panel
    setStreamingContent('');
    setError(null);
    setActiveType(entry.type);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const showStreamingPanel = isStreaming || (!!streamingContent && !selectedHistory);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <header className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.15))',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 0 20px rgba(99,102,241,0.1)',
              }}
            >
              <Zap size={20} style={{ color: 'var(--accent-light)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                AI Reports
              </h1>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Generative AI가 FDC/SPC 데이터를 분석하여 자동으로 교대/일일 리포트를 작성합니다
              </p>
            </div>
          </div>
        </header>

        {/* ── Config warning ── */}
        {configError && (
          <div className="mb-6">
            <ConfigWarning />
          </div>
        )}

        {/* ── Main layout: left column + right sidebar ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">

          {/* ── LEFT: Report Type Selection + Panel/Viewer ── */}
          <div className="flex flex-col gap-6">

            {/* Report type selection cards */}
            <section aria-label="리포트 유형 선택">
              <p
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#475569' }}
              >
                <Sparkles size={10} style={{ color: 'var(--accent)' }} />
                리포트 유형
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReportTypeCard
                  type="shift"
                  isActive={activeType === 'shift'}
                  isStreaming={isStreaming}
                  onGenerate={generateReport}
                />
                <ReportTypeCard
                  type="daily"
                  isActive={activeType === 'daily'}
                  isStreaming={isStreaming}
                  onGenerate={generateReport}
                />
              </div>
            </section>

            {/* Streaming panel — visible while generating */}
            {showStreamingPanel && (
              <section aria-label="AI 리포트 생성 중">
                <AiReportPanel
                  title={
                    activeType === 'shift'
                      ? '교대 리포트 생성 중'
                      : '일별 리포트 생성 중'
                  }
                  onGenerate={() => activeType && generateReport(activeType)}
                  content={streamingContent}
                  isStreaming={isStreaming}
                  error={error}
                />
              </section>
            )}

            {/* Viewer — shows formatted report after completion or history selection */}
            {viewerReport && (
              <section aria-label="AI 생성 리포트">
                <p
                  className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#475569' }}
                >
                  <FileText size={10} style={{ color: 'var(--accent)' }} />
                  생성 완료
                </p>
                <ReportViewer report={viewerReport} />
              </section>
            )}

            {/* Empty state — nothing generated yet */}
            {!showStreamingPanel && !viewerReport && !configError && (
              <div
                className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
                style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px dashed rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(99,102,241,0.07)' }}
                >
                  <FileText
                    size={26}
                    style={{ color: 'rgba(99,102,241,0.3)' }}
                  />
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: '#475569' }}
                >
                  리포트를 생성하세요
                </p>
                <p
                  className="mt-1.5 max-w-xs text-xs leading-relaxed"
                  style={{ color: '#334155' }}
                >
                  위의 카드에서 리포트 유형을 선택하고 &ldquo;AI 리포트 생성&rdquo; 버튼을 누르세요
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR: History ── */}
          <aside aria-label="리포트 기록">
            <div className="glass-card p-4">
              <div
                className="mb-3 flex items-center gap-2 pb-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.12)' }}
                >
                  <History size={12} style={{ color: 'var(--accent-light)' }} />
                </div>
                <h3 className="text-xs font-semibold text-white">
                  생성 기록
                </h3>
                {history.length > 0 && (
                  <span
                    className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{
                      background: 'rgba(99,102,241,0.15)',
                      color: 'var(--accent-light)',
                    }}
                  >
                    {history.length}
                  </span>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center">
                  <History
                    size={22}
                    className="mx-auto mb-2"
                    style={{ color: 'rgba(255,255,255,0.08)' }}
                  />
                  <p className="text-xs" style={{ color: '#1e293b' }}>
                    아직 생성된 리포트가 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((entry) => (
                    <HistoryItem
                      key={entry.id}
                      entry={entry}
                      isSelected={selectedHistory?.id === entry.id}
                      onClick={() => handleHistorySelect(entry)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tips card */}
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.12)',
              }}
            >
              <p
                className="mb-2 text-xs font-semibold"
                style={{ color: 'var(--accent-light)' }}
              >
                AI 리포트 안내
              </p>
              <ul className="space-y-1.5">
                {[
                  '교대 리포트: 최근 8시간 기준',
                  '일별 리포트: 최근 24시간 기준',
                  '생성 후 인쇄 기능 지원',
                  '최근 10건 기록 자동 저장',
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs leading-relaxed"
                    style={{ color: '#64748b' }}
                  >
                    <span
                      className="mt-[5px] h-1 w-1 flex-shrink-0 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.4)' }}
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

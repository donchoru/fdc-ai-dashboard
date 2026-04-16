'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Settings,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Cpu,
  Activity,
  BarChart2,
  Wrench,
} from 'lucide-react';
import AiChatBox from '@/components/ai/AiChatBox';
import type { ChatMessage } from '@/lib/types';

// ─────────────────────────────────────────────────────
// Suggested questions — FDC-domain specific
// ─────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  'ETCH-001 장비의 현재 Chamber 상태를 분석해주세요',
  '현재 활성 알람의 Root Cause를 분석해주세요',
  '금일 SPC OOC 발생 현황을 요약해주세요',
  'CMP 패드 수명 예측과 교체 시기를 추천해주세요',
];

// ─────────────────────────────────────────────────────
// Quick question chip data (shown in header panel)
// ─────────────────────────────────────────────────────
const QUICK_CHIPS = [
  {
    icon: Cpu,
    label: '설비 상태',
    question: '전체 설비 상태 요약과 특이사항을 알려주세요',
  },
  {
    icon: AlertCircle,
    label: '활성 알람',
    question: '현재 활성 알람을 Critical 순으로 분석해주세요',
  },
  {
    icon: BarChart2,
    label: 'SPC 현황',
    question: '금일 SPC OOC 발생 현황과 공정 능력 지수를 분석해주세요',
  },
  {
    icon: Wrench,
    label: 'PM 예측',
    question: '각 설비의 PM(예방 정비) 시기를 예측하고 우선순위를 제안해주세요',
  },
];

// ─────────────────────────────────────────────────────
// ConfigWarning
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
        style={{ color: '#d97706' }}
      />
      <div>
        <p className="text-sm font-medium" style={{ color: '#92400e' }}>
          LLM API 키가 설정되지 않았습니다
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: '#78350f' }}>
          AI 채팅 기능을 사용하려면 Settings 페이지에서 API 키를 설정하세요.
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
// QuickChips — shown above the chat when empty
// ─────────────────────────────────────────────────────
interface QuickChipsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
}

function QuickChips({ onSelect, disabled }: QuickChipsProps) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <p
        className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#475569' }}
      >
        <Sparkles size={10} style={{ color: 'var(--accent)' }} />
        빠른 질문
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {QUICK_CHIPS.map(({ icon: Icon, label, question }) => (
          <button
            key={label}
            onClick={() => !disabled && onSelect(question)}
            disabled={disabled}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-left transition-all duration-150"
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(99,102,241,0.06)';
                el.style.borderColor = 'rgba(99,102,241,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = '#f1f5f9';
              el.style.borderColor = '#e2e8f0';
            }}
            aria-label={`빠른 질문: ${label}`}
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(99,102,241,0.1)' }}
            >
              <Icon size={13} style={{ color: 'var(--accent-light)' }} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-800">{label}</p>
              <p
                className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed"
                style={{ color: '#64748b' }}
              >
                {question}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// StatusBar — live indicator row at top of chat
// ─────────────────────────────────────────────────────
function StatusBar({ messageCount }: { messageCount: number }) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl px-3.5 py-2"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: 'var(--success)',
            boxShadow: '0 0 5px var(--success)',
            animation: 'pulse-red 2.5s infinite',
          }}
        />
        <span className="text-xs" style={{ color: '#64748b' }}>
          실시간 연결
        </span>
      </div>
      <span
        className="h-3 w-[1px]"
        style={{ background: '#e2e8f0' }}
      />
      <div className="flex items-center gap-1.5">
        <Activity size={11} style={{ color: '#475569' }} />
        <span className="text-xs" style={{ color: '#64748b' }}>
          FDC 데이터 연동
        </span>
      </div>
      {messageCount > 0 && (
        <>
          <span
            className="h-3 w-[1px]"
            style={{ background: '#e2e8f0' }}
          />
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: 'var(--accent-light)',
            }}
          >
            {messageCount}개 메시지
          </span>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [configError, setConfigError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const userMsg: ChatMessage = { role: 'user', content: message };
    const updatedMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setConfigError(false);

    // Append empty assistant message immediately (will be filled via streaming)
    let assistantContent = '';
    setMessages([...updatedMessages, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abort.signal,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const msg: string = json?.error ?? `HTTP ${response.status}`;
        if (msg.toLowerCase().includes('api key') || response.status === 400) {
          setConfigError(true);
        }
        // Replace empty assistant bubble with error text
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: `오류: ${msg}`,
          },
        ]);
        setIsLoading(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            setIsLoading(false);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              const finalContent = assistantContent;
              setMessages([
                ...updatedMessages,
                { role: 'assistant', content: finalContent },
              ]);
            }
            if (parsed.error) {
              const errMsg: string = parsed.error;
              if (errMsg.toLowerCase().includes('api key')) {
                setConfigError(true);
              }
              setMessages([
                ...updatedMessages,
                { role: 'assistant', content: `오류: ${errMsg}` },
              ]);
              setIsLoading(false);
              return;
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      const errText =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `오류: ${errText}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const visibleMessages = messages.filter((m) => m.role !== 'system');
  const isEmpty = visibleMessages.length === 0 && !isLoading;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <header className="mb-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.15))',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 0 20px rgba(99,102,241,0.1)',
              }}
            >
              <MessageSquare size={20} style={{ color: 'var(--accent-light)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                AI 질문 — FDC 어시스턴트
              </h1>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: '#64748b' }}
              >
                반도체 FDC/SPC 데이터에 대해 자유롭게 질문하세요.
                AI가 실시간 데이터를 분석하여 답변합니다.
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

        {/* ── Status bar ── */}
        <div className="mb-4">
          <StatusBar messageCount={visibleMessages.length} />
        </div>

        {/* ── Quick chips (only when chat is empty) ── */}
        {isEmpty && (
          <div className="mb-4">
            <QuickChips onSelect={sendMessage} disabled={isLoading} />
          </div>
        )}

        {/* ── Chat interface ── */}
        <AiChatBox
          messages={messages}
          onSend={sendMessage}
          isLoading={isLoading}
          suggestedQuestions={SUGGESTED_QUESTIONS}
        />

        {/* ── Disclaimer ── */}
        <p
          className="mt-3 text-center text-xs"
          style={{ color: '#94a3b8' }}
        >
          AI 응답은 참고용입니다. 설비 제어 및 공정 변경 전 반드시 담당 엔지니어가 확인하세요.
        </p>
      </div>
    </div>
  );
}

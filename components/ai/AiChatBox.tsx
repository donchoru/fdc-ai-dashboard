'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Bot, User, MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/lib/types';

interface AiChatBoxProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  suggestedQuestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'ETCH-001 장비의 현재 Chamber 상태를 분석해주세요',
  '현재 활성 알람의 Root Cause를 분석해주세요',
  '금일 SPC OOC 발생 현황을 요약해주세요',
  'CMP 패드 수명 예측과 교체 시기를 추천해주세요',
];

// ──────────────────────────────────────────────
// Inline markdown — same pattern as AiReportPanel
// ──────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
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
            className="my-2 overflow-x-auto rounded-lg p-3 text-xs font-mono leading-relaxed"
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

    if (line.startsWith('## ')) {
      nodes.push(
        <p key={idx} className="mb-1 mt-3 text-xs font-semibold tracking-wide" style={{ color: '#4f46e5' }}>
          {renderInline(line.slice(3), `h-${idx}`)}
        </p>
      );
      return;
    }
    if (line.startsWith('### ')) {
      nodes.push(
        <p key={idx} className="mb-1 mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
          {renderInline(line.slice(4), `h3-${idx}`)}
        </p>
      );
      return;
    }
    if (/^[•\-\*]\s/.test(line)) {
      nodes.push(
        <div key={idx} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: '#475569' }}>
          <span className="mt-[5px] h-1 w-1 flex-shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
          {renderInline(line.slice(2).trim(), `li-${idx}`)}
        </div>
      );
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.*)$/);
      if (m) {
        nodes.push(
          <div key={idx} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: '#475569' }}>
            <span
              className="mt-[2px] flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}
            >
              {m[1]}
            </span>
            {renderInline(m[2], `ol-${idx}`)}
          </div>
        );
        return;
      }
    }
    if (line.trim() === '') {
      nodes.push(<div key={idx} className="h-1.5" />);
      return;
    }
    nodes.push(
      <p key={idx} className="text-xs leading-relaxed" style={{ color: '#475569' }}>
        {renderInline(line, `p-${idx}`)}
      </p>
    );
  });
  return <>{nodes}</>;
}

// ──────────────────────────────────────────────
// Bouncing dots loader
// ──────────────────────────────────────────────
function BouncingDots() {
  return (
    <div className="flex items-end gap-1 px-1 py-0.5" aria-label="응답 생성 중">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: '#64748b',
            animation: `bounce-dot 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function AiChatBox({
  messages,
  onSend,
  isLoading,
  suggestedQuestions,
}: AiChatBoxProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = suggestedQuestions ?? DEFAULT_SUGGESTIONS;

  // Show suggestions: no messages, or last message is from assistant and not loading
  const showSuggestions =
    !isLoading &&
    (messages.filter((m) => m.role !== 'system').length === 0 ||
      (messages.length > 0 && messages[messages.length - 1].role === 'assistant'));

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div
      className="glass-card flex flex-col"
      style={{ height: '600px' }}
      role="region"
      aria-label="AI 채팅"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 p-4"
        style={{ borderBottom: '1px solid #e2e8f0' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'rgba(99,102,241,0.08)' }}
        >
          <Bot size={15} style={{ color: 'var(--accent-light)' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">FDC AI 어시스턴트</h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            설비, SPC, 알람 분석 질문
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}
          />
          <span className="text-xs" style={{ color: '#64748b' }}>온라인</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ scrollBehavior: 'smooth' }}
        aria-live="polite"
        aria-atomic={false}
      >
        {/* Empty state */}
        {visibleMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.08)' }}
            >
              <MessageSquare size={24} style={{ color: 'rgba(99,102,241,0.4)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#64748b' }}>
              무엇이든 물어보세요
            </p>
            <p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>
              설비 상태, SPC, 알람 분석 등
            </p>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-4">
          {visibleMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : '#f1f5f9',
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                }}
                aria-hidden="true"
              >
                {msg.role === 'user' ? (
                  <User size={13} className="text-white" />
                ) : (
                  <Bot size={13} style={{ color: 'var(--accent-light)' }} />
                )}
              </div>

              {/* Bubble */}
              <div
                className="max-w-[78%] rounded-2xl px-3.5 py-2.5"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.08))',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderBottomRightRadius: '4px',
                      }
                    : {
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderBottomLeftRadius: '4px',
                      }
                }
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-white">
                    {msg.content}
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex flex-row gap-2.5">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                }}
                aria-hidden="true"
              >
                <Bot size={13} style={{ color: 'var(--accent-light)' }} />
              </div>
              <div
                className="rounded-2xl px-3.5 py-2.5"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderBottomLeftRadius: '4px',
                }}
              >
                <BouncingDots />
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested questions ── */}
      {showSuggestions && (
        <div
          className="px-4 pb-2 pt-1"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          <p className="mb-2 text-xs" style={{ color: '#64748b' }}>추천 질문</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                className="rounded-lg px-2.5 py-1 text-xs transition-all"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  color: '#6366f1',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#4f46e5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6366f1';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input area ── */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid #e2e8f0' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs leading-relaxed placeholder-slate-400 focus:outline-none"
            style={{ maxHeight: '120px', minHeight: '20px', color: '#1e293b' }}
            aria-label="메시지 입력"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all"
            style={{
              background:
                input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'rgba(255,255,255,0.05)',
              color: input.trim() && !isLoading ? 'white' : '#475569',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: input.trim() && !isLoading ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
            }}
            aria-label="전송"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs" style={{ color: '#1e293b' }}>
          AI 응답은 참고용입니다. 최종 판단은 엔지니어가 확인하세요.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Zap,
  Clock,
  Code2,
  Cpu,
  BarChart3,
  Bot,
  FileText,
  CheckCircle2,
  Sparkles,
  Users,
  TrendingUp,
  Shield,
  Globe,
  ArrowRight,
} from 'lucide-react';
import GlassCard from '@/components/cards/GlassCard';

// ─── 타임라인 데이터 ──────────────────────────────────────────────────
const TIMELINE_STEPS = [
  {
    step: 1,
    user: '반도체 FDC 데이터를 시각화하고 AI가 분석 리포트를 쓰는 POC 만들어줘',
    ai: '프로젝트 구조 설계 + SEMI E164 기반 합성 데이터 모델링 + 6개 공정 파라미터 시스템 구축',
    icon: <Cpu size={16} />,
    label: '아키텍처 설계',
    color: '#6366f1',
  },
  {
    step: 2,
    user: 'SHO-Q 스타일 다크 글래스모피즘으로 디자인해줘',
    ai: '라이트 글래스모피즘 UI/UX 전체 적용 — 사이드바, 헤더, KPI 카드, 장비 그리드까지',
    icon: <Sparkles size={16} />,
    label: 'UI/UX 디자인',
    color: '#8b5cf6',
  },
  {
    step: 3,
    user: '설비 상세 페이지에서 파라미터별 Trace 차트 보여줘',
    ai: 'AR(1) 자기회귀 시계열 생성 + Recharts 기반 실시간 Trace 차트 컴포넌트 개발',
    icon: <BarChart3 size={16} />,
    label: '실시간 차트',
    color: '#0ea5e9',
  },
  {
    step: 4,
    user: 'AI가 이상 분석 리포트를 스트리밍으로 생성하게 해줘',
    ai: 'OpenAI SDK + SSE 스트리밍 통합 — 글자 단위 실시간 리포트 생성, LLM 교체 가능',
    icon: <Bot size={16} />,
    label: 'LLM 스트리밍',
    color: '#10b981',
  },
  {
    step: 5,
    user: 'SPC 관리도 페이지를 완전히 개선해줘!',
    ai: 'Cpk 히트맵 + 공정 능력 분석 + Western Electric Rules + AI 분석 리포트 통합',
    icon: <TrendingUp size={16} />,
    label: 'SPC 분석',
    color: '#f59e0b',
  },
  {
    step: 6,
    user: '한글로 메뉴 안내해줘, 리포트도 한글로!',
    ai: '전체 UI 한국어화 + AI 프롬프트 한국어 최적화 + 한국 엔지니어링 용어 적용',
    icon: <Globe size={16} />,
    label: '한국어화',
    color: '#ec4899',
  },
  {
    step: 7,
    user: '폐쇄망 Windows에서도 실행되게 해줘',
    ai: 'node_modules 포함 오프라인 ZIP 패키지 생성 + Windows bat 실행 스크립트 작성',
    icon: <Shield size={16} />,
    label: '오프라인 배포',
    color: '#64748b',
  },
];

// ─── KPI 카드 데이터 ────────────────────────────────────────────────
const KPI_CARDS = [
  {
    label: '개발 기간',
    value: '~2일',
    sub: '전통 방식 대비 4–6주',
    icon: <Clock size={22} />,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.18)',
  },
  {
    label: '코드량',
    value: '8,000줄+',
    sub: 'TypeScript / React',
    icon: <Code2 size={22} />,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.18)',
  },
  {
    label: '주요 페이지',
    value: '6개',
    sub: '개요·설비·SPC·알람·AI 리포트·채팅',
    icon: <FileText size={22} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.18)',
  },
  {
    label: 'AI 기능',
    value: '실시간',
    sub: 'SSE 스트리밍 분석 리포트',
    icon: <Bot size={22} />,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.18)',
  },
];

// ─── 기술 스택 ────────────────────────────────────────────────────
const TECH_STACK = [
  {
    name: 'Next.js 16 (React 19)',
    desc: '최신 웹 프레임워크 — SSR·App Router 지원',
    icon: <Globe size={18} />,
    color: '#6366f1',
  },
  {
    name: 'Recharts',
    desc: '산업용 차트 — Trace·SPC·도넛 차트',
    icon: <BarChart3 size={18} />,
    color: '#0ea5e9',
  },
  {
    name: 'OpenAI Compatible API',
    desc: 'LLM 엔드포인트 교체 가능 (Gemini·Ollama·vLLM)',
    icon: <Bot size={18} />,
    color: '#10b981',
  },
  {
    name: 'SSE 스트리밍',
    desc: '글자 단위 실시간 AI 리포트 생성',
    icon: <Zap size={18} />,
    color: '#f59e0b',
  },
];

// ─── 임팩트 카드 ──────────────────────────────────────────────────
const IMPACT_CARDS = [
  {
    icon: <TrendingUp size={20} />,
    title: '개발 속도 10x 향상',
    desc: '2일 만에 프로덕션급 POC 완성. 기획→구현→수정 사이클이 시간 단위로 단축.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
  },
  {
    icon: <Users size={20} />,
    title: '비전문가도 POC 제작 가능',
    desc: '복잡한 반도체 FDC 도메인 지식을 AI가 대신 구현. 아이디어만 있으면 충분.',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
  },
  {
    icon: <Bot size={20} />,
    title: '사내 AI 모델 즉시 적용',
    desc: 'LLM 엔드포인트 URL 교체만으로 Gemini·Ollama·사내 vLLM 서버로 전환 가능.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.06)',
  },
  {
    icon: <Shield size={20} />,
    title: '폐쇄망 배포 지원',
    desc: 'Windows 오프라인 ZIP 패키지 — 인터넷 없는 FAB 환경에서도 즉시 실행.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
  },
];

// ─── AI 역할 카드 ─────────────────────────────────────────────────
const AI_ROLES = [
  {
    icon: <Bot size={18} />,
    title: '자동 근본 원인 분석 (RCA)',
    desc: '이상 탐지 시 파라미터 상관관계를 AI가 즉시 분석 — 엔지니어 수동 분석 시간 단축',
    color: '#6366f1',
  },
  {
    icon: <FileText size={18} />,
    title: 'Shift / Daily 리포트 자동 작성',
    desc: '교대 근무 종료 시 설비 상태·알람·SPC 이탈 내용을 AI가 자동 정리',
    color: '#0ea5e9',
  },
  {
    icon: <MessageSquare size={18} />,
    title: '자연어 설비 상태 조회',
    desc: '"3호기 어제 이상 있었어?" — 텍스트 질문만으로 실시간 FAB 상태 확인',
    color: '#10b981',
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'SPC 이상 패턴 분석',
    desc: 'Western Electric Rules 이탈 감지 + Cpk 저하 원인을 AI가 해석·설명',
    color: '#8b5cf6',
  },
];

// ─── 타임라인 스텝 컴포넌트 ──────────────────────────────────────
function TimelineStep({
  step,
  user,
  ai,
  icon,
  label,
  color,
  isLast,
}: (typeof TIMELINE_STEPS)[0] & { isLast: boolean }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* 수직선 */}
      {!isLast && (
        <div
          className="absolute left-5 top-10 bottom-0 w-px"
          style={{ background: 'linear-gradient(to bottom, #e2e8f0 0%, transparent 100%)' }}
          aria-hidden="true"
        />
      )}

      {/* 스텝 번호 점 */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full border-2 text-white font-semibold text-sm shadow-sm"
          style={{ background: color, borderColor: color }}
          aria-hidden="true"
        >
          {step}
        </div>
      </div>

      {/* 내용 */}
      <div className="flex-1 pb-8 min-w-0">
        {/* 단계 레이블 */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${color}15`, color }}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto text-slate-400 hover:text-slate-600 transition-colors text-xs"
            aria-label={expanded ? '접기' : '펼치기'}
          >
            {expanded ? '접기' : '펼치기'}
          </button>
        </div>

        {expanded && (
          <div className="space-y-2">
            {/* 사용자 버블 (오른쪽) */}
            <div className="flex justify-end">
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                <p className="text-[11px] font-semibold opacity-70 mb-1">개발자</p>
                <p>{user}</p>
              </div>
            </div>

            {/* AI 버블 (왼쪽) */}
            <div className="flex justify-start">
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                }}
              >
                <p className="text-[11px] font-semibold mb-1" style={{ color: '#6366f1' }}>
                  Claude Code
                </p>
                <p>{ai}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────
export default function MakingPage() {
  return (
    <div className="space-y-8 pb-8">

      {/* ── 히어로 섹션 ── */}
      <div
        className="glass-card relative overflow-hidden p-8 sm:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 50%, rgba(14,165,233,0.04) 100%)',
          borderColor: 'rgba(99,102,241,0.15)',
        }}
      >
        {/* 배경 장식 */}
        <div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full opacity-8 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          {/* 배지 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#6366f1',
            }}
          >
            <Sparkles size={12} aria-hidden="true" />
            AI 페어 프로그래밍으로 제작
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
            AI와 대화로 만든
            <br />
            <span style={{ color: '#6366f1' }}>반도체 FDC 대시보드</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
            이 대시보드는 개발자가 AI 코딩 어시스턴트 <strong className="text-slate-800">Claude Code</strong>와
            자연어 대화만으로 개발했습니다. 복잡한 반도체 공정 데이터 시각화부터
            LLM 스트리밍 리포트까지 — 코드를 직접 타이핑하는 대신 <em>대화</em>로 구현했습니다.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/reports"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              AI 리포트 체험하기
              <ArrowRight size={15} aria-hidden="true" />
            </a>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100"
              style={{ color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', background: 'white' }}
            >
              <MessageSquare size={15} aria-hidden="true" />
              AI 질문하기
            </a>
          </div>
        </div>
      </div>

      {/* ── KPI 카드 ── */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="text-lg font-bold text-slate-900 mb-4">
          핵심 수치
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              className="glass-card hover-glow p-5"
              style={{ borderColor: card.border }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                style={{ background: card.bg, color: card.color }}
                aria-hidden="true"
              >
                {card.icon}
              </div>
              <p
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1"
                style={{ color: card.color }}
              >
                {card.value}
              </p>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="text-xs text-slate-400 mt-1 leading-snug">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 개발 과정 타임라인 ── */}
      <section aria-labelledby="timeline-heading">
        <GlassCard className="p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-8">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
              aria-hidden="true"
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 id="timeline-heading" className="text-lg font-bold text-slate-900">
                개발 과정 — 대화형 개발 프로세스
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                코드를 타이핑한 것이 아닙니다. 요구사항을 말했더니 AI가 구현했습니다.
              </p>
            </div>
          </div>

          <div>
            {TIMELINE_STEPS.map((step, i) => (
              <TimelineStep
                key={step.step}
                {...step}
                isLast={i === TIMELINE_STEPS.length - 1}
              />
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ── 기술 아키텍처 + 비즈니스 임팩트 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 기술 아키텍처 */}
        <section aria-labelledby="tech-heading">
          <GlassCard className="p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}
                aria-hidden="true"
              >
                <Code2 size={16} />
              </div>
              <h2 id="tech-heading" className="font-bold text-slate-900">기술 아키텍처</h2>
            </div>

            <div className="space-y-3">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50"
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5"
                    style={{ background: `${tech.color}12`, color: tech.color }}
                    aria-hidden="true"
                  >
                    {tech.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{tech.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tech.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* LLM 교체 가능 배지 */}
            <div
              className="mt-5 p-4 rounded-xl"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <p className="text-xs font-semibold text-emerald-700 mb-1.5">LLM 교체 가능 아키텍처</p>
              <div className="flex flex-wrap gap-2">
                {['Gemini 2.0 Flash', 'GPT-4o', 'Ollama (로컬)', 'vLLM (사내)'].map((llm) => (
                  <span
                    key={llm}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      color: '#059669',
                    }}
                  >
                    <CheckCircle2 size={10} aria-hidden="true" />
                    {llm}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* 비즈니스 임팩트 */}
        <section aria-labelledby="impact-heading">
          <GlassCard className="p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                aria-hidden="true"
              >
                <TrendingUp size={16} />
              </div>
              <h2 id="impact-heading" className="font-bold text-slate-900">비즈니스 임팩트</h2>
            </div>

            <div className="space-y-3">
              {IMPACT_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="p-4 rounded-xl"
                  style={{
                    background: card.bg,
                    border: `1px solid ${card.color}20`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: card.color }} aria-hidden="true">{card.icon}</span>
                    <p className="text-sm font-bold text-slate-800">{card.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pl-7">{card.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>

      {/* ── AI가 할 수 있는 것들 ── */}
      <section aria-labelledby="ai-roles-heading">
        <div className="flex items-start gap-3 mb-4">
          <div>
            <h2 id="ai-roles-heading" className="text-lg font-bold text-slate-900">
              이 대시보드에서 보여주는 AI 역할
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              단순 시각화를 넘어 — AI가 실제로 분석하고 판단합니다
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AI_ROLES.map((role) => (
            <div
              key={role.title}
              className="glass-card hover-glow p-5 flex items-start gap-4"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                style={{ background: `${role.color}10`, color: role.color }}
                aria-hidden="true"
              >
                {role.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 mb-1">{role.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section
        className="glass-card p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.04) 100%)',
          borderColor: 'rgba(99,102,241,0.15)',
        }}
        aria-label="체험 안내"
      >
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 mx-auto"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
          aria-hidden="true"
        >
          <Zap size={26} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">지금 직접 체험해 보세요</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          설정 메뉴에서 API Key를 입력하면 실제 AI 분석 리포트 생성과 자연어 질문을 사용할 수 있습니다.
          Gemini·OpenAI·사내 vLLM 모두 지원합니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/reports"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <FileText size={16} aria-hidden="true" />
            AI 리포트 생성
          </a>
          <a
            href="/spc"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:-translate-y-0.5"
            style={{
              color: '#6366f1',
              border: '1px solid rgba(99,102,241,0.25)',
              background: 'white',
            }}
          >
            <BarChart3 size={16} aria-hidden="true" />
            SPC 관리도 보기
          </a>
        </div>
      </section>

    </div>
  );
}

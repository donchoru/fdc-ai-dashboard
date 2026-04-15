'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ─── Navigation items ───────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: '개요',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/equipment',
    label: '설비',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
  },
  {
    href: '/spc',
    label: 'SPC 관리도',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/alarms',
    label: '알람',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    badge: 3,
  },
  {
    href: '/reports',
    label: 'AI 리포트',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'AI 질문',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
  {
    href: '/making',
    label: '이렇게 만들었습니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    ),
  },
] as const;

const SCENARIOS = [
  { value: 'normal', label: '정상 가동' },
  { value: 'maintenance', label: 'PM 주기' },
  { value: 'incident', label: '이상 발생' },
  { value: 'rampup', label: '램프업' },
] as const;

/* ─── Breadcrumb config ──────────────────────────────────────────────── */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

const BREADCRUMB_MAP: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ label: '개요' }],
  '/equipment': [{ label: '설비' }],
  '/spc': [{ label: 'SPC 관리도' }],
  '/alarms': [{ label: '알람' }],
  '/reports': [{ label: 'AI 리포트' }],
  '/chat': [{ label: 'AI 질문' }],
  '/making': [{ label: '이렇게 만들었습니다' }],
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Exact match
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  // Equipment detail: /equipment/EQ-001
  if (pathname.startsWith('/equipment/')) {
    const eqId = pathname.split('/')[2] ?? '';
    return [
      { label: '설비', href: '/equipment' },
      { label: eqId },
    ];
  }
  return [{ label: '페이지' }];
}

/** Should show back button? True for sub-pages (depth > 1 in any section) */
function shouldShowBack(pathname: string): boolean {
  // Equipment detail pages
  if (pathname.startsWith('/equipment/') && pathname.split('/').length > 2) return true;
  return false;
}

/** Parent path for back button */
function getBackHref(pathname: string): string {
  if (pathname.startsWith('/equipment/')) return '/equipment';
  return '/dashboard';
}

/* ─── Provider Presets ────────────────────────────────────────────────── */
const PROVIDER_PRESETS: Record<string, { baseUrl: string; model: string; placeholder: string }> = {
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    placeholder: 'AIza...',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    placeholder: 'sk-...',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    placeholder: 'sk-ant-...',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:14b',
    placeholder: '(불필요)',
  },
  custom: {
    baseUrl: '',
    model: '',
    placeholder: 'API Key',
  },
};

/* ─── Demo Mode Badge ────────────────────────────────────────────────── */
function DemoModeBadge() {
  const [isDemo, setIsDemo] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => setIsDemo(!data.configured))
      .catch(() => setIsDemo(true));
  }, []);

  if (isDemo === null || !isDemo) return null;

  return (
    <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-center gap-2">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-600 shrink-0"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-amber-700 text-xs font-medium">데모 모드</span>
      </div>
      <p className="text-amber-600 text-[10px] mt-0.5 leading-relaxed">
        AI 응답은 사전 작성된 샘플입니다.
        실제 AI를 사용하려면 설정에서 API Key를 입력하세요.
      </p>
    </div>
  );
}

/* ─── Settings Panel ─────────────────────────────────────────────────── */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState('gemini');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [configured, setConfigured] = useState(false);

  // Load current config on mount
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setBaseUrl(data.baseUrl || '');
        setModel(data.model || '');
        setTemperature(data.temperature ?? 0.3);
        setMaxTokens(data.maxTokens ?? 4096);
        setConfigured(data.configured ?? false);
        // Detect provider from baseUrl
        if (data.baseUrl?.includes('googleapis.com')) setProvider('gemini');
        else if (data.baseUrl?.includes('openai.com')) setProvider('openai');
        else if (data.baseUrl?.includes('anthropic.com')) setProvider('anthropic');
        else if (data.baseUrl?.includes('localhost:11434')) setProvider('ollama');
        else setProvider('custom');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // When provider changes, update baseUrl/model presets
  const handleProviderChange = (p: string) => {
    setProvider(p);
    const preset = PROVIDER_PRESETS[p];
    if (preset && p !== 'custom') {
      setBaseUrl(preset.baseUrl);
      setModel(preset.model);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const body: Record<string, unknown> = { baseUrl, model, temperature, maxTokens };
      if (apiKey) body.apiKey = apiKey; // only send if user typed a new key
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      const data = await res.json();
      setConfigured(data.config?.configured ?? false);
      setStatus({ type: 'success', msg: '설정이 저장되었습니다' });
      setTimeout(() => onClose(), 1200);
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="LLM Settings"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="glass-card-solid relative z-10 w-full max-w-md mx-4 p-6 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900 font-semibold text-lg">설정</h2>
            <p className="text-slate-500 text-sm mt-0.5">LLM 공급자 및 모델 설정</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="space-y-5">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${configured ? 'bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#16a34a]' : 'bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#d97706]'}`}>
              <span className={`w-2 h-2 rounded-full ${configured ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`} />
              {configured ? 'API Key 설정됨 — AI 기능 사용 가능' : 'API Key 미설정 — AI 기능을 사용하려면 키를 입력하세요'}
            </div>

            {/* LLM Provider */}
            <div>
              <label htmlFor="llm-provider" className="block text-sm font-medium text-slate-600 mb-2">
                LLM 공급자
              </label>
              <select
                id="llm-provider"
                className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="custom">사용자 정의</option>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-slate-600 mb-2">
                API Key {provider === 'ollama' && <span className="text-slate-400">(Ollama는 키 불필요)</span>}
              </label>
              <input
                id="api-key"
                type="password"
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder={preset.placeholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              {!apiKey && configured && (
                <p className="text-slate-400 text-xs mt-1">기존 키가 설정되어 있습니다. 변경하려면 새 키를 입력하세요.</p>
              )}
            </div>

            {/* Base URL */}
            <div>
              <label htmlFor="base-url" className="block text-sm font-medium text-slate-600 mb-2">
                기본 URL
              </label>
              <input
                id="base-url"
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm font-mono"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-600 mb-2">
                모델
              </label>
              <input
                id="model"
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm font-mono"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="model-name"
              />
            </div>

            {/* Temperature */}
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-slate-600 mb-2">
                온도 (Temperature)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="flex-1 accent-[#6366f1]"
                />
                <span className="text-slate-700 text-sm font-mono w-8 text-right">{temperature.toFixed(1)}</span>
              </div>
            </div>

            {/* Status */}
            {status && (
              <div className={`px-3 py-2 rounded-lg text-xs font-medium ${status.type === 'success' ? 'bg-[#22c55e]/10 text-[#16a34a] border border-[#22c55e]/20' : 'bg-[#ef4444]/10 text-[#dc2626] border border-[#ef4444]/20'}`}>
                {status.msg}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            className="px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm transition-colors"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar Nav Link ───────────────────────────────────────────────── */
function NavLink({
  href,
  label,
  icon,
  badge,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold border border-red-100">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */
function Sidebar({
  isOpen,
  onClose,
  onSettingsOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSettingsOpen: () => void;
}) {
  const pathname = usePathname();

  // Determine active segment — exact match for /dashboard, startsWith for others
  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 z-40 h-full flex flex-col',
          'bg-white border-r border-slate-200',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: 'var(--sidebar-width)' }}
        aria-label="Main navigation"
      >
        {/* Logo / Title */}
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-slate-900 font-semibold text-sm leading-none">FDC AI</p>
              <p className="text-slate-400 text-[11px] mt-1">반도체 FAB 모니터링</p>
            </div>
          </div>
        </div>

        {/* System status strip */}
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <span className="status-dot run" aria-hidden="true" />
            <span className="text-green-700 text-xs font-medium">전체 시스템 정상</span>
          </div>
        </div>

        {/* Demo mode indicator — shown when LLM API key is not set */}
        <DemoModeBadge />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard sections">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={'badge' in item ? item.badge : undefined}
              isActive={isActive(item.href)}
              onClick={onClose}
            />
          ))}

          {/* Divider */}
          <div className="pt-3 pb-1" aria-hidden="true">
            <div className="h-px bg-slate-200" />
          </div>

          {/* Settings */}
          <button
            onClick={() => { onClose(); onSettingsOpen(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-150"
            aria-label="Open settings panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
            설정
          </button>
        </nav>

        {/* Footer — version */}
        <div className="px-5 py-4 border-t border-slate-200">
          <p className="text-slate-400 text-[10px]">FDC AI 대시보드 v0.1 POC</p>
          <p className="text-slate-300 text-[10px] mt-0.5">반도체 FAB 이상탐지</p>
        </div>
      </aside>
    </>
  );
}

/* ─── Header ─────────────────────────────────────────────────────────── */
function Header({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const [now, setNow] = useState('');
  const [scenario, setScenario] = useState<string>('normal');

  // Clock — client-only to avoid hydration mismatch
  useEffect(() => {
    function update() {
      setNow(
        new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const breadcrumbs = getBreadcrumbs(pathname);
  const showBack = shouldShowBack(pathname);
  const backHref = getBackHref(pathname);

  return (
    <header
      className="sticky top-0 z-20 bg-white/80 backdrop-blur-md"
      style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}
    >
      <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Back button — sub-pages only */}
        {showBack && (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 px-2.5 py-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all text-sm font-medium"
            aria-label="뒤로가기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">뒤로</span>
          </Link>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
          {/* Root always links home */}
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
          >
            FDC AI
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 shrink-0" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              {crumb.href && i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-slate-400 hover:text-indigo-600 transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="text-slate-900 font-semibold truncate"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" aria-hidden="true" />

        {/* Scenario selector */}
        <div className="hidden sm:flex items-center gap-2">
          <label htmlFor="scenario-select" className="text-slate-500 text-xs font-medium shrink-0">
            시나리오
          </label>
          <select
            id="scenario-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="glass-input px-2.5 py-1.5 text-xs text-slate-700 pr-7 appearance-none cursor-pointer"
            style={{ backgroundImage: 'none' }}
            aria-label="모니터링 시나리오 선택"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Live indicator + clock */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200"
            aria-label="실시간 모니터링 활성"
          >
            <span className="status-dot run" aria-hidden="true" />
            <span className="text-green-700 text-[11px] font-medium">LIVE</span>
          </span>
          <time
            className="text-slate-400 text-xs font-mono tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {now}
          </time>
        </div>
      </div>
    </header>
  );
}

/* ─── Dashboard Layout ───────────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Close sidebar on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (sidebarOpen) setSidebarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, settingsOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
          tabIndex={-1}
        >
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Settings modal */}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

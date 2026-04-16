'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ─── Scenarios ──────────────────────────────────────────────────────── */
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
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (pathname.startsWith('/equipment/')) {
    const eqId = pathname.split('/')[2] ?? '';
    return [
      { label: '설비', href: '/equipment' },
      { label: eqId },
    ];
  }
  return [{ label: '페이지' }];
}

function shouldShowBack(pathname: string): boolean {
  if (pathname.startsWith('/equipment/') && pathname.split('/').length > 2) return true;
  return false;
}

function getBackHref(pathname: string): string {
  if (pathname.startsWith('/equipment/')) return '/equipment';
  return '/dashboard';
}

/* ─── Header Props ───────────────────────────────────────────────────── */
export interface HeaderProps {
  onMenuToggle: () => void;
}

/* ─── Header ─────────────────────────────────────────────────────────── */
export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [now, setNow] = useState('');

  const scenario = searchParams.get('scenario') || 'normal';

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

  const handleScenarioChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'normal') {
      params.delete('scenario');
    } else {
      params.set('scenario', value);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? '?' + query : ''}`);
  };

  const breadcrumbs = getBreadcrumbs(pathname);
  const showBack = shouldShowBack(pathname);
  const backHref = getBackHref(pathname);

  return (
    <header
      className="sticky top-0 z-20 bg-white/85 backdrop-blur-md"
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
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 font-medium"
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

        {/* Scenario segment control */}
        <div className="hidden md:block segment-control" role="radiogroup" aria-label="모니터링 시나리오">
          {SCENARIOS.map((s) => (
            <button
              key={s.value}
              role="radio"
              aria-checked={scenario === s.value}
              className={scenario === s.value ? 'segment-active' : ''}
              onClick={() => handleScenarioChange(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Mobile scenario fallback */}
        <select
          value={scenario}
          onChange={(e) => handleScenarioChange(e.target.value)}
          className="md:hidden glass-input px-2 py-1 text-xs text-slate-700 appearance-none cursor-pointer"
          aria-label="모니터링 시나리오 선택"
        >
          {SCENARIOS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="알림 3건"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Badge count */}
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
            style={{ background: '#ef4444', boxShadow: '0 0 0 2px white' }}
          >
            3
          </span>
        </button>

        {/* Live indicator chip + clock */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(16,185,129,0.08))',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
            aria-label="실시간 모니터링 활성"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#22c55e',
                boxShadow: '0 0 4px rgba(34,197,94,0.6)',
                animation: 'pulse-green 2s ease-in-out infinite',
              }}
              aria-hidden="true"
            />
            <span className="text-green-700 text-[10px] font-bold tracking-wider uppercase">Live</span>
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

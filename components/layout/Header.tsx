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
            onChange={(e) => handleScenarioChange(e.target.value)}
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
            <span className="text-green-700 text-[11px] font-medium">실시간</span>
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

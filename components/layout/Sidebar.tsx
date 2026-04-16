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

/* ─── Nav Link ───────────────────────────────────────────────────────── */
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
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-indigo-50/80 text-indigo-700 border border-indigo-100'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active accent bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #6366f1, #818cf8)' }}
          aria-hidden="true"
        />
      )}
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

/* ─── System Status Strip ─────────────────────────────────────────────── */
function SystemStatusStrip() {
  return (
    <div className="mx-4 mt-4 px-3 py-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="status-dot run" aria-hidden="true" />
        <span className="text-green-700 text-xs font-semibold">전체 시스템 정상</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-600/70">가동률</span>
          <span className="text-[10px] font-bold text-green-700">96.2%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-600/70">활성 알람</span>
          <span className="text-[10px] font-bold text-green-700">3건</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-600/70">OOS</span>
          <span className="text-[10px] font-bold text-green-700">2건</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-600/70">Cpk 평균</span>
          <span className="text-[10px] font-bold text-green-700">1.45</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar Props ──────────────────────────────────────────────────── */
export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsOpen: () => void;
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */
export default function Sidebar({ isOpen, onClose, onSettingsOpen }: SidebarProps) {
  const pathname = usePathname();

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
          'bg-white/95 backdrop-blur-sm border-r border-slate-200',
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
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
              }}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
              </svg>
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm leading-none tracking-tight">FDC AI</p>
              <p className="text-slate-400 text-[11px] mt-1 font-medium">반도체 FAB 모니터링</p>
            </div>
          </div>
        </div>

        {/* Disclaimer — virtual data notice */}
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-600">데모용 가상 데이터</span>
            <br />
            본 대시보드의 모든 데이터는 시연을 위해 생성된 가상 데이터이며, 특정 기업 · 제품 · 설비와 무관합니다.
            AI 분석은 합성 데이터를 생성형 AI에 전달하여 생성한 결과로, 실제 팹 환경의 정밀 진단을 대체할 수 없습니다. 프로덕션 적용을 위해서는 실제 장비 데이터 연동 및 분석 모델 고도화가 필요합니다.
          </p>
        </div>

        {/* System status strip with metrics */}
        <SystemStatusStrip />

        {/* Demo mode indicator */}
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

        {/* Footer — version + Powered by AI */}
        <div className="px-5 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-[10px] font-medium">FDC AI Dashboard v0.2</p>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #6366f115, #818cf810)',
                color: '#6366f1',
                border: '1px solid #6366f120',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
                <circle cx="12" cy="15" r="2" />
              </svg>
              AI Powered
            </span>
          </div>
          <p className="text-slate-300 text-[10px] mt-1">Semiconductor FDC Monitoring</p>
        </div>
      </aside>
    </>
  );
}

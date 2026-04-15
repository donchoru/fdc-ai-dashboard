'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ─── Navigation items ───────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Overview',
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
    label: 'Equipment',
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
    label: 'SPC Charts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/alarms',
    label: 'Alarms',
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
    label: 'AI Reports',
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
    label: 'Ask AI',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
] as const;

const SCENARIOS = [
  { value: 'normal', label: 'Normal Operation' },
  { value: 'maintenance', label: 'PM Cycle' },
  { value: 'incident', label: 'Incident Mode' },
  { value: 'rampup', label: 'Ramp-Up' },
] as const;

/* ─── Breadcrumb map ─────────────────────────────────────────────────── */
const BREADCRUMB_MAP: Record<string, string[]> = {
  '/dashboard': ['FDC AI', 'Overview'],
  '/equipment': ['FDC AI', 'Equipment'],
  '/spc': ['FDC AI', 'SPC Charts'],
  '/alarms': ['FDC AI', 'Alarms'],
  '/reports': ['FDC AI', 'AI Reports'],
  '/chat': ['FDC AI', 'Ask AI'],
};

/* ─── Settings Panel ─────────────────────────────────────────────────── */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="LLM Settings"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="glass-card-solid relative z-10 w-full max-w-md mx-4 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Settings</h2>
            <p className="text-[#64748b] text-sm mt-0.5">LLM provider & model configuration</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* LLM Provider */}
          <div>
            <label htmlFor="llm-provider" className="block text-sm font-medium text-[#94a3b8] mb-2">
              LLM Provider
            </label>
            <select
              id="llm-provider"
              className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
              defaultValue="openai"
            >
              <option value="openai" style={{ background: '#0f172a' }}>OpenAI (GPT-4o)</option>
              <option value="anthropic" style={{ background: '#0f172a' }}>Anthropic (Claude 3.5)</option>
              <option value="gemini" style={{ background: '#0f172a' }}>Google (Gemini 2.0 Flash)</option>
              <option value="local" style={{ background: '#0f172a' }}>Local (Ollama)</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-[#94a3b8] mb-2">
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              className="glass-input w-full px-3 py-2.5 text-sm"
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>

          {/* Anomaly Threshold */}
          <div>
            <label htmlFor="threshold" className="block text-sm font-medium text-[#94a3b8] mb-2">
              Anomaly Threshold (Z-score)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="threshold"
                type="range"
                min="1.5"
                max="4"
                step="0.1"
                defaultValue="3"
                className="flex-1 accent-[#6366f1]"
              />
              <span className="text-white text-sm font-mono w-8 text-right">3.0</span>
            </div>
          </div>

          {/* Alert Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#94a3b8]">Real-time Alerts</p>
              <p className="text-xs text-[#64748b] mt-0.5">Push notifications for critical alarms</p>
            </div>
            <button
              role="switch"
              aria-checked="true"
              className="relative w-11 h-6 bg-[#6366f1] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 focus:ring-offset-[#020617]"
            >
              <span className="absolute left-5 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#818cf8] text-white text-sm font-medium transition-colors"
            onClick={onClose}
          >
            Save Changes
          </button>
          <button
            className="px-4 py-2.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 text-sm transition-colors"
            onClick={onClose}
          >
            Cancel
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
          ? 'bg-[#6366f1]/15 text-white border border-[#6366f1]/25'
          : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/5',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={isActive ? 'text-[#818cf8]' : 'text-[#64748b]'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ef4444]/20 text-[#fca5a5] text-[10px] font-semibold border border-[#ef4444]/30">
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
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 z-40 h-full flex flex-col',
          'bg-[#020617]/95 backdrop-blur-xl border-r border-white/8',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: 'var(--sidebar-width)' }}
        aria-label="Main navigation"
      >
        {/* Logo / Title */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/30"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">FDC AI</p>
              <p className="text-[#64748b] text-[11px] mt-1">Semiconductor Dashboard</p>
            </div>
          </div>
        </div>

        {/* System status strip */}
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-[#22c55e]/8 border border-[#22c55e]/15">
          <div className="flex items-center gap-2">
            <span className="status-dot run" aria-hidden="true" />
            <span className="text-[#22c55e] text-xs font-medium">All Systems Normal</span>
          </div>
        </div>

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
            <div className="h-px bg-white/8" />
          </div>

          {/* Settings */}
          <button
            onClick={() => { onClose(); onSettingsOpen(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/5 transition-all duration-150"
            aria-label="Open settings panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748b]" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
            Settings
          </button>
        </nav>

        {/* Footer — version */}
        <div className="px-5 py-4 border-t border-white/8">
          <p className="text-[#64748b] text-[10px]">FDC AI Dashboard v0.1 POC</p>
          <p className="text-[#64748b]/60 text-[10px] mt-0.5">Semiconductor Fab Monitoring</p>
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

  const breadcrumbs = BREADCRUMB_MAP[pathname] ?? ['FDC AI', 'Page'];

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-4 sm:px-6 h-14 border-b border-white/8 bg-[#020617]/90 backdrop-blur-xl">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
        {breadcrumbs.map((segment, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#334155] shrink-0" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? 'text-white font-medium truncate'
                  : 'text-[#64748b] truncate'
              }
              aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
            >
              {segment}
            </span>
          </span>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" aria-hidden="true" />

      {/* Scenario selector */}
      <div className="hidden sm:flex items-center gap-2">
        <label htmlFor="scenario-select" className="text-[#64748b] text-xs font-medium shrink-0">
          Scenario
        </label>
        <select
          id="scenario-select"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="glass-input px-2.5 py-1.5 text-xs text-white pr-7 appearance-none cursor-pointer"
          style={{ backgroundImage: 'none' }}
          aria-label="Select monitoring scenario"
        >
          {SCENARIOS.map((s) => (
            <option key={s.value} value={s.value} style={{ background: '#0f172a' }}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Live indicator + clock */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20"
          aria-label="Live monitoring active"
        >
          <span className="status-dot run" aria-hidden="true" />
          <span className="text-[#22c55e] text-[11px] font-medium">LIVE</span>
        </span>
        <time
          className="text-[#64748b] text-xs font-mono tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {now}
        </time>
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
    <div className="flex h-screen bg-[#020617] overflow-hidden">
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

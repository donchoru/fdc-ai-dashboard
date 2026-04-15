'use client';

import { useState, useEffect } from 'react';

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

/* ─── SettingsPanel Props ─────────────────────────────────────────────── */
export interface SettingsPanelProps {
  onClose: () => void;
}

/* ─── SettingsPanel ──────────────────────────────────────────────────── */
export default function SettingsPanel({ onClose }: SettingsPanelProps) {
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
        if (data.baseUrl?.includes('googleapis.com')) setProvider('gemini');
        else if (data.baseUrl?.includes('openai.com')) setProvider('openai');
        else if (data.baseUrl?.includes('anthropic.com')) setProvider('anthropic');
        else if (data.baseUrl?.includes('localhost:11434')) setProvider('ollama');
        else setProvider('custom');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      if (apiKey) body.apiKey = apiKey;
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '저장 실패');
      }
      const data = await res.json();
      setConfigured(data.config?.configured ?? false);
      setStatus({ type: 'success', msg: '설정이 저장되었습니다' });
      setTimeout(() => onClose(), 1200);
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : '저장 실패' });
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

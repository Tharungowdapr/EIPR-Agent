'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authAPI } from '@/services/api';
import { safeError } from '@/lib/utils';
import { Cpu, Save, RefreshCw, Check, Loader2, AlertCircle, Settings2, Trash2 } from 'lucide-react';

const PROVIDERS = [
  { id: 'ollama', name: 'Ollama (Local)', free: true, needsKey: false },
  { id: 'openai', name: 'OpenAI', free: false, needsKey: true },
  { id: 'anthropic', name: 'Anthropic', free: false, needsKey: true },
  { id: 'groq', name: 'Groq', free: true, needsKey: true },
  { id: 'gemini', name: 'Google Gemini', free: true, needsKey: true },
  { id: 'mistral', name: 'Mistral AI', free: false, needsKey: true },
  { id: 'together', name: 'Together AI', free: false, needsKey: true },
  { id: 'deepseek', name: 'DeepSeek', free: false, needsKey: true },
  { id: 'cohere', name: 'Cohere', free: false, needsKey: true },
  { id: 'openrouter', name: 'OpenRouter', free: true, needsKey: true },
];

const MODEL_PLACEHOLDERS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-1.5-flash',
  cohere: 'command-r',
  openrouter: 'meta-llama/llama-3.1-8b-instruct:free',
  ollama: 'llama3.2',
};

export default function LLMSettingsPage() {
  const { user, refreshUser } = useAuthStore();
  const [provider, setProvider] = useState(user?.preferred_provider || 'ollama');
  const [model, setModel] = useState(user?.preferred_model || '');
  const [ollamaUrl, setOllamaUrl] = useState(user?.ollama_base_url || 'http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string; size: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');

  const hasKeyForCurrent = user?.providers_with_keys?.[provider];
  const isOllama = provider === 'ollama';

  useEffect(() => {
    if (user?.preferred_provider) setProvider(user.preferred_provider);
    if (user?.preferred_model) setModel(user.preferred_model);
    if (user?.ollama_base_url) setOllamaUrl(user.ollama_base_url);
  }, [user]);

  const fetchModels = useCallback(async (passApiKey?: string) => {
    setFetchingModels(true);
    setModelsError('');
    try {
      const res = await authAPI.fetchProviderModels(
        provider,
        passApiKey || undefined,
        isOllama ? ollamaUrl : undefined,
      );
      setAvailableModels(res.models || []);
      if (!res.models || res.models.length === 0) {
        setModelsError('No models returned. Check your API key or URL.');
      }
    } catch (err: any) {
      setAvailableModels([]);
      setModelsError(safeError(err, 'Failed to fetch models'));
    } finally {
      setFetchingModels(false);
    }
  }, [provider, isOllama, ollamaUrl]);

  useEffect(() => {
    if (isOllama) {
      fetchModels();
    } else if (hasKeyForCurrent) {
      fetchModels();
    }
  }, [ollamaUrl, isOllama, hasKeyForCurrent, fetchModels]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const body: any = { preferred_provider: provider };
      if (model) {
        body.preferred_model = model;
      }
      if (isOllama) {
        body.ollama_base_url = ollamaUrl;
      }
      if (apiKey) {
        body.llm_api_keys = { [provider]: apiKey };
        setApiKey('');
      }
      await authAPI.updateSettings(body);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(safeError(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await authAPI.testLLM();
      if (res.success) {
        setTestResult({ ok: true, message: `Connected! Response: ${res.response}` });
      } else {
        setTestResult({ ok: false, message: res.error || 'Connection failed' });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.response?.data?.detail || 'Could not reach the backend' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure your LLM provider for EIPR analysis and report generation
        </p>
      </div>

      <div className="space-y-6">
        {/* Provider Selection */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} className="text-brand-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">LLM Provider</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {PROVIDERS.map((p) => {
              const isSelected = provider === p.id;
              const hasKey = user?.providers_with_keys?.[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setTestResult(null); setModelsError(''); }}
                  className={`relative px-3 py-3 rounded-lg text-left transition-all text-sm ${
                    isSelected
                      ? 'bg-brand-600/20 border border-brand-500/40 text-brand-400'
                      : 'bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-light)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    {p.free && <span className="badge-success text-[10px]">Free</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {hasKey && <span className="badge text-[10px] text-emerald-400 bg-emerald-600/10">Key saved</span>}
                    {p.needsKey && !hasKey && <span className="text-[10px] text-yellow-400">No key</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Configuration */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 size={16} className="text-brand-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Model Configuration</h2>
          </div>

          {/* Model Selection */}
          <div>
            <label className="label">Model</label>
            <div className="flex gap-2">
              {availableModels.length > 0 ? (
                <select
                  className="input flex-1"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="">Select a model...</option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}{m.size ? ` (${m.size})` : ''}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input flex-1"
                  placeholder={
                    fetchingModels
                      ? 'Loading models...'
                      : `e.g. ${MODEL_PLACEHOLDERS[provider] || 'model-name'}`
                  }
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              )}
              {!isOllama && (
                <button
                  onClick={() => fetchModels(apiKey || undefined)}
                  className="btn-ghost px-3"
                  title="Fetch available models"
                  disabled={fetchingModels || (!hasKeyForCurrent && !apiKey)}
                >
                  <RefreshCw size={14} className={fetchingModels ? 'animate-spin' : ''} />
                </button>
              )}
              {isOllama && (
                <button
                  onClick={() => fetchModels()}
                  className="btn-ghost px-3"
                  title="Refresh models"
                  disabled={fetchingModels}
                >
                  <RefreshCw size={14} className={fetchingModels ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {modelsError ? (
                <span className="text-yellow-400">{modelsError}</span>
              ) : availableModels.length > 0 ? (
                `${availableModels.length} model${availableModels.length > 1 ? 's' : ''} available`
              ) : (
                `Enter a model name or fetch available models`
              )}
            </p>
          </div>

          {/* Ollama URL */}
          {isOllama && (
            <div>
              <label className="label">Ollama Base URL</label>
              <input
                type="text"
                className="input"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Default: http://localhost:11434</p>
            </div>
          )}

          {/* API Key */}
          {!isOllama && (
            <div>
              <label className="label">
                API Key
                {hasKeyForCurrent && <span className="text-emerald-400 text-xs ml-2">(saved)</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  className="input flex-1"
                  placeholder={hasKeyForCurrent ? 'Enter new key to replace existing...' : 'sk-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                {hasKeyForCurrent && (
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await authAPI.updateSettings({ llm_api_keys: { [provider]: '' } });
                        await refreshUser();
                      } catch {}
                      setSaving(false);
                    }}
                    className="btn-ghost px-3 text-red-400"
                    title="Remove saved key"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Stored encrypted. Never shared.</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-red-600/10 border border-red-600/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`card text-sm flex items-center gap-2 ${
            testResult.ok ? 'bg-emerald-600/10 border border-emerald-600/20 text-emerald-400'
              : 'bg-red-600/10 border border-red-600/20 text-red-400'
          }`}>
            {testResult.ok ? <Check size={14} /> : <AlertCircle size={14} />}
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
          <button onClick={handleTestConnection} className="btn-ghost" disabled={testing}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {provider === 'ollama' ? 'Uses Ollama API' : `Provider: ${provider}`}
            {model ? ` · Model: ${model}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

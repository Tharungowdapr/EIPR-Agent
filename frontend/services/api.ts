import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('eipr-auth-storage');
  if (!stored) return null;
  try {
    return JSON.parse(stored).state?.token || null;
  } catch { return null; }
}

function getRefreshTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('eipr-auth-storage');
  if (!stored) return null;
  try {
    return JSON.parse(stored).state?.refresh_token || null;
  } catch { return null; }
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  const excludedPaths = ['/auth/login', '/auth/register', '/auth/refresh'];
  if (excludedPaths.some(p => config.url?.includes(p))) return config;
  const token = getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = getRefreshTokenFromStorage();
      if (!refreshToken) {
        localStorage.removeItem('eipr-auth-storage');
        window.location.href = '/auth/login';
        return Promise.reject(err);
      }
      try {
        const res = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken });
        const { access_token, refresh_token } = res.data;
        const stored = localStorage.getItem('eipr-auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.state.token = access_token;
          if (refresh_token) parsed.state.refresh_token = refresh_token;
          localStorage.setItem('eipr-auth-storage', JSON.stringify(parsed));
        }
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('eipr-auth-storage');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateSettings: async (data: {
    preferred_provider?: string;
    preferred_model?: string;
    ollama_base_url?: string;
    llm_api_keys?: Record<string, string>;
  }) => {
    const res = await api.patch('/auth/settings', data);
    return res.data;
  },
  refresh: async (refresh_token: string) => {
    const res = await api.post('/auth/refresh', { refresh_token });
    return res.data;
  },
  testLLM: async () => {
    const res = await api.post('/auth/test-llm');
    return res.data;
  },
  getOllamaModels: async () => {
    const res = await api.get('/auth/ollama/models');
    return res.data;
  },
  fetchProviderModels: async (provider: string, apiKey?: string, baseUrl?: string) => {
    const res = await api.post('/auth/models', { provider, api_key: apiKey, base_url: baseUrl });
    return res.data;
  },
  updateProfile: async (data: { name?: string; email?: string }) => {
    const res = await api.patch('/auth/profile', data);
    return res.data;
  },
  changePassword: async (current_password: string, new_password: string) => {
    const res = await api.post('/auth/change-password', { current_password, new_password });
    return res.data;
  },
};

export const projectsAPI = {
  list: async () => {
    const res = await api.get('/projects');
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  create: async (title: string, domain: string, input_text: string, user_context?: string) => {
    const res = await api.post('/projects', { title, domain, input_text, user_context });
    return res.data;
  },
  updateStage: async (id: string, stage: string) => {
    const res = await api.patch(`/projects/${id}/stage`, { stage });
    return res.data;
  },
  updateOutput: async (id: string, output_type: string, data: any) => {
    const res = await api.put(`/projects/${id}/output`, { output_type, data });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};

export const agentsAPI = {
  discoverOpportunities: async (project_id: string, user_inputs?: string) => {
    const res = await api.post('/agents/discover-opportunities', { project_id, user_inputs });
    return res.data;
  },
  analyzeIP: async (project_id: string, opportunity_index: number = 0, user_inputs?: string) => {
    const res = await api.post('/agents/analyze-ip', { project_id, opportunity_index, user_inputs });
    return res.data;
  },
  generateBusinessPlan: async (project_id: string, opportunity_index: number = 0, user_inputs?: string) => {
    const res = await api.post('/agents/generate-business-plan', { project_id, opportunity_index, user_inputs });
    return res.data;
  },
  generateReport: async (project_id: string, user_inputs?: string) => {
    const res = await api.post('/agents/generate-report', { project_id, user_inputs });
    return res.data;
  },
  exportDocx: async (project_id: string) => {
    const res = await api.post(`/agents/${project_id}/export/docx`, {}, { responseType: 'blob' });
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const json = JSON.parse(text);
      throw json;
    }
    return res.data;
  },
  exportPdf: async (project_id: string) => {
    const res = await api.post(`/agents/${project_id}/export/pdf`, {}, { responseType: 'blob' });
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const json = JSON.parse(text);
      throw json;
    }
    return res.data;
  },
  exportFullPdf: async (project_id: string) => {
    const res = await api.post(`/agents/${project_id}/export/full-pdf`, {}, { responseType: 'blob' });
    if (res.data instanceof Blob && res.data.type === 'application/json') {
      const text = await res.data.text();
      const json = JSON.parse(text);
      throw json;
    }
    return res.data;
  },
  generateFinancialAnalysis: async (project_id: string, opportunity_index: number = 0) => {
    const res = await api.post('/agents/generate-financial-analysis', { project_id, opportunity_index });
    return res.data;
  },
  discoverStream: async (project_id: string, onEvent: (data: any) => void, onError?: (err: any) => void) => {
    await streamReader(`${API_URL}/api/agents/${project_id}/discover-stream`, onError, onEvent);
  },
  ipStream: async (project_id: string, opportunity_index: number, onEvent: (data: any) => void, onError?: (err: any) => void) => {
    await streamReader(`${API_URL}/api/agents/${project_id}/ip-stream?opportunity_index=${opportunity_index}`, onError, onEvent);
  },
  strategyStream: async (project_id: string, opportunity_index: number, onEvent: (data: any) => void, onError?: (err: any) => void) => {
    await streamReader(`${API_URL}/api/agents/${project_id}/strategy-stream?opportunity_index=${opportunity_index}`, onError, onEvent);
  },
  financeStream: async (project_id: string, opportunity_index: number, onEvent: (data: any) => void, onError?: (err: any) => void) => {
    await streamReader(`${API_URL}/api/agents/${project_id}/finance-stream?opportunity_index=${opportunity_index}`, onError, onEvent);
  },
  reportStream: async (project_id: string, onEvent: (data: any) => void, report_template?: string, onError?: (err: any) => void) => {
    const params = report_template ? `?report_template=${report_template}` : '';
    await streamReader(`${API_URL}/api/agents/${project_id}/report-stream${params}`, onError || ((e: any) => {}), onEvent);
  },
};

async function streamReader(url: string, onError: ((err: any) => void) | undefined, onEvent: (data: any) => void) {
  const token = getTokenFromStorage() || '';
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Stream failed' }));
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('eipr-auth-storage');
      window.location.href = '/auth/login';
    }
    onError?.(err);
    return;
  }
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch {}
      }
    }
  }
}

export const mlopsAPI = {
  getEvents: async (params?: any) => {
    const res = await api.get('/mlops/events', { params });
    return res.data;
  },
  getAgentLogs: async (params?: any) => {
    const res = await api.get('/mlops/agent-logs', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/mlops/stats');
    return res.data;
  },
};

export default api;

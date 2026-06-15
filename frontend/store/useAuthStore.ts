import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  preferred_provider?: string;
  preferred_model?: string;
  ollama_base_url?: string;
  has_api_keys?: boolean;
  providers_with_keys?: Record<string, boolean>;
}

interface AuthState {
  token: string | null;
  refresh_token: string | null;
  user: User | null;
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refresh_token: null,
      user: null,
      isAuthenticated: () => !!get().token,
      login: async (email, password) => {
        const res = await authAPI.login(email, password);
        set({ token: res.access_token, refresh_token: res.refresh_token, user: res.user });
        try {
          const me = await authAPI.getMe();
          set({ user: me });
        } catch {}
      },
      register: async (name, email, password) => {
        await authAPI.register(name, email, password);
        const res = await authAPI.login(email, password);
        set({ token: res.access_token, refresh_token: res.refresh_token, user: res.user });
        try {
          const me = await authAPI.getMe();
          set({ user: me });
        } catch {}
      },
      logout: () => {
        set({ token: null, refresh_token: null, user: null });
      },
      refreshUser: async () => {
        try {
          const me = await authAPI.getMe();
          set({ user: me });
        } catch {}
      },
    }),
    {
      name: 'eipr-auth-storage',
      partialize: (state) => {
        const safeUser = state.user
          ? { id: state.user.id, email: state.user.email, name: state.user.name,
              preferred_provider: state.user.preferred_provider,
              preferred_model: state.user.preferred_model,
              ollama_base_url: state.user.ollama_base_url }
          : null;
        return { token: state.token, refresh_token: state.refresh_token, user: safeUser };
      },
    }
  )
);

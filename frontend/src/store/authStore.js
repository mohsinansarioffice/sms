import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../lib/axios';
import { getAccessToken, setSessionTokens } from '../lib/sessionTokens';
import { clearAllAuth, logoutOnServer } from '../lib/authRefresh';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/register', data);
          const session = response.data;
          const { accessToken, refreshToken, user } = session;

          setSessionTokens(accessToken, refreshToken);
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
          });
          return { success: false, error: error.message };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/login', { email, password });
          const session = response.data;
          const { accessToken, refreshToken, user } = session;

          setSessionTokens(accessToken, refreshToken);
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
          });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        await logoutOnServer();
        await clearAllAuth();
      },

      fetchUser: async () => {
        const token = getAccessToken();
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await axios.get('/auth/me');
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          await clearAllAuth();
          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const access = state.accessToken ?? state.token;
        if (access) {
          setSessionTokens(access, state.refreshToken ?? undefined);
        }
      },
    }
  )
);

export default useAuthStore;

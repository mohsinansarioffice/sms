import { useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import { refreshSessionTokens } from '../../lib/authRefresh';
import { getRefreshToken } from '../../lib/sessionTokens';

const IDLE_MS = Number(import.meta.env.VITE_IDLE_SESSION_MS) || 30 * 60 * 1000;
const REFRESH_MS = Number(import.meta.env.VITE_SESSION_REFRESH_MS) || 10 * 60 * 1000;
const IDLE_CHECK_MS = 60 * 1000;

export default function SessionManager() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const bump = () => {
      lastActivity.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const onVisibility = () => {
      if (document.visibilityState === 'visible') bump();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const id = setInterval(() => {
      if (Date.now() - lastActivity.current > IDLE_MS) {
        void (async () => {
          await logout();
          window.location.href = '/login';
        })();
      }
    }, IDLE_CHECK_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivity.current > IDLE_MS) return;
      if (!getRefreshToken()) return;
      void refreshSessionTokens().catch(() => {
        /* next API call or 401 handler will recover or logout */
      });
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  return null;
}

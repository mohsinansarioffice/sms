import axios from 'axios';
import {
  getRefreshToken,
  setSessionTokens,
  clearSessionTokens,
} from './sessionTokens';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let refreshPromise = null;

/**
 * Full client sign-out: storage + zustand. Used for 401 / token errors (async import avoids axios ↔ authStore cycle).
 */
export async function clearAllAuth() {
  clearSessionTokens();
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('user');
  const { default: useAuthStore } = await import('../store/authStore');
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
}


export async function refreshSessionTokens() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const rt = getRefreshToken();
      if (!rt) throw new Error('No refresh token');
      const res = await axios.post(
        `${baseURL}/auth/refresh`,
        { refreshToken: rt },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { accessToken, refreshToken } = res.data.data;
      setSessionTokens(accessToken, refreshToken);
      const { default: useAuthStore } = await import('../store/authStore');
      useAuthStore.setState({ accessToken, refreshToken });
      return { accessToken, refreshToken };
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function logoutOnServer() {
  const rt = getRefreshToken();
  if (!rt) return;
  try {
    await axios.post(
      `${baseURL}/auth/logout`,
      { refreshToken: rt },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    /* still clear client */
  }
}

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

/** Prefer access token; migrate legacy `token` key once. */
export function getAccessToken() {
  let access = localStorage.getItem(ACCESS_KEY);
  if (!access) {
    const legacy = localStorage.getItem('token');
    if (legacy) {
      localStorage.setItem(ACCESS_KEY, legacy);
      localStorage.removeItem('token');
      access = legacy;
    }
  }
  return access;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setSessionTokens(accessToken, refreshToken) {
  if (accessToken != null) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken != null) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSessionTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('token');
}
